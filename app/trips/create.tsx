/**
 * Create Trip Screen
 * Form to create a new festival trip
 *
 * Flow: Fill form → create trip → navigate to trip dashboard
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateInviteCode, generateInviteExpiry } from '@/lib/invites/invite-utils';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';
import {
  formatFestivalDateRange,
  getFestivalTripOption,
  POPULAR_FESTIVAL_OPTIONS,
} from '@/lib/festivalTripOptions';

export default function CreateTripScreen() {
  const { userProfile } = useAuth();
  const [tripName, setTripName] = useState('');
  const [festivalName, setFestivalName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFestivalSuggestions, setShowFestivalSuggestions] = useState(false);

  const filteredFestivals = POPULAR_FESTIVAL_OPTIONS.filter((festival) =>
    festival.name.toLowerCase().includes(festivalName.toLowerCase())
  );

  function applyFestivalDates(selectedFestivalName: string) {
    const festivalOption = getFestivalTripOption(selectedFestivalName);

    if (!festivalOption) {
      return;
    }

    setFestivalName(festivalOption.name);
    setStartDate(festivalOption.startDate);
    setEndDate(festivalOption.endDate);
  }

  const handleCreateTrip = async () => {
    // Validation
    if (!tripName.trim()) {
      setError('Please enter a trip name');
      return;
    }
    if (!festivalName.trim()) {
      setError('Please enter a festival name');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please enter start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Please enter valid dates (YYYY-MM-DD)');
      return;
    }

    if (start > end) {
      setError('Start date must be before end date');
      return;
    }

    if (!userProfile || !userProfile.id) {
      setError('User profile not loaded. Please try again.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Generate invite code
      const inviteCode = generateInviteCode();
      const inviteExpiry = generateInviteExpiry(null); // Permanent link

      // Create trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          name: tripName.trim(),
          festival_name: festivalName.trim(),
          start_date: startDate,
          end_date: endDate,
          leader_id: userProfile.id,
          invite_code: inviteCode,
          invite_expires_at: inviteExpiry,
        })
        .select()
        .single();

      if (tripError) throw tripError;
      if (!trip) throw new Error('Failed to create trip: no data returned from database');

      // Add creator as leader in group_members
      const { error: memberError } = await supabase.from('group_members').insert({
        user_id: userProfile.id,
        trip_id: trip.id,
        role: 'leader',
        module_permissions: null, // Leader has full access
      });

      if (memberError) throw memberError;

      // Log activity
      await supabase.from('activity_logs').insert({
        trip_id: trip.id,
        user_id: userProfile.id,
        action_type: 'trip_created',
        module: null,
        target_id: trip.id,
        description: `${userProfile.display_name} created this trip`,
      });

      // Navigate to trip dashboard
      router.replace(`/trips/${trip.id}`);
    } catch (err: any) {
      console.error('Trip creation error:', err);
      setError(err.message || 'Failed to create trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
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
          <Text style={styles.title}>Create a trip</Text>
          <Text style={styles.subtitle}>
            Set up your festival adventure and invite your crew
          </Text>
        </View>

        {/* Trip Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Trip Name</Text>
          <TextInput
            style={styles.input}
            value={tripName}
            onChangeText={setTripName}
            placeholder="e.g., Squad's Electric Forest 2026"
            placeholderTextColor={colors.text.dim}
            autoFocus
            maxLength={50}
          />
          <Text style={styles.helperText}>
            Give your trip a name your crew will recognize
          </Text>
        </View>

        {/* Festival Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Festival</Text>
          <View>
            <View style={styles.inputContainer}>
              <MapPin
                size={20}
                color={colors.text.dim}
                strokeWidth={2}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputWithIcon}
                value={festivalName}
                onChangeText={(text) => {
                  setFestivalName(text);
                  setShowFestivalSuggestions(text.length > 0);
                }}
                onFocus={() => setShowFestivalSuggestions(festivalName.length > 0)}
                onBlur={() => setTimeout(() => setShowFestivalSuggestions(false), 200)}
                placeholder="e.g., Electric Forest"
                placeholderTextColor={colors.text.dim}
                maxLength={50}
              />
            </View>

            {/* Festival Suggestions */}
            {showFestivalSuggestions && filteredFestivals.length > 0 && (
              <View style={styles.suggestionsList}>
                {filteredFestivals.slice(0, 5).map((festival) => (
                  <TouchableOpacity
                    key={festival.name}
                    style={styles.suggestionItem}
                    onPress={() => {
                      applyFestivalDates(festival.name);
                      setShowFestivalSuggestions(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{festival.name}</Text>
                    <Text style={styles.suggestionDateText}>
                      {formatFestivalDateRange(festival.startDate, festival.endDate)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Dates</Text>
          <View style={styles.dateRow}>
            <View style={[styles.dateInputContainer, { flex: 1, marginRight: spacing.md }]}>
              <Calendar
                size={20}
                color={colors.text.dim}
                strokeWidth={2}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputWithIcon}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2026-06-19"
                placeholderTextColor={colors.text.dim}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <Text style={styles.dateSeparator}>to</Text>
            <View style={[styles.dateInputContainer, { flex: 1, marginLeft: spacing.md }]}>
              <Calendar
                size={20}
                color={colors.text.dim}
                strokeWidth={2}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputWithIcon}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="2026-06-22"
                placeholderTextColor={colors.text.dim}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          <Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            (!tripName.trim() || !festivalName.trim() || !startDate || !endDate || isLoading) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreateTrip}
          disabled={!tripName.trim() || !festivalName.trim() || !startDate || !endDate || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.base} />
          ) : (
            <Text style={styles.createButtonText}>Create Trip</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          You'll get a shareable invite link to send to your crew
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
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
  input: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
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
  dateInputContainer: {
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
  inputWithIcon: {
    flex: 1,
    paddingVertical: 14,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSeparator: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    marginHorizontal: spacing.sm,
  },
  helperText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    marginTop: spacing.sm,
  },
  suggestionsList: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.medium,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  suggestionText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
  },
  suggestionDateText: {
    marginTop: 2,
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  errorText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.danger,
    marginBottom: spacing.lg,
  },
  createButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  createButtonDisabled: {
    opacity: 0.4,
  },
  createButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  infoText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
  },
});
