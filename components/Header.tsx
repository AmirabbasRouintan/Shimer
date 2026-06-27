import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadcn } from '@/constants/components-theme';
import type { ReactNode } from 'react';

type HeaderAction = {
  label: string;
  onPress: () => void;
};

type HeaderProps = {
  title?: string;
  onBack?: () => void;
  leftAction?: HeaderAction;
  rightAction?: HeaderAction & { variant?: 'pill' | 'text' };
  centerContent?: ReactNode;
};

export function Header({ title, onBack, leftAction, rightAction, centerContent }: HeaderProps) {
  const rightVariant = rightAction?.variant ?? 'pill';

  return (
    <View style={styles.header}>
      <View style={styles.sideLeft}>
        {leftAction ? (
          <TouchableOpacity onPress={leftAction.onPress}>
            <Text style={styles.leftText}>{leftAction.label}</Text>
          </TouchableOpacity>
        ) : onBack ? (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color={shadcn.colors.foreground} />
          </TouchableOpacity>
        ) : null}
      </View>

      {centerContent ?? <Text style={styles.title} numberOfLines={1}>{title}</Text>}

      <View style={styles.sideRight}>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress}>
            {rightVariant === 'pill' ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{rightAction.label}</Text>
              </View>
            ) : (
              <Text style={styles.rightText}>{rightAction.label}</Text>
            )}
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
  sideLeft: {
    width: 70,
    alignItems: 'flex-start',
  },
  sideRight: {
    width: 70,
    alignItems: 'flex-end',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  pill: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  leftText: {
    color: shadcn.colors.foreground,
    fontSize: 16,
  },
  rightText: {
    color: '#888',
    fontSize: 16,
  },
});
