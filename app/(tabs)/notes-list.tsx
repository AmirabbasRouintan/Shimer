import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { store } from "../miscStore";

export default function NotesListScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const loadNotes = useCallback(() => {
    const saved = store["notes"];
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const interval = setInterval(loadNotes, 1000);
    return () => clearInterval(interval);
  }, [loadNotes]);

  const grouped = notes.reduce((acc: Record<string, any[]>, note) => {
    const cat = note.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(note);
    return acc;
  }, {});

  const categoryOrder = Object.keys(grouped).sort();

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleNotePress = (note: any) => {
    router.push(`/new-note?noteId=${note.id}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getTitlePreview = (note: any) => {
    if (note.content) {
      const stripped = note.content.replace(/<[^>]*>/g, '').trim();
      return stripped.substring(0, 80) + (stripped.length > 80 ? '...' : '');
    }
    return 'No content';
  };

  return (
    <View className="flex-1 bg-black pt-[60px]">
      <View className="flex-row justify-between items-center px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-white text-base">Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Notes</Text>
        <TouchableOpacity onPress={() => router.push("/new-note")}>
          <Ionicons name="add-circle-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {notes.length === 0 && (
          <View className="items-center justify-center py-20">
            <Ionicons name="document-text-outline" size={48} color="#333" />
            <Text className="text-gray-400 text-lg mt-4 font-medium">No notes yet</Text>
            <Text className="text-gray-500 text-sm mt-2">Tap + to create your first note</Text>
          </View>
        )}

        {categoryOrder.map((cat) => {
          const isExpanded = expandedCategories.has(cat);
          const catNotes = grouped[cat];
          return (
            <View key={cat} className="mb-1">
              <TouchableOpacity
                className="flex-row items-center gap-2 py-3 px-1 border-b-[0.5px] border-[#1a1a1a]"
                onPress={() => toggleCategory(cat)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isExpanded ? "chevron-down" : "chevron-forward"}
                  size={16}
                  color="#888"
                />
                <Ionicons name="folder-outline" size={18} color="#888" />
                <Text className="text-white text-base font-semibold flex-1">{cat}</Text>
                <View className="bg-[#1a1a1a] rounded-xl px-2 py-0.5">
                  <Text className="text-gray-400 text-xs font-medium">{catNotes.length}</Text>
                </View>
              </TouchableOpacity>

              {isExpanded && catNotes.map((note: any) => (
                <TouchableOpacity
                  key={note.id}
                  className="flex-row items-center gap-2.5 py-2.5 pl-10 pr-1 border-b-[0.5px] border-[#111]"
                  onPress={() => handleNotePress(note)}
                  activeOpacity={0.6}
                >
                  <View className="w-5 items-center">
                    <Ionicons name="document-text-outline" size={16} color="#a3a3a3" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-medium mb-0.5" numberOfLines={1}>{note.title}</Text>
                    <Text className="text-gray-500 text-xs mb-0.5" numberOfLines={1}>{getTitlePreview(note)}</Text>
                    <Text className="text-gray-600 text-[10px]">{formatDate(note.createdAt)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#444" />
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
