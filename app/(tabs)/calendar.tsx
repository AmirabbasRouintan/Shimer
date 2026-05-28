// app/calendar.tsx - Fixed minute picker with 0-59
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import JSONPlanner from '../../components/JSONPlanner';
import { getCalendarEvents, addCalendarEvent, deleteCalendarEvent, getDailyPlan, setDailyPlan } from '../activitiesStore';

// Apple-style Scroll Wheel Picker Component
const WheelPicker = ({ value, onValueChange, items }: { value: string; onValueChange: (val: string) => void; items: string[] }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const itemHeight = 44;
  const visibleItems = 3;
  const [selectedIndex, setSelectedIndex] = useState(items.indexOf(value));

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / itemHeight);
    const newIndex = Math.max(0, Math.min(index, items.length - 1));
    if (newIndex !== selectedIndex) {
      setSelectedIndex(newIndex);
      onValueChange(items[newIndex]);
    }
  };

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({
      y: index * itemHeight,
      animated: true,
    });
  };

  useEffect(() => {
    const initialIndex = items.findIndex(i => i === value);
    if (initialIndex !== -1 && initialIndex !== selectedIndex) {
      setSelectedIndex(initialIndex);
      scrollToIndex(initialIndex);
    }
  }, [value]);

  return (
    <View style={styles.wheelPickerContainer}>
      <View style={styles.wheelPickerWrapper}>
        <View style={styles.wheelPickerFadeTop} pointerEvents="none" />
        <View style={styles.wheelPickerFadeBottom} pointerEvents="none" />
        <View style={styles.wheelPickerSelectedIndicator} />
        <ScrollView
          ref={scrollViewRef}
          style={styles.wheelPickerScroll}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScroll}
          onScrollEndDrag={handleScroll}
          contentContainerStyle={{ paddingVertical: ((visibleItems - 1) / 2) * itemHeight }}
        >
          {items.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.wheelPickerItem, { height: itemHeight }]}
              onPress={() => {
                setSelectedIndex(idx);
                onValueChange(item);
                scrollToIndex(idx);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.wheelPickerItemText,
                  selectedIndex === idx && styles.wheelPickerItemTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default function CalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [events, setEvents] = useState({});
  const [eventTitle, setEventTitle] = useState('');

  // Time picker states
  const [eventHour12, setEventHour12] = useState('12');
  const [eventMinute, setEventMinute] = useState('00');
  const [eventAmPm, setEventAmPm] = useState('AM');

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

  const handleDayPress = (day: number) => {
    setSelectedDay(day);
  };

  // Convert 12-hour format to 24-hour format for storage
  const convertTo24Hour = (hour12: string, ampm: string): string => {
    let hour = parseInt(hour12);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return hour.toString().padStart(2, '0');
  };

  const addEvent = () => {
    if (!eventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    const dateKey = getDateKey(year, month, selectedDay!);
    const hour24 = convertTo24Hour(eventHour12, eventAmPm);
    const time = `${hour24}:${eventMinute}`;
    const newEvent = { title: eventTitle.trim(), time };

    addCalendarEvent(dateKey, newEvent);
    refreshEvents();

    // Reset form
    setEventTitle('');
    setEventHour12('12');
    setEventMinute('00');
    setEventAmPm('AM');
    setShowEventModal(false);
  };

  const getDayEvents = (day: number) => {
    const dateKey = getDateKey(year, month, day);
    return events[dateKey] || [];
  };

  const handlePlannerSave = (plan: any) => {
    const dateKey = getDateKey(year, month, selectedDay!);
    saveDailyPlanForDate(dateKey, plan);
    setShowPlannerModal(false);
    refreshEvents();
  };

  const getPlanForSelectedDate = () => {
    if (!selectedDay) return null;
    const dateKey = getDateKey(year, month, selectedDay);
    return plansForDates[dateKey] || null;
  };

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  // Generate minute options (00-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const ampmOptions = ['AM', 'PM'];

  const today = new Date();
  const isToday = (day: number) => {
    return today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;
  };

  const hasPlan = getPlanForSelectedDate();

  // Format time for display
  const getFormattedTime = () => {
    return `${parseInt(eventHour12)}:${eventMinute} ${eventAmPm}`;
  };

  // Reset time picker when modal opens
  const handleOpenModal = () => {
    setEventHour12('12');
    setEventMinute('00');
    setEventAmPm('AM');
    setEventTitle('');
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
              {hasPlan && (
                <View style={styles.planRedDot} />
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

            {hasPlan && (
              <View style={styles.planInfoContainer}>
                <Ionicons name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.planInfoText}>This day has a JSON plan</Text>
              </View>
            )}

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
                      const updatedEvents = getCalendarEvents();
                      setEvents({ ...updatedEvents });
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))
            )}

            <View style={{ height: 80 }} />
          </ScrollView>

          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity
              style={styles.bottomButtonLeft}
              onPress={() => {
                handleOpenModal();
                setShowEventModal(true);
              }}
            >
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

      {/* Apple Style Add Event Modal with 3-column picker */}
      <Modal visible={showEventModal} transparent animationType="slide" onRequestClose={() => setShowEventModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.appleEventModal}>
            {/* Header */}
            <View style={styles.appleModalHeader}>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Text style={styles.appleModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.appleModalTitle}>New Event</Text>
              <TouchableOpacity onPress={addEvent}>
                <Text style={styles.appleModalAdd}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Date Display */}
            <View style={styles.appleDateContainer}>
              <Text style={styles.appleDateText}>
                {monthNames[month]} {selectedDay}, {year}
              </Text>
            </View>

            {/* Event Title Input */}
            <View style={styles.appleInputContainer}>
              <TextInput
                style={styles.appleEventInput}
                placeholder="Event Title"
                placeholderTextColor="#888"
                value={eventTitle}
                onChangeText={setEventTitle}
                autoFocus
              />
            </View>

            {/* Time Display */}
            <View style={styles.appleTimeDisplay}>
              <Text style={styles.appleTimeDisplayText}>{getFormattedTime()}</Text>
            </View>

            {/* Divider */}
            <View style={styles.appleDivider} />

            {/* Three-Column Wheel Pickers for Hour, Minute, AM/PM */}
            <View style={styles.appleWheelContainer}>
              {/* Hour Picker (1-12) */}
              <WheelPicker
                value={eventHour12}
                onValueChange={setEventHour12}
                items={hourOptions}
              />

              {/* Minute Picker (00-59) - NOW FULL RANGE */}
              <WheelPicker
                value={eventMinute}
                onValueChange={setEventMinute}
                items={minuteOptions}
              />

              {/* AM/PM Picker */}
              <WheelPicker
                value={eventAmPm}
                onValueChange={setEventAmPm}
                items={ampmOptions}
              />
            </View>

            {/* Divider */}
            <View style={styles.appleDivider} />

            {/* Preset Time Buttons */}
            <View style={styles.applePresetsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.applePresetsScroll}
                contentContainerStyle={styles.applePresetsContainer}
              >
                {[
                  {
                    label: "Now", getValue: () => {
                      const now = new Date();
                      let hour = now.getHours();
                      const minute = now.getMinutes().toString().padStart(2, '0');
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      let hour12 = hour % 12;
                      if (hour12 === 0) hour12 = 12;
                      return { hour: hour12.toString().padStart(2, '0'), minute, ampm };
                    }
                  },
                  { label: "9:00 AM", hour: "09", minute: "00", ampm: "AM" },
                  { label: "12:00 PM", hour: "12", minute: "00", ampm: "PM" },
                  { label: "3:00 PM", hour: "03", minute: "00", ampm: "PM" },
                  { label: "6:00 PM", hour: "06", minute: "00", ampm: "PM" },
                  { label: "9:00 PM", hour: "09", minute: "00", ampm: "PM" },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      styles.applePresetButton,
                      eventHour12 === preset.hour &&
                      eventMinute === preset.minute &&
                      eventAmPm === preset.ampm &&
                      styles.applePresetButtonSelected,
                    ]}
                    onPress={() => {
                      if (preset.label === "Now") {
                        const { hour, minute, ampm } = preset.getValue();
                        setEventHour12(hour);
                        setEventMinute(minute);
                        setEventAmPm(ampm);
                      } else if (preset.hour && preset.minute && preset.ampm) {
                        setEventHour12(preset.hour);
                        setEventMinute(preset.minute);
                        setEventAmPm(preset.ampm);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.applePresetButtonText,
                        eventHour12 === preset.hour &&
                        eventMinute === preset.minute &&
                        eventAmPm === preset.ampm &&
                        styles.applePresetButtonTextSelected,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* JSON Planner Modal */}
      <Modal visible={showPlannerModal} animationType="slide" onRequestClose={() => setShowPlannerModal(false)}>
        <View style={styles.plannerModalContainer}>
          <View style={styles.plannerModalHeader}>
            <TouchableOpacity
              style={styles.plannerModalCloseButton}
              onPress={() => setShowPlannerModal(false)}
            >
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

  // Apple Style Event Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleEventModal: {
    backgroundColor: '#0f0f11',
    borderRadius: 14,
    padding: 0,
    width: '90%',
    maxWidth: 450,
    overflow: 'hidden',
  },
  appleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#38383a',
  },
  appleModalCancel: {
    color: '#ff3b30',
    fontSize: 17,
    fontWeight: '500',
  },
  appleModalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  appleModalAdd: {
    color: '#007aff',
    fontSize: 17,
    fontWeight: '600',
  },
  appleDateContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1c1c1e',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 10,
  },
  appleDateText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  appleInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  appleEventInput: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#1c1c1e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#38383a',
  },
  appleTimeDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appleTimeDisplayText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 1,
  },
  appleDivider: {
    height: 0.5,
    backgroundColor: '#38383a',
    marginHorizontal: 16,
  },
  appleWheelContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  wheelPickerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  wheelPickerWrapper: {
    height: 132,
    width: '90%',
    position: 'relative',
    overflow: 'hidden',
  },
  wheelPickerScroll: {
    height: 132,
    width: '100%',
  },
  wheelPickerFadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 45,
    backgroundColor: 'rgba(15,15,17,0.95)',
    zIndex: 10,
  },
  wheelPickerFadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 45,
    backgroundColor: 'rgba(15,15,17,0.95)',
    zIndex: 10,
  },
  wheelPickerSelectedIndicator: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(100,100,110,0.1)',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 5,
  },
  wheelPickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelPickerItemText: {
    color: '#555',
    fontSize: 20,
    fontWeight: '500',
  },
  wheelPickerItemTextSelected: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  applePresetsWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopColor: '#38383a',
  },
  applePresetsScroll: {
    marginHorizontal: -4,
  },
  applePresetsContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  applePresetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    marginRight: 8,
  },
  applePresetButtonSelected: {
    backgroundColor: '#007aff',
  },
  applePresetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  applePresetButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

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
  plannerModalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  plannerModalCloseButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
  },
  plannerModalClose: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
