import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Patient = { patient_id: number; first_name: string; last_name: string; phone_number?: string | null; national_id?: string | null };
type MedicalRecord = { record_id: number; visit_date: string; diagnosis?: string | null; notes?: string | null; created_at: string };
type AIPrediction = { prediction_id: number; predicted_condition?: string | null; confidence_score?: number | null; prediction_date: string };
type Prescription = { prescription_id: number; medication_name: string; dosage: string; frequency: string; prescription_date: string; is_dispensed: boolean };

export default function ClinicianScreen() {
  const { token, user } = useAuth();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [recordDraft, setRecordDraft] = useState<{ record_id?: number; visit_date: string; diagnosis: string; notes: string }>({
    visit_date: new Date().toISOString().slice(0, 10),
    diagnosis: '',
    notes: '',
  });
  const [rxDraft, setRxDraft] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    prescription_date: new Date().toISOString().slice(0, 10),
  });
  const canPrescribe = useMemo(() => Boolean(selected && rxDraft.medication_name.trim() && rxDraft.dosage.trim() && rxDraft.frequency.trim()), [selected, rxDraft]);

  const [aiDraft, setAiDraft] = useState({ symptoms: '', patient_location: '' });
  const canRunAi = useMemo(() => Boolean(selected && aiDraft.symptoms.trim()), [selected, aiDraft]);
  const canSave = useMemo(
    () => Boolean(selected && (recordDraft.diagnosis.trim() || recordDraft.notes.trim())),
    [selected, recordDraft]
  );

  const search = async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const resp = await apiRequest<Patient[]>('/patients/search', { query: { token, q, limit: 20 } });
      setPatients(Array.isArray(resp) ? resp : []);
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (patientId: number) => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const resp = await apiRequest<MedicalRecord[]>(`/medical-records/patient/${patientId}`, { query: { token } });
      setRecords(Array.isArray(resp) ? resp : []);
      const ai = await apiRequest<AIPrediction[]>(`/ai/predictions/patient/${patientId}`, { query: { token } });
      setPredictions(Array.isArray(ai) ? ai : []);
      const rx = await apiRequest<Prescription[]>(`/prescriptions/patient/${patientId}`, { query: { token } });
      setPrescriptions(Array.isArray(rx) ? rx : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = async (p: Patient) => {
    setSelected(p);
    await loadRecords(p.patient_id);
  };

  const saveRecord = async () => {
    if (!token || !selected || !canSave) return;
    setError(null);
    setLoading(true);
    try {
      if (recordDraft.record_id) {
        await apiRequest(`/medical-records/${recordDraft.record_id}`, {
          method: 'PUT',
          query: { token },
          body: {
            visit_date: recordDraft.visit_date || null,
            diagnosis: recordDraft.diagnosis || null,
            notes: recordDraft.notes || null,
          },
        });
      } else {
        await apiRequest('/medical-records/', {
          method: 'POST',
          query: { token },
          body: {
            patient_id: selected.patient_id,
            provider_id: null,
            facility_id: null,
            visit_date: recordDraft.visit_date,
            diagnosis: recordDraft.diagnosis || null,
            symptoms: null,
            treatment_plan: null,
            notes: recordDraft.notes || null,
          },
        });
      }
      setRecordDraft({ visit_date: new Date().toISOString().slice(0, 10), diagnosis: '', notes: '' });
      await loadRecords(selected.patient_id);
    } catch (e: any) {
      setError(e?.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  const createPrescription = async () => {
    if (!token || !selected || !canPrescribe) return;
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/prescriptions/', {
        method: 'POST',
        query: { token },
        body: {
          patient_id: selected.patient_id,
          provider_id: null,
          record_id: recordDraft.record_id ?? null,
          medication_name: rxDraft.medication_name,
          dosage: rxDraft.dosage,
          frequency: rxDraft.frequency,
          duration: rxDraft.duration || null,
          instructions: rxDraft.instructions || null,
          prescription_date: rxDraft.prescription_date,
        },
      });
      setRxDraft((d) => ({ ...d, medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }));
      await loadRecords(selected.patient_id);
    } catch (e: any) {
      setError(e?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  const runAi = async () => {
    if (!token || !selected || !canRunAi) return;
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/ai/predict', {
        method: 'POST',
        query: { token },
        body: {
          patient_id: selected.patient_id,
          record_id: recordDraft.record_id ?? null,
          symptoms: aiDraft.symptoms,
          vital_signs: null,
          patient_location: aiDraft.patient_location || null,
        },
      });
      setAiDraft({ symptoms: '', patient_location: '' });
      await loadRecords(selected.patient_id);
    } catch (e: any) {
      setError(e?.message || 'Failed to run AI prediction');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // default no-op
  }, []);

  const role = user?.user_type;
  const allowed = role === 'doctor' || role === 'nurse' || role === 'admin';

  if (!allowed) {
    return (
      <View style={[styles.container, { padding: 20, paddingTop: 60 }]}>
        <Text style={styles.title}>Clinician</Text>
        <Text style={styles.muted}>This page is for doctors/nurses/admins.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={styles.title}>Clinician dashboard</Text>
      <Text style={styles.subtitle}>Search and manage patients</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Search patients</Text>
        <TextInput style={styles.input} value={q} onChangeText={setQ} placeholder="Name / phone / national id" />
        <Pressable style={styles.button} onPress={search}>
          <Text style={styles.buttonText}>Search</Text>
        </Pressable>
        {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 10 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {patients.map((p) => (
          <Pressable key={p.patient_id} onPress={() => selectPatient(p)} style={styles.patientRow}>
            <Text style={styles.rowMain}>{p.first_name} {p.last_name}</Text>
            <Text style={styles.rowSub}>ID: {p.patient_id}{p.phone_number ? ` • ${p.phone_number}` : ''}</Text>
          </Pressable>
        ))}
      </View>

      {selected ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Selected patient</Text>
            <Text style={styles.rowMain}>{selected.first_name} {selected.last_name}</Text>
            <Text style={styles.rowSub}>Patient ID: {selected.patient_id}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{recordDraft.record_id ? `Edit record #${recordDraft.record_id}` : 'Add note / diagnosis'}</Text>
            <TextInput
              style={styles.input}
              value={recordDraft.visit_date}
              onChangeText={(v) => setRecordDraft(r => ({ ...r, visit_date: v }))}
              placeholder="Visit date (YYYY-MM-DD)"
            />
            <TextInput style={styles.input} value={recordDraft.diagnosis} onChangeText={(v) => setRecordDraft(r => ({ ...r, diagnosis: v }))} placeholder="Diagnosis" />
            <TextInput style={[styles.input, { height: 90 }]} value={recordDraft.notes} onChangeText={(v) => setRecordDraft(r => ({ ...r, notes: v }))} placeholder="Notes" multiline />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={[styles.button, !canSave ? styles.buttonDisabled : null, { flex: 1 }]} onPress={saveRecord}>
                <Text style={styles.buttonText}>{recordDraft.record_id ? 'Update record' : 'Save record'}</Text>
              </Pressable>
              {recordDraft.record_id ? (
                <Pressable style={[styles.buttonSecondary, { flex: 1 }]} onPress={() => setRecordDraft({ visit_date: new Date().toISOString().slice(0, 10), diagnosis: '', notes: '' })}>
                  <Text style={styles.buttonText}>New record</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.mutedSmall}>If you get “consent required”, have the patient grant consent in the patient app/web.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent records</Text>
            {records.length ? records.map((r) => (
              <Pressable
                key={r.record_id}
                onPress={() => setRecordDraft({ record_id: r.record_id, visit_date: r.visit_date, diagnosis: r.diagnosis || '', notes: r.notes || '' })}
                style={styles.row}
              >
                <Text style={styles.rowMain}>#{r.record_id} • {String(r.visit_date)} • {new Date(r.created_at).toLocaleString()}</Text>
                <Text style={styles.rowSub}>{r.diagnosis || '—'}</Text>
                {r.notes ? <Text style={styles.rowSub}>{r.notes}</Text> : null}
                <Text style={styles.rowHint}>Tap to edit</Text>
              </Pressable>
            )) : (
              <Text style={styles.muted}>No records found.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create prescription</Text>
            <TextInput style={styles.input} value={rxDraft.medication_name} onChangeText={(v) => setRxDraft(d => ({ ...d, medication_name: v }))} placeholder="Medication name" />
            <TextInput style={styles.input} value={rxDraft.dosage} onChangeText={(v) => setRxDraft(d => ({ ...d, dosage: v }))} placeholder="Dosage (e.g. 1 tablet)" />
            <TextInput style={styles.input} value={rxDraft.frequency} onChangeText={(v) => setRxDraft(d => ({ ...d, frequency: v }))} placeholder="Frequency (e.g. twice daily)" />
            <TextInput style={styles.input} value={rxDraft.duration} onChangeText={(v) => setRxDraft(d => ({ ...d, duration: v }))} placeholder="Duration (optional)" />
            <TextInput style={[styles.input, { height: 70 }]} value={rxDraft.instructions} onChangeText={(v) => setRxDraft(d => ({ ...d, instructions: v }))} placeholder="Instructions (optional)" multiline />
            <TextInput style={styles.input} value={rxDraft.prescription_date} onChangeText={(v) => setRxDraft(d => ({ ...d, prescription_date: v }))} placeholder="Prescription date (YYYY-MM-DD)" />
            <Pressable style={[styles.button, !canPrescribe ? styles.buttonDisabled : null]} onPress={createPrescription}>
              <Text style={styles.buttonText}>Save prescription</Text>
            </Pressable>
            <Text style={styles.mutedSmall}>Tip: open a record and tap it first if you want to link Rx to a specific record.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Prescriptions (latest)</Text>
            {prescriptions.length ? prescriptions.slice(0, 5).map((p) => (
              <View key={p.prescription_id} style={styles.row}>
                <Text style={styles.rowMain}>#{p.prescription_id} • {p.medication_name}</Text>
                <Text style={styles.rowSub}>{p.dosage} • {p.frequency} • {String(p.prescription_date)} • Dispensed: {p.is_dispensed ? 'Yes' : 'No'}</Text>
              </View>
            )) : (
              <Text style={styles.muted}>No prescriptions found.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Run AI prediction</Text>
            <TextInput style={[styles.input, { height: 90 }]} value={aiDraft.symptoms} onChangeText={(v) => setAiDraft(d => ({ ...d, symptoms: v }))} placeholder="Symptoms (required)" multiline />
            <TextInput style={styles.input} value={aiDraft.patient_location} onChangeText={(v) => setAiDraft(d => ({ ...d, patient_location: v }))} placeholder="Location (optional, e.g. Kariba)" />
            <Pressable style={[styles.button, !canRunAi ? styles.buttonDisabled : null]} onPress={runAi}>
              <Text style={styles.buttonText}>Run AI</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI predictions (latest)</Text>
            {predictions.length ? predictions.slice(0, 5).map((p) => (
              <View key={p.prediction_id} style={styles.row}>
                <Text style={styles.rowMain}>#{p.prediction_id} • {new Date(p.prediction_date).toLocaleString()}</Text>
                <Text style={styles.rowSub}>{p.predicted_condition || '—'}{p.confidence_score != null ? ` • ${p.confidence_score}%` : ''}</Text>
              </View>
            )) : (
              <Text style={styles.muted}>No AI predictions found.</Text>
            )}
          </View>
        </>
      ) : null}
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
  buttonSecondary: { backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  muted: { color: '#b8c1d1' },
  mutedSmall: { color: '#b8c1d1', marginTop: 8, fontSize: 12 },
  patientRow: { paddingVertical: 10, borderTopColor: '#233055', borderTopWidth: 1 },
  row: { paddingVertical: 10, borderTopColor: '#233055', borderTopWidth: 1 },
  rowMain: { color: '#fff', fontWeight: '700' },
  rowSub: { color: '#b8c1d1', marginTop: 4, fontSize: 12 },
  rowHint: { color: '#60a5fa', marginTop: 6, fontSize: 12, fontWeight: '700' },
});

