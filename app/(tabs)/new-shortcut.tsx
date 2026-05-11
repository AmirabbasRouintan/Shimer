import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const suggestedApps = [
  { name: 'Spotify', icon: 'musical-notes', color: '#1DB954' },
  { name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
  { name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { name: 'Telegram', icon: 'paper-plane', color: '#0088cc' },
  { name: 'Chrome', icon: 'globe', color: '#4285F4' },
  { name: 'Gmail', icon: 'mail', color: '#EA4335' },
  { name: 'Maps', icon: 'map', color: '#34A853' },
  { name: 'Camera', icon: 'camera', color: '#FBBC04' },
  { name: 'Gallery', icon: 'images', color: '#FF6B6B' },
  { name: 'Calendar', icon: 'calendar', color: '#4285F4' },
  { name: 'Clock', icon: 'alarm', color: '#9C27B0' },
  { name: 'Calculator', icon: 'calculator', color: '#607D8B' },
  { name: 'Notes', icon: 'document-text', color: '#FFC107' },
];

export default function NewShortcutScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  const filteredApps = suggestedApps.filter(app =>
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Shortcut</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.doneText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionHeader}>SUGGESTED APPS</Text>
        {filteredApps.map((app, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.appRow, selectedApp === app.name && styles.appRowSelected]}
            onPress={() => setSelectedApp(app.name)}
          >
            <View style={[styles.appIcon, { backgroundColor: app.color }]}>
              <Ionicons name={app.icon} size={22} color="#fff" />
            </View>
            <Text style={styles.appName}>{app.name}</Text>
            {selectedApp === app.name && (
              <Ionicons name="checkmark-circle" size={22} color="#4ECDC4" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.note}>
        Full app list requires device permissions. Grant access in Settings → Shortcuts → App Access.
      </Text>
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
  doneText: { color: '#4ECDC4', fontSize: 16, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', marginHorizontal: 16, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, gap: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 12, marginLeft: 4 },
  appRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12, gap: 14,
    borderRadius: 12, marginBottom: 2,
  },
  appRowSelected: { backgroundColor: '#1a1a1a' },
  appIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  appName: { color: '#fff', fontSize: 16, flex: 1 },
  note: {
    color: '#555', fontSize: 12, textAlign: 'center',
    paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10,
  },
});
