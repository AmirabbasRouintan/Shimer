// app/(tabs)/things.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const iconOptions = [
  'folder-outline', 'school-outline', 'book-outline', 'film-outline',
  'leaf-outline', 'briefcase-outline', 'heart-outline', 'fitness-outline',
  'walk-outline', 'bed-outline', 'cafe-outline', 'musical-notes-outline',
  'game-controller-outline', 'laptop-outline', 'cart-outline',
  'airplane-outline', 'home-outline', 'camera-outline', 'pencil-outline',
  'calendar-outline', 'time-outline', 'star-outline', 'flame-outline',
];

const activityColors: Record<string, string> = {
  'University': '#DDA0DD',
  'Book': '#98D8C8',
  'Movies': '#45B7D1',
  'Meditation': '#96CEB4',
  'Work': '#96CEB4',
  'Hobby': '#4ECDC4',
  'Personal development': '#FFEAA7',
  'Exercises/Health': '#FF6B6B',
  'Walk': '#F7B731',
  'Getting ready': '#FF9F4A',
  'Sleep/Rest': '#E8635E',
  'Other': '#6C5CE7',
};

const defaultCategories = [
  'University', 'Book', 'Movies', 'Meditation', 'Work',
  'Hobby', 'Personal development', 'Exercises/Health', 'Walk',
  'Getting ready', 'Sleep/Rest', 'Other',
];

export default function ThingsScreen() {
  const router = useRouter();
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder-outline');
  const [selectedColor, setSelectedColor] = useState('#6C5CE7');
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const [categoriesList, setCategoriesList] = useState(defaultCategories);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#98D8C8', '#F7B731', '#FF9F4A', '#E8635E', '#6C5CE7', '#A8E6CF',
  ];

  const addActivity = () => {
    if (!newActivityName.trim()) {
      Alert.alert('Required', 'Please enter an activity name.');
      return;
    }
    if (categoriesList.includes(newActivityName.trim())) {
      Alert.alert('Duplicate', 'This activity already exists.');
      return;
    }
    setCategoriesList([...categoriesList, newActivityName.trim()]);
    setNewActivityName('');
    setSelectedIcon('folder-outline');
    setSelectedColor('#6C5CE7');
    setKeepScreenOn(false);
    setShowNewActivity(false);
  };

  const getActivityColor = (activityName: string) => {
    return activityColors[activityName] || '#6C5CE7';
  };

  const getActivityIcon = (activityName: string) => {
    const iconMap: Record<string, string> = {
      'University': 'school-outline',
      'Book': 'book-outline',
      'Movies': 'film-outline',
      'Meditation': 'leaf-outline',
      'Work': 'briefcase-outline',
      'Hobby': 'heart-outline',
      'Personal development': 'star-outline',
      'Exercises/Health': 'fitness-outline',
      'Walk': 'walk-outline',
      'Getting ready': 'bed-outline',
      'Sleep/Rest': 'bed-outline',
    };
    return iconMap[activityName] || 'folder-outline';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activities</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {categoriesList.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.row}
            onLongPress={() => router.push({ pathname: '/edit-activity', params: { name: item } })}
          >
            <View style={[styles.colorIndicator, { backgroundColor: getActivityColor(item) }]} />
            <Ionicons name={getActivityIcon(item)} size={20} color="#888" style={styles.rowIcon} />
            <Text style={styles.rowText}>{item}</Text>
            <Ionicons name="chevron-forward" size={18} color="#333" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom bar – Summary & History navigate to separate pages */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <TouchableOpacity style={styles.bottomTab} onPress={() => router.push('/summary')}>
            <Ionicons name="pie-chart-outline" size={18} color="#888" />
            <Text style={styles.bottomTabText}>Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomTab} onPress={() => router.push('/history')}>
            <Ionicons name="time-outline" size={18} color="#888" />
            <Text style={styles.bottomTabText}>History</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit_things')}>
          <Ionicons name="create-outline" size={20} color="#888" />
          <Text style={styles.bottomTabText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* ... (new activity modal and icon/color pickers remain unchanged – keep them as before) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  list: { flex: 1, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    marginBottom: 6,
  },
  colorIndicator: { width: 4, height: 32, borderRadius: 2, marginRight: 12 },
  rowIcon: { marginRight: 12 },
  rowText: { color: '#fff', fontSize: 15, flex: 1 },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 5, margin: 10, borderTopColor: '#1a1a1a',
  },
  bottomLeft: { flexDirection: 'row', gap: 24 },
  bottomTab: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bottomTabText: { color: '#666', fontSize: 15 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // ... (rest of modal styles – copy them from the previous things.tsx)
});
