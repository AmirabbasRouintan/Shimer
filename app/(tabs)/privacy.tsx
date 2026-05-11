import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: May 9, 2026</Text>

        <Text style={styles.sectionTitle}>Our Promise</Text>
        <Text style={styles.paragraph}>
          Your data belongs to you. Shimer stores all your information locally on your device. We do not collect, store, or transmit any personal data to external servers.
        </Text>

        <Text style={styles.sectionTitle}>Data Storage</Text>
        <Text style={styles.paragraph}>
          All your tasks, checklists, notes, calendar events, files, and settings are stored exclusively on your device. Nothing leaves your phone unless you explicitly export a backup.
        </Text>

        <Text style={styles.sectionTitle}>What We Don't Collect</Text>
        <View style={styles.bulletRow}>
          <Ionicons name="close-circle" size={18} color="#FF4444" />
          <Text style={styles.bulletText}>Personal information (name, email, location)</Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="close-circle" size={18} color="#FF4444" />
          <Text style={styles.bulletText}>Usage analytics or tracking data</Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="close-circle" size={18} color="#FF4444" />
          <Text style={styles.bulletText}>Device identifiers or fingerprints</Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="close-circle" size={18} color="#FF4444" />
          <Text style={styles.bulletText}>Network activity or browsing history</Text>
        </View>

        <Text style={styles.sectionTitle}>Permissions</Text>
        <Text style={styles.paragraph}>
          The app may request the following permissions only when needed:
        </Text>
        <View style={styles.bulletRow}>
          <Ionicons name="camera-outline" size={18} color="#4ECDC4" />
          <Text style={styles.bulletText}>Camera: For adding photos to notes (optional)</Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="folder-outline" size={18} color="#4ECDC4" />
          <Text style={styles.bulletText}>Storage: For saving and restoring backups (optional)</Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="finger-print-outline" size={18} color="#4ECDC4" />
          <Text style={styles.bulletText}>Biometrics: For secure file vault access (optional)</Text>
        </View>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.paragraph}>
          If you have any questions about privacy, contact us at privacy@ixiflower.app
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  lastUpdated: { color: '#666', fontSize: 13, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  paragraph: { color: '#999', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  bulletRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 8, gap: 10, paddingRight: 20,
  },
  bulletText: { color: '#999', fontSize: 15, lineHeight: 20, flex: 1 },
});
