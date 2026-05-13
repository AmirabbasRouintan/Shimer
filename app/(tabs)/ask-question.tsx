import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { shadcn } from "../../constants/components-theme";

export default function AskQuestionScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert("Required", "Please fill in name, email, subject, and message.");
      return;
    }
    // Add email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    Alert.alert(
      "Sent!",
      "Your question has been submitted. We'll get back to you soon."
    );
    router.push("/settings");
  };

  const handleClear = () => {
    Alert.alert(
      "Clear Form",
      "Are you sure you want to clear all fields?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setName("");
            setEmail("");
            setSubject("");
            setMessage("");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={22} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask a Question</Text>
        <TouchableOpacity onPress={handleClear} style={styles.headerRight}>
          <View style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={shadcn.colors.mutedForeground}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor={shadcn.colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          placeholder="What's this about?"
          placeholderTextColor={shadcn.colors.mutedForeground}
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder="Describe your question..."
          placeholderTextColor={shadcn.colors.mutedForeground}
          value={message}
          onChangeText={setMessage}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons
            name="send"
            size={20}
            color={shadcn.colors.brandForeground}
          />
          <Text style={styles.submitText}>Send Question</Text>
        </TouchableOpacity>

        <Text style={styles.alternative}>
          My email:{"\n"}amirabbas.rouintan2007@gmail.com
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: "relative",
  },
  headerLeft: {
    width: 60,
    alignItems: "flex-start",
  },
  headerRight: {
    width: 60,
    alignItems: "flex-end",
  },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  content: { flex: 1, paddingHorizontal: 16 },
  label: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 6
  },
  input: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    backgroundColor: shadcn.colors.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: shadcn.radius.md
  },
  messageInput: { minHeight: 150, paddingTop: 12 },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: shadcn.colors.brand,
    paddingVertical: 14,
    borderRadius: shadcn.radius.lg,
    marginTop: 20,
    gap: 8
  },
  submitText: {
    color: shadcn.colors.brandForeground,
    fontSize: 16,
    fontWeight: "700"
  },
  alternative: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 20
  },
  clearButton: {
    backgroundColor: "#FF3B30", // or "#FF3B30" for red
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
