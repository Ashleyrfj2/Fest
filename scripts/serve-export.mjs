#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import {
  browserBaseURL,
  computeBrowserArtifactId,
  parseBrowserPort,
  startBrowserExportServer,
} from './lib/browser-runtime.mjs';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

let controller;
let shuttingDown = false;

async function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    await controller?.close();
  } catch (error) {
    console.error(`Failed to close Festival browser server: ${error instanceof Error ? error.message : error}`);
    exitCode = 1;
  }
  process.exitCode = exitCode;
}

process.once('SIGINT', () => void shutdown(130));
process.once('SIGTERM', () => void shutdown(143));

try {
  const rootDir = path.resolve(getArg('--dir', '.'));
  const port = parseBrowserPort(getArg('--port', process.env.FESTNEST_BROWSER_PORT));
  const artifactId = computeBrowserArtifactId(rootDir);
  controller = await startBrowserExportServer({ port, rootDir, artifactId });
  console.log(`FestNest browser server listening on ${browserBaseURL(port)} (${artifactId})`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
