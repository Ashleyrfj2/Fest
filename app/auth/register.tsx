/**
 * Email Registration Screen
 * Create permanent account with email + password
 *
 * Flow: Email/password → redirect to profile setup → main app
 */

import React, { useState } from 'react';
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
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: 'Guest', // Will be updated in profile setup
            avatar_color: '#C9A84C',
          },
        },
      });

      if (signUpError) throw signUpError;

      // If email confirmation is required, data.session will be null
      // and the user must confirm before they can sign in
      if (!data.session) {
        setError('Check your email and click the confirmation link, then sign in.');
        return;
      }

      // Database trigger will create user profile automatically
      // Navigate to profile setup to set name + color
      Keyboard.dismiss();
      router.replace('/onboarding/set-profile');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text.mid} strokeWidth={2} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Sign up with email to sync across all your devices
          </Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputContainer}>
            <Mail
              size={20}
              color={colors.text.dim}
              strokeWidth={2}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.text.primary}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="off"
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputContainer}>
            <Lock
              size={20}
              color={colors.text.primary}
              strokeWidth={2}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.base}
              secureTextEntry
              autoComplete="off"
              textContentType="oneTimeCode"
              importantForAutofill="no"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <Lock
              size={20}
              color={colors.text.primary}
              strokeWidth={2}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              placeholderTextColor={colors.text.primary}
              secureTextEntry
              autoComplete="off"
              textContentType="oneTimeCode"
              importantForAutofill="no"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Register Button */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            (!email.trim() || !password.trim() || !confirmPassword.trim() || isLoading) &&
              styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={!email.trim() || !password.trim() || !confirmPassword.trim() || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.base} />
          ) : (
            <Text style={styles.registerButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          By creating an account, you can access your trips from any device
        </Text>

        {/* Sign In Link */}
        <TouchableOpacity
          style={styles.signInLink}
          onPress={() => router.replace('/auth/sign-in')}
          activeOpacity={0.7}
        >
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInTextBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  header: {
    marginBottom: 40,
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
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.lg,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
  },
  errorText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.danger,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  registerButtonDisabled: {
    opacity: 0.4,
  },
  registerButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  infoText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 18,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  signInText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  signInTextBold: {
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
});
