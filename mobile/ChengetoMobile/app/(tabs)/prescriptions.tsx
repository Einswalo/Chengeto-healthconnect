import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import API from "@/services/api";

export default function PrescriptionsScreen() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);

      const patientResponse = await API.get("/patients/me");
      const patientId = patientResponse.data.patient_id;

      const response = await API.get(`/prescriptions/patient/${patientId}`);
      setPrescriptions(response.data);

    } catch (error: any) {
      console.log("PRESCRIPTION ERROR:", error?.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPrescriptions();
  };

  const copyToClipboard = (text: string) => {
    // You'll need to implement clipboard functionality
    alert("Token copied to clipboard!");
  };

  const pendingPrescriptions = prescriptions.filter(rx => !rx.is_dispensed);
  const dispensedPrescriptions = prescriptions.filter(rx => rx.is_dispensed);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={{ marginTop: 10 }}>Loading prescriptions...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16A34A"]} />
      }
    >
      <Text style={styles.title}>💊 My Prescriptions</Text>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#CA8A04" />
        <Text style={styles.infoText}>
          Keep your prescription tokens safe. Show them at any verified pharmacy to collect your medication.
        </Text>
      </View>

      {/* Pending Prescriptions */}
      {pendingPrescriptions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>⏳ Pending Prescriptions</Text>
          {pendingPrescriptions.map((prescription: any) => (
            <TouchableOpacity
              key={prescription.prescription_id}
              style={[styles.card, styles.pendingCard]}
              onPress={() =>
                router.push({
                  pathname: "/prescription-details",
                  params: { prescriptionId: prescription.prescription_id },
                })
              }
            >
              <Text style={styles.medication}>💊 {prescription.medication_name}</Text>
              <Text style={styles.info}>Dosage: {prescription.dosage}</Text>
              <Text style={styles.info}>Frequency: {prescription.frequency}</Text>
              <Text style={styles.info}>Date: {prescription.prescription_date}</Text>
              
              {/* Token Display - Prominent */}
              <View style={styles.tokenBox}>
                <Text style={styles.tokenLabel}>🔐 Prescription Token</Text>
                <View style={styles.tokenRow}>
                  <Text style={styles.tokenValue} numberOfLines={1}>
                    {prescription.blockchain_token}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(prescription.blockchain_token)}
                  >
                    <Ionicons name="copy-outline" size={18} color="#16A34A" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.tokenNote}>
                  Show this token to the pharmacist to collect your medication
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusPending}>Pending</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Dispensed Prescriptions */}
      {dispensedPrescriptions.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, styles.dispensedTitle]}>✅ Dispensed Prescriptions</Text>
          {dispensedPrescriptions.map((prescription: any) => (
            <TouchableOpacity
              key={prescription.prescription_id}
              style={[styles.card, styles.dispensedCard]}
              onPress={() =>
                router.push({
                  pathname: "/prescription-details",
                  params: { prescriptionId: prescription.prescription_id },
                })
              }
            >
              <Text style={styles.medication}>💊 {prescription.medication_name}</Text>
              <Text style={styles.info}>Dosage: {prescription.dosage}</Text>
              <Text style={styles.info}>Frequency: {prescription.frequency}</Text>
              <Text style={styles.info}>Date: {prescription.prescription_date}</Text>
              
              <View style={styles.statusBadge}>
                <Text style={styles.statusDispensed}>✓ Dispensed</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {prescriptions.length === 0 && (
        <View style={styles.emptyCard}>
          <Ionicons name="medical-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No prescriptions found</Text>
        </View>
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
    backgroundColor: "#F4F8FB",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 16,
    color: "#0F172A",
  },
  infoCard: {
    backgroundColor: "#FEFCE8",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#CA8A04",
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#CA8A04",
    marginBottom: 12,
    marginTop: 8,
  },
  dispensedTitle: {
    color: "#16A34A",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#CA8A04",
  },
  dispensedCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#16A34A",
    opacity: 0.85,
  },
  medication: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#0F172A",
  },
  info: {
    marginBottom: 6,
    color: "#475569",
    fontSize: 14,
  },
  tokenBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tokenValue: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: 12,
    color: "#1D4ED8",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8,
  },
  copyButton: {
    padding: 8,
    marginLeft: 8,
  },
  tokenNote: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 8,
  },
  statusBadge: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPending: {
    fontSize: 11,
    fontWeight: "700",
    color: "#CA8A04",
    backgroundColor: "#FEFCE8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  statusDispensed: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    marginTop: 12,
    color: "#64748B",
  },
});