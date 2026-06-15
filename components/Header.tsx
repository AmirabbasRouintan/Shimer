import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadcn } from '@/constants/components-theme';

type HeaderProps = {
  title: string;
  onBack: () => void;
  rightAction?: { label: string; onPress: () => void };
};

export function Header({ title, onBack, rightAction }: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerLeft}>
        <Ionicons name="arrow-back" size={25} color={shadcn.colors.foreground} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress}>
            <View style={styles.actionButton}>
              <Text style={styles.actionText}>{rightAction.label}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    width: 70,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 70,
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
});
