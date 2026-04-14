import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';

import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { login, loading, token, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => Boolean(email.trim() && password), [email, password]);

  useEffect(() => {
    if (!loading && token && user) router.replace('/(tabs)');
  }, [loading, token, user]);

  const onSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chengeto HealthConnect</Text>
      <Text style={styles.subtitle}>Sign in</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.button, !canSubmit || submitting ? styles.buttonDisabled : null]} onPress={onSubmit}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>New patient?</Text>
        <Link href="/register" asChild>
          <Pressable>
            <Text style={styles.link}>Create account</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#0b1220',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#b8c1d1', fontSize: 14, marginBottom: 18 },
  input: {
    backgroundColor: '#111a2e',
    borderColor: '#233055',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: '#fca5a5', marginTop: 6, marginBottom: 6 },
  footerRow: { flexDirection: 'row', gap: 8, marginTop: 16, justifyContent: 'center' },
  footerText: { color: '#b8c1d1' },
  link: { color: '#60a5fa', fontWeight: '700' },
});

