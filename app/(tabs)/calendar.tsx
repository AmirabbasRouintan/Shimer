// app/calendar.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const store = {};

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 9)); // May 2026
  const [selectedDay, setSelectedDay] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState({});
  const [eventTitle, setEventTitle] = useState('');
  const [eventHour, setEventHour] = useState('12');
  const [eventMinute, setEventMinute] = useState('00');
  const [lastTap, setLastTap] = useState(null);

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
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday start

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
    const now = Date.now();
    if (lastTap && (now - lastTap) < 300 && selectedDay === day) {
      // Double tap — open add event modal
      setShowEventModal(true);
    } else {
      // Single tap — just select the day
      setSelectedDay(day);
    }
    setLastTap(now);
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

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const getDayEvents = (day) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events[dateKey] || [];
  };

  const today = new Date();
  const isToday = (day) => {
    return today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrevMonth}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthNames[month]} {year}</Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.weekDays}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.daysGrid}>
        {/* Empty slots before first day */}
        {Array.from({ length: adjustedFirstDay }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}

        {/* Actual days */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dayEvents = getDayEvents(day);
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
              ]}>{day}</Text>
              {dayEvents.length > 0 && (
                <View style={styles.dotContainer}>
                  {dayEvents.slice(0, 3).map((_, i) => (
                    <View key={i} style={styles.dot} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Events */}
      {selectedDay && (
        <ScrollView style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>
            Events for {monthNames[month]} {selectedDay}
          </Text>
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
                  <Ionicons name="close-circle" size={20} color="#555" />
                </TouchableOpacity>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.addEventButton} onPress={() => setShowEventModal(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addEventText}>Add Event</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Add Event Modal */}
      <Modal visible={showEventModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Event</Text>
            <Text style={styles.modalDate}>
              {monthNames[month]} {selectedDay}, {year}
            </Text>

            {/* Event Title */}
            <TextInput
              style={styles.eventInput}
              placeholder="Event title"
              placeholderTextColor="#555"
              value={eventTitle}
              onChangeText={setEventTitle}
              autoFocus
            />

            {/* Time Selection */}
            <Text style={styles.timeLabel}>Time</Text>
            <View style={styles.timeSelector}>
              {/* Hour Picker */}
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

              {/* Minute Picker */}
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

            {/* Buttons */}
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
  monthNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 16,
  },
  monthText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  weekDays: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 8 },
  weekDayText: { flex: 1, color: '#888', fontSize: 12, textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  dayCell: {
    width: '14.28%', height: 48, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  todayCell: { backgroundColor: '#1a1a1a', borderRadius: 12 },
  selectedCell: { backgroundColor: '#333', borderRadius: 12 },
  dayText: { color: '#fff', fontSize: 15 },
  todayText: { color: '#4ECDC4', fontWeight: 'bold' },
  dotContainer: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4ECDC4' },
  eventsSection: {
    flex: 1, marginTop: 16, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: '#1a1a1a',
    paddingTop: 16,
  },
  eventsTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  noEvents: { color: '#888', fontSize: 14, marginBottom: 12 },
  eventRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  eventTimeBadge: {
    backgroundColor: '#1a1a1a', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6,
  },
  eventTimeText: { color: '#4ECDC4', fontSize: 13, fontWeight: '600' },
  eventText: { color: '#fff', fontSize: 15, flex: 1 },
  addEventButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 16, paddingVertical: 12,
  },
  addEventText: { color: '#fff', fontSize: 15 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#111', borderRadius: 16,
    padding: 24, width: '85%',
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 4 },
  modalDate: { color: '#888', fontSize: 14, marginBottom: 20 },
  eventInput: {
    color: '#fff', fontSize: 16,
    backgroundColor: '#1a1a1a', paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 10, marginBottom: 16,
  },
  timeLabel: { color: '#888', fontSize: 13, marginBottom: 8 },
  timeSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 20,
  },
  timeScroll: {
    height: 120, flex: 1,
    backgroundColor: '#1a1a1a', borderRadius: 10,
  },
  timeItem: {
    paddingVertical: 10, alignItems: 'center',
  },
  timeItemSelected: { backgroundColor: '#333' },
  timeItemText: { color: '#888', fontSize: 16 },
  timeItemTextSelected: { color: '#fff', fontWeight: '600' },
  timeSeparator: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalButtons: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12,
  },
  cancelButton: {
    paddingVertical: 10, paddingHorizontal: 20,
  },
  cancelButtonText: { color: '#888', fontSize: 16 },
  saveButton: {
    backgroundColor: '#4ECDC4', paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
