import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PatientDashboard.css";

const API = "http://localhost:8000";

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookForm, setShowBookForm] = useState(false);
  const [apptForm, setApptForm] = useState({
    appointment_date: "", appointment_time: "", reason: "", facility_id: "", provider_id: ""
  });
  const [booking, setBooking] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [providers, setProviders] = useState([]);
  const [symptoms, setSymptoms] = useState("");
  const [location, setLocation] = useState("Harare");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchDashboard();
    fetchFacilitiesAndProviders();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/dashboard/`, config);
      setData(res.data);
    } catch (err) {
      console.error("Dashboard error:", err.response?.data);
      setError("Failed to load your health data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilitiesAndProviders = async () => {
    try {
      const [fac, prov] = await Promise.all([
        axios.get(`${API}/facilities/`, config).catch(() => ({ data: [] })),
        axios.get(`${API}/providers/`, config).catch(() => ({ data: [] })),
      ]);
      setFacilities(fac.data);
      setProviders(prov.data);
    } catch (e) { console.error(e); }
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
      alert("✅ Appointment booked successfully!");
      setApptForm({ appointment_date: "", appointment_time: "", reason: "", facility_id: "", provider_id: "" });
      setShowBookForm(false);
      fetchDashboard();
    } catch (err) {
      alert("❌ " + (err.response?.data?.detail || "Failed to book appointment"));
    } finally {
      setBooking(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await axios.delete(`${API}/appointments/${id}`, config);
      fetchDashboard();
    } catch { alert("❌ Failed to cancel"); }
  };

  const handleSymptomCheck = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) { alert("Please describe your symptoms"); return; }
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/ai/symptom-check`, {
        symptoms,
        patient_location: location
      }, config);
      setAiResult(res.data);
    } catch (err) {
      alert("❌ " + (err.response?.data?.detail || "Error checking symptoms"));
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("✅ Token copied to clipboard!");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  if (loading) return (
    <div className="patient-loading">
      <div className="patient-spinner"></div>
      <p>Loading your health data...</p>
    </div>
  );

  if (error) return (
    <div className="patient-error">
      <p>{error}</p>
      <button onClick={fetchDashboard}>Retry</button>
    </div>
  );

  if (!data) return null;

  const { profile, medical_records, prescriptions, appointments, ai_predictions } = data;
  const upcoming = appointments.filter(a => a.status !== "Cancelled" && a.status !== "cancelled");

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "profile", label: "👤 My Profile" },
    { id: "records", label: "📋 Medical Records", count: medical_records.length },
    { id: "prescriptions", label: "💊 My Prescriptions", count: prescriptions.filter(rx => !rx.is_dispensed).length },
    { id: "appointments", label: "📅 Appointments", count: upcoming.length },
    { id: "ai", label: "🤖 Symptom Checker" },
  ];

  return (
    <div className="patient-root">
      <header className="patient-header">
        <div className="patient-header-left">
          <div className="patient-logo">🏥</div>
          <div>
            <div className="patient-brand">CHENGETO</div>
            <div className="patient-brand-sub">Patient Portal</div>
          </div>
        </div>
        <div className="patient-header-right">
          <div className="patient-welcome">
            <span className="patient-welcome-name">{profile.first_name} {profile.last_name}</span>
            <span className="patient-welcome-sub">Patient</span>
          </div>
          <button className="patient-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="patient-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`patient-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.count > 0 && <span className="patient-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      <main className="patient-content">
        {activeTab === "overview" && (
          <div>
            <div className="patient-stats">
              <div className="patient-stat"><div className="patient-stat-val">{medical_records.length}</div><div className="patient-stat-lbl">Records</div></div>
              <div className="patient-stat"><div className="patient-stat-val">{prescriptions.filter(rx => !rx.is_dispensed).length}</div><div className="patient-stat-lbl">Active Prescriptions</div></div>
              <div className="patient-stat"><div className="patient-stat-val">{upcoming.length}</div><div className="patient-stat-lbl">Upcoming Appointments</div></div>
            </div>

            <div className="patient-quick">
              <button className="patient-quick-btn" onClick={() => { setActiveTab("appointments"); setShowBookForm(true); }}>📅 Book Appointment</button>
              <button className="patient-quick-btn" onClick={() => setActiveTab("ai")}>🤖 Check Symptoms</button>
              <button className="patient-quick-btn" onClick={() => setActiveTab("records")}>📋 View Records</button>
            </div>

            {/* Show pending prescriptions with tokens */}
            {prescriptions.filter(rx => !rx.is_dispensed).length > 0 && (
              <div className="patient-recent">
                <h3>💊 Pending Prescriptions</h3>
                {prescriptions.filter(rx => !rx.is_dispensed).slice(0, 2).map(rx => (
                  <div key={rx.prescription_id} className="patient-card prescription-card">
                    <div className="patient-card-header">
                      <strong>💊 {rx.medication_name}</strong>
                      <span className="patient-badge-yellow">Pending</span>
                    </div>
                    <div className="patient-rx-details">
                      <div><span>Dosage</span><strong>{rx.dosage}</strong></div>
                      <div><span>Frequency</span><strong>{rx.frequency}</strong></div>
                    </div>
                    {/* ✅ SHOW THE TOKEN */}
                    <div className="patient-token-box">
                      <div className="patient-token-label">🔐 Prescription Token:</div>
                      <div className="patient-token-value">
                        <code>{rx.blockchain_token}</code>
                        <button 
                          className="patient-copy-btn" 
                          onClick={() => copyToClipboard(rx.blockchain_token)}
                          title="Copy token"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <p className="patient-token-note">
                        Show this token to the pharmacist to collect your medication.
                      </p>
                    </div>
                  </div>
                ))}
                {prescriptions.filter(rx => !rx.is_dispensed).length > 2 && (
                  <button className="patient-view-all" onClick={() => setActiveTab("prescriptions")}>
                    View all {prescriptions.filter(rx => !rx.is_dispensed).length} pending prescriptions →
                  </button>
                )}
              </div>
            )}

            {medical_records.length > 0 && (
              <div className="patient-recent">
                <h3>Latest Medical Record</h3>
                <div className="patient-card">
                  <div className="patient-card-header">
                    <strong>{medical_records[0].diagnosis || "Medical Visit"}</strong>
                    <span className="patient-date-badge">{medical_records[0].visit_date}</span>
                  </div>
                  {medical_records[0].symptoms && <p><b>Symptoms:</b> {medical_records[0].symptoms}</p>}
                  {medical_records[0].treatment_plan && <p><b>Treatment:</b> {medical_records[0].treatment_plan}</p>}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div className="patient-recent">
                <h3>Next Appointment</h3>
                <div className="patient-card">
                  <div className="patient-card-header">
                    <strong>{upcoming[0].appointment_date} at {upcoming[0].appointment_time}</strong>
                    <span className="patient-badge-green">{upcoming[0].status}</span>
                  </div>
                  <p><b>Reason:</b> {upcoming[0].reason}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div>
            <h2>👤 My Profile</h2>
            <div className="patient-profile-card">
              <div className="patient-profile-avatar">{profile.first_name?.[0]}{profile.last_name?.[0]}</div>
              <div className="patient-profile-name">{profile.first_name} {profile.last_name}</div>
              <div className="patient-profile-sub">Patient ID: #{profile.patient_id}</div>
            </div>
            <div className="patient-info-grid">
              {[["Date of Birth", profile.date_of_birth], ["Gender", profile.gender], ["Blood Type", profile.blood_type],
                ["Phone", profile.phone_number], ["City", profile.city], ["Allergies", profile.allergies || "None"],
                ["Chronic Conditions", profile.chronic_conditions || "None"], ["Emergency Contact", profile.emergency_contact_name],
                ["Emergency Phone", profile.emergency_contact_phone]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="patient-info-item"><span className="patient-info-key">{k}</span><span className="patient-info-val">{v}</span></div>
                ))}
            </div>
          </div>
        )}

        {activeTab === "records" && (
          <div>
            <h2>📋 Medical Records</h2>
            {medical_records.length === 0 ? (
              <div className="patient-empty"><p>No medical records yet.</p><small>Records appear here after a doctor's visit.</small></div>
            ) : medical_records.map(r => (
              <div key={r.record_id} className="patient-card">
                <div className="patient-card-header"><strong>{r.diagnosis || "Visit Record"}</strong><span className="patient-date-badge">{r.visit_date}</span></div>
                {r.symptoms && <p><b>Symptoms:</b> {r.symptoms}</p>}
                {r.treatment_plan && <p><b>Treatment:</b> {r.treatment_plan}</p>}
              </div>
            ))}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div>
            <h2>💊 My Prescriptions</h2>
            <div className="patient-disclaimer">
              ⚠️ Keep your prescription tokens safe. Show them at any verified pharmacy to collect your medication.
            </div>
            
            {prescriptions.length === 0 ? (
              <div className="patient-empty"><p>No prescriptions yet.</p></div>
            ) : (
              <>
                {/* Pending Prescriptions */}
                {prescriptions.filter(rx => !rx.is_dispensed).length > 0 && (
                  <>
                    <h3 style={{ marginTop: "16px", marginBottom: "12px", color: "#ca8a04" }}>⏳ Pending Prescriptions</h3>
                    {prescriptions.filter(rx => !rx.is_dispensed).map(rx => (
                      <div key={rx.prescription_id} className="patient-card prescription-card pending-card">
                        <div className="patient-card-header">
                          <strong>💊 {rx.medication_name}</strong>
                          <span className="patient-badge-yellow">Pending</span>
                        </div>
                        <div className="patient-rx-details">
                          <div><span>Dosage</span><strong>{rx.dosage}</strong></div>
                          <div><span>Frequency</span><strong>{rx.frequency}</strong></div>
                          <div><span>Prescribed Date</span><strong>{rx.prescription_date}</strong></div>
                        </div>
                        {rx.instructions && <p><b>Instructions:</b> {rx.instructions}</p>}
                        
                        {/* ✅ TOKEN DISPLAY - PROMINENT */}
                        <div className="patient-token-box highlight">
                          <div className="patient-token-label">🔐 Prescription Token (Required for Pharmacy)</div>
                          <div className="patient-token-value">
                            <code className="patient-token-code">{rx.blockchain_token}</code>
                            <button 
                              className="patient-copy-btn" 
                              onClick={() => copyToClipboard(rx.blockchain_token)}
                            >
                              📋 Copy Token
                            </button>
                          </div>
                          <div className="patient-token-instructions">
                            <strong>How to collect your medication:</strong>
                            <ol>
                              <li>Go to any verified pharmacy</li>
                              <li>Show or read this token to the pharmacist</li>
                              <li>Pharmacist will verify and dispense your medication</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Dispensed Prescriptions */}
                {prescriptions.filter(rx => rx.is_dispensed).length > 0 && (
                  <>
                    <h3 style={{ marginTop: "24px", marginBottom: "12px", color: "#16a34a" }}>✅ Dispensed Prescriptions</h3>
                    {prescriptions.filter(rx => rx.is_dispensed).map(rx => (
                      <div key={rx.prescription_id} className="patient-card prescription-card dispensed-card">
                        <div className="patient-card-header">
                          <strong>💊 {rx.medication_name}</strong>
                          <span className="patient-badge-green">✓ Dispensed</span>
                        </div>
                        <div className="patient-rx-details">
                          <div><span>Dosage</span><strong>{rx.dosage}</strong></div>
                          <div><span>Frequency</span><strong>{rx.frequency}</strong></div>
                          <div><span>Prescribed Date</span><strong>{rx.prescription_date}</strong></div>
                        </div>
                        {rx.instructions && <p><b>Instructions:</b> {rx.instructions}</p>}
                        {/* Show token but greyed out for dispensed prescriptions */}
                        <div className="patient-token-box dispensed">
                          <div className="patient-token-label">🔐 Prescription Token (Already Dispensed)</div>
                          <div className="patient-token-value">
                            <code className="patient-token-code">{rx.blockchain_token}</code>
                          </div>
                          <p className="patient-token-note">This prescription has already been collected.</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "appointments" && (
          <div>
            <div className="patient-section-header"><h2>📅 Appointments</h2><button className="patient-btn-primary" onClick={() => setShowBookForm(f => !f)}>{showBookForm ? "✕ Close" : "+ Book New"}</button></div>
            {showBookForm && (
              <form onSubmit={handleBookAppointment} className="patient-form-card">
                <h3>Book an Appointment</h3>
                <div className="patient-form-grid">
                  <div className="patient-form-group"><label>Date *</label><input type="date" value={apptForm.appointment_date} onChange={e => setApptForm(f => ({ ...f, appointment_date: e.target.value }))} required min={new Date().toISOString().split("T")[0]} /></div>
                  <div className="patient-form-group"><label>Time *</label><input type="time" value={apptForm.appointment_time} onChange={e => setApptForm(f => ({ ...f, appointment_time: e.target.value }))} required /></div>
                  <div className="patient-form-group"><label>Facility</label><select value={apptForm.facility_id} onChange={e => setApptForm(f => ({ ...f, facility_id: e.target.value }))}><option value="">Any Facility</option>{facilities.map(f => <option key={f.facility_id} value={f.facility_id}>{f.facility_name} — {f.city}</option>)}</select></div>
                  <div className="patient-form-group full"><label>Reason *</label><textarea value={apptForm.reason} onChange={e => setApptForm(f => ({ ...f, reason: e.target.value }))} rows={2} required placeholder="Describe why you want to visit..." /></div>
                </div>
                <button type="submit" className="patient-btn-primary" disabled={booking}>{booking ? "⏳ Booking..." : "✅ Confirm Booking"}</button>
              </form>
            )}
            {appointments.length === 0 ? <div className="patient-empty"><p>No appointments yet.</p></div> : appointments.map(a => (
              <div key={a.appointment_id} className="patient-card">
                <div className="patient-card-header"><strong>{a.appointment_date} at {a.appointment_time}</strong><span className={a.status === "Cancelled" ? "patient-badge-red" : "patient-badge-green"}>{a.status}</span></div>
                <p><b>Reason:</b> {a.reason}</p>
                {a.status !== "Cancelled" && a.status !== "cancelled" && <button className="patient-cancel-btn" onClick={() => handleCancelAppointment(a.appointment_id)}>✕ Cancel</button>}
              </div>
            ))}
          </div>
        )}

        {activeTab === "ai" && (
          <div>
            <h2>🤖 AI Symptom Checker</h2>
            <div className="patient-disclaimer">⚠️ This is general health guidance only — not a medical diagnosis. Always consult a qualified healthcare provider.</div>
            <form onSubmit={handleSymptomCheck} className="patient-form-card">
              <div className="patient-form-group full"><label>Describe your symptoms</label><textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={4} placeholder="e.g. I have a high fever, chills and headache for 2 days..." required /></div>
              <div className="patient-form-group full"><label>Your location</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Harare, Kariba" /></div>
              <button type="submit" className="patient-btn-green" disabled={aiLoading}>{aiLoading ? "⏳ Checking..." : "🔍 Check My Symptoms"}</button>
            </form>
            {aiResult && (
              <div className="patient-ai-result">
                <h3>AI Assessment</h3>
                <div className="patient-urgency"><strong>Urgency:</strong> {aiResult.urgency_level?.toUpperCase()}</div>
                <div className="patient-ai-section"><h4>Possible Conditions</h4><ul>{(aiResult.possible_conditions || []).map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                <div className="patient-ai-section"><h4>Recommendation</h4><p>{aiResult.recommendation}</p></div>
                <div className="patient-ai-disclaimer">{aiResult.disclaimer}</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}