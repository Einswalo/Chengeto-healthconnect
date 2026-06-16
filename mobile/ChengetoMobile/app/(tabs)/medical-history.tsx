import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import API from "@/services/api";

export default function MedicalHistory() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);

      // 🔥 IMPORTANT: your backend requires patient_id route
      const patientRes = await API.get("/patients/me");
      const patientId = patientRes.data.patient_id;

      const response = await API.get(
        `/medical-records/patient/${patientId}`
      );

      setRecords(response.data);

    } catch (error: any) {
      console.log(
        "MEDICAL HISTORY ERROR:",
        error?.response?.data || error.message
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>My Medical Records</Text>

      <FlatList
        data={records}
        keyExtractor={(item) => item.record_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
  pathname: "/record-details",
  params: { record_id: item.record_id },
})
            }
          >
            <Text style={styles.diagnosis}>
              {item.diagnosis || "No diagnosis"}
            </Text>

            <Text style={styles.meta}>
              📅 {item.visit_date}
            </Text>

            <Text style={styles.meta}>
              🏥 Provider: {item.provider_id || "N/A"}
            </Text>

            <View style={styles.row}>
              <Ionicons name="document-text" size={18} color="#16A34A" />
              <Text style={styles.viewText}>View Details</Text>
            </View>
          </TouchableOpacity>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8FB", padding: 20 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 15,
  },

  diagnosis: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
  },

  meta: {
    color: "#64748B",
    marginTop: 5,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  viewText: {
    marginLeft: 8,
    color: "#16A34A",
    fontWeight: "600",
  },
});