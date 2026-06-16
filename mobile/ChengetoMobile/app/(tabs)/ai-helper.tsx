import React, { useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import API from "@/services/api";

export default function AIHelperScreen() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const askAI = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);

      const res = await API.post("/ai/symptom-check", {
        symptoms: message,
      });

      setResponse(res.data);
    } catch (error: any) {
      console.log("AI ERROR:", error?.response?.data || error.message);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI Health Helper</Text>
          <Text style={styles.subtitle}>
            AI guidance only — not official diagnosis
          </Text>
        </View>

        <Ionicons name="sparkles" size={40} color="#2563EB" />
      </View>

      {/* RESPONSE */}
      <View style={styles.chatCard}>
        {loading ? (
          <ActivityIndicator color="#2563EB" />
        ) : response ? (
          <>
            <Text style={styles.aiText}>
              🧠 Possible conditions:
            </Text>

            {response.possible_conditions?.map((c: string, i: number) => (
              <Text key={i} style={styles.item}>
                • {c}
              </Text>
            ))}

            <Text style={styles.aiText}>
              ⚠️ Recommendation:
            </Text>
            <Text style={styles.item}>{response.recommendation}</Text>

            <Text style={styles.aiText}>
              🚨 Urgency:
            </Text>
            <Text style={styles.item}>{response.urgency_level}</Text>

            <Text style={styles.disclaimer}>
              {response.disclaimer}
            </Text>
          </>
        ) : (
          <Text style={styles.aiText}>
            👋 Hello, describe your symptoms and I’ll help guide you.
          </Text>
        )}
      </View>

      {/* INPUT */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Describe symptoms..."
          style={styles.input}
          multiline
          value={message}
          onChangeText={setMessage}
        />
      </View>

      {/* SEND */}
      <TouchableOpacity style={styles.sendButton} onPress={askAI}>
        <Ionicons name="send" size={20} color="#fff" />
        <Text style={styles.sendText}>Ask AI</Text>
      </TouchableOpacity>

      {/* HISTORY */}
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => router.push("/ai-history")}
      >
        <Ionicons name="time" size={22} color="#2563EB" />
        <Text style={styles.historyText}>
          View AI Helper History
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FB",
    padding: 20,
  },

  header: {
    marginTop: 50,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 5,
    color: "#64748B",
  },

  chatCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },

  aiText: {
    fontWeight: "700",
    marginTop: 10,
    color: "#0F172A",
  },

  item: {
    color: "#334155",
    marginLeft: 10,
    marginTop: 5,
  },

  disclaimer: {
    marginTop: 15,
    fontSize: 12,
    color: "#64748B",
  },

  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    minHeight: 140,
  },

  input: {
    textAlignVertical: "top",
  },

  sendButton: {
    backgroundColor: "#16A34A",
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },

  sendText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 10,
  },

  historyButton: {
    marginTop: 25,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  historyText: {
    marginLeft: 10,
    color: "#2563EB",
    fontWeight: "700",
  },
});