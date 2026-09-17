/**
 * Defensive parsing for values originating in Expo Router search/path params.
 * Route params are untrusted input: Expo Router can expose repeated params as
 * arrays, and malformed deep links should not become application state.
 */

export type RouteParamValue = string | string[] | null | undefined;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVITE_CODE_PATTERN = /^[A-Z0-9]{8}$/;

export function parseTripIdParam(value: RouteParamValue): string | undefined {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    return undefined;
  }

  return value.toLowerCase();
}

export function parseInviteCodeParam(value: RouteParamValue): string | undefined {
  if (typeof value !== 'string' || !INVITE_CODE_PATTERN.test(value)) {
    return undefined;
  }

  return value;
}
