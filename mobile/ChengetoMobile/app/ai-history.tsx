import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import API from "@/services/api";

export default function AIHistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      // NOTE: you must pass patient_id from backend JWT or profile
      const profile = await API.get("/patients/me");

      const patientId = profile.data.patient_id;

      const res = await API.get(
        `/ai/predictions/patient/${patientId}`
      );

      setHistory(res.data);
    } catch (error: any) {
      console.log(
        "AI HISTORY ERROR:",
        error?.response?.data || error.message
      );
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI History</Text>

      {history.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.condition}>
            {item.predicted_condition || "No result"}
          </Text>

          <Text>Confidence: {item.confidence_score ?? "N/A"}%</Text>

          <Text style={styles.symptoms}>
            {item.symptoms}
          </Text>

          <Text style={styles.date}>
            {new Date(item.prediction_date).toDateString()}
          </Text>
        </View>
      ))}

      {history.length === 0 && (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No AI history found
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FB",
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 15,
  },

  condition: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 5,
  },

  symptoms: {
    marginTop: 8,
    color: "#334155",
  },

  date: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748B",
  },
});