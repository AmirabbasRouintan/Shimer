import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PickerModal } from './PickerModal';

type ChecklistItem = { title: string; icon: string; index: number };

type ChecklistPickerModalProps = {
  visible: boolean;
  checklists: ChecklistItem[];
  selectedIndex: number | null;
  onSelect: (item: ChecklistItem) => void;
  onClose: () => void;
};

export function ChecklistPickerModal({
  visible,
  checklists,
  selectedIndex,
  onSelect,
  onClose,
}: ChecklistPickerModalProps) {
  const router = useRouter();

  return (
    <PickerModal visible={visible} title="Select Checklist" onClose={onClose}>
      {checklists.length === 0 ? (
        <EmptyState onClose={onClose} />
      ) : (
        <>
          <FlatList
            data={checklists}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => {
              const isSelected = selectedIndex === item.index;
              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.selected]}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.itemLeft}>
                    <Ionicons name={item.icon as any || 'list-outline'} size={24} color={isSelected ? '#fff' : '#888'} />
                    <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                      {item.title}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              onClose();
              router.push('/new-checklist');
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createText}>Create New Checklist</Text>
          </TouchableOpacity>
        </>
      )}
    </PickerModal>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <View style={styles.empty}>
      <Ionicons name="document-text-outline" size={48} color="#333" />
      <Text style={styles.emptyTitle}>No Checklists Yet</Text>
      <Text style={styles.emptyText}>
        Create checklists from the Settings page first.
      </Text>
      <TouchableOpacity
        style={styles.createChecklistButton}
        onPress={() => {
          onClose();
          router.push('/new-checklist');
        }}
      >
        <Text style={styles.createChecklistButtonText}>Create Checklist</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  selected: {
    borderColor: '#fff',
    backgroundColor: 'rgba(78,205,196,0.1)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemText: {
    color: '#fff',
    fontSize: 16,
  },
  itemTextSelected: {
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  createText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createChecklistButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  createChecklistButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
});
