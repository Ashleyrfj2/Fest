import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  BROWSER_EXPORT_OWNERSHIP_MARKER,
  BROWSER_BUILD_ID,
  BROWSER_CONTROLLED_ROUTE,
  BROWSER_HEALTH_PATH,
  BROWSER_SCENARIO_ID,
  BROWSER_SCHEMA_VERSION,
  BROWSER_SERVICE_NAME,
  assertBrowserDiskSpace,
  assertBrowserPortAvailable,
  browserBaseURL,
  computeBrowserArtifactId,
  isPortAvailable,
  markBrowserExportDirectoryOwned,
  parseBrowserPort,
  startBrowserExportServer,
  validateExplicitBrowserExportDirectory,
} from '../scripts/lib/browser-runtime.mjs';
import { CommandCancelledError, runOwnedCommand } from '../scripts/lib/owned-command.mjs';
import {
  parseSupabaseStatusEnvironment,
  resolveVerifiedLocalSupabaseEnvironment,
} from '../scripts/lib/local-supabase-env.mjs';
import {
  assertCanonicalResetPolicy,
  canonicalRestorationResult,
} from '../scripts/lib/browser-workflow-state.mjs';
import {
  REQUIRED_NPM_VERSION,
  evaluatePinnedToolchain,
} from '../scripts/lib/workspace-toolchain.mjs';

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

test('toolchain enforcement rejects a mocked wrong npm version', () => {
  const exact = evaluatePinnedToolchain({
    requiredNode: '22.21.0',
    actualNode: '22.21.0',
    packageManager: `npm@${REQUIRED_NPM_VERSION}`,
    npmResult: { status: 0, stdout: `${REQUIRED_NPM_VERSION}\n` },
  });
  assert.deepEqual(exact.failures, []);

  const wrongNpm = evaluatePinnedToolchain({
    requiredNode: '22.21.0',
    actualNode: '22.21.0',
    packageManager: `npm@${REQUIRED_NPM_VERSION}`,
    npmResult: { status: 0, stdout: '0.0.0\n' },
  });
  assert.deepEqual(wrongNpm.failures, [
    `npm ${REQUIRED_NPM_VERSION} is required; current npm is 0.0.0.`,
  ]);
});

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
  const controller = await startBrowserExportServer({ port, buildId: 'untrusted-build' });
  try {
    const preparing = await fetch(`${browserBaseURL(port)}${BROWSER_HEALTH_PATH}`);
    assert.equal(preparing.status, 503);
    const preparingIdentity = await preparing.json();
    assert.deepEqual(preparingIdentity, {
      schemaVersion: BROWSER_SCHEMA_VERSION,
      service: BROWSER_SERVICE_NAME,
      status: 'preparing',
      buildId: BROWSER_BUILD_ID,
      scenarioId: BROWSER_SCENARIO_ID,
      controlledRoute: BROWSER_CONTROLLED_ROUTE,
    });
    assert.equal(Object.hasOwn(preparingIdentity, 'artifactId'), false);

    const artifactId = computeBrowserArtifactId(exportRoot);
    assert.throws(() => controller.markReady(exportRoot), /artifactId/);
    assert.throws(
      () => controller.markReady(exportRoot, `sha256:${'0'.repeat(64)}`),
      /does not match/
    );
    controller.markReady(exportRoot, artifactId);
    const health = await fetch(`${browserBaseURL(port)}${BROWSER_HEALTH_PATH}`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      schemaVersion: BROWSER_SCHEMA_VERSION,
      service: BROWSER_SERVICE_NAME,
      status: 'ready',
      buildId: BROWSER_BUILD_ID,
      scenarioId: BROWSER_SCENARIO_ID,
      controlledRoute: BROWSER_CONTROLLED_ROUTE,
      artifactId,
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


test('local Supabase status parsing pins the browser environment without exposing keys', () => {
  const statusOutput = [
    'API_URL="http://127.0.0.1:54321"',
    'ANON_KEY="local-anon-key"',
    'IGNORED_VALUE="not-used"',
  ].join('\n');
  assert.deepEqual(parseSupabaseStatusEnvironment(statusOutput), {
    API_URL: 'http://127.0.0.1:54321',
    ANON_KEY: 'local-anon-key',
    IGNORED_VALUE: 'not-used',
  });

  const verified = resolveVerifiedLocalSupabaseEnvironment(statusOutput, {
    EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'local-anon-key',
  });
  assert.equal(verified.apiUrl, 'http://127.0.0.1:54321');
  assert.equal(verified.anonKey, 'local-anon-key');
  assert.deepEqual(verified.publicEnvironment, {
    EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'local-anon-key',
  });

  for (const invalidStatus of [
    'API_URL="https://example.supabase.co"\nANON_KEY="local-anon-key"',
    'API_URL="http://127.0.0.1:54322"\nANON_KEY="local-anon-key"',
    'API_URL="http://127.0.0.1:54321"',
  ]) {
    assert.throws(() => resolveVerifiedLocalSupabaseEnvironment(invalidStatus, {}));
  }

  assert.throws(
    () =>
      resolveVerifiedLocalSupabaseEnvironment(statusOutput, {
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      }),
    /Ambient EXPO_PUBLIC_SUPABASE_URL/
  );
  assert.throws(
    () =>
      resolveVerifiedLocalSupabaseEnvironment(statusOutput, {
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'different-secret',
      }),
    (error) =>
      /Ambient EXPO_PUBLIC_SUPABASE_ANON_KEY/.test(error.message) &&
      !error.message.includes('local-anon-key') &&
      !error.message.includes('different-secret')
  );
});


test('canonical restoration reporting is fail-closed and the skip switch is rejected', () => {
  assert.throws(
    () => assertCanonicalResetPolicy({ FESTNEST_SKIP_FINAL_RESET: 'false' }),
    /no longer supported/
  );
  assert.doesNotThrow(() => assertCanonicalResetPolicy({}));

  assert.deepEqual(
    canonicalRestorationResult({
      mutatedDemo: true,
      finalRestorationVerified: true,
      interrupted: false,
      portReleased: true,
      finalResetFailed: false,
    }),
    { required: true, restored: true, reason: null }
  );
  assert.deepEqual(
    canonicalRestorationResult({
      mutatedDemo: true,
      finalRestorationVerified: false,
      interrupted: false,
      portReleased: false,
      finalResetFailed: false,
    }),
    {
      required: true,
      restored: false,
      reason: 'the Festival browser port did not release',
    }
  );
  assert.equal(
    canonicalRestorationResult({
      mutatedDemo: true,
      finalRestorationVerified: false,
      interrupted: true,
      portReleased: true,
      finalResetFailed: false,
    }).restored,
    false
  );
  assert.match(
    canonicalRestorationResult({
      mutatedDemo: true,
      finalRestorationVerified: false,
      interrupted: false,
      portReleased: true,
      finalResetFailed: true,
    }).reason,
    /reset or seed verification failed/
  );
});

test('explicit browser export directories must be dedicated and owned', () => {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'festnest-browser-export-guard-'));
  const projectRoot = path.join(fixtureRoot, 'festnest-browser-export-project');
  const homeDir = path.join(fixtureRoot, 'festnest-browser-export-home');
  const tempDir = path.join(fixtureRoot, 'festnest-browser-export-temp');
  const safeTarget = path.join(fixtureRoot, 'festnest-browser-export-safe');
  mkdirSync(projectRoot);
  mkdirSync(homeDir);
  mkdirSync(tempDir);

  const validate = (targetPath) =>
    validateExplicitBrowserExportDirectory({ targetPath, projectRoot, homeDir, tempDir });

  try {
    assert.equal(validate(safeTarget), safeTarget);
    mkdirSync(safeTarget);
    assert.equal(validate(safeTarget), safeTarget);

    writeFileSync(path.join(safeTarget, 'unrelated.txt'), 'do not clear');
    assert.throws(() => validate(safeTarget), /nonempty/);
    rmSync(path.join(safeTarget, 'unrelated.txt'));

    markBrowserExportDirectoryOwned(safeTarget);
    writeFileSync(path.join(safeTarget, 'index.html'), '<h1>owned export</h1>');
    assert.equal(validate(safeTarget), safeTarget);
    assert.ok(BROWSER_EXPORT_OWNERSHIP_MARKER.startsWith('.festnest-browser-export'));

    for (const rejectedTarget of [
      path.parse(fixtureRoot).root,
      homeDir,
      tempDir,
      projectRoot,
      fixtureRoot,
      path.join(projectRoot, 'festnest-browser-export-inside'),
      path.join(fixtureRoot, 'unrelated-output'),
    ]) {
      assert.throws(() => validate(rejectedTarget));
    }
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('ready export roots are validated and missing roots fail closed', async () => {
  const exportRoot = mkdtempSync(path.join(os.tmpdir(), 'festnest-browser-ready-root-'));
  writeFileSync(path.join(exportRoot, 'index.html'), '<h1>ready</h1>');

  const reservation = createServer();
  const port = await listen(reservation);
  await close(reservation);
  const controller = await startBrowserExportServer({ port });
  try {
    assert.throws(
      () => controller.markReady(path.join(exportRoot, 'missing'), computeBrowserArtifactId(exportRoot)),
      /existing directory/
    );
    const artifactId = computeBrowserArtifactId(exportRoot);
    controller.markReady(exportRoot, artifactId);
    assert.equal((await fetch(browserBaseURL(port))).status, 200);

    writeFileSync(path.join(exportRoot, 'index.html'), '<h1>changed after ready</h1>');
    assert.equal((await fetch(browserBaseURL(port) + BROWSER_HEALTH_PATH)).status, 503);
    writeFileSync(path.join(exportRoot, 'index.html'), '<h1>ready</h1>');
    assert.equal((await fetch(browserBaseURL(port) + BROWSER_HEALTH_PATH)).status, 200);

    rmSync(exportRoot, { recursive: true });
    const health = await fetch(browserBaseURL(port) + BROWSER_HEALTH_PATH);
    assert.equal(health.status, 503);
    assert.equal((await fetch(browserBaseURL(port))).status, 503);
  } finally {
    await controller.close();
    rmSync(exportRoot, { recursive: true, force: true });
  }
  assert.equal(await isPortAvailable(port), true);
});

test('controlled route fails closed when artifact content changes after health succeeds', async () => {
  const exportRoot = mkdtempSync(path.join(os.tmpdir(), 'festnest-browser-toctou-'));
  const dynamicRoot = path.join(exportRoot, 'trips', '[id]');
  mkdirSync(dynamicRoot, { recursive: true });
  writeFileSync(path.join(exportRoot, 'index.html'), '<h1>FestNest</h1>');
  writeFileSync(path.join(dynamicRoot, 'camp-grid.html'), '<h1>Camp Grid</h1>');
  writeFileSync(path.join(exportRoot, 'app.js'), 'console.log("original");');

  const reservation = createServer();
  const port = await listen(reservation);
  await close(reservation);
  const artifactId = computeBrowserArtifactId(exportRoot);
  const controller = await startBrowserExportServer({ port, rootDir: exportRoot, artifactId });
  try {
    const health = await fetch(browserBaseURL(port) + BROWSER_HEALTH_PATH);
    assert.equal(health.status, 200);

    writeFileSync(path.join(exportRoot, 'app.js'), 'console.log("mutated");');
    const route = await fetch(browserBaseURL(port) + BROWSER_CONTROLLED_ROUTE);
    assert.equal(route.status, 503);
    assert.match(await route.text(), /unavailable/);
  } finally {
    await controller.close();
    rmSync(exportRoot, { recursive: true, force: true });
  }
  assert.equal(await isPortAvailable(port), true);
});

test('browser artifact digest is deterministic and changes with file content or path', () => {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'festnest-browser-artifact-'));
  const firstRoot = path.join(fixtureRoot, 'first');
  const secondRoot = path.join(fixtureRoot, 'second');
  for (const root of [firstRoot, secondRoot]) {
    mkdirSync(path.join(root, 'assets'), { recursive: true });
    writeFileSync(path.join(root, 'index.html'), '<h1>FestNest</h1>');
    writeFileSync(path.join(root, 'assets', 'app.js'), 'console.log("stable");');
  }

  try {
    const firstArtifactId = computeBrowserArtifactId(firstRoot);
    assert.match(firstArtifactId, /^sha256:[a-f0-9]{64}$/);
    assert.equal(firstArtifactId, computeBrowserArtifactId(firstRoot));
    assert.equal(firstArtifactId, computeBrowserArtifactId(secondRoot));

    writeFileSync(path.join(secondRoot, 'assets', 'app.js'), 'console.log("changed");');
    assert.notEqual(firstArtifactId, computeBrowserArtifactId(secondRoot));

    writeFileSync(path.join(secondRoot, 'assets', 'app.js'), 'console.log("stable");');
    renameSync(path.join(secondRoot, 'assets', 'app.js'), path.join(secondRoot, 'assets', 'renamed.js'));
    assert.notEqual(firstArtifactId, computeBrowserArtifactId(secondRoot));
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('owned child commands time out, cancel promptly, and do not expose captured output', async () => {
  await assert.rejects(
    runOwnedCommand({
      command: process.execPath,
      args: ['-e', 'setInterval(() => {}, 1000)'],
      label: 'timeout fixture',
      timeoutMs: 30,
      killGraceMs: 20,
      killWaitMs: 500,
    }),
    /timed out/
  );

  const abortController = new AbortController();
  const cancelled = runOwnedCommand({
    command: process.execPath,
    args: ['-e', 'setInterval(() => {}, 1000)'],
    label: 'cancel fixture',
    timeoutMs: 2_000,
    abortSignal: abortController.signal,
    killGraceMs: 20,
    killWaitMs: 500,
  });
  globalThis.setTimeout(() => abortController.abort(), 30);
  await assert.rejects(cancelled, (error) => error instanceof CommandCancelledError);

  await assert.rejects(
    runOwnedCommand({
      command: process.execPath,
      args: ['-e', "process.stderr.write('sensitive-output'); process.exit(2)"],
      label: 'redacted fixture',
      timeoutMs: 2_000,
      captureOutput: true,
    }),
    (error) => /redacted fixture failed/.test(error.message) && !error.message.includes('sensitive-output')
  );
});
