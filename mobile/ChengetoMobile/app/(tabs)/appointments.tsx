import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import API from "@/services/api";

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [booking, setBooking] = useState(false);
  const [bookForm, setBookForm] = useState({
    appointment_date: "",
    appointment_time: "",
    reason: "",
    facility_id: "",
  });

  useEffect(() => {
    fetchAppointments();
    fetchFacilities();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const patientRes = await API.get("/patients/me");
      const patientId = patientRes.data.patient_id;
      const response = await API.get(`/appointments/patient/${patientId}`);
      setAppointments(response.data);
    } catch (error: any) {
      console.log("APPOINTMENTS ERROR:", error?.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await API.get("/facilities/");
      setFacilities(response.data);
    } catch (error: any) {
      console.log("FACILITIES ERROR:", error?.response?.data || error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleBookAppointment = async () => {
    if (!bookForm.appointment_date || !bookForm.appointment_time || !bookForm.reason) {
      alert("Please fill all required fields");
      return;
    }

    setBooking(true);
    try {
      const patientRes = await API.get("/patients/me");
      const patientId = patientRes.data.patient_id;

      await API.post("/appointments/", {
        patient_id: patientId,
        appointment_date: bookForm.appointment_date,
        appointment_time: bookForm.appointment_time,
        reason: bookForm.reason,
        facility_id: bookForm.facility_id || null,
      });
      
      alert("✅ Appointment booked successfully!");
      setShowBookModal(false);
      setBookForm({ appointment_date: "", appointment_time: "", reason: "", facility_id: "" });
      fetchAppointments();
    } catch (error: any) {
      alert("❌ " + (error?.response?.data?.detail || "Failed to book appointment"));
    } finally {
      setBooking(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    try {
      await API.delete(`/appointments/${id}`);
      alert("✅ Appointment cancelled");
      fetchAppointments();
    } catch (error: any) {
      alert("❌ Failed to cancel appointment");
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const upcomingAppointments = appointments.filter(
    a => a.status !== "Cancelled" && new Date(a.appointment_date) >= new Date()
  );
  const pastAppointments = appointments.filter(
    a => new Date(a.appointment_date) < new Date() || a.status === "Cancelled"
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading appointments...</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>📅 Appointments</Text>
        <TouchableOpacity style={styles.bookButton} onPress={() => setShowBookModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.bookButtonText}>Book New</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcomingAppointments.map((apt) => (
            <View key={apt.appointment_id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentDate}>{apt.appointment_date}</Text>
                <Text style={styles.appointmentTime}>{apt.appointment_time}</Text>
              </View>
              <Text style={styles.appointmentReason}>{apt.reason}</Text>
              <View style={styles.appointmentFooter}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{apt.status}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => handleCancelAppointment(apt.appointment_id)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, styles.pastTitle]}>Past Appointments</Text>
          {pastAppointments.map((apt) => (
            <View key={apt.appointment_id} style={[styles.appointmentCard, styles.pastCard]}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentDate}>{apt.appointment_date}</Text>
                <Text style={styles.appointmentTime}>{apt.appointment_time}</Text>
              </View>
              <Text style={styles.appointmentReason}>{apt.reason}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{apt.status === "Cancelled" ? "Cancelled" : "Completed"}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {appointments.length === 0 && (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No appointments yet</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => setShowBookModal(true)}>
            <Text style={styles.emptyButtonText}>Book Your First Appointment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Book Appointment Modal */}
      <Modal visible={showBookModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity onPress={() => setShowBookModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Date (YYYY-MM-DD)"
              style={styles.modalInput}
              value={bookForm.appointment_date}
              onChangeText={(text) => setBookForm({ ...bookForm, appointment_date: text })}
              placeholderTextColor="#94A3B8"
            />
            <TextInput
              placeholder="Time (HH:MM)"
              style={styles.modalInput}
              value={bookForm.appointment_time}
              onChangeText={(text) => setBookForm({ ...bookForm, appointment_time: text })}
              placeholderTextColor="#94A3B8"
            />
            <TextInput
              placeholder="Reason for visit"
              style={[styles.modalInput, styles.textArea]}
              value={bookForm.reason}
              onChangeText={(text) => setBookForm({ ...bookForm, reason: text })}
              multiline
              numberOfLines={3}
              placeholderTextColor="#94A3B8"
            />
            <TextInput
              placeholder="Facility ID (optional)"
              style={styles.modalInput}
              value={bookForm.facility_id}
              onChangeText={(text) => setBookForm({ ...bookForm, facility_id: text })}
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleBookAppointment}
              disabled={booking}
            >
              <Text style={styles.submitButtonText}>
                {booking ? "Booking..." : "Confirm Booking"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
  bookButton: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
    marginBottom: 12,
  },
  pastTitle: {
    color: "#64748B",
    marginTop: 20,
  },
  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  pastCard: {
    opacity: 0.8,
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
    marginBottom: 12,
  },
  appointmentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
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
  cancelButton: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
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
  emptyButton: {
    marginTop: 20,
    backgroundColor: "#16A34A",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#16A34A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});