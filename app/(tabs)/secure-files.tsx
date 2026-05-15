// app/(tabs)/secure-files.tsx
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { shadcn } from "../../constants/components-theme";

const store: Record<string, any> = {};

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

  useEffect(() => {
    const savedLock = store["vault_lock_type"];
    if (savedLock) setLockType(savedLock);
    const savedPwd = store["vault_password"];
    if (savedPwd) setVaultPassword(savedPwd);
    const savedPat = store["vault_pattern"];
    if (savedPat) setSavedPattern(savedPat);
    const savedFiles = store["vault_files"];
    if (savedFiles) setFiles(JSON.parse(savedFiles));
  }, []);

  // --- Lock setup ---
  const setupLock = (type: string) => {
    setLockType(type);
    store["vault_lock_type"] = type;
  };

  const setupPin = () => {
    if (password.length < 4)
      return Alert.alert("PIN must be at least 4 digits");
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
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Set up fingerprint lock"
    });
    if (result.success) {
      store["vault_password"] = "fingerprint";
      setVaultPassword("fingerprint");
      Alert.alert("Fingerprint lock set");
    }
  };

  const savePattern = () => {
    if (pattern.length < 4)
      return Alert.alert("Pattern too short, connect at least 4 dots");
    const patternStr = pattern.join("");
    store["vault_pattern"] = patternStr;
    setSavedPattern(patternStr);
    setPattern([]);
    Alert.alert("Pattern lock set");
  };

  // --- Unlock ---
  const unlockWithPin = () => {
    if (attempt === vaultPassword) {
      setIsUnlocked(true);
      setAttempt("");
    } else {
      Alert.alert("Wrong PIN");
    }
  };

  const unlockWithFingerprint = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock vault"
    });
    if (result.success) {
      setIsUnlocked(true);
    }
  };

  const handlePatternDot = (index: number) => {
    if (pattern.includes(index)) return;
    setPattern([...pattern, index]);
  };

  const verifyPattern = () => {
    if (pattern.join("") === savedPattern) {
      setIsUnlocked(true);
      setPattern([]);
    } else {
      Alert.alert("Wrong pattern");
      setPattern([]);
    }
  };

  // --- File handling ---
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true
      });
      if (!result.canceled) {
        const newFiles = [
          ...files,
          ...result.assets.map((a) => ({ name: a.name, uri: a.uri }))
        ];
        setFiles(newFiles);
        store["vault_files"] = JSON.stringify(newFiles);
      }
    } catch (err) {
      Alert.alert("Error", "Could not pick file");
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    store["vault_files"] = JSON.stringify(updated);
  };

  // --- Lock type selection screen (first time) ---
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
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setupLock("pin")}
          >
            <Ionicons
              name="keypad"
              size={24}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.optionText}>PIN Code</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setupLock("fingerprint")}
          >
            <Ionicons
              name="finger-print"
              size={24}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.optionText}>Fingerprint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setupLock("pattern")}
          >
            <Ionicons
              name="grid-outline"
              size={24}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.optionText}>Pattern (Draw)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Lock detail setup screens ---
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
        <View style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="Enter 4+ digit PIN"
            placeholderTextColor={shadcn.colors.mutedForeground}
            keyboardType="number-pad"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={setupPin}>
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
          <Text style={styles.instruction}>
            Place your finger on the sensor
          </Text>
          <TouchableOpacity style={styles.saveBtn} onPress={setupFingerprint}>
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
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  pattern.includes(index) && styles.dotSelected
                ]}
                onPressIn={() => handlePatternDot(index)}
              />
            ))}
          </View>
          <View style={styles.buttonRow}>

            <TouchableOpacity style={styles.saveBtn} onPress={savePattern}>
              <Text style={styles.saveBtnText}>Save Pattern</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={() => setPattern([])}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // --- Unlock screen ---
  if (!isUnlocked) {
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
          <View style={styles.content}>
            <TextInput
              style={styles.input}
              placeholder="Enter PIN"
              placeholderTextColor={shadcn.colors.mutedForeground}
              keyboardType="number-pad"
              secureTextEntry
              value={attempt}
              onChangeText={setAttempt}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={unlockWithPin}>
              <Text style={styles.saveBtnText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        )}
        {lockType === "fingerprint" && (
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={unlockWithFingerprint}
            >
              <Text style={styles.saveBtnText}>Use Fingerprint</Text>
            </TouchableOpacity>
          </View>
        )}
        {lockType === "pattern" && (
          <View style={styles.patternContainer}>
            <Text style={styles.instruction}>Draw your pattern</Text>
            <View style={styles.grid}>
              {PATTERN_DOTS.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dot,
                    pattern.includes(index) && styles.dotSelected
                  ]}
                  onPressIn={() => handlePatternDot(index)}
                  onPressOut={() => {
                    if (pattern.length >= 4) verifyPattern();
                  }}
                />
              ))}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.resetButton} onPress={() => setPattern([])}>
                <Text style={styles.resetButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // --- Main vault (unlocked) ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setIsUnlocked(false);
            router.push("/settings");
          }}
          style={styles.headerLeft}
        >
          <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Files</Text>
        <TouchableOpacity onPress={pickFile} style={styles.headerRight}>
          <Ionicons name="add" size={26} color={shadcn.colors.foreground} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={files}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.fileRow}>
            <Ionicons
              name="document-outline"
              size={20}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.fileName}>{item.name}</Text>
            <TouchableOpacity onPress={() => removeFile(index)}>
              <Ionicons
                name="trash-outline"
                size={18}
                color={shadcn.colors.destructive}
              />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: shadcn.colors.background,
    paddingTop: 60
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: "relative",
  },
  headerLeft: {
    position: "absolute",
    left: 16,
    top: 0,
  },
  headerRight: {
    position: "absolute",
    right: 16,
    top: 0,
  },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  content: { paddingHorizontal: 16, marginTop: 40 },
  instruction: {
    color: shadcn.colors.mutedForeground,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center"
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: shadcn.colors.card,
    padding: 16,
    borderRadius: shadcn.radius.lg,
    marginBottom: 10,
    gap: 12
  },
  optionText: { color: shadcn.colors.foreground, fontSize: 16 },
  input: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    backgroundColor: shadcn.colors.card,
    padding: 14,
    borderRadius: shadcn.radius.md,
    marginBottom: 16
  },
  saveBtn: {
    backgroundColor: shadcn.colors.brand,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: shadcn.radius.md,
    alignItems: "center",
    minWidth: 120,
  },
  saveBtnText: {
    color: shadcn.colors.brandForeground,
    fontWeight: "700",
    fontSize: 16
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border,
    gap: 10
  },
  fileName: { color: shadcn.colors.foreground, flex: 1, fontSize: 15 },
  patternContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 250,
    justifyContent: "space-around"
  },
  dot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: shadcn.colors.card,
    margin: 10
  },
  dotSelected: { backgroundColor: shadcn.colors.brand },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: shadcn.radius.md,
    alignItems: 'center',
    minWidth: 80,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
