// app/add-new-goal.tsx - Fixed version with custom emoji picker

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList, Alert, Switch,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { addGoal, getChecklists, linkGoalToActivity } from '../activitiesStore';

const weekDays = [
  { id: 'mon', label: 'Mon', full: 'Monday' },
  { id: 'tue', label: 'Tue', full: 'Tuesday' },
  { id: 'wed', label: 'Wed', full: 'Wednesday' },
  { id: 'thu', label: 'Thu', full: 'Thursday' },
  { id: 'fri', label: 'Fri', full: 'Friday' },
  { id: 'sat', label: 'Sat', full: 'Saturday' },
  { id: 'sun', label: 'Sun', full: 'Sunday' },
];

// Common emojis organized by category
const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']
  },
  {
    name: 'Hearts & Emotions',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐']
  },
  {
    name: 'Activities & Sports',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🎨', '🎬', '🎤', '🎧', '🎷', '🎸', '🎹', '🎺', '🎻', '🥁', '🎮', '🕹️', '🎲', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴']
  },
  {
    name: 'Objects & Symbols',
    emojis: ['💪', '👑', '🎓', '💍', '💅', '💎', '📱', '💻', '⌚', '📷', '🔒', '🔓', '🔑', '💡', '🔋', '📚', '✏️', '📌', '✂️', '📎', '🔗', '🎈', '🎉', '🎊', '🎁', '🏺', '⚱️', '⚰️', '🕯️', '🗿', '🛡️', '⚙️', '🔧', '🔨', '🪚', '🪛', '🔩', '🪤', '🧲', '💊', '💉', '🩺', '🧬', '🩸', '🦷', '🦴', '🧪', '🧫', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🚪', '🪞', '🪟', '🪑', '🛏️', '🛋️', '🚽', '🚿', '🪠', '🧴', '🧷', '🧸', '🪅', '🪆', '🪄']
  },
  {
    name: 'Nature',
    emojis: ['⭐', '🌟', '✨', '⚡', '🔥', '💧', '💨', '☀️', '🌈', '☁️', '⛅', '❄️', '☃️', '⛄', '🌊', '🌍', '🌎', '🌏', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☄️', '💫', '🌱', '🌿', '🍀', '🎋', '🌲', '🌳', '🌴', '🌵', '🌾', '🌽', '🍄', '🌹', '🌺', '🌻', '🌼', '🌸', '🌷', '💐', '🐒', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐙', '🐵', '🐔', '🐧', '🐦', '🐤', '🐴', '🐺', '🦋', '🐌', '🐞', '🐜', '🕷️', '🦂', '🐢', '🐍', '🦎', '🐠', '🐟', '🐡', '🐬', '🐳', '🐋', '🦈', '🦭']
  },
  {
    name: 'Food',
    emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🧂', '🥤', '🧃', '🧋', '🍵', '☕', '🍺', '🍻', '🥂', '🥃', '🥄', '🍴', '🍽️']
  }
];

// Expanded color options
const GOAL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7B731', '#FF9F4A', '#E8635E', '#6C5CE7', '#A8E6CF',
  '#FF8C42', '#4A90E2', '#50E3C2', '#F5A623', '#7ED321', '#9013FE',
  '#417505', '#BD10E0', '#8B572A', '#2C3E50', '#E91E63', '#9B59B6',
  '#1ABC9C', '#3498DB', '#E67E22', '#2ECC71', '#F1C40F', '#E74C3C',
  '#34495E', '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#F39C12',
  '#D35400', '#C0392B', '#7F8C8D', '#95A5A6', '#663399', '#FF4500',
  '#00CED1', '#FF1493', '#00FF7F', '#FFD700', '#9400D3', '#DC143C',
];

export default function AddNewGoal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const activityId = params.activityId as string;
  const activityName = params.activityName as string;

  const [goalTitle, setGoalTitle] = useState('');
  const [trackEntireActivity, setTrackEntireActivity] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [duration, setDuration] = useState('2h');
  const [finishedEmoji, setFinishedEmoji] = useState('😊');
  const [selectedChecklist, setSelectedChecklist] = useState<{ title: string; icon: string; index: number } | null>(null);
  const [shortcuts, setShortcuts] = useState('None');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showChecklistPicker, setShowChecklistPicker] = useState(false);
  const [availableChecklists, setAvailableChecklists] = useState<{ title: string; icon: string; index: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [emojiSearch, setEmojiSearch] = useState('');

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = () => {
    const lists = getChecklists();
    setAvailableChecklists(lists.map((c, i) => ({
      title: c.title,
      icon: c.icon || 'list-outline',
      index: i
    })));
  };

  const getNextId = () => {
    return Date.now();
  };

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const getSelectedDaysDisplay = () => {
    if (selectedDays.length === 0) return 'Select days';
    if (selectedDays.length === 7) return 'Every Day';
    return selectedDays.map(dayId => weekDays.find(d => d.id === dayId)?.label).join(', ');
  };

  const handleCreate = () => {
    if (!goalTitle.trim()) {
      Alert.alert('Required', 'Please enter a goal title.');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Required', 'Please select at least one day for your goal.');
      return;
    }

    const newGoal = {
      id: getNextId(),
      title: goalTitle.trim(),
      progress: 0,
      color: selectedColor,
      emoji: finishedEmoji,
      isActive: false,
      isCompleted: false,
      widthPercent: 100,
      remainingSeconds: null,
      selectedDays: selectedDays,
      duration: duration,
      trackEntireActivity: trackEntireActivity,
      checklist: selectedChecklist,
      shortcuts: shortcuts,
    };

    addGoal(newGoal);

    if (activityId) {
      linkGoalToActivity(activityId, newGoal.id);
    }

    Alert.alert('Success', 'Goal created successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const getFilteredEmojis = () => {
    if (!emojiSearch.trim()) {
      return EMOJI_CATEGORIES[selectedCategory].emojis;
    }
    const searchLower = emojiSearch.toLowerCase();
    return EMOJI_CATEGORIES.flatMap(cat => cat.emojis).filter(emoji =>
      emoji.toLowerCase().includes(searchLower)
    );
  };

  const SettingRow = ({ label, value, onPress, rightElement }: any) => (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.optionLeft}>
        <Text style={styles.optionLabel}>{label}</Text>
      </View>
      <View style={styles.optionRight}>
        {rightElement ? rightElement : <Text style={styles.optionValue}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={16} color="#555" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Goal</Text>
        <TouchableOpacity onPress={handleCreate} style={styles.headerRight}>
          <View style={styles.createButtonContainer}>
            <Text style={styles.createButtonText}>Create</Text>
          </View>
        </TouchableOpacity>
      </View>

      {activityId && activityName && (
        <View style={styles.activityBadge}>
          <Ionicons name="flag-outline" size={16} color="#fff" />
          <Text style={styles.activityBadgeText}>
            Creating goal for: {activityName}
          </Text>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        <View style={styles.previewCard}>
          <View style={[styles.previewIconContainer, { backgroundColor: selectedColor + '20' }]}>
            <Text style={[styles.previewEmoji, { color: selectedColor }]}>{finishedEmoji}</Text>
          </View>
          <Text style={styles.previewName}>{goalTitle || 'New Goal'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Goal title"
            placeholderTextColor="#555"
            value={goalTitle}
            onChangeText={setGoalTitle}
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <TouchableOpacity style={styles.optionRow} onPress={() => setShowEmojiPicker(true)}>
            <View style={styles.optionLeft}>
              <Text style={styles.optionLabel}>Finished Emoji</Text>
            </View>
            <View style={styles.optionRight}>
              <Text style={styles.emojiValue}>{finishedEmoji}</Text>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => setShowColorPicker(true)}>
            <View style={styles.optionLeft}>
              <Text style={styles.optionLabel}>Color</Text>
            </View>
            <View style={styles.optionRight}>
              <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal Settings</Text>

          <SettingRow
            label="Track Entire Activity"
            rightElement={
              <Switch
                value={trackEntireActivity}
                onValueChange={setTrackEntireActivity}
                trackColor={{ false: '#333', true: '#fff' }}
                thumbColor={trackEntireActivity ? '#fff' : '#888'}
              />
            }
          />

          <SettingRow
            label="Repeat On"
            value={getSelectedDaysDisplay()}
            onPress={() => setShowDayPicker(true)}
          />

          <SettingRow
            label="Duration"
            value={duration}
            onPress={() => {
              Alert.alert('Set Duration', '', [
                { text: '30 min', onPress: () => setDuration('30 min') },
                { text: '1h', onPress: () => setDuration('1h') },
                { text: '2h', onPress: () => setDuration('2h') },
                { text: '3h', onPress: () => setDuration('3h') },
                { text: '4h', onPress: () => setDuration('4h') },
                { text: 'Custom', onPress: () => setDuration('Custom') },
              ]);
            }}
          />

          <SettingRow
            label="Checklist"
            value={selectedChecklist?.title || 'None'}
            onPress={() => {
              loadChecklists();
              setShowChecklistPicker(true);
            }}
          />

          <SettingRow
            label="Shortcuts"
            value={shortcuts}
            onPress={() => router.push('/goal-shortcuts')}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Day Picker Modal */}
      <Modal visible={showDayPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDayPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerContent}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Days</Text>
                  <TouchableOpacity onPress={() => setShowDayPicker(false)}>
                    <View style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Choose which days to repeat this goal</Text>
                <View style={styles.daysGrid}>
                  {weekDays.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.dayButton,
                        selectedDays.includes(day.id) && styles.dayButtonSelected,
                      ]}
                      onPress={() => toggleDay(day.id)}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        selectedDays.includes(day.id) && styles.dayButtonTextSelected,
                      ]}>{day.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedDays.length === 7 && (
                  <Text style={styles.hintText}>Every day selected</Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Checklist Picker Modal */}
      <Modal visible={showChecklistPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowChecklistPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerContent}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Checklist</Text>
                  <TouchableOpacity onPress={() => setShowChecklistPicker(false)}>
                    <View style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {availableChecklists.length === 0 ? (
                  <View style={styles.noChecklistsContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#333" />
                    <Text style={styles.noChecklistsTitle}>No Checklists Yet</Text>
                    <Text style={styles.noChecklistsText}>
                      Create checklists from the Settings page first.
                    </Text>
                    <TouchableOpacity
                      style={styles.createChecklistButton}
                      onPress={() => {
                        setShowChecklistPicker(false);
                        router.push('/new-checklist');
                      }}
                    >
                      <Text style={styles.createChecklistButtonText}>Create Checklist</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <FlatList
                      data={availableChecklists}
                      keyExtractor={(_, i) => i.toString()}
                      renderItem={({ item }) => {
                        const isSelected = selectedChecklist?.index === item.index;
                        return (
                          <TouchableOpacity
                            style={[styles.checklistItem, isSelected && styles.checklistItemSelected]}
                            onPress={() => {
                              setSelectedChecklist(item);
                              setShowChecklistPicker(false);
                            }}
                          >
                            <View style={styles.checklistItemLeft}>
                              <Ionicons name={item.icon as any || 'list-outline'} size={24} color={isSelected ? '#fff' : '#888'} />
                              <Text style={[styles.checklistItemText, isSelected && styles.checklistItemTextSelected]}>
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
                      style={styles.createNewButton}
                      onPress={() => {
                        setShowChecklistPicker(false);
                        router.push('/new-checklist');
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#fff" />
                      <Text style={styles.createNewText}>Create New Checklist</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Custom Emoji Picker Modal - No external library */}
      <Modal visible={showEmojiPicker} transparent animationType="slide">
        <View style={styles.emojiModalContainer}>
          <View style={styles.emojiModalHeader}>
            <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
              <Text style={styles.emojiModalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.emojiModalTitle}>Choose Emoji</Text>
            <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
              <Text style={styles.emojiModalDone}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search emoji..."
              placeholderTextColor="#555"
              value={emojiSearch}
              onChangeText={setEmojiSearch}
            />
            {emojiSearch.length > 0 && (
              <TouchableOpacity onPress={() => setEmojiSearch('')}>
                <Ionicons name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Tabs */}
          {!emojiSearch && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
              {EMOJI_CATEGORIES.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryTab,
                    selectedCategory === index && styles.categoryTabSelected
                  ]}
                  onPress={() => setSelectedCategory(index)}
                >
                  <Text style={[
                    styles.categoryTabText,
                    selectedCategory === index && styles.categoryTabTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Emoji Grid */}
          <FlatList
            data={getFilteredEmojis()}
            numColumns={8}
            keyExtractor={(item, index) => item + index}
            contentContainerStyle={styles.emojiGrid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.emojiItem,
                  finishedEmoji === item && styles.emojiItemSelected
                ]}
                onPress={() => {
                  setFinishedEmoji(item);
                  setShowEmojiPicker(false);
                  setEmojiSearch('');
                }}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyEmojiContainer}>
                <Text style={styles.emptyEmojiText}>No emojis found</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowColorPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerContent}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Choose Color</Text>
                  <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                    <View style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={GOAL_COLORS}
                  numColumns={4}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.colorItem,
                        { backgroundColor: item },
                        selectedColor === item && styles.colorItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedColor(item);
                        setShowColorPicker(false);
                      }}
                    />
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    position: 'absolute',
    left: 16,
    top: 60,
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    top: 60,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  createButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  activityBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    gap: 12,
  },
  previewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 28,
  },
  previewName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
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
    fontSize: 15,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionValue: {
    color: '#888',
    fontSize: 13,
    marginRight: 8,
  },
  emojiValue: {
    color: '#fff',
    fontSize: 20,
    marginRight: 8,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  dayButtonSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  dayButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: '#000',
  },
  hintText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  checklistItem: {
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
  checklistItemSelected: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  checklistItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checklistItemText: {
    color: '#fff',
    fontSize: 16,
  },
  checklistItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  noChecklistsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noChecklistsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  noChecklistsText: {
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
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  createNewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  // Custom Emoji Picker Styles
  emojiModalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  emojiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  emojiModalCancel: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: '500',
  },
  emojiModalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  emojiModalDone: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0a0a0a',
    marginRight: 8,
  },
  categoryTabSelected: {
    backgroundColor: '#fff',
  },
  categoryTabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTabTextSelected: {
    color: '#000',
  },
  emojiGrid: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  emojiItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    margin: 4,
    borderRadius: 10,
    backgroundColor: '#0a0a0a',
  },
  emojiItemSelected: {
    backgroundColor: '#fff',
    transform: [{ scale: 1.05 }],
  },
  emojiText: {
    fontSize: 28,
  },
  emptyEmojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyEmojiText: {
    color: '#888',
    fontSize: 16,
  },
  colorItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 8,
    borderRadius: 8,
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ scale: 1.05 }],
  },
});
