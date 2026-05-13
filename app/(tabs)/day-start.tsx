import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { shadcn } from "../../constants/components-theme";

const hours = Array.from({ length: 24 }, (_, i) => i);

export default function DayStartScreen() {
  const router = useRouter();
  const [selectedHour, setSelectedHour] = useState(0);
  const formatHour = (h: number) => h.toString().padStart(2, "0") + ":00";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Day Start</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {hours.map(hour =>
          <TouchableOpacity
            key={hour}
            style={styles.hourRow}
            onPress={() => setSelectedHour(hour)}
          >
            <Text
              style={[
                styles.hourText,
                selectedHour === hour && styles.hourTextSelected,
              ]}
            >
              {formatHour(hour)}
            </Text>
            {selectedHour === hour &&
              <Ionicons
                name="checkmark"
                size={22}
                color={shadcn.colors.brand}
              />}
          </TouchableOpacity>,
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border,
  },
  cancelText: { color: shadcn.colors.foreground, fontSize: 16 },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  doneText: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  content: { flex: 1, paddingHorizontal: 16 },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border,
  },
  hourText: { color: shadcn.colors.mutedForeground, fontSize: 18 },
  hourTextSelected: { color: shadcn.colors.foreground, fontWeight: "600" },
});
