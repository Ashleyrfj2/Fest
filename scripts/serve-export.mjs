#!/usr/bin/env node

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const rootDir = path.resolve(getArg('--dir', '.'));
const port = Number(getArg('--port', '4173'));

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function safeRelativePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes('\0')) {
    return null;
  }

  const relative = decoded.replace(/^\/+/, '');
  const normalized = path.posix.normalize(relative || 'index.html');
  if (normalized === '..' || normalized.startsWith('../')) {
    return null;
  }

  return normalized;
}

function candidateFiles(relativePath) {
  const candidates = [relativePath];
  const withoutTrailingSlash = relativePath.replace(/\/$/, '');

  if (!path.extname(relativePath)) {
    candidates.push(`${withoutTrailingSlash}.html`);
    candidates.push(path.posix.join(withoutTrailingSlash, 'index.html'));
  }

  const segments = withoutTrailingSlash.split('/');
  if (segments[0] === 'trips' && segments.length >= 2) {
    const modulePath = segments.slice(2).join('/');
    candidates.push(`trips/[id]${modulePath ? `/${modulePath}` : ''}.html`);
  }
  if (segments[0] === 'join' && segments.length === 2) {
    candidates.push('join/[code].html');
  }

  return candidates;
}

function resolveFile(pathname) {
  const relativePath = safeRelativePath(pathname);
  if (!relativePath) return null;

  for (const candidate of candidateFiles(relativePath)) {
    const filePath = path.resolve(rootDir, candidate);
    if (!filePath.startsWith(`${rootDir}${path.sep}`) && filePath !== rootDir) {
      continue;
    }
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      return filePath;
    }
  }

  return null;
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
  const filePath = resolveFile(requestUrl.pathname);

  if (!filePath) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const extension = path.extname(filePath);
  const headers = { 'content-type': contentTypes[extension] || 'application/octet-stream' };
  if (request.method === 'HEAD') {
    response.writeHead(200, headers);
    response.end();
    return;
  }

  response.writeHead(200, headers);
  createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`FestNest browser server listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
