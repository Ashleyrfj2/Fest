import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Lock, Mail, X } from 'lucide-react-native';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';

interface GuestAccessModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = 'Register to unlock this feature';
const DEFAULT_DESCRIPTION =
  'You are in demo mode. Create or sign in to a saved account to create trips and open modules.';

export function GuestAccessModal({
  visible,
  onClose,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: GuestAccessModalProps) {
  const handleRegister = () => {
    onClose();
    router.push('/auth/register');
  };

  const handleSignIn = () => {
    onClose();
    router.push('/auth/sign-in');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <View style={styles.iconWrap}>
                <Lock size={18} color={colors.base} strokeWidth={2} />
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <X size={20} color={colors.text.mid} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>{description}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn} activeOpacity={0.8}>
            <Mail size={16} color={colors.accent.gold} strokeWidth={2} />
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.laterButtonText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    padding: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.level2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  description: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    color: colors.base,
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
  },
  secondaryButton: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.level2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.accent.gold,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
  laterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  laterButtonText: {
    color: colors.text.dim,
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
  },
});