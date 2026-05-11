import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const licenses = [
  { name: 'React Native', license: 'MIT', url: 'https://github.com/facebook/react-native' },
  { name: 'Expo', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Router', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Ionicons', license: 'MIT', url: 'https://github.com/ionic-team/ionicons' },
  { name: 'React Native SVG', license: 'MIT', url: 'https://github.com/software-mansion/react-native-svg' },
  { name: 'React Native WebView', license: 'MIT', url: 'https://github.com/react-native-webview/react-native-webview' },
  { name: 'Expo Battery', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Document Picker', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo File System', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Image Picker', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Local Authentication', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Sharing', license: 'MIT', url: 'https://github.com/expo/expo' },
];

export default function OpenSourceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Open Source</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Our Code</Text>
        <Text style={styles.paragraph}>
          Shimer is open source and available on GitHub. We believe in transparency and community-driven development.
        </Text>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://github.com/ixiflower')}>
          <Ionicons name="logo-github" size={24} color="#fff" />
          <Text style={styles.linkText}>View on GitHub</Text>
          <Ionicons name="open-outline" size={16} color="#666" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>License</Text>
        <Text style={styles.paragraph}>
          Shimer is licensed under the MIT License. You are free to use, modify, and distribute the code.
        </Text>

        <Text style={styles.sectionTitle}>Third-Party Libraries</Text>
        <Text style={styles.paragraph}>
          We use the following open source libraries. Thank you to all contributors!
        </Text>

        {licenses.map((lib, index) => (
          <TouchableOpacity
            key={index}
            style={styles.libRow}
            onPress={() => Linking.openURL(lib.url)}
          >
            <View>
              <Text style={styles.libName}>{lib.name}</Text>
              <Text style={styles.libLicense}>{lib.license} License</Text>
            </View>
            <Ionicons name="open-outline" size={14} color="#555" />
          </TouchableOpacity>
        ))}

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
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  paragraph: { color: '#999', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 12, marginBottom: 16, gap: 12,
  },
  linkText: { color: '#fff', fontSize: 16, flex: 1 },
  libRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  libName: { color: '#fff', fontSize: 15 },
  libLicense: { color: '#888', fontSize: 12, marginTop: 2 },
});
