/**
 * Email Prompt Banner
 * Soft prompt for email after 5+ minutes of app usage
 * Skippable, re-prompted once per session
 *
 * Design: Subtle banner at top of screen, warm gold accent
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Mail, Lock } from 'lucide-react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';

interface EmailPromptBannerProps {
  onDismiss?: () => void;
}

export function EmailPromptBanner({ onDismiss }: EmailPromptBannerProps) {
  const { upgradeToEmailAccount } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDismiss = () => {
    setShowModal(false);
    onDismiss?.();
  };

  const handleSaveEmail = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await upgradeToEmailAccount(email.trim(), password);
      setShowModal(false);
    } catch (err: any) {
      console.error('Email upgrade error:', err);
      setError(err.message || 'Failed to save email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Mail size={20} color={colors.accent.gold} strokeWidth={2} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Save your account</Text>
            <Text style={styles.bannerSubtitle}>
              Add email so you don't lose access
            </Text>
          </View>
        </View>
        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={() => setShowModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.bannerButtonText}>Add Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.text.dim} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleDismiss}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save your account</Text>
              <TouchableOpacity onPress={handleDismiss} activeOpacity={0.7}>
                <X size={24} color={colors.text.mid} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Create a password so you can access your trips from any device
            </Text>

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
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
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
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.text.dim}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password-new"
                />
              </View>
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!email.trim() || !password.trim() || isLoading) &&
                  styles.saveButtonDisabled,
              ]}
              onPress={handleSaveEmail}
              disabled={!email.trim() || !password.trim() || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.base} />
              ) : (
                <Text style={styles.saveButtonText}>Save Email</Text>
              )}
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Banner styles
  banner: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)', // Gold tint
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  bannerButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  dismissButton: {
    padding: spacing.xs,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.base,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    lineHeight: 22,
    marginBottom: spacing.xxxl,
  },
  inputGroup: {
    marginBottom: spacing.xl,
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
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  errorText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.danger,
    marginBottom: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
});
