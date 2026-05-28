// app/edit-checklist.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DragList from 'react-native-draglist';
import { getChecklists, updateChecklist, deleteChecklist, Checklist, ChecklistItem } from '../activitiesStore';
import { shadcn } from '@/constants/components-theme';

const iconList = [
  "school-outline", "book-outline", "film-outline", "leaf-outline",
  "briefcase-outline", "heart-outline", "fitness-outline", "walk-outline",
  "bed-outline", "cafe-outline", "musical-notes-outline", "game-controller-outline",
  "laptop-outline", "cart-outline", "airplane-outline", "home-outline",
  "camera-outline", "pencil-outline", "calendar-outline", "time-outline",
  "star-outline", "flame-outline", "water-outline", "sunny-outline",
  "moon-outline", "cloud-outline", "rainy-outline", "snow-outline",
];

export default function EditChecklistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const checklistIndex = params.checklistIndex ? parseInt(params.checklistIndex as string) : 0;

  const [checklist, setChecklist] = useState<Checklist>({ title: '', icon: 'school-outline', items: [] });
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    const checklists = getChecklists();
    if (checklists[checklistIndex]) {
      const loaded = checklists[checklistIndex];
      setChecklist(loaded);
      setItems(loaded.items.map(i => ({ ...i })));
    } else {
      Alert.alert('Error', 'Checklist not found');
      router.back();
    }
  }, [checklistIndex]);

  const saveChecklist = (newItems: ChecklistItem[]) => {
    const updatedChecklist = { ...checklist, items: newItems };
    updateChecklist(checklistIndex, updatedChecklist);
    setChecklist(updatedChecklist);
  };

  const updateTitle = (title: string) => {
    const updatedChecklist = { ...checklist, title };
    updateChecklist(checklistIndex, updatedChecklist);
    setChecklist(updatedChecklist);
  };

  const updateIcon = (icon: string) => {
    const updatedChecklist = { ...checklist, icon };
    updateChecklist(checklistIndex, updatedChecklist);
    setChecklist(updatedChecklist);
    setShowIconPicker(false);
  };

  const addItem = () => {
    const newItems = [...items, { text: '', completed: false }];
    setItems(newItems);
    saveChecklist(newItems);
    setTimeout(() => {
      inputRefs.current[newItems.length - 1]?.focus();
    }, 100);
  };

  const updateItem = (text: string, index: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], text };
    setItems(newItems);
    saveChecklist(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    saveChecklist(newItems);
    inputRefs.current = inputRefs.current.filter((_, i) => i !== index);
  };

  const toggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], completed: !newItems[index].completed };
    setItems(newItems);
    saveChecklist(newItems);
  };

  const onReordered = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
    saveChecklist(newItems);
  };

  const handleDeleteChecklist = () => {
    Alert.alert(
      'Delete',
      `Delete "${checklist.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteChecklist(checklistIndex);
            router.replace('/settings');
          }
        }
      ]
    );
  };

  const handleBlur = (index: number) => {
    if (items[index]?.text.trim() === "" && items.length > 1) {
      removeItem(index);
    }
  };

  const handleSubmitEditing = (index: number) => {
    if (items[index]?.text.trim() !== "") {
      addItem();
    }
  };

  const cleanupEmptyItems = () => {
    const nonEmptyItems = items.filter(item => item.text.trim() !== "");
    if (nonEmptyItems.length !== items.length) {
      setItems(nonEmptyItems);
      inputRefs.current = inputRefs.current.slice(0, nonEmptyItems.length);
      saveChecklist(nonEmptyItems);
    }
  };

  const renderItem = ({ item, index, onDragStart, onDragEnd, isActive }: any) => {
    return (
      <TouchableOpacity
        style={[styles.itemRowWrapper, isActive && styles.draggingActive]}
        onLongPress={onDragStart}
        onPressOut={onDragEnd}
        delayLongPress={150}
        activeOpacity={0.7}
      >
        <View style={styles.itemRow}>
          <View style={styles.dragHandle}>
            <Ionicons name="menu-outline" size={16} color={shadcn.colors.mutedForeground} />
          </View>
          <TouchableOpacity style={styles.checkbox} onPress={() => toggleItem(index)}>
            <Ionicons
              name={item.completed ? 'checkbox' : 'square-outline'}
              size={18}
              color={item.completed ? shadcn.colors.brand : shadcn.colors.mutedForeground}
            />
          </TouchableOpacity>
          <TextInput
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[styles.itemInput, item.completed && styles.itemDone]}
            value={item.text}
            onChangeText={(text) => updateItem(text, index)}
            onBlur={() => handleBlur(index)}
            onSubmitEditing={() => handleSubmitEditing(index)}
            placeholder={`Item ${index + 1}`}
            placeholderTextColor={shadcn.colors.mutedForeground}
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Checklist</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.doneButtonContainer}>
            <Text style={styles.doneText}>Done</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Title section - not scrollable */}
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowIconPicker(true)}
          >
            <Ionicons
              name={checklist.icon as any}
              size={24}
              color={shadcn.colors.foreground}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.titleInput}
            placeholder="Checklist Title"
            placeholderTextColor={shadcn.colors.mutedForeground}
            value={checklist.title}
            onChangeText={updateTitle}
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
      </View>

      {/* DragList directly - no ScrollView wrapper */}
      <DragList
        data={items}
        keyExtractor={(_, index) => index.toString()}
        onReordered={onReordered}
        renderItem={renderItem}
        contentContainerStyle={styles.dragListContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomAddButton} onPress={addItem}>
          <Ionicons name="add-circle-outline" size={20} color={shadcn.colors.mutedForeground} />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Button - Bottom Right with absolute positioning */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteChecklist}>
        <Ionicons name="trash-outline" size={20} color="#FF453A" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>

      <Modal visible={showIconPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowIconPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Icon</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowIconPicker(false)}
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
                    checklist.icon === item && styles.iconItemSelected,
                  ]}
                  onPress={() => updateIcon(item)}
                >
                  <Ionicons
                    name={item as any}
                    size={28}
                    color={
                      checklist.icon === item
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
    paddingBottom: 12,
  },
  cancelText: { color: shadcn.colors.foreground, fontSize: 16 },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  doneButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  doneText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomColor: shadcn.colors.border,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    backgroundColor: shadcn.colors.card,
    width: 44,
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: shadcn.radius.md,
    flex: 1,
  },
  dragListContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  itemRowWrapper: {
    marginBottom: 2,
  },
  draggingActive: {
    opacity: 0.8,
    zIndex: 999,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  dragHandle: {
    padding: 2,
  },
  checkbox: {},
  itemInput: {
    color: shadcn.colors.foreground,
    fontSize: 14,
    flex: 1,
  },
  itemDone: {
    color: shadcn.colors.mutedForeground,
    textDecorationLine: 'line-through',
  },
  removeButton: {
    padding: 2,
  },
  removeButtonCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 16,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: shadcn.colors.background,
    borderTopColor: shadcn.colors.border,
  },
  bottomAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addButtonText: { color: shadcn.colors.mutedForeground, fontSize: 14 },
  deleteButton: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deleteButtonText: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: '500',
  },
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
    paddingVertical: 12,
    margin: 4,
    borderRadius: shadcn.radius.md,
    backgroundColor: shadcn.colors.secondary,
  },
  iconItemSelected: { backgroundColor: shadcn.colors.accent },
  closeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});
