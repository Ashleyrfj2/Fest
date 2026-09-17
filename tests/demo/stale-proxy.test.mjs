import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { test } from 'node:test';

const TRIP_ID = '10000000-0000-4000-8000-000000000001';
const CANOPY_ID = '10000000-0000-4000-8000-000000000101';
const EDITOR_ID = '20000000-0000-4000-8000-000000000001';
const VIEWER_ID = '20000000-0000-4000-8000-000000000002';

function token(sub, sessionId, signature = 'signature') {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none' })}.${encode({ sub, session_id: sessionId })}.${signature}`;
}

function headers(jwt, extra = {}) { return { authorization: `Bearer ${jwt}`, ...extra }; }

test('stale proxy isolates one cached response to the arming editor session and exact query', async (context) => {
  let status = 'claimed';
  const upstream = http.createServer((request, response) => {
    const body = [];
    request.on('data', (chunk) => body.push(chunk));
    request.on('end', () => {
      if (request.method === 'POST') {
        const transition = JSON.parse(Buffer.concat(body).toString('utf8'));
        if (transition.force_denied) {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ applied: false, audit_id: 'audit-denied', reason_code: 'stale_state' }));
          return;
        }
        if (transition.p_transition === 'pack') status = 'packed';
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ applied: true, audit_id: 'audit-1', reason_code: 'applied' }));
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify([{ id: CANOPY_ID, status }]));
    });
  });
  upstream.listen(55421, '127.0.0.1');
  await once(upstream, 'listening');

  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'festnest-stale-test-'));
  const manifest = path.join(tempDir, 'manifest.json');
  const log = path.join(tempDir, 'proxy.jsonl');
  writeFileSync(manifest, JSON.stringify({ users: { 'editor-a': { id: EDITOR_ID } } }));
  const proxy = spawn(process.execPath, ['scripts/demo/stale-proxy.mjs'], {
    env: {
      ...process.env, FESTNEST_DEMO_BUILD_ID: 'festnest-demo-001', FESTNEST_STALE_PROXY_PORT: '55431',
      FESTNEST_STALE_PROXY_TARGET_PORT: '55421', FESTNEST_STALE_PROXY_LOG: log,
      FESTNEST_DEMO_MANIFEST: manifest, FESTNEST_STALE_PROXY_TTL_MS: '5000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    proxy.stdout.once('data', resolve);
    proxy.once('error', reject);
    proxy.once('exit', (code) => reject(new Error(`proxy exited early with ${code}`)));
  });
  context.after(() => { proxy.kill('SIGTERM'); upstream.close(); });

  const query = `http://127.0.0.1:55431/rest/v1/supply_items?trip_id=eq.${TRIP_ID}&select=id%2Cstatus&order=name.asc`;
  const unrelated = `http://127.0.0.1:55431/rest/v1/supply_items?trip_id=eq.${TRIP_ID}&select=id%2Cstatus&order=category.asc`;
  const transition = 'http://127.0.0.1:55431/rest/v1/rpc/transition_supply_item';
  const editorA = token(EDITOR_ID, 'editor-session-a');
  const forgedEditorA = token(EDITOR_ID, 'editor-session-a', 'forged-signature');
  const editorOther = token(EDITOR_ID, 'editor-session-other');
  const viewer = token(VIEWER_ID, 'viewer-session');

  assert.equal((await fetch(query, { headers: headers(editorA) }).then((response) => response.json()))[0].status, 'claimed');
  await fetch(transition, { method: 'POST', headers: headers(editorA, { 'content-type': 'application/json' }), body: JSON.stringify({ p_item_id: CANOPY_ID, p_transition: 'pack', force_denied: true }) });
  assert.equal((await fetch(query, { headers: headers(editorA) }).then((response) => response.json()))[0].status, 'claimed');
  await fetch(transition, { method: 'POST', headers: headers(editorA, { 'content-type': 'application/json' }), body: JSON.stringify({ p_item_id: CANOPY_ID, p_transition: 'pack' }) });

  assert.equal((await fetch(query, { headers: headers(forgedEditorA) }).then((response) => response.json()))[0].status, 'packed');
  assert.equal((await fetch(query, { headers: headers(viewer) }).then((response) => response.json()))[0].status, 'packed');
  assert.equal((await fetch(unrelated, { headers: headers(editorA) }).then((response) => response.json()))[0].status, 'packed');
  assert.equal((await fetch(query, { headers: headers(editorOther) }).then((response) => response.json()))[0].status, 'packed');
  const concurrent = await Promise.all([
    fetch(query, { headers: headers(editorA) }).then((response) => response.json()),
    fetch(query, { headers: headers(editorA) }).then((response) => response.json()),
  ]);
  assert.deepEqual(concurrent.map((result) => result[0].status).sort(), ['claimed', 'packed']);
  assert.equal((await fetch(query, { headers: headers(editorA) }).then((response) => response.json()))[0].status, 'packed');

  const records = readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(records.filter((record) => record.type === 'stale_response_served').length, 1);
  assert.equal(records.filter((record) => record.type === 'stale_condition_deactivated' && record.reason === 'delivered').length, 1);
  assert.ok(records.every((record) => !JSON.stringify(record).includes(editorA)));
  assert.ok(records.every((record) => !('headers' in record) && !('body' in record)));
});

test('armed stale response expires and fails open', async (context) => {
  let status = 'claimed';
  const upstream = http.createServer((request, response) => {
    const body = [];
    request.on('data', (chunk) => body.push(chunk));
    request.on('end', () => {
      if (request.method === 'POST') {
        status = 'packed';
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ applied: true, audit_id: 'audit-expiry', reason_code: 'applied' }));
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify([{ id: CANOPY_ID, status }]));
    });
  });
  upstream.listen(55422, '127.0.0.1');
  await once(upstream, 'listening');

  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'festnest-stale-expiry-'));
  const manifest = path.join(tempDir, 'manifest.json');
  const log = path.join(tempDir, 'proxy.jsonl');
  writeFileSync(manifest, JSON.stringify({ users: { 'editor-a': { id: EDITOR_ID } } }));
  const proxy = spawn(process.execPath, ['scripts/demo/stale-proxy.mjs'], {
    env: {
      ...process.env, FESTNEST_DEMO_BUILD_ID: 'festnest-demo-001', FESTNEST_STALE_PROXY_PORT: '55432',
      FESTNEST_STALE_PROXY_TARGET_PORT: '55422', FESTNEST_STALE_PROXY_LOG: log,
      FESTNEST_DEMO_MANIFEST: manifest, FESTNEST_STALE_PROXY_TTL_MS: '20',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    proxy.stdout.once('data', resolve);
    proxy.once('error', reject);
    proxy.once('exit', (code) => reject(new Error(`proxy exited early with ${code}`)));
  });
  context.after(() => { proxy.kill('SIGTERM'); upstream.close(); });

  const query = `http://127.0.0.1:55432/rest/v1/supply_items?trip_id=eq.${TRIP_ID}&select=id%2Cstatus&order=name.asc`;
  const transition = 'http://127.0.0.1:55432/rest/v1/rpc/transition_supply_item';
  const editor = token(EDITOR_ID, 'expiry-session');
  await fetch(query, { headers: headers(editor) });
  await fetch(transition, { method: 'POST', headers: headers(editor, { 'content-type': 'application/json' }), body: JSON.stringify({ p_item_id: CANOPY_ID, p_transition: 'pack' }) });
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.equal((await fetch(query, { headers: headers(editor) }).then((response) => response.json()))[0].status, 'packed');

  const records = readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(records.filter((record) => record.type === 'stale_response_served').length, 0);
  assert.equal(records.filter((record) => record.type === 'stale_condition_deactivated' && record.reason === 'expired').length, 1);
});
