import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
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

export default function HomeScreen() {
  const [patient, setPatient] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Get patient profile
      const patientRes = await API.get("/patients/me");
      const patientData = patientRes.data;
      setPatient(patientData);

      const patientId = patientData.patient_id;

      // Get prescriptions
      const prescriptionsRes = await API.get(`/prescriptions/patient/${patientId}`);
      setPrescriptions(prescriptionsRes.data);

      // Get appointments
      const appointmentsRes = await API.get(`/appointments/patient/${patientId}`);
      setAppointments(appointmentsRes.data);

      // Get medical records
      const recordsRes = await API.get(`/medical-records/patient/${patientId}`);
      setRecords(recordsRes.data);

    } catch (error: any) {
      console.log("HOME ERROR:", error?.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const pendingPrescriptions = prescriptions.filter(rx => !rx.is_dispensed);
  const upcomingAppointments = appointments.filter(
    a => a.status !== "Cancelled" && new Date(a.appointment_date) >= new Date()
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={{ marginTop: 10, color: "#64748B" }}>Loading your health data...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Failed to load patient data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAllData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${patient.first_name} ${patient.last_name}`;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16A34A"]} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome Back,</Text>
          <Text style={styles.name}>{patient.first_name} {patient.last_name}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: patient.profile_image || "https://i.pravatar.cc/150?img=12",
              }}
              style={styles.avatar}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* STATS CARDS */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="medical" size={24} color="#16A34A" />
          <Text style={styles.statValue}>{pendingPrescriptions.length}</Text>
          <Text style={styles.statLabel}>Active Prescriptions</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#2563EB" />
          <Text style={styles.statValue}>{upcomingAppointments.length}</Text>
          <Text style={styles.statLabel}>Upcoming Appointments</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={24} color="#0F172A" />
          <Text style={styles.statValue}>{records.length}</Text>
          <Text style={styles.statLabel}>Medical Records</Text>
        </View>
      </View>

      {/* HEALTH INFO CARD */}
      <View style={styles.healthCard}>
        <Text style={styles.healthTitle}>Health Summary</Text>
        <View style={styles.healthGrid}>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Blood Type</Text>
            <Text style={styles.healthValue}>{patient.blood_type || "N/A"}</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Gender</Text>
            <Text style={styles.healthValue}>{patient.gender || "N/A"}</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>City</Text>
            <Text style={styles.healthValue}>{patient.city || "N/A"}</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Allergies</Text>
            <Text style={styles.healthValue}>{patient.allergies || "None"}</Text>
          </View>
        </View>
      </View>

      {/* PENDING PRESCRIPTIONS */}
      {pendingPrescriptions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💊 Pending Prescriptions</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/prescriptions")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {pendingPrescriptions.slice(0, 2).map((rx) => (
            <TouchableOpacity
              key={rx.prescription_id}
              style={styles.prescriptionCard}
              onPress={() =>
                router.push({
                  pathname: "/prescription-details",
                  params: { prescriptionId: rx.prescription_id },
                })
              }
            >
              <Text style={styles.medicationName}>💊 {rx.medication_name}</Text>
              <Text style={styles.prescriptionInfo}>{rx.dosage} • {rx.frequency}</Text>
              {/* Show Token Preview */}
              <View style={styles.tokenPreview}>
                <Text style={styles.tokenLabel}>🔐 Token:</Text>
                <Text style={styles.tokenValue} numberOfLines={1}>
                  {rx.blockchain_token}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* QUICK ACTIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/ai-helper")}
          >
            <Ionicons name="sparkles" size={28} color="#2563EB" />
            <Text style={styles.actionText}>AI Symptom Check</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/medical-history")}
          >
            <Ionicons name="document-text" size={28} color="#0F172A" />
            <Text style={styles.actionText}>View Records</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* UPCOMING APPOINTMENTS */}
      {upcomingAppointments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/appointments")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {upcomingAppointments.slice(0, 2).map((apt) => (
            <View key={apt.appointment_id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentDate}>{apt.appointment_date}</Text>
                <Text style={styles.appointmentTime}>{apt.appointment_time}</Text>
              </View>
              <Text style={styles.appointmentReason}>{apt.reason}</Text>
              <View style={styles.appointmentStatus}>
                <Text style={styles.statusText}>{apt.status}</Text>
              </View>
            </View>
          ))}
        </View>
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
  retryButton: {
    marginTop: 20,
    backgroundColor: "#16A34A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  welcome: {
    color: "#64748B",
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  healthCard: {
    backgroundColor: "#16A34A",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  healthTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  healthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  healthItem: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  healthLabel: {
    color: "#DBEAFE",
    fontSize: 11,
    marginBottom: 4,
  },
  healthValue: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  seeAll: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },
  prescriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#CA8A04",
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  prescriptionInfo: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  tokenPreview: {
    backgroundColor: "#FEFCE8",
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#CA8A04",
  },
  tokenValue: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#1D4ED8",
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  appointmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  appointmentTime: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },
  appointmentReason: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  appointmentStatus: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "600",
  },
});