import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  duration?: number;
}

const ICONS: Record<ToastType, string> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
};

const COLORS: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: '#14532d', text: '#bbf7d0', icon: '#4ade80' },
  error: { bg: '#7f1d1d', text: '#fecaca', icon: '#f87171' },
  info: { bg: '#1e3a5f', text: '#bfdbfe', icon: '#60a5fa' },
};

export default function Toast({ toast, onDismiss, duration = 3000 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    if (!toast) return;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -80, duration: 300, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, duration);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const c = COLORS[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: c.bg, opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={ICONS[toast.type]} size={20} color={c.icon} />
      <Text style={[styles.text, { color: c.text }]}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
