import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';

import { apiRequest } from '@/lib/api';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone_number: '',
    city: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(
      form.email.trim() &&
        form.password &&
        form.password.length >= 8 &&
        form.first_name.trim() &&
        form.last_name.trim() &&
        form.date_of_birth
    );
  }, [form]);

  const onSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await apiRequest('/patients/register', {
        method: 'POST',
        body: {
          email: form.email.trim(),
          password: form.password,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          date_of_birth: form.date_of_birth,
          gender: form.gender || null,
          phone_number: form.phone_number || null,
          city: form.city || null,
          address: form.address || null,
        },
      });
      setSuccess('Registration successful. You can now log in.');
      setTimeout(() => router.replace('/login'), 500);
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create patient account</Text>

      <TextInput value={form.email} onChangeText={(v) => setForm(f => ({ ...f, email: v }))} placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <TextInput value={form.password} onChangeText={(v) => setForm(f => ({ ...f, password: v }))} placeholder="Password (min 8 chars)" secureTextEntry style={styles.input} />
      <TextInput value={form.first_name} onChangeText={(v) => setForm(f => ({ ...f, first_name: v }))} placeholder="First name" style={styles.input} />
      <TextInput value={form.last_name} onChangeText={(v) => setForm(f => ({ ...f, last_name: v }))} placeholder="Last name" style={styles.input} />
      <TextInput value={form.date_of_birth} onChangeText={(v) => setForm(f => ({ ...f, date_of_birth: v }))} placeholder="Date of birth (YYYY-MM-DD)" style={styles.input} />
      <TextInput value={form.gender} onChangeText={(v) => setForm(f => ({ ...f, gender: v }))} placeholder="Gender (optional)" style={styles.input} />
      <TextInput value={form.phone_number} onChangeText={(v) => setForm(f => ({ ...f, phone_number: v }))} placeholder="Phone (optional)" style={styles.input} />
      <TextInput value={form.city} onChangeText={(v) => setForm(f => ({ ...f, city: v }))} placeholder="City (optional)" style={styles.input} />
      <TextInput value={form.address} onChangeText={(v) => setForm(f => ({ ...f, address: v }))} placeholder="Address (optional)" style={styles.input} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Pressable style={[styles.button, !canSubmit || submitting ? styles.buttonDisabled : null]} onPress={onSubmit}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/login" asChild>
          <Pressable>
            <Text style={styles.link}>Back to login</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#0b1220' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  input: {
    backgroundColor: '#111a2e',
    borderColor: '#233055',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 10,
  },
  button: { backgroundColor: '#2563eb', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: '#fca5a5', marginTop: 6, marginBottom: 6 },
  success: { color: '#86efac', marginTop: 6, marginBottom: 6 },
  footerRow: { flexDirection: 'row', gap: 8, marginTop: 16, justifyContent: 'center' },
  footerText: { color: '#b8c1d1' },
  link: { color: '#60a5fa', fontWeight: '700' },
});

