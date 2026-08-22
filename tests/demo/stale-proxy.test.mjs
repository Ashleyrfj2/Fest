import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';

const CANOPY_ID = '10000000-0000-4000-8000-000000000101';

test('stale proxy returns one cached supply response after the packed transition', async (context) => {
  let status = 'claimed';
  const upstream = http.createServer((request, response) => {
    const body = [];
    request.on('data', (chunk) => body.push(chunk));
    request.on('end', () => {
      if (request.method === 'PATCH') {
        status = JSON.parse(Buffer.concat(body).toString('utf8')).status;
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify([{ id: CANOPY_ID, status }]));
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify([{ id: CANOPY_ID, status }]));
    });
  });
  upstream.listen(55421, '127.0.0.1');
  await once(upstream, 'listening');

  const proxy = spawn(process.execPath, ['scripts/demo/stale-proxy.mjs'], {
    env: {
      ...process.env,
      FESTNEST_DEMO_BUILD_ID: 'festnest-demo-001',
      FESTNEST_STALE_PROXY_PORT: '55431',
      FESTNEST_STALE_PROXY_TARGET_PORT: '55421',
      FESTNEST_STALE_PROXY_LOG: '/tmp/festnest-stale-proxy-test.jsonl',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    proxy.stdout.once('data', resolve);
    proxy.once('error', reject);
    proxy.once('exit', (code) => reject(new Error(`proxy exited early with ${code}`)));
  });
  context.after(() => { proxy.kill('SIGTERM'); upstream.close(); });

  const url = `http://127.0.0.1:55431/rest/v1/supply_items?id=eq.${CANOPY_ID}`;
  assert.equal((await fetch(url).then((response) => response.json()))[0].status, 'claimed');
  await fetch(url, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'packed' }) });
  assert.equal((await fetch(url).then((response) => response.json()))[0].status, 'claimed');
  assert.equal((await fetch(url).then((response) => response.json()))[0].status, 'packed');
});
