import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WhatsNewScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What's New</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.versionBadge}>
          <Ionicons name="sparkles" size={48} color="#FFD700" />
          <Text style={styles.versionTitle}>v2026.1.0</Text>
          <Text style={styles.versionSubtitle}>First Version</Text>
        </View>

        <Text style={styles.description}>
          This is the very first version of Shimer! Everything you see is brand new. We've built this app from the ground up to help you track your time, manage tasks, and stay productive.
        </Text>

        <Text style={styles.sectionTitle}>✨ What's Included</Text>
        <View style={styles.featureRow}>
          <Ionicons name="time-outline" size={24} color="#4ECDC4" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Live Time Tracking</Text>
            <Text style={styles.featureDesc}>Track your activities with a beautiful live clock</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="checkbox-outline" size={24} color="#FF6B6B" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Checklists</Text>
            <Text style={styles.featureDesc}>Create and manage checklists for any activity</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="stats-chart-outline" size={24} color="#FFEAA7" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Summary & History</Text>
            <Text style={styles.featureDesc}>Visualize your time with donut charts and detailed history</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="notifications-outline" size={24} color="#45B7D1" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Smart Reminders</Text>
            <Text style={styles.featureDesc}>Set break reminders and timer notifications</Text>
          </View>
        </View>

        <Text style={styles.footer}>Thank you for being an early user! 🚀</Text>
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
  versionBadge: {
    alignItems: 'center', marginVertical: 30,
    backgroundColor: '#1a1a1a', padding: 24, borderRadius: 16,
  },
  versionTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 12 },
  versionSubtitle: { color: '#888', fontSize: 14, marginTop: 4 },
  description: { color: '#999', fontSize: 15, lineHeight: 22, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12,
    backgroundColor: '#1a1a1a', padding: 14, borderRadius: 12,
  },
  featureText: { flex: 1 },
  featureTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  featureDesc: { color: '#888', fontSize: 13, marginTop: 2 },
  footer: { color: '#666', fontSize: 14, textAlign: 'center', marginVertical: 30 },
});
