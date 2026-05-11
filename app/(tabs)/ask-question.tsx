import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AskQuestionScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in name, subject, and message.');
      return;
    }
    Alert.alert('Sent!', 'Your question has been submitted. We\'ll get back to you soon.');
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask a Question</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          placeholder="What's this about?"
          placeholderTextColor="#555"
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder="Describe your question..."
          placeholderTextColor="#555"
          value={message}
          onChangeText={setMessage}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="send" size={20} color="#000" />
          <Text style={styles.submitText}>Send Question</Text>
        </TouchableOpacity>

        <Text style={styles.alternative}>
          Or email us directly at:{'\n'}support@ixiflower.app
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
  label: { color: '#888', fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 6 },
  input: {
    color: '#fff', fontSize: 16, backgroundColor: '#1a1a1a',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
  },
  messageInput: { minHeight: 150, paddingTop: 12 },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4ECDC4', paddingVertical: 14, borderRadius: 12,
    marginTop: 20, gap: 8,
  },
  submitText: { color: '#000', fontSize: 16, fontWeight: '700' },
  alternative: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 20 },
});
