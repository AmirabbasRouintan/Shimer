import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Modal, PanResponder, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { shadcn } from "../../constants/components-theme";

const store: Record<string, any> = {};
const DEFAULT_FOLDERS = ['Today', 'Tomorrow'];

function SwipeableRow({ folder, index, onDelete, onEdit }: any) {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 15,
    onPanResponderMove: (_, gesture) => {
      if (gesture.dx < 0) translateX.setValue(Math.max(gesture.dx, -80));
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -40) {
        Animated.spring(translateX, { toValue: -80, useNativeDriver: true }).start();
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  });

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(index)}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
      <Animated.View style={[styles.folderRow, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
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
  const [folders, setFolders] = useState<any[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
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

  const saveFolders = (updated: any[]) => {
    setFolders(updated);
    store['folders'] = JSON.stringify(updated);
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
    if (folders[idx].name === 'Today') {
      Alert.alert('Cannot Delete', 'The "Today" folder cannot be removed.');
      return;
    }
    saveFolders(folders.filter((_, i) => i !== idx));
  };

  const deleteFolderFromEdit = () => {
    if (folders[editIndex!].name === 'Today') {
      Alert.alert('Cannot Delete', 'The "Today" folder cannot be removed.');
      return;
    }
    saveFolders(folders.filter((_, i) => i !== editIndex));
    setShowEditModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="arrow-back" size={22} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Folders</Text>
        <TouchableOpacity onPress={() => setShowNewModal(true)}>
          <Ionicons name="add" size={24} color={shadcn.colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingTop: 16 }}>
        {folders.map((folder, idx) => (
          <SwipeableRow key={idx} folder={folder} index={idx} onDelete={deleteFolder} onEdit={openEdit} />
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: shadcn.colors.border,
  },
  headerTitle: { color: shadcn.colors.foreground, fontSize: 18, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  swipeContainer: { marginBottom: 8, position: 'relative' },
  deleteButton: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: 70,
    backgroundColor: shadcn.colors.destructive, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  deleteButtonText: { color: '#fff', fontSize: 11, marginTop: 2, fontWeight: '600' },
  folderRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: shadcn.colors.card,
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, gap: 12, zIndex: 1,
  },
  folderContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  folderText: { color: shadcn.colors.foreground, fontSize: 16 },
  folderCount: { color: shadcn.colors.mutedForeground, fontSize: 13 },
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
  tipContainer: { margin: 20, paddingHorizontal: 8 },
  tipText: { color: shadcn.colors.mutedForeground, fontSize: 13, textAlign: "center", lineHeight: 18 },
});