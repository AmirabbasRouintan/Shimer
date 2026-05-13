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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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
  };

  const toggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], completed: !newItems[index].completed };
    setItems(newItems);
    saveChecklist(newItems);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
    saveChecklist(newItems);
  };

  const handleDeleteChecklist = () => {
    Alert.alert(
      'Delete Checklist',
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      moveItem(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={() => setShowIconPicker(true)}>
            <Ionicons name={checklist.icon as any} size={22} color={shadcn.colors.foreground} />
          </TouchableOpacity>
          <TextInput
            style={styles.headerTitleInput}
            value={checklist.title}
            onChangeText={updateTitle}
            placeholder="Checklist Title"
            placeholderTextColor={shadcn.colors.mutedForeground}
          />
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <TouchableOpacity
              style={styles.dragHandle}
              onLongPress={() => handleDragStart(index)}
              onPressOut={handleDragEnd}
              delayLongPress={200}
            >
              <Ionicons name="menu-outline" size={20} color={shadcn.colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkbox} onPress={() => toggleItem(index)}>
              <Ionicons
                name={item.completed ? 'checkbox' : 'square-outline'}
                size={22}
                color={item.completed ? shadcn.colors.brand : shadcn.colors.mutedForeground}
              />
            </TouchableOpacity>
            <TextInput
              ref={(ref) => { if (ref) inputRefs.current[index] = ref; }}
              style={[styles.itemInput, item.completed && styles.itemDone]}
              value={item.text}
              onChangeText={(text) => updateItem(text, index)}
              placeholder="Item"
              placeholderTextColor={shadcn.colors.mutedForeground}
            />
            <TouchableOpacity onPress={() => removeItem(index)}>
              <Ionicons name="close-circle" size={20} color={shadcn.colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomAddButton} onPress={addItem}>
          <Ionicons name="add-circle-outline" size={22} color={shadcn.colors.mutedForeground} />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomDeleteButton} onPress={handleDeleteChecklist}>
          <Ionicons name="trash-outline" size={22} color={shadcn.colors.destructive} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showIconPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Icon</Text>
              <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                <Ionicons name="close" size={24} color={shadcn.colors.foreground} />
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
                    size={32}
                    color={checklist.icon === item ? shadcn.colors.foreground : shadcn.colors.mutedForeground}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitleInput: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    paddingVertical: 4,
  },
  placeholder: { width: 22 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  dragHandle: { padding: 4 },
  checkbox: {},
  itemInput: { color: shadcn.colors.foreground, fontSize: 16, flex: 1 },
  itemDone: { color: shadcn.colors.mutedForeground, textDecorationLine: 'line-through' },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  bottomAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: { color: shadcn.colors.mutedForeground, fontSize: 16 },
  bottomDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButtonText: { color: shadcn.colors.destructive, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: shadcn.colors.card,
    borderTopLeftRadius: shadcn.radius.xl,
    borderTopRightRadius: shadcn.radius.xl,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: '600',
  },
  iconItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    margin: 4,
    borderRadius: shadcn.radius.md,
    backgroundColor: shadcn.colors.secondary,
  },
  iconItemSelected: {
    backgroundColor: shadcn.colors.accent,
  },
});
