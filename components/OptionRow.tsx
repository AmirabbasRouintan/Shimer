import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';

type OptionRowProps = {
  icon: string;
  label: string;
  onPress?: () => void;
  rightContent?: ReactNode;
};

export function OptionRow({ icon, label, onPress, rightContent }: OptionRowProps) {
  const Content = (
    <View style={styles.optionRow}>
      <View style={styles.optionLeft}>
        <Ionicons name={icon} size={18} color="#888" />
        <Text style={styles.optionLabel}>{label}</Text>
      </View>
      {rightContent ?? <Ionicons name="chevron-forward" size={16} color="#555" />}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{Content}</TouchableOpacity>;
  }
  return Content;
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 14,
  },
});
