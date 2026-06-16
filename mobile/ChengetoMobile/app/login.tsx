import { useRouter } from "expo-router";
import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import api, { loginUser, saveToken } from "../services/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter Email and Password");
      return;
    }

    try {
      setLoading(true);
      console.log("🔐 Attempting login with:", email);

      // Use the login function from api.ts
      const data = await loginUser(email, password);
      console.log("📦 Login response:", data);

      if (!data?.access_token) {
        throw new Error("No access token received");
      }

      // Save token using the saveToken function
      await saveToken(data.access_token);
      console.log("✅ Token saved");

      Alert.alert("Success", "Login successful");
      router.replace("/(tabs)");

    } catch (error: any) {
      console.log("❌ Login error:", error?.response?.data || error.message);
      
      const message = error?.response?.data?.detail || 
                      error?.response?.data?.message ||
                      error.message || 
                      "Login failed";
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.logo}>Chengeto</Text>
          <Text style={styles.subtitle}>Smart Healthcare Platform</Text>

          <View style={styles.card}>
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.description}>
              Securely access your healthcare records, appointments, prescriptions and medical services.
            </Text>

            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.registerText}>
                Don't have an account? Register here
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Your information is protected and encrypted.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EFF6FF",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontSize: 42,
    fontWeight: "800",
    color: "#16A34A",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748B",
    marginBottom: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    color: "#0F172A",
  },
  description: {
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#16A34A",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  registerText: {
    textAlign: "center",
    marginTop: 20,
    color: "#16A34A",
    fontWeight: "600",
  },
  footerText: {
    textAlign: "center",
    marginTop: 20,
    color: "#94A3B8",
    fontSize: 12,
  },
});