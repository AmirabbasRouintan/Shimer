// app/main.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Switch, Platform, Keyboard, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getFolders, subscribe, Folder } from '../activitiesStore';

const store = {};

export default function MainScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [showOnHome, setShowOnHome] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Load folders from store
  useEffect(() => {
    const loadedFolders = getFolders();
    setFolders(loadedFolders);
    if (loadedFolders.length > 0 && !activeTab) {
      setActiveTab(loadedFolders[0].name);
    }

    const unsubscribe = subscribe(() => {
      const updatedFolders = getFolders();
      setFolders(updatedFolders);
      if (updatedFolders.length > 0 && !activeTab) {
        setActiveTab(updatedFolders[0].name);
      }
    });
    return unsubscribe;
  }, []);

  // Load tasks for selected tab
  useEffect(() => {
    const saved = store[`tasks_${activeTab}`];
    if (saved) setTasks(JSON.parse(saved));
    else setTasks([]);
  }, [activeTab]);

  // Keyboard handling
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height * 0.85)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const addTask = () => {
    if (taskInput.trim()) {
      const newTask = { text: taskInput.trim(), done: false };
      const newTasks = [...tasks, newTask];
      setTasks(newTasks);
      store[`tasks_${activeTab}`] = JSON.stringify(newTasks);

      if (activeTab === folders[0]?.name && showOnHome) {
        const homeTasks = store['home_tasks'] ? JSON.parse(store['home_tasks']) : [];
        homeTasks.push(newTask);
        store['home_tasks'] = JSON.stringify(homeTasks);
      }

      setTaskInput('');
      Keyboard.dismiss();
    }
  };

  const toggleTask = (index) => {
    const newTasks = [...tasks];
    newTasks[index].done = !newTasks[index].done;
    setTasks(newTasks);
    store[`tasks_${activeTab}`] = JSON.stringify(newTasks);
  };

  const removeTask = (index) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    store[`tasks_${activeTab}`] = JSON.stringify(newTasks);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <View style={styles.tabContainer}>
          {folders.map((folder, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tab, activeTab === folder.name && styles.activeTab]}
              onPress={() => setActiveTab(folder.name)}
            >
              <Text style={[styles.tabText, activeTab === folder.name && styles.activeTabText]}>
                {folder.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.calendarButton} onPress={() => router.push('/calendar')}>
          <Ionicons name="calendar-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.taskList} keyboardShouldPersistTaps="handled">
        <>
          {tasks.map((task, index) => (
            <View key={index} style={styles.taskRow}>
              <TouchableOpacity onPress={() => toggleTask(index)}>
                <Ionicons
                  name={task.done ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={task.done ? '#fff' : '#555'}
                />
              </TouchableOpacity>
              <Text style={[styles.taskText, task.done && styles.taskDone]}>{task.text}</Text>
              <TouchableOpacity onPress={() => removeTask(index)}>
                <Ionicons name="close-circle" size={20} color="#555" />
              </TouchableOpacity>
            </View>
          ))}
          {tasks.length === 0 && (
            <View style={styles.emptyTasks}>
              <Ionicons name="list-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No tasks yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button below to add a task</Text>
            </View>
          )}
          <View style={{ height: 20 }} />
        </>
      </ScrollView>

      <View style={{ paddingBottom: keyboardHeight }}>
        {activeTab === folders[0]?.name && (
          <View style={styles.toggleRow}>
            <Ionicons name="home-outline" size={20} color="#888" />
            <Text style={styles.toggleText}>Show on Home Screen</Text>
            <Switch
              value={showOnHome}
              onValueChange={setShowOnHome}
              trackColor={{ false: '#333', true: '#4ECDC4' }}
              thumbColor={showOnHome ? '#fff' : '#888'}
            />
          </View>
        )}

        <View style={styles.inputRow}>
          <View style={styles.inputLeft}>
            <Ionicons name="timer-outline" size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Task"
              placeholderTextColor="#555"
              value={taskInput}
              onChangeText={setTaskInput}
              onSubmitEditing={addTask}
            />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={addTask}>
            <Text style={styles.saveButtonText}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 8 },
  tabContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 10, padding: 4, flexWrap: 'wrap' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#fff' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#000' },
  calendarButton: { backgroundColor: '#1a1a1a', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  taskList: { flex: 1, paddingHorizontal: 20 },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  taskText: { color: '#fff', fontSize: 16, flex: 1 },
  taskDone: { color: '#555', textDecorationLine: 'line-through' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: -4, paddingVertical: 1, paddingHorizontal: 14, borderRadius: 12, gap: 10 },
  toggleText: { color: '#fff', fontSize: 16, flex: 1 },
  inputRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  inputLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12 },
  saveButton: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  saveButtonText: { color: '#000', fontSize: 14, fontWeight: '700' },
  emptyTasks: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#888', fontSize: 18, marginTop: 16 },
  emptySubtext: { color: '#555', fontSize: 14, marginTop: 8 },
});
