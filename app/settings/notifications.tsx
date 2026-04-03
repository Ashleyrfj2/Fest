import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Bell, CalendarClock, MessageCircle, Settings2, ShoppingBag, Truck } from 'lucide-react-native';
import { SettingsCard, SettingsPageFrame, SettingsSectionLabel, SettingsToggleRow, SettingsRow } from './_components';

export default function NotificationsSettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [tripUpdates, setTripUpdates] = useState(false);
  const [taskReminders, setTaskReminders] = useState(false);
  const [activityUpdates, setActivityUpdates] = useState(false);
  const [supplyUpdates, setSupplyUpdates] = useState(false);
  const [travelUpdates, setTravelUpdates] = useState(false);

  return (
    <SettingsPageFrame
      title="Notifications"
      subtitle="Choose which updates you want to see. These controls are wired in the UI now and can connect to notification permissions later."
    >
      <SettingsCard>
        <SettingsSectionLabel>Notifications</SettingsSectionLabel>
        <SettingsToggleRow
          icon={<Bell size={18} color="#C9A84C" />}
          title="Enable notifications"
          subtitle="Turn all app notifications on or off"
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
        <SettingsToggleRow
          icon={<MessageCircle size={18} color="#C9A84C" />}
          title="Trip updates"
          subtitle="Trip activity, comments, and changes"
          value={tripUpdates}
          onValueChange={setTripUpdates}
          disabled={!notificationsEnabled}
        />
        <SettingsToggleRow
          icon={<CalendarClock size={18} color="#C9A84C" />}
          title="Task reminders"
          subtitle="Chores, reminders, and timing nudges"
          value={taskReminders}
          onValueChange={setTaskReminders}
          disabled={!notificationsEnabled}
        />
        <SettingsToggleRow
          icon={<Settings2 size={18} color="#C9A84C" />}
          title="Activity feed"
          subtitle="When your crew posts or changes plans"
          value={activityUpdates}
          onValueChange={setActivityUpdates}
          disabled={!notificationsEnabled}
        />
        <SettingsToggleRow
          icon={<ShoppingBag size={18} color="#C9A84C" />}
          title="Supply updates"
          subtitle="Claimed or packed supply list items"
          value={supplyUpdates}
          onValueChange={setSupplyUpdates}
          disabled={!notificationsEnabled}
        />
        <SettingsToggleRow
          icon={<Truck size={18} color="#C9A84C" />}
          title="Travel updates"
          subtitle="Vehicle or passenger changes"
          value={travelUpdates}
          onValueChange={setTravelUpdates}
          disabled={!notificationsEnabled}
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>Timing</SettingsSectionLabel>
        <SettingsRow
          icon={<CalendarClock size={18} color="#C9A84C" />}
          title="Reminder timing"
          subtitle="Set how far ahead you want reminders"
          onPress={() => Alert.alert('Coming soon', 'Reminder timing presets will be connected to scheduling later.')}
        />
        <SettingsRow
          icon={<Bell size={18} color="#C9A84C" />}
          title="Quiet hours"
          subtitle="Silence notifications overnight"
          onPress={() => Alert.alert('Coming soon', 'Quiet hours will be added once notification persistence is wired up.')}
        />
      </SettingsCard>

      <Text style={{ color: '#A9A2B4', marginTop: -4, marginBottom: 18 }}>
        These choices are local UI state for now. Notification permissions and server sync can land next.
      </Text>
    </SettingsPageFrame>
  );
}
