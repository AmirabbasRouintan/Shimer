import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const hours = Array.from({ length: 24 }, (_, i) => i);

export default function DayStartScreen() {
  const router = useRouter();
  const [selectedHour, setSelectedHour] = useState(0);

  const formatHour = (h) => {
    return h.toString().padStart(2, '0') + ':00';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Day Start</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {hours.map((hour) => (
          <TouchableOpacity
            key={hour}
            style={styles.hourRow}
            onPress={() => setSelectedHour(hour)}
          >
            <Text style={[
              styles.hourText,
              selectedHour === hour && styles.hourTextSelected
            ]}>
              {formatHour(hour)}
            </Text>
            {selectedHour === hour && (
              <Ionicons name="checkmark" size={22} color="#4ECDC4" />
            )}
          </TouchableOpacity>
        ))}
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
  cancelText: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  hourRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  hourText: { color: '#888', fontSize: 18 },
  hourTextSelected: { color: '#fff', fontWeight: '600' },
});
