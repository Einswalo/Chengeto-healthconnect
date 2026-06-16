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

export default function PrescriptionDetails() {
  const { prescriptionId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<any>(null);

  useEffect(() => {
    if (prescriptionId) {
      loadPrescription();
    }
  }, [prescriptionId]);

  const loadPrescription = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/prescriptions/${prescriptionId}`);
      setPrescription(response.data);
    } catch (error: any) {
      console.log("PRESCRIPTION DETAILS ERROR:", error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    alert("✅ Token copied to clipboard!");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={{ marginTop: 10 }}>Loading prescription...</Text>
      </View>
    );
  }

  if (!prescription) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Prescription not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescription Details</Text>
      </View>

      {/* MAIN CARD */}
      <View style={styles.mainCard}>
        <Text style={styles.prescriptionId}>Prescription #{prescription.prescription_id}</Text>
        <Text style={styles.medicationName}>💊 {prescription.medication_name}</Text>
        
        <View style={styles.row}>
          <Ionicons name="calendar" size={18} color="#16A34A" />
          <Text style={styles.rowText}>{prescription.prescription_date}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: prescription.is_dispensed ? "#DCFCE7" : "#FEFCE8" }]}>
          <Text style={[styles.statusText, { color: prescription.is_dispensed ? "#16A34A" : "#CA8A04" }]}>
            {prescription.is_dispensed ? "✓ Dispensed" : "⏳ Pending"}
          </Text>
        </View>
      </View>

      {/* TOKEN SECTION - Prominent */}
      <View style={styles.tokenSection}>
        <Text style={styles.tokenSectionTitle}>🔐 Prescription Token</Text>
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenValue}>{prescription.blockchain_token}</Text>
          <TouchableOpacity 
            style={styles.copyTokenButton}
            onPress={() => copyToClipboard(prescription.blockchain_token)}
          >
            <Ionicons name="copy-outline" size={20} color="#fff" />
            <Text style={styles.copyTokenText}>Copy</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.tokenInstruction}>
          Show this token to the pharmacist at any verified pharmacy to collect your medication.
        </Text>
      </View>

      {/* MEDICATION DETAILS */}
      <Text style={styles.sectionTitle}>Medication Details</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Medication Name</Text>
        <Text style={styles.value}>{prescription.medication_name}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Dosage</Text>
        <Text style={styles.value}>{prescription.dosage}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Frequency</Text>
        <Text style={styles.value}>{prescription.frequency}</Text>
      </View>

      {prescription.duration && (
        <View style={styles.card}>
          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>{prescription.duration}</Text>
        </View>
      )}

      {prescription.instructions && (
        <>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.card}>
            <Text style={styles.notes}>{prescription.instructions}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F8FB",
  },
  header: {
    backgroundColor: "#16A34A",
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
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
  prescriptionId: {
    color: "#16A34A",
    fontWeight: "700",
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rowText: {
    marginLeft: 10,
    color: "#334155",
  },
  statusBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontWeight: "700",
  },
  tokenSection: {
    backgroundColor: "#EFF6FF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  tokenSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  tokenContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  tokenValue: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: 13,
    color: "#1D4ED8",
  },
  copyTokenButton: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  copyTokenText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  tokenInstruction: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
  sectionTitle: {
    marginHorizontal: 20,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 18,
    padding: 18,
  },
  label: {
    color: "#64748B",
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  notes: {
    color: "#334155",
    lineHeight: 22,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: "#16A34A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});