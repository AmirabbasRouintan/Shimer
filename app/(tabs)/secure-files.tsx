// app/(tabs)/secure-files.tsx
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  Dimensions,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  PanResponder,
} from "react-native";
import { shadcn } from "../../constants/components-theme";
import { store } from "../miscStore";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PATTERN_DOTS = [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2]
];

// Custom PIN Keyboard Component with Apple-style animations
const CustomPinKeyboard = ({ onPress, onDelete, value, maxLength = 6, error, onComplete }: any) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef<{ [key: number]: Animated.Value }>({});

  useEffect(() => {
    for (let i = 0; i <= 9; i++) {
      scaleAnims.current[i] = new Animated.Value(1);
    }
    scaleAnims.current[10] = new Animated.Value(1);
  }, []);

  // Auto-submit when PIN reaches max length
  useEffect(() => {
    if (value.length === maxLength && onComplete) {
      onComplete();
    }
  }, [value, maxLength, onComplete]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const animateKeyPress = (index: number) => {
    const anim = scaleAnims.current[index];
    if (anim) {
      Animated.sequence([
        Animated.spring(anim, { toValue: 0.85, friction: 3, tension: 100, useNativeDriver: true }),
        Animated.spring(anim, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleNumberPress = (num: number) => {
    if (value.length < maxLength) {
      animateKeyPress(num);
      onPress(num.toString());
    }
  };

  const handleDeletePress = () => {
    if (value.length > 0) {
      animateKeyPress(10);
      onDelete();
    }
  };

  useEffect(() => {
    if (error) {
      shake();
    }
  }, [error]);

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < maxLength; i++) {
      dots.push(
        <Animated.View
          key={i}
          style={[
            styles.pinDot,
            i < value.length && styles.pinDotFilled,
            i === value.length && styles.pinDotActive,
          ]}
        >
          {i < value.length && (
            <Animated.View style={styles.pinDotFillAnim}>
              <View style={styles.pinDotInner} />
            </Animated.View>
          )}
        </Animated.View>
      );
    }
    return dots;
  };

  const keyboardRows = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  const getScaleAnim = (num: number) => scaleAnims.current[num] || new Animated.Value(1);

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <View style={styles.pinDotsContainer}>{renderDots()}</View>
      <View style={styles.keyboardContainer}>
        {keyboardRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyboardRow}>
            {row.map((num) => (
              <TouchableOpacity key={num} activeOpacity={0.7} onPress={() => handleNumberPress(num)}>
                <Animated.View style={[styles.keyboardKey, { transform: [{ scale: getScaleAnim(num) }] }]}>
                  <Text style={styles.keyboardKeyText}>{num}</Text>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.keyboardRow}>
          <TouchableOpacity style={[styles.keyboardKey, styles.keyboardKeyEmpty]} activeOpacity={1} />
          <TouchableOpacity activeOpacity={0.7} onPress={() => handleNumberPress(0)}>
            <Animated.View style={[styles.keyboardKey, { transform: [{ scale: getScaleAnim(0) }] }]}>
              <Text style={styles.keyboardKeyText}>0</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={handleDeletePress}>
            <Animated.View style={[styles.keyboardKey, { transform: [{ scale: getScaleAnim(10) }] }]}>
              <Ionicons name="backspace-outline" size={24} color="#fff" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// Full Screen Image Viewer with Swipe
const FullScreenImageViewer = ({ images, initialIndex, visible, onClose, onDeleteImage }: any) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 20,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 50 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        } else if (gesture.dx < -50 && currentIndex < images.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      },
    })
  ).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Image",
      "Are you sure you want to delete this image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onDeleteImage(currentIndex);
            if (images.length === 1) {
              onClose();
            } else if (currentIndex === images.length - 1) {
              setCurrentIndex(currentIndex - 1);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.fullscreenOverlay, { opacity: fadeAnim }]}>
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity onPress={onClose} style={styles.fullscreenClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fullscreenCounter}>
            {currentIndex + 1} / {images.length}
          </Text>
          <TouchableOpacity onPress={handleDelete} style={styles.fullscreenDelete}>
            <Ionicons name="trash-outline" size={24} color="#FF453A" />
          </TouchableOpacity>
        </View>

        <View style={styles.fullscreenContent} {...panResponder.panHandlers}>
          <Animated.Image
            source={{ uri: images[currentIndex]?.uri }}
            style={[styles.fullscreenImage, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.fullscreenDots}>
          {images.map((_: any, idx: number) => (
            <View key={idx} style={[styles.fullscreenDot, currentIndex === idx && styles.fullscreenDotActive]} />
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
};

// Animated file row component with selection support
const AnimatedFileRow = ({ item, index, isSelected, onSelect, onDelete, onPress, inSelectionMode }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 50, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, delay: index * 50, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const handleLongPress = () => {
    if (onSelect) {
      onSelect();
    }
  };

  const handlePress = () => {
    if (inSelectionMode && onSelect) {
      onSelect();
    } else if (onPress && isImageFile(item.name)) {
      onPress();
    } else if (!isImageFile(item.name)) {
      Alert.alert("File Preview", "This file type cannot be previewed. Only images can be viewed.");
    }
  };

  return (
    <Animated.View
      style={[
        styles.fileRow,
        isSelected && styles.fileRowSelected,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={styles.fileContent}
        activeOpacity={0.7}
      >
        {isImageFile(item.name) ? (
          <Image source={{ uri: item.uri }} style={styles.filePreview} />
        ) : (
          <View style={styles.fileIconPlaceholder}>
            <Ionicons name="document-outline" size={24} color={shadcn.colors.foreground} />
          </View>
        )}
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.fileType}>{isImageFile(item.name) ? 'Image' : 'Document'}</Text>
        </View>
      </TouchableOpacity>

      {inSelectionMode && (
        <View style={styles.selectionIndicator}>
          <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={24} color={isSelected ? "#4ECDC4" : "#888"} />
        </View>
      )}

      {!inSelectionMode && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color={shadcn.colors.destructive} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default function SecureFilesScreen() {
  const router = useRouter();
  const [lockType, setLockType] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [attempt, setAttempt] = useState("");
  const [vaultPassword, setVaultPassword] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [pattern, setPattern] = useState<number[]>([]);
  const [savedPattern, setSavedPattern] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

  // Selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Lockout states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedLock = store["vault_lock_type"];
    if (savedLock) setLockType(savedLock);
    const savedPwd = store["vault_password"];
    if (savedPwd) setVaultPassword(savedPwd);
    const savedPat = store["vault_pattern"];
    if (savedPat) setSavedPattern(savedPat);
    const savedFiles = store["vault_files"];
    if (savedFiles) setFiles(JSON.parse(savedFiles));
    const savedFailedAttempts = store["vault_failed_attempts"];
    if (savedFailedAttempts) setFailedAttempts(savedFailedAttempts);
  }, []);

  const startLockout = () => {
    setIsLocked(true);
    setLockoutTimer(30);
    timerRef.current = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsLocked(false);
          setFailedAttempts(0);
          store["vault_failed_attempts"] = 0;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const recordFailedAttempt = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    store["vault_failed_attempts"] = newAttempts;
    setPinError(true);
    setTimeout(() => setPinError(false), 800);
    if (newAttempts >= 5) startLockout();
  };

  const resetFailedAttempts = () => {
    setFailedAttempts(0);
    store["vault_failed_attempts"] = 0;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const setupLock = (type: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLockType(type);
    store["vault_lock_type"] = type;
  };

  const setupPin = () => {
    if (password.length < 4) {
      setPinError(true);
      setTimeout(() => setPinError(false), 800);
      return Alert.alert("PIN must be at least 4 digits");
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    store["vault_password"] = password;
    setVaultPassword(password);
    setPassword("");
    Alert.alert("PIN lock set");
  };

  const setupFingerprint = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return Alert.alert("Device does not support fingerprint");
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return Alert.alert("No fingerprints enrolled");
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Set up fingerprint lock" });
    if (result.success) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      store["vault_password"] = "fingerprint";
      setVaultPassword("fingerprint");
      Alert.alert("Fingerprint lock set");
    }
  };

  const savePattern = () => {
    if (pattern.length < 4) return Alert.alert("Pattern too short, connect at least 4 dots");
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    store["vault_pattern"] = pattern.join("");
    setSavedPattern(pattern.join(""));
    setPattern([]);
    Alert.alert("Pattern lock set");
  };

  const unlockWithPin = () => {
    if (isLocked || !vaultPassword) return;

    if (attempt === vaultPassword) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsUnlocked(true);
      setAttempt("");
      resetFailedAttempts();
      setPinError(false);
    } else if (attempt.length === 6) {
      // Only record failed attempt when PIN is complete
      recordFailedAttempt();
      setAttempt("");
    }
  };

  // Auto-unlock when PIN reaches full length
  const handlePinComplete = () => {
    if (isLocked) return;
    unlockWithPin();
  };

  const unlockWithFingerprint = async () => {
    if (isLocked) return;
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock vault" });
    if (result.success) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsUnlocked(true);
      resetFailedAttempts();
    } else {
      recordFailedAttempt();
    }
  };

  const handlePatternDot = (index: number) => {
    if (isLocked || pattern.includes(index)) return;
    setPattern([...pattern, index]);
  };

  const verifyPattern = () => {
    if (isLocked) return;
    if (pattern.join("") === savedPattern) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsUnlocked(true);
      setPattern([]);
      resetFailedAttempts();
    } else {
      recordFailedAttempt();
      setPattern([]);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: true });
      if (!result.canceled) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newFiles = [...files, ...result.assets.map((a) => ({ name: a.name, uri: a.uri, mimeType: a.mimeType }))];
        setFiles(newFiles);
        store["vault_files"] = JSON.stringify(newFiles);
      }
    } catch (err) {
      Alert.alert("Error", "Could not pick file");
    }
  };

  const deleteFiles = (indices: number[]) => {
    Alert.alert(
      "Delete Files",
      `Are you sure you want to delete ${indices.length} file(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const updated = files.filter((_, i) => !indices.includes(i));
            setFiles(updated);
            store["vault_files"] = JSON.stringify(updated);
            exitSelectionMode();
          },
        },
      ]
    );
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
    if (newSelected.size === 0) {
      exitSelectionMode();
    }
  };

  const enterSelectionMode = (index: number) => {
    setSelectionMode(true);
    setSelectedItems(new Set([index]));
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const deleteSelected = () => {
    if (selectedItems.size > 0) {
      deleteFiles(Array.from(selectedItems));
    }
  };

  const handleFilePress = (index: number, isImage: boolean) => {
    if (selectionMode) {
      toggleSelection(index);
    } else if (isImage) {
      setPreviewImageIndex(index);
    }
  };

  const handleFileLongPress = (index: number) => {
    enterSelectionMode(index);
  };

  const imageFiles = files.filter((_, idx) => {
    const ext = files[idx]?.name?.toLowerCase() || '';
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'].some(e => ext.endsWith(e));
  }).map((file, originalIndex) => {
    const originalIdx = files.findIndex(f => f.uri === file.uri);
    return { ...file, originalIndex: originalIdx };
  });

  if (!lockType) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/settings")} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vault Lock Setup</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.content}>
          <Text style={styles.instruction}>Choose how to lock your files</Text>
          <TouchableOpacity style={styles.optionRow} onPress={() => setupLock("pin")} activeOpacity={0.7}>
            <Ionicons name="keypad" size={24} color={shadcn.colors.foreground} />
            <Text style={styles.optionText}>PIN Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => setupLock("fingerprint")} activeOpacity={0.7}>
            <Ionicons name="finger-print" size={24} color={shadcn.colors.foreground} />
            <Text style={styles.optionText}>Fingerprint</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => setupLock("pattern")} activeOpacity={0.7}>
            <Ionicons name="grid-outline" size={24} color={shadcn.colors.foreground} />
            <Text style={styles.optionText}>Pattern (Draw)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (lockType === "pin" && !vaultPassword) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setLockType(null)} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set PIN</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.pinSetupContainer}>
          <Text style={styles.instruction}>Create a PIN code</Text>
          <CustomPinKeyboard value={password} onPress={(d: string) => setPassword(password + d)} onDelete={() => setPassword(password.slice(0, -1))} maxLength={6} error={pinError} />
          <TouchableOpacity style={styles.saveBtn} onPress={setupPin} activeOpacity={0.7}>
            <Text style={styles.saveBtnText}>Save PIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (lockType === "fingerprint" && !vaultPassword) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setLockType(null)} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Fingerprint</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.content}>
          <Text style={styles.instruction}>Place your finger on the sensor</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={setupFingerprint} activeOpacity={0.7}>
            <Text style={styles.saveBtnText}>Enable</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (lockType === "pattern" && !savedPattern) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setLockType(null)} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Draw Pattern</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.patternContainer}>
          <Text style={styles.instruction}>Connect at least 4 dots</Text>
          <View style={styles.grid}>
            {PATTERN_DOTS.map((_, index) => (
              <TouchableOpacity key={index} style={[styles.dot, pattern.includes(index) && styles.dotSelected]} onPressIn={() => handlePatternDot(index)} activeOpacity={0.7} />
            ))}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={savePattern} activeOpacity={0.7}>
              <Text style={styles.saveBtnText}>Save Pattern</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={() => setPattern([])} activeOpacity={0.7}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!isUnlocked) {
    const lockoutRemaining = isLocked ? lockoutTimer : 0;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/settings")} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Unlock Vault</Text>
          <View style={styles.headerRight} />
        </View>
        {lockType === "pin" && (
          <View style={styles.pinUnlockContainer}>
            <Ionicons name="lock-closed" size={48} color={shadcn.colors.brand} />
            <Text style={styles.unlockTitle}>Enter PIN</Text>
            {isLocked ? (
              <View style={styles.lockoutContainer}>
                <Ionicons name="time-outline" size={32} color="#FF453A" />
                <Text style={styles.lockoutText}>Too many attempts</Text>
                <Text style={styles.lockoutTimer}>Try again in {lockoutRemaining}s</Text>
              </View>
            ) : (
              <CustomPinKeyboard
                value={attempt}
                onPress={(d: string) => setAttempt(attempt + d)}
                onDelete={() => setAttempt(attempt.slice(0, -1))}
                maxLength={6}
                error={pinError}
                onComplete={handlePinComplete}
              />
            )}
          </View>
        )}
        {lockType === "fingerprint" && (
          <View style={styles.content}>
            {isLocked ? (
              <View style={styles.lockoutContainer}>
                <Ionicons name="time-outline" size={32} color="#FF453A" />
                <Text style={styles.lockoutText}>Too many attempts</Text>
                <Text style={styles.lockoutTimer}>Try again in {lockoutRemaining}s</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.fingerprintButton} onPress={unlockWithFingerprint} activeOpacity={0.7}>
                <Ionicons name="finger-print" size={64} color={shadcn.colors.brand} />
                <Text style={styles.fingerprintText}>Use Fingerprint</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {lockType === "pattern" && (
          <View style={styles.patternContainer}>
            {isLocked ? (
              <View style={styles.lockoutContainer}>
                <Ionicons name="time-outline" size={32} color="#FF453A" />
                <Text style={styles.lockoutText}>Too many attempts</Text>
                <Text style={styles.lockoutTimer}>Try again in {lockoutRemaining}s</Text>
              </View>
            ) : (
              <>
                <Text style={styles.instruction}>Draw your pattern</Text>
                <View style={styles.grid}>
                  {PATTERN_DOTS.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.dot, pattern.includes(index) && styles.dotSelected]}
                      onPressIn={() => handlePatternDot(index)}
                      onPressOut={() => {
                        if (pattern.length >= 4) verifyPattern();
                      }}
                      activeOpacity={0.7}
                    />
                  ))}
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.resetButton} onPress={() => setPattern([])} activeOpacity={0.7}>
                    <Text style={styles.resetButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </View>
    );
  }

  const imageUris = imageFiles.map(f => f.uri);
  const currentImageIndex = previewImageIndex !== null ? imageFiles.findIndex(f => f.originalIndex === previewImageIndex) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setIsUnlocked(false); router.push("/settings"); }} style={styles.headerLeft} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Files</Text>
        <View style={styles.headerRight}>
          {selectionMode ? (
            <View style={styles.selectionActions}>
              <TouchableOpacity onPress={deleteSelected} style={styles.headerAction}>
                <Ionicons name="trash-outline" size={22} color="#FF453A" />
              </TouchableOpacity>
              <TouchableOpacity onPress={exitSelectionMode} style={styles.headerAction}>
                <Ionicons name="close" size={24} color={shadcn.colors.foreground} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={pickFile} style={styles.headerAction} activeOpacity={0.7}>
              <Ionicons name="add" size={26} color={shadcn.colors.foreground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {selectionMode && selectedItems.size > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionCount}>{selectedItems.size} selected</Text>
          <TouchableOpacity onPress={deleteSelected} style={styles.selectionDelete}>
            <Ionicons name="trash-outline" size={20} color="#FF453A" />
            <Text style={styles.selectionDeleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={files}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => {
          const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'].some(ext => item.name?.toLowerCase().endsWith(ext));
          return (
            <AnimatedFileRow
              item={item}
              index={index}
              isSelected={selectedItems.has(index)}
              onSelect={() => toggleSelection(index)}
              onDelete={() => deleteFiles([index])}
              onPress={() => handleFilePress(index, isImage)}
              inSelectionMode={selectionMode}
            />
          );
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No files yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add files</Text>
          </View>
        }
      />

      <FullScreenImageViewer
        images={imageFiles}
        initialIndex={Math.max(0, currentImageIndex)}
        visible={previewImageIndex !== null}
        onClose={() => setPreviewImageIndex(null)}
        onDeleteImage={(idx: number) => {
          const originalIdx = imageFiles[idx]?.originalIndex;
          if (originalIdx !== undefined) deleteFiles([originalIdx]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background, paddingTop: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingBottom: 16, position: "relative" },
  headerLeft: { position: "absolute", left: 16, top: 0 },
  headerRight: { position: "absolute", right: 16, top: 0, flexDirection: "row", gap: 12 },
  headerTitle: { color: shadcn.colors.foreground, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerAction: { padding: 4 },
  selectionActions: { flexDirection: "row", gap: 16 },
  selectionBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: shadcn.colors.card, borderBottomWidth: 0.5, borderBottomColor: shadcn.colors.border },
  selectionCount: { color: shadcn.colors.foreground, fontSize: 14, fontWeight: "500" },
  selectionDelete: { flexDirection: "row", alignItems: "center", gap: 6 },
  selectionDeleteText: { color: "#FF453A", fontSize: 14, fontWeight: "500" },
  content: { paddingHorizontal: 16, marginTop: 40 },
  instruction: { color: shadcn.colors.mutedForeground, fontSize: 16, marginBottom: 20, textAlign: "center" },
  optionRow: { flexDirection: "row", alignItems: "center", backgroundColor: shadcn.colors.card, padding: 16, borderRadius: 16, marginBottom: 10, gap: 12 },
  optionText: { color: shadcn.colors.foreground, fontSize: 16 },
  pinSetupContainer: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  pinUnlockContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  unlockTitle: { color: shadcn.colors.foreground, fontSize: 20, fontWeight: "600", marginTop: 16, marginBottom: 32 },
  pinDotsContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 40, gap: 16 },
  pinDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: shadcn.colors.card, borderWidth: 1, borderColor: shadcn.colors.border, alignItems: "center", justifyContent: "center" },
  pinDotFilled: { backgroundColor: shadcn.colors.brand, borderColor: shadcn.colors.brand },
  pinDotActive: { transform: [{ scale: 1.2 }] },
  pinDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  pinDotFillAnim: { alignItems: "center", justifyContent: "center" },
  keyboardContainer: { width: "100%", alignItems: "center" },
  keyboardRow: { flexDirection: "row", justifyContent: "center", marginBottom: 12, gap: 12 },
  keyboardKey: { width: 80, height: 80, borderRadius: 40, backgroundColor: shadcn.colors.card, alignItems: "center", justifyContent: "center", borderWidth: 0.5, borderColor: shadcn.colors.border },
  keyboardKeyEmpty: { backgroundColor: "transparent", borderWidth: 0 },
  keyboardKeyText: { color: shadcn.colors.foreground, fontSize: 28, fontWeight: "500" },
  saveBtn: { backgroundColor: shadcn.colors.brand, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: "center", marginTop: 30 },
  saveBtnText: { color: shadcn.colors.brandForeground, fontWeight: "700", fontSize: 16 },
  unlockButton: { backgroundColor: shadcn.colors.brand, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, alignItems: "center", marginTop: 20 },
  unlockButtonText: { color: shadcn.colors.brandForeground, fontWeight: "700", fontSize: 16 },
  lockoutContainer: { alignItems: "center", padding: 24, backgroundColor: shadcn.colors.card, borderRadius: 16, marginTop: 20 },
  lockoutText: { color: "#FF453A", fontSize: 18, fontWeight: "600", marginTop: 12 },
  lockoutTimer: { color: shadcn.colors.mutedForeground, fontSize: 24, fontWeight: "700", marginTop: 8 },
  fingerprintButton: { alignItems: "center", padding: 30 },
  fingerprintText: { color: shadcn.colors.foreground, fontSize: 16, marginTop: 16 },
  fileRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: shadcn.colors.border, gap: 12 },
  fileRowSelected: { backgroundColor: 'rgba(78,205,196,0.1)' },
  fileContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  filePreview: { width: 50, height: 50, borderRadius: 8, backgroundColor: shadcn.colors.card },
  fileIconPlaceholder: { width: 50, height: 50, borderRadius: 8, backgroundColor: shadcn.colors.card, alignItems: "center", justifyContent: "center" },
  fileInfo: { flex: 1 },
  fileName: { color: shadcn.colors.foreground, fontSize: 15, fontWeight: "500" },
  fileType: { color: shadcn.colors.mutedForeground, fontSize: 12, marginTop: 2 },
  deleteButton: { padding: 8 },
  selectionIndicator: { padding: 8 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: { color: shadcn.colors.foreground, fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptySubtext: { color: shadcn.colors.mutedForeground, fontSize: 14, marginTop: 8 },
  patternContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", width: 250, justifyContent: "space-around" },
  dot: { width: 60, height: 60, borderRadius: 30, backgroundColor: shadcn.colors.card, margin: 10, borderWidth: 0.5, borderColor: shadcn.colors.border },
  dotSelected: { backgroundColor: shadcn.colors.brand },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 20 },
  resetButton: { backgroundColor: '#FF3B30', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', minWidth: 80 },
  resetButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  fullscreenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  fullscreenClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  fullscreenCounter: { color: '#fff', fontSize: 16, fontWeight: '500' },
  fullscreenDelete: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  fullscreenContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullscreenImage: { width: screenWidth, height: screenHeight * 0.8 },
  fullscreenDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, gap: 8 },
  fullscreenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#555' },
  fullscreenDotActive: { width: 20, backgroundColor: '#fff' },
});
