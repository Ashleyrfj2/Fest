#!/usr/bin/env node

import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  assertBrowserDiskSpace,
  browserBaseURL,
  parseBrowserPort,
  startBrowserExportServer,
} from './lib/browser-runtime.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const require = createRequire(import.meta.url);
const expoCli = require.resolve('expo/bin/cli');
const explicitOutputDir = process.env.FESTNEST_BROWSER_EXPORT_DIR;
const port = parseBrowserPort();

let activeChild;
let controller;
let outputDir;
let shuttingDown = false;

function waitForExit(child, timeoutMs) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timeout = globalThis.setTimeout(() => resolve(false), timeoutMs);
    timeout.unref();
    child.once('exit', () => {
      globalThis.clearTimeout(timeout);
      resolve(true);
    });
  });
}

async function stopOwnedChild() {
  const child = activeChild;
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  if (!(await waitForExit(child, 5000)) && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await waitForExit(child, 2000);
  }
}

function removeGeneratedOutput() {
  if (outputDir && !explicitOutputDir) rmSync(outputDir, { recursive: true, force: true });
}

async function cleanup() {
  await stopOwnedChild();
  const closePromise = controller?.close();
  removeGeneratedOutput();
  await closePromise;
}

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  const child = activeChild;
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    const killTimer = globalThis.setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }, 3000);
    killTimer.unref();
    child.once('exit', () => {
      globalThis.clearTimeout(killTimer);
      removeGeneratedOutput();
      controller?.server.closeAllConnections?.();
      controller?.server.close();
    });
  }
  controller?.server.closeAllConnections?.();
  controller?.server.close();
  removeGeneratedOutput();
  process.exitCode = exitCode;
}

process.once('SIGINT', () => shutdown(130));
process.once('SIGTERM', () => shutdown(143));

function runExpoExport(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [expoCli, ...args], {
      cwd: projectRoot,
      stdio: 'inherit',
      ...options,
    });
    activeChild = child;
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (activeChild === child) activeChild = undefined;
      if (code === 0) resolve();
      else reject(new Error(`Expo export exited with ${code ?? signal}`));
    });
  });
}

const exportEnvironment = {
  ...process.env,
  EXPO_NO_DOTENV: 'true',
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  EXPO_PUBLIC_SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'festnest-browser-fixture-anon-key',
};
delete exportEnvironment.SUPABASE_SERVICE_ROLE_KEY;

try {
  assertBrowserDiskSpace({ projectRoot });
  controller = await startBrowserExportServer({ port });
  console.log(`Reserved ${browserBaseURL(port)} while the FestNest browser export is preparing.`);

  outputDir = explicitOutputDir
    ? path.resolve(explicitOutputDir)
    : mkdtempSync(path.join(os.tmpdir(), 'festnest-browser-export-'));
  await runExpoExport(
    ['export', '--clear', '--platform', 'web', '--output-dir', outputDir],
    { env: exportEnvironment }
  );
  if (shuttingDown) throw new Error('FestNest browser export was interrupted');
  controller.markReady(outputDir);
  console.log(`FestNest browser export ready at ${browserBaseURL(port)}`);

  await new Promise((resolve, reject) => {
    controller.server.once('close', resolve);
    controller.server.once('error', reject);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (!shuttingDown) {
    shuttingDown = true;
    try {
      await cleanup();
    } catch (error) {
      console.error(`Browser workflow cleanup failed: ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    }
  }
}
