// app/folders.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const store = {};

const DEFAULT_FOLDERS = ['Today', 'Tomorrow'];

function SwipeableRow({ folder, index, onDelete, onEdit }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [showDelete, setShowDelete] = useState(false);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 15,
    onPanResponderMove: (_, gesture) => {
      if (gesture.dx < 0) {
        translateX.setValue(Math.max(gesture.dx, -80));
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -40) {
        Animated.spring(translateX, { toValue: -80, useNativeDriver: true }).start();
        setShowDelete(true);
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        setShowDelete(false);
      }
    },
  });

  const resetSwipe = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    setShowDelete(false);
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Delete button behind */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          resetSwipe();
          onDelete(index);
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>

      {/* Folder row */}
      <Animated.View
        style={[styles.folderRow, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="folder-outline" size={20} color="#888" />
        <TouchableOpacity style={styles.folderContent} onPress={() => onEdit(index)}>
          <Text style={styles.folderText}>{folder.name}</Text>
          <Text style={styles.folderCount}>{folder.items?.length || 0} items</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color="#333" />
      </Animated.View>
    </View>
  );
}

export default function FoldersScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const saved = store['folders'];
    if (saved) {
      setFolders(JSON.parse(saved));
    } else {
      const defaults = DEFAULT_FOLDERS.map(name => ({ name, items: [] }));
      setFolders(defaults);
      store['folders'] = JSON.stringify(defaults);
    }
  }, []);

  const saveFolders = (updated) => {
    setFolders(updated);
    store['folders'] = JSON.stringify(updated);
  };

  const addFolder = () => {
    if (!newFolder.trim()) return;
    if (folders.find(f => f.name === newFolder.trim())) {
      Alert.alert('Duplicate', 'This folder already exists.');
      return;
    }
    const updated = [...folders, { name: newFolder.trim(), items: [] }];
    saveFolders(updated);
    setNewFolder('');
    setShowNewModal(false);
  };

  const openEdit = (index) => {
    setEditIndex(index);
    setEditName(folders[index].name);
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    const updated = [...folders];
    updated[editIndex].name = editName.trim();
    saveFolders(updated);
    setShowEditModal(false);
  };

  const deleteFolderFromEdit = () => {
    if (folders[editIndex].name === 'Today') {
      Alert.alert('Cannot Delete', 'The "Today" folder cannot be removed.');
      return;
    }
    const updated = folders.filter((_, i) => i !== editIndex);
    saveFolders(updated);
    setShowEditModal(false);
  };

  const deleteFolder = (index) => {
    if (folders[index].name === 'Today') {
      Alert.alert('Cannot Delete', 'The "Today" folder cannot be removed.');
      return;
    }
    const updated = folders.filter((_, i) => i !== index);
    saveFolders(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Folders</Text>
        <TouchableOpacity onPress={() => setShowNewModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {folders.map((folder, index) => (
          <SwipeableRow
            key={index}
            folder={folder}
            index={index}
            onDelete={deleteFolder}
            onEdit={openEdit}
          />
        ))}
      </ScrollView>
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          Tap a folder to rename it. Swipe left to quickly delete. The "Today" folder cannot be removed.
        </Text>
      </View>

      {/* New Folder Modal */}
      <Modal visible={showNewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Folder name"
              placeholderTextColor="#555"
              value={newFolder}
              onChangeText={setNewFolder}
              autoFocus
              onSubmitEditing={addFolder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addFolder}>
                <Text style={styles.modalCreate}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Folder Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Folder</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Folder name"
              placeholderTextColor="#555"
              value={editName}
              onChangeText={setEditName}
              autoFocus
              onSubmitEditing={saveEdit}
            />
            <View style={styles.modalButtons}>
              {folders[editIndex]?.name !== 'Today' && (
                <TouchableOpacity onPress={deleteFolderFromEdit} style={styles.editDeleteButton}>
                  <Ionicons name="trash-outline" size={18} color="#FF453A" />
                  <Text style={styles.editDeleteText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit}>
                <Text style={styles.modalCreate}>Save</Text>
              </TouchableOpacity>
            </View>
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
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  swipeContainer: {
    marginBottom: 4,
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    margin: 2,
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: '#FF453A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 12,
    zIndex: 1,
  },
  folderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  folderText: { color: '#fff', fontSize: 16 },
  folderCount: { color: '#555', fontSize: 13 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a', borderRadius: 16,
    padding: 24, width: '80%',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  modalInput: {
    color: '#fff', fontSize: 16, backgroundColor: '#000',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16,
  },
  modalCancel: { color: '#888', fontSize: 16 },
  modalCreate: { color: '#fff', fontSize: 16, fontWeight: '600' },
  editDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 'auto',
  },
  editDeleteText: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 50,
    paddingHorizontal: 8,
    gap: 10,
  },
  tipText: {
    color: '#555',
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    flex: 1,
  },
});
