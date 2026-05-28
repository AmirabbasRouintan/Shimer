import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { shadcn } from "../../constants/components-theme";

const store: Record<string, any> = {};

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
    const unsubscribe = () => {};
    const interval = setInterval(loadNotes, 1000);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notes</Text>
        <TouchableOpacity onPress={() => router.push("/new-note")}>
          <Ionicons name="add-circle-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {notes.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color="#333" />
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first note</Text>
          </View>
        )}

        {categoryOrder.map((cat) => {
          const isExpanded = expandedCategories.has(cat);
          const catNotes = grouped[cat];
          return (
            <View key={cat} style={styles.categorySection}>
              <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(cat)} activeOpacity={0.7}>
                <Ionicons
                  name={isExpanded ? "chevron-down" : "chevron-forward"}
                  size={16}
                  color="#888"
                />
                <Ionicons name="folder-outline" size={18} color="#888" />
                <Text style={styles.categoryTitle}>{cat}</Text>
                <View style={styles.categoryCount}>
                  <Text style={styles.categoryCountText}>{catNotes.length}</Text>
                </View>
              </TouchableOpacity>

              {isExpanded && catNotes.map((note: any) => (
                <TouchableOpacity
                  key={note.id}
                  style={styles.noteRow}
                  onPress={() => handleNotePress(note)}
                  activeOpacity={0.6}
                >
                  <View style={styles.noteIcon}>
                    <Ionicons name="document-text-outline" size={16} color={shadcn.colors.mutedForeground} />
                  </View>
                  <View style={styles.noteInfo}>
                    <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
                    <Text style={styles.notePreview} numberOfLines={1}>{getTitlePreview(note)}</Text>
                    <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cancelText: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  list: { flex: 1, paddingHorizontal: 16 },
  listContent: { paddingBottom: 40 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { color: '#888', fontSize: 18, marginTop: 16, fontWeight: '500' },
  emptySubtext: { color: '#555', fontSize: 14, marginTop: 8 },
  categorySection: { marginBottom: 4 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  categoryTitle: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  categoryCount: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryCountText: { color: '#888', fontSize: 12, fontWeight: '500' },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 40,
    paddingRight: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#111',
  },
  noteIcon: { width: 20, alignItems: 'center' },
  noteInfo: { flex: 1 },
  noteTitle: { color: '#fff', fontSize: 14, fontWeight: '500', marginBottom: 2 },
  notePreview: { color: '#555', fontSize: 11, marginBottom: 2 },
  noteDate: { color: '#444', fontSize: 10 },
});
