/**
 * Sign In Screen
 * For returning users with email accounts
 *
 * Flow: Email/password → validate → redirect to home
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
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';

export default function SignInScreen() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await signInWithEmail(email.trim(), password);

      // AuthContext will handle profile loading and navigation
      // via the _layout.tsx routing logic
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Sign in error:', err);

      // Provide user-friendly error messages
      if (err.message?.includes('Invalid login credentials')) {
        setError('Incorrect email or password');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please confirm your email address');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to access your trips and crew
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
              placeholderTextColor={colors.text.dim}
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
              color={colors.text.dim}
              strokeWidth={2}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.text.dim}
              secureTextEntry
              autoComplete="off"
              textContentType="oneTimeCode"
              importantForAutofill="no"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />
          </View>
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Sign In Button */}
        <TouchableOpacity
          style={[
            styles.signInButton,
            (!email.trim() || !password.trim() || isLoading) && styles.signInButtonDisabled,
          ]}
          onPress={handleSignIn}
          disabled={!email.trim() || !password.trim() || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.base} />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Forgot Password Link (Future Feature) */}
        <TouchableOpacity
          style={styles.forgotLink}
          onPress={() => {
            // TODO: Implement forgot password flow
            setError('Password reset coming soon!');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Create Account Link */}
        <TouchableOpacity
          style={styles.createAccountLink}
          onPress={() => router.replace('/auth/register')}
          activeOpacity={0.7}
        >
          <Text style={styles.createAccountText}>
            Don't have an account? <Text style={styles.createAccountTextBold}>Sign up</Text>
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
  signInButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  signInButtonDisabled: {
    opacity: 0.4,
  },
  signInButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  forgotLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  forgotText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  dividerText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    marginHorizontal: spacing.lg,
  },
  createAccountLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  createAccountText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  createAccountTextBold: {
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
});
