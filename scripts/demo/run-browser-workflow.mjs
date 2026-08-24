#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  assertBrowserDiskSpace,
  assertBrowserPortAvailable,
  isPortAvailable,
  parseBrowserPort,
} from '../lib/browser-runtime.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '../..');
const args = process.argv.slice(2);
let activeChild;
let receivedSignal;

function getArg(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const runs = Number(getArg('--runs', '3'));
if (!Number.isInteger(runs) || runs < 1 || runs > 20) {
  throw new Error(`--runs must be an integer from 1 to 20; received ${JSON.stringify(getArg('--runs', '3'))}`);
}

function run(command, commandArgs, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: projectRoot, stdio: 'inherit', env: process.env });
    activeChild = child;
    child.once('error', (error) => reject(new Error(`${label} could not start: ${error.message}`)));
    child.once('exit', (code, signal) => {
      if (activeChild === child) activeChild = undefined;
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with ${code ?? signal}`));
    });
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    receivedSignal = signal;
    activeChild?.kill(signal);
  });
}

async function waitForPortRelease(port, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortAvailable(port)) return;
    await new Promise((resolve) => globalThis.setTimeout(resolve, 100));
  }
  throw new Error(`Festival browser port ${port} remained occupied after the browser run ended`);
}

async function resetDemo(label) {
  await run('bash', ['scripts/demo/reset-demo.sh'], label);
}

const port = parseBrowserPort();
assertBrowserDiskSpace({ projectRoot });
let workflowError;
let mutatedDemo = false;
let portReleased = true;

try {
  await run(process.execPath, ['scripts/check-workspace.mjs'], 'workspace compatibility check');
  const { createRequire } = await import('node:module');
  const playwrightCli = createRequire(import.meta.url).resolve('@playwright/test/cli');
  for (let runNumber = 1; runNumber <= runs; runNumber += 1) {
    console.log(`\n=== Festival browser workflow run ${runNumber} of ${runs} ===`);
    await assertBrowserPortAvailable(port);
    mutatedDemo = true;
    await resetDemo(`demo reset before run ${runNumber}`);
    portReleased = false;
    try {
      await run(
        process.execPath,
        [
          playwrightCli,
          'test',
          '--config',
          'playwright.live-demo.config.ts',
          '--output',
          `test-results/repeat-run-${runNumber}`,
        ],
        `browser run ${runNumber}`
      );
    } finally {
      await waitForPortRelease(port);
      portReleased = true;
    }
  }
} catch (error) {
  workflowError = error;
} finally {
  if (mutatedDemo && portReleased && process.env.FESTNEST_SKIP_FINAL_RESET !== 'true') {
    try {
      await resetDemo('final canonical demo reset');
    } catch (error) {
      workflowError ||= error;
      console.error(error instanceof Error ? error.message : error);
    }
  }
}

if (receivedSignal) process.exitCode = receivedSignal === 'SIGINT' ? 130 : 143;
if (workflowError) throw workflowError;
console.log(`Festival browser workflow passed ${runs} consecutive run${runs === 1 ? '' : 's'} and restored canonical demo state.`);
