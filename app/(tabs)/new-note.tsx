import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { shadcn } from "../../constants/components-theme";

const store: Record<string, any> = {};

const editorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      background-color: #1a1a1a;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 16px;
      padding: 16px;
      margin: 0;
      outline: none;
      min-height: 100vh;
    }
    img { max-width: 100%; }
    
    h1 { font-size: 28px; margin: 16px 0 8px 0; border-bottom: 2px solid #444; padding-bottom: 8px; }
    h2 { font-size: 24px; margin: 14px 0 6px 0; border-bottom: 1px solid #444; padding-bottom: 6px; }
    h3 { font-size: 20px; margin: 12px 0 4px 0; }
    h4 { font-size: 18px; margin: 10px 0 4px 0; }
    
    blockquote {
      position: relative;
      border-left: 4px solid #4ECDC4;
      margin: 16px 0;
      padding: 12px 16px 12px 24px;
      color: #aaa;
      font-style: italic;
      background: rgba(255,255,255,0.05);
      border-radius: 0 8px 8px 0;
    }
    blockquote::before {
      content: open-quote;
      position: absolute;
      left: 8px;
      top: 0;
      font-size: 32px;
      color: #4ECDC4;
      line-height: 1;
    }
    blockquote::after {
      content: close-quote;
      position: absolute;
      right: 12px;
      bottom: -8px;
      font-size: 32px;
      color: #4ECDC4;
      line-height: 1;
    }
    
    pre {
      background: #111;
      border: 1px solid #333;
      padding: 12px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      color: #4ECDC4;
      white-space: pre-wrap;
    }
  </style>
</head>
<body contenteditable="true" id="editor"></body>
<script>
  var lastKey = '';
  document.getElementById('editor').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      var sel = window.getSelection();
      if (sel.rangeCount === 0) return;
      var node = sel.anchorNode;
      if (node.nodeType === 3) node = node.parentElement;
      var block = node.closest('blockquote') || node.closest('pre');
      if (block) {
        var text = block.textContent.trim();
        if (text === '') {
          if (lastKey === 'Enter') {
            e.preventDefault();
            var br = document.createElement('br');
            block.parentNode.insertBefore(br, block.nextSibling);
            var range = document.createRange();
            range.setStartAfter(br);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            if (block.textContent.trim() === '') block.remove();
            lastKey = '';
            return;
          }
        }
        lastKey = 'Enter';
      } else {
        lastKey = e.key;
      }
    } else {
      lastKey = e.key;
    }
  });
</script>
</html>
`;

export default function NewNoteScreen() {
  const router = useRouter();
  const webviewRef = useRef<WebView>(null);
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState("General");
  const [linkedNotes, setLinkedNotes] = useState<string[]>([]);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [categories, setCategories] = useState([
    "General",
    "Work",
    "Personal",
    "Ideas",
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [allNotes, setAllNotes] = useState<any[]>([]);

  useEffect(() => {
    const saved = store["notes"];
    if (saved) setAllNotes(JSON.parse(saved));
  }, []);

  const pickImage = async (fromCamera = false) => {
    let result;
    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
    }
    if (!result.canceled) {
      const uris = result.assets
        ? result.assets.map((a) => a.uri)
        : [result.uri];
      setImages((prev) => [...prev, ...uris]);
    }
    setShowImageMenu(false);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const saveNote = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a note title.");
      return;
    }
    webviewRef.current?.injectJavaScript(`
      (function() {
        var html = document.getElementById('editor').innerHTML;
        window.ReactNativeWebView.postMessage(html);
      })();
    `);
  };

  const onMessage = (event: any) => {
    const html = event.nativeEvent.data;
    const note = {
      id: Date.now().toString(),
      title: title.trim(),
      content: html,
      images,
      category,
      linkedNotes,
      createdAt: new Date().toISOString(),
    };
    const existing = store["notes"] ? JSON.parse(store["notes"]) : [];
    existing.push(note);
    store["notes"] = JSON.stringify(existing);
    router.back();
  };

  const execCommand = (command: string, value: string | null = null) => {
    webviewRef.current?.injectJavaScript(`
      document.execCommand('${command}', false, ${value ? `'${value}'` : "null"});
    `);
  };

  const applyInlineStyle = (command: string) => {
    webviewRef.current?.injectJavaScript(`
      (function() {
        var sel = window.getSelection();
        if (sel.rangeCount === 0) return;
        var range = sel.getRangeAt(0);
        if (range.collapsed) return;
        document.execCommand('${command}', false, null);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('${command}', false, null);
      })();
    `);
  };

  const toggleQuote = () => {
    webviewRef.current?.injectJavaScript(`
      (function() {
        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
          var range = sel.getRangeAt(0);
          var node = range.commonAncestorContainer;
          var blockquote = null;
          if (node.nodeType === 3) {
            blockquote = node.parentElement ? node.parentElement.closest('blockquote') : null;
          } else {
            blockquote = node.closest ? node.closest('blockquote') : null;
          }
          if (blockquote) {
            var fragment = document.createDocumentFragment();
            while (blockquote.firstChild) {
              fragment.appendChild(blockquote.firstChild);
            }
            blockquote.parentNode.replaceChild(fragment, blockquote);
          } else {
            document.execCommand('formatBlock', false, '<blockquote>');
          }
        }
      })();
    `);
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories((prev) => [...prev, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const toggleLinkNote = (noteId: string) => {
    if (linkedNotes.includes(noteId)) {
      setLinkedNotes((prev) => prev.filter((id) => id !== noteId));
    } else {
      setLinkedNotes((prev) => [...prev, noteId]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Note</Text>
        <TouchableOpacity onPress={saveNote}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Title Input */}
      <TextInput
        style={styles.titleInput}
        placeholder="Note Title"
        placeholderTextColor={shadcn.colors.mutedForeground}
        value={title}
        onChangeText={setTitle}
        autoFocus
      />

      {/* Toolbar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.toolbarScroll}
      >
        <View style={styles.toolbar}>
          {/* Heading Dropdown */}
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => {
                setShowHeadingDropdown(!showHeadingDropdown);
                setShowFontSizeDropdown(false);
              }}
            >
              <Text style={styles.toolButtonTextBold}>H</Text>
              <Ionicons
                name="caret-down"
                size={10}
                color={shadcn.colors.foreground}
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
            {showHeadingDropdown && (
              <View style={[styles.dropdown, { zIndex: 100, elevation: 10 }]}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    execCommand("formatBlock", "<h1>");
                    setShowHeadingDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      { fontSize: 22, fontWeight: "bold" },
                    ]}
                  >
                    Heading 1
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    execCommand("formatBlock", "<h2>");
                    setShowHeadingDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      { fontSize: 19, fontWeight: "bold" },
                    ]}
                  >
                    Heading 2
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    execCommand("formatBlock", "<h3>");
                    setShowHeadingDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      { fontSize: 17, fontWeight: "600" },
                    ]}
                  >
                    Heading 3
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    execCommand("formatBlock", "<h4>");
                    setShowHeadingDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      { fontSize: 15, fontWeight: "600" },
                    ]}
                  >
                    Heading 4
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Font Size Dropdown */}
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => {
                setShowFontSizeDropdown(!showFontSizeDropdown);
                setShowHeadingDropdown(false);
              }}
            >
              <Text style={{ color: shadcn.colors.foreground, fontSize: 14 }}>
                A
              </Text>
              <Ionicons
                name="caret-down"
                size={10}
                color={shadcn.colors.foreground}
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
            {showFontSizeDropdown && (
              <View style={[styles.dropdown, { zIndex: 100, elevation: 10 }]}>
                {[1, 2, 3, 4, 5, 6, 7].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={styles.dropdownItem}
                    onPress={() => {
                      execCommand("fontSize", size.toString());
                      setShowFontSizeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>Size {size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => applyInlineStyle("bold")}
          >
            <Text style={styles.toolButtonTextBold}>B</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => applyInlineStyle("italic")}
          >
            <Text style={styles.toolButtonTextItalic}>I</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => applyInlineStyle("underline")}
          >
            <Text style={styles.toolButtonTextUnderline}>U</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => applyInlineStyle("strikeThrough")}
          >
            <Text style={styles.toolButtonTextStrike}>S</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => execCommand("insertUnorderedList")}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={shadcn.colors.foreground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => execCommand("insertOrderedList")}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={shadcn.colors.foreground}
            />
            <Text
              style={{
                color: shadcn.colors.foreground,
                fontSize: 10,
                marginLeft: 2,
              }}
            >
              1.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={toggleQuote}>
            <Text style={{ color: shadcn.colors.foreground, fontSize: 18 }}>
              "
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => execCommand("formatBlock", "<pre>")}
          >
            <Text style={{ color: shadcn.colors.foreground, fontSize: 14 }}>
              {"<>"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => {
              Alert.prompt("Insert Link", "Enter URL:", (url) => {
                if (url) execCommand("createLink", url);
              });
            }}
          >
            <Ionicons
              name="link-outline"
              size={18}
              color={shadcn.colors.foreground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowImageMenu(true)}
          >
            <Ionicons
              name="image-outline"
              size={20}
              color={shadcn.colors.foreground}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Thumbnails */}
      {images.length > 0 && (
        <ScrollView horizontal style={styles.imageGallery}>
          {images.map((uri, index) => (
            <View key={index} style={styles.thumbnailContainer}>
              <Image source={{ uri }} style={styles.thumbnail} />
              <TouchableOpacity
                style={styles.removeThumbnail}
                onPress={() => removeImage(index)}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={shadcn.colors.foreground}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Editor */}
      <WebView
        ref={webviewRef}
        source={{ html: editorHtml }}
        style={styles.editor}
        onMessage={onMessage}
        scrollEnabled={true}
        javaScriptEnabled={true}
        originWhitelist={["*"]}
      />

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomChip}
          onPress={() => setShowCategoryModal(true)}
        >
          <Ionicons
            name="folder-outline"
            size={20}
            color={shadcn.colors.foreground}
          />
          <Text style={styles.bottomChipText}>Category: {category}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={shadcn.colors.mutedForeground}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomChip}
          onPress={() => setShowLinkModal(true)}
        >
          <Ionicons
            name="link-outline"
            size={20}
            color={shadcn.colors.foreground}
          />
          <Text style={styles.bottomChipText}>
            Linked: {linkedNotes.length > 0 ? linkedNotes.length : "None"}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={shadcn.colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {/* Image Source Modal */}
      <Modal visible={showImageMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageMenu(false)}
        >
          <View style={styles.imageMenu}>
            <TouchableOpacity
              style={styles.imageMenuItem}
              onPress={() => pickImage(false)}
            >
              <Ionicons
                name="images-outline"
                size={24}
                color={shadcn.colors.foreground}
              />
              <Text style={styles.imageMenuText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageMenuItem}
              onPress={() => pickImage(true)}
            >
              <Ionicons
                name="camera-outline"
                size={24}
                color={shadcn.colors.foreground}
              />
              <Text style={styles.imageMenuText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    category === item && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === item && styles.categoryTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {category === item && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={shadcn.colors.brand}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
            <View style={styles.addCategoryRow}>
              <TextInput
                style={styles.addCategoryInput}
                placeholder="New category..."
                placeholderTextColor={shadcn.colors.mutedForeground}
                value={newCategory}
                onChangeText={setNewCategory}
              />
              <TouchableOpacity
                style={styles.addCategoryButton}
                onPress={addCategory}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={shadcn.colors.foreground}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Link Notes Modal */}
      <Modal visible={showLinkModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link to Notes</Text>
            {allNotes.length === 0 ? (
              <Text style={styles.emptyText}>No other notes available</Text>
            ) : (
              <FlatList
                data={allNotes.filter((n) => n.id !== undefined)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.linkItem}
                    onPress={() => toggleLinkNote(item.id)}
                  >
                    <Text style={styles.linkTitle}>{item.title}</Text>
                    <Text style={styles.linkDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    {linkedNotes.includes(item.id) && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={shadcn.colors.brand}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowLinkModal(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  cancelText: { color: shadcn.colors.foreground, fontSize: 16 },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  saveText: { color: shadcn.colors.brand, fontSize: 16, fontWeight: "600" },
  titleInput: {
    color: shadcn.colors.foreground,
    fontSize: 22,
    fontWeight: "600",
    backgroundColor: shadcn.colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: shadcn.radius.md,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  toolbarScroll: { marginBottom: 10, maxHeight: 36, paddingHorizontal: 16 },
  toolbar: { flexDirection: "row", gap: 6, alignItems: "center", height: 36 },
  toolButton: {
    backgroundColor: shadcn.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 0,
    height: 36,
    borderRadius: shadcn.radius.sm,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  toolButtonTextBold: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontWeight: "bold",
  },
  toolButtonTextItalic: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontStyle: "italic",
  },
  toolButtonTextUnderline: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    textDecorationLine: "underline",
  },
  toolButtonTextStrike: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    textDecorationLine: "line-through",
  },
  dropdownWrapper: { position: "relative" },
  dropdown: {
    position: "absolute",
    top: 40,
    left: 0,
    backgroundColor: shadcn.colors.secondary,
    borderRadius: shadcn.radius.md,
    padding: 4,
    minWidth: 130,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 14 },
  dropdownText: { color: shadcn.colors.foreground, fontSize: 15 },
  imageGallery: {
    flexShrink: 0,
    maxHeight: 90,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  thumbnailContainer: { marginRight: 10, position: "relative" },
  thumbnail: { width: 80, height: 80, borderRadius: shadcn.radius.sm },
  removeThumbnail: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
  },
  editor: {
    flex: 1,
    backgroundColor: shadcn.colors.card,
    borderRadius: shadcn.radius.md,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: shadcn.colors.border,
  },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  bottomChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: shadcn.colors.card,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: shadcn.radius.md,
    gap: 10,
  },
  bottomChipText: { color: shadcn.colors.foreground, fontSize: 16, flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageMenu: {
    backgroundColor: shadcn.colors.card,
    borderRadius: shadcn.radius.lg,
    padding: 20,
    flexDirection: "row",
    gap: 30,
  },
  imageMenuItem: { alignItems: "center", gap: 8 },
  imageMenuText: { color: shadcn.colors.foreground, fontSize: 14 },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    backgroundColor: shadcn.colors.card,
    borderTopLeftRadius: shadcn.radius.xl,
    borderTopRightRadius: shadcn.radius.xl,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border,
  },
  categoryItemSelected: { backgroundColor: shadcn.colors.secondary },
  categoryText: { color: shadcn.colors.mutedForeground, fontSize: 16 },
  categoryTextSelected: { color: shadcn.colors.foreground, fontWeight: "600" },
  addCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  addCategoryInput: {
    flex: 1,
    color: shadcn.colors.foreground,
    fontSize: 16,
    backgroundColor: shadcn.colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: shadcn.radius.md,
  },
  addCategoryButton: {
    backgroundColor: shadcn.colors.secondary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalClose: { marginTop: 16, alignItems: "center", paddingVertical: 12 },
  modalCloseText: {
    color: shadcn.colors.brand,
    fontSize: 16,
    fontWeight: "600",
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border,
    gap: 10,
  },
  linkTitle: { color: shadcn.colors.foreground, fontSize: 16, flex: 1 },
  linkDate: { color: shadcn.colors.mutedForeground, fontSize: 12 },
  emptyText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 15,
    textAlign: "center",
    marginVertical: 20,
  },
});
