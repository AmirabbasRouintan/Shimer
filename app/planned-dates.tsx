// app/planned-dates.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getDailyPlan, setDailyPlan } from './activitiesStore';
import { shadcn } from '../constants/components-theme';

export default function PlannedDatesScreen() {
  const router = useRouter();
  const [plannedDates, setPlannedDates] = useState<{ date: string; plan: any }[]>([]);

  useEffect(() => {
    loadPlannedDates();
  }, []);

  const loadPlannedDates = () => {
    const allPlans = getDailyPlan() || {};
    const dates = Object.keys(allPlans)
      .filter(key => allPlans[key] !== null)
      .map(key => ({
        date: key,
        plan: allPlans[key],
      }))
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort newest first
    setPlannedDates(dates);
  };

  const formatDisplayDate = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeletePlan = (dateKey: string) => {
    Alert.alert(
      'Delete Plan',
      `Delete plan for ${formatDisplayDate(dateKey)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const allPlans = getDailyPlan() || {};
            delete allPlans[dateKey];
            setDailyPlan(allPlans);
            loadPlannedDates();
          }
        }
      ]
    );
  };

  const handleOpenPlan = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-');
    const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    router.push({
      pathname: '/calendar',
      params: {
        openPlanner: 'true',
        selectedYear: year,
        selectedMonth: month,
        selectedDay: day,
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Plans</Text>
        <View style={styles.headerRight} />
      </View>

      {plannedDates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No saved plans</Text>
          <Text style={styles.emptySubtext}>
            Create a JSON plan from the Calendar screen
          </Text>
          <TouchableOpacity
            style={styles.goToCalendarButton}
            onPress={() => router.push('/calendar')}
          >
            <Text style={styles.goToCalendarText}>Go to Calendar →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {plannedDates.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.planCard}
              onPress={() => handleOpenPlan(item.date)}
              activeOpacity={0.7}
            >
              <View style={styles.planCardLeft}>
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar" size={16} color="#fff" />
                  <Text style={styles.dateText}>{formatDisplayDate(item.date)}</Text>
                </View>
                {item.plan.name && (
                  <Text style={styles.planName} numberOfLines={1}>
                    {item.plan.name}
                  </Text>
                )}
                {item.plan.motto && (
                  <Text style={styles.planMotto} numberOfLines={1}>
                    "{item.plan.motto}"
                  </Text>
                )}
                <View style={styles.statsRow}>
                  <View style={styles.statChip}>
                    <Ionicons name="time-outline" size={12} color="#888" />
                    <Text style={styles.statChipText}>
                      {item.plan.schedule?.length || 0} activities
                    </Text>
                  </View>
                  <View style={styles.statChip}>
                    <Ionicons name="checkbox-outline" size={12} color="#888" />
                    <Text style={styles.statChipText}>
                      {item.plan.checklist?.length || 0} tasks
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.planCardRight}>
                <TouchableOpacity
                  onPress={() => handleDeletePlan(item.date)}
                  style={styles.deleteIcon}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    position: 'absolute',
    left: 16,
    top: 60,
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    top: 60,
    width: 60,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
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
    textAlign: 'center',
  },
  goToCalendarButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
  },
  goToCalendarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  planCardLeft: {
    flex: 1,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  planName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  planMotto: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statChipText: {
    color: '#888',
    fontSize: 10,
  },
  planCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteIcon: {
    padding: 4,
  },
});
