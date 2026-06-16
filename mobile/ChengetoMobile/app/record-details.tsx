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
import { router, useLocalSearchParams } from "expo-router";

import API from "@/services/api";

export default function RecordDetails() {
  const { record_id } = useLocalSearchParams();

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecord();
  }, []);

  const fetchRecord = async () => {
    try {
      setLoading(true);

      const response = await API.get(
        `/medical-records/${record_id}`
      );

      setRecord(response.data);
    } catch (error: any) {
      console.log(
        "MEDICAL RECORD ERROR:",
        error?.response?.data || error.message
      );
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading medical record...</Text>
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.center}>
        <Text>Failed to load medical record</Text>
      </View>
    );
  }

  const vitals = record.vital_signs?.[0]; // backend returns list

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Medical Record</Text>
      </View>

      {/* DIAGNOSIS CARD */}
      <View style={styles.mainCard}>
        <Text style={styles.diagnosis}>
          {record.diagnosis || "No diagnosis"}
        </Text>

        <Text style={styles.date}>📅 {record.visit_date}</Text>

        <Text style={styles.meta}>
          🧑‍⚕️ Provider ID: {record.provider_id || "N/A"}
        </Text>

        <Text style={styles.meta}>
          🏥 Facility ID: {record.facility_id || "N/A"}
        </Text>
      </View>

      {/* SYMPTOMS */}
      <Text style={styles.sectionTitle}>Symptoms</Text>
      <View style={styles.card}>
        <Text style={styles.textBlock}>
          {record.symptoms || "No symptoms recorded"}
        </Text>
      </View>

      {/* TREATMENT */}
      <Text style={styles.sectionTitle}>Treatment Plan</Text>
      <View style={styles.card}>
        <Text style={styles.textBlock}>
          {record.treatment_plan || "No treatment plan"}
        </Text>
      </View>

      {/* NOTES */}
      <Text style={styles.sectionTitle}>Doctor Notes</Text>
      <View style={styles.card}>
        <Text style={styles.textBlock}>
          {record.notes || "No notes available"}
        </Text>
      </View>

      {/* VITAL SIGNS */}
      <Text style={styles.sectionTitle}>Vital Signs</Text>

      <View style={styles.card}>
        {vitals ? (
          <>
            <View style={styles.vitalRow}>
              <Text style={styles.vitalLabel}>Temperature</Text>
              <Text style={styles.vitalValue}>
                {vitals.temperature ?? "N/A"} °C
              </Text>
            </View>

            <View style={styles.vitalRow}>
              <Text style={styles.vitalLabel}>Blood Pressure</Text>
              <Text style={styles.vitalValue}>
                {vitals.blood_pressure_systolic}/
                {vitals.blood_pressure_diastolic}
              </Text>
            </View>

            <View style={styles.vitalRow}>
              <Text style={styles.vitalLabel}>Heart Rate</Text>
              <Text style={styles.vitalValue}>
                {vitals.heart_rate ?? "N/A"} bpm
              </Text>
            </View>

            <View style={styles.vitalRow}>
              <Text style={styles.vitalLabel}>Respiratory Rate</Text>
              <Text style={styles.vitalValue}>
                {vitals.respiratory_rate ?? "N/A"} bpm
              </Text>
            </View>

            <View style={styles.vitalRow}>
              <Text style={styles.vitalLabel}>Weight</Text>
              <Text style={styles.vitalValue}>
                {vitals.weight ?? "N/A"} kg
              </Text>
            </View>
          </>
        ) : (
          <Text>No vitals recorded</Text>
        )}
      </View>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FB",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    backgroundColor: "#16A34A",
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  backButton: {
    width: 45,
    height: 45,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },

  mainCard: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 24,
    padding: 24,
  },

  diagnosis: {
    fontSize: 26,
    fontWeight: "700",
    color: "#16A34A",
    marginBottom: 12,
  },

  date: {
    color: "#334155",
    marginBottom: 10,
  },

  meta: {
    color: "#64748B",
    marginBottom: 6,
  },

  sectionTitle: {
    marginHorizontal: 20,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 18,
  },

  textBlock: {
    color: "#334155",
    lineHeight: 22,
  },

  vitalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  vitalLabel: {
    color: "#64748B",
  },

  vitalValue: {
    color: "#0F172A",
    fontWeight: "700",
  },
});