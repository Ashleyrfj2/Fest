#!/usr/bin/env node

import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  assertBrowserDiskSpace,
  browserBaseURL,
  markBrowserExportDirectoryOwned,
  parseBrowserPort,
  startBrowserExportServer,
  validateExplicitBrowserExportDirectory,
} from './lib/browser-runtime.mjs';
import { runOwnedCommand } from './lib/owned-command.mjs';
import { resolveVerifiedLocalSupabaseEnvironment } from './lib/local-supabase-env.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const require = createRequire(import.meta.url);
const expoCli = require.resolve('expo/bin/cli');
const explicitOutputDir = process.env.FESTNEST_BROWSER_EXPORT_DIR;
const port = parseBrowserPort();
const abortController = new AbortController();

let controller;
let outputDir;
let exportReady = false;
let receivedSignalExitCode;

function positiveTimeout(rawValue, fallback, name) {
  const value = Number(rawValue || fallback);
  if (!Number.isInteger(value) || value < 1 || value > 600_000) {
    throw new Error(`${name} must be an integer from 1 to 600000`);
  }
  return value;
}

function removeGeneratedOutput() {
  if (outputDir && !explicitOutputDir) rmSync(outputDir, { recursive: true, force: true });
}

async function cleanup() {
  await controller?.close();
  removeGeneratedOutput();
}

function handleSignal(exitCode) {
  if (receivedSignalExitCode !== undefined) return;
  receivedSignalExitCode = exitCode;
  abortController.abort();
  if (exportReady) {
    void controller?.close().catch((error) => {
      console.error(`Browser export shutdown failed: ${error instanceof Error ? error.message : error}`);
    });
  }
}

process.once('SIGINT', () => handleSignal(130));
process.once('SIGTERM', () => handleSignal(143));

try {
  assertBrowserDiskSpace({ projectRoot });

  const statusResult = await runOwnedCommand({
    command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
    args: ['--no-install', 'supabase', 'status', '-o', 'env'],
    cwd: projectRoot,
    label: 'local Supabase status',
    timeoutMs: 30_000,
    abortSignal: abortController.signal,
    captureOutput: true,
  });
  const ambientSupabaseEnvironment = {
    ...process.env,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  };
  const verifiedSupabase = resolveVerifiedLocalSupabaseEnvironment(
    statusResult.stdout,
    ambientSupabaseEnvironment
  );

  outputDir = explicitOutputDir
    ? validateExplicitBrowserExportDirectory({
        targetPath: explicitOutputDir,
        projectRoot,
      })
    : mkdtempSync(path.join(os.tmpdir(), 'festnest-browser-export-'));

  controller = await startBrowserExportServer({ port });
  console.log(`Reserved ${browserBaseURL(port)} while the FestNest browser export is preparing.`);

  const exportEnvironment = {
    ...process.env,
    ...verifiedSupabase.publicEnvironment,
    EXPO_NO_DOTENV: 'true',
  };
  delete exportEnvironment.SUPABASE_SERVICE_ROLE_KEY;
  for (const secretName of ['SERVICE_ROLE_KEY', 'DB_URL', 'JWT_SECRET']) {
    delete exportEnvironment[secretName];
  }

  await runOwnedCommand({
    command: process.execPath,
    args: [expoCli, 'export', '--clear', '--platform', 'web', '--output-dir', outputDir],
    cwd: projectRoot,
    env: exportEnvironment,
    label: 'Expo browser export',
    timeoutMs: positiveTimeout(
      process.env.FESTNEST_BROWSER_EXPORT_TIMEOUT_MS,
      170_000,
      'FESTNEST_BROWSER_EXPORT_TIMEOUT_MS'
    ),
    abortSignal: abortController.signal,
  });

  if (abortController.signal.aborted) throw new Error('FestNest browser export was interrupted');
  markBrowserExportDirectoryOwned(outputDir);
  controller.markReady(outputDir);
  exportReady = true;
  console.log(`FestNest browser export ready at ${browserBaseURL(port)}`);

  await new Promise((resolve, reject) => {
    controller.server.once('close', resolve);
    controller.server.once('error', reject);
  });
} catch (error) {
  if (receivedSignalExitCode === undefined) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
} finally {
  abortController.abort();
  try {
    await cleanup();
  } catch (error) {
    console.error(`Browser workflow cleanup failed: ${error instanceof Error ? error.message : error}`);
    if (receivedSignalExitCode === undefined) process.exitCode = 1;
  }
  if (receivedSignalExitCode !== undefined) process.exitCode = receivedSignalExitCode;
}
