import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [provider, setProvider] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchQ, setPatientSearchQ] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [consents, setConsents] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);
  const [emergencyLogs, setEmergencyLogs] = useState([]);
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [blockchainBlocks, setBlockchainBlocks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  const [aiSelected, setAiSelected] = useState(() => new Set());
  const [aiGeo, setAiGeo] = useState('Harare (urban)');
  const [aiResultHtml, setAiResultHtml] = useState('');

  const [emergencyFacility, setEmergencyFacility] = useState('Chitungwiza Central Hospital');
  const [emergencyClinicianId, setEmergencyClinicianId] = useState('');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyWindow, setEmergencyWindow] = useState('1 hour');

  const [newRecord, setNewRecord] = useState({
    visit_date: new Date().toISOString().slice(0, 10),
    diagnosis: '',
    symptoms: '',
    treatment_plan: '',
    notes: '',
    facility_id: '',
  });

  const [newPrescription, setNewPrescription] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    record_id: '',
  });

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const api = useMemo(() => axios.create({ baseURL: apiBaseUrl, timeout: 20000 }), [apiBaseUrl]);

  const pageTitles = useMemo(() => ({
    dashboard: 'Dashboard',
    records: 'Medical records',
    prescriptions: 'Prescriptions',
    consent: 'Consent manager',
    ai: 'AI diagnostics',
    blockchain: 'Blockchain audit',
    emergency: 'Emergency access',
  }), []);

  const avatarText = useMemo(() => {
    const parts = String(email || 'HC').split('@')[0].split(/[.\-_ ]+/).filter(Boolean);
    const initials = (parts[0]?.[0] || 'H') + (parts[1]?.[0] || 'C');
    return initials.toUpperCase();
  }, [email]);

  const fetchUserData = useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const userResponse = await api.get(`/auth/me?token=${token}`);
      const u = userResponse.data;
      setUser(u);

      let patientId = null;

      // provider profile (doctor/nurse/etc)
      if (u?.user_type && ["doctor", "nurse", "admin", "pharmacist"].includes(u.user_type)) {
        const providerResp = await Promise.allSettled([api.get(`/providers/me?token=${token}`)]);
        setProvider(providerResp[0].status === 'fulfilled' ? providerResp[0].value.data : null);
      } else {
        setProvider(null);
      }

      if (u?.user_type === 'patient') {
        const patientResponse = await api.get(`/patients/me?token=${token}`);
        const p = patientResponse.data;
        setPatient(p);
        setSelectedPatient(null);
        patientId = p?.patient_id ?? null;
      } else if (selectedPatient?.patient_id) {
        setPatient(null);
        patientId = selectedPatient.patient_id;
      } else {
        setPatient(null);
        patientId = null;
      }

      // Best-effort patient-centric data (some pages will still render with placeholders)
      if (patientId) {
        const [
          predictionsResponse,
          prescriptionsResponse,
          consentsResponse,
          emergencyResponse,
          vitalResponse,
          medicalRecordsResponse,
        ] = await Promise.allSettled([
          api.get(`/ai/predictions/patient/${patientId}?token=${token}`),
          api.get(`/prescriptions/patient/${patientId}?token=${token}`),
          api.get(`/consent/patient/${patientId}?token=${token}`),
          api.get(`/emergency-access/patient/${patientId}?token=${token}`),
          api.get(`/vital-signs/patient/${patientId}?token=${token}`),
          api.get(`/medical-records/patient/${patientId}?token=${token}`),
        ]);

        setPredictions(predictionsResponse.status === 'fulfilled' && Array.isArray(predictionsResponse.value.data) ? predictionsResponse.value.data : []);
        setPrescriptions(prescriptionsResponse.status === 'fulfilled' && Array.isArray(prescriptionsResponse.value.data) ? prescriptionsResponse.value.data : []);
        setConsents(consentsResponse.status === 'fulfilled' && Array.isArray(consentsResponse.value.data) ? consentsResponse.value.data : []);
        setEmergencyLogs(emergencyResponse.status === 'fulfilled' && Array.isArray(emergencyResponse.value.data) ? emergencyResponse.value.data : []);
        setVitalSigns(vitalResponse.status === 'fulfilled' && Array.isArray(vitalResponse.value.data) ? vitalResponse.value.data : []);
        setMedicalRecords(medicalRecordsResponse.status === 'fulfilled' && Array.isArray(medicalRecordsResponse.value.data) ? medicalRecordsResponse.value.data : []);
      } else {
        setPredictions([]);
        setPrescriptions([]);
        setConsents([]);
        setEmergencyLogs([]);
        setVitalSigns([]);
        setMedicalRecords([]);
      }

      // Blockchain status + blocks
      const bcVerify = await Promise.allSettled([
        api.get(`/blockchain/verify?token=${token}`),
        api.get(`/blockchain/blocks?token=${token}`),
      ]);
      setBlockchainStatus(bcVerify[0].status === 'fulfilled' ? bcVerify[0].value.data : null);
      setBlockchainBlocks(bcVerify[1].status === 'fulfilled' ? (bcVerify[1].value.data?.blocks || []) : []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data. Please check that the backend is running and try again.');
      setLoading(false);
    }
  }, [api, token, selectedPatient]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    window.location.reload();
  };

  const statValue = (value) => (value === null || value === undefined ? '—' : String(value));

  const pendingPrescriptions = useMemo(
    () => prescriptions.filter(p => !p.is_dispensed).length,
    [prescriptions]
  );

  const activeConsents = useMemo(
    () => consents.filter(c => c.consent_given).length,
    [consents]
  );

  const expiringSoonConsents = useMemo(() => {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return consents.filter(c => {
      if (!c.consent_given) return false;
      if (!c.valid_until) return false;
      const d = new Date(c.valid_until);
      return d >= now && d <= soon;
    }).length;
  }, [consents]);

  const facilitiesCount = useMemo(() => {
    const set = new Set();
    for (const r of medicalRecords) {
      if (r.facility_id) set.add(r.facility_id);
      else if (r.facility_name) set.add(r.facility_name);
    }
    return set.size || null;
  }, [medicalRecords]);

  const latestVitals = useMemo(() => {
    if (!vitalSigns.length) return null;
    const sorted = [...vitalSigns].sort((a, b) => {
      const da = new Date(a.recorded_at || a.created_at || 0).getTime();
      const db = new Date(b.recorded_at || b.created_at || 0).getTime();
      return db - da;
    });
    return sorted[0];
  }, [vitalSigns]);

  const recentActivity = useMemo(() => {
    const items = [];
    for (const rx of prescriptions.slice(0, 5)) {
      items.push({
        key: `rx-${rx.prescription_id}`,
        dot: 'blue',
        title: `Prescription ${rx.is_dispensed ? 'dispensed' : 'issued'} — ${rx.medication_name}`,
        meta: `${new Date(rx.prescription_date).toLocaleString()} · Token ${rx.blockchain_token ? 'recorded' : 'pending'}`,
      });
    }
    for (const c of consents.slice(0, 5)) {
      items.push({
        key: `cons-${c.consent_id}`,
        dot: c.consent_given ? 'green' : 'red',
        title: `${c.consent_given ? 'Consent granted' : 'Consent revoked'} — Provider ${c.provider_id}`,
        meta: `${new Date(c.created_at || Date.now()).toLocaleString()} · ${c.valid_until ? `Expires ${c.valid_until}` : 'Permanent'}`,
      });
    }
    for (const p of predictions.slice(0, 5)) {
      items.push({
        key: `ai-${p.prediction_id}`,
        dot: 'amber',
        title: `AI diagnostic — ${p.predicted_condition}`,
        meta: `${new Date(p.prediction_date).toLocaleString()} · Score ${(Number(p.confidence_score) / 100).toFixed(2)}`,
      });
    }
    for (const r of medicalRecords.slice(0, 5)) {
      items.push({
        key: `mr-${r.record_id || r.medical_record_id || Math.random()}`,
        dot: 'blue',
        title: `New record added — ${r.record_type || 'Medical record'}`,
        meta: `${new Date(r.record_date || r.created_at || Date.now()).toLocaleString()} · ${r.description || r.summary || ''}`,
      });
    }
    for (const e of emergencyLogs.slice(0, 5)) {
      items.push({
        key: `em-${e.log_id}`,
        dot: 'red',
        title: `Emergency access — Facility ${e.facility_id || ''}`.trim(),
        meta: `${new Date(e.access_time || e.created_at || Date.now()).toLocaleString()} · Audit ${e.blockchain_hash ? 'logged' : 'pending'}`,
      });
    }
    // Sort by detected time inside meta (best-effort)
    return items.slice(0, 6);
  }, [prescriptions, consents, predictions, medicalRecords, emergencyLogs]);

  const symptoms = useMemo(() => ([
    'Fever', 'Headache', 'Chills',
    'Sweating', 'Nausea', 'Vomiting',
    'Diarrhoea', 'Cough', 'Chest pain',
    'Fatigue', 'Rash', 'Jaundice',
  ]), []);

  const toggleSymptom = (s) => {
    setAiSelected(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const runAiLocal = () => {
    const sel = [...aiSelected];
    if (!sel.length) {
      setAiResultHtml('<div style="font-size:13px;color:var(--color-text-secondary);text-align:center;padding:40px 0">Please select at least one symptom.</div>');
      return;
    }

    const rural = aiGeo.toLowerCase().includes('rural');
    const scores = {
      Malaria: Math.min(0.95, (sel.includes('Fever') ? 0.35 : 0) + (sel.includes('Chills') ? 0.25 : 0) + (sel.includes('Sweating') ? 0.15 : 0) + (sel.includes('Headache') ? 0.1 : 0) + (sel.includes('Fatigue') ? 0.1 : 0) + (rural ? 0.1 : 0)),
      Typhoid: Math.min(0.95, (sel.includes('Fever') ? 0.3 : 0) + (sel.includes('Headache') ? 0.15 : 0) + (sel.includes('Diarrhoea') ? 0.2 : 0) + (sel.includes('Nausea') ? 0.1 : 0) + (sel.includes('Fatigue') ? 0.1 : 0)),
      Tuberculosis: Math.min(0.95, (sel.includes('Cough') ? 0.4 : 0) + (sel.includes('Fatigue') ? 0.15 : 0) + (sel.includes('Chest pain') ? 0.2 : 0) + (sel.includes('Fever') ? 0.1 : 0)),
      'Hepatitis A': Math.min(0.95, (sel.includes('Jaundice') ? 0.45 : 0) + (sel.includes('Nausea') ? 0.15 : 0) + (sel.includes('Fatigue') ? 0.15 : 0) + (sel.includes('Fever') ? 0.1 : 0)),
    };

    const colors = { Malaria: '#BA7517', Typhoid: '#185FA5', Tuberculosis: '#A32D2D', 'Hepatitis A': '#3B6D11' };
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const topPct = Math.round(top[1] * 100);
    const risk = topPct >= 60 ? 'High' : topPct >= 30 ? 'Moderate' : 'Low';
    const riskCls = topPct >= 60 ? 'hcBadgeDanger' : topPct >= 30 ? 'hcBadgeWarn' : 'hcBadgeSuccess';

    let html = '<div style="font-size:13px;font-weight:700;margin-bottom:12px">Diagnostic results</div>';
    html += `<div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:14px">Rule-based expert system · Symptoms: ${sel.join(', ')}</div>`;
    for (const [dis, sc] of sorted) {
      const pct = Math.round(sc * 100);
      html += `
        <div class="hcResultBar">
          <div class="hcResultBarLabel">
            <span style="font-size:13px;font-weight:700">${dis}</span>
            <span style="font-weight:700">${pct}%</span>
          </div>
          <div class="hcBarTrack">
            <div class="hcBarFill" style="width:${pct}%;background:${colors[dis] || '#185FA5'}"></div>
          </div>
        </div>
      `;
    }
    html += `
      <div style="margin-top:14px;padding-top:14px;border-top:0.5px solid var(--color-border-tertiary)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span class="hcBadgePill ${riskCls}">${risk} risk</span>
          <span style="font-size:12px;color:var(--color-text-secondary)">Primary: ${top[0]}</span>
        </div>
        <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.6">
          This is a rule-based suggestion only. Clinical confirmation and laboratory testing are required before any diagnosis or treatment.
        </div>
      </div>
    `;

    setAiResultHtml(html);
  };

  const markDispensed = async (prescriptionId) => {
    try {
      await api.put(`/prescriptions/${prescriptionId}/dispense?token=${token}`);
      await fetchUserData();
    } catch (e) {
      console.error(e);
      setError('Failed to mark prescription as dispensed (check role permissions and backend).');
    }
  };

  const toggleConsent = async (consent) => {
    // If already given, revoke via endpoint. If not given, we can't "grant" without a provider_id and consent_type.
    try {
      if (consent?.consent_given) {
        await api.put(`/consent/${consent.consent_id}/revoke?token=${token}`);
        await fetchUserData();
      }
    } catch (e) {
      console.error(e);
      setError('Failed to update consent. (Granting new consent requires a dedicated form; revoking requires patient ownership.)');
    }
  };

  const requestEmergencyAccess = async () => {
    try {
      const pid = patient?.patient_id || selectedPatient?.patient_id;
      if (!pid) {
        setError('Emergency access requires a patient context.');
        return;
      }
      await api.post(`/emergency-access/?token=${token}`, {
        patient_id: pid,
        provider_id: provider?.provider_id ?? null,
        facility_id: Number(newRecord.facility_id) || 1,
        access_reason: `[${emergencyFacility}] ${emergencyClinicianId ? `Clinician ${emergencyClinicianId}: ` : ''}${emergencyReason} (window: ${emergencyWindow})`,
      });
      await fetchUserData();
    } catch (e) {
      console.error(e);
      setError('Failed to request emergency access. This endpoint requires a doctor/nurse/admin token.');
    }
  };

  const searchPatients = async () => {
    try {
      setError('');
      const resp = await api.get(`/patients/search?token=${token}&q=${encodeURIComponent(patientSearchQ)}&limit=12`);
      setPatientSearchResults(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error(e);
      setError('Patient search failed. Make sure you are logged in as a doctor/nurse/admin.');
    }
  };

  const selectPatientById = async (patientId) => {
    try {
      const resp = await api.get(`/patients/${patientId}?token=${token}`);
      setSelectedPatient(resp.data);
      setActivePage('dashboard');
    } catch (e) {
      console.error(e);
      setError('Failed to load selected patient.');
    }
  };

  const createMedicalRecord = async () => {
    try {
      setError('');
      const pid = selectedPatient?.patient_id;
      if (!pid) {
        setError('Select a patient first.');
        return;
      }
      if (!provider?.provider_id && user?.user_type !== 'admin') {
        setError('Provider profile not found for this account (missing provider_id).');
        return;
      }
      await api.post(`/medical-records/?token=${token}`, {
        patient_id: pid,
        provider_id: provider?.provider_id ?? null,
        facility_id: newRecord.facility_id ? Number(newRecord.facility_id) : null,
        visit_date: newRecord.visit_date,
        diagnosis: newRecord.diagnosis || null,
        symptoms: newRecord.symptoms || null,
        treatment_plan: newRecord.treatment_plan || null,
        notes: newRecord.notes || null,
      });
      setNewRecord((r) => ({ ...r, diagnosis: '', symptoms: '', treatment_plan: '', notes: '' }));
      await fetchUserData();
      setActivePage('records');
    } catch (e) {
      console.error(e);
      setError('Failed to create medical record. Check your token role and required fields.');
    }
  };

  const createPrescription = async () => {
    try {
      setError('');
      const pid = selectedPatient?.patient_id;
      if (!pid) {
        setError('Select a patient first.');
        return;
      }
      if (!newPrescription.medication_name || !newPrescription.dosage || !newPrescription.frequency) {
        setError('Medication name, dosage, and frequency are required.');
        return;
      }
      await api.post(`/prescriptions/?token=${token}`, {
        patient_id: pid,
        provider_id: provider?.provider_id ?? null,
        record_id: newPrescription.record_id ? Number(newPrescription.record_id) : null,
        medication_name: newPrescription.medication_name,
        dosage: newPrescription.dosage,
        frequency: newPrescription.frequency,
        duration: newPrescription.duration || null,
        instructions: newPrescription.instructions || null,
      });
      setNewPrescription({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        record_id: '',
      });
      await fetchUserData();
    } catch (e) {
      console.error(e);
      setError('Failed to create prescription. Check permissions and backend.');
    }
  };

  const runAiAndSave = async () => {
    try {
      setError('');
      const pid = selectedPatient?.patient_id;
      if (!pid) {
        setError('Select a patient first.');
        return;
      }
      const sel = [...aiSelected];
      if (!sel.length) {
        setError('Select symptoms first.');
        return;
      }
      const symptomsText = sel.join(', ');
      await api.post(`/ai/predict?token=${token}`, {
        patient_id: pid,
        record_id: null,
        symptoms: symptomsText,
        vital_signs: latestVitals ? {
          temperature: latestVitals.temperature,
          heart_rate: latestVitals.heart_rate,
          blood_pressure: latestVitals.blood_pressure || null
        } : null,
        patient_location: aiGeo,
      });
      await fetchUserData();
      setActivePage('ai');
    } catch (e) {
      console.error(e);
      setError('Failed to run AI prediction on backend. Ensure you are doctor/nurse/admin.');
    }
  };

  if (loading) {
    return (
      <div className="hcApp">
        <div className="hcLoading">
          <div className="hcLoadingSpinner" />
          <div>Loading your dashboard…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hcApp">
      <nav className="hcSidebar">
        <div className="hcLogo">
          <div className="hcLogoIcon">CH</div>
          <div>
            <div className="hcLogoText">CHENGETO</div>
            <div className="hcLogoSub">HealthConnect</div>
          </div>
        </div>

        <div className="hcNavSection">{user?.user_type === 'patient' ? 'Patient' : 'Clinical'}</div>
        <button type="button" className={`hcNavItem ${activePage === 'dashboard' ? 'hcNavItemActive' : ''}`} onClick={() => setActivePage('dashboard')}>
          <span className="hcNavIcon">⊞</span>Dashboard
        </button>
        {user?.user_type !== 'patient' && (
          <button type="button" className={`hcNavItem ${activePage === 'patients' ? 'hcNavItemActive' : ''}`} onClick={() => setActivePage('patients')}>
            <span className="hcNavIcon">⌕</span>Patients
          </button>
        )}
        <button type="button" className={`hcNavItem ${activePage === 'records' ? 'hcNavItemActive' : ''}`} onClick={() => setActivePage('records')}>
          <span className="hcNavIcon">◧</span>Medical records
        </button>
        <button type="button" className={`hcNavItem ${activePage === 'prescriptions' ? 'hcNavItemActive' : ''}`} onClick={() => setActivePage('prescriptions')}>
          <span className="hcNavIcon">⊕</span>Prescriptions
        </button>
        <button type="button" className={`hcNavItem ${activePage === 'consent' ? 'hcNavItemActive' : ''}`} onClick={() => setActivePage('consent')}>
          <span className="hcNavIcon">◉</span>Consent manager
        </button>

        <div className="hcNavSection">AI & Audit</div>
        <button type="button" className={`hcNavItem ${activePage === 'ai' ? 'hcNavItemActive' : ''}`} onClick={() => setActivePage('ai')}>
          <span className="hcNavIcon">◈</span>AI diagnostics
        </button>
        <button type="button" className={`hcNavItem ${activePage === 'blockchain' ? 'hcNavItemActive' : ''}`} onClick={() => setActivePage('blockchain')}>
          <span className="hcNavIcon">⛓</span>Blockchain audit
        </button>

        {(user?.user_type === 'admin' || user?.user_type === 'doctor' || user?.user_type === 'nurse') && (
          <>
            <div className="hcNavSection">Admin</div>
            <button type="button" className={`hcNavItem ${activePage === 'emergency' ? 'hcNavItemActive' : ''}`} onClick={() => setActivePage('emergency')}>
              <span className="hcNavIcon">⚡</span>Emergency access
            </button>
          </>
        )}
      </nav>

      <div className="hcMain">
        <div className="hcTopbar">
          <span className="hcTopbarTitle">{pageTitles[activePage] || 'Dashboard'}</span>
          <div className="hcTopbarRight">
            <span className="hcBadgePill hcBadgeSuccess">System online</span>
            <span className="hcBadgePill hcBadgeInfo">Phase 1</span>
            <button type="button" className="hcBtn" onClick={fetchUserData}>Refresh</button>
            <button type="button" className="hcBtn" onClick={handleLogout}>Logout</button>
            <div className="hcAvatar" title={email || ''}>{avatarText}</div>
          </div>
        </div>

        <div className="hcContent">
          {error ? <div className="hcErrorBox">{error}</div> : null}

          {/* DASHBOARD */}
          {activePage === 'dashboard' && (
            <div>
              <div className="hcGrid4" style={{ marginBottom: 20 }}>
                <div className="hcCard">
                  <div className="hcCardTitle">Medical records</div>
                  <div className="hcCardValue">{statValue(medicalRecords.length)}</div>
                  <div className="hcCardSub">{facilitiesCount ? `${facilitiesCount} facilities` : '—'}</div>
                </div>
                <div className="hcCard">
                  <div className="hcCardTitle">Active consents</div>
                  <div className="hcCardValue">{statValue(activeConsents)}</div>
                  <div className="hcCardSub">{expiringSoonConsents ? `${expiringSoonConsents} expiring soon` : '—'}</div>
                </div>
                <div className="hcCard">
                  <div className="hcCardTitle">Prescriptions</div>
                  <div className="hcCardValue">{statValue(prescriptions.length)}</div>
                  <div className="hcCardSub">{pendingPrescriptions ? `${pendingPrescriptions} pending dispensing` : '—'}</div>
                </div>
                <div className="hcCard">
                  <div className="hcCardTitle">Blockchain blocks</div>
                  <div className="hcCardValue">{statValue(blockchainStatus?.total_blocks)}</div>
                  <div className="hcCardSub">
                    {blockchainStatus?.chain_valid ? 'Chain valid ✓' : blockchainStatus?.status ? 'Check chain' : '—'}
                  </div>
                </div>
              </div>

              <div className="hcGrid2">
                <div>
                  <div className="hcSectionHdr"><h2>Recent activity</h2></div>
                  <div className="hcCard" style={{ padding: '4px 20px' }}>
                    <div className="hcTimeline">
                      {recentActivity.length ? recentActivity.map(item => (
                        <div key={item.key} className="hcTlItem">
                          <div className={`hcTlDot ${item.dot === 'green' ? 'hcDotGreen' : item.dot === 'amber' ? 'hcDotAmber' : item.dot === 'red' ? 'hcDotRed' : 'hcDotBlue'}`} />
                          <div style={{ flex: 1 }}>
                            <div className="hcTlTitle">{item.title}</div>
                            <div className="hcTlMeta">{item.meta}</div>
                          </div>
                        </div>
                      )) : (
                        <div className="hcTlItem">
                          <div className="hcTlDot hcDotBlue" />
                          <div style={{ flex: 1 }}>
                            <div className="hcTlTitle">No recent activity yet</div>
                            <div className="hcTlMeta">Create a record, consent, prescription, or AI prediction to see updates here.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="hcSectionHdr"><h2>Patient profile</h2></div>
                  <div className="hcCard">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <div className="hcAvatar" style={{ width: 48, height: 48, fontSize: 16 }}>
                        {patient?.first_name?.[0] || 'H'}{patient?.last_name?.[0] || 'C'}
                      </div>
                      <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>
                        {patient
                          ? `${patient.first_name} ${patient.last_name}`
                          : selectedPatient
                            ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                            : (email || 'User')}
                      </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          Patient ID: {(patient?.patient_id ?? selectedPatient?.patient_id) ?? '—'}
                        </div>
                      </div>
                    </div>

                    <div className="hcSep" style={{ margin: '0 0 12px' }} />

                    <div className="hcProfileGrid">
                      <span className="hcMuted">DOB</span><span>{patient?.date_of_birth || '—'}</span>
                      <span className="hcMuted">Blood type</span><span>{patient?.blood_type || '—'}</span>
                      <span className="hcMuted">Allergies</span><span>{patient?.allergies || '—'}</span>
                      <span className="hcMuted">Primary facility</span><span>{patient?.city ? `${patient.city}` : '—'}</span>
                      <span className="hcMuted">Last visit</span><span>—</span>
                    </div>

                    <div className="hcSep" />
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Emergency contact: —{/* placeholder */}
                    </div>
                  </div>

                  <div className="hcSectionHdr" style={{ marginTop: 16 }}><h2>Vital signs</h2></div>
                  <div className="hcCard">
                    <div className="hcVitalGrid">
                      <div className="hcVitalCard">
                        <div className="hcVitalLbl">Blood pressure</div>
                        <div className="hcVitalVal">
                          {latestVitals?.blood_pressure || latestVitals?.bp || '—'} <span className="hcVitalUnit">mmHg</span>
                        </div>
                      </div>
                      <div className="hcVitalCard">
                        <div className="hcVitalLbl">Temperature</div>
                        <div className="hcVitalVal">
                          {latestVitals?.temperature ?? '—'} <span className="hcVitalUnit">°C</span>
                        </div>
                      </div>
                      <div className="hcVitalCard">
                        <div className="hcVitalLbl">Heart rate</div>
                        <div className="hcVitalVal">
                          {latestVitals?.heart_rate ?? '—'} <span className="hcVitalUnit">bpm</span>
                        </div>
                      </div>
                      <div className="hcVitalCard">
                        <div className="hcVitalLbl">O₂ saturation</div>
                        <div className="hcVitalVal">
                          {latestVitals?.oxygen_saturation ?? latestVitals?.spo2 ?? '—'} <span className="hcVitalUnit">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PATIENT SEARCH */}
          {activePage === 'patients' && (
            <div>
              <div className="hcSectionHdr">
                <h2>Patients</h2>
                <button type="button" className="hcBtn hcBtnPrimary" onClick={searchPatients}>Search</button>
              </div>
              <div className="hcCard" style={{ marginBottom: 16 }}>
                <div className="hcFormGroup">
                  <label className="hcLabel">Search</label>
                  <input className="hcInput" value={patientSearchQ} onChange={(e) => setPatientSearchQ(e.target.value)} placeholder="Name, national ID, or phone" />
                </div>
                <div className="hcSep" />
                {selectedPatient && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Selected: <strong style={{ color: 'var(--color-text-primary)' }}>{selectedPatient.first_name} {selectedPatient.last_name}</strong> (ID {selectedPatient.patient_id})
                  </div>
                )}
              </div>
              <div className="hcTableWrap">
                <table className="hcTable">
                  <thead>
                    <tr>
                      <th className="hcTh">Patient</th>
                      <th className="hcTh">DOB</th>
                      <th className="hcTh">City</th>
                      <th className="hcTh">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientSearchResults.length ? patientSearchResults.map(p => (
                      <tr key={p.patient_id} className="hcTr">
                        <td className="hcTd">{p.first_name} {p.last_name}</td>
                        <td className="hcTd">{p.date_of_birth}</td>
                        <td className="hcTd">{p.city || '—'}</td>
                        <td className="hcTd">
                          <button type="button" className="hcBtn hcBtnPrimary" onClick={() => selectPatientById(p.patient_id)}>Open</button>
                        </td>
                      </tr>
                    )) : (
                      <tr className="hcTr"><td className="hcTd" colSpan={4}>Search for a patient to begin.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RECORDS */}
          {activePage === 'records' && (
            <div>
              <div className="hcSectionHdr">
                <h2>Medical records</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(user?.user_type === 'doctor' || user?.user_type === 'nurse' || user?.user_type === 'admin') && (
                    <button type="button" className="hcBtn hcBtnPrimary" onClick={createMedicalRecord} disabled={!selectedPatient}>
                      + Add note/diagnosis
                    </button>
                  )}
                  <button type="button" className="hcBtn" onClick={() => setActivePage('dashboard')}>Back</button>
                </div>
              </div>
              
              {(user?.user_type === 'doctor' || user?.user_type === 'nurse' || user?.user_type === 'admin') && (
                <div className="hcCard" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>New clinical note</div>
                  <div className="hcGrid2">
                    <div className="hcFormGroup">
                      <label className="hcLabel">Visit date</label>
                      <input className="hcInput" type="text" value={newRecord.visit_date} onChange={(e) => setNewRecord(r => ({ ...r, visit_date: e.target.value }))} placeholder="YYYY-MM-DD" />
                    </div>
                    <div className="hcFormGroup">
                      <label className="hcLabel">Facility ID (optional)</label>
                      <input className="hcInput" type="text" value={newRecord.facility_id} onChange={(e) => setNewRecord(r => ({ ...r, facility_id: e.target.value }))} placeholder="e.g. 1" />
                    </div>
                  </div>
                  <div className="hcSep" />
                  <div className="hcFormGroup" style={{ marginBottom: 12 }}>
                    <label className="hcLabel">Diagnosis</label>
                    <input className="hcInput" value={newRecord.diagnosis} onChange={(e) => setNewRecord(r => ({ ...r, diagnosis: e.target.value }))} />
                  </div>
                  <div className="hcFormGroup" style={{ marginBottom: 12 }}>
                    <label className="hcLabel">Symptoms</label>
                    <textarea className="hcTextarea" rows={2} value={newRecord.symptoms} onChange={(e) => setNewRecord(r => ({ ...r, symptoms: e.target.value }))} />
                  </div>
                  <div className="hcFormGroup" style={{ marginBottom: 12 }}>
                    <label className="hcLabel">Treatment plan</label>
                    <textarea className="hcTextarea" rows={2} value={newRecord.treatment_plan} onChange={(e) => setNewRecord(r => ({ ...r, treatment_plan: e.target.value }))} />
                  </div>
                  <div className="hcFormGroup">
                    <label className="hcLabel">Notes</label>
                    <textarea className="hcTextarea" rows={3} value={newRecord.notes} onChange={(e) => setNewRecord(r => ({ ...r, notes: e.target.value }))} />
                  </div>
                  {!selectedPatient && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-secondary)' }}>Select a patient first (Patients tab).</div>}
                </div>
              )}

              <div className="hcTableWrap">
                <table className="hcTable">
                  <thead>
                    <tr>
                      <th className="hcTh">Date</th>
                      <th className="hcTh">Type</th>
                      <th className="hcTh">Facility</th>
                      <th className="hcTh">Provider</th>
                      <th className="hcTh">Summary</th>
                      <th className="hcTh">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicalRecords.length ? medicalRecords.map((r, idx) => (
                      <tr className="hcTr" key={r.record_id || r.medical_record_id || idx}>
                        <td className="hcTd">{r.record_date || r.created_at || '—'}</td>
                        <td className="hcTd">{r.record_type || '—'}</td>
                        <td className="hcTd">{r.facility_name || r.facility_id || '—'}</td>
                        <td className="hcTd">{r.provider_name || r.provider_id || '—'}</td>
                        <td className="hcTd">{r.description || r.summary || '—'}</td>
                        <td className="hcTd"><span className="hcBadgePill hcBadgeSuccess">Verified</span></td>
                      </tr>
                    )) : (
                      <tr className="hcTr"><td className="hcTd" colSpan={6}>No medical records found for this patient.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRESCRIPTIONS */}
          {activePage === 'prescriptions' && (
            <div>
              <div className="hcSectionHdr">
                <h2>Prescriptions</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(user?.user_type === 'doctor' || user?.user_type === 'nurse' || user?.user_type === 'admin') && (
                    <button type="button" className="hcBtn hcBtnPrimary" onClick={createPrescription} disabled={!selectedPatient}>
                      + New prescription
                    </button>
                  )}
                  <button type="button" className="hcBtn" onClick={fetchUserData}>Refresh</button>
                </div>
              </div>
              
              {(user?.user_type === 'doctor' || user?.user_type === 'nurse' || user?.user_type === 'admin') && (
                <div className="hcCard" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>New prescription</div>
                  <div className="hcGrid2">
                    <div className="hcFormGroup">
                      <label className="hcLabel">Medication name</label>
                      <input className="hcInput" value={newPrescription.medication_name} onChange={(e) => setNewPrescription(p => ({ ...p, medication_name: e.target.value }))} />
                    </div>
                    <div className="hcFormGroup">
                      <label className="hcLabel">Dosage</label>
                      <input className="hcInput" value={newPrescription.dosage} onChange={(e) => setNewPrescription(p => ({ ...p, dosage: e.target.value }))} placeholder="e.g. 1 tablet" />
                    </div>
                    <div className="hcFormGroup">
                      <label className="hcLabel">Frequency</label>
                      <input className="hcInput" value={newPrescription.frequency} onChange={(e) => setNewPrescription(p => ({ ...p, frequency: e.target.value }))} placeholder="e.g. twice daily" />
                    </div>
                    <div className="hcFormGroup">
                      <label className="hcLabel">Duration</label>
                      <input className="hcInput" value={newPrescription.duration} onChange={(e) => setNewPrescription(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 7 days" />
                    </div>
                  </div>
                  <div className="hcFormGroup" style={{ marginTop: 12 }}>
                    <label className="hcLabel">Instructions (optional)</label>
                    <textarea className="hcTextarea" rows={2} value={newPrescription.instructions} onChange={(e) => setNewPrescription(p => ({ ...p, instructions: e.target.value }))} />
                  </div>
                  {!selectedPatient && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-secondary)' }}>Select a patient first (Patients tab).</div>}
                </div>
              )}
              {prescriptions.length ? prescriptions.map(rx => (
                <div className="hcRxCard" key={rx.prescription_id}>
                  <div className="hcRxHdr">
                    <div>
                      <div className="hcRxDrug">{rx.medication_name}</div>
                      <div className="hcRxDetail">{rx.dosage} · {rx.frequency} · {rx.duration}</div>
                      <div className="hcRxDetail">Issued: Provider {rx.provider_id} · {new Date(rx.prescription_date).toLocaleDateString()}</div>
                    </div>
                    <span className={`hcBadgePill ${rx.is_dispensed ? 'hcBadgeSuccess' : 'hcBadgeWarn'}`}>{rx.is_dispensed ? 'Dispensed' : 'Pending'}</span>
                  </div>
                  <div className="hcRxFooter">
                    <span className="hcHash">{rx.blockchain_token ? String(rx.blockchain_token).slice(0, 18) : '—'}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="hcBtn" onClick={() => setActivePage('blockchain')}>View token</button>
                      {!rx.is_dispensed && (
                        <button type="button" className="hcBtn hcBtnPrimary" onClick={() => markDispensed(rx.prescription_id)}>Mark dispensed</button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="hcCard">No prescriptions found.</div>
              )}
            </div>
          )}

          {/* CONSENT */}
          {activePage === 'consent' && (
            <div>
              <div className="hcSectionHdr">
                <h2>Consent manager</h2>
                <button type="button" className="hcBtn" onClick={() => setActivePage('dashboard')}>Back</button>
              </div>
              <div className="hcCard" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
                  You control who can access your health data. Consents are recorded and can be verified.
                </div>
                {consents.length ? consents.map(c => (
                  <div className="hcConsentRow" key={c.consent_id}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Provider {c.provider_id}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {c.consent_type || 'Access'} · {c.valid_until ? `Expires ${c.valid_until}` : 'Permanent'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`hcToggle ${c.consent_given ? 'hcToggleOn' : 'hcToggleOff'}`}
                      onClick={() => toggleConsent(c)}
                      title={c.consent_given ? 'Revoke consent' : 'Granting requires a consent form'}
                    />
                  </div>
                )) : (
                  <div className="hcConsentRow" style={{ borderBottom: 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>No consent records</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Create consent entries via your consent endpoint.</div>
                    </div>
                    <button type="button" className="hcToggle hcToggleOff" disabled />
                  </div>
                )}
              </div>
              <button type="button" className="hcBtn hcBtnPrimary" disabled title="Add a Grant Consent form next">
                Grant new consent
              </button>
            </div>
          )}

          {/* AI */}
          {activePage === 'ai' && (
            <div>
              <div className="hcSectionHdr"><h2>AI diagnostic support</h2></div>
              <div className="hcGrid2">
                <div>
                  <div className="hcCard">
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Select presenting symptoms</div>
                    <div className="hcAiSymptomGrid">
                      {symptoms.map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`hcChip ${aiSelected.has(s) ? 'hcChipSel' : ''}`}
                          onClick={() => toggleSymptom(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="hcSep" />
                    <div className="hcFormGroup" style={{ marginBottom: 12 }}>
                      <label className="hcLabel">Geographic region</label>
                      <select className="hcSelect" value={aiGeo} onChange={(e) => setAiGeo(e.target.value)}>
                        <option>Harare (urban)</option>
                        <option>Mashonaland Central (rural)</option>
                        <option>Manicaland (rural)</option>
                        <option>Matabeleland South</option>
                      </select>
                    </div>
                    <button type="button" className="hcBtn hcBtnPrimary" style={{ width: '100%' }} onClick={runAiLocal}>
                      Run diagnostic analysis
                    </button>
                    {(user?.user_type === 'doctor' || user?.user_type === 'nurse' || user?.user_type === 'admin') && (
                      <button type="button" className="hcBtn" style={{ width: '100%', marginTop: 10 }} onClick={runAiAndSave} disabled={!selectedPatient}>
                        Save to patient record (AI)
                      </button>
                    )}
                    {!selectedPatient && user?.user_type !== 'patient' && (
                      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        Select a patient first (Patients tab) to save AI results.
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="hcCard">
                    {aiResultHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: aiResultHtml }} />
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '40px 0' }}>
                        Select symptoms and run analysis to see results
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BLOCKCHAIN */}
          {activePage === 'blockchain' && (
            <div>
              <div className="hcSectionHdr">
                <h2>Blockchain audit trail</h2>
                <span className={`hcBadgePill ${blockchainStatus?.chain_valid ? 'hcBadgeSuccess' : 'hcBadgeWarn'}`}>{blockchainStatus?.chain_valid ? 'Chain valid' : 'Check chain'}</span>
              </div>

              <div className="hcCard" style={{ marginBottom: 16 }}>
                <div className="hcGrid3" style={{ textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Total blocks</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{statValue(blockchainStatus?.total_blocks)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Hash algorithm</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>SHA-256</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Chain integrity</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-success)' }}>
                      {blockchainStatus?.chain_valid ? '100%' : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {blockchainBlocks?.length ? blockchainBlocks.slice(-3).reverse().map(b => (
                <div key={b.block_index} className="hcCard" style={{ marginBottom: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Block #{b.block_index}</span>
                    <span className="hcVerified">✓ Verified</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', color: 'var(--color-text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Event</span>
                    <span>{b.block_type} · record {b.record_id}</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Timestamp</span>
                    <span>{b.timestamp}</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Block hash</span>
                    <span><span className="hcHash">{String(b.block_hash).slice(0, 32)}</span></span>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Prev hash</span>
                    <span><span className="hcHash">{String(b.previous_hash).slice(0, 32)}</span></span>
                  </div>
                </div>
              )) : (
                <div className="hcCard">No blockchain blocks found yet.</div>
              )}
            </div>
          )}

          {/* EMERGENCY */}
          {activePage === 'emergency' && (
            <div>
              <div className="hcSectionHdr"><h2>Emergency access protocol</h2></div>
              <div className="hcCard" style={{ borderColor: 'rgba(239, 68, 68, 0.35)', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-danger)', fontWeight: 700, marginBottom: 8 }}>
                  ⚡ Emergency access bypasses normal consent — all access is logged immutably
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Use only when the patient is unconscious or unable to provide consent. This endpoint requires doctor/nurse/admin.
                </div>
              </div>

              <div className="hcCard">
                <div className="hcFormGroup" style={{ marginBottom: 12 }}>
                  <label className="hcLabel">Requesting facility</label>
                  <select className="hcSelect" value={emergencyFacility} onChange={(e) => setEmergencyFacility(e.target.value)}>
                    <option>Chitungwiza Central Hospital</option>
                    <option>Harare Central Hospital</option>
                    <option>Parirenyatwa Group</option>
                    <option>Sally Mugabe Children's Hospital</option>
                  </select>
                </div>
                <div className="hcFormGroup" style={{ marginBottom: 12 }}>
                  <label className="hcLabel">Requesting clinician ID</label>
                  <input className="hcInput" type="text" placeholder="e.g. DOC-0091" value={emergencyClinicianId} onChange={(e) => setEmergencyClinicianId(e.target.value)} />
                </div>
                <div className="hcFormGroup" style={{ marginBottom: 12 }}>
                  <label className="hcLabel">Clinical justification</label>
                  <textarea className="hcTextarea" rows={3} placeholder="State the emergency and reason for data access..." value={emergencyReason} onChange={(e) => setEmergencyReason(e.target.value)} />
                </div>
                <div className="hcFormGroup" style={{ marginBottom: 16 }}>
                  <label className="hcLabel">Access window</label>
                  <select className="hcSelect" value={emergencyWindow} onChange={(e) => setEmergencyWindow(e.target.value)}>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>2 hours (maximum)</option>
                  </select>
                </div>
                <button type="button" className="hcBtn" style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', borderColor: 'rgba(239, 68, 68, 0.35)', width: '100%' }} onClick={requestEmergencyAccess}>
                  Request emergency access
                </button>
              </div>

              <div className="hcSectionHdr" style={{ marginTop: 20 }}><h2>Emergency access log</h2></div>
              <div className="hcTableWrap">
                <table className="hcTable">
                  <thead>
                    <tr>
                      <th className="hcTh">Date/time</th>
                      <th className="hcTh">Facility</th>
                      <th className="hcTh">Clinician</th>
                      <th className="hcTh">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencyLogs.length ? emergencyLogs.map((l) => (
                      <tr className="hcTr" key={l.log_id}>
                        <td className="hcTd">{new Date(l.access_time || l.created_at || Date.now()).toLocaleString()}</td>
                        <td className="hcTd">{l.facility_id || '—'}</td>
                        <td className="hcTd">{l.provider_id || '—'}</td>
                        <td className="hcTd"><span className="hcBadgePill hcBadgeInfo">Closed</span></td>
                      </tr>
                    )) : (
                      <tr className="hcTr"><td className="hcTd" colSpan={4}>No emergency access logs found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;