import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreenSettings() {
  const router = useRouter();
  const [showClock, setShowClock] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home Screen</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionHeader}>DISPLAY OPTIONS</Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="time-outline" size={22} color="#fff" />
            <Text style={styles.rowText}>Show Clock</Text>
          </View>
          <Switch
            value={showClock}
            onValueChange={setShowClock}
            trackColor={{ false: '#333', true: '#4ECDC4' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="checkbox-outline" size={22} color="#fff" />
            <Text style={styles.rowText}>Show Tasks</Text>
          </View>
          <Switch
            value={showTasks}
            onValueChange={setShowTasks}
            trackColor={{ false: '#333', true: '#4ECDC4' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="stats-chart-outline" size={22} color="#fff" />
            <Text style={styles.rowText}>Show Summary</Text>
          </View>
          <Switch
            value={showSummary}
            onValueChange={setShowSummary}
            trackColor={{ false: '#333', true: '#4ECDC4' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="time-outline" size={22} color="#fff" />
            <Text style={styles.rowText}>Show History</Text>
          </View>
          <Switch
            value={showHistory}
            onValueChange={setShowHistory}
            trackColor={{ false: '#333', true: '#4ECDC4' }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.sectionHeader}>LAYOUT</Text>
        <TouchableOpacity style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="grid-outline" size={22} color="#fff" />
            <Text style={styles.rowText}>Widget Layout</Text>
          </View>
          <Text style={styles.valueText}>Default</Text>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="color-palette-outline" size={22} color="#fff" />
            <Text style={styles.rowText}>Theme</Text>
          </View>
          <Text style={styles.valueText}>Dark</Text>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>GOALS</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push('/add-new-goal')}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.rowText}>Add New Goal</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push('/manage-goals')}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="list-outline" size={22} color="#fff" />
            <Text style={styles.rowText}>Manage Goals</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: { color: '#888', fontSize: 13, fontWeight: '600', marginTop: 24, marginBottom: 12, marginLeft: 4 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1a1a', paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 12, marginBottom: 6,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowText: { color: '#fff', fontSize: 16 },
  valueText: { color: '#888', fontSize: 14, marginRight: 8 },
});
