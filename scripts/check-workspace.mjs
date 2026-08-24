#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  REQUIRED_NPM_VERSION,
  evaluatePinnedToolchain,
} from './lib/workspace-toolchain.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const toolchainOnly = args.includes('--toolchain-only');
const unsupportedArgs = args.filter((arg) => arg !== '--toolchain-only');
if (unsupportedArgs.length > 0) {
  console.error(`[FAIL] Unsupported workspace-check argument: ${unsupportedArgs.join(', ')}`);
  process.exitCode = 2;
} else {
  const requiredNode = readFileSync(path.join(projectRoot, '.nvmrc'), 'utf8').trim();
  const packageManifest = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const npmResult = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version'], {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 10_000,
  });
  const toolchain = evaluatePinnedToolchain({
    requiredNode,
    actualNode: process.versions.node,
    packageManager: packageManifest.packageManager,
    npmResult,
  });
  const failures = [...toolchain.failures];
  const warnings = [];
  const isWSL = process.platform === 'linux' && /microsoft/i.test(os.release());

  if (!toolchainOnly) {
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
  }

  for (const warning of warnings) console.warn(`[WARN] ${warning}`);
  if (failures.length > 0) {
    for (const failure of failures) console.error(`[FAIL] ${failure}`);
    process.exitCode = 1;
  } else if (toolchainOnly) {
    console.log(
      `Pinned toolchain check passed for Node v${process.versions.node} and npm ${REQUIRED_NPM_VERSION}.`
    );
  } else {
    console.log(
      `Workspace compatibility check passed for ${isWSL ? 'WSL' : process.platform} on ${process.version} with npm ${REQUIRED_NPM_VERSION}.`
    );
  }
}
