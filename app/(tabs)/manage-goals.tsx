// app/manage-goals.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Sample goals data
const sampleGoals = [
  { id: '1', title: 'Read 12 books', type: 'yearly', progress: 3, target: 12, unit: 'books' },
  { id: '2', title: 'Exercise daily', type: 'daily', progress: 15, target: 30, unit: 'days' },
  { id: '3', title: 'Learn React Native', type: 'monthly', progress: 60, target: 100, unit: '%' },
];

export default function ManageGoals() {
  const router = useRouter();
  const [goals, setGoals] = useState(sampleGoals);

  const handleDeleteGoal = (id: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setGoals(goals.filter(g => g.id !== id))
        }
      ]
    );
  };

  const renderGoal = ({ item }) => (
    <TouchableOpacity
      style={styles.goalCard}
      onPress={() => router.push({ pathname: '/edit-goal', params: { id: item.id, title: item.title } })}
      activeOpacity={0.6}
    >
      <View style={styles.goalRow}>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle}>{item.title}</Text>
          <Text style={styles.goalMeta}>{item.type} • {item.progress}/{item.target} {item.unit}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#555" />
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(item.progress / item.target) * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Goals pussy</Text>
        <TouchableOpacity onPress={() => router.push('/add-new-goal')}>
          <Text style={styles.addButton}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderGoal}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>Tap Add to create your first goal</Text>
          </View>
        }
      />
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
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  goalCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  goalMeta: {
    color: '#888',
    fontSize: 12,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#555',
    fontSize: 14,
    marginTop: 8,
  },
});
