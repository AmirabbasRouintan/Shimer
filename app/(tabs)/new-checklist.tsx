import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { shadcn } from "../../constants/components-theme";
import { addChecklist } from "../activitiesStore";

const iconList = [
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
  "water-outline",
  "sunny-outline",
  "moon-outline",
  "cloud-outline",
  "rainy-outline",
  "snow-outline",
];

export default function NewChecklistScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState("school-outline");
  const [showIcons, setShowIcons] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  useFocusEffect(
    useCallback(() => {
      setTitle("");
      setItems([]);
      setSelectedIcon("school-outline");
    }, [])
  );

  const addItem = () => {
    const newItems = [...items, ""];
    setItems(newItems);
    setTimeout(() => {
      const newIndex = newItems.length - 1;
      if (inputRefs.current[newIndex]) {
        inputRefs.current[newIndex].focus();
      }
    }, 100);
  };

  const updateItem = (text: string, index: number) => {
    const newItems = [...items];
    newItems[index] = text;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    inputRefs.current = inputRefs.current.filter((_, i) => i !== index);
  };

  const handleBlur = (index: number) => {
    if (items[index]?.trim() === "" && items.length > 1) {
      removeItem(index);
    } else if (items[index]?.trim() === "" && items.length === 1) {
      updateItem("", index);
    }
  };

  const handleSubmitEditing = (index: number) => {
    if (items[index]?.trim() !== "") {
      addItem();
    }
  };

  const handleSave = () => {
    if (title.trim()) {
      const nonEmptyItems = items.filter(text => text.trim() !== "");

      const checklistItems = nonEmptyItems
        .map(text => ({ text: text.trim(), completed: false }));

      addChecklist({
        title: title.trim(),
        icon: selectedIcon,
        items: checklistItems,
      });
      router.push("/settings");
    } else {
      alert("Please enter a checklist title");
    }
  };

  const cleanupEmptyItems = () => {
    const nonEmptyItems = items.filter(text => text.trim() !== "");
    if (nonEmptyItems.length !== items.length) {
      setItems(nonEmptyItems);
      inputRefs.current = inputRefs.current.slice(0, nonEmptyItems.length);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Checklist</Text>
        <TouchableOpacity onPress={handleSave}>
          <View style={styles.saveButtonContainer}>
            <Text style={styles.saveText}>Save</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        onTouchEnd={cleanupEmptyItems}
      >
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowIcons(true)}
          >
            <Ionicons
              name={selectedIcon as any}
              size={28}
              color={shadcn.colors.foreground}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.titleInput}
            placeholder="Checklist Title"
            placeholderTextColor={shadcn.colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => {
              if (items.length > 0 && inputRefs.current[0]) {
                inputRefs.current[0].focus();
              } else {
                addItem();
              }
            }}
          />
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.checkbox}>
              <Ionicons
                name="square-outline"
                size={22}
                color={shadcn.colors.mutedForeground}
              />
            </View>
            <TextInput
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={styles.itemInput}
              placeholder={`Item ${index + 1}`}
              placeholderTextColor={shadcn.colors.mutedForeground}
              value={item}
              onChangeText={(text) => updateItem(text, index)}
              onBlur={() => handleBlur(index)}
              onSubmitEditing={() => handleSubmitEditing(index)}
              returnKeyType={index === items.length - 1 ? "done" : "next"}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(index)}
            >
              <View style={styles.removeButtonCircle}>
                <Text style={styles.removeButtonText}>-</Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.bottomAddButton} onPress={addItem}>
        <Ionicons
          name="add-circle-outline"
          size={22}
          color={shadcn.colors.mutedForeground}
        />
        <Text style={styles.addButtonText}>Add Item</Text>
      </TouchableOpacity>

      <Modal visible={showIcons} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowIcons(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Icon</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowIcons(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={iconList}
              numColumns={4}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconItem,
                    selectedIcon === item && styles.iconItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedIcon(item);
                    setShowIcons(false);
                  }}
                >
                  <Ionicons
                    name={item as any}
                    size={32}
                    color={
                      selectedIcon === item
                        ? shadcn.colors.foreground
                        : shadcn.colors.mutedForeground
                    }
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  cancelText: { color: shadcn.colors.foreground, fontSize: 16 },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  saveText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  content: { flex: 1, paddingHorizontal: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  iconButton: {
    backgroundColor: shadcn.colors.card,
    width: 50,
    height: "auto",
    padding: 6,
    borderRadius: shadcn.radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  titleInput: {
    color: shadcn.colors.foreground,
    fontSize: 15,
    fontWeight: "500",
    backgroundColor: shadcn.colors.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: shadcn.radius.md,
    flex: 1,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {},
  itemInput: { color: shadcn.colors.foreground, fontSize: 16, flex: 1 },
  removeButton: {
    padding: 2,
  },
  removeButtonCircle: {
    width: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  addButtonText: { color: shadcn.colors.mutedForeground, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: shadcn.colors.card,
    borderTopLeftRadius: shadcn.radius.xl,
    borderTopRightRadius: shadcn.radius.xl,
    padding: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
  },
  iconItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    margin: 4,
    borderRadius: shadcn.radius.md,
    backgroundColor: shadcn.colors.secondary,
  },
  iconItemSelected: { backgroundColor: shadcn.colors.accent },
  closeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});
