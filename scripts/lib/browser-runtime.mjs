import { createReadStream, existsSync, realpathSync, statSync, statfsSync } from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { URL } from 'node:url';

export const BROWSER_HOST = '127.0.0.1';
export const DEFAULT_BROWSER_PORT = 4173;
export const BROWSER_HEALTH_PATH = '/__festnest/browser-health';
export const BROWSER_SERVICE_NAME = 'festnest-browser-export';
export const DEFAULT_MIN_FREE_BYTES = 2 * 1024 * 1024 * 1024;

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

export function parseBrowserPort(rawPort = process.env.FESTNEST_BROWSER_PORT || DEFAULT_BROWSER_PORT) {
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`FESTNEST_BROWSER_PORT must be an integer from 1 to 65535; received ${JSON.stringify(rawPort)}`);
  }
  return port;
}

export function browserBaseURL(port = parseBrowserPort()) {
  return `http://${BROWSER_HOST}:${port}`;
}

export async function isPortAvailable(port = parseBrowserPort()) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.once('error', (error) => {
      if (error && error.code === 'EADDRINUSE') resolve(false);
      else reject(error);
    });
    probe.listen({ host: BROWSER_HOST, port, exclusive: true }, () => {
      probe.close((error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  });
}

async function identifyListener(port) {
  try {
    const response = await fetch(`${browserBaseURL(port)}${BROWSER_HEALTH_PATH}`, {
      redirect: 'manual',
      signal: globalThis.AbortSignal.timeout(750),
    });
    const body = await response.json();
    return body?.service === BROWSER_SERVICE_NAME ? 'a FestNest browser export' : 'an unrecognized service';
  } catch {
    return 'an unrecognized service';
  }
}

export async function assertBrowserPortAvailable(port = parseBrowserPort()) {
  if (await isPortAvailable(port)) return;

  const listener = await identifyListener(port);
  const error = new Error(
    [
      `Festival browser port ${port} is already used by ${listener}.`,
      'The workflow did not stop it because the listener may belong to another app or terminal.',
      `macOS/Linux inspection: lsof -nP -iTCP:${port} -sTCP:LISTEN`,
      `PowerShell inspection: Get-NetTCPConnection -LocalPort ${port} -State Listen`,
      'Stop the owning terminal or verified process, then rerun the workflow.',
    ].join('\n')
  );
  error.code = 'EADDRINUSE';
  throw error;
}

function availableBytes(targetPath) {
  const stats = statfsSync(targetPath);
  return Number(stats.bavail) * Number(stats.bsize);
}

function formatGiB(bytes) {
  return `${(bytes / (1024 ** 3)).toFixed(1)} GiB`;
}

export function assertBrowserDiskSpace({
  projectRoot,
  minimumBytes = Number(process.env.FESTNEST_BROWSER_MIN_FREE_BYTES || DEFAULT_MIN_FREE_BYTES),
} = {}) {
  if (!projectRoot) throw new Error('projectRoot is required for the browser disk-space check');
  if (!Number.isFinite(minimumBytes) || minimumBytes < 0) {
    throw new Error('FESTNEST_BROWSER_MIN_FREE_BYTES must be a non-negative number');
  }

  const configuredExportDir = process.env.FESTNEST_BROWSER_EXPORT_DIR;
  const exportDiskTarget = configuredExportDir
    ? findExistingParent(path.resolve(configuredExportDir))
    : path.resolve(os.tmpdir());
  const targets = [...new Set([path.resolve(projectRoot), exportDiskTarget])];
  const lowTargets = targets
    .map((targetPath) => ({ targetPath, bytes: availableBytes(targetPath) }))
    .filter(({ bytes }) => bytes < minimumBytes);

  if (lowTargets.length === 0) return;
  const details = lowTargets.map(({ targetPath, bytes }) => `- ${targetPath}: ${formatGiB(bytes)} free`).join('\n');
  throw new Error(
    [
      `Browser workflow requires at least ${formatGiB(minimumBytes)} free for export and failure artifacts.`,
      details,
      'Free storage or set FESTNEST_BROWSER_MIN_FREE_BYTES deliberately for a constrained environment.',
    ].join('\n')
  );
}

function findExistingParent(targetPath) {
  let candidate = targetPath;
  while (!existsSync(candidate)) {
    const parent = path.dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }
  return candidate;
}

function safeRelativePath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const relative = decoded.replace(/^\/+/, '');
  const normalized = path.posix.normalize(relative || 'index.html');
  if (normalized === '..' || normalized.startsWith('../')) return null;
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
  if (segments[0] === 'join' && segments.length === 2) candidates.push('join/[code].html');
  return candidates;
}

function resolveFile(rootDir, pathname) {
  const relativePath = safeRelativePath(pathname);
  if (!relativePath) return null;
  const realRoot = realpathSync(rootDir);
  for (const candidate of candidateFiles(relativePath)) {
    const filePath = path.resolve(rootDir, candidate);
    if (!filePath.startsWith(`${rootDir}${path.sep}`) && filePath !== rootDir) continue;
    if (!existsSync(filePath) || !statSync(filePath).isFile()) continue;
    const realFile = realpathSync(filePath);
    if (!realFile.startsWith(`${realRoot}${path.sep}`) && realFile !== realRoot) continue;
    return realFile;
  }
  return null;
}

export async function startBrowserExportServer({
  port = parseBrowserPort(),
  rootDir = null,
  buildId = process.env.FESTNEST_DEMO_BUILD_ID || 'festnest-demo-001',
} = {}) {
  let activeRoot = rootDir ? path.resolve(rootDir) : null;
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', browserBaseURL(port));
    if (requestUrl.pathname === BROWSER_HEALTH_PATH) {
      const ready = Boolean(activeRoot);
      response.writeHead(ready ? 200 : 503, { 'content-type': 'application/json; charset=utf-8' });
      response.end(`${JSON.stringify({
        schemaVersion: 1,
        service: BROWSER_SERVICE_NAME,
        status: ready ? 'ready' : 'preparing',
        buildId,
      })}\n`);
      return;
    }
    if (!activeRoot) {
      response.writeHead(503, { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '1' });
      response.end('FestNest browser export is preparing.\n');
      return;
    }
    const filePath = resolveFile(activeRoot, requestUrl.pathname);
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
    const stream = createReadStream(filePath);
    stream.once('error', () => {
      if (!response.headersSent) response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Failed to read export file.\n');
    });
    stream.pipe(response);
  });

  await new Promise((resolve, reject) => {
    const onError = (error) => {
      if (error?.code === 'EADDRINUSE') {
        error.message = `Festival browser port ${port} became occupied before the export server could start`;
      }
      reject(error);
    };
    server.once('error', onError);
    server.listen({ host: BROWSER_HOST, port, exclusive: true }, () => {
      server.off('error', onError);
      resolve();
    });
  });

  return {
    port,
    server,
    markReady(nextRootDir) {
      activeRoot = path.resolve(nextRootDir);
    },
    async close(timeoutMs = 4000) {
      if (!server.listening) return;
      let timeout;
      const closed = new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeIdleConnections?.();
      });
      const timedOut = new Promise((resolve) => {
        timeout = globalThis.setTimeout(() => {
          server.closeAllConnections?.();
          resolve();
        }, timeoutMs);
        timeout.unref?.();
      });
      await Promise.race([closed, timedOut]);
      globalThis.clearTimeout(timeout);
    },
  };
}
