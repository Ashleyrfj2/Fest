#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const require = createRequire(import.meta.url);
const failures = [];
const warnings = [];

const requiredNode = readFileSync(path.join(projectRoot, '.nvmrc'), 'utf8').trim();
if (process.versions.node !== requiredNode) {
  failures.push(`Node ${requiredNode} is required; current runtime is ${process.version}. Run \"nvm install && nvm use\" in the repository.`);
}

const packageManifest = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const requiredNpm = /^npm@(.+)$/.exec(packageManifest.packageManager || '')?.[1];
if (requiredNpm !== '10.9.4') {
  failures.push(`package.json must pin packageManager to npm@10.9.4; found ${JSON.stringify(packageManifest.packageManager)}.`);
} else {
  const npmResult = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version'], {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 10_000,
  });
  if (npmResult.error) {
    failures.push(`npm 10.9.4 could not be verified: ${npmResult.error.message}`);
  } else if (npmResult.status !== 0) {
    failures.push(`npm --version exited with status ${npmResult.status}`);
  } else if (npmResult.stdout.trim() !== requiredNpm) {
    failures.push(`npm ${requiredNpm} is required; current npm is ${npmResult.stdout.trim() || 'unknown'}.`);
  }
}

const isWSL = process.platform === 'linux' && /microsoft/i.test(os.release());
if (isWSL && projectRoot.startsWith('/mnt/')) {
  failures.push(`WSL checkout is under ${projectRoot}. Clone into the Linux filesystem, for example ~/repos/Fest.`);
}

for (const relativePath of ['scripts/demo/reset-demo.sh', 'scripts/demo/run-equipment-test.sh']) {
  const contents = readFileSync(path.join(projectRoot, relativePath));
  if (contents.includes(globalThis.Buffer.from('\r\n'))) failures.push(`${relativePath} uses CRLF; restore it with Git's LF rules.`);
}

for (const packageName of ['@playwright/test', 'babel-preset-expo']) {
  try {
    require.resolve(`${packageName}/package.json`);
  } catch {
    failures.push(`${packageName} is missing. Run npm ci.`);
  }
}

try {
  const playwright = require('@playwright/test');
  const executablePath = playwright.chromium.executablePath();
  if (!existsSync(executablePath)) {
    const installCommand = isWSL
      ? 'npx playwright install --with-deps chromium'
      : 'npx playwright install chromium';
    failures.push(`Playwright Chromium is not installed for this OS. Run: ${installCommand}`);
  }
} catch {
  // The missing package failure above is more actionable.
}

for (const warning of warnings) console.warn(`[WARN] ${warning}`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`[FAIL] ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Workspace compatibility check passed for ${isWSL ? 'WSL' : process.platform} on ${process.version}.`);
}
