#!/usr/bin/env node

import { appendFileSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import process from 'node:process';

const REQUIRED_BUILD = 'festnest-demo-001';
const CANOPY_ID = '10000000-0000-4000-8000-000000000101';
const buildId = process.env.FESTNEST_DEMO_BUILD_ID;
if (buildId !== REQUIRED_BUILD) throw new Error(`FESTNEST_DEMO_BUILD_ID must be ${REQUIRED_BUILD}`);

const listenPort = Number(process.env.FESTNEST_STALE_PROXY_PORT || 54331);
const targetHost = '127.0.0.1';
const targetPort = Number(process.env.FESTNEST_STALE_PROXY_TARGET_PORT || 54321);
const eventLog = process.env.FESTNEST_STALE_PROXY_LOG || '/tmp/festnest-stale-proxy-events.jsonl';
let cachedSupplyResponse = null;
let suppressNextSupplyRead = false;

function record(type) {
  appendFileSync(eventLog, `${JSON.stringify({ type, build_id: buildId, occurred_at: new Date().toISOString() })}\n`);
}

function isSupplyRead(req) {
  return req.method === 'GET' && req.url?.startsWith('/rest/v1/supply_items');
}

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const requestBody = Buffer.concat(chunks);
    const isCanopyPack = req.method === 'PATCH' && req.url?.startsWith('/rest/v1/supply_items') &&
      req.url.includes(encodeURIComponent(CANOPY_ID)) && requestBody.toString('utf8').includes('"status":"packed"');

    if (isSupplyRead(req) && suppressNextSupplyRead && cachedSupplyResponse) {
      suppressNextSupplyRead = false;
      record('stale_response_served');
      res.writeHead(cachedSupplyResponse.statusCode, cachedSupplyResponse.headers);
      res.end(cachedSupplyResponse.body);
      return;
    }

    const headers = { ...req.headers, host: `${targetHost}:${targetPort}` };
    const upstream = http.request({ host: targetHost, port: targetPort, method: req.method, path: req.url, headers }, (upstreamResponse) => {
      const responseChunks = [];
      upstreamResponse.on('data', (chunk) => responseChunks.push(chunk));
      upstreamResponse.on('end', () => {
        const body = Buffer.concat(responseChunks);
        if (isSupplyRead(req) && upstreamResponse.statusCode && upstreamResponse.statusCode < 300) {
          cachedSupplyResponse = { statusCode: upstreamResponse.statusCode, headers: upstreamResponse.headers, body };
        }
        if (isCanopyPack && upstreamResponse.statusCode && upstreamResponse.statusCode < 300) {
          suppressNextSupplyRead = true;
          record('stale_condition_activated');
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
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n');
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
    record('proxy_stopped');
    server.close(() => process.exit(0));
  });
}
