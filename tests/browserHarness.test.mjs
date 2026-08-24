import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  BROWSER_HEALTH_PATH,
  BROWSER_SERVICE_NAME,
  assertBrowserDiskSpace,
  assertBrowserPortAvailable,
  browserBaseURL,
  isPortAvailable,
  parseBrowserPort,
  startBrowserExportServer,
} from '../scripts/lib/browser-runtime.mjs';

async function listen(server, port = 0) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen({ host: '127.0.0.1', port }, resolve);
  });
  return server.address().port;
}

async function close(server) {
  if (!server.listening) return;
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

test('browser port validation rejects invalid values', () => {
  for (const value of ['0', '65536', 'abc', '4.5']) {
    assert.throws(() => parseBrowserPort(value), /integer from 1 to 65535/);
  }
  assert.equal(parseBrowserPort('4173'), 4173);
});

test('occupied-port preflight never stops an unknown listener', async () => {
  const foreignServer = createServer((_request, response) => response.end('foreign server'));
  const port = await listen(foreignServer);
  try {
    await assert.rejects(assertBrowserPortAvailable(port), /did not stop it/);
    assert.equal(await (await fetch(browserBaseURL(port))).text(), 'foreign server');
    assert.equal(foreignServer.listening, true);
  } finally {
    await close(foreignServer);
  }
});

test('export server reports preparing, then serves identity and dynamic routes', async () => {
  const exportRoot = mkdtempSync(path.join(os.tmpdir(), 'festnest-browser-harness-'));
  mkdirSync(path.join(exportRoot, 'trips/[id]'), { recursive: true });
  writeFileSync(path.join(exportRoot, 'index.html'), '<h1>FestNest</h1>');
  writeFileSync(path.join(exportRoot, 'trips/[id]/camp-grid.html'), '<h1>Camp Grid</h1>');

  const reservation = createServer();
  const port = await listen(reservation);
  await close(reservation);
  const controller = await startBrowserExportServer({ port, buildId: 'test-build' });
  try {
    const preparing = await fetch(`${browserBaseURL(port)}${BROWSER_HEALTH_PATH}`);
    assert.equal(preparing.status, 503);
    assert.equal((await preparing.json()).status, 'preparing');

    controller.markReady(exportRoot);
    const health = await fetch(`${browserBaseURL(port)}${BROWSER_HEALTH_PATH}`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      schemaVersion: 1,
      service: BROWSER_SERVICE_NAME,
      status: 'ready',
      buildId: 'test-build',
    });
    const route = await fetch(`${browserBaseURL(port)}/trips/10000000-0000-4000-8000-000000000001/camp-grid`);
    assert.equal(route.status, 200);
    assert.match(await route.text(), /Camp Grid/);

    const malformed = await fetch(`${browserBaseURL(port)}/%E0%A4%A`);
    assert.equal(malformed.status, 404);
    const stillHealthy = await fetch(`${browserBaseURL(port)}${BROWSER_HEALTH_PATH}`);
    assert.equal(stillHealthy.status, 200);

    const outsideFile = path.join(path.dirname(exportRoot), `${path.basename(exportRoot)}-outside.txt`);
    writeFileSync(outsideFile, 'must remain private');
    symlinkSync(outsideFile, path.join(exportRoot, 'outside.txt'));
    const escaped = await fetch(`${browserBaseURL(port)}/outside.txt`);
    assert.equal(escaped.status, 404);
    rmSync(outsideFile, { force: true });
  } finally {
    await controller.close();
    rmSync(exportRoot, { recursive: true, force: true });
  }
  assert.equal(await isPortAvailable(port), true);
});

test('server bind race fails clearly and leaves the existing listener alive', async () => {
  const foreignServer = createServer((_request, response) => response.end('still running'));
  const port = await listen(foreignServer);
  try {
    await assert.rejects(startBrowserExportServer({ port }), /became occupied/);
    assert.equal(await (await fetch(browserBaseURL(port))).text(), 'still running');
  } finally {
    await close(foreignServer);
  }
});

test('server shutdown is bounded even with an active connection', async () => {
  const reservation = createServer();
  const port = await listen(reservation);
  await close(reservation);
  const controller = await startBrowserExportServer({ port });
  const socket = connect(port, '127.0.0.1');
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('error', reject);
  });
  socket.write('GET / HTTP/1.1\r\nHost: localhost\r\n');
  const startedAt = Date.now();
  await controller.close(100);
  assert.ok(Date.now() - startedAt < 1000);
  socket.destroy();
  assert.equal(await isPortAvailable(port), true);
});

test('disk-space preflight is enforceable and supports an explicit zero threshold', () => {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), 'festnest-disk-check-'));
  try {
    assert.doesNotThrow(() => assertBrowserDiskSpace({ projectRoot, minimumBytes: 0 }));
    assert.throws(
      () => assertBrowserDiskSpace({ projectRoot, minimumBytes: Number.MAX_SAFE_INTEGER }),
      /Browser workflow requires at least/
    );
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});
