import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mail, Lock, UserPlus, LogOut, Trash2, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateInviteUrl } from '@/lib/invites/invite-utils';
import { AVATAR_COLORS } from '@/lib/constants/avatarColors';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';
import { Database } from '@/lib/database.types';

type Trip = Database['public']['Tables']['trips']['Row'];

export default function ProfileScreen() {
  const {
    userProfile,
    isGhostAccount,
    updateProfile,
    upgradeToEmailAccount,
    signOut,
  } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].hex);
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isUpgradingEmail, setIsUpgradingEmail] = useState(false);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [memberTrips, setMemberTrips] = useState<Trip[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    setDisplayName(userProfile.display_name ?? '');
    setSelectedColor(userProfile.avatar_color ?? AVATAR_COLORS[0].hex);
    setPhone(userProfile.phone ?? '');
  }, [userProfile]);

  useEffect(() => {
    void loadMemberTrips();
  }, [userProfile?.id]);

  const hasProfileChanges = useMemo(() => {
    if (!userProfile) return false;
    return (
      displayName.trim() !== (userProfile.display_name ?? '') ||
      selectedColor !== (userProfile.avatar_color ?? AVATAR_COLORS[0].hex) ||
      phone.trim() !== (userProfile.phone ?? '')
    );
  }, [displayName, selectedColor, phone, userProfile]);

  async function loadMemberTrips() {
    if (!userProfile) {
      setMemberTrips([]);
      return;
    }

    try {
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('trip_id')
        .eq('user_id', userProfile.id);

      if (membershipError) throw membershipError;

      if (!memberships?.length) {
        setMemberTrips([]);
        return;
      }

      const tripIds = memberships.map((item) => item.trip_id);
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .in('id', tripIds)
        .order('start_date', { ascending: true });

      if (tripsError) throw tripsError;
      setMemberTrips(trips ?? []);
    } catch (error) {
      console.error('Error loading member trips:', error);
      setMemberTrips([]);
    }
  }

  async function handleSaveProfile() {
    if (!displayName.trim()) {
      setProfileError('Please enter a display name.');
      setProfileSuccess('');
      return;
    }

    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);

    try {
      await updateProfile({
        display_name: displayName.trim(),
        avatar_color: selectedColor,
        phone: phone.trim() || null,
      });
      setProfileSuccess('Profile updated.');
    } catch (error) {
      console.error('Profile update failed:', error);
      setProfileError('Could not update profile. Try again.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleEmailUpgrade() {
    if (!email.trim() || !password.trim()) {
      setEmailError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setEmailError('Password must be at least 6 characters.');
      return;
    }

    setEmailError('');
    setIsUpgradingEmail(true);

    try {
      await upgradeToEmailAccount(email.trim(), password);
      setEmail('');
      setPassword('');
      setShowEmailModal(false);
    } catch (error: any) {
      console.error('Email upgrade failed:', error);
      setEmailError(error?.message || 'Could not save email. Try again.');
    } finally {
      setIsUpgradingEmail(false);
    }
  }

  async function handleInviteFriends() {
    if (!memberTrips.length) {
      Alert.alert('No trip to share', 'Create or join a trip first, then share invites from here.');
      return;
    }

    const tripToShare = memberTrips[0];
    const inviteUrl = generateInviteUrl(tripToShare.invite_code);

    setIsInviteLoading(true);
    try {
      await Share.share({
        message: `Join my ${tripToShare.festival_name} trip on FestNest: ${inviteUrl} (Code: ${tripToShare.invite_code})`,
      });
    } catch (error) {
      console.error('Invite share failed:', error);
      Alert.alert('Unable to share', 'Try again in a moment.');
    } finally {
      setIsInviteLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign out?', 'You can sign back in anytime with your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsSigningOut(true);
            await signOut();
            router.replace('/auth/welcome');
          } catch (error) {
            console.error('Sign out failed:', error);
            Alert.alert('Sign out failed', 'Please try again.');
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Manage your account, settings, and trip invites.</Text>

        <View style={styles.identityCard}>
          <View style={[styles.avatarSquare, { backgroundColor: selectedColor }]}>
            <Text style={styles.avatarInitial}>
              {(displayName.trim() || 'G').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.identityBody}>
            <Text style={styles.identityName}>{displayName || 'Guest'}</Text>
            <Text style={styles.identityMeta}>
              {isGhostAccount ? 'Ghost account' : 'Permanent account'}
            </Text>
          </View>
          <View style={[styles.accountTypeBadge, isGhostAccount ? styles.ghostBadge : styles.permanentBadge]}>
            <Text style={styles.accountTypeText}>{isGhostAccount ? 'GHOST' : 'SAVED'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Profile</Text>

          <Text style={styles.inputLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your display name"
            placeholderTextColor={colors.text.faint}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
          />

          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Optional"
            placeholderTextColor={colors.text.faint}
            keyboardType="phone-pad"
            autoCorrect={false}
            maxLength={20}
          />

          <Text style={styles.inputLabel}>Avatar Color</Text>
          <View style={styles.colorGrid}>
            {AVATAR_COLORS.map((color) => {
              const isSelected = selectedColor === color.hex;
              return (
                <TouchableOpacity
                  key={color.hex}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color.hex },
                    isSelected && styles.colorSwatchSelected,
                  ]}
                  onPress={() => setSelectedColor(color.hex)}
                  activeOpacity={0.8}
                >
                  {isSelected ? <View style={styles.colorCheckmark} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
          {profileSuccess ? <Text style={styles.successText}>{profileSuccess}</Text> : null}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!hasProfileChanges || isSavingProfile) && styles.primaryButtonDisabled,
            ]}
            onPress={handleSaveProfile}
            disabled={!hasProfileChanges || isSavingProfile}
            activeOpacity={0.8}
          >
            {isSavingProfile ? (
              <ActivityIndicator color={colors.base} />
            ) : (
              <Text style={styles.primaryButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>

          <View style={styles.infoRow}>
            <Mail size={18} color={colors.text.mid} />
            <View style={styles.infoRowText}>
              <Text style={styles.infoRowTitle}>Email</Text>
              <Text style={styles.infoRowSubtitle}>
                {userProfile?.email || 'No email saved yet'}
              </Text>
            </View>
          </View>

          {isGhostAccount ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowEmailModal(true)}
              activeOpacity={0.8}
            >
              <Lock size={16} color={colors.accent.gold} />
              <Text style={styles.secondaryButtonText}>Upgrade With Email</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleInviteFriends}
            disabled={isInviteLoading}
            activeOpacity={0.8}
          >
            {isInviteLoading ? (
              <ActivityIndicator color={colors.accent.gold} />
            ) : (
              <>
                <UserPlus size={16} color={colors.accent.gold} />
                <Text style={styles.secondaryButtonText}>Invite Friends</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Session</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignOut}
            disabled={isSigningOut}
            activeOpacity={0.8}
          >
            {isSigningOut ? (
              <ActivityIndicator color={colors.accent.gold} />
            ) : (
              <>
                <LogOut size={16} color={colors.accent.gold} />
                <Text style={styles.secondaryButtonText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.dangerButton]}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color={colors.danger} />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showEmailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upgrade Your Account</Text>
              <TouchableOpacity
                onPress={() => setShowEmailModal(false)}
                activeOpacity={0.7}
              >
                <X size={24} color={colors.text.mid} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Add your email and password to keep access across devices.
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

            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!email.trim() || !password.trim() || isUpgradingEmail) &&
                  styles.primaryButtonDisabled,
              ]}
              onPress={handleEmailUpgrade}
              disabled={!email.trim() || !password.trim() || isUpgradingEmail}
              activeOpacity={0.8}
            >
              {isUpgradingEmail ? (
                <ActivityIndicator color={colors.base} />
              ) : (
                <Text style={styles.primaryButtonText}>Save Email</Text>
              )}
            </TouchableOpacity>
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
            <Text style={styles.deleteTitle}>Delete Account</Text>
            <Text style={styles.deleteDescription}>
              Full account deletion is not live in the app yet. This requires a secure backend flow to delete auth credentials and cascade app data.
            </Text>
            <Text style={styles.deleteDescription}>
              For now, contact support or use sign out while we finish the secure delete path.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowDeleteModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 24,
    paddingBottom: 36,
  },
  title: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    marginBottom: spacing.xl,
  },
  identityCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarSquare: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: typography.weight.headline,
    color: colors.base,
  },
  identityBody: {
    flex: 1,
  },
  identityName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  identityMeta: {
    marginTop: 2,
    fontSize: typography.size.body,
    color: colors.text.mid,
  },
  accountTypeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
  },
  ghostBadge: {
    backgroundColor: colors.surface.level3,
  },
  permanentBadge: {
    backgroundColor: 'rgba(40, 200, 150, 0.16)',
  },
  accountTypeText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.wide,
  },
  section: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    letterSpacing: typography.letterSpacing.wide,
    color: colors.text.mid,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border.medium,
    color: colors.text.primary,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.body,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: colors.text.primary,
  },
  colorCheckmark: {
    width: 14,
    height: 14,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: typography.size.body,
    color: colors.danger,
    fontWeight: typography.weight.label,
  },
  successText: {
    marginTop: spacing.sm,
    fontSize: typography.size.body,
    color: colors.success,
    fontWeight: typography.weight.label,
  },
  primaryButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoRowText: {
    flex: 1,
  },
  infoRowTitle: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
  },
  infoRowSubtitle: {
    marginTop: 2,
    color: colors.text.mid,
    fontSize: typography.size.body,
  },
  secondaryButton: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.level2,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryButtonText: {
    color: colors.accent.gold,
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
  },
  dangerButton: {
    borderColor: 'rgba(255, 107, 107, 0.35)',
  },
  dangerButtonText: {
    color: colors.danger,
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
  },
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: typography.size.body,
    color: colors.text.mid,
    marginBottom: spacing.md,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.35)',
    padding: spacing.xl,
  },
  deleteTitle: {
    color: colors.text.primary,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.headline,
    marginBottom: spacing.sm,
  },
  deleteDescription: {
    color: colors.text.mid,
    fontSize: typography.size.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});
