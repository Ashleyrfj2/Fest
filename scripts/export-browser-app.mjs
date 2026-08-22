#!/usr/bin/env node

import { mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const outputDir = process.env.FESTNEST_BROWSER_EXPORT_DIR
  ? path.resolve(process.env.FESTNEST_BROWSER_EXPORT_DIR)
  : mkdtempSync(path.join(os.tmpdir(), 'festnest-browser-export-'));
const port = process.env.FESTNEST_BROWSER_PORT || '4173';
const npmCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      ...options,
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${code ?? signal}`));
      }
    });
  });
}

const exportEnvironment = {
  ...process.env,
  EXPO_NO_DOTENV: 'true',
  EXPO_PUBLIC_SUPABASE_URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  EXPO_PUBLIC_SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'festnest-browser-fixture-anon-key',
};

if ('SUPABASE_SERVICE_ROLE_KEY' in exportEnvironment) {
  delete exportEnvironment.SUPABASE_SERVICE_ROLE_KEY;
}

try {
  await run(
    npmCommand,
    ['expo', 'export', '--clear', '--platform', 'web', '--output-dir', outputDir],
    { env: exportEnvironment }
  );

  const server = spawn(
    process.execPath,
    [path.join(scriptDir, 'serve-export.mjs'), '--dir', outputDir, '--port', port],
    { cwd: projectRoot, stdio: 'inherit' }
  );

  const cleanup = () => {
    server.kill('SIGTERM');
    if (!process.env.FESTNEST_BROWSER_EXPORT_DIR) {
      rmSync(outputDir, { recursive: true, force: true });
    }
  };

  process.once('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.once('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('exit', (code) => {
      if (code && code !== 0) {
        reject(new Error(`browser server exited with ${code}`));
      } else {
        resolve();
      }
    });
  });
} catch (error) {
  if (!process.env.FESTNEST_BROWSER_EXPORT_DIR) {
    rmSync(outputDir, { recursive: true, force: true });
  }
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
