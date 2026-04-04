import { Alert, Linking, StyleSheet, Text } from 'react-native';
import { CircleHelp, Mail, MessageSquarePlus, PhoneCall, ShieldCheck } from 'lucide-react-native';
import { SettingsCard, SettingsPageFrame, SettingsRow, SettingsSectionLabel } from '@/components/settings/SettingsComponents';
import { colors, spacing } from '@/lib/tokens';

const SUPPORT_EMAIL = 'support@festnest.app';

function openMail(subject: string) {
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
  void Linking.openURL(url).catch(() => {
    Alert.alert('Unable to open mail', `Please email ${SUPPORT_EMAIL} manually.`);
  });
}

export default function HelpSettingsScreen() {
  return (
    <SettingsPageFrame
      title="Help & Support"
      subtitle="Get answers, send feedback, or reach the team."
    >
      <SettingsCard>
        <SettingsSectionLabel>Support</SettingsSectionLabel>
        <SettingsRow
          icon={<CircleHelp size={18} color="#C9A84C" />}
          title="FAQ"
          subtitle="Common questions and quick answers"
          onPress={() => Alert.alert('Coming soon', 'FAQ content will live here.')}
        />
        <SettingsRow
          icon={<MessageSquarePlus size={18} color="#C9A84C" />}
          title="Share feedback"
          subtitle="Tell us what should be better"
          onPress={() => openMail('FestNest Feedback')}
        />
        <SettingsRow
          icon={<Mail size={18} color="#C9A84C" />}
          title="Report a problem"
          subtitle="Send a message with what went wrong"
          onPress={() => openMail('FestNest Support')}
        />
        <SettingsRow
          icon={<PhoneCall size={18} color="#C9A84C" />}
          title="Contact support"
          subtitle="Email the team directly"
          onPress={() => openMail('FestNest Help')}
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>Resources</SettingsSectionLabel>
        <SettingsRow
          icon={<ShieldCheck size={18} color="#C9A84C" />}
          title="Privacy policy"
          subtitle="How your data is handled"
          onPress={() => Alert.alert('Coming soon', 'Privacy policy content will be added once it is published.')}
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>App Info</SettingsSectionLabel>
        <Text style={styles.infoLabel}>Version</Text>
        <Text style={styles.infoValue}>1.0.0</Text>
        <Text style={styles.infoLabel}>Build</Text>
        <Text style={styles.infoValue}>Expo SDK 55</Text>
      </SettingsCard>

      <Text style={{ color: colors.text.mid, marginTop: -4, marginBottom: spacing.md }}>
        Help is fully usable now; the links can be connected to a support inbox or docs site later.
      </Text>
    </SettingsPageFrame>
  );
}

const styles = StyleSheet.create({
  infoLabel: {
    color: colors.text.mid,
    marginBottom: 2,
  },
  infoValue: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
});
