// app/secure-files.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as LocalAuthentication from 'expo-local-authentication';

const store = {};

const PATTERN_DOTS = [
  [0, 0], [1, 0], [2, 0],
  [0, 1], [1, 1], [2, 1],
  [0, 2], [1, 2], [2, 2],
];

export default function SecureFilesScreen() {
  const router = useRouter();
  const [lockType, setLockType] = useState(null); // 'pin', 'fingerprint', 'pattern'
  const [password, setPassword] = useState('');
  const [attempt, setAttempt] = useState('');
  const [vaultPassword, setVaultPassword] = useState(null);
  const [files, setFiles] = useState([]);
  const [pattern, setPattern] = useState([]);
  const [savedPattern, setSavedPattern] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const savedLock = store['vault_lock_type'];
    if (savedLock) setLockType(savedLock);
    const savedPwd = store['vault_password'];
    if (savedPwd) setVaultPassword(savedPwd);
    const savedPat = store['vault_pattern'];
    if (savedPat) setSavedPattern(savedPat);
    const savedFiles = store['vault_files'];
    if (savedFiles) setFiles(JSON.parse(savedFiles));
  }, []);

  // --- Lock setup ---
  const setupLock = (type) => {
    setLockType(type);
    store['vault_lock_type'] = type;
  };

  const setupPin = () => {
    if (password.length < 4) return Alert.alert('PIN must be at least 4 digits');
    store['vault_password'] = password;
    setVaultPassword(password);
    setPassword('');
    Alert.alert('PIN lock set');
  };

  const setupFingerprint = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return Alert.alert('Device does not support fingerprint');
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return Alert.alert('No fingerprints enrolled');
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Set up fingerprint lock' });
    if (result.success) {
      store['vault_password'] = 'fingerprint'; // just a flag
      setVaultPassword('fingerprint');
      Alert.alert('Fingerprint lock set');
    }
  };

  const savePattern = () => {
    if (pattern.length < 4) return Alert.alert('Pattern too short, connect at least 4 dots');
    const patternStr = pattern.join('');
    store['vault_pattern'] = patternStr;
    setSavedPattern(patternStr);
    setPattern([]);
    Alert.alert('Pattern lock set');
  };

  // --- Unlock ---
  const unlockWithPin = () => {
    if (attempt === vaultPassword) {
      setIsUnlocked(true);
      setAttempt('');
    } else {
      Alert.alert('Wrong PIN');
    }
  };

  const unlockWithFingerprint = async () => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock vault' });
    if (result.success) {
      setIsUnlocked(true);
    }
  };

  const handlePatternDot = (index) => {
    if (pattern.includes(index)) return;
    setPattern([...pattern, index]);
  };

  const verifyPattern = () => {
    if (pattern.join('') === savedPattern) {
      setIsUnlocked(true);
      setPattern([]);
    } else {
      Alert.alert('Wrong pattern');
      setPattern([]);
    }
  };

  // --- File handling ---
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (!result.canceled) {
        const newFiles = [...files, ...result.assets.map(a => ({ name: a.name, uri: a.uri }))];
        setFiles(newFiles);
        store['vault_files'] = JSON.stringify(newFiles);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not pick file');
    }
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    store['vault_files'] = JSON.stringify(updated);
  };

  // --- Lock type selection screen (first time) ---
  if (!lockType) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.cancelText}>Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Vault Lock Setup</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.content}>
          <Text style={styles.instruction}>Choose how to lock your files</Text>
          <TouchableOpacity style={styles.optionRow} onPress={() => setupLock('pin')}>
            <Ionicons name="keypad" size={24} color="#fff" />
            <Text style={styles.optionText}>PIN Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => setupLock('fingerprint')}>
            <Ionicons name="finger-print" size={24} color="#fff" />
            <Text style={styles.optionText}>Fingerprint</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => setupLock('pattern')}>
            <Ionicons name="grid-outline" size={24} color="#fff" />
            <Text style={styles.optionText}>Pattern (Draw)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Lock detail setup screens ---
  if (lockType === 'pin' && !vaultPassword) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setLockType(null)}><Text style={styles.cancelText}>Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Set PIN</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.content}>
          <TextInput style={styles.input} placeholder="Enter 4+ digit PIN" placeholderTextColor="#555" keyboardType="number-pad" secureTextEntry value={password} onChangeText={setPassword} />
          <TouchableOpacity style={styles.saveBtn} onPress={setupPin}><Text style={styles.saveBtnText}>Save PIN</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  if (lockType === 'fingerprint' && !vaultPassword) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setLockType(null)}><Text style={styles.cancelText}>Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Set Fingerprint</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.content}>
          <Text style={styles.instruction}>Place your finger on the sensor</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={setupFingerprint}><Text style={styles.saveBtnText}>Enable</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  if (lockType === 'pattern' && !savedPattern) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setLockType(null)}><Text style={styles.cancelText}>Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Draw Pattern</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.patternContainer}>
          <Text style={styles.instruction}>Connect at least 4 dots</Text>
          <View style={styles.grid}>
            {PATTERN_DOTS.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dot, pattern.includes(index) && styles.dotSelected]}
                onPressIn={() => handlePatternDot(index)}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={savePattern}><Text style={styles.saveBtnText}>Save Pattern</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setPattern([])}><Text style={styles.resetText}>Reset</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Unlock screen ---
  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.cancelText}>Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Unlock Vault</Text>
          <View style={{ width: 50 }} />
        </View>
        {lockType === 'pin' && (
          <View style={styles.content}>
            <TextInput style={styles.input} placeholder="Enter PIN" placeholderTextColor="#555" keyboardType="number-pad" secureTextEntry value={attempt} onChangeText={setAttempt} />
            <TouchableOpacity style={styles.saveBtn} onPress={unlockWithPin}><Text style={styles.saveBtnText}>Unlock</Text></TouchableOpacity>
          </View>
        )}
        {lockType === 'fingerprint' && (
          <View style={styles.content}>
            <TouchableOpacity style={styles.saveBtn} onPress={unlockWithFingerprint}><Text style={styles.saveBtnText}>Use Fingerprint</Text></TouchableOpacity>
          </View>
        )}
        {lockType === 'pattern' && (
          <View style={styles.patternContainer}>
            <Text style={styles.instruction}>Draw your pattern</Text>
            <View style={styles.grid}>
              {PATTERN_DOTS.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dot, pattern.includes(index) && styles.dotSelected]}
                  onPressIn={() => handlePatternDot(index)}
                  onPressOut={() => { if (pattern.length >= 4) verifyPattern(); }}
                />
              ))}
            </View>
            <TouchableOpacity onPress={() => setPattern([])}><Text style={styles.resetText}>Clear</Text></TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // --- Main vault (unlocked) ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setIsUnlocked(false); router.back(); }}><Text style={styles.cancelText}>Lock</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Files</Text>
        <TouchableOpacity onPress={pickFile}><Ionicons name="add" size={26} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList
        data={files}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.fileRow}>
            <Ionicons name="document-outline" size={20} color="#fff" />
            <Text style={styles.fileName}>{item.name}</Text>
            <TouchableOpacity onPress={() => removeFile(index)}>
              <Ionicons name="trash-outline" size={18} color="#FF4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  cancelText: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content: { paddingHorizontal: 16, marginTop: 40 },
  instruction: { color: '#888', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 10, gap: 12 },
  optionText: { color: '#fff', fontSize: 16 },
  input: { color: '#fff', fontSize: 16, backgroundColor: '#1a1a1a', padding: 14, borderRadius: 10, marginBottom: 16 },
  saveBtn: { backgroundColor: '#4ECDC4', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', gap: 10 },
  fileName: { color: '#fff', flex: 1, fontSize: 15 },
  patternContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 250, justifyContent: 'space-around' },
  dot: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a1a1a', margin: 10 },
  dotSelected: { backgroundColor: '#4ECDC4' },
  resetText: { color: '#FF4444', fontSize: 16, marginTop: 20 },
});
