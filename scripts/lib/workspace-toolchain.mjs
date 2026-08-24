export const REQUIRED_NPM_VERSION = '10.9.4';

export function evaluatePinnedToolchain({
  requiredNode,
  actualNode,
  packageManager,
  npmResult,
} = {}) {
  const failures = [];

  if (!requiredNode) {
    failures.push('A required Node version is not configured.');
  } else if (actualNode !== requiredNode) {
    failures.push(
      `Node ${requiredNode} is required; current runtime is v${actualNode || 'unknown'}. Run "nvm install && nvm use" in the repository.`
    );
  }

  const declaredNpm = /^npm@(.+)$/.exec(packageManager || '')?.[1];
  if (declaredNpm !== REQUIRED_NPM_VERSION) {
    failures.push(
      `package.json must pin packageManager to npm@${REQUIRED_NPM_VERSION}; found ${JSON.stringify(packageManager)}.`
    );
  } else if (npmResult?.error) {
    failures.push(
      `npm ${REQUIRED_NPM_VERSION} could not be verified: ${npmResult.error instanceof Error ? npmResult.error.message : npmResult.error}`
    );
  } else if (npmResult?.status !== 0) {
    failures.push(`npm --version exited with status ${npmResult?.status ?? 'unknown'}`);
  } else {
    const actualNpm = String(npmResult.stdout || '').trim();
    if (actualNpm !== REQUIRED_NPM_VERSION) {
      failures.push(
        `npm ${REQUIRED_NPM_VERSION} is required; current npm is ${actualNpm || 'unknown'}.`
      );
    }
  }

  return Object.freeze({
    failures: Object.freeze(failures),
    requiredNpm: declaredNpm,
  });
}
