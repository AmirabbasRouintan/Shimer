import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Header } from "@/components/Header";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { shadcn } from "../../constants/components-theme";

const licenses = [
  {
    name: "React Native",
    license: "MIT",
    url: "https://github.com/facebook/react-native"
  },
  { name: "Expo", license: "MIT", url: "https://github.com/expo/expo" },
  { name: "Expo Router", license: "MIT", url: "https://github.com/expo/expo" },
  {
    name: "Ionicons",
    license: "MIT",
    url: "https://github.com/ionic-team/ionicons"
  },
  {
    name: "React Native SVG",
    license: "MIT",
    url: "https://github.com/software-mansion/react-native-svg"
  },
  {
    name: "React Native WebView",
    license: "MIT",
    url: "https://github.com/react-native-webview/react-native-webview"
  },
  { name: "Expo Battery", license: "MIT", url: "https://github.com/expo/expo" },
  {
    name: "Expo Clipboard",
    license: "MIT",
    url: "https://github.com/expo/expo"
  },
  {
    name: "Expo Document Picker",
    license: "MIT",
    url: "https://github.com/expo/expo"
  },
  {
    name: "Expo File System",
    license: "MIT",
    url: "https://github.com/expo/expo"
  },
  {
    name: "Expo Image Picker",
    license: "MIT",
    url: "https://github.com/expo/expo"
  },
  {
    name: "Expo Local Authentication",
    license: "MIT",
    url: "https://github.com/expo/expo"
  },
  { name: "Expo Sharing", license: "MIT", url: "https://github.com/expo/expo" },
  {
    name: "React Native Gesture Handler",
    license: "MIT",
    url: "https://github.com/software-mansion/react-native-gesture-handler"
  },
  {
    name: "React Native Reanimated",
    license: "MIT",
    url: "https://github.com/software-mansion/react-native-reanimated"
  },
  {
    name: "React Native Safe Area Context",
    license: "MIT",
    url: "https://github.com/th3rdwave/react-native-safe-area-context"
  },
  {
    name: "React Native Screens",
    license: "MIT",
    url: "https://github.com/software-mansion/react-native-screens"
  },
  {
    name: "Zustand",
    license: "MIT",
    url: "https://github.com/pmndrs/zustand"
  }
];

export default function OpenSourceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header title="Open Source" onBack={() => router.push("/settings")} />

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Our Code</Text>
        <Text style={styles.paragraph}>
          Shimer is open source and available on GitHub. We believe in
          transparency and community-driven development.
        </Text>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL("https://github.com/AmirabbasRouintan/Shimer")}
        >
          <Ionicons
            name="logo-github"
            size={24}
            color={shadcn.colors.foreground}
          />
          <Text style={styles.linkText}>View on GitHub</Text>
          <Ionicons
            name="open-outline"
            size={16}
            color={shadcn.colors.mutedForeground}
          />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>License</Text>
        <Text style={styles.paragraph}>
          Shimer is licensed under the{' '}
          <Text style={styles.highlight}>MIT License</Text>. You are free to use, modify,
          and distribute the code.
        </Text>

        <Text style={styles.sectionTitle}>Third-Party Libraries</Text>
        <Text style={styles.paragraph}>
          We use the following open source libraries. Thank you to all
          contributors!
        </Text>

        {licenses.map((lib, index) => (
          <TouchableOpacity
            key={index}
            style={styles.libRow}
            onPress={() => Linking.openURL(lib.url)}
            activeOpacity={0.7}
          >
            <View style={styles.libInfo}>
              <Text style={styles.libName}>{lib.name}</Text>
              <View style={styles.licenseBadge}>
                <Text style={styles.libLicense}>{lib.license} License</Text>
              </View>
            </View>
            <Ionicons
              name="open-outline"
              size={14}
              color={shadcn.colors.mutedForeground}
            />
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            And with ❤️ Lib :)
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  content: { flex: 1, paddingHorizontal: 16 },
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
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: shadcn.colors.card,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: shadcn.radius.lg,
    marginBottom: 16,
    gap: 12,
  },
  linkText: { color: shadcn.colors.foreground, fontSize: 16, flex: 1 },
  libRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border,
  },
  libInfo: {
    flex: 1,
  },
  libName: { color: shadcn.colors.foreground, fontSize: 15 },
  licenseBadge: {
    marginTop: 2,
  },
  libLicense: {
    color: shadcn.colors.mutedForeground,
    fontSize: 12,
  },
  highlight: {
    color: shadcn.colors.brand,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 30,
    paddingVertical: 20,
  },
  footerText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    textAlign: "center",
  },
});
