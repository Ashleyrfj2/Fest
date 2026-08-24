import { spawn } from 'node:child_process';
import process from 'node:process';

const DEFAULT_MAX_CAPTURE_BYTES = 1024 * 1024;

export class CommandCancelledError extends Error {
  constructor(message = 'Command cancelled') {
    super(message);
    this.name = 'CommandCancelledError';
  }
}

function ownedProcessIsRunning(child) {
  return child.exitCode === null && child.signalCode === null;
}

function signalOwnedProcess(child, signal) {
  if (!ownedProcessIsRunning(child)) return;
  try {
    if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error;
  }
}

export function runOwnedCommand({
  command,
  args = [],
  cwd,
  env = process.env,
  label = command,
  timeoutMs = 120_000,
  abortSignal,
  captureOutput = false,
  killGraceMs = 3_000,
  killWaitMs = 2_000,
  maxCaptureBytes = DEFAULT_MAX_CAPTURE_BYTES,
} = {}) {
  if (!command) return Promise.reject(new Error('command is required'));
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return Promise.reject(new Error('timeoutMs must be a positive number'));
  }
  if (!Number.isInteger(maxCaptureBytes) || maxCaptureBytes < 1) {
    return Promise.reject(new Error('maxCaptureBytes must be a positive integer'));
  }
  for (const [name, value] of [['killGraceMs', killGraceMs], ['killWaitMs', killWaitMs]]) {
    if (!Number.isFinite(value) || value < 0) {
      return Promise.reject(new Error(`${name} must be a non-negative number`));
    }
  }
  if (abortSignal?.aborted) return Promise.reject(new CommandCancelledError(`${label} was cancelled`));

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let terminationReason;
    let timeout;
    let escalationTimer;
    let finalTimer;

    const child = spawn(command, args, {
      cwd,
      env,
      detached: process.platform !== 'win32',
      stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });

    const cleanup = () => {
      if (timeout) globalThis.clearTimeout(timeout);
      if (escalationTimer) globalThis.clearTimeout(escalationTimer);
      if (finalTimer) globalThis.clearTimeout(finalTimer);
      abortSignal?.removeEventListener('abort', onAbort);
    };

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(result);
    };

    const beginTermination = (reason) => {
      if (terminationReason || settled) return;
      terminationReason = reason;
      try {
        signalOwnedProcess(child, 'SIGTERM');
      } catch (error) {
        finish(error);
        return;
      }

      escalationTimer = globalThis.setTimeout(() => {
        try {
          signalOwnedProcess(child, 'SIGKILL');
        } catch (error) {
          finish(error);
          return;
        }
        finalTimer = globalThis.setTimeout(() => finish(terminationReason), killWaitMs);
        finalTimer.unref?.();
      }, killGraceMs);
      escalationTimer.unref?.();
    };

    const onAbort = () => beginTermination(new CommandCancelledError(`${label} was cancelled`));
    abortSignal?.addEventListener('abort', onAbort, { once: true });

    const capture = (kind) => (chunk) => {
      const bytesUsed = Buffer.byteLength(stdout) + Buffer.byteLength(stderr);
      const remainingBytes = Math.max(0, maxCaptureBytes - bytesUsed);
      const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const value = chunkBuffer.subarray(0, remainingBytes).toString('utf8');
      if (kind === 'stdout') stdout += value;
      else stderr += value;
      if (chunkBuffer.length > remainingBytes) {
        beginTermination(new Error(`${label} exceeded its bounded output limit`));
      }
    };

    if (captureOutput) {
      child.stdout.on('data', capture('stdout'));
      child.stderr.on('data', capture('stderr'));
    }

    child.once('error', (error) => finish(new Error(`${label} could not start: ${error.message}`)));
    child.once('exit', (code, signal) => {
      if (terminationReason) {
        finish(terminationReason);
      } else if (code === 0) {
        finish(undefined, { stdout, stderr });
      } else {
        finish(new Error(`${label} failed with ${code ?? signal}`));
      }
    });

    timeout = globalThis.setTimeout(
      () => beginTermination(new Error(`${label} timed out after ${timeoutMs} ms`)),
      timeoutMs
    );
    timeout.unref?.();
  });
}
