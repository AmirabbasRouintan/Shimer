import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getActivities, setActivities, type Activity, getChecklists } from '../activitiesStore';
import { Header } from '@/components/Header';
import { FormSection } from '@/components/FormSection';
import { OptionRow } from '@/components/OptionRow';
import { ActivityPreviewCard } from '@/components/ActivityPreviewCard';
import { PickerModal } from '@/components/PickerModal';
import { IconPicker } from '@/components/IconPicker';
import { ColorPicker } from '@/components/ColorPicker';
import { ChecklistPickerModal } from '@/components/ChecklistPickerModal';

export default function AddActivityPage() {
  const router = useRouter();

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChecklistPicker, setShowChecklistPicker] = useState(false);

  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('folder-outline');
  const [formColor, setFormColor] = useState('#FF6B6B');
  const [formKeepScreenOn, setFormKeepScreenOn] = useState(false);
  const [formPomodoro, setFormPomodoro] = useState('25');
  const [formGoals, setFormGoals] = useState('');
  const [formTimerHints, setFormTimerHints] = useState('');

  const [selectedChecklist, setSelectedChecklist] = useState<{ title: string; icon: string; index: number } | null>(null);
  const [availableChecklists, setAvailableChecklists] = useState<{ title: string; icon: string; index: number }[]>([]);

  const loadChecklists = () => {
    const lists = getChecklists();
    setAvailableChecklists(lists.map((c, i) => ({
      title: c.title,
      icon: c.icon || 'list-outline',
      index: i,
    })));
  };

  useFocusEffect(
    useCallback(() => {
      setFormName('');
      setFormIcon('folder-outline');
      setFormColor('#FF6B6B');
      setFormKeepScreenOn(false);
      setFormPomodoro('25');
      setFormGoals('');
      setFormTimerHints('');
      setSelectedChecklist(null);
      loadChecklists();
    }, [])
  );

  const getNextId = () => {
    const activities = getActivities();
    const maxId = Math.max(...activities.map(a => parseInt(a.id)), 0);
    return (maxId + 1).toString();
  };

  const handleCreate = () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter an activity name.');
      return;
    }

    const currentActivities = getActivities();
    if (currentActivities.some(a => a.name.toLowerCase() === formName.trim().toLowerCase())) {
      Alert.alert('Duplicate', 'An activity with this name already exists.');
      return;
    }

    const newActivity: Activity = {
      id: getNextId(),
      name: formName.trim(),
      icon: formIcon,
      color: formColor,
      keepScreenOn: formKeepScreenOn,
      pomodoro: parseInt(formPomodoro) || 25,
      goals: formGoals,
      timerHints: formTimerHints,
      checklists: [],
      shortcuts: [],
      linkedChecklistIndex: selectedChecklist?.index ?? null,
    };

    setActivities([...currentActivities, newActivity]);
  };

  return (
    <View style={styles.container}>
      <Header
        title="New Activity"
        onBack={() => router.replace('/edit_things')}
        rightAction={{ label: 'Create', onPress: handleCreate }}
      />

      <ScrollView style={styles.scrollView}>
        <ActivityPreviewCard icon={formIcon} color={formColor} name={formName} />

        <FormSection title="Basic Information">
          <TextInput
            style={styles.nameInput}
            placeholder="Activity Name"
            placeholderTextColor="#555"
            value={formName}
            onChangeText={setFormName}
            autoFocus
          />
        </FormSection>

        <FormSection title="Appearance">
          <OptionRow
            icon="image-outline"
            label="Icon"
            onPress={() => setShowIconPicker(true)}
            rightContent={
              <Ionicons name={formIcon} size={20} color="#888" />
            }
          />
          <OptionRow
            icon="color-palette-outline"
            label="Color"
            onPress={() => setShowColorPicker(true)}
            rightContent={
              <View style={[styles.colorPreview, { backgroundColor: formColor }]} />
            }
          />
        </FormSection>

        <FormSection title="Timer Settings">
          <OptionRow
            icon="timer-outline"
            label="Pomodoro Duration"
            rightContent={
              <View style={styles.pomodoroContainer}>
                <TextInput
                  style={styles.pomodoroInput}
                  value={formPomodoro}
                  onChangeText={setFormPomodoro}
                  keyboardType="numeric"
                  placeholder="25"
                  placeholderTextColor="#555"
                />
                <Ionicons name="time-outline" size={14} color="#888" />
              </View>
            }
          />
        </FormSection>

        <FormSection title="Goals">
          <OptionRow
            icon="flag-outline"
            label="Add Goal"
            onPress={() => Alert.alert('Coming Soon', 'You can add goals after creating the activity.')}
          />
        </FormSection>

        <FormSection title="Checklist">
          {selectedChecklist ? (
            <View style={styles.linkedChecklistItem}>
              <View style={styles.linkedChecklistLeft}>
                <Ionicons name={selectedChecklist.icon as any || 'list-outline'} size={20} color="#fff" />
                <Text style={styles.linkedChecklistTitle}>{selectedChecklist.title}</Text>
              </View>
              <Ionicons name="close-circle" size={20} color="#FF6B6B" onPress={() => setSelectedChecklist(null)} />
            </View>
          ) : (
            <OptionRow
              icon="list-outline"
              label="Link Checklist"
              onPress={() => {
                loadChecklists();
                setShowChecklistPicker(true);
              }}
            />
          )}
        </FormSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      <PickerModal visible={showIconPicker} title="Choose Icon" onClose={() => setShowIconPicker(false)}>
        <IconPicker selected={formIcon} onSelect={(icon) => { setFormIcon(icon); setShowIconPicker(false); }} />
      </PickerModal>

      <PickerModal visible={showColorPicker} title="Choose Color" onClose={() => setShowColorPicker(false)}>
        <ColorPicker selected={formColor} onSelect={(color) => { setFormColor(color); setShowColorPicker(false); }} />
      </PickerModal>

      <ChecklistPickerModal
        visible={showChecklistPicker}
        checklists={availableChecklists}
        selectedIndex={selectedChecklist?.index ?? null}
        onSelect={(item) => { setSelectedChecklist(item); setShowChecklistPicker(false); }}
        onClose={() => setShowChecklistPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  nameInput: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#0a0a0a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  pomodoroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pomodoroInput: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 50,
    textAlign: 'center',
  },
  linkedChecklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  linkedChecklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  linkedChecklistTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});
