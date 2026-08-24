import process from 'node:process';

export function assertCanonicalResetPolicy(environment = process.env) {
  if (Object.prototype.hasOwnProperty.call(environment, 'FESTNEST_SKIP_FINAL_RESET')) {
    throw new Error(
      'FESTNEST_SKIP_FINAL_RESET is no longer supported because the workflow must restore canonical state'
    );
  }
}

export function canonicalRestorationResult({
  mutatedDemo,
  finalRestorationVerified,
  interrupted,
  portReleased,
  finalResetFailed,
} = {}) {
  if (!mutatedDemo) return Object.freeze({ required: false, restored: false, reason: null });
  if (finalRestorationVerified) return Object.freeze({ required: true, restored: true, reason: null });

  let reason = 'final canonical restoration was not verified';
  if (interrupted) reason = 'the workflow was interrupted';
  else if (!portReleased) reason = 'the Festival browser port did not release';
  else if (finalResetFailed) reason = 'the final canonical reset or seed verification failed';

  return Object.freeze({ required: true, restored: false, reason });
}
