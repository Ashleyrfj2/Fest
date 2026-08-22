import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

const TRIP_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = '00000000-0000-4000-8000-000000000002';
const OTHER_USER_ID = '00000000-0000-4000-8000-000000000003';
const FIXTURE_ACCESS_TOKEN =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjQxMDI0NDQ4MDB9.fixture-signature';

const fixtureUser = {
  id: USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'qa-fixture@example.invalid',
  email_confirmed_at: '2026-01-01T00:00:00.000Z',
  phone: '',
  confirmed_at: '2026-01-01T00:00:00.000Z',
  last_sign_in_at: '2026-01-01T00:00:00.000Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { display_name: 'QA Fixture' },
  identities: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  is_anonymous: false,
};

const fixtureSession = {
  access_token: FIXTURE_ACCESS_TOKEN,
  refresh_token: 'fixture-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: fixtureUser,
};

const fixtureProfile = {
  id: USER_ID,
  display_name: 'QA Fixture',
  email: fixtureUser.email,
  avatar_color: '#C9A84C',
  phone: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  last_seen_at: '2026-01-01T00:00:00.000Z',
};

const fixtureTrip = {
  id: TRIP_ID,
  name: 'QA Fixture Trip',
  festival_name: 'Fixture Festival',
  start_date: '2027-08-20',
  end_date: '2027-08-22',
  invite_code: 'QAFIXT01',
  invite_expires_at: '2027-08-01T00:00:00.000Z',
  leader_id: USER_ID,
  meetup_pin: {
    lat: 38.8977,
    lng: -77.0365,
    label: 'North Gate',
    notes: 'Synthetic browser fixture',
    pin_type: 'meetup',
    created_by_id: USER_ID,
    created_by_name: 'QA Fixture',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
};

const fixtureMembers = [
  {
    id: '00000000-0000-4000-8000-000000000010',
    trip_id: TRIP_ID,
    user_id: USER_ID,
    role: 'editor',
    module_permissions: { travel: 'editor', budget: 'editor' },
    joined_at: '2026-01-01T00:00:00.000Z',
    user: fixtureProfile,
  },
  {
    id: '00000000-0000-4000-8000-000000000011',
    trip_id: TRIP_ID,
    user_id: OTHER_USER_ID,
    role: 'viewer',
    module_permissions: {},
    joined_at: '2026-01-01T00:00:00.000Z',
    user: {
      ...fixtureProfile,
      id: OTHER_USER_ID,
      display_name: 'Other Fixture',
      email: 'other-fixture@example.invalid',
    },
  },
];

function jsonResponse(route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(body),
  });
}

function isSingleRequest(route: Route) {
  return route.request().headers().accept?.includes('application/vnd.pgrst.object+json') ?? false;
}

async function installFixtureBackend(page: Page, authenticated = false) {
  await page.route('http://127.0.0.1:54321/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname.startsWith('/auth/v1/')) {
      if (request.method() === 'POST' && url.pathname.endsWith('/token')) {
        return jsonResponse(route, fixtureSession);
      }
      return jsonResponse(route, { user: fixtureUser, session: fixtureSession });
    }

    if (!url.pathname.startsWith('/rest/v1/')) {
      return jsonResponse(route, {});
    }

    const table = url.pathname.split('/').pop();
    const single = isSingleRequest(route);

    if (request.method() === 'HEAD' || url.searchParams.get('head') === 'true') {
      return route.fulfill({
        status: 200,
        headers: { 'content-range': '0-1/2' },
        body: '',
      });
    }

    if (table === 'users') {
      return jsonResponse(route, single ? fixtureProfile : [fixtureProfile]);
    }

    if (table === 'trips') {
      const select = url.searchParams.get('select') || '';
      const data = select === 'meetup_pin' ? { meetup_pin: fixtureTrip.meetup_pin } : fixtureTrip;
      return jsonResponse(route, single ? data : [data]);
    }

    if (table === 'group_members') {
      const hasUserFilter = url.searchParams.has('user_id');
      return jsonResponse(route, single && hasUserFilter ? { role: 'editor' } : fixtureMembers);
    }

    if (table === 'budget_entries' || table === 'activity_logs' || table === 'supply_items') {
      return jsonResponse(route, single ? {} : []);
    }

    if (table === 'vehicles' || table === 'flight_details' || table === 'safety_profiles') {
      return jsonResponse(route, single ? {} : []);
    }

    if (request.method() === 'GET') {
      return jsonResponse(route, single ? {} : []);
    }

    return jsonResponse(route, single ? {} : []);
  });

  await page.addInitScript(({ session, enabled }) => {
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.token-user');
    localStorage.removeItem('sb-127-auth-token');
    if (enabled) {
      localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
    }
  }, { session: fixtureSession, enabled: authenticated });
}

async function openFixtureTrip(page: Page) {
  await installFixtureBackend(page, true);
  await page.goto(`/trips/${TRIP_ID}`);
  await expect(page.getByText('QA Fixture Trip', { exact: true })).toBeVisible();
}

test('the exported app starts and renders the welcome screen', async ({ page }) => {
  await installFixtureBackend(page);
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page.getByText('Welcome to FestNest', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/welcome$/);
});

test('malformed and repeated route parameters fail closed', async ({ page }) => {
  await installFixtureBackend(page);

  await page.goto('/trips/not-a-uuid');
  await expect(page.getByText('Trip not found', { exact: true })).toBeVisible();

  await page.goto('/join/not-valid?code=QAFIXT01&code=OTHER001');
  await expect(page.getByText('Invalid invite code', { exact: true })).toBeVisible();
});

test('welcome navigation reaches sign in without backend access', async ({ page }) => {
  await installFixtureBackend(page);
  await page.goto('/auth/welcome');
  await page.getByText('Already have an account?', { exact: false }).click();

  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await expect(page.getByText('Welcome back', { exact: true })).toBeVisible();
});

test('trip dashboard navigation reaches budget and rejects invalid amount input', async ({ page }) => {
  await openFixtureTrip(page);
  await page.getByText('Budget', { exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/trips/${TRIP_ID}/budget$`));
  await expect(page.getByText('Budget Tracker', { exact: true })).toBeVisible();

  await page.getByLabel('Add expense').click();
  await expect(page.getByText('Add Expense', { exact: true }).first()).toBeVisible();

  await page.getByPlaceholder('What was this for?').fill('Invalid fixture expense');
  await page.getByPlaceholder('0.00').fill('0');
  await page.getByText('Add Expense', { exact: true }).last().click();

  await expect(page.getByText('Please enter a valid amount', { exact: true })).toBeVisible();
});

test('web travel route renders the coordinate meetup fallback', async ({ page }) => {
  await installFixtureBackend(page, true);
  await page.goto(`/trips/${TRIP_ID}/travel`);

  await expect(page.getByText('Travel Plans', { exact: true })).toBeVisible();
  await expect(page.getByText('Web coordinate preview', { exact: true })).toBeVisible();
  await expect(page.getByText('North Gate', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('38.89770, -77.03650', { exact: true })).toBeVisible();
  await expect(page.getByText('Interactive map controls are available in the native app.', { exact: true })).toBeVisible();
});
