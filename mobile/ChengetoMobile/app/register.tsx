import React, { useState } from "react";

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";

import { router } from "expo-router";

import API from "../services/api";

export default function RegisterScreen() {

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({

    email: "",
    password: "",
    user_type: "patient",

    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",

    phone_number: "",
    address: "",
    city: "",

    national_id: "",

    emergency_contact_name: "",
    emergency_contact_phone: "",

    blood_type: "",
    allergies: "",
    chronic_conditions: "",

  });

  const updateField = (
    field: string,
    value: string
  ) => {

    setForm({
      ...form,
      [field]: value,
    });
  };

  const handleRegister = async () => {

    try {

      setLoading(true);

      const response = await API.post(
        "/patients/register",
        form
      );

      console.log(response.data);

      Alert.alert(
        "Success",
        "Patient account created"
      );

      router.replace("/login");

    } catch (error: any) {

      console.log(
        "REGISTER ERROR:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "Registration Failed",
        JSON.stringify(
          error?.response?.data
        ) || "Server error"
      );

    } finally {
      setLoading(false);
    }
  };

  return (

    <SafeAreaView style={{ flex: 1 }}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >

          <Text style={styles.title}>
            Patient Registration
          </Text>

          <TextInput
            placeholder="Email"
            style={styles.input}
            onChangeText={(t) =>
              updateField("email", t)
            }
          />

          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            onChangeText={(t) =>
              updateField("password", t)
            }
          />

          <TextInput
            placeholder="First Name"
            style={styles.input}
            onChangeText={(t) =>
              updateField("first_name", t)
            }
          />

          <TextInput
            placeholder="Last Name"
            style={styles.input}
            onChangeText={(t) =>
              updateField("last_name", t)
            }
          />

          <TextInput
            placeholder="Date of Birth YYYY-MM-DD"
            style={styles.input}
            onChangeText={(t) =>
              updateField("date_of_birth", t)
            }
          />

          <TextInput
            placeholder="Gender (Male/Female/Other)"
            style={styles.input}
            onChangeText={(t) =>
              updateField("gender", t)
            }
          />

          <TextInput
            placeholder="Phone Number"
            style={styles.input}
            onChangeText={(t) =>
              updateField("phone_number", t)
            }
          />

          <TextInput
            placeholder="Address"
            style={styles.input}
            onChangeText={(t) =>
              updateField("address", t)
            }
          />

          <TextInput
            placeholder="City"
            style={styles.input}
            onChangeText={(t) =>
              updateField("city", t)
            }
          />

          <TextInput
            placeholder="National ID"
            style={styles.input}
            onChangeText={(t) =>
              updateField("national_id", t)
            }
          />

          <TextInput
            placeholder="Emergency Contact Name"
            style={styles.input}
            onChangeText={(t) =>
              updateField(
                "emergency_contact_name",
                t
              )
            }
          />

          <TextInput
            placeholder="Emergency Contact Phone"
            style={styles.input}
            onChangeText={(t) =>
              updateField(
                "emergency_contact_phone",
                t
              )
            }
          />

          <TextInput
            placeholder="Blood Type"
            style={styles.input}
            onChangeText={(t) =>
              updateField("blood_type", t)
            }
          />

          <TextInput
            placeholder="Allergies"
            style={styles.input}
            onChangeText={(t) =>
              updateField("allergies", t)
            }
          />

          <TextInput
            placeholder="Chronic Conditions"
            style={styles.input}
            onChangeText={(t) =>
              updateField(
                "chronic_conditions",
                t
              )
            }
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >

            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Create Account
              </Text>
            )}

          </TouchableOpacity>

        </ScrollView>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    padding: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2563EB",
    marginTop: 20,
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },

  button: {
    backgroundColor: "#16A34A",
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 40,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

});