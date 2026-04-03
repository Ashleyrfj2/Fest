import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, Phone, ShieldAlert, Signpost, Trash2, UserCircle2, X } from 'lucide-react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { SettingsCard, SettingsPageFrame, SettingsRow, SettingsSectionLabel } from './_components';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';

export default function PrivacySettingsScreen() {
  const { userProfile, isGhostAccount, upgradeToEmailAccount, signOut } = useAuth();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!showUpgradeModal) {
      setEmail('');
      setPassword('');
      setUpgradeError('');
    }
  }, [showUpgradeModal]);

  const accountStatus = useMemo(() => {
    if (!userProfile) return 'Loading account...';
    if (isGhostAccount) return 'Ghost account';
    return userProfile.email ? 'Saved account' : 'Saved account';
  }, [isGhostAccount, userProfile]);

  async function handleUpgrade() {
    if (!email.trim() || !password.trim()) {
      setUpgradeError('Please enter an email and password.');
      return;
    }

    if (password.length < 6) {
      setUpgradeError('Password must be at least 6 characters.');
      return;
    }

    setUpgradeError('');
    setIsUpgrading(true);

    try {
      await upgradeToEmailAccount(email.trim(), password);
      setShowUpgradeModal(false);
    } catch (error: any) {
      console.error('Upgrade failed:', error);
      setUpgradeError(error?.message || 'Could not upgrade account.');
    } finally {
      setIsUpgrading(false);
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/auth/welcome');
          } catch (error) {
            console.error('Sign out failed:', error);
            Alert.alert('Sign out failed', 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SettingsPageFrame
      title="Privacy & Account"
      subtitle="Manage your login, data, and account safety."
    >
      <SettingsCard>
        <SettingsSectionLabel>Account</SettingsSectionLabel>
        <View style={styles.summaryRow}>
          <View style={styles.avatar}>
            <UserCircle2 size={18} color={colors.base} />
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.summaryTitle}>{userProfile?.display_name || 'Guest'}</Text>
            <Text style={styles.summarySubtitle}>{accountStatus}</Text>
          </View>
          <View style={[styles.badge, isGhostAccount ? styles.ghostBadge : styles.savedBadge]}>
            <Text style={styles.badgeText}>{isGhostAccount ? 'GHOST' : 'SAVED'}</Text>
          </View>
        </View>

        <SettingsRow
          icon={<Mail size={18} color="#C9A84C" />}
          title="Email"
          subtitle={userProfile?.email || 'No email saved yet'}
          onPress={isGhostAccount ? () => setShowUpgradeModal(true) : undefined}
          trailing={isGhostAccount ? undefined : <Text style={styles.metaText}>Saved</Text>}
        />
        <SettingsRow
          icon={<Phone size={18} color="#C9A84C" />}
          title="Phone"
          subtitle={userProfile?.phone || 'Optional'}
          onPress={() => router.push('/profile')}
        />
        <SettingsRow
          icon={<Signpost size={18} color="#C9A84C" />}
          title="Manage profile"
          subtitle="Edit your name, avatar color, and phone number"
          onPress={() => router.push('/profile')}
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>Safety</SettingsSectionLabel>
        <SettingsRow
          icon={<Lock size={18} color="#C9A84C" />}
          title="Sign Out"
          subtitle="Leave this account on this device"
          onPress={handleSignOut}
          destructive
        />
        <SettingsRow
          icon={<Trash2 size={18} color="#FF6B6B" />}
          title="Delete account"
          subtitle="This needs a secure backend delete flow"
          onPress={() => setShowDeleteModal(true)}
          destructive
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>Data & privacy</SettingsSectionLabel>
        <SettingsRow
          icon={<ShieldAlert size={18} color="#C9A84C" />}
          title="Privacy policy"
          subtitle="How FestNest handles account and trip data"
          onPress={() => {
            void Linking.openURL('mailto:support@festnest.app?subject=FestNest%20Privacy').catch(() => {
              Alert.alert('Unable to open mail', 'Please email support@festnest.app manually.');
            });
          }}
        />
      </SettingsCard>

      <Modal
        visible={showUpgradeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upgrade account</Text>
              <Pressable onPress={() => setShowUpgradeModal(false)}>
                <X size={24} color={colors.text.mid} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Add an email and password so this account can be recovered on other devices.
            </Text>

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={colors.text.faint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.text.faint}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {upgradeError ? <Text style={styles.errorText}>{upgradeError}</Text> : null}

            <Pressable
              style={[styles.primaryButton, (!email.trim() || !password.trim() || isUpgrading) && styles.primaryButtonDisabled]}
              onPress={handleUpgrade}
              disabled={!email.trim() || !password.trim() || isUpgrading}
            >
              {isUpgrading ? (
                <ActivityIndicator color={colors.base} />
              ) : (
                <Text style={styles.primaryButtonText}>Save Email</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.deleteCard}>
            <Text style={styles.deleteTitle}>Delete account</Text>
            <Text style={styles.deleteBody}>
              The secure backend delete path is not wired yet. This page is ready for the final confirmation flow, but we should not destroy data until the server-side deletion task is in place.
            </Text>
            <Text style={styles.deleteBody}>
              For now, sign out or upgrade your account if you want to keep access later.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => setShowDeleteModal(false)}>
              <Text style={styles.primaryButtonText}>Understood</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SettingsPageFrame>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody: {
    flex: 1,
  },
  summaryTitle: {
    color: colors.text.primary,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
  },
  summarySubtitle: {
    color: colors.text.mid,
    fontSize: typography.size.body,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  ghostBadge: {
    backgroundColor: colors.surface.level3,
  },
  savedBadge: {
    backgroundColor: 'rgba(40, 200, 150, 0.16)',
  },
  badgeText: {
    color: colors.text.primary,
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    letterSpacing: typography.letterSpacing.wide,
  },
  metaText: {
    color: colors.text.mid,
    fontSize: typography.size.body,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.base,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
  },
  modalSubtitle: {
    color: colors.text.mid,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.text.mid,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
  input: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border.medium,
    color: colors.text.primary,
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.sm,
    fontWeight: typography.weight.label,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.base,
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    padding: spacing.xxl,
    justifyContent: 'center',
  },
  deleteCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  deleteTitle: {
    color: colors.text.primary,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.headline,
    marginBottom: spacing.sm,
  },
  deleteBody: {
    color: colors.text.mid,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});
