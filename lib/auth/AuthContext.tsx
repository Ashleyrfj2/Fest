/**
 * Auth Context for FestNest
 * Manages ghost accounts, user profiles, and session state
 *
 * Flow:
 * 1. App opens → auto-create anonymous (ghost) account
 * 2. User sets name + avatar color → update profile
 * 3. After 5+ min → prompt for email (upgrade to permanent)
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  // Auth state
  session: Session | null;
  authUser: AuthUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isGhostAccount: boolean;

  // Ghost account creation
  createGhostAccount: () => Promise<void>;

  // Profile management
  updateProfile: (data: {
    display_name?: string;
    avatar_color?: string;
    phone?: string;
  }) => Promise<void>;

  // Account upgrade (ghost → permanent)
  upgradeToEmailAccount: (email: string, password: string) => Promise<void>;

  // Session management
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Usage tracking for prompts
  appUsageMinutes: number;
  shouldPromptForEmail: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  FIRST_OPENED: 'festnest_first_opened',
  EMAIL_PROMPT_DISMISSED: 'festnest_email_prompt_dismissed',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appUsageMinutes, setAppUsageMinutes] = useState(0);
  const [emailPromptDismissed, setEmailPromptDismissed] = useState(false);

  // Calculate if account is a ghost account (anonymous, no email)
  const isGhostAccount = authUser?.is_anonymous === true || (!authUser?.email && !!authUser);

  // Should we prompt for email? (5+ min usage, not dismissed, is ghost account)
  const shouldPromptForEmail = appUsageMinutes >= 5 && !emailPromptDismissed && isGhostAccount;

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Track app usage time
   */
  useEffect(() => {
    loadUsageTracking();
    const interval = setInterval(() => {
      setAppUsageMinutes((prev) => {
        const newValue = prev + 1;
        return newValue;
      });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  /**
   * Listen for auth state changes
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthUser(session?.user ?? null);

      if (session?.user) {
        // Do not await Supabase calls inside this callback. It can block
        // other client requests during auth transitions.
        void loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Initialize auth state
   * Only loads existing session - does not auto-create accounts
   */
  async function initializeAuth() {
    try {
      // Check for existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setSession(session);
        setAuthUser(session.user);
        await loadUserProfile(session.user.id);
      }
      // No auto-create - user must choose auth path from welcome screen
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Load usage tracking data
   */
  async function loadUsageTracking() {
    try {
      const firstOpened = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_OPENED);
      const dismissed = await AsyncStorage.getItem(STORAGE_KEYS.EMAIL_PROMPT_DISMISSED);

      if (!firstOpened) {
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_OPENED, new Date().toISOString());
      } else {
        // Calculate minutes since first opened
        const minutesSinceFirstOpen = Math.floor(
          (Date.now() - new Date(firstOpened).getTime()) / 60000
        );
        setAppUsageMinutes(minutesSinceFirstOpen);
      }

      setEmailPromptDismissed(dismissed === 'true');
    } catch (error) {
      console.error('Error loading usage tracking:', error);
    }
  }

  /**
   * Load user profile from database
   * Creates the profile if it doesn't exist (fallback for pre-trigger accounts)
   */
  async function loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // User doesn't exist in public.users - create it (fallback for pre-trigger accounts)
        if (error.code === 'PGRST116') {
          console.log('User not found in public.users, creating profile...');

          // Get auth user metadata
          const { data: { user: authUser } } = await supabase.auth.getUser();

          if (!authUser) throw new Error('No authenticated user');

          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              display_name: authUser.user_metadata?.display_name || 'Guest',
              avatar_color: authUser.user_metadata?.avatar_color || '#C9A84C',
              email: authUser.email || null,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setUserProfile(newUser);
          return;
        }
        throw error;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  /**
   * Create a ghost account (anonymous session)
   * This happens automatically on first app open
   */
  async function createGhostAccount() {
    try {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            display_name: 'Guest',
            avatar_color: '#C9A84C',
          },
        },
      });

      if (error) throw error;

      setSession(data.session);
      setAuthUser(data.user);

      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    } catch (error) {
      console.error('Ghost account creation error:', error);
      throw error;
    }
  }

  /**
   * Update user profile (name, avatar color, phone)
   */
  async function updateProfile(profileData: {
    display_name?: string;
    avatar_color?: string;
    phone?: string;
  }) {
    if (!authUser) throw new Error('No authenticated user');

    try {
      // Update in database
      const { data, error } = await supabase
        .from('users')
        .update({
          ...profileData,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', authUser.id)
        .select()
        .single();

      if (error) throw error;
      setUserProfile(data);

      // Also update auth metadata for future ghost account creations
      if (profileData.display_name || profileData.avatar_color) {
        await supabase.auth.updateUser({
          data: {
            display_name: profileData.display_name,
            avatar_color: profileData.avatar_color,
          },
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  /**
   * Upgrade ghost account to permanent account with email
   */
  async function upgradeToEmailAccount(email: string, password: string) {
    if (!authUser) throw new Error('No authenticated user');
    if (!isGhostAccount) throw new Error('Account is already permanent');

    try {
      // Update anonymous user to email account
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (error) throw error;

      // Update profile with email
      await supabase
        .from('users')
        .update({ email })
        .eq('id', authUser.id);

      // Mark email prompt as dismissed
      await AsyncStorage.setItem(STORAGE_KEYS.EMAIL_PROMPT_DISMISSED, 'true');
      setEmailPromptDismissed(true);

      // Reload profile
      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    } catch (error) {
      console.error('Account upgrade error:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password (for returning users)
   */
  async function signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setAuthUser(data.user);

      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async function signOut() {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setAuthUser(null);
      setUserProfile(null);

      // Clear storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.FIRST_OPENED,
        STORAGE_KEYS.EMAIL_PROMPT_DISMISSED,
      ]);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  const value: AuthContextType = {
    session,
    authUser,
    userProfile,
    isLoading,
    isGhostAccount,
    createGhostAccount,
    updateProfile,
    upgradeToEmailAccount,
    signInWithEmail,
    signOut,
    appUsageMinutes,
    shouldPromptForEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
