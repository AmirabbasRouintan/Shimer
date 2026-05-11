// app/new-checklist.tsx
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

const iconList = [
  'school-outline', 'book-outline', 'film-outline', 'leaf-outline',
  'briefcase-outline', 'heart-outline', 'fitness-outline', 'walk-outline',
  'bed-outline', 'cafe-outline', 'musical-notes-outline', 'game-controller-outline',
  'laptop-outline', 'cart-outline', 'airplane-outline', 'home-outline',
  'camera-outline', 'pencil-outline', 'calendar-outline', 'time-outline',
  'star-outline', 'flame-outline', 'water-outline', 'sunny-outline',
  'moon-outline', 'cloud-outline', 'rainy-outline', 'snow-outline',
];

export default function NewChecklistScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([]);
  const [selectedIcon, setSelectedIcon] = useState('school-outline');
  const [showIcons, setShowIcons] = useState(false);
  const inputRefs = useRef([]);

  useFocusEffect(
    useCallback(() => {
      setTitle('');
      setItems([]);
      setSelectedIcon('school-outline');
    }, [])
  );

  const addItem = () => {
    const newItems = [...items, ''];
    setItems(newItems);
    setTimeout(() => {
      inputRefs.current[newItems.length - 1]?.focus();
    }, 100);
  };

  const updateItem = (text, index) => {
    const newItems = [...items];
    newItems[index] = text;
    setItems(newItems);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleBlur = (index) => {
    if (items[index]?.trim() === '') {
      removeItem(index);
    }
  };

  const handleSave = () => {
    if (title.trim()) {
      router.push({
        pathname: '/settings',
        params: { newChecklist: JSON.stringify({ title: title.trim(), icon: selectedIcon }) }
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Checklist</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowIcons(true)}>
            <Ionicons name={selectedIcon} size={28} color="#fff" />
          </TouchableOpacity>
          <TextInput
            style={styles.titleInput}
            placeholder="Checklist Title"
            placeholderTextColor="#555"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <TouchableOpacity style={styles.checkbox}>
              <Ionicons name="square-outline" size={22} color="#555" />
            </TouchableOpacity>
            <TextInput
              ref={(ref) => inputRefs.current[index] = ref}
              style={styles.itemInput}
              placeholder=""
              value={item}
              onChangeText={(text) => updateItem(text, index)}
              onBlur={() => handleBlur(index)}
            />
            <TouchableOpacity onPress={() => removeItem(index)}>
              <Ionicons name="close-circle" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.bottomAddButton} onPress={addItem}>
        <Ionicons name="add-circle-outline" size={22} color="#888" />
        <Text style={styles.addButtonText}>Add Item</Text>
      </TouchableOpacity>

      <Modal visible={showIcons} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Icon</Text>
              <TouchableOpacity onPress={() => setShowIcons(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={iconList}
              numColumns={4}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.iconItem, selectedIcon === item && styles.iconItemSelected]}
                  onPress={() => {
                    setSelectedIcon(item);
                    setShowIcons(false);
                  }}
                >
                  <Ionicons name={item} size={32} color={selectedIcon === item ? '#fff' : '#888'} />
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
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16,
  },
  cancelText: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  iconButton: {
    backgroundColor: '#1a1a1a',
    width: 52, height: 52,
    borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  titleInput: {
    color: '#fff', fontSize: 20, fontWeight: '600',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 12, flex: 1,
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 12,
  },
  checkbox: {},
  itemInput: { color: '#fff', fontSize: 16, flex: 1 },
  bottomAddButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 16, paddingHorizontal: 16,
  },
  addButtonText: { color: '#888', fontSize: 16 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  iconItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, margin: 4,
    borderRadius: 12, backgroundColor: '#1a1a1a',
  },
  iconItemSelected: { backgroundColor: '#333' },
});
