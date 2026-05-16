// app/things.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  View
} from "react-native";
import { shadcn } from "../../constants/components-theme";
import { getActivities, setActivities, subscribe, Activity, setActiveTimer, getActiveTimer } from "../activitiesStore";


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
  "flame-outline"
];

const colorOptions = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
  "#98D8C8", "#F7B731", "#FF9F4A", "#E8635E", "#6C5CE7", "#A8E6CF"
];

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
      shortcuts: []
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
      University: "#DDA0DD", Book: "#98D8C8", Movies: "#45B7D1", Meditation: "#96CEB4",
      Work: "#96CEB4", Hobby: "#4ECDC4", "Personal development": "#FFEAA7",
      "Exercises/Health": "#FF6B6B", Walk: "#F7B731", "Getting ready": "#FF9F4A",
      "Sleep/Rest": "#E8635E", Other: "#6C5CE7"
    };
    return colorMap[activityName] || "#6C5CE7";
  };

  const getActivityIcon = (activityName: string) => {
    const acts = getActivities();
    const activity = acts.find(a => a.name === activityName);
    if (activity) return activity.icon;

    const iconMap: Record<string, string> = {
      University: "school-outline", Book: "book-outline", Movies: "film-outline",
      Meditation: "leaf-outline", Work: "briefcase-outline", Hobby: "heart-outline",
      "Personal development": "star-outline", "Exercises/Health": "fitness-outline",
      Walk: "walk-outline", "Getting ready": "bed-outline", "Sleep/Rest": "bed-outline"
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

  // In things.tsx, update the handleTimerConfirm function:

  const handleTimerConfirm = () => {
    const totalMinutes = timerHours * 60 + timerMinutes;
    if (totalMinutes === 0) {
      Alert.alert("Invalid Time", "Please set a timer duration.");
      return;
    }

    const durationSeconds = totalMinutes * 60;
    const activeTimer = getActiveTimer();

    if (activeTimer) {
      Alert.alert(
        "Timer Already Running",
        `"${activeTimer.activityName}" is currently running. Starting a new activity will replace it. Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Replace",
            style: "destructive",
            onPress: () => {
              setActiveTimer({
                activityName: selectedActivity || "",
                activityColor: selectedActivityColor,
                durationSeconds: durationSeconds,
                startTime: Date.now(), // Add start time
              });
              setShowTimerPicker(false);
              setSelectedActivity(null);
              router.replace("/");
            }
          }
        ]
      );
    } else {
      setActiveTimer({
        activityName: selectedActivity || "",
        activityColor: selectedActivityColor,
        durationSeconds: durationSeconds,
        startTime: Date.now(), // Add start time
      });
      setShowTimerPicker(false);
      setSelectedActivity(null);
      router.replace("/");
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

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
                params: { name: item }
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

      {/* Timer Picker Modal */}
      <Modal visible={showTimerPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.timerModalContent}>
            <View style={styles.timerModalHeader}>
              <TouchableOpacity onPress={() => setShowTimerPicker(false)}>
                <Text style={styles.timerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.timerTitle}>Set Timer</Text>
              <TouchableOpacity onPress={handleTimerConfirm}>
                <Text style={styles.timerDoneText}>Start</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectedActivityRow}>
              <View style={[styles.selectedActivityDot, { backgroundColor: selectedActivityColor }]} />
              <Text style={styles.selectedActivityText}>
                {selectedActivity}
              </Text>
            </View>

            <View style={styles.timerPickerRow}>
              {/* Hours Picker */}
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Hours</Text>
                <View style={styles.pickerScroller}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                  >
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.pickerItem,
                          timerHours === hour && styles.pickerItemSelected,
                        ]}
                        onPress={() => setTimerHours(hour)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            timerHours === hour && styles.pickerItemTextSelected,
                          ]}
                        >
                          {formatNumber(hour)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <Text style={styles.timerSeparator}>:</Text>

              {/* Minutes Picker */}
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Minutes</Text>
                <View style={styles.pickerScroller}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                  >
                    {minutes.map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.pickerItem,
                          timerMinutes === minute && styles.pickerItemSelected,
                        ]}
                        onPress={() => setTimerMinutes(minute)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            timerMinutes === minute && styles.pickerItemTextSelected,
                          ]}
                        >
                          {formatNumber(minute)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            <View style={styles.presetTimes}>
              <Text style={styles.presetLabel}>Quick Select</Text>
              <View style={styles.presetRow}>
                {[
                  { label: "5m", mins: 5 },
                  { label: "10m", mins: 10 },
                  { label: "15m", mins: 15 },
                  { label: "25m", mins: 25 },
                  { label: "30m", mins: 30 },
                  { label: "45m", mins: 45 },
                  { label: "1h", mins: 60 },
                  { label: "1.5h", mins: 90 },
                  { label: "2h", mins: 120 },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.mins}
                    style={[
                      styles.presetChip,
                      timerMinutes === (preset.mins % 60) &&
                      timerHours === Math.floor(preset.mins / 60) &&
                      styles.presetChipSelected,
                    ]}
                    onPress={() => {
                      setTimerHours(Math.floor(preset.mins / 60));
                      setTimerMinutes(preset.mins % 60);
                    }}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        timerMinutes === (preset.mins % 60) &&
                        timerHours === Math.floor(preset.mins / 60) &&
                        styles.presetChipTextSelected,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
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
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.iconItem, selectedIcon === item && styles.iconItemSelected]}
                  onPress={() => {
                    setSelectedIcon(item);
                    setShowIconPicker(false);
                  }}
                >
                  <Ionicons name={item as any} size={32} color={selectedIcon === item ? shadcn.colors.foreground : shadcn.colors.mutedForeground} />
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
              keyExtractor={item => item}
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
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 20,
    fontWeight: "600"
  },
  list: { flex: 1, paddingHorizontal: 16, marginTop: 23, },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 5,
    backgroundColor: shadcn.colors.card,
    borderRadius: shadcn.radius.lg,
    marginBottom: 8
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
    borderTopColor: shadcn.colors.border
  },
  bottomLeft: { flexDirection: "row", gap: 24 },
  bottomTab: { flexDirection: "row", alignItems: "center", gap: 4 },
  bottomTabText: { color: shadcn.colors.mutedForeground, fontSize: 15 },
  editButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    backgroundColor: shadcn.colors.card,
    borderRadius: shadcn.radius.lg,
    padding: 24,
    width: "80%"
  },
  modalTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16
  },
  input: {
    color: shadcn.colors.foreground,
    backgroundColor: shadcn.colors.background,
    padding: 12,
    borderRadius: shadcn.radius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: shadcn.colors.border
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border
  },
  optionText: { color: shadcn.colors.foreground, flex: 1, fontSize: 16 },
  colorPreview: { width: 24, height: 24, borderRadius: 12 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24
  },
  cancelBtn: { padding: 12 },
  cancelBtnText: { color: shadcn.colors.mutedForeground, fontSize: 16 },
  saveBtn: {
    backgroundColor: shadcn.colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: shadcn.radius.md
  },
  saveBtnText: {
    color: shadcn.colors.brandForeground,
    fontWeight: "700",
    fontSize: 16
  },
  iconItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    margin: 4,
    backgroundColor: shadcn.colors.card,
    borderRadius: shadcn.radius.md
  },
  iconItemSelected: { backgroundColor: shadcn.colors.accent },
  colorItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  colorItemSelected: { borderWidth: 2, borderColor: shadcn.colors.foreground },

  // Timer Picker Styles
  timerModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  timerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerCancelText: { color: '#888', fontSize: 16 },
  timerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  timerDoneText: { color: '#4ECDC4', fontSize: 16, fontWeight: '600' },
  selectedActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  selectedActivityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  selectedActivityText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  timerPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  pickerContainer: { flex: 1, alignItems: 'center' },
  pickerLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pickerScroller: {
    height: 180,
    width: '100%',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerScrollContent: { paddingVertical: 60 },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  pickerItemSelected: { backgroundColor: 'rgba(78,205,196,0.15)' },
  pickerItemText: { color: '#555', fontSize: 24, fontWeight: '500' },
  pickerItemTextSelected: { color: '#4ECDC4', fontWeight: '700', fontSize: 28 },
  timerSeparator: { color: '#fff', fontSize: 32, fontWeight: '300', marginTop: 20 },
  presetTimes: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 16,
  },
  presetLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  presetChipSelected: {
    backgroundColor: 'rgba(78,205,196,0.15)',
    borderColor: '#4ECDC4',
  },
  presetChipText: { color: '#888', fontSize: 13, fontWeight: '500' },
  presetChipTextSelected: { color: '#4ECDC4', fontWeight: '600' },
});
