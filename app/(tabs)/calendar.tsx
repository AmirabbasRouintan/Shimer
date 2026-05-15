// app/calendar.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import JSONPlanner from '../../components/JSONPlanner';
import { getCalendarEvents, addCalendarEvent, deleteCalendarEvent, getDailyPlan, setDailyPlan } from '../activitiesStore';

export default function CalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [events, setEvents] = useState({});
  const [eventTitle, setEventTitle] = useState('');
  const [eventHour, setEventHour] = useState('12');
  const [eventMinute, setEventMinute] = useState('00');
  const [plansForDates, setPlansForDates] = useState<Record<string, any>>({});

  // Handle opening a specific date from planned dates page
  useEffect(() => {
    if (params.openPlanner === 'true' && params.selectedYear && params.selectedMonth && params.selectedDay) {
      const year = parseInt(params.selectedYear as string);
      const month = parseInt(params.selectedMonth as string) - 1;
      const day = parseInt(params.selectedDay as string);
      const targetDate = new Date(year, month, day);
      setCurrentDate(targetDate);
      setSelectedDay(day);
      setShowPlannerModal(true);
    }
  }, [params.openPlanner, params.selectedYear, params.selectedMonth, params.selectedDay]);

  useEffect(() => {
    const saved = getCalendarEvents();
    if (saved) setEvents({ ...saved });
    loadAllPlans();
  }, []);

  const loadAllPlans = () => {
    const allPlans = getDailyPlan() || {};
    setPlansForDates({ ...allPlans });
  };

  const refreshEvents = () => {
    const saved = getCalendarEvents();
    setEvents({ ...saved });
    loadAllPlans();
  };

  const getDateKey = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const hasPlanForDate = (year: number, month: number, day: number): boolean => {
    const dateKey = getDateKey(year, month, day);
    return !!plansForDates[dateKey];
  };

  const saveDailyPlanForDate = (dateKey: string, plan: any) => {
    const allPlans = getDailyPlan() || {};
    if (plan === null) {
      delete allPlans[dateKey];
    } else {
      allPlans[dateKey] = plan;
    }
    setDailyPlan(allPlans);
    loadAllPlans();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleDayPress = (day) => {
    setSelectedDay(day);
  };

  const addEvent = () => {
    if (!eventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    const dateKey = getDateKey(year, month, selectedDay);
    const time = `${eventHour}:${eventMinute}`;
    const newEvent = { title: eventTitle.trim(), time };

    addCalendarEvent(dateKey, newEvent);
    refreshEvents();

    setEventTitle('');
    setEventHour('12');
    setEventMinute('00');
    setShowEventModal(false);
  };

  const getDayEvents = (day) => {
    const dateKey = getDateKey(year, month, day);
    return events[dateKey] || [];
  };

  const handlePlannerSave = (plan: any) => {
    const dateKey = getDateKey(year, month, selectedDay);
    saveDailyPlanForDate(dateKey, plan);
    setShowPlannerModal(false);
    refreshEvents();
  };

  const getPlanForSelectedDate = () => {
    if (!selectedDay) return null;
    const dateKey = getDateKey(year, month, selectedDay);
    return plansForDates[dateKey] || null;
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const today = new Date();
  const isToday = (day) => {
    return today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;
  };

  const hasPlan = getPlanForSelectedDate();

  return (
    <View style={styles.container}>
      {/* Header with integrated month navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.monthNavContainer}>
          <TouchableOpacity onPress={goToPrevMonth}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            const today = new Date();
            setCurrentDate(today);
            setSelectedDay(today.getDate());
          }}>
            <Text style={styles.headerTitle}>{monthNames[month]} {year}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextMonth}>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Day Headers */}
      <View style={styles.weekDays}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.daysGrid}>
        {Array.from({ length: adjustedFirstDay }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dayEvents = getDayEvents(day);
          const hasPlan = hasPlanForDate(year, month, day);
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCell,
                isToday(day) && styles.todayCell,
                selectedDay === day && styles.selectedCell,
              ]}
              onPress={() => handleDayPress(day)}
            >
              <Text style={[
                styles.dayText,
                isToday(day) && styles.todayText,
                selectedDay === day && styles.selectedDayText,
              ]}>{day}</Text>
              {/* Red dot for JSON plan */}
              {hasPlan && (
                <View style={styles.planRedDot} />
              )}
              {/* Event dots */}
              {dayEvents.length > 0 && (
                <View style={styles.dotContainer}>
                  {dayEvents.slice(0, 2).map((_, i) => (
                    <View key={i} style={styles.dot} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Events & Options */}
      {selectedDay && (
        <>
          <ScrollView style={styles.eventsSection} showsVerticalScrollIndicator={false}>
            <Text style={styles.eventsTitle}>
              {monthNames[month]} {selectedDay}, {year}
            </Text>

            {/* JSON Plan Info Message */}
            {hasPlan && (
              <View style={styles.planInfoContainer}>
                <Ionicons name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.planInfoText}>This day has a JSON plan</Text>
              </View>
            )}

            {/* Events List */}
            {getDayEvents(selectedDay).length === 0 ? (
              <Text style={styles.noEvents}>No events for this day</Text>
            ) : (
              getDayEvents(selectedDay).map((event, index) => (
                <View key={index} style={styles.eventRow}>
                  <View style={styles.eventTimeBadge}>
                    <Text style={styles.eventTimeText}>{event.time}</Text>
                  </View>
                  <Text style={styles.eventText}>{event.title}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const dateKey = getDateKey(year, month, selectedDay);
                      deleteCalendarEvent(dateKey, index);
                      // Force immediate update
                      const updatedEvents = getCalendarEvents();
                      setEvents({ ...updatedEvents });
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Extra space for bottom buttons */}
            <View style={{ height: 80 }} />
          </ScrollView>

          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity style={styles.bottomButtonLeft} onPress={() => setShowEventModal(true)}>
              <Ionicons name="add-circle-outline" size={22} color="#aaa" />
              <Text style={styles.bottomButtonText}>Add Event</Text>
            </TouchableOpacity>

            {hasPlan ? (
              <TouchableOpacity style={styles.viewPlanButton} onPress={() => setShowPlannerModal(true)}>
                <Ionicons name="code-slash" size={22} color="#000" />
                <Text style={styles.viewPlanButtonText}>VIEW PLAN</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.bottomButtonRight} onPress={() => setShowPlannerModal(true)}>
                <Ionicons name="code-slash" size={22} color="#aaa" />
                <Text style={styles.bottomButtonText}>JSON Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Add Event Modal */}
      <Modal visible={showEventModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Event</Text>
            <Text style={styles.modalDate}>
              {monthNames[month]} {selectedDay}, {year}
            </Text>

            <TextInput
              style={styles.eventInput}
              placeholder="Event title"
              placeholderTextColor="#555"
              value={eventTitle}
              onChangeText={setEventTitle}
              autoFocus
            />

            <Text style={styles.timeLabel}>Time</Text>

            {/* Time Picker */}
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerColumn}>
                <ScrollView
                  style={styles.timePickerScroll}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={44}
                  decelerationRate="fast"
                >
                  {hours.map(hour => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timePickerItem,
                        eventHour === hour && styles.timePickerItemSelected
                      ]}
                      onPress={() => setEventHour(hour)}
                    >
                      <Text style={[
                        styles.timePickerItemText,
                        eventHour === hour && styles.timePickerItemTextSelected
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timePickerDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>:</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.timePickerColumn}>
                <ScrollView
                  style={styles.timePickerScroll}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={44}
                  decelerationRate="fast"
                >
                  {minutes.map(min => (
                    <TouchableOpacity
                      key={min}
                      style={[
                        styles.timePickerItem,
                        eventMinute === min && styles.timePickerItemSelected
                      ]}
                      onPress={() => setEventMinute(min)}
                    >
                      <Text style={[
                        styles.timePickerItemText,
                        eventMinute === min && styles.timePickerItemTextSelected
                      ]}>
                        {min}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEventModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={addEvent}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* JSON Planner Modal */}
      <Modal visible={showPlannerModal} animationType="slide" onRequestClose={() => setShowPlannerModal(false)}>
        <View style={styles.plannerModalContainer}>
          <View style={styles.plannerModalHeader}>
            <TouchableOpacity onPress={() => setShowPlannerModal(false)}>
              <Text style={styles.plannerModalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.plannerModalTitle}>
              {monthNames[month]} {selectedDay}, {year}
            </Text>
            <View style={{ width: 50 }} />
          </View>
          {selectedDay && (
            <JSONPlanner
              selectedDate={new Date(year, month, selectedDay)}
              initialPlan={getPlanForSelectedDate()}
              onSave={handlePlannerSave}
              onClose={() => setShowPlannerModal(false)}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16,
  },
  monthNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  weekDays: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 8 },
  weekDayText: { flex: 1, color: '#666', fontSize: 12, textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  dayCell: {
    width: '14.28%', height: 52, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4, position: 'relative',
  },
  todayCell: { backgroundColor: '#1a1a1a', borderRadius: 12 },
  selectedCell: { backgroundColor: '#fff', borderRadius: 12 },
  dayText: { color: '#fff', fontSize: 14 },
  todayText: { color: '#fff', fontWeight: 'bold' },
  selectedDayText: { color: '#000', fontWeight: 'bold' },
  planRedDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4444',
  },
  dotContainer: { flexDirection: 'row', gap: 2, position: 'absolute', bottom: 2 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#fff' },
  eventsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  eventsTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  planInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  planInfoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  noEvents: { color: '#666', fontSize: 13, marginBottom: 12 },
  eventRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  eventTimeBadge: {
    backgroundColor: '#1a1a1a', paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6,
  },
  eventTimeText: { color: '#aaa', fontSize: 11, fontWeight: '600' },
  eventText: { color: '#fff', fontSize: 14, flex: 1 },

  // Bottom Action Buttons
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 20,
  },
  bottomButtonLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  bottomButtonRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bottomButtonText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  viewPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  viewPlanButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a', borderRadius: 16,
    padding: 24, width: '85%',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 4 },
  modalDate: { color: '#888', fontSize: 13, marginBottom: 16 },
  eventInput: {
    color: '#fff', fontSize: 15,
    backgroundColor: '#0a0a0a', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, marginBottom: 14,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  timeLabel: { color: '#888', fontSize: 12, marginBottom: 6 },

  // Time Picker Styles
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    marginVertical: 20,
  },
  timePickerColumn: {
    flex: 1,
    margin: 30,
    height: '100%',
  },
  timePickerScroll: {
    height: '100%',
  },
  timePickerItem: {
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerItemSelected: {
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  timePickerItemText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '400',
  },
  timePickerItemTextSelected: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  timePickerDivider: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dividerLine: {
    width: 1.5,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  dividerText: {
    color: '#fff',
    fontSize: 50,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12,
  },
  cancelButton: {
    paddingVertical: 8, paddingHorizontal: 16,
  },
  cancelButtonText: { color: '#888', fontSize: 15 },
  saveButton: {
    backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: { color: '#000', fontSize: 15, fontWeight: '600' },

  // Planner Modal
  plannerModalContainer: { flex: 1, backgroundColor: '#000' },
  plannerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#000',
  },
  plannerModalClose: { color: '#fff', fontSize: 16 },
  plannerModalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
