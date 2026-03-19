/**
 * Database Test Page
 * Test user registration to verify Supabase connection
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';

const AVATAR_COLORS = [
  '#28C896', // Green
  '#C9A84C', // Gold
  '#B47AFF', // Violet
  '#F280B0', // Pink
  '#6D30CC', // Purple
  '#12785A', // Teal
  '#E5C96E', // Yellow
  '#C42070', // Magenta
];

export default function TestDbScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const handleCreateUser = async () => {
    if (!displayName.trim()) {
      setResult({ type: 'error', message: 'Display name is required' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Insert new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          display_name: displayName.trim(),
          avatar_color: selectedColor,
          email: email.trim() || null,
          phone: phone.trim() || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setResult({
        type: 'success',
        message: `User created successfully! ID: ${data.id}`,
      });

      // Clear form
      setDisplayName('');
      setEmail('');
      setPhone('');
      setSelectedColor(AVATAR_COLORS[0]);

      // Fetch updated user list
      await fetchAllUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setResult({
        type: 'error',
        message: error.message || 'Failed to create user',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      setAllUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Try to query the users table
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      setResult({
        type: 'success',
        message: `Connection successful! Database has ${count} users.`,
      });

      // Fetch all users
      await fetchAllUsers();
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setResult({
        type: 'error',
        message: `Connection failed: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Database Test</Text>
        <Text style={styles.subtitle}>Test Supabase connection and create test users</Text>

        {/* Test Connection Button */}
        <Pressable
          style={[styles.button, styles.testButton]}
          onPress={handleTestConnection}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.base} />
          ) : (
            <Text style={styles.buttonText}>Test Connection</Text>
          )}
        </Pressable>

        {/* Result Message */}
        {result && (
          <View
            style={[
              styles.resultBox,
              result.type === 'success' ? styles.successBox : styles.errorBox,
            ]}
          >
            <Text
              style={[
                styles.resultText,
                result.type === 'success' ? styles.successText : styles.errorText,
              ]}
            >
              {result.type === 'success' ? '✅ ' : '❌ '}
              {result.message}
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formLabel}>Create Test User</Text>

          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter display name"
              placeholderTextColor={colors.text.dim}
            />
          </View>

          {/* Avatar Color */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Avatar Color</Text>
            <View style={styles.colorGrid}>
              {AVATAR_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (optional)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="user@example.com"
              placeholderTextColor={colors.text.dim}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 234 567 8900"
              placeholderTextColor={colors.text.dim}
              keyboardType="phone-pad"
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={[styles.button, styles.submitButton]}
            onPress={handleCreateUser}
            disabled={loading || !displayName.trim()}
          >
            {loading ? (
              <ActivityIndicator color={colors.base} />
            ) : (
              <Text style={styles.buttonText}>Create User</Text>
            )}
          </Pressable>
        </View>

        {/* User List */}
        {allUsers.length > 0 && (
          <View style={styles.userList}>
            <Text style={styles.formLabel}>Recent Users ({allUsers.length})</Text>
            {allUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View
                  style={[styles.userAvatar, { backgroundColor: user.avatar_color }]}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.display_name}</Text>
                  {user.email && <Text style={styles.userDetail}>📧 {user.email}</Text>}
                  {user.phone && <Text style={styles.userDetail}>📱 {user.phone}</Text>}
                  <Text style={styles.userDetail}>
                    ID: {user.id.substring(0, 8)}...
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionsText}>
            1. Click "Test Connection" to verify database is accessible
          </Text>
          <Text style={styles.instructionsText}>
            2. Fill in display name (required)
          </Text>
          <Text style={styles.instructionsText}>
            3. Select an avatar color
          </Text>
          <Text style={styles.instructionsText}>
            4. Add email/phone (optional)
          </Text>
          <Text style={styles.instructionsText}>
            5. Click "Create User" to insert into database
          </Text>
          <Text style={styles.instructionsText}>
            6. Check recent users list below
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: spacing.lg,
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
    color: colors.text.dim,
    marginBottom: spacing.xl,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  testButton: {
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    marginBottom: spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.accent.gold,
    marginTop: spacing.lg,
  },
  buttonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  resultBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  successBox: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
  },
  errorBox: {
    backgroundColor: colors.danger + '20',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  resultText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
  },
  successText: {
    color: colors.success,
  },
  errorText: {
    color: colors.danger,
  },
  form: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  formLabel: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.size.body,
    color: colors.text.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.accent.gold,
    borderWidth: 3,
  },
  userList: {
    marginBottom: spacing.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userDetail: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    marginBottom: 2,
  },
  instructions: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  instructionsTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  instructionsText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
});
