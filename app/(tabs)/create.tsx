import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/lib/tokens';

export default function CreateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Trip</Text>
      <Text style={styles.subtitle}>Start planning your next festival adventure</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
  },
});
