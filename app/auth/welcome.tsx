/**
 * Welcome Screen
 * Entry point for new users - choose between guest or email registration
 *
 * Design: Two prominent paths with guest emphasized as primary
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Zap, Mail, Sparkles } from 'lucide-react-native';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';

export default function WelcomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.iconContainer}>
          <Sparkles size={40} color={colors.accent.gold} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Welcome to FestNest</Text>
        <Text style={styles.subtitle}>
          Coordinate your festival adventure with your crew.{'\n'}
          One app for camp, supplies, travel, and more.
        </Text>
      </View>

      {/* Primary CTA - Guest Path */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/auth/guest-setup')}
        activeOpacity={0.8}
      >
        <View style={styles.buttonIconContainer}>
          <Zap size={24} color={colors.base} strokeWidth={2.5} />
        </View>
        <View style={styles.buttonTextContainer}>
          <Text style={styles.primaryButtonText}>Get started instantly</Text>
          <Text style={styles.primaryButtonSubtext}>
            No email required • Takes 10 seconds
          </Text>
        </View>
      </TouchableOpacity>

      {/* Secondary CTA - Email Path */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/auth/register')}
        activeOpacity={0.8}
      >
        <View style={styles.buttonIconContainer}>
          <Mail size={22} color={colors.text.primary} strokeWidth={2} />
        </View>
        <View style={styles.buttonTextContainer}>
          <Text style={styles.secondaryButtonText}>Create account with email</Text>
          <Text style={styles.secondaryButtonSubtext}>
            Sync across devices • Save your data
          </Text>
        </View>
      </TouchableOpacity>

      {/* Tertiary Link - Sign In */}
      <TouchableOpacity
        style={styles.signInLink}
        onPress={() => router.push('/auth/sign-in')}
        activeOpacity={0.7}
      >
        <Text style={styles.signInText}>
          Already have an account? <Text style={styles.signInTextBold}>Sign in</Text>
        </Text>
      </TouchableOpacity>

      {/* Footer Note */}
      <Text style={styles.footerText}>
        Guest accounts can be upgraded to email accounts later.{'\n'}
        No credit card ever required.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
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
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  buttonIconContainer: {
    marginRight: spacing.md,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.base,
    opacity: 0.8,
  },
  secondaryButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
    marginBottom: 2,
  },
  secondaryButtonSubtext: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xxl,
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
  footerText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
    lineHeight: 18,
  },
});
