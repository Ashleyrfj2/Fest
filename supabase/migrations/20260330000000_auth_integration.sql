-- Auth Integration for Ghost Accounts
-- Links Supabase Auth to custom users table
-- Supports anonymous (ghost) accounts that can be upgraded later

-- ============================================================================
-- FUNCTION: Auto-create user profile on auth signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a user profile in our custom users table
  -- For ghost accounts, display_name and avatar_color will be updated later
  INSERT INTO public.users (id, display_name, avatar_color, email, created_at, last_seen_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Guest'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_color', '#C9A84C'),
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Create user profile on auth signup
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Sync email updates from auth.users to public.users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email in public.users when auth.users email changes
  UPDATE public.users
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Sync email updates
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_user_email_update();
