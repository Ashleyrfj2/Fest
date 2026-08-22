/**
 * Set Profile Screen
 * First screen after tapping invite link or creating account
 * User sets display name + avatar color
 *
 * Design: Deep indigo background, burnished gold accent
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';
import { AVATAR_COLORS } from '@/lib/constants/avatarColors';
import { parseInviteCodeParam } from '@/lib/routing/routeParams';

export default function SetProfileScreen() {
  const { tripCode: rawTripCode } = useLocalSearchParams<{ tripCode?: string | string[] }>();
  const tripCode = parseInviteCodeParam(rawTripCode);
  const { updateProfile, userProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(AVATAR_COLORS[0].hex);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);

  // Prefill display name when profile data arrives, but never overwrite typed input.
  useEffect(() => {
    if (!displayName.trim() && userProfile?.display_name) {
      setDisplayName(userProfile.display_name);
    }
  }, [userProfile?.display_name, displayName]);

  // Navigate only after profile is confirmed updated in context
  useEffect(() => {
    if (shouldNavigate && navigationTarget) {
      // Verify profile is updated before navigating
      if (userProfile?.display_name === displayName.trim()) {
        router.replace(navigationTarget);
      }
    }
  }, [shouldNavigate, navigationTarget, userProfile?.display_name, displayName]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Update profile with name and color
      await updateProfile({
        display_name: displayName.trim(),
        avatar_color: selectedColor,
      });

      // If joining from an invite link, auto-join the trip
      if (tripCode && userProfile) {
        const { data: tripId, error: joinError } = await supabase.rpc(
          'join_trip_with_invite',
          { p_invite_code: tripCode }
        );

        if (joinError || !tripId) {
          console.error('Failed to join trip:', joinError);
          setError('Failed to join trip. Please try again.');
          setIsLoading(false);
          return;
        }

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile.id,
          action_type: 'member_joined',
          module: null,
          target_id: userProfile.id,
          description: `${displayName.trim()} joined the trip`,
        });

        // Trigger navigation via useEffect
        setNavigationTarget(`/trips/${tripId}`);
        setShouldNavigate(true);
      } else {
        // Trigger navigation via useEffect (only navigate after profile confirmed updated)
        setNavigationTarget('/(tabs)');
        setShouldNavigate(true);
      }
    } catch (err) {
      console.error('Profile save error:', err);
      setError('Failed to save profile. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What should we call you?</Text>
          <Text style={styles.subtitle}>
            Pick a name and color so your crew recognizes you
          </Text>
        </View>

        {/* Name Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={colors.text.faint}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
            returnKeyType="done"
            editable={!isLoading}
          />
        </View>

        {/* Color Picker */}
        <View style={styles.colorSection}>
          <Text style={styles.label}>Avatar Color</Text>
          <View style={styles.colorGrid}>
            {AVATAR_COLORS.map((color) => (
              <TouchableOpacity
                key={color.hex}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color.hex },
                  selectedColor === color.hex && styles.colorSwatchSelected,
                ]}
                onPress={() => setSelectedColor(color.hex)}
                activeOpacity={0.8}
              >
                {selectedColor === color.hex && (
                  <View style={styles.colorCheckmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!displayName.trim() || isLoading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveProfile}
          disabled={!displayName.trim() || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.base} />
          ) : (
            <Text style={styles.saveButtonText}>Save your spot</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          You can update this anytime in your profile
        </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 40,
  },
  label: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.md,
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
    marginBottom: 40,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorSwatch: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: colors.text.primary,
    borderWidth: 3,
  },
  colorCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  errorText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.danger,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  infoText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
  },
});
