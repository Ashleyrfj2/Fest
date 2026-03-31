/**
 * Guest Setup Screen
 * Quick start flow - creates ghost account and sets name + color
 *
 * Flow: Create ghost account → name + color picker → redirect to home
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { User } from 'lucide-react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';

// Avatar color presets
const AVATAR_COLORS = [
  '#28C896', // Electric Forest green
  '#B47AFF', // Dancefestopia violet
  '#F280B0', // Beyond Wonderland pink
  '#C9A84C', // Burnished gold (default)
  '#4A9EFF', // Sky blue
  '#FF6B6B', // Coral red
  '#FFB84D', // Sunset orange
  '#9B59B6', // Purple
];

export default function GuestSetupScreen() {
  const { tripCode } = useLocalSearchParams<{ tripCode?: string }>();
  const { createGhostAccount, updateProfile, authUser, userProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[3]); // Default gold
  const [isCreatingAccount, setIsCreatingAccount] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Create ghost account on mount
    async function initializeGuestAccount() {
      try {
        await createGhostAccount();
        setIsCreatingAccount(false);
      } catch (err: any) {
        console.error('Failed to create ghost account:', err);
        setError(err.message || 'Failed to create account. Please try again.');
        setIsCreatingAccount(false);
      }
    }

    initializeGuestAccount();
  }, []);

  const handleComplete = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Update profile with name and color
      await updateProfile({
        display_name: displayName.trim(),
        avatar_color: selectedColor,
      });

      // If joining from an invite link, auto-join the trip
      if (tripCode && userProfile) {
        // Load trip by invite code
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('id')
          .eq('invite_code', tripCode)
          .single();

        if (tripError || !tripData) {
          console.error('Failed to load trip:', tripError);
          setError('Failed to join trip. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // Add user to group_members
        const { error: joinError } = await supabase.from('group_members').insert({
          user_id: userProfile.id,
          trip_id: tripData.id,
          role: 'viewer',
          module_permissions: null,
        });

        if (joinError && joinError.code !== '23505') {
          // Ignore duplicate key errors (already a member)
          console.error('Failed to join trip:', joinError);
          setError('Failed to join trip. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripData.id,
          user_id: userProfile.id,
          action_type: 'member_joined',
          module: null,
          target_id: userProfile.id,
          description: `${displayName.trim()} joined the trip`,
        });

        // Navigate to trip dashboard
        router.replace(`/trips/${tripData.id}`);
      } else {
        // Navigate to home screen
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Show loading while creating account
  if (isCreatingAccount) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Setting up your account...</Text>
      </View>
    );
  }

  // Show error if account creation failed
  if (error && !displayName) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace('/auth/welcome')}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <User size={28} color={colors.accent.gold} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Let's get you set up</Text>
          <Text style={styles.subtitle}>
            What should your crew call you?
          </Text>
        </View>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g., Riley"
            placeholderTextColor={colors.text.dim}
            autoFocus
            maxLength={30}
            returnKeyType="done"
            onSubmitEditing={handleComplete}
          />
        </View>

        {/* Color Picker */}
        <View style={styles.colorSection}>
          <Text style={styles.inputLabel}>Pick Your Color</Text>
          <View style={styles.colorGrid}>
            {AVATAR_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
                activeOpacity={0.7}
              />
            ))}
          </View>
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!displayName.trim() || isSubmitting) && styles.continueButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={!displayName.trim() || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.base} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          You can add an email later to sync across devices
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    marginTop: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  errorTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  errorMessage: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.xxl,
  },
  inputLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  colorSection: {
    marginBottom: spacing.xxl,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.text.primary,
  },
  errorText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.danger,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  infoText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
  },
});
