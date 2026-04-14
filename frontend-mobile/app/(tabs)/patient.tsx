import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Patient = { patient_id: number; first_name: string; last_name: string };
type Appointment = {
  appointment_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason?: string | null;
};
type MedicalRecord = {
  record_id: number;
  visit_date: string;
  diagnosis?: string | null;
  notes?: string | null;
  treatment_plan?: string | null;
};
type Prescription = {
  prescription_id: number;
  prescription_date: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string | null;
  instructions?: string | null;
  is_dispensed: boolean;
};

export default function PatientScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [newAppt, setNewAppt] = useState({
    appointment_date: new Date().toISOString().slice(0, 10),
    appointment_time: '09:00',
    reason: '',
  });

  const canBook = useMemo(() => Boolean(newAppt.appointment_date && newAppt.appointment_time), [newAppt]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const me = await apiRequest<Patient>('/patients/me', { query: { token } });
      setPatient(me);
      const appts = await apiRequest<Appointment[]>(`/appointments/patient/${me.patient_id}`, { query: { token } });
      setAppointments(Array.isArray(appts) ? appts : []);
      const recs = await apiRequest<MedicalRecord[]>(`/medical-records/patient/${me.patient_id}`, { query: { token } });
      setRecords(Array.isArray(recs) ? recs : []);
      const rx = await apiRequest<Prescription[]>(`/prescriptions/patient/${me.patient_id}`, { query: { token } });
      setPrescriptions(Array.isArray(rx) ? rx : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const book = async () => {
    if (!token || !patient || !canBook) return;
    setError(null);
    try {
      await apiRequest('/appointments/', {
        method: 'POST',
        query: { token },
        body: {
          patient_id: patient.patient_id,
          provider_id: null,
          facility_id: null,
          appointment_date: newAppt.appointment_date,
          appointment_time: newAppt.appointment_time,
          reason: newAppt.reason || null,
          notes: null,
        },
      });
      setNewAppt((a) => ({ ...a, reason: '' }));
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to book appointment');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={styles.title}>Patient dashboard</Text>
      {patient ? <Text style={styles.subtitle}>Welcome, {patient.first_name} {patient.last_name}</Text> : null}

      {loading ? <ActivityIndicator color="#fff" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Book appointment</Text>
        <TextInput style={styles.input} value={newAppt.appointment_date} onChangeText={(v) => setNewAppt(a => ({ ...a, appointment_date: v }))} placeholder="YYYY-MM-DD" />
        <TextInput style={styles.input} value={newAppt.appointment_time} onChangeText={(v) => setNewAppt(a => ({ ...a, appointment_time: v }))} placeholder="HH:MM" />
        <TextInput style={styles.input} value={newAppt.reason} onChangeText={(v) => setNewAppt(a => ({ ...a, reason: v }))} placeholder="Reason (optional)" />
        <Pressable style={[styles.button, !canBook ? styles.buttonDisabled : null]} onPress={book}>
          <Text style={styles.buttonText}>Submit request</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.cardTitle}>My appointments</Text>
          <Pressable onPress={refresh}><Text style={styles.link}>Refresh</Text></Pressable>
        </View>
        {appointments.length ? appointments.map((a) => (
          <View key={a.appointment_id} style={styles.row}>
            <Text style={styles.rowMain}>{a.appointment_date} {String(a.appointment_time).slice(0, 5)}</Text>
            <Text style={styles.rowSub}>{a.status}{a.reason ? ` • ${a.reason}` : ''}</Text>
          </View>
        )) : (
          <Text style={styles.muted}>No appointments yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.cardTitle}>My medical records</Text>
          <Pressable onPress={refresh}><Text style={styles.link}>Refresh</Text></Pressable>
        </View>
        {records.length ? records.slice(0, 10).map((r) => (
          <View key={r.record_id} style={styles.row}>
            <Text style={styles.rowMain}>#{r.record_id} • {String(r.visit_date)}</Text>
            <Text style={styles.rowSub}>{r.diagnosis || '—'}</Text>
            {r.notes ? <Text style={styles.rowSub}>{r.notes}</Text> : null}
            {r.treatment_plan ? <Text style={styles.rowSub}>Plan: {r.treatment_plan}</Text> : null}
          </View>
        )) : (
          <Text style={styles.muted}>No medical records yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.cardTitle}>My prescriptions</Text>
          <Pressable onPress={refresh}><Text style={styles.link}>Refresh</Text></Pressable>
        </View>
        {prescriptions.length ? prescriptions.slice(0, 10).map((p) => (
          <View key={p.prescription_id} style={styles.row}>
            <Text style={styles.rowMain}>#{p.prescription_id} • {String(p.prescription_date)}</Text>
            <Text style={styles.rowSub}>{p.medication_name} • {p.dosage} • {p.frequency}</Text>
            {p.duration ? <Text style={styles.rowSub}>Duration: {p.duration}</Text> : null}
            {p.instructions ? <Text style={styles.rowSub}>Instructions: {p.instructions}</Text> : null}
            <Text style={styles.rowSub}>Dispensed: {p.is_dispensed ? 'Yes' : 'No'}</Text>
          </View>
        )) : (
          <Text style={styles.muted}>No prescriptions yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#b8c1d1', marginTop: 6, marginBottom: 12 },
  error: { color: '#fca5a5', marginTop: 10 },
  card: { backgroundColor: '#111a2e', borderColor: '#233055', borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14 },
  cardTitle: { color: '#fff', fontWeight: '800', marginBottom: 10 },
  input: { backgroundColor: '#0b1220', borderColor: '#233055', borderWidth: 1, borderRadius: 10, padding: 12, color: '#fff', marginBottom: 10 },
  button: { backgroundColor: '#2563eb', padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  muted: { color: '#b8c1d1' },
  link: { color: '#60a5fa', fontWeight: '700' },
  row: { paddingVertical: 10, borderTopColor: '#233055', borderTopWidth: 1 },
  rowMain: { color: '#fff', fontWeight: '700' },
  rowSub: { color: '#b8c1d1', marginTop: 4, fontSize: 12 },
});

