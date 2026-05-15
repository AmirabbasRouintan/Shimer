// app/planned-dates.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getDailyPlan, setDailyPlan } from '../activitiesStore';
import { shadcn } from '../../constants/components-theme';

// Swipeable Row Component
const SwipeablePlanRow = ({ item, onDelete, onPress }: any) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => {
      return Math.abs(gesture.dx) > 5;
    },
    onPanResponderMove: (_, gesture) => {
      if (gesture.dx < 0) {
        translateX.setValue(Math.max(gesture.dx, -70));
      } else if (translateX._value < 0) {
        translateX.setValue(Math.min(translateX._value + gesture.dx, 0));
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -30 || (isSwiped && gesture.dx < 0)) {
        Animated.timing(translateX, {
          toValue: -70,
          duration: 200,
          useNativeDriver: true,
        }).start();
        setIsSwiped(true);
      } else {
        Animated.timing(translateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        setIsSwiped(false);
      }
    },
  });

  const handlePress = () => {
    if (isSwiped) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setIsSwiped(false);
    } else {
      onPress(item.date);
    }
  };

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.date)}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.planCard,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.planCardContent}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={styles.planCardLeft}>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar" size={14} color="#fff" />
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
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Helper function
const formatDisplayDate = (dateKey: string): string => {
  const [year, month, day] = dateKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

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
      .sort((a, b) => b.date.localeCompare(a.date));
    setPlannedDates(dates);
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
      {/* Single Header */}
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
            <SwipeablePlanRow
              key={index}
              item={item}
              onDelete={handleDeletePlan}
              onPress={handleOpenPlan}
            />
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
  swipeContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    zIndex: 1,
    backgroundColor: '#0a0a0a',
  },
  planCardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardLeft: {
    flex: 1,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dateText: {
    color: '#fff',
    fontSize: 12,
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
    marginBottom: 6,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 11,
  },
  deleteButton: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: '#FF453A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.95,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
});
