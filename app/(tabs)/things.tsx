// app/things.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { shadcn } from "../../constants/components-theme";
import CustomAlert from "../components/CustomAlert";
import { getActivities, setActivities, subscribe, Activity, setActiveTimer, getActiveTimer, setPendingPauseActivity, clearPendingPauseActivity, getPreBreakTimerData, clearPreBreakTimerData } from "../activitiesStore";

const iconOptions = [
  "folder-outline",
  "school-outline",
  "book-outline",
  "film-outline",
  "leaf-outline",
  "briefcase-outline",
  "heart-outline",
  "fitness-outline",
  "walk-outline",
  "bed-outline",
  "cafe-outline",
  "musical-notes-outline",
  "game-controller-outline",
  "laptop-outline",
  "cart-outline",
  "airplane-outline",
  "home-outline",
  "camera-outline",
  "pencil-outline",
  "calendar-outline",
  "time-outline",
  "star-outline",
  "flame-outline",
];

const colorOptions = [
  "#FF6B6B", "#fff", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
  "#98D8C8", "#F7B731", "#FF9F4A", "#E8635E", "#6C5CE7", "#A8E6CF",
];

// Custom Apple-style Alert Modal Component

// Apple-style Scroll Wheel Picker Component with Fade Overlays
const WheelPicker = ({ value, onValueChange, min, max }: { value: number; onValueChange: (val: number) => void; min: number; max: number }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const itemHeight = 44;
  const visibleItems = 3;
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const [selectedIndex, setSelectedIndex] = useState(value - min);

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
        {/* Top Fade Overlay */}
        <View style={styles.wheelPickerFadeTop} pointerEvents="none" />
        {/* Bottom Fade Overlay */}
        <View style={styles.wheelPickerFadeBottom} pointerEvents="none" />
        {/* Selection Indicator */}
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
                {item.toString().padStart(2, "0")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default function ThingsScreen() {
  const router = useRouter();
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("folder-outline");
  const [selectedColor, setSelectedColor] = useState("#6C5CE7");
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Timer Picker State
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedActivityColor, setSelectedActivityColor] = useState<string>("");
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);

  // Custom Alert States
  const [showReplaceAlert, setShowReplaceAlert] = useState(false);
  const [showInvalidAlert, setShowInvalidAlert] = useState(false);
  const [pendingTimerData, setPendingTimerData] = useState<{ activityName: string; activityColor: string; durationSeconds: number } | null>(null);

  // Subscribe to global store changes
  useEffect(() => {
    const updateList = () => {
      const acts = getActivities();
      setCategoriesList(acts.map(a => a.name));
    };
    updateList();
    const unsubscribe = subscribe(updateList);
    return unsubscribe;
  }, []);

  const addActivity = () => {
    if (!newActivityName.trim()) {
      Alert.alert("Required", "Please enter an activity name.");
      return;
    }
    const current = getActivities();
    if (current.some(a => a.name === newActivityName.trim())) {
      Alert.alert("Duplicate", "This activity already exists.");
      return;
    }

    const newId = (Math.max(...current.map(a => parseInt(a.id)), 0) + 1).toString();
    const newActivity: Activity = {
      id: newId,
      name: newActivityName.trim(),
      icon: selectedIcon,
      color: selectedColor,
      keepScreenOn: keepScreenOn,
      pomodoro: 25,
      goals: "",
      timerHints: "",
      checklists: [],
      shortcuts: [],
    };
    setActivities([...current, newActivity]);
    setNewActivityName("");
    setSelectedIcon("folder-outline");
    setSelectedColor("#6C5CE7");
    setKeepScreenOn(false);
    setShowNewActivity(false);
  };

  const getActivityColor = (activityName: string) => {
    const acts = getActivities();
    const activity = acts.find(a => a.name === activityName);
    if (activity) return activity.color;

    const colorMap: Record<string, string> = {
      University: "#DDA0DD",
      Book: "#98D8C8",
      Movies: "#45B7D1",
      Meditation: "#96CEB4",
      Work: "#96CEB4",
      Hobby: "#fff",
      "Personal development": "#FFEAA7",
      "Exercises/Health": "#FF6B6B",
      Walk: "#F7B731",
      "Getting ready": "#FF9F4A",
      "Sleep/Rest": "#E8635E",
      Other: "#6C5CE7",
    };
    return colorMap[activityName] || "#6C5CE7";
  };

  const getActivityIcon = (activityName: string) => {
    const acts = getActivities();
    const activity = acts.find(a => a.name === activityName);
    if (activity) return activity.icon;

    const iconMap: Record<string, string> = {
      University: "school-outline",
      Book: "book-outline",
      Movies: "film-outline",
      Meditation: "leaf-outline",
      Work: "briefcase-outline",
      Hobby: "heart-outline",
      "Personal development": "star-outline",
      "Exercises/Health": "fitness-outline",
      Walk: "walk-outline",
      "Getting ready": "bed-outline",
      "Sleep/Rest": "bed-outline",
    };
    return iconMap[activityName] || "folder-outline";
  };

  const handleActivityPress = (activityName: string) => {
    setSelectedActivity(activityName);
    setSelectedActivityColor(getActivityColor(activityName));
    setTimerHours(0);
    setTimerMinutes(0);
    setShowTimerPicker(true);
  };

  const startNewTimer = () => {
    if (!pendingTimerData) return;

    setActiveTimer({
      activityName: pendingTimerData.activityName,
      activityColor: pendingTimerData.activityColor,
      durationSeconds: pendingTimerData.durationSeconds,
      startTime: Date.now(),
      userSelectedDuration: pendingTimerData.durationSeconds,
    });
    setShowTimerPicker(false);
    setSelectedActivity(null);
    setShowReplaceAlert(false);
    setPendingTimerData(null);
    router.replace("/");
  };

  const handlePauseAndStart = () => {
    if (!pendingTimerData) return;

    // Use pre-break timer data first (break interval overwrites activeTimerData with 'Break')
    const preBreak = getPreBreakTimerData();
    const currentTimer = preBreak || getActiveTimer();

    if (currentTimer && currentTimer.activityName !== 'Break') {
      setPendingPauseActivity({
        name: currentTimer.activityName,
        color: currentTimer.activityColor,
        remainingSeconds: currentTimer.durationSeconds,
        userDuration: (currentTimer as any).userSelectedDuration,
      });
      clearPreBreakTimerData();
    }

    startNewTimer();
  };

  const handleTimerConfirm = () => {
    const totalMinutes = timerHours * 60 + timerMinutes;
    if (totalMinutes === 0) {
      setShowInvalidAlert(true);
      return;
    }

    const durationSeconds = totalMinutes * 60;
    const activeTimer = getActiveTimer();

    if (activeTimer && activeTimer.activityName !== 'Break') {
      setPendingTimerData({
        activityName: selectedActivity || "",
        activityColor: selectedActivityColor,
        durationSeconds: durationSeconds,
      });
      setShowReplaceAlert(true);
    } else {
      setActiveTimer({
        activityName: selectedActivity || "",
        activityColor: selectedActivityColor,
        durationSeconds: durationSeconds,
        startTime: Date.now(),
        userSelectedDuration: durationSeconds,
      });
      setShowTimerPicker(false);
      setSelectedActivity(null);
      router.replace("/");
    }
  };

  const presets = [
    { label: "5m", mins: 5 },
    { label: "10m", mins: 10 },
    { label: "15m", mins: 15 },
    { label: "25m", mins: 25 },
    { label: "30m", mins: 30 },
    { label: "45m", mins: 45 },
    { label: "1h", mins: 60 },
    { label: "1.5h", mins: 90 },
    { label: "2h", mins: 120 },
  ];

  const totalTimeDisplay = () => {
    const total = timerHours * 3600 + timerMinutes * 60;
    if (total === 0) return "0:00";
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}`;
    }
    return `${mins}:00`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Activities</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.list}>
        {categoriesList.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.row}
            onPress={() => handleActivityPress(item)}
            onLongPress={() =>
              router.push({
                pathname: "/edit-activity-page",
                params: { name: item },
              })
            }
          >
            <View style={[styles.colorIndicator, { backgroundColor: getActivityColor(item) }]} />
            <Ionicons
              name={getActivityIcon(item)}
              size={20}
              color={shadcn.colors.mutedForeground}
              style={styles.rowIcon}
            />
            <Text style={styles.rowText}>{item}</Text>
            <Ionicons name="chevron-forward" size={18} color={shadcn.colors.border} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <TouchableOpacity
            style={styles.bottomTab}
            onPress={() => router.push("/summary")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="pie-chart-outline" size={18} color={shadcn.colors.mutedForeground} />
            <Text style={styles.bottomTabText}>Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomTab}
            onPress={() => router.push("/history")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="time-outline" size={18} color={shadcn.colors.mutedForeground} />
            <Text style={styles.bottomTabText}>History</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push("/edit_things")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="create-outline" size={20} color={shadcn.colors.mutedForeground} />
          <Text style={styles.bottomTabText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Apple Dark Style Timer Picker Modal */}
      <Modal visible={showTimerPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appleTimerModal}>
            {/* Header */}
            <View style={styles.appleTimerHeader}>
              <TouchableOpacity onPress={() => setShowTimerPicker(false)}>
                <Text style={styles.appleTimerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.appleTimerTitle}>Set Timer</Text>
              <TouchableOpacity onPress={handleTimerConfirm}>
                <Text style={styles.appleTimerStart}>Start</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Activity */}
            <View style={styles.appleActivityContainer}>
              <View style={[styles.appleActivityDot, { backgroundColor: selectedActivityColor }]} />
              <Text style={styles.appleActivityName}>{selectedActivity}</Text>
            </View>

            {/* Time Display */}
            <View style={styles.appleTimeDisplay}>
              <Text style={styles.appleTimeDisplayText}>{totalTimeDisplay()}</Text>
            </View>

            {/* Divider */}
            <View style={styles.appleDivider} />

            {/* Wheel Pickers */}
            <View style={styles.appleWheelContainer}>
              <WheelPicker
                value={timerHours}
                onValueChange={setTimerHours}
                min={0}
                max={23}
              />
              <Text style={styles.wheelPickerColon}>:</Text>
              <WheelPicker
                value={timerMinutes}
                onValueChange={setTimerMinutes}
                min={0}
                max={59}
              />
            </View>

            {/* Divider */}
            <View style={styles.appleDivider} />

            {/* Preset Buttons with Fade Effects */}
            <View style={styles.applePresetsWrapper}>
              <View style={styles.presetsContainer}>
                {/* Left Fade Overlay */}
                <View style={styles.presetsFadeLeft} pointerEvents="none" />
                {/* Right Fade Overlay */}
                <View style={styles.presetsFadeRight} pointerEvents="none" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.applePresetsScroll}
                  contentContainerStyle={styles.applePresetsContainer}
                >
                  {presets.map((preset) => (
                    <TouchableOpacity
                      key={preset.mins}
                      style={[
                        styles.applePresetButton,
                        timerHours === Math.floor(preset.mins / 60) &&
                        timerMinutes === preset.mins % 60 &&
                        styles.applePresetButtonSelected,
                      ]}
                      onPress={() => {
                        setTimerHours(Math.floor(preset.mins / 60));
                        setTimerMinutes(preset.mins % 60);
                      }}
                    >
                      <Text
                        style={[
                          styles.applePresetButtonText,
                          timerHours === Math.floor(preset.mins / 60) &&
                          timerMinutes === preset.mins % 60 &&
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
        </View>
      </Modal>

      {/* New Activity Modal */}
      <Modal visible={showNewActivity} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Activity</Text>
            <TextInput
              style={styles.input}
              placeholder="Activity name"
              placeholderTextColor={shadcn.colors.mutedForeground}
              value={newActivityName}
              onChangeText={setNewActivityName}
              autoFocus
            />
            <TouchableOpacity style={styles.optionRow} onPress={() => setShowIconPicker(true)}>
              <Ionicons name={selectedIcon as any} size={24} color={shadcn.colors.foreground} />
              <Text style={styles.optionText}>Choose Icon</Text>
              <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={() => setShowColorPicker(true)}>
              <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
              <Text style={styles.optionText}>Choose Color</Text>
              <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
            </TouchableOpacity>
            <View style={styles.switchRow}>
              <Text style={styles.optionText}>Keep Screen On</Text>
              <Switch
                value={keepScreenOn}
                onValueChange={setKeepScreenOn}
                trackColor={{ false: shadcn.colors.border, true: shadcn.colors.brand }}
                thumbColor={shadcn.colors.foreground}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewActivity(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addActivity}>
                <Text style={styles.saveBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal visible={showIconPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Icon</Text>
            <FlatList
              data={iconOptions}
              numColumns={4}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.iconItem, selectedIcon === item && styles.iconItemSelected]}
                  onPress={() => {
                    setSelectedIcon(item);
                    setShowIconPicker(false);
                  }}
                >
                  <Ionicons
                    name={item as any}
                    size={32}
                    color={selectedIcon === item ? shadcn.colors.foreground : shadcn.colors.mutedForeground}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Color</Text>
            <FlatList
              data={colorOptions}
              numColumns={3}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.colorItem, { backgroundColor: item }, selectedColor === item && styles.colorItemSelected]}
                  onPress={() => {
                    setSelectedColor(item);
                    setShowColorPicker(false);
                  }}
                >
                  {selectedColor === item && <Ionicons name="checkmark" size={24} color="#fff" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Custom Replace Alert */}
      <CustomAlert
        visible={showReplaceAlert}
        title="Timer Already Running"
        message={`"${getActiveTimer()?.activityName}" is currently running.`}
        onConfirm={startNewTimer}
        onCancel={() => {
          setShowReplaceAlert(false);
          setPendingTimerData(null);
        }}
        confirmText="Replace"
        cancelText="Cancel"
        thirdButtonText="Pause & Start"
        onThirdButton={handlePauseAndStart}
      />

      {/* Custom Invalid Time Alert */}
      <CustomAlert
        visible={showInvalidAlert}
        title="Invalid Time"
        message="Please set a timer duration before starting."
        onConfirm={() => setShowInvalidAlert(false)}
        confirmText="OK"
        singleButton={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    width: 60,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 60,
    alignItems: "flex-end",
  },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 20,
    fontWeight: "600",
  },
  list: { flex: 1, paddingHorizontal: 16, marginTop: 23 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 5,
    backgroundColor: shadcn.colors.card,
    borderRadius: shadcn.radius.lg,
    marginBottom: 8,
  },
  colorIndicator: { width: 10, height: 25, borderRadius: 10, marginRight: 20 },
  rowIcon: { marginRight: 8 },
  rowText: { color: shadcn.colors.foreground, fontSize: 15, flex: 1 },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
    margin: 10,
  },
  bottomLeft: { flexDirection: "row", gap: 24 },
  bottomTab: { flexDirection: "row", alignItems: "center", gap: 4 },
  bottomTabText: { color: shadcn.colors.mutedForeground, fontSize: 15 },
  editButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: shadcn.colors.card,
    borderRadius: shadcn.radius.lg,
    padding: 24,
    width: "80%",
  },
  modalTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  input: {
    color: shadcn.colors.foreground,
    backgroundColor: shadcn.colors.background,
    padding: 12,
    borderRadius: shadcn.radius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: shadcn.colors.border,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border,
  },
  optionText: { color: shadcn.colors.foreground, flex: 1, fontSize: 16 },
  colorPreview: { width: 24, height: 24, borderRadius: 12 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: { padding: 12 },
  cancelBtnText: { color: shadcn.colors.mutedForeground, fontSize: 16 },
  saveBtn: {
    backgroundColor: shadcn.colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: shadcn.radius.md,
  },
  saveBtnText: {
    color: shadcn.colors.brandForeground,
    fontWeight: "700",
    fontSize: 16,
  },
  iconItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    margin: 4,
    backgroundColor: shadcn.colors.card,
    borderRadius: shadcn.radius.md,
  },
  iconItemSelected: { backgroundColor: shadcn.colors.accent },
  colorItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  colorItemSelected: { borderWidth: 2, borderColor: shadcn.colors.foreground },

  // Apple Dark Style Timer Modal Styles
  appleTimerModal: {
    backgroundColor: "#0f0f11",
    borderRadius: 14,
    padding: 0,
    width: "90%",
    maxWidth: 400,
    overflow: "hidden",
  },
  appleTimerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#38383a",
  },
  appleTimerCancel: {
    color: "#ff3b30",
    fontSize: 17,
    fontWeight: "500",
  },
  appleTimerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  appleTimerStart: {
    color: "#007aff",
    fontSize: 17,
    fontWeight: "600",
  },
  appleActivityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#1c1c1e",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 10,
  },
  appleActivityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  appleActivityName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "500",
  },
  appleTimeDisplay: {
    alignItems: "center",
    paddingVertical: 20,
  },
  appleTimeDisplayText: {
    color: "#fff",
    fontSize: 52,
    fontWeight: "700",
    letterSpacing: 1,
  },
  appleDivider: {
    height: 0.5,
    backgroundColor: "#38383a",
    marginHorizontal: 16,
  },
  appleWheelContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  wheelPickerContainer: {
    flex: 1,
    alignItems: "center",
  },
  wheelPickerWrapper: {
    height: 132,
    width: "90%",
    position: "relative",
    overflow: "hidden",
  },
  wheelPickerScroll: {
    height: 132,
    width: "100%",
  },
  wheelPickerFadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 45,
    backgroundColor: "rgba(15,15,17,0.95)",
    zIndex: 10,
  },
  wheelPickerFadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 45,
    backgroundColor: "rgba(15,15,17,0.95)",
    zIndex: 10,
  },
  wheelPickerSelectedIndicator: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(100,100,110,0.1)",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    zIndex: 5,
  },
  wheelPickerItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  wheelPickerItemText: {
    color: "#555",
    fontSize: 20,
    fontWeight: "500",
  },
  wheelPickerItemTextSelected: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  wheelPickerColon: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "300",
    marginBottom: 16,
  },
  applePresetsWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopColor: "#38383a",
  },
  presetsContainer: {
    position: "relative",
  },
  presetsFadeLeft: {
    display: "none",
  },
  presetsFadeRight: {
    display: "none",
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
    backgroundColor: "#1c1c1e",
    marginRight: 8,
  },
  applePresetButtonSelected: {
    backgroundColor: "#007aff",
  },
  applePresetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  applePresetButtonTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },

});
