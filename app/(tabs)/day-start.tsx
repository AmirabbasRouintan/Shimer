// app/day-start.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Header } from "@/components/Header";
import { shadcn } from "../../constants/components-theme";
import { getDayStart, setDayStart, subscribe } from "../activitiesStore";

const hours = Array.from({ length: 24 }, (_, i) => i);

export default function DayStartScreen() {
  const router = useRouter();
  const [selectedHour, setSelectedHour] = useState(0);

  // Load saved day start time
  useEffect(() => {
    const savedDayStart = getDayStart();
    if (savedDayStart) {
      const hour = parseInt(savedDayStart.split(":")[0]);
      setSelectedHour(hour);
    }

    const unsubscribe = subscribe(() => {
      const updated = getDayStart();
      if (updated) {
        const hour = parseInt(updated.split(":")[0]);
        setSelectedHour(hour);
      }
    });

    return unsubscribe;
  }, []);

  const formatHour = (h: number) => h.toString().padStart(2, "0") + ":00";

  const handleSave = () => {
    const newDayStart = formatHour(selectedHour);
    setDayStart(newDayStart);
    Alert.alert("Saved", `Day start time set to ${newDayStart}`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header title="Day Start" leftAction={{ label: 'Cancel', onPress: () => router.back() }} rightAction={{ label: 'Save', onPress: handleSave }} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {hours.map(hour => (
          <TouchableOpacity
            key={hour}
            style={styles.hourRow}
            onPress={() => setSelectedHour(hour)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.hourText,
                selectedHour === hour && styles.hourTextSelected,
              ]}
            >
              {formatHour(hour)}
            </Text>
            {selectedHour === hour && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={shadcn.colors.brand}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },

  content: { flex: 1, paddingHorizontal: 16 },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: shadcn.colors.border,
  },
  hourText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 16,
    fontWeight: "500",
  },
  hourTextSelected: {
    color: shadcn.colors.foreground,
    fontWeight: "700",
    fontSize: 17,
  },
});
