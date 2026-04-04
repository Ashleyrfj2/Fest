import { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, CircleHelp, LogOut, Shield, User } from 'lucide-react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { colors } from '@/lib/tokens';
import { SettingsCard, SettingsPageFrame, SettingsRow, SettingsSectionLabel } from '@/components/settings/SettingsComponents';

export default function SettingsScreen() {
  const { userProfile, isGhostAccount, signOut } = useAuth();

  const accountLabel = useMemo(() => {
    if (!userProfile) return 'Loading account...';
    return isGhostAccount ? 'Ghost account' : 'Saved account';
  }, [isGhostAccount, userProfile]);

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
    <SettingsPageFrame title="Settings" subtitle="Adjust your account, app behavior, and support options." showBack={false}>
      <SettingsCard>
        <SettingsSectionLabel>Account</SettingsSectionLabel>
        <View style={styles.summaryRow}>
          <View style={styles.avatar}>
            <User size={18} color={colors.base} />
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.summaryTitle}>{userProfile?.display_name || 'Guest'}</Text>
            <Text style={styles.summarySubtitle}>{accountLabel}</Text>
          </View>
        </View>

        <SettingsRow
          icon={<Shield size={18} color={colors.accent.gold} />}
          title="Profile"
          subtitle="Edit your name, avatar color, and phone number"
          onPress={() => router.push('/profile')}
        />

        <SettingsRow
          icon={<Bell size={18} color={colors.accent.gold} />}
          title="Notifications"
          subtitle="Choose which trip updates you want to see"
          onPress={() => router.push('/settings/notifications')}
        />

        <SettingsRow
          icon={<Shield size={18} color={colors.accent.gold} />}
          title="Privacy & Account"
          subtitle="Upgrade email, sign out, and manage account safety"
          onPress={() => router.push('/settings/privacy')}
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>App Preferences</SettingsSectionLabel>
        <SettingsRow
          icon={<CircleHelp size={18} color={colors.accent.gold} />}
          title="Appearance"
          subtitle="Theme, density, and text size"
          onPress={() => router.push('/settings/appearance')}
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>Support</SettingsSectionLabel>
        <SettingsRow
          icon={<CircleHelp size={18} color={colors.accent.gold} />}
          title="Help & Support"
          subtitle="FAQ, contact, and app info"
          onPress={() => router.push('/settings/help')}
        />

        <SettingsRow
          icon={<LogOut size={18} color={colors.accent.gold} />}
          title="Sign Out"
          subtitle="Leave this account on this device"
          onPress={handleSignOut}
          destructive
        />
      </SettingsCard>
    </SettingsPageFrame>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody: {
    flex: 1,
  },
  summaryTitle: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  summarySubtitle: {
    color: colors.text.mid,
    fontSize: 13,
    marginTop: 2,
  },
});