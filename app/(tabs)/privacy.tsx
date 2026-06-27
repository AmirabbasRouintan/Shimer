import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { shadcn } from "../../constants/components-theme";
import { Header } from "@/components/Header";
import CustomAlert from "../components/CustomAlert";

export default function PrivacyScreen() {
  const router = useRouter();
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);

  return (
    <View style={styles.container}>
      <Header title="Privacy" onBack={() => router.push("/settings")} />

      <ScrollView style={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: May 9, 2026</Text>

        <Text style={styles.sectionTitle}>Our Promise</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Your data belongs to you.</Text> Shimer stores all your information
          <Text style={styles.highlight}> locally on your device</Text>. We do not collect, store, or transmit
          any personal data to external servers.
        </Text>

        <Text style={styles.sectionTitle}>Data Storage</Text>
        <Text style={styles.paragraph}>
          All your tasks, checklists, notes, calendar events, files, and settings are stored
          <Text style={styles.highlight}> exclusively on your device</Text>.
          <Text style={styles.bold}> Nothing leaves your phone</Text> unless you explicitly export a backup.
        </Text>

        <Text style={styles.sectionTitle}>What We Don't Collect</Text>
        <View style={styles.bulletRow}>
          <Ionicons
            name="close-circle"
            size={18}
            color="#FF3B30"
          />
          <Text style={styles.bulletText}>
            <Text style={styles.bold}>Personal information</Text> (name, email, location)
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons
            name="close-circle"
            size={18}
            color="#FF3B30"
          />
          <Text style={styles.bulletText}>
            <Text style={styles.bold}>Usage analytics or tracking data</Text>
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons
            name="close-circle"
            size={18}
            color="#FF3B30"
          />
          <Text style={styles.bulletText}>
            <Text style={styles.bold}>Device identifiers or fingerprints</Text>
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons
            name="close-circle"
            size={18}
            color="#FF3B30"
          />
          <Text style={styles.bulletText}>
            <Text style={styles.bold}>Network activity or browsing history</Text>
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Permissions</Text>
        <Text style={styles.paragraph}>
          The app may request the following permissions
          <Text style={styles.highlight}> only when needed</Text>:
        </Text>
        <View style={styles.bulletRow}>
          <Ionicons
            name="camera-outline"
            size={18}
            color={shadcn.colors.brand}
          />
          <Text style={styles.bulletText}>
            Camera: <Text style={styles.italic}>For adding photos to notes</Text>
            <Text style={styles.muted}> (optional)</Text>
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons
            name="folder-outline"
            size={18}
            color={shadcn.colors.brand}
          />
          <Text style={styles.bulletText}>
            Storage: <Text style={styles.italic}>For saving and restoring backups</Text>
            <Text style={styles.muted}> (optional)</Text>
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons
            name="finger-print-outline"
            size={18}
            color={shadcn.colors.brand}
          />
          <Text style={styles.bulletText}>
            Biometrics: <Text style={styles.italic}>For secure file vault access</Text>
            <Text style={styles.muted}> (optional)</Text>
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.contactRow}>
          <Text style={styles.paragraph}>
            If you have any questions about privacy, contact us at:{' '}
          </Text>
          <View style={styles.emailContainer}>
            <Text style={[styles.bold, styles.highlight]}>amirabbas.rouintan2007@gmail.com</Text>
            <TouchableOpacity
              onPress={() => {
                import('expo-clipboard').then((mod) => {
                  mod.setStringAsync('amirabbas.rouintan2007@gmail.com');
                  setShowCopiedAlert(true);
                });
              }}
              style={styles.copyButton}
            >
              <Ionicons name="copy-outline" size={16} color={shadcn.colors.brand} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CustomAlert
        visible={showCopiedAlert}
        title="Copied!"
        message="Email address copied to clipboard"
        onConfirm={() => setShowCopiedAlert(false)}
        confirmText="OK"
        singleButton
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },

  content: { flex: 1, paddingHorizontal: 16 },
  lastUpdated: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    marginBottom: 16,
    fontStyle: "italic",
  },
  sectionTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8,
  },
  paragraph: {
    color: shadcn.colors.mutedForeground,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 10,
    paddingRight: 20,
  },
  bulletText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  bold: {
    fontWeight: "700",
    color: shadcn.colors.foreground,
  },
  highlight: {
    color: shadcn.colors.brand,
    fontWeight: "600",
  },
  italic: {
    fontStyle: "italic",
  },
  muted: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: shadcn.colors.border,
    marginVertical: 20,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyButton: {
    padding: 2,
  },
});
