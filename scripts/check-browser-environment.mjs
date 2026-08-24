#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  assertBrowserDiskSpace,
  assertBrowserPortAvailable,
  browserBaseURL,
  parseBrowserPort,
} from './lib/browser-runtime.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');

try {
  const port = parseBrowserPort();
  await assertBrowserPortAvailable(port);
  assertBrowserDiskSpace({ projectRoot });
  console.log(`Festival browser preflight passed: ${browserBaseURL(port)} is free.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 2;
}
