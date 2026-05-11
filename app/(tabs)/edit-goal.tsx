// app/edit-goal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const periodOptions = ['Every Day', 'Every Week', 'Every Month', 'Custom'];

export default function EditGoal() {
  const router = useRouter();
  const { id, title: initialTitle } = useLocalSearchParams();

  const [goalTitle, setGoalTitle] = useState(initialTitle || 'Owasp zero');
  const [trackEntireActivity, setTrackEntireActivity] = useState(true);
  const [period, setPeriod] = useState('Every Day');
  const [duration, setDuration] = useState('2h');
  const [finishedEmoji, setFinishedEmoji] = useState('😊');
  const [timerOnBarPressed, setTimerOnBarPressed] = useState(false);
  const [restOfBar, setRestOfBar] = useState('');
  const [checklists, setChecklists] = useState('None');
  const [shortcuts, setShortcuts] = useState('None');

  const handleSave = () => {
    Alert.alert('Saved', 'Goal updated successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  const SettingRow = ({ label, value, onPress, rightElement }: any) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {rightElement ? rightElement : <Text style={styles.settingValue}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={18} color="#555" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Goal</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.headerDone}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Goal Title */}
        <TextInput
          style={styles.titleInput}
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="Goal title"
          placeholderTextColor="#555"
        />

        {/* Track Entire Activity */}
        <SettingRow
          label="Track Entire Activity"
          rightElement={
            <Switch
              value={trackEntireActivity}
              onValueChange={setTrackEntireActivity}
              trackColor={{ false: '#333', true: '#4ECDC4' }}
              thumbColor="#fff"
            />
          }
        />

        {/* Period */}
        <SettingRow
          label="Period"
          value={period}
          onPress={() => {
            Alert.alert('Select Period', '', periodOptions.map(opt => ({
              text: opt, onPress: () => setPeriod(opt)
            })));
          }}
        />

        {/* Duration */}
        <SettingRow
          label="Duration"
          value={duration}
          onPress={() => {
            Alert.alert('Set Duration', '', [
              { text: '30 min', onPress: () => setDuration('30 min') },
              { text: '1h', onPress: () => setDuration('1h') },
              { text: '2h', onPress: () => setDuration('2h') },
              { text: 'Custom', onPress: () => setDuration('Custom') },
            ]);
          }}
        />

        {/* Finished Emoji */}
        <SettingRow
          label="Finished Emoji"
          value={finishedEmoji}
          onPress={() => {
            Alert.alert('Choose Emoji', '', [
              { text: '😊', onPress: () => setFinishedEmoji('😊') },
              { text: '🎉', onPress: () => setFinishedEmoji('🎉') },
              { text: '🏆', onPress: () => setFinishedEmoji('🏆') },
              { text: '⭐', onPress: () => setFinishedEmoji('⭐') },
            ]);
          }}
        />

        {/* Timer on Bar Pressed */}
        <SettingRow
          label="TIMER ON BAR PRESSED"
          rightElement={
            <Switch
              value={timerOnBarPressed}
              onValueChange={setTimerOnBarPressed}
              trackColor={{ false: '#333', true: '#4ECDC4' }}
              thumbColor="#fff"
            />
          }
        />

        {/* Rest of Bar */}
        <SettingRow
          label="Rest of Bar"
          value={restOfBar || "Not set"}
          onPress={() => {
            Alert.alert('Rest of Bar Action', '', [
              { text: 'Do nothing', onPress: () => setRestOfBar('Do nothing') },
              { text: 'Show summary', onPress: () => setRestOfBar('Show summary') },
              { text: 'Reset timer', onPress: () => setRestOfBar('Reset timer') },
            ]);
          }}
        />

        {/* Checklists */}
        <SettingRow
          label="Checklists"
          value={checklists}
          onPress={() => router.push('/goal-checklists')}
        />

        {/* Shortcuts */}
        <SettingRow
          label="Shortcuts"
          value={shortcuts}
          onPress={() => router.push('/goal-shortcuts')}
        />

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Goal</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerCancel: {
    color: '#fff',
    fontSize: 17,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerDone: {
    color: '#4ECDC4',
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleInput: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    backgroundColor: '#0a0a0a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    color: '#888',
    fontSize: 15,
  },
  deleteButton: {
    marginTop: 30,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B30',
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});
