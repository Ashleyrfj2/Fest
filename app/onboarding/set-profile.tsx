/**
 * Set Profile Screen
 * First screen after tapping invite link or creating account
 * User sets display name + avatar color
 *
 * Design: Deep indigo background, burnished gold accent
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';

// Preset avatar colors (8 options)
const AVATAR_COLORS = [
  { name: 'Gold', hex: '#C9A84C' },
  { name: 'Electric Green', hex: '#28C896' },
  { name: 'Violet', hex: '#6D30CC' },
  { name: 'Hot Pink', hex: '#F280B0' },
  { name: 'Sky Blue', hex: '#4A9EFF' },
  { name: 'Coral', hex: '#FF6B6B' },
  { name: 'Amber', hex: '#FFB84D' },
  { name: 'Lavender', hex: '#B47AFF' },
];

export default function SetProfileScreen() {
  const { tripCode } = useLocalSearchParams<{ tripCode?: string }>();
  const { updateProfile, userProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].hex);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);

  // Create a ref for the input
  const inputRef = useRef<TextInput>(null);

  // Focus the input after higher-priority tasks complete
  useEffect(() => {
    // Use requestIdleCallback if available, fallback to setImmediate for React Native
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(() => {
        inputRef.current?.focus();
      });
      return () => cancelIdleCallback(id);
    } else {
      const id = setImmediate(() => {
        inputRef.current?.focus();
      });
      return () => clearImmediate(id);
    }
  }, []);

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
        // Load trip by invite code
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('id')
          .eq('invite_code', tripCode)
          .single();

        if (tripError || !tripData) {
          console.error('Failed to load trip:', tripError);
          setError('Failed to join trip. Please try again.');
          setIsLoading(false);
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
          setIsLoading(false);
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

        // Trigger navigation via useEffect
        setNavigationTarget(`/trips/${tripData.id}`);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
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
            ref={inputRef} // ADDED: Attach the ref to the TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={colors.text.faint}
            // autoFocus  <-- REMOVED: This was causing the bridge disconnect
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  content: {
    flex: 1,
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