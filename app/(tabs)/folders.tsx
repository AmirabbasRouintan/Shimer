// app/folders.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import {
  Alert, Animated, Modal, PanResponder, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { shadcn } from "../../constants/components-theme";
import { getFolders, setFolders, subscribe, Folder } from '../activitiesStore';

function SwipeableRow({ folder, index, onDelete, onEdit }: any) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => {
      if (folder.name === 'Today') return false;
      return Math.abs(gesture.dx) > 15;
    },
    onPanResponderMove: (_, gesture) => {
      if (folder.name === 'Today') return;
      if (gesture.dx < 0) translateX.setValue(Math.max(gesture.dx, -80));
    },
    onPanResponderRelease: (_, gesture) => {
      if (folder.name === 'Today') return;
      if (gesture.dx < -40) {
        Animated.spring(translateX, { toValue: -80, useNativeDriver: true }).start();
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  });

  const showDeleteButton = folder.name !== 'Today';

  return (
    <View style={styles.swipeContainer}>
      {showDeleteButton && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(index)}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
      <Animated.View
        style={[
          styles.folderRow,
          { transform: [{ translateX: folder.name === 'Today' ? 0 : translateX }] }
        ]}
        {...(folder.name !== 'Today' ? panResponder.panHandlers : {})}
      >
        <Ionicons name="folder-outline" size={20} color={shadcn.colors.mutedForeground} />
        <TouchableOpacity style={styles.folderContent} onPress={() => onEdit(index)}>
          <Text style={styles.folderText}>{folder.name}</Text>
          <Text style={styles.folderCount}>{folder.items?.length || 0} items</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color={shadcn.colors.mutedForeground} />
      </Animated.View>
    </View>
  );
}

export default function FoldersScreen() {
  const router = useRouter();
  const [folders, setFoldersState] = useState<Folder[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTomorrowButton, setShowTomorrowButton] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    // Load folders from store
    const loadedFolders = getFolders();
    setFoldersState(loadedFolders);
    checkTomorrowFolderExists(loadedFolders);

    // Subscribe to store changes
    const unsubscribe = subscribe(() => {
      const updatedFolders = getFolders();
      setFoldersState(updatedFolders);
      checkTomorrowFolderExists(updatedFolders);
    });

    return unsubscribe;
  }, []);

  const checkTomorrowFolderExists = (foldersList: Folder[]) => {
    const tomorrowExists = foldersList.some(f => f.name === 'Tomorrow');
    setShowTomorrowButton(!tomorrowExists);
  };

  const saveFolders = (updated: Folder[]) => {
    setFolders(updated);
    setFoldersState(updated);
    checkTomorrowFolderExists(updated);
  };

  const addFolder = () => {
    if (!newFolder.trim()) return;
    if (folders.some(f => f.name === newFolder.trim())) {
      Alert.alert('Duplicate', 'This folder already exists.');
      return;
    }
    saveFolders([...folders, { name: newFolder.trim(), items: [] }]);
    setNewFolder('');
    setShowNewModal(false);
  };

  const addTomorrowFolder = () => {
    if (folders.some(f => f.name === 'Tomorrow')) {
      Alert.alert('Exists', 'Tomorrow folder already exists.');
      return;
    }
    saveFolders([...folders, { name: 'Tomorrow', items: [] }]);
    Alert.alert('Success', 'Tomorrow folder has been added back.');
  };

  const openEdit = (idx: number) => {
    setEditIndex(idx);
    setEditName(folders[idx].name);
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    const updated = [...folders];
    updated[editIndex!].name = editName.trim();
    saveFolders(updated);
    setShowEditModal(false);
  };

  const deleteFolder = (idx: number) => {
    const folderName = folders[idx].name;
    if (folderName === 'Today') {
      Alert.alert('Cannot Delete', 'The "Today" folder cannot be removed.');
      return;
    }

    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folderName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedFolders = folders.filter((_, i) => i !== idx);
            saveFolders(updatedFolders);

            if (folderName === 'Tomorrow') {
              Alert.alert(
                'Tomorrow Folder Deleted',
                'You can add it back using the button below.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  const deleteFolderFromEdit = () => {
    const folderName = folders[editIndex!].name;
    if (folderName === 'Today') {
      Alert.alert('Cannot Delete', 'The "Today" folder cannot be removed.');
      return;
    }

    Alert.alert(
      'Delete Folder',
      `Delete "${folderName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedFolders = folders.filter((_, i) => i !== editIndex);
            saveFolders(updatedFolders);
            setShowEditModal(false);

            if (folderName === 'Tomorrow') {
              Alert.alert(
                'Tomorrow Folder Deleted',
                'You can add it back using the button below.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Folders" onBack={() => router.push('/settings')} rightAction={{ label: 'Add', onPress: () => setShowNewModal(true) }} />

      <ScrollView style={styles.content} contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}>
        {folders.map((folder, idx) => (
          <SwipeableRow key={idx} folder={folder} index={idx} onDelete={deleteFolder} onEdit={openEdit} />
        ))}
      </ScrollView>

      {/* Tip Container */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          <Text style={styles.boldText}>Tap</Text> a folder to rename it. Swipe
          <Text style={styles.boldText}> left</Text> to quickly delete.
        </Text>
      </View>

      {/* Add Tomorrow Folder Button - Below the paragraph */}
      {showTomorrowButton && (
        <TouchableOpacity style={styles.addTomorrowButton} onPress={addTomorrowFolder}>
          <Ionicons name="add-circle-outline" size={20} color="#aaa" />
          <Text style={styles.addTomorrowButtonText}>Add "Tomorrow" folder</Text>
        </TouchableOpacity>
      )}

      {/* New Folder Modal */}
      <Modal visible={showNewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Folder name"
              placeholderTextColor={shadcn.colors.mutedForeground}
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
              placeholderTextColor={shadcn.colors.mutedForeground}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              onSubmitEditing={saveEdit}
            />
            <View style={styles.modalButtons}>
              {folders[editIndex!]?.name !== 'Today' && (
                <TouchableOpacity onPress={deleteFolderFromEdit} style={styles.editDeleteButton}>
                  <Ionicons name="trash-outline" size={18} color={shadcn.colors.destructive} />
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
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  content: { flex: 1, paddingHorizontal: 16 },
  swipeContainer: { marginBottom: 8, position: 'relative' },
  deleteButton: {
    position: 'absolute',
    right: 1,
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: '#FF453A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.85,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  folderRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: shadcn.colors.card,
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, gap: 12, zIndex: 1,
  },
  folderContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  folderText: { color: shadcn.colors.foreground, fontSize: 16 },
  folderCount: { color: shadcn.colors.mutedForeground, fontSize: 13 },

  // Tip Container - Centered above button
  tipContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    marginHorizontal: 20,
    paddingHorizontal: 8,
  },
  tipText: {
    color: '#888',  // Change from current value to a darker gray
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    opacity: 0.7,

  },
  boldText: {
    fontWeight: "bold",
    color: '#aaa',  // Gray color instead of white
    opacity: 0.7,
  },

  // Add Tomorrow Folder Button - Below paragraph
  addTomorrowButton: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  addTomorrowButtonText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: shadcn.colors.card, borderRadius: 16, padding: 24, width: '80%' },
  modalTitle: { color: shadcn.colors.foreground, fontSize: 18, fontWeight: '600', marginBottom: 16 },
  modalInput: {
    color: shadcn.colors.foreground, fontSize: 16, backgroundColor: shadcn.colors.background,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    marginBottom: 16, borderWidth: 1, borderColor: shadcn.colors.border,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  modalCancel: { color: shadcn.colors.mutedForeground, fontSize: 16 },
  modalCreate: { color: shadcn.colors.foreground, fontSize: 16, fontWeight: '600' },
  editDeleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 'auto' },
  editDeleteText: { color: shadcn.colors.destructive, fontSize: 16, fontWeight: '600' },
});
