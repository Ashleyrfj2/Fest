# FestNest Authentication System

## Overview

FestNest offers **two onboarding paths**:
1. **Quick start (guest account)** - Get in fast, add email later
2. **Email registration** - Create permanent account upfront

Users choose their path on the welcome screen.

## Flows

### Path 1: Quick Start (Guest Account)

**1. Welcome Screen**
- User taps "Get started instantly"
- Redirects to `/auth/guest-setup`

**2. Guest Setup**
- App creates anonymous Supabase Auth session
- A row is created in `users` table with default values:
  - `display_name`: "Guest"
  - `avatar_color`: "#C9A84C" (burnished gold)
  - `email`: null
- User enters display name
- User picks avatar color from 8 presets
- Profile is updated in `users` table
- User is redirected to main app `/(tabs)`

**3. Main App Usage**
- User can access all features with guest account
- App tracks usage time via `AuthContext`
- After 5+ minutes, email prompt banner appears

**4. Email Prompt (Optional Upgrade)**
- Soft prompt after 5 minutes of usage
- Skippable - user can dismiss
- If user adds email + password:
  - Anonymous account is upgraded to permanent account
  - Email is saved to both `auth.users` and `users` table
  - User can now sign in from other devices

### Path 2: Email Registration

**1. Welcome Screen**
- User taps "Create account with email"
- Redirects to `/auth/register`

**2. Registration**
- User enters email + password (min 6 characters)
- Supabase creates permanent account
- User is redirected to `/onboarding/set-profile`

**3. Set Profile**
- User enters display name
- User picks avatar color from 8 presets
- Profile is updated in `users` table
- User is redirected to main app `/(tabs)`

**4. Main App Usage**
- Full access to all features
- Can sign in from other devices immediately
- No email prompt (already has permanent account)

### Returning Users

**Sign In Flow**
- User taps "Sign in" on welcome screen
- Redirects to `/auth/sign-in`
- User enters email + password
- On success, redirects to `/(tabs)`

## Files

### Core Auth
- `lib/auth/AuthContext.tsx` - Auth provider with hooks
- `lib/supabase.ts` - Supabase client configuration

### Migrations
- `20260330000000_auth_integration.sql` - Links `auth.users` to `users` table

### Screens
- `app/auth/welcome.tsx` - Entry point - choose guest vs email
- `app/auth/guest-setup.tsx` - Quick start: name + color picker (creates ghost account)
- `app/auth/register.tsx` - Email registration
- `app/auth/sign-in.tsx` - Sign in for returning users
- `app/onboarding/set-profile.tsx` - Name + color picker (after email registration)

### Components
- `components/EmailPromptBanner.tsx` - Delayed email prompt (only for ghost accounts)

## Supabase Configuration

### Required Settings

Anonymous sign-in must be enabled in Supabase dashboard:

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Enable **Anonymous Sign-in**
5. Save changes

## Usage in Components

```tsx
import { useAuth } from '@/lib/auth/AuthContext';

function MyComponent() {
  const {
    userProfile,
    isGhostAccount,
    shouldPromptForEmail,
    updateProfile,
    upgradeToEmailAccount,
  } = useAuth();

  // Check if user has set their name
  const hasCompletedOnboarding = userProfile?.display_name !== 'Guest';

  // Update profile
  await updateProfile({
    display_name: 'Riley',
    avatar_color: '#28C896',
  });

  // Upgrade to email account
  await upgradeToEmailAccount('user@example.com', 'password123');
}
```

## Session Persistence

- Sessions are stored in AsyncStorage via Supabase SDK
- Auto-refresh tokens enabled
- Sessions persist across app restarts
- Ghost accounts are device-specific until upgraded

## Security

- RLS policies use `auth.uid()` to ensure users can only access their own data
- Anonymous accounts have same permissions as permanent accounts
- Email upgrade is atomic - no data is lost
- Triggers automatically sync `auth.users` email to `users` table

## Testing

To test the auth flow:

1. Clear AsyncStorage and restart app
2. Ghost account should be created automatically
3. Set name + color on onboarding screen
4. Navigate to home screen
5. Wait 5 minutes (or modify `USAGE_THRESHOLD` in `AuthContext.tsx` for faster testing)
6. Email prompt banner should appear
7. Add email + password to upgrade account

## Future Enhancements

- [ ] Email/password sign-in screen for returning users
- [ ] Password reset flow
- [ ] Social auth providers (Google, Apple)
- [ ] Multi-device sync indicator
- [ ] "Sign in on another device" QR code
