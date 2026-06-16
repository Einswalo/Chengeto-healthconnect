import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NurseDashboard.css";

const API = "http://localhost:8000";

// ── Add Patient Modal ─────────────────────────────────────────────────────────
function AddPatientModal({ onClose, onSuccess, config }) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", date_of_birth: "", gender: "",
    phone_number: "", address: "", city: "", blood_type: "",
    allergies: "", chronic_conditions: "", national_id: "",
    emergency_contact_name: "", emergency_contact_phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.first_name || !form.last_name || !form.date_of_birth || !form.phone_number) {
      setError("First name, last name, date of birth and phone are required.");
      return;
    }
    setLoading(true);
    try {
      const email = `${form.first_name.toLowerCase().replace(/\s/g, "")}.${form.last_name.toLowerCase().replace(/\s/g, "")}@chengeto.com`;
      const password = form.phone_number;
      const res = await axios.post(`${API}/patients/register`, { ...form, email, password, user_type: "patient" }, config);
      onSuccess(res.data, email, password);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to register patient.");
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div><h2>Register New Patient</h2><p>Credentials auto-generated from name + phone</p></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="credentials-preview">
          <span>📧 {(form.first_name || "firstname").toLowerCase()}.{(form.last_name || "lastname").toLowerCase()}@chengeto.com</span>
          <span>🔑 {form.phone_number || "phone number"}</span>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group"><label>First Name <span className="req">*</span></label><input value={form.first_name} onChange={set("first_name")} required /></div>
            <div className="form-group"><label>Last Name <span className="req">*</span></label><input value={form.last_name} onChange={set("last_name")} required /></div>
            <div className="form-group"><label>Date of Birth <span className="req">*</span></label><input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} required /></div>
            <div className="form-group"><label>Gender</label>
              <select value={form.gender} onChange={set("gender")}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
            </div>
            <div className="form-group"><label>Phone <span className="req">*</span></label><input value={form.phone_number} onChange={set("phone_number")} required /></div>
            <div className="form-group"><label>National ID</label><input value={form.national_id} onChange={set("national_id")} /></div>
            <div className="form-group"><label>Address</label><input value={form.address} onChange={set("address")} /></div>
            <div className="form-group"><label>City</label><input value={form.city} onChange={set("city")} /></div>
            <div className="form-group"><label>Blood Type</label>
              <select value={form.blood_type} onChange={set("blood_type")}><option value="">Select</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            <div className="form-group"><label>Emergency Contact Name</label><input value={form.emergency_contact_name} onChange={set("emergency_contact_name")} placeholder="e.g. John Doe" /></div>
            <div className="form-group"><label>Emergency Contact Phone</label><input value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} placeholder="e.g. 0771234567" /></div>
            <div className="form-group full"><label>Allergies</label><textarea value={form.allergies} onChange={set("allergies")} rows={2} /></div>
            <div className="form-group full"><label>Chronic Conditions</label><textarea value={form.chronic_conditions} onChange={set("chronic_conditions")} rows={2} /></div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "⏳ Registering..." : "✅ Register Patient"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Success Modal ─────────────────────────────────────────────────────────────
function SuccessModal({ patient, email, password, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box success-modal" onClick={e => e.stopPropagation()}>
        <div className="success-icon">✅</div>
        <h2>Patient Registered!</h2>
        <p><strong>{patient.first_name} {patient.last_name}</strong> added to the system.</p>
        <div className="credentials-box">
          <h4>🔐 Login Credentials — Share with Patient</h4>
          <div className="cred-row"><span>Email:</span><code>{email}</code></div>
          <div className="cred-row"><span>Password:</span><code>{password}</code></div>
          <p className="cred-note">Patient can log in at the web portal or mobile app.</p>
        </div>
        <button className="btn-primary" onClick={onClose}>Continue →</button>
      </div>
    </div>
  );
}

// ── Patient View Modal (Read Only) ────────────────────────────────────────────
function PatientViewModal({ patient, onClose, config }) {
  const [records, setRecords] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    fetchPatientData();
  }, [patient.patient_id]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const [recordsRes, vitalsRes] = await Promise.all([
        axios.get(`${API}/medical-records/patient/${patient.patient_id}`, config),
        axios.get(`${API}/vital-signs/patient/${patient.patient_id}`, config),
      ]);
      setRecords(recordsRes.data);
      setVitals(vitalsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "700px" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{patient.first_name} {patient.last_name}</h2>
            <p>Patient ID: {patient.patient_id} | {patient.phone_number}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="view-tabs">
          <button className={`view-tab ${activeTab === "info" ? "active" : ""}`} onClick={() => setActiveTab("info")}>📋 Patient Info</button>
          <button className={`view-tab ${activeTab === "records" ? "active" : ""}`} onClick={() => setActiveTab("records")}>📋 Medical Records ({records.length})</button>
          <button className={`view-tab ${activeTab === "vitals" ? "active" : ""}`} onClick={() => setActiveTab("vitals")}>🩺 Vital Signs ({vitals.length})</button>
        </div>

        <div className="modal-form" style={{ maxHeight: "55vh", overflowY: "auto" }}>
          {loading && <div className="loading-state">Loading...</div>}
          
          {activeTab === "info" && !loading && (
            <div className="info-rows">
              {[["Date of Birth", patient.date_of_birth], ["Gender", patient.gender], ["Blood Type", patient.blood_type],
                ["City", patient.city], ["Phone", patient.phone_number], ["National ID", patient.national_id],
                ["Allergies", patient.allergies || "None"], ["Chronic Conditions", patient.chronic_conditions || "None"],
                ["Emergency Contact", patient.emergency_contact_name], ["Emergency Phone", patient.emergency_contact_phone]]
                .map(([k, v]) => v && <div key={k} className="info-row"><span>{k}:</span><strong>{v}</strong></div>)}
            </div>
          )}
          
          {activeTab === "records" && !loading && (
            records.length === 0 ? <p className="empty-text">No medical records yet.</p> :
              records.map(r => (
                <div key={r.record_id} className="record-card">
                  <div className="record-card-header"><strong>{r.diagnosis || "Medical Visit"}</strong><span className="record-date">{r.visit_date}</span></div>
                  {r.symptoms && <p><b>Symptoms:</b> {r.symptoms}</p>}
                  {r.treatment_plan && <p><b>Treatment:</b> {r.treatment_plan}</p>}
                  {r.notes && <p><b>Notes:</b> {r.notes}</p>}
                </div>
              ))
          )}
          
          {activeTab === "vitals" && !loading && (
            vitals.length === 0 ? <p className="empty-text">No vitals recorded yet.</p> :
              vitals.map(v => (
                <div key={v.vital_id} className="record-card">
                  <div className="record-card-header"><strong>🩺 Vital Signs</strong><span className="record-date">{new Date(v.recorded_at).toLocaleDateString()}</span></div>
                  <div className="vitals-grid">
                    {v.temperature && <div className="vital-chip"><span>Temp</span><strong>{v.temperature}°C</strong></div>}
                    {(v.blood_pressure_systolic && v.blood_pressure_diastolic) &&
                      <div className="vital-chip"><span>BP</span><strong>{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</strong></div>}
                    {v.heart_rate && <div className="vital-chip"><span>HR</span><strong>{v.heart_rate} bpm</strong></div>}
                    {v.respiratory_rate && <div className="vital-chip"><span>Resp</span><strong>{v.respiratory_rate}</strong></div>}
                    {v.weight && <div className="vital-chip"><span>Weight</span><strong>{v.weight} kg</strong></div>}
                    {v.height && <div className="vital-chip"><span>Height</span><strong>{v.height} cm</strong></div>}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Record Vitals Modal ───────────────────────────────────────────────────────
function RecordVitalsModal({ patient, onClose, onSuccess, config }) {
  const [form, setForm] = useState({
    temperature: "", blood_pressure_systolic: "", blood_pressure_diastolic: "",
    heart_rate: "", respiratory_rate: "", weight: "", height: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { patient_id: patient.patient_id };
      Object.keys(form).forEach(k => {
        if (form[k] && form[k] !== "") payload[k] = parseFloat(form[k]);
      });
      await axios.post(`${API}/vital-signs/`, payload, config);
      alert("✅ Vitals recorded successfully!");
      onSuccess();
    } catch (err) {
      alert("❌ " + (err.response?.data?.detail || "Failed to record vitals"));
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div><h2>Record Vitals for {patient.first_name} {patient.last_name}</h2></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group"><label>Temperature (°C)</label><input type="number" step="0.1" placeholder="37.5" value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} /></div>
            <div className="form-group"><label>BP Systolic</label><input type="number" placeholder="120" value={form.blood_pressure_systolic} onChange={e => setForm(f => ({ ...f, blood_pressure_systolic: e.target.value }))} /></div>
            <div className="form-group"><label>BP Diastolic</label><input type="number" placeholder="80" value={form.blood_pressure_diastolic} onChange={e => setForm(f => ({ ...f, blood_pressure_diastolic: e.target.value }))} /></div>
            <div className="form-group"><label>Heart Rate (bpm)</label><input type="number" placeholder="72" value={form.heart_rate} onChange={e => setForm(f => ({ ...f, heart_rate: e.target.value }))} /></div>
            <div className="form-group"><label>Respiratory Rate</label><input type="number" placeholder="16" value={form.respiratory_rate} onChange={e => setForm(f => ({ ...f, respiratory_rate: e.target.value }))} /></div>
            <div className="form-group"><label>Weight (kg)</label><input type="number" step="0.1" placeholder="70.0" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} /></div>
            <div className="form-group"><label>Height (cm)</label><input type="number" step="0.1" placeholder="175.0" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "⏳ Recording..." : "💾 Save Vitals"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main NurseDashboard Component ─────────────────────────────────────────────
export default function NurseDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [nurse, setNurse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ patients: 0, vitalsRecorded: 0 });

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchNurseProfile();
  }, []);

  const fetchNurseProfile = async () => {
    try {
      const provRes = await axios.get(`${API}/providers/me`, config);
      setNurse(provRes.data);
    } catch (e) {
      console.error("Failed to fetch nurse profile", e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await axios.get(`${API}/patients/search?q=${encodeURIComponent(searchQuery)}`, config);
      setSearchResults(res.data);
      setStats(s => ({ ...s, patients: res.data.length }));
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "patients", icon: "👥", label: "Patients" },
    { id: "vitals", icon: "🩺", label: "Record Vitals" },
  ];

  return (
    <div className={`nurse-dashboard ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {/* SIDEBAR */}
      <aside className="nurse-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">👩‍⚕️</div>
          {sidebarOpen && <span className="sidebar-title">CHENGETO NURSE</span>}
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "nav-active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          {nurse && sidebarOpen && (
            <div className="user-profile">
              <div className="user-avatar-small">👩‍⚕️</div>
              <div>
                <div className="user-name">Nurse {nurse.first_name} {nurse.last_name}</div>
                <div className="user-role">{nurse.provider_type || "Nurse"}</div>
              </div>
            </div>
          )}
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="nurse-main">
        <div className="topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div className="topbar-title">{navItems.find(n => n.id === activeSection)?.icon} {navItems.find(n => n.id === activeSection)?.label}</div>
          <div className="topbar-user">
            <div className="user-avatar">👩‍⚕️</div>
            <span>Nurse {nurse?.first_name || "Nurse"}</span>
          </div>
        </div>

        {/* DASHBOARD SECTION */}
        {activeSection === "dashboard" && (
          <div className="dashboard-content">
            <div className="welcome-section">
              <h1>Welcome, Nurse {nurse?.first_name || "Nurse"} 👋</h1>
              <p>Vital Signs Recording & Patient Management</p>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card" style={{ "--accent": "#0072ff" }}>
                <div className="stat-icon">👥</div>
                <div className="stat-body">
                  <div className="stat-value">{stats.patients}</div>
                  <div className="stat-label">Patients Found</div>
                </div>
              </div>
              <div className="stat-card" style={{ "--accent": "#16a34a" }}>
                <div className="stat-icon">🩺</div>
                <div className="stat-body">
                  <div className="stat-value">{stats.vitalsRecorded}</div>
                  <div className="stat-label">Vitals Recorded</div>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-btns">
                <button className="action-btn" onClick={() => { setActiveSection("patients"); setShowAddPatient(true); }}>➕ Register Patient</button>
                <button className="action-btn" onClick={() => setActiveSection("patients")}>🔍 Search Patient</button>
                <button className="action-btn" onClick={() => setActiveSection("vitals")}>🩺 Record Vitals</button>
              </div>
            </div>

            <div className="info-card">
              <h4>📋 Nurse Responsibilities</h4>
              <ul>
                <li>✓ Register new patients</li>
                <li>✓ Record patient vital signs (temperature, BP, heart rate, etc.)</li>
                <li>✓ View patient medical records (read-only)</li>
                <li>✓ View patient vitals history</li>
              </ul>
              <p className="warning-note">⚠️ Nurses cannot create medical records or write prescriptions</p>
            </div>
          </div>
        )}

        {/* PATIENTS SECTION */}
        {activeSection === "patients" && (
          <div className="patients-section">
            <div className="section-header">
              <h2>👥 Patients</h2>
              <button className="btn-primary" onClick={() => setShowAddPatient(true)}>➕ Register Patient</button>
            </div>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="🔍 Search by name, phone or national ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="search-input"
              />
              <button className="btn-primary" onClick={handleSearch}>Search</button>
              {hasSearched && (
                <button className="btn-secondary" onClick={() => { setSearchQuery(""); setSearchResults([]); setHasSearched(false); }}>
                  Clear
                </button>
              )}
            </div>

            {!hasSearched && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>Search for a patient to get started.</p>
              </div>
            )}

            {isSearching && <div className="loading-state">Searching...</div>}

            {hasSearched && !isSearching && searchResults.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No patient found</h3>
                <p>"{searchQuery}" is not in the database yet.</p>
                <button className="btn-primary" onClick={() => setShowAddPatient(true)}>Register New Patient</button>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr><th>ID</th><th>Name</th><th>Phone</th><th>Blood Type</th><th>City</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {searchResults.map((p) => (
                      <tr key={p.patient_id}>
                        <td>{p.patient_id}</td>
                        <td><strong>{p.first_name} {p.last_name}</strong></td>
                        <td>{p.phone_number || "—"}</td>
                        <td><span className="blood-badge">{p.blood_type || "—"}</span></td>
                        <td>{p.city || "—"}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-view" onClick={() => { setSelectedPatient(p); setShowViewModal(true); }}>📋 View</button>
                            <button className="btn-vitals" onClick={() => { setSelectedPatient(p); setShowVitalsModal(true); }}>🩺 Record Vitals</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VITALS SECTION (Placeholder) */}
        {activeSection === "vitals" && (
          <div className="placeholder-section">
            <div className="empty-state">
              <div className="empty-icon">🩺</div>
              <h3>Record Vital Signs</h3>
              <p>Search and select a patient first to record their vitals.</p>
              <button className="btn-primary" onClick={() => setActiveSection("patients")}>Go to Patients →</button>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {showAddPatient && <AddPatientModal onClose={() => setShowAddPatient(false)} onSuccess={(p, e, pw) => { setShowAddPatient(false); setSuccessData({ patient: p, email: e, password: pw }); }} config={config} />}
      {successData && <SuccessModal patient={successData.patient} email={successData.email} password={successData.password} onClose={() => { setSuccessData(null); setActiveSection("patients"); handleSearch(); }} />}
      {showViewModal && selectedPatient && <PatientViewModal patient={selectedPatient} onClose={() => { setShowViewModal(false); setSelectedPatient(null); }} config={config} />}
      {showVitalsModal && selectedPatient && <RecordVitalsModal patient={selectedPatient} onClose={() => { setShowVitalsModal(false); setSelectedPatient(null); }} onSuccess={() => { handleSearch(); }} config={config} />}
    </div>
  );
}