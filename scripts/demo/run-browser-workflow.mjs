#!/usr/bin/env node

import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  assertBrowserDiskSpace,
  assertBrowserPortAvailable,
  isPortAvailable,
  parseBrowserPort,
} from '../lib/browser-runtime.mjs';
import { CommandCancelledError, runOwnedCommand } from '../lib/owned-command.mjs';
import { resolveVerifiedLocalSupabaseEnvironment } from '../lib/local-supabase-env.mjs';
import {
  assertCanonicalResetPolicy,
  canonicalRestorationResult,
} from '../lib/browser-workflow-state.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '../..');
const args = process.argv.slice(2);
const abortController = new AbortController();
let receivedSignal;

function getArg(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function positiveTimeout(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1 || value > 900_000) {
    throw new Error(`${name} must be an integer from 1 to 900000`);
  }
  return value;
}

const runs = Number(getArg('--runs', '3'));
if (!Number.isInteger(runs) || runs < 1 || runs > 20) {
  throw new Error(`--runs must be an integer from 1 to 20; received ${JSON.stringify(getArg('--runs', '3'))}`);
}
assertCanonicalResetPolicy(process.env);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    receivedSignal = signal;
    abortController.abort();
  });
}

function cancellationError(label) {
  return new CommandCancelledError(`${label} was cancelled`);
}

async function delay(ms, signal, label) {
  if (signal.aborted) throw cancellationError(label);
  await new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      globalThis.clearTimeout(timer);
      reject(cancellationError(label));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function waitForPortRelease(port, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortAvailable(port)) return;
    await delay(100, abortController.signal, 'browser port-release wait');
  }
  throw new Error(`Festival browser port ${port} remained occupied after the browser run ended`);
}

async function resetDemo(label, env) {
  await runOwnedCommand({
    command: 'bash',
    args: ['scripts/demo/reset-demo.sh'],
    cwd: projectRoot,
    env,
    label,
    timeoutMs: positiveTimeout('FESTNEST_DEMO_RESET_TIMEOUT_MS', 180_000),
    abortSignal: abortController.signal,
  });
}

const port = parseBrowserPort();
assertBrowserDiskSpace({ projectRoot });
let workflowError;
let mutatedDemo = false;
let portReleased = true;
let finalRestorationVerified = false;
let finalResetFailed = false;
let browserEnvironment;

try {
  await runOwnedCommand({
    command: process.execPath,
    args: ['scripts/check-workspace.mjs'],
    cwd: projectRoot,
    label: 'workspace compatibility check',
    timeoutMs: positiveTimeout('FESTNEST_WORKSPACE_CHECK_TIMEOUT_MS', 60_000),
    abortSignal: abortController.signal,
  });

  const statusResult = await runOwnedCommand({
    command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
    args: ['--no-install', 'supabase', 'status', '-o', 'env'],
    cwd: projectRoot,
    label: 'local Supabase status',
    timeoutMs: positiveTimeout('FESTNEST_SUPABASE_STATUS_TIMEOUT_MS', 30_000),
    abortSignal: abortController.signal,
    captureOutput: true,
  });
  const verifiedSupabase = resolveVerifiedLocalSupabaseEnvironment(statusResult.stdout, process.env);
  browserEnvironment = { ...process.env, ...verifiedSupabase.publicEnvironment };

  const playwrightCli = createRequire(import.meta.url).resolve('@playwright/test/cli');
  for (let runNumber = 1; runNumber <= runs; runNumber += 1) {
    if (abortController.signal.aborted) throw cancellationError('browser workflow');
    console.log(`\n=== Festival browser workflow run ${runNumber} of ${runs} ===`);
    await assertBrowserPortAvailable(port);
    mutatedDemo = true;
    await resetDemo(`demo reset before run ${runNumber}`, browserEnvironment);
    portReleased = false;
    try {
      await runOwnedCommand({
        command: process.execPath,
        args: [
          playwrightCli,
          'test',
          '--config',
          'playwright.live-demo.config.ts',
          '--output',
          `test-results/repeat-run-${runNumber}`,
        ],
        cwd: projectRoot,
        env: browserEnvironment,
        label: `browser run ${runNumber}`,
        timeoutMs: positiveTimeout('FESTNEST_BROWSER_RUN_TIMEOUT_MS', 300_000),
        abortSignal: abortController.signal,
      });
    } finally {
      if (abortController.signal.aborted) {
        portReleased = await isPortAvailable(port).catch(() => false);
      } else {
        await waitForPortRelease(port);
        portReleased = true;
      }
    }
  }
} catch (error) {
  workflowError = error;
} finally {
  if (mutatedDemo && !abortController.signal.aborted && portReleased) {
    try {
      await resetDemo('final canonical demo reset', browserEnvironment);
      finalRestorationVerified = true;
    } catch (error) {
      workflowError ||= error;
      finalResetFailed = true;
    }
  }
}

const restoration = canonicalRestorationResult({
  mutatedDemo,
  finalRestorationVerified,
  interrupted: Boolean(receivedSignal),
  portReleased,
  finalResetFailed,
});
if (restoration.required && !restoration.restored) {
  console.error(`Festival browser workflow did not restore canonical demo state: ${restoration.reason}.`);
}

if (receivedSignal) {
  process.exitCode = receivedSignal === 'SIGINT' ? 130 : 143;
} else if (workflowError) {
  throw workflowError;
} else if (restoration.required && !restoration.restored) {
  throw new Error('Festival browser workflow ended without verified canonical restoration');
} else {
  console.log(
    `Festival browser workflow passed ${runs} consecutive run${runs === 1 ? '' : 's'} and verified canonical demo restoration.`
  );
}
