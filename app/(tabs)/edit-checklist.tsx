import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { storage } from '@/utils/storage';

export default function EditChecklistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const checklist = params.checklist ? JSON.parse(params.checklist) : { title: '', icon: 'school-outline', items: [] };
  const checklistIndex = params.checklistIndex ? parseInt(params.checklistIndex) : 0;

  const [items, setItems] = useState(checklist.items || []);
  const inputRefs = useRef([]);

  const saveChecklist = async (newItems) => {
    try {
      const stored = await AsyncStorage.getItem('checklists');
      const checklists = stored ? JSON.parse(stored) : [];
      checklists[checklistIndex] = { ...checklist, items: newItems };
      await AsyncStorage.setItem('checklists', JSON.stringify(checklists));
    } catch (e) { }
  };

  const addItem = () => {
    const newItems = [...items, ''];
    setItems(newItems);
    saveChecklist(newItems);
    setTimeout(() => inputRefs.current[newItems.length - 1]?.focus(), 100);
  };

  const updateItem = (text, index) => {
    const newItems = [...items];
    newItems[index] = text;
    setItems(newItems);
    saveChecklist(newItems);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    saveChecklist(newItems);
  };

  const toggleItem = (index) => {
    const newItems = [...items];
    if (newItems[index].startsWith('✓ ')) {
      newItems[index] = newItems[index].replace('✓ ', '');
    } else {
      newItems[index] = '✓ ' + newItems[index];
    }
    setItems(newItems);
    saveChecklist(newItems);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name={checklist.icon} size={22} color="#fff" />
          <Text style={styles.headerTitle}>{checklist.title}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <TouchableOpacity style={styles.checkbox} onPress={() => toggleItem(index)}>
              <Ionicons
                name={item.startsWith('✓ ') ? 'checkbox' : 'square-outline'}
                size={22}
                color={item.startsWith('✓ ') ? '#4ECDC4' : '#555'}
              />
            </TouchableOpacity>
            <TextInput
              ref={(ref) => inputRefs.current[index] = ref}
              style={[styles.itemInput, item.startsWith('✓ ') && styles.itemDone]}
              value={item.replace('✓ ', '')}
              onChangeText={(text) => updateItem(item.startsWith('✓ ') ? '✓ ' + text : text, index)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: 12,
  },
  checkbox: {},
  itemInput: { color: '#fff', fontSize: 16, flex: 1 },
  itemDone: { color: '#666', textDecorationLine: 'line-through' },
  bottomAddButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 16, paddingHorizontal: 16,
  },
  addButtonText: { color: '#888', fontSize: 16 },
});
