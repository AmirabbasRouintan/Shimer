import { TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { iconOptions } from '@/constants/activity-options';

type IconPickerProps = {
  selected: string;
  onSelect: (icon: string) => void;
};

export function IconPicker({ selected, onSelect }: IconPickerProps) {
  return (
    <FlatList
      data={iconOptions}
      numColumns={4}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.iconItem, selected === item && styles.selected]}
          onPress={() => onSelect(item)}
        >
          <Ionicons
            name={item}
            size={24}
            color={selected === item ? '#fff' : '#888'}
          />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  iconItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    margin: 4,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  selected: {
    backgroundColor: '#333',
  },
});
