import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API = 'http://localhost:8000';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Appointment form
  const [apptForm, setApptForm] = useState({
    appointment_date: '',
    appointment_time: '',
    reason: '',
    facility_id: '',
    provider_id: ''
  });
  const [booking, setBooking] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);

  // AI symptom checker
  const [symptoms, setSymptoms] = useState('');
  const [location, setLocation] = useState('Harare');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, fac, prov] = await Promise.all([
        axios.get(`${API}/dashboard/`, config),
        axios.get(`${API}/facilities/`, config).catch(() => ({ data: [] })),
        axios.get(`${API}/providers/`, config).catch(() => ({ data: [] })),
      ]);
      setData(dash.data);
      setFacilities(fac.data);
      setProviders(prov.data);
    } catch (err) {
      console.error('Dashboard error:', err.response?.data);
      setError('Failed to load your health data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBooking(true);
    try {
      await axios.post(`${API}/appointments/`, {
        patient_id: data.profile.patient_id,
        appointment_date: apptForm.appointment_date,
        appointment_time: apptForm.appointment_time,
        reason: apptForm.reason,
        facility_id: apptForm.facility_id || null,
        provider_id: apptForm.provider_id || null,
      }, config);
      alert('✅ Appointment booked!');
      setApptForm({ appointment_date: '', appointment_time: '', reason: '', facility_id: '', provider_id: '' });
      setShowBookForm(false);
      fetchAll();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.detail || 'Failed to book appointment'));
    } finally {
      setBooking(false); }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await axios.delete(`${API}/appointments/${id}`, config);
      fetchAll();
    } catch { alert('❌ Failed to cancel'); }
  };

  const handleSymptomCheck = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) { alert('Please describe your symptoms'); return; }
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/ai/symptom-check`, {
        symptoms,
        patient_location: location
      }, config);
      setAiResult(res.data);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.detail || 'Error checking symptoms'));
    } finally { setAiLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  // ── Loading ──
  if (loading) return (
    <div className="pd-loading">
      <div className="pd-spinner" />
      <p>Loading your health data...</p>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="pd-error">
      <p>{error}</p>
      <button onClick={fetchAll}>Retry</button>
    </div>
  );

  if (!data) return null;

  const { profile, medical_records, prescriptions, appointments, ai_predictions } = data;
  const upcoming = appointments.filter(a => a.status !== 'Cancelled' && a.status !== 'cancelled');
  const urgencyColors = { low: '#16a34a', moderate: '#ca8a04', high: '#ea580c', emergency: '#dc2626' };

  const tabs = [
    { id: 'overview',       label: ' Overview' },
    { id: 'profile',        label: ' Profile' },
    { id: 'records',        label: ' Records',       count: medical_records.length },
    { id: 'prescriptions',  label: ' Prescriptions', count: prescriptions.length },
    { id: 'appointments',   label: ' Appointments',  count: upcoming.length },
    { id: 'ai',             label: ' AI Check' },
  ];

  return (
    <div className="pd-root">

      {/* ── HEADER ── */}
      <header className="pd-header">
        <div className="pd-header-left">
          <div className="pd-logo">+</div>
          <div>
            <div className="pd-brand">CHENGETO</div>
            <div className="pd-brand-sub">HealthConnect</div>
          </div>
        </div>
        <div className="pd-header-right">
          <div className="pd-welcome">
            <span className="pd-welcome-name">{profile.first_name} {profile.last_name}</span>
            <span className="pd-welcome-sub">Patient Portal</span>
          </div>
          <button className="pd-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* ── TABS ── */}
      <div className="pd-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`pd-tab ${activeTab === t.id ? 'pd-tab-active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.count > 0 && <span className="pd-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <main className="pd-content">

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'overview' && (
          <div>
            <div className="pd-stats">
              <div className="pd-stat pd-stat-blue">
                <div className="pd-stat-icon"></div>
                <div><div className="pd-stat-val">{medical_records.length}</div><div className="pd-stat-lbl">Records</div></div>
              </div>
              <div className="pd-stat pd-stat-green">
                <div className="pd-stat-icon"></div>
                <div><div className="pd-stat-val">{prescriptions.length}</div><div className="pd-stat-lbl">Prescriptions</div></div>
              </div>
              <div className="pd-stat pd-stat-teal">
                <div className="pd-stat-icon"></div>
                <div><div className="pd-stat-val">{upcoming.length}</div><div className="pd-stat-lbl">Appointments</div></div>
              </div>
              <div className="pd-stat pd-stat-dark">
                <div className="pd-stat-icon"></div>
                <div><div className="pd-stat-val">{ai_predictions.length}</div><div className="pd-stat-lbl">AI Checks</div></div>
              </div>
            </div>

            <div className="pd-quick">
              <button className="pd-quick-btn pd-quick-blue" onClick={() => { setActiveTab('appointments'); setShowBookForm(true); }}>Book Appointment</button>
              <button className="pd-quick-btn pd-quick-green" onClick={() => setActiveTab('ai')}>Check Symptoms</button>
              <button className="pd-quick-btn pd-quick-teal" onClick={() => setActiveTab('records')}>View Records</button>
              <button className="pd-quick-btn pd-quick-dark" onClick={() => setActiveTab('prescriptions')}> My Prescriptions</button>
            </div>

            {medical_records[0] && (
              <div className="pd-recent">
                <h3>Latest Medical Record</h3>
                <div className="pd-card pd-card-blue">
                  <div className="pd-card-header">
                    <strong>{medical_records[0].diagnosis || 'Visit'}</strong>
                    <span className="pd-date-badge">{medical_records[0].visit_date}</span>
                  </div>
                  {medical_records[0].symptoms && <p><b>Symptoms:</b> {medical_records[0].symptoms}</p>}
                  {medical_records[0].treatment_plan && <p><b>Treatment:</b> {medical_records[0].treatment_plan}</p>}
                </div>
              </div>
            )}

            {upcoming[0] && (
              <div className="pd-recent">
                <h3>Next Appointment</h3>
                <div className="pd-card pd-card-green">
                  <div className="pd-card-header">
                    <strong>{upcoming[0].appointment_date} at {upcoming[0].appointment_time}</strong>
                    <span className="pd-badge-green">{upcoming[0].status}</span>
                  </div>
                  <p><b>Reason:</b> {upcoming[0].reason}</p>
                </div>
              </div>
            )}

            {prescriptions.filter(rx => !rx.is_dispensed)[0] && (
              <div className="pd-recent">
                <h3>Pending Prescription</h3>
                <div className="pd-card pd-card-green">
                  <div className="pd-card-header">
                    <strong>{prescriptions.filter(rx => !rx.is_dispensed)[0].medication_name}</strong>
                    <span className="pd-badge-yellow">Pending</span>
                  </div>
                  <p><b>Dosage:</b> {prescriptions.filter(rx => !rx.is_dispensed)[0].dosage} · {prescriptions.filter(rx => !rx.is_dispensed)[0].frequency}</p>
                  <div className="pd-pending-note"> Show this at a verified pharmacy to collect your medication.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ PROFILE ══ */}
        {activeTab === 'profile' && (
          <div className="pd-section">
            <h2> My Profile</h2>
            <div className="pd-profile-card">
              <div className="pd-profile-avatar">{profile.first_name?.[0]}{profile.last_name?.[0]}</div>
              <div className="pd-profile-name">{profile.first_name} {profile.last_name}</div>
              <div className="pd-profile-sub">Patient ID: #{profile.patient_id}</div>
            </div>
            <div className="pd-info-grid">
              {[
                ['Date of Birth', profile.date_of_birth],
                ['Gender', profile.gender],
                ['Blood Type', profile.blood_type],
                ['Phone', profile.phone_number],
                ['City', profile.city],
                ['National ID', profile.national_id],
                ['Allergies', profile.allergies || 'None'],
                ['Chronic Conditions', profile.chronic_conditions || 'None'],
                ['Emergency Contact', profile.emergency_contact_name],
                ['Emergency Phone', profile.emergency_contact_phone],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="pd-info-item">
                  <span className="pd-info-key">{k}</span>
                  <span className="pd-info-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ MEDICAL RECORDS ══ */}
        {activeTab === 'records' && (
          <div className="pd-section">
            <h2>Medical Records</h2>
            {medical_records.length === 0 ? (
              <div className="pd-empty">
                <div className="pd-empty-icon"></div>
                <p>No medical records yet.</p>
                <small>Records appear here after a doctor's visit.</small>
              </div>
            ) : medical_records.map(r => (
              <div key={r.record_id} className="pd-card pd-card-blue">
                <div className="pd-card-header">
                  <strong>{r.diagnosis || 'Visit Record'}</strong>
                  <span className="pd-date-badge">{r.visit_date}</span>
                </div>
                {r.symptoms && <div className="pd-field"><span>Symptoms</span><p>{r.symptoms}</p></div>}
                {r.treatment_plan && <div className="pd-field"><span>Treatment Plan</span><p>{r.treatment_plan}</p></div>}
                {r.notes && <div className="pd-field"><span>Notes</span><p>{r.notes}</p></div>}
                {r.vital_signs && r.vital_signs.length > 0 && (
                  <div className="pd-vitals-section">
                    <div className="pd-vitals-title">🩺 Vitals at Visit</div>
                    <div className="pd-vitals-grid">
                      {r.vital_signs[0].temperature && <div className="pd-vital-chip"><span>Temp</span><strong>{r.vital_signs[0].temperature}°C</strong></div>}
                      {r.vital_signs[0].blood_pressure_systolic && <div className="pd-vital-chip"><span> BP</span><strong>{r.vital_signs[0].blood_pressure_systolic}/{r.vital_signs[0].blood_pressure_diastolic}</strong></div>}
                      {r.vital_signs[0].heart_rate && <div className="pd-vital-chip"><span>HR</span><strong>{r.vital_signs[0].heart_rate} bpm</strong></div>}
                      {r.vital_signs[0].weight && <div className="pd-vital-chip"><span></span><strong>{r.vital_signs[0].weight} kg</strong></div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ PRESCRIPTIONS ══ */}
        {activeTab === 'prescriptions' && (
          <div className="pd-section">
            <h2> My Prescriptions</h2>
            {prescriptions.length === 0 ? (
              <div className="pd-empty">
                <div className="pd-empty-icon"></div>
                <p>No prescriptions yet.</p>
              </div>
            ) : prescriptions.map(rx => (
              <div key={rx.prescription_id} className="pd-card pd-card-green">
                <div className="pd-card-header">
                  <strong> {rx.medication_name}</strong>
                  <span className={rx.is_dispensed ? 'pd-badge-green' : 'pd-badge-yellow'}>
                    {rx.is_dispensed ? '✔ Dispensed' : ' Pending'}
                  </span>
                </div>
                <div className="pd-rx-chips">
                  <div className="pd-rx-chip"><span>Dosage</span><strong>{rx.dosage}</strong></div>
                  <div className="pd-rx-chip"><span>Frequency</span><strong>{rx.frequency}</strong></div>
                  <div className="pd-rx-chip"><span>Duration</span><strong>{rx.duration || '—'}</strong></div>
                </div>
                {rx.instructions && <div className="pd-field"><span>Instructions</span><p>{rx.instructions}</p></div>}
                {rx.blockchain_token && (
                  <div className="pd-token">🔐 ePrescription: {rx.blockchain_token}</div>
                )}
                {!rx.is_dispensed && (
                  <div className="pd-pending-note"> Show this prescription at a verified pharmacy to collect your medication.</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ APPOINTMENTS ══ */}
        {activeTab === 'appointments' && (
          <div className="pd-section">
            <div className="pd-section-header">
              <h2>Appointments</h2>
              <button className="pd-btn-primary" onClick={() => setShowBookForm(f => !f)}>
                {showBookForm ? '✕ Close' : '+ Book New'}
              </button>
            </div>

            {showBookForm && (
              <form onSubmit={handleBookAppointment} className="pd-form-card">
                <h3>Book an Appointment</h3>
                <div className="pd-form-grid">
                  <div className="pd-form-group">
                    <label>Date *</label>
                    <input type="date" value={apptForm.appointment_date} onChange={e => setApptForm(f => ({ ...f, appointment_date: e.target.value }))} required min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="pd-form-group">
                    <label>Time *</label>
                    <input type="time" value={apptForm.appointment_time} onChange={e => setApptForm(f => ({ ...f, appointment_time: e.target.value }))} required />
                  </div>
                  <div className="pd-form-group">
                    <label>Facility</label>
                    <select value={apptForm.facility_id} onChange={e => setApptForm(f => ({ ...f, facility_id: e.target.value }))}>
                      <option value="">Any Facility</option>
                      {facilities.map(f => <option key={f.facility_id} value={f.facility_id}>{f.facility_name} — {f.city}</option>)}
                    </select>
                  </div>
                  <div className="pd-form-group">
                    <label>Doctor</label>
                    <select value={apptForm.provider_id} onChange={e => setApptForm(f => ({ ...f, provider_id: e.target.value }))}>
                      <option value="">Any Doctor</option>
                      {providers.map(p => <option key={p.provider_id} value={p.provider_id}>Dr. {p.first_name} {p.last_name} — {p.specialization || p.provider_type}</option>)}
                    </select>
                  </div>
                  <div className="pd-form-group full">
                    <label>Reason *</label>
                    <textarea value={apptForm.reason} onChange={e => setApptForm(f => ({ ...f, reason: e.target.value }))} rows={2} required placeholder="Describe why you want to visit..." />
                  </div>
                </div>
                <button type="submit" className="pd-btn-primary" disabled={booking}>
                  {booking ? ' Booking...' : ' Confirm Booking'}
                </button>
              </form>
            )}

            {appointments.length === 0 ? (
              <div className="pd-empty">
                <div className="pd-empty-icon"></div>
                <p>No appointments yet.</p>
              </div>
            ) : appointments.map(a => (
              <div key={a.appointment_id} className="pd-card">
                <div className="pd-card-header">
                  <strong> {a.appointment_date} at {a.appointment_time}</strong>
                  <span className={a.status === 'Cancelled' || a.status === 'cancelled' ? 'pd-badge-red' : 'pd-badge-green'}>{a.status}</span>
                </div>
                {a.facility_id && facilities.find(f => f.facility_id === a.facility_id) &&
                  <p className="pd-appt-detail"> {facilities.find(f => f.facility_id === a.facility_id).facility_name}</p>}
                {a.provider_id && providers.find(p => p.provider_id === a.provider_id) &&
                  <p className="pd-appt-detail"> Dr. {providers.find(p => p.provider_id === a.provider_id).first_name} {providers.find(p => p.provider_id === a.provider_id).last_name}</p>}
                <p><b>Reason:</b> {a.reason}</p>
                {a.status !== 'Cancelled' && a.status !== 'cancelled' && (
                  <button className="pd-cancel-btn" onClick={() => handleCancelAppointment(a.appointment_id)}>✕ Cancel</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ AI SYMPTOM CHECKER ══ */}
        {activeTab === 'ai' && (
          <div className="pd-section">
            <h2> AI Symptom Checker</h2>
            <div className="pd-disclaimer">
               This is general health guidance only — not a medical diagnosis. Always consult a qualified healthcare provider.
            </div>
            <form onSubmit={handleSymptomCheck} className="pd-form-card">
              <div className="pd-form-group full">
                <label>Describe your symptoms</label>
                <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={4} placeholder="e.g. I have a high fever, chills and headache for 2 days..." required />
              </div>
              <div className="pd-form-group full">
                <label>Your location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Harare, Kariba" />
              </div>
              <button type="submit" className="pd-btn-green" disabled={aiLoading}>
                {aiLoading ? ' Checking...' : ' Check My Symptoms'}
              </button>
            </form>

            {aiResult && (
              <div className="pd-ai-result">
                <h3>AI Assessment</h3>
                <div className="pd-urgency" style={{
                  background: `${urgencyColors[aiResult.urgency_level]}18`,
                  borderColor: urgencyColors[aiResult.urgency_level],
                  color: urgencyColors[aiResult.urgency_level]
                }}>
                  Urgency: <strong>{aiResult.urgency_level?.toUpperCase()}</strong>
                </div>
                <div className="pd-ai-section">
                  <h4>Possible Conditions</h4>
                  <ul>{(aiResult.possible_conditions || []).map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
                <div className="pd-ai-section">
                  <h4>Recommendation</h4>
                  <p>{aiResult.recommendation}</p>
                </div>
                <div className="pd-ai-disclaimer">{aiResult.disclaimer}</div>
              </div>
            )}

            {ai_predictions.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Previous AI Diagnoses</h3>
                {ai_predictions.map(p => (
                  <div key={p.prediction_id} className="pd-card pd-card-teal" style={{ marginTop: '10px' }}>
                    <div className="pd-card-header">
                      <strong>{p.predicted_condition}</strong>
                      <span className="pd-date-badge">{new Date(p.prediction_date).toLocaleDateString()}</span>
                    </div>
                    <p><b>Confidence:</b> {p.confidence_score}%</p>
                    <p><b>Symptoms:</b> {p.symptoms}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}