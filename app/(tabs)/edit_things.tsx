// app/edit_things.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Activity {
  id: string;
  name: string;
  icon: string;
  color: string;
  keepScreenOn: boolean;
  pomodoro: number;
  goals: string;
  timerHints: string;
  checklists: string[];
  shortcuts: string[];
}

const defaultActivities: Activity[] = [
  { id: '1', name: 'University', icon: 'school-outline', color: '#DDA0DD', keepScreenOn: false, pomodoro: 25, goals: 'Study 4 hours', timerHints: '', checklists: [], shortcuts: [] },
  { id: '2', name: 'Book', icon: 'book-outline', color: '#98D8C8', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
  { id: '3', name: 'Movies', icon: 'film-outline', color: '#45B7D1', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
  { id: '4', name: 'Meditation', icon: 'leaf-outline', color: '#96CEB4', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
  { id: '5', name: 'Work', icon: 'briefcase-outline', color: '#96CEB4', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
  { id: '6', name: 'Hobby', icon: 'heart-outline', color: '#4ECDC4', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
  { id: '7', name: 'Personal development', icon: 'star-outline', color: '#FFEAA7', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
  { id: '8', name: 'Exercises/Health', icon: 'fitness-outline', color: '#FF6B6B', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
  { id: '9', name: 'Walk', icon: 'walk-outline', color: '#F7B731', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
  { id: '10', name: 'Getting ready', icon: 'bed-outline', color: '#FF9F4A', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
  { id: '11', name: 'Sleep/Rest', icon: 'bed-outline', color: '#E8635E', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
  { id: '12', name: 'Other', icon: 'folder-outline', color: '#6C5CE7', keepScreenOn: false, pomodoro: 25, goals: '', timerHints: '', checklists: [], shortcuts: [] },
];

export default function EditThingsScreen() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>(defaultActivities);

  const moveUp = (index: number) => {
    if (index > 0) {
      const newActivities = [...activities];
      [newActivities[index - 1], newActivities[index]] = [newActivities[index], newActivities[index - 1]];
      setActivities(newActivities);
    }
  };

  const moveDown = (index: number) => {
    if (index < activities.length - 1) {
      const newActivities = [...activities];
      [newActivities[index], newActivities[index + 1]] = [newActivities[index + 1], newActivities[index]];
      setActivities(newActivities);
    }
  };

  const renderActivityItem = ({ item, index }: { item: Activity; index: number }) => (
    <TouchableOpacity
      style={styles.activityRow}
      onPress={() => router.push({
        pathname: '/edit-activity-page',
        params: {
          id: item.id,
          name: item.name,
          icon: item.icon,
          color: item.color,
          keepScreenOn: String(item.keepScreenOn),
          pomodoro: String(item.pomodoro),
          goals: item.goals,
          timerHints: item.timerHints,
        }
      })}
      activeOpacity={0.7}
    >
      <View style={styles.dragHandle}>
        <Ionicons name="menu-outline" size={18} color="#666" />
      </View>
      <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
      <Ionicons name={item.icon} size={20} color="#888" style={styles.activityIcon} />
      <Text style={styles.activityName} numberOfLines={1}>{item.name}</Text>
      <View style={styles.rowActions}>
        <TouchableOpacity
          onPress={() => moveUp(index)}
          style={styles.actionButton}
          disabled={index === 0}
        >
          <Ionicons name="arrow-up" size={18} color={index === 0 ? '#333' : '#888'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => moveDown(index)}
          style={styles.actionButton}
          disabled={index === activities.length - 1}
        >
          <Ionicons name="arrow-down" size={18} color={index === activities.length - 1 ? '#333' : '#888'} />
        </TouchableOpacity>
        <Ionicons name="create-outline" size={18} color="#888" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Activities</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.doneButton}>Done</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/add-activity-page')}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.addButtonText}>Add New Activity</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    paddingTop: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  dragHandle: {
    marginRight: 10,
  },
  colorIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityName: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 2,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
