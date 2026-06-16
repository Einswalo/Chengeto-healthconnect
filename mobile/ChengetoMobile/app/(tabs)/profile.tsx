import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import QRCode from "react-native-qrcode-svg";
import { router } from "expo-router";

import API from "@/services/api";
import { removeToken } from "@/utils/storage";

export default function ProfileScreen() {
  const [profileImage, setProfileImage] = useState("https://i.pravatar.cc/300");
  const [patient, setPatient] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPatient();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Camera roll permission is required to change profile picture");
    }
  };

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await API.get("/patients/me");
      setPatient(response.data);
      if (response.data?.profile_image) {
        setProfileImage(response.data.profile_image);
      }
    } catch (error: any) {
      console.log("PROFILE ERROR:", error?.response?.data || error.message);
      Alert.alert("Error", "Failed to load profile data");
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;
      setProfileImage(selectedImage);
      
      // Upload image to server
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("profile_image", {
          uri: selectedImage,
          type: "image/jpeg",
          name: "profile.jpg",
        } as any);
        
        await API.put("/patients/me/profile-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        Alert.alert("Success", "Profile picture updated!");
      } catch (error: any) {
        console.log("UPLOAD ERROR:", error?.response?.data || error.message);
        Alert.alert("Error", "Failed to upload profile picture");
      } finally {
        setUploading(false);
      }
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "N/A";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await removeToken();
            router.replace("/login");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={{ marginTop: 10, color: "#64748B" }}>Loading profile...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#64748B" }}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPatient}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${patient.first_name} ${patient.last_name}`;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.placeholder} />
      </View>

      {/* PROFILE IMAGE */}
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickImage} style={styles.imageWrapper} disabled={uploading}>
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
          <View style={styles.cameraButton}>
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={20} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.subId}>Patient ID: {patient.patient_id}</Text>
        <Text style={styles.subId}>National ID: {patient.national_id || "N/A"}</Text>
      </View>

      {/* PERSONAL INFO */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={22} color="#16A34A" />
          <Text style={styles.cardTitle}>Personal Information</Text>
        </View>
        <Info label="Gender" value={patient.gender} />
        <Info label="Age" value={calculateAge(patient.date_of_birth)} />
        <Info label="Date of Birth" value={patient.date_of_birth} />
        <Info label="Phone" value={patient.phone_number} />
        <Info label="City" value={patient.city} />
        <Info label="Address" value={patient.address} />
      </View>

      {/* MEDICAL INFO */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="medkit-outline" size={22} color="#2563EB" />
          <Text style={styles.cardTitle}>Medical Information</Text>
        </View>
        <Info label="Blood Type" value={patient.blood_type} />
        <Info label="Allergies" value={patient.allergies || "None"} />
        <Info label="Chronic Conditions" value={patient.chronic_conditions || "None"} />
      </View>

      {/* EMERGENCY CONTACT */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="warning-outline" size={22} color="#CA8A04" />
          <Text style={styles.cardTitle}>Emergency Contact</Text>
        </View>
        <Info label="Name" value={patient.emergency_contact_name || "N/A"} />
        <Info label="Phone" value={patient.emergency_contact_phone || "N/A"} />
      </View>

      {/* QR CODE */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="qr-code-outline" size={22} color="#0F172A" />
          <Text style={styles.cardTitle}>Patient QR Code</Text>
        </View>
        <TouchableOpacity style={styles.qrButton} onPress={() => setShowQR(true)}>
          <Ionicons name="qr-code" size={22} color="#fff" />
          <Text style={styles.qrButtonText}>View QR Code</Text>
        </TouchableOpacity>
      </View>

      {/* ACCOUNT ACTIONS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="settings-outline" size={22} color="#64748B" />
          <Text style={styles.cardTitle}>Account</Text>
        </View>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
          <Text style={styles.menuItemText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={20} color="#64748B" />
          <Text style={styles.menuItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" />
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Chengeto HealthConnect v1.0</Text>
      </View>

      {/* QR CODE MODAL */}
      <Modal visible={showQR} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your QR Code</Text>
              <TouchableOpacity onPress={() => setShowQR(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.qrContainer}>
              <QRCode
                value={JSON.stringify({
                  patient_id: patient.patient_id,
                  national_id: patient.national_id,
                  name: fullName,
                })}
                size={220}
                color="#0F172A"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.qrNote}>Show this QR code at healthcare facilities for quick identification</Text>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowQR(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ===== REUSABLE INFO ROW COMPONENT ===== */
const Info = ({ label, value }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
  </View>
);

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FB",
  },
  center: {
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
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#16A34A",
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  placeholder: {
    width: 40,
  },
  imageSection: {
    alignItems: "center",
    marginTop: -40,
    marginBottom: 20,
  },
  imageWrapper: {
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#E2E8F0",
  },
  cameraButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#16A34A",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 12,
  },
  subId: {
    color: "#64748B",
    marginTop: 4,
    fontSize: 13,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoLabel: {
    color: "#64748B",
    fontSize: 14,
  },
  infoValue: {
    fontWeight: "600",
    color: "#0F172A",
    fontSize: 14,
    maxWidth: "60%",
    textAlign: "right",
  },
  qrButton: {
    backgroundColor: "#16A34A",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  qrButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    color: "#334155",
    fontSize: 15,
  },
  logoutButton: {
    backgroundColor: "#DC2626",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    alignItems: "center",
    marginBottom: 30,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    width: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  qrContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  qrNote: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  closeModalButton: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  closeModalText: {
    color: "#fff",
    fontWeight: "600",
  },
});