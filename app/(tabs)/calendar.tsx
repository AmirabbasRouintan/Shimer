// app/calendar.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import JSONPlanner from '../../components/JSONPlanner';

const store = {};

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [events, setEvents] = useState({});
  const [eventTitle, setEventTitle] = useState('');
  const [eventHour, setEventHour] = useState('12');
  const [eventMinute, setEventMinute] = useState('00');

  useEffect(() => {
    const saved = store['calendar_events'];
    if (saved) setEvents(JSON.parse(saved));
  }, []);

  const saveEvents = (newEvents) => {
    setEvents(newEvents);
    store['calendar_events'] = JSON.stringify(newEvents);
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

    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const time = `${eventHour}:${eventMinute}`;
    const newEvent = { title: eventTitle.trim(), time };

    const newEvents = { ...events };
    if (!newEvents[dateKey]) {
      newEvents[dateKey] = [];
    }
    newEvents[dateKey].push(newEvent);
    newEvents[dateKey].sort((a, b) => a.time.localeCompare(b.time));

    saveEvents(newEvents);
    setEventTitle('');
    setEventHour('12');
    setEventMinute('00');
    setShowEventModal(false);
  };

  const deleteEvent = (dateKey, index) => {
    const newEvents = { ...events };
    newEvents[dateKey].splice(index, 1);
    if (newEvents[dateKey].length === 0) {
      delete newEvents[dateKey];
    }
    saveEvents(newEvents);
  };

  const deletePlanForDate = () => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this JSON plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            delete store[`daily_plan_${dateKey}`];
            for (let i = 0; i < 100; i++) {
              delete store[`plan_completed_${dateKey}_${i}`];
              delete store[`checklist_completed_${dateKey}_${i}`];
            }
            Alert.alert('Deleted', 'JSON plan has been deleted');
            setSelectedDay(selectedDay);
          }
        }
      ]
    );
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const getDayEvents = (day) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events[dateKey] || [];
  };

  const getPlanForDay = (day) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return store[`daily_plan_${dateKey}`];
  };

  const getSelectedDate = () => {
    if (!selectedDay) return null;
    return new Date(year, month, selectedDay);
  };

  const today = new Date();
  const isToday = (day) => {
    return today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;
  };

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
          const hasPlan = getPlanForDay(day);
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCell,
                isToday(day) && styles.todayCell,
                selectedDay === day && styles.selectedCell,
                hasPlan && styles.hasPlanCell,
              ]}
              onPress={() => handleDayPress(day)}
            >
              <Text style={[
                styles.dayText,
                isToday(day) && styles.todayText,
                selectedDay === day && styles.selectedDayText,
                hasPlan && styles.hasPlanText,
              ]}>{day}</Text>
              {hasPlan && (
                <View style={styles.planIndicator}>
                  <Ionicons name="code-slash" size={8} color="#fff" />
                </View>
              )}
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
                      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                      deleteEvent(dateKey, index);
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color="#555" />
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

            <TouchableOpacity style={styles.bottomButtonRight} onPress={() => setShowPlannerModal(true)}>
              <Ionicons name="code-slash" size={22} color="#aaa" />
              <Text style={styles.bottomButtonText}>
                {getPlanForDay(selectedDay) ? 'Edit Plan' : 'JSON Plan'}
              </Text>
            </TouchableOpacity>
          </View>

          {getPlanForDay(selectedDay) && (
            <View style={[styles.bottomButtonsContainer, { justifyContent: 'center' }]}>
              <TouchableOpacity style={styles.deleteButton} onPress={deletePlanForDate}>
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                <Text style={styles.deleteButtonText}>Delete JSON Plan</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )
      }

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
            <View style={styles.timeSelector}>
              <ScrollView style={styles.timeScroll}>
                {hours.map(hour => (
                  <TouchableOpacity
                    key={hour}
                    style={[styles.timeItem, eventHour === hour && styles.timeItemSelected]}
                    onPress={() => setEventHour(hour)}
                  >
                    <Text style={[styles.timeItemText, eventHour === hour && styles.timeItemTextSelected]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.timeSeparator}>:</Text>

              <ScrollView style={styles.timeScroll}>
                {minutes.map(min => (
                  <TouchableOpacity
                    key={min}
                    style={[styles.timeItem, eventMinute === min && styles.timeItemSelected]}
                    onPress={() => setEventMinute(min)}
                  >
                    <Text style={[styles.timeItemText, eventMinute === min && styles.timeItemTextSelected]}>
                      {min}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
              {getSelectedDate()?.toLocaleDateString()}
            </Text>
            <View style={{ width: 50 }} />
          </View>
          {getSelectedDate() && (
            <JSONPlanner
              selectedDate={getSelectedDate()}
              onClose={() => setShowPlannerModal(false)}
            />
          )}
        </View>
      </Modal>
    </View >
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
  hasPlanCell: { borderWidth: 1, borderColor: '#fff', borderRadius: 12 },
  dayText: { color: '#fff', fontSize: 14 },
  todayText: { color: '#fff', fontWeight: 'bold' },
  selectedDayText: { color: '#000', fontWeight: 'bold' },
  hasPlanText: { color: '#fff' },
  planIndicator: { position: 'absolute', top: 2, right: 2 },
  dotContainer: { flexDirection: 'row', gap: 2, position: 'absolute', bottom: 2 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#fff' },
  eventsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  eventsTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
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

  // Bottom Action Buttons - No background, side by side, no top line
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 17,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    width: '100%',
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
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
  timeSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 20,
  },
  timeScroll: {
    height: 100, flex: 1,
    backgroundColor: '#0a0a0a', borderRadius: 10,
  },
  timeItem: {
    paddingVertical: 8, alignItems: 'center',
  },
  timeItemSelected: { backgroundColor: '#2a2a2a' },
  timeItemText: { color: '#888', fontSize: 14 },
  timeItemTextSelected: { color: '#fff', fontWeight: '600' },
  timeSeparator: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#000',
  },
  plannerModalClose: { color: '#fff', fontSize: 16 },
  plannerModalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
