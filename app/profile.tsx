import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { shadcn } from '../constants/components-theme';
import { useAuth } from './auth/AuthContext';
import { AUTH_CONFIG } from '../constants/auth';
import { Header } from '../components/Header';
import Toast, { ToastData } from '../components/Toast';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, signOut } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [picture, setPicture] = useState(user?.picture || '');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, picture }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Profile saved successfully', type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to update profile', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!token) return;
    if (!currentPassword || !newPassword) {
      setToast({ message: 'Please fill both password fields', type: 'error' });
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Password changed successfully', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setToast({ message: data.error || 'Failed to change password', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setUploadingImage(true);
      try {
        const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/upload/image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setPicture(data.url);
          setToast({ message: 'Photo uploaded successfully', type: 'success' });
        } else {
          setToast({ message: data.error || 'Failed to upload photo', type: 'error' });
        }
      } catch {
        setToast({ message: 'Network error. Please try again.', type: 'error' });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.notLoggedIn}>Not logged in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Profile" onBack={() => router.back()} rightAction={{ label: 'Save', onPress: handleSaveProfile }} />
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
            {picture ? (
              <Image source={{ uri: picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#888" />
              </View>
            )}
            {uploadingImage && (
              <View style={styles.avatarUploadOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#000" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#555"
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Your email"
            placeholderTextColor="#555"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Save Profile */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          activeOpacity={0.7}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Password Change - only for email accounts */}
        {user.auth_provider === 'email' && (
          <>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>Change Password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current password"
                  placeholderTextColor="#555"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password (6+ chars)"
                  placeholderTextColor="#555"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} activeOpacity={0.7}>
                  <Ionicons
                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.passwordButton, changingPassword && styles.buttonDisabled]}
              activeOpacity={0.7}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator size="small" color="#fafafa" />
              ) : (
                <Text style={styles.passwordButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  notLoggedIn: {
    color: shadcn.colors.mutedForeground,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: shadcn.spacing.lg },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 45,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: shadcn.colors.card,
    color: shadcn.colors.foreground,
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: shadcn.colors.card,
    borderRadius: 12,
    paddingRight: 14,
  },
  passwordInput: {
    flex: 1,
    color: shadcn.colors.foreground,
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#fafafa',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: { opacity: 0.5 },
  sectionDivider: {
    height: 1,
    backgroundColor: shadcn.colors.border,
    marginVertical: 28,
  },
  sectionTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  passwordButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fafafa',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  passwordButtonText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
});
