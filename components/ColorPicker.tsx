import { TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { colorOptions } from '@/constants/activity-options';

type ColorPickerProps = {
  selected: string;
  onSelect: (color: string) => void;
};

export function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  return (
    <FlatList
      data={colorOptions}
      numColumns={4}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.colorItem,
            { backgroundColor: item },
            selected === item && styles.selected,
          ]}
          onPress={() => onSelect(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  colorItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 8,
  },
  selected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
});
