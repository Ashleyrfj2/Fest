#!/usr/bin/env node

import { appendFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REQUIRED_BUILD = 'festnest-demo-001';
const TRIP_ID = '10000000-0000-4000-8000-000000000001';
const CANOPY_ID = '10000000-0000-4000-8000-000000000101';
const buildId = process.env.FESTNEST_DEMO_BUILD_ID;
if (buildId !== REQUIRED_BUILD) throw new Error(`FESTNEST_DEMO_BUILD_ID must be ${REQUIRED_BUILD}`);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const manifestPath = process.env.FESTNEST_DEMO_MANIFEST || path.join(repoRoot, 'demo/.generated/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const editorUserId = manifest.users?.['editor-a']?.id;
if (!editorUserId) throw new Error('Demo manifest does not contain editor-a');

const listenPort = Number(process.env.FESTNEST_STALE_PROXY_PORT || 54331);
const targetHost = '127.0.0.1';
const targetPort = Number(process.env.FESTNEST_STALE_PROXY_TARGET_PORT || 54321);
const eventLog = process.env.FESTNEST_STALE_PROXY_LOG || '/tmp/festnest-stale-proxy-events.jsonl';
const ttlMs = Number(process.env.FESTNEST_STALE_PROXY_TTL_MS || 30_000);
let cachedSupplyResponse = null;
let armedCondition = null;

function digest(value) { return createHash('sha256').update(value).digest('hex').slice(0, 16); }

function record(type, detail = {}) {
  appendFileSync(eventLog, `${JSON.stringify({ type, build_id: buildId, actor: 'editor-a', ...detail, occurred_at: new Date().toISOString() })}\n`);
}

function jwtIdentity(req) {
  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!claims.sub || !claims.session_id) return null;
    // Claims remain routing selectors only. Binding the cache to the opaque
    // credential prevents a forged token with copied claims from receiving a
    // cached response before Supabase authenticates it upstream.
    return {
      userId: claims.sub,
      sessionId: claims.session_id,
      credentialDigest: createHash('sha256').update(token).digest('hex'),
    };
  } catch { return null; }
}

function canonicalQuery(req) {
  const url = new URL(req.url || '/', 'http://proxy.local');
  const entries = [...url.searchParams.entries()].sort(([aKey, aValue], [bKey, bValue]) =>
    aKey.localeCompare(bKey) || aValue.localeCompare(bValue));
  return `${url.pathname}?${new URLSearchParams(entries).toString()}`;
}

function isExactSupplyRead(req) {
  if (req.method !== 'GET') return false;
  const url = new URL(req.url || '/', 'http://proxy.local');
  return url.pathname === '/rest/v1/supply_items' && url.searchParams.get('trip_id') === `eq.${TRIP_ID}` &&
    url.searchParams.has('select') && url.searchParams.has('order');
}

function selector(req) {
  const identity = jwtIdentity(req);
  if (!identity || identity.userId !== editorUserId || !isExactSupplyRead(req)) return null;
  const query = canonicalQuery(req);
  return {
    key: `${identity.userId}|${identity.sessionId}|${identity.credentialDigest}|${query}`,
    sessionId: identity.sessionId,
    query,
    credentialDigest: identity.credentialDigest,
  };
}

function isCanopyPack(req, body) {
  if (req.method !== 'POST') return false;
  const identity = jwtIdentity(req);
  if (!identity || identity.userId !== editorUserId) return false;
  const url = new URL(req.url || '/', 'http://proxy.local');
  if (url.pathname !== '/rest/v1/rpc/transition_supply_item') return false;
  try {
    const parsed = JSON.parse(body.toString('utf8'));
    return parsed.p_item_id === CANOPY_ID && parsed.p_transition === 'pack';
  } catch { return false; }
}

function transitionApplied(body) {
  try {
    const parsed = JSON.parse(body.toString('utf8'));
    const result = Array.isArray(parsed) ? parsed[0] : parsed;
    return result?.applied === true;
  } catch { return false; }
}

function deactivate(reason, selectorValue = armedCondition?.selector) {
  if (!armedCondition) return;
  record('stale_condition_deactivated', {
    reason, session_selector: selectorValue ? digest(selectorValue.sessionId) : undefined,
    query_selector: selectorValue ? digest(selectorValue.query) : undefined, trip_id: TRIP_ID, item_id: CANOPY_ID,
  });
  armedCondition = null;
}

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const requestBody = Buffer.concat(chunks);
    const currentSelector = selector(req);
    if (armedCondition && Date.now() >= armedCondition.expiresAt) deactivate('expired');
    if (currentSelector && armedCondition?.key === currentSelector.key && cachedSupplyResponse?.key === currentSelector.key) {
      const response = cachedSupplyResponse;
      deactivate('delivered', currentSelector); // Mark consumed before writing the response.
      record('stale_response_served', { session_selector: digest(currentSelector.sessionId), query_selector: digest(currentSelector.query), trip_id: TRIP_ID, item_id: CANOPY_ID });
      res.writeHead(response.statusCode, response.headers);
      res.end(response.body);
      return;
    }

    const headers = { ...req.headers, host: `${targetHost}:${targetPort}` };
    const upstream = http.request({ host: targetHost, port: targetPort, method: req.method, path: req.url, headers }, (upstreamResponse) => {
      const responseChunks = [];
      upstreamResponse.on('data', (chunk) => responseChunks.push(chunk));
      upstreamResponse.on('end', () => {
        const body = Buffer.concat(responseChunks);
        if (currentSelector && upstreamResponse.statusCode && upstreamResponse.statusCode < 300 && !armedCondition) {
          cachedSupplyResponse = {
            key: currentSelector.key,
            selector: currentSelector,
            statusCode: upstreamResponse.statusCode,
            headers: upstreamResponse.headers,
            body,
          };
        }
        if (isCanopyPack(req, requestBody) && upstreamResponse.statusCode && upstreamResponse.statusCode < 300 &&
          transitionApplied(body) && cachedSupplyResponse) {
          const identity = jwtIdentity(req);
          const cachedSelector = cachedSupplyResponse.selector;
          if (identity && cachedSelector &&
            cachedSelector.credentialDigest === identity.credentialDigest &&
            cachedSelector.sessionId === identity.sessionId) {
            armedCondition = { key: cachedSupplyResponse.key, selector: cachedSelector, expiresAt: Date.now() + ttlMs };
            record('stale_condition_activated', { session_selector: digest(identity.sessionId), query_selector: digest(cachedSelector.query), trip_id: TRIP_ID, item_id: CANOPY_ID, expires_in_ms: ttlMs });
          }
        }
        res.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
        res.end(body);
      });
    });
    upstream.on('error', (error) => {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    });
    if (requestBody.length) upstream.write(requestBody);
    upstream.end();
  });
});

server.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(targetPort, targetHost, () => {
    const requestLine = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    const headers = Object.entries({ ...req.headers, host: `${targetHost}:${targetPort}` })
      .map(([key, value]) => `${key}: ${value}`).join('\r\n');
    upstream.write(`${requestLine}${headers}\r\n\r\n`);
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on('error', () => socket.destroy());
});

server.listen(listenPort, '127.0.0.1', () => {
  record('proxy_started');
  console.log(`Festival stale-response proxy listening on http://127.0.0.1:${listenPort}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    deactivate('shutdown');
    record('proxy_stopped');
    server.close(() => process.exit(0));
  });
}
