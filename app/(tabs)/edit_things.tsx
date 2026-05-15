// app/(tabs)/edit_things.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DragList from "react-native-draglist";
import { shadcn } from "../../constants/components-theme";
import { getActivities, setActivities, subscribe, Activity } from "../activitiesStore";

export default function EditThingsScreen() {
  const router = useRouter();
  const [activities, setActivitiesState] = useState<Activity[]>([]);

  useEffect(() => {
    setActivitiesState(getActivities());
    const unsubscribe = subscribe(() => {
      setActivitiesState(getActivities());
    });
    return unsubscribe;
  }, []);

  const saveActivities = (newActivities: Activity[]) => {
    setActivities(newActivities);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      const newActivities = [...activities];
      [newActivities[index - 1], newActivities[index]] = [newActivities[index], newActivities[index - 1]];
      saveActivities(newActivities);
    }
  };

  const moveDown = (index: number) => {
    if (index < activities.length - 1) {
      const newActivities = [...activities];
      [newActivities[index], newActivities[index + 1]] = [newActivities[index + 1], newActivities[index]];
      saveActivities(newActivities);
    }
  };

  const handleDelete = (item: Activity, index: number) => {
    if (item.name === "Other" || item.id === "12") {
      Alert.alert("Cannot Delete", "The 'Other' activity cannot be removed.");
      return;
    }
    Alert.alert(
      "Delete",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const newActivities = activities.filter((_, i) => i !== index);
            saveActivities(newActivities);
            // No need to navigate - we're already on the edit screen
            // The list will automatically update and show the remaining activities
          }
        }
      ]
    );
  };

  const onReordered = (fromIndex: number, toIndex: number) => {
    const newActivities = [...activities];
    const [movedItem] = newActivities.splice(fromIndex, 1);
    newActivities.splice(toIndex, 0, movedItem);
    saveActivities(newActivities);
  };

  const renderItem = ({ item, index, onDragStart, onDragEnd, isActive }: any) => {
    return (
      <TouchableOpacity
        style={[styles.activityRowWrapper, isActive && styles.draggingActive]}
        onPress={() =>
          router.push({
            pathname: "/edit-activity-page",
            params: {
              id: item.id,
              name: item.name,
              icon: item.icon,
              color: item.color,
              keepScreenOn: String(item.keepScreenOn),
              pomodoro: String(item.pomodoro),
              goals: item.goals,
              timerHints: item.timerHints
            }
          })
        }
        onLongPress={onDragStart}
        onPressOut={onDragEnd}
        delayLongPress={150}
        activeOpacity={0.7}
      >
        <View style={styles.activityRow}>
          <View style={styles.dragHandle}>
            <Ionicons name="menu-outline" size={20} color={shadcn.colors.mutedForeground} />
          </View>
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
          <Ionicons name={item.icon as any} size={18} color={shadcn.colors.mutedForeground} style={styles.activityIcon} />
          <Text style={styles.activityName} numberOfLines={1}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/things')} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Activities</Text>
        </View>
        <TouchableOpacity onPress={() => router.replace('/things')} style={styles.headerRight}>
          <View style={styles.doneButtonContainer}>
            <Text style={styles.doneButton}>Done</Text>
          </View>
        </TouchableOpacity>
      </View>

      <DragList
        data={activities}
        keyExtractor={(item: Activity) => item.id}
        onReordered={onReordered}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => router.push("/add-activity-page")} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={22} color="#888" />
        <Text style={styles.addButtonText}>New Activity</Text>
      </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    paddingTop: 3,
    marginTop: 20,
  },
  activityRowWrapper: {
    marginBottom: 8,
  },
  draggingActive: {
    opacity: 0.8,
    zIndex: 999,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: shadcn.colors.card,
    borderRadius: shadcn.radius.lg,
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  dragHandle: {
    marginRight: 15,
    marginLeft: 5,
    padding: 4,
  },
  colorIndicator: {
    width: 10,
    height: 25,
    borderRadius: 10,
    marginRight: 20,
  },
  activityIcon: {
    marginRight: 8,
  },
  activityName: {
    flex: 1,
    color: shadcn.colors.foreground,
    fontSize: 15,
  },
  rowActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  addButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
  doneButtonContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  doneButton: {
    color: "#000",
    fontSize: 13,
    fontWeight: "600",
  },
});
