import process from 'node:process';

export const FESTIVAL_LOCAL_SUPABASE_API_URL = 'http://127.0.0.1:54321';

function decodeStatusValue(key, rawValue) {
  const value = rawValue.trim();
  if (!value) return '';

  if (value.startsWith('"')) {
    if (!value.endsWith('"')) throw new Error(`Supabase status value for ${key} has an unmatched quote`);
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`Supabase status value for ${key} is not valid quoted text`);
    }
  }

  if (value.startsWith("'")) {
    if (!value.endsWith("'")) throw new Error(`Supabase status value for ${key} has an unmatched quote`);
    return value.slice(1, -1);
  }

  if (/\s/.test(value)) throw new Error(`Supabase status value for ${key} contains unsupported whitespace`);
  return value;
}

export function parseSupabaseStatusEnvironment(output) {
  if (typeof output !== 'string') throw new Error('Supabase status output must be text');

  const values = {};
  for (const sourceLine of output.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      throw new Error(`Supabase status output contains duplicate ${key}`);
    }
    values[key] = decodeStatusValue(key, rawValue);
  }
  return values;
}

function assertExactLocalApiUrl(rawUrl, sourceName) {
  if (!rawUrl) throw new Error(`${sourceName} is required`);
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`${sourceName} must be a valid URL`);
  }

  if (
    parsed.origin !== FESTIVAL_LOCAL_SUPABASE_API_URL ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(`${sourceName} must be exactly ${FESTIVAL_LOCAL_SUPABASE_API_URL}`);
  }
  return FESTIVAL_LOCAL_SUPABASE_API_URL;
}

function assertSafeAnonKey(rawKey, sourceName) {
  if (typeof rawKey !== 'string' || !rawKey.trim()) throw new Error(`${sourceName} is required`);
  if (/[\u0000-\u001f\u007f]/.test(rawKey)) throw new Error(`${sourceName} contains control characters`);
  return rawKey;
}

export function resolveVerifiedLocalSupabaseEnvironment(statusOutput, ambientEnvironment = process.env) {
  const status = parseSupabaseStatusEnvironment(statusOutput);
  const apiUrl = assertExactLocalApiUrl(status.API_URL, 'Supabase status API_URL');
  const anonKey = assertSafeAnonKey(status.ANON_KEY, 'Supabase status ANON_KEY');

  for (const name of ['API_URL', 'EXPO_PUBLIC_SUPABASE_URL']) {
    const ambientValue = ambientEnvironment?.[name];
    if (ambientValue) {
      const ambientUrl = assertExactLocalApiUrl(ambientValue, `Ambient ${name}`);
      if (ambientUrl !== apiUrl) throw new Error(`Ambient ${name} does not match local Supabase status`);
    }
  }

  for (const name of ['ANON_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY']) {
    const ambientValue = ambientEnvironment?.[name];
    if (ambientValue && ambientValue !== anonKey) {
      throw new Error(`Ambient ${name} does not match local Supabase status`);
    }
  }

  return Object.freeze({
    apiUrl,
    anonKey,
    publicEnvironment: Object.freeze({
      EXPO_PUBLIC_SUPABASE_URL: apiUrl,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    }),
  });
}
