import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DoctorDashboard.css";

const API = "http://localhost:8000";

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card" style={{ "--accent": color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

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

function PatientDetailView({ patient, doctor, onBack, config }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [recordForm, setRecordForm] = useState({
    visit_date: today, diagnosis: "", symptoms: "", treatment_plan: "", notes: "", facility_id: ""
  });
  const [rxForm, setRxForm] = useState({
    medication_name: "", dosage: "", frequency: "", duration: "", instructions: "", prescription_date: today
  });
  const [apptForm, setApptForm] = useState({
    appointment_date: "", appointment_time: "", reason: "", facility_id: "", provider_id: ""
  });
  const [editForm, setEditForm] = useState({ ...patient });
  const [editMsg, setEditMsg] = useState("");

  useEffect(() => { fetchAll(); }, [patient.patient_id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, p, a, v, f, prov] = await Promise.all([
        axios.get(`${API}/medical-records/patient/${patient.patient_id}`, config),
        axios.get(`${API}/prescriptions/patient/${patient.patient_id}`, config),
        axios.get(`${API}/appointments/patient/${patient.patient_id}`, config),
        axios.get(`${API}/vital-signs/patient/${patient.patient_id}`, config),
        axios.get(`${API}/facilities/`, config).catch(() => ({ data: [] })),
        axios.get(`${API}/providers/`, config).catch(() => ({ data: [] })),
      ]);
      setRecords(r.data);
      setPrescriptions(p.data);
      setAppointments(a.data);
      setVitals(v.data);
      setFacilities(f.data);
      setProviders(prov.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submit = async (fn) => {
    setSubmitting(true);
    try {
      await fn();
      fetchAll();
    } catch (err) {
      alert("" + (err.response?.data?.detail || JSON.stringify(err.response?.data) || "Error"));
    } finally { setSubmitting(false); }
  };

  const handleAddRecord = (e) => {
    e.preventDefault();
    submit(async () => {
      await axios.post(`${API}/medical-records/`, {
        patient_id: patient.patient_id,
        provider_id: doctor?.provider_id,
        ...recordForm,
        facility_id: recordForm.facility_id || null
      }, config);
      alert("✅ Medical record saved");
      setRecordForm({ visit_date: today, diagnosis: "", symptoms: "", treatment_plan: "", notes: "", facility_id: "" });
    });
  };

  const handleAddRx = (e) => {
    e.preventDefault();
    submit(async () => {
      await axios.post(`${API}/prescriptions/`, {
        patient_id: patient.patient_id,
        provider_id: doctor?.provider_id,
        ...rxForm
      }, config);
      alert("✅ Prescription issued");
      setRxForm({ medication_name: "", dosage: "", frequency: "", duration: "", instructions: "", prescription_date: today });
    });
  };

  const handleBookAppt = (e) => {
    e.preventDefault();
    submit(async () => {
      await axios.post(`${API}/appointments/`, {
        patient_id: patient.patient_id,
        provider_id: apptForm.provider_id || null,
        facility_id: apptForm.facility_id || null,
        appointment_date: apptForm.appointment_date,
        appointment_time: apptForm.appointment_time,
        reason: apptForm.reason
      }, config);
      alert("✅ Appointment booked");
      setApptForm({ appointment_date: "", appointment_time: "", reason: "", facility_id: "", provider_id: "" });
    });
  };

  const handleEditPatient = (e) => {
    e.preventDefault();
    submit(async () => {
      await axios.put(`${API}/patients/${patient.patient_id}`, editForm, config);
      setEditMsg("✅ Patient updated successfully");
    });
  };

  const tabs = [
    { id: "overview", label: "📋 Overview" },
    { id: "vitals", label: "🩺 Vitals", count: vitals.length },
    { id: "records", label: "📋 Records", count: records.length },
    { id: "add-record", label: "➕ Add Record" },
    { id: "prescriptions", label: "💊 Prescriptions", count: prescriptions.length },
    { id: "add-rx", label: "✍️ Prescribe" },
    { id: "appointments", label: "📅 Appointments", count: appointments.length },
    { id: "book-appt", label: "📆 Book Appointment" },
    { id: "edit", label: "✏️ Edit Patient" },
  ];

  const latestVital = vitals[0];

  return (
    <div className="patient-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
        <div className="detail-patient-info">
          <div className="detail-avatar">{patient.first_name?.[0]}{patient.last_name?.[0]}</div>
          <div>
            <h2>{patient.first_name} {patient.last_name}</h2>
            <div className="detail-meta">
              <span>ID: {patient.patient_id}</span>
              <span>🩸 {patient.blood_type || "—"}</span>
              <span>📞 {patient.phone_number || "—"}</span>
              <span>📍 {patient.city || "—"}</span>
              {patient.allergies && <span className="allergy-tag">⚠️ {patient.allergies}</span>}
            </div>
          </div>
        </div>
        {doctor && <div className="attending-doctor">👨‍⚕️ Dr. {doctor.first_name} {doctor.last_name}</div>}
      </div>

      <div className="detail-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`detail-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.label}{t.count !== undefined && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="detail-content">
        {loading && <div className="loading-state">Loading...</div>}

        {activeTab === "overview" && !loading && (
          <div className="overview-grid">
            <div className="overview-card">
              <h4>👤 Patient Information</h4>
              <div className="info-rows">
                {[["DOB", patient.date_of_birth], ["Gender", patient.gender], ["Blood Type", patient.blood_type],
                  ["City", patient.city], ["Phone", patient.phone_number], ["National ID", patient.national_id],
                  ["Allergies", patient.allergies || "None"], ["Chronic Conditions", patient.chronic_conditions || "None"],
                  ["Emergency Contact", patient.emergency_contact_name], ["Emergency Phone", patient.emergency_contact_phone]]
                  .map(([k, v]) => v ? <div key={k} className="info-row"><span>{k}</span><strong>{v}</strong></div> : null)}
              </div>
            </div>
            {latestVital && (
              <div className="overview-card">
                <h4>🩺 Latest Vitals — {new Date(latestVital.recorded_at).toLocaleDateString()}</h4>
                <div className="vitals-grid">
                  {latestVital.temperature && <div className="vital-chip"><span>Temp</span><strong>{latestVital.temperature}°C</strong></div>}
                  {(latestVital.blood_pressure_systolic && latestVital.blood_pressure_diastolic) &&
                    <div className="vital-chip"><span>BP</span><strong>{latestVital.blood_pressure_systolic}/{latestVital.blood_pressure_diastolic}</strong></div>}
                  {latestVital.heart_rate && <div className="vital-chip"><span>HR</span><strong>{latestVital.heart_rate} bpm</strong></div>}
                  {latestVital.weight && <div className="vital-chip"><span>Weight</span><strong>{latestVital.weight} kg</strong></div>}
                </div>
              </div>
            )}
            <div className="overview-card">
              <h4>📊 Summary</h4>
              <div className="summary-stats">
                <div className="sum-stat"><strong>{records.length}</strong><span>Records</span></div>
                <div className="sum-stat"><strong>{prescriptions.length}</strong><span>Prescriptions</span></div>
                <div className="sum-stat"><strong>{appointments.filter(a => a.status === "Scheduled").length}</strong><span>Upcoming Appts</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "vitals" && !loading && (
          vitals.length === 0 ? <div className="empty-state"><div className="empty-icon">🩺</div><p>No vitals recorded yet.</p></div> :
            vitals.map(v => (
              <div key={v.vital_id} className="record-card">
                <div className="record-card-header"><strong>🩺 Vital Signs</strong><span className="record-date">{new Date(v.recorded_at).toLocaleString()}</span></div>
                <div className="vitals-grid">
                  {v.temperature && <div className="vital-chip"><span>Temp</span><strong>{v.temperature}°C</strong></div>}
                  {(v.blood_pressure_systolic && v.blood_pressure_diastolic) &&
                    <div className="vital-chip"><span>BP</span><strong>{v.blood_pressure_systolic}/{v.blood_pressure_diastolic} mmHg</strong></div>}
                  {v.heart_rate && <div className="vital-chip"><span>Heart Rate</span><strong>{v.heart_rate} bpm</strong></div>}
                  {v.respiratory_rate && <div className="vital-chip"><span>Resp Rate</span><strong>{v.respiratory_rate}</strong></div>}
                  {v.weight && <div className="vital-chip"><span>Weight</span><strong>{v.weight} kg</strong></div>}
                  {v.height && <div className="vital-chip"><span>Height</span><strong>{v.height} cm</strong></div>}
                </div>
              </div>
            ))
        )}

        {activeTab === "records" && !loading && (
          records.length === 0 ? <div className="empty-state"><div className="empty-icon">📋</div><p>No medical records yet.</p></div> :
            records.map(r => (
              <div key={r.record_id} className="record-card">
                <div className="record-card-header"><strong>{r.diagnosis || "Visit Record"}</strong><span className="record-date">{r.visit_date}</span></div>
                <div className="record-meta">
                  {doctor && <span>👨‍⚕️ Dr. {doctor.first_name} {doctor.last_name}</span>}
                  {r.facility_id && facilities.find(f => f.facility_id === r.facility_id) &&
                    <span>🏥 {facilities.find(f => f.facility_id === r.facility_id).facility_name}</span>}
                </div>
                {r.symptoms && <p><b>Symptoms:</b> {r.symptoms}</p>}
                {r.treatment_plan && <p><b>Treatment:</b> {r.treatment_plan}</p>}
                {r.notes && <p><b>Notes:</b> {r.notes}</p>}
              </div>
            ))
        )}

        {activeTab === "add-record" && (
          <form onSubmit={handleAddRecord} className="detail-form">
            <h3>Add Medical Record</h3>
            {doctor && <div className="doctor-badge">👨‍⚕️ Attending: Dr. {doctor.first_name} {doctor.last_name}</div>}
            <div className="form-grid">
              <div className="form-group"><label>Visit Date *</label><input type="date" value={recordForm.visit_date} onChange={e => setRecordForm(f => ({ ...f, visit_date: e.target.value }))} required /></div>
              <div className="form-group"><label>Facility</label>
                <select value={recordForm.facility_id} onChange={e => setRecordForm(f => ({ ...f, facility_id: e.target.value }))}>
                  <option value="">Select Facility</option>
                  {facilities.map(f => <option key={f.facility_id} value={f.facility_id}>{f.facility_name} — {f.city}</option>)}
                </select>
              </div>
              <div className="form-group full"><label>Diagnosis *</label><input value={recordForm.diagnosis} onChange={e => setRecordForm(f => ({ ...f, diagnosis: e.target.value }))} required /></div>
              <div className="form-group full"><label>Symptoms</label><textarea value={recordForm.symptoms} onChange={e => setRecordForm(f => ({ ...f, symptoms: e.target.value }))} rows={2} /></div>
              <div className="form-group full"><label>Treatment Plan</label><textarea value={recordForm.treatment_plan} onChange={e => setRecordForm(f => ({ ...f, treatment_plan: e.target.value }))} rows={2} /></div>
              <div className="form-group full"><label>Notes</label><textarea value={recordForm.notes} onChange={e => setRecordForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "⏳ Saving..." : "💾 Save Record"}</button>
          </form>
        )}

        {activeTab === "prescriptions" && !loading && (
          prescriptions.length === 0 ? <div className="empty-state"><div className="empty-icon">💊</div><p>No prescriptions yet.</p></div> :
            prescriptions.map(rx => (
              <div key={rx.prescription_id} className="record-card prescription-card">
                <div className="record-card-header">
                  <strong>💊 {rx.medication_name}</strong>
                  <span className={`status-badge ${rx.is_dispensed ? "dispensed" : "pending"}`}>
                    {rx.is_dispensed ? "✔ Dispensed" : "⏳ Pending"}
                  </span>
                </div>
                <div className="rx-details">
                  <div className="rx-chip"><span>Dosage</span><strong>{rx.dosage}</strong></div>
                  <div className="rx-chip"><span>Frequency</span><strong>{rx.frequency}</strong></div>
                  <div className="rx-chip"><span>Duration</span><strong>{rx.duration || "—"}</strong></div>
                  <div className="rx-chip"><span>Date</span><strong>{rx.prescription_date}</strong></div>
                </div>
                {rx.instructions && <p className="rx-instructions"><b>Instructions:</b> {rx.instructions}</p>}
                {rx.blockchain_token && <div className="blockchain-token">🔐 Token: {rx.blockchain_token}</div>}
              </div>
            ))
        )}

        {activeTab === "add-rx" && (
          <form onSubmit={handleAddRx} className="detail-form">
            <h3>Write ePrescription</h3>
            {doctor && <div className="doctor-badge">👨‍⚕️ Prescribing: Dr. {doctor.first_name} {doctor.last_name}</div>}
            <div className="form-grid">
              <div className="form-group"><label>Date *</label><input type="date" value={rxForm.prescription_date} onChange={e => setRxForm(f => ({ ...f, prescription_date: e.target.value }))} required /></div>
              <div className="form-group"><label>Medication *</label><input value={rxForm.medication_name} onChange={e => setRxForm(f => ({ ...f, medication_name: e.target.value }))} placeholder="e.g. Coartem" required /></div>
              <div className="form-group"><label>Dosage *</label><input value={rxForm.dosage} onChange={e => setRxForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 4 tablets" required /></div>
              <div className="form-group"><label>Frequency *</label><input value={rxForm.frequency} onChange={e => setRxForm(f => ({ ...f, frequency: e.target.value }))} placeholder="e.g. Twice daily" required /></div>
              <div className="form-group"><label>Duration</label><input value={rxForm.duration} onChange={e => setRxForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 3 days" /></div>
              <div className="form-group full"><label>Instructions</label><textarea value={rxForm.instructions} onChange={e => setRxForm(f => ({ ...f, instructions: e.target.value }))} rows={2} placeholder="Take with food..." /></div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "⏳ Saving..." : "💊 Issue Prescription"}</button>
          </form>
        )}

        {activeTab === "appointments" && !loading && (
          appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <p>No appointments yet for this patient.</p>
              <button className="btn-primary" onClick={() => setActiveTab("book-appt")}>
                Book an Appointment →
              </button>
            </div>
          ) : (
            <div>
              {/* Show upcoming appointments first */}
              {appointments.filter(a => a.status !== "Cancelled" && a.status !== "cancelled" && new Date(a.appointment_date) >= new Date()).length > 0 && (
                <>
                  <h3 style={{ marginBottom: "12px", color: "#16a34a" }}>📅 Upcoming Appointments</h3>
                  {appointments.filter(a => a.status !== "Cancelled" && a.status !== "cancelled" && new Date(a.appointment_date) >= new Date()).map(a => (
                    <div key={a.appointment_id} className="record-card">
                      <div className="record-card-header">
                        <strong>📅 {a.appointment_date} at {a.appointment_time}</strong>
                        <span className={`status-badge ${a.status?.toLowerCase() === "cancelled" ? "cancelled" : "scheduled"}`}>
                          {a.status}
                        </span>
                      </div>
                      {a.facility_id && facilities.find(f => f.facility_id === a.facility_id) && (
                        <p>🏥 {facilities.find(f => f.facility_id === a.facility_id).facility_name}</p>
                      )}
                      {a.provider_id && providers.find(p => p.provider_id === a.provider_id) && (
                        <p>👨‍⚕️ Dr. {providers.find(p => p.provider_id === a.provider_id).first_name} {providers.find(p => p.provider_id === a.provider_id).last_name}</p>
                      )}
                      <p><b>Reason:</b> {a.reason}</p>
                    </div>
                  ))}
                </>
              )}
              
              {/* Show past appointments */}
              {appointments.filter(a => new Date(a.appointment_date) < new Date() || a.status === "Cancelled").length > 0 && (
                <>
                  <h3 style={{ marginTop: "20px", marginBottom: "12px", color: "#64748b" }}>📜 Past Appointments</h3>
                  {appointments.filter(a => new Date(a.appointment_date) < new Date() || a.status === "Cancelled").map(a => (
                    <div key={a.appointment_id} className="record-card" style={{ opacity: 0.8 }}>
                      <div className="record-card-header">
                        <strong>📅 {a.appointment_date} at {a.appointment_time}</strong>
                        <span className={`status-badge ${a.status?.toLowerCase() === "cancelled" ? "cancelled" : "completed"}`}>
                          {a.status === "Cancelled" ? "❌ Cancelled" : "✓ Completed"}
                        </span>
                      </div>
                      {a.facility_id && facilities.find(f => f.facility_id === a.facility_id) && (
                        <p>🏥 {facilities.find(f => f.facility_id === a.facility_id).facility_name}</p>
                      )}
                      {a.provider_id && providers.find(p => p.provider_id === a.provider_id) && (
                        <p>👨‍⚕️ Dr. {providers.find(p => p.provider_id === a.provider_id).first_name} {providers.find(p => p.provider_id === a.provider_id).last_name}</p>
                      )}
                      <p><b>Reason:</b> {a.reason}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        )}

        {activeTab === "book-appt" && (
          <form onSubmit={handleBookAppt} className="detail-form">
            <h3>Book Appointment</h3>
            <div className="form-grid">
              <div className="form-group"><label>Date *</label><input type="date" value={apptForm.appointment_date} onChange={e => setApptForm(f => ({ ...f, appointment_date: e.target.value }))} required min={today} /></div>
              <div className="form-group"><label>Time *</label><input type="time" value={apptForm.appointment_time} onChange={e => setApptForm(f => ({ ...f, appointment_time: e.target.value }))} required /></div>
              <div className="form-group"><label>Facility</label>
                <select value={apptForm.facility_id} onChange={e => setApptForm(f => ({ ...f, facility_id: e.target.value }))}>
                  <option value="">Select Facility</option>
                  {facilities.map(f => <option key={f.facility_id} value={f.facility_id}>{f.facility_name} — {f.city}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Doctor</label>
                <select value={apptForm.provider_id} onChange={e => setApptForm(f => ({ ...f, provider_id: e.target.value }))}>
                  <option value="">Select Doctor</option>
                  {providers.filter(p => p.provider_type === "Doctor").map(p =>
                    <option key={p.provider_id} value={p.provider_id}>Dr. {p.first_name} {p.last_name} — {p.specialization || "GP"}</option>
                  )}
                </select>
              </div>
              <div className="form-group full"><label>Reason *</label><textarea value={apptForm.reason} onChange={e => setApptForm(f => ({ ...f, reason: e.target.value }))} rows={2} required /></div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "⏳ Booking..." : "📆 Book Appointment"}</button>
          </form>
        )}

        {activeTab === "edit" && (
          <form onSubmit={handleEditPatient} className="detail-form">
            <h3>Edit Patient Information</h3>
            {editMsg && <div className="form-success">{editMsg}</div>}
            <div className="form-grid">
              <div className="form-group"><label>First Name</label><input value={editForm.first_name || ""} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} /></div>
              <div className="form-group"><label>Last Name</label><input value={editForm.last_name || ""} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} /></div>
              <div className="form-group"><label>Phone</label><input value={editForm.phone_number || ""} onChange={e => setEditForm(f => ({ ...f, phone_number: e.target.value }))} /></div>
              <div className="form-group"><label>City</label><input value={editForm.city || ""} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div className="form-group"><label>Blood Type</label>
                <select value={editForm.blood_type || ""} onChange={e => setEditForm(f => ({ ...f, blood_type: e.target.value }))}>
                  <option value="">Select</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group full"><label>Allergies</label><textarea value={editForm.allergies || ""} onChange={e => setEditForm(f => ({ ...f, allergies: e.target.value }))} rows={2} /></div>
              <div className="form-group full"><label>Chronic Conditions</label><textarea value={editForm.chronic_conditions || ""} onChange={e => setEditForm(f => ({ ...f, chronic_conditions: e.target.value }))} rows={2} /></div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "⏳ Saving..." : "💾 Save Changes"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [doctor, setDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ patients: 0, appointments: 0, records: 0, prescriptions: 0 });
  const [facilityAppointments, setFacilityAppointments] = useState({ upcoming: [], past: [] });
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [myFacility, setMyFacility] = useState(null);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchFacilityAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const res = await axios.get(`${API}/appointments/doctor/dashboard`, config);
      setFacilityAppointments({
        upcoming: res.data.upcoming_appointments,
        past: res.data.past_appointments,
        my_assigned: res.data.my_assigned_appointments
      });
      setMyFacility({
        id: res.data.facility_id,
        name: res.data.facility_name
      });
    } catch (err) {
      console.error("Failed to fetch facility appointments:", err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchDoctorProfile = async () => {
    try {
      const provRes = await axios.get(`${API}/providers/me`, config);
      setDoctor(provRes.data);
      if (provRes.data?.facility_id) {
        fetchFacilityAppointments();
      }
    } catch (e) {
      console.error("Failed to fetch doctor profile", e);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

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

  if (selectedPatient) {
    return <PatientDetailView patient={selectedPatient} doctor={doctor} onBack={() => setSelectedPatient(null)} config={config} />;
  }

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "patients", icon: "👥", label: "Patients" },
    { id: "facility-appointments", icon: "🏥", label: "Facility Appointments" },
    { id: "prescriptions", icon: "💊", label: "Prescriptions" },
    { id: "records", icon: "📋", label: "Medical Records" },
  ];

  return (
    <div className={`doctor-dashboard ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">👨‍⚕️</div>
          {sidebarOpen && <span className="sidebar-title">CHENGETO</span>}
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
          {doctor && sidebarOpen && (
            <div className="doctor-profile">
              <div className="doc-avatar">👨‍⚕️</div>
              <div>
                <div className="doc-name">Dr. {doctor.first_name} {doctor.last_name}</div>
                <div className="doc-spec">{doctor.specialization || doctor.provider_type}</div>
                {doctor.facility_name && <div className="doc-facility">🏥 {doctor.facility_name}</div>}
              </div>
            </div>
          )}
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div className="topbar-title">{navItems.find(n => n.id === activeSection)?.icon} {navItems.find(n => n.id === activeSection)?.label}</div>
          <div className="topbar-user">
            <div className="user-avatar">👨‍⚕️</div>
            <span>Dr. {doctor?.first_name || "Doctor"}</span>
          </div>
        </div>

        {activeSection === "dashboard" && (
          <div className="dashboard-content">
            <div className="welcome-section">
              <h1>Welcome, Dr. {doctor?.first_name || "Doctor"} 👋</h1>
              <p>{doctor?.specialization || "Healthcare Provider"}</p>
              {doctor?.facility_name && <p>🏥 Assigned to: <strong>{doctor.facility_name}</strong></p>}
            </div>
            <div className="stats-grid">
              <StatCard icon="👥" value={stats.patients} label="Patients Found" color="#0072ff" />
              <StatCard icon="📅" value={facilityAppointments.upcoming?.length || 0} label="Upcoming Appointments" color="#43e97b" />
              <StatCard icon="📋" value={stats.records} label="Medical Records" color="#f9d423" />
              <StatCard icon="💊" value={stats.prescriptions} label="Prescriptions" color="#f093fb" />
            </div>
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-btns">
                <button className="action-btn" onClick={() => { setActiveSection("patients"); setShowAddPatient(true); }}>➕ Register Patient</button>
                <button className="action-btn" onClick={() => setActiveSection("patients")}>🔍 Search Patient</button>
                <button className="action-btn" onClick={() => setActiveSection("facility-appointments")}>🏥 View Facility Appointments</button>
              </div>
            </div>
          </div>
        )}

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
                <table className="patient-table">
                  <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Blood Type</th><th>City</th><th>Actions</th></tr></thead>
                  <tbody>
                    {searchResults.map((p) => (
                      <tr key={p.patient_id}>
                        <td>{p.patient_id}</td>
                        <td><strong>{p.first_name} {p.last_name}</strong></td>
                        <td>{p.phone_number || "—"}</td>
                        <td><span className="blood-badge">{p.blood_type || "—"}</span></td>
                        <td>{p.city || "—"}</td>
                        <td><button className="view-btn" onClick={() => setSelectedPatient(p)}>View →</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSection === "facility-appointments" && (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>🏥 {myFacility?.name || "My Facility"} - Appointments</h2>
            </div>
            
            {loadingAppointments ? (
              <div className="loading-state">Loading appointments...</div>
            ) : (
              <>
                {/* Upcoming Appointments at Facility */}
                <div>
                  <h3 style={{ marginBottom: "16px", color: "#16a34a" }}>
                    📅 Upcoming Appointments ({facilityAppointments.upcoming?.length || 0})
                  </h3>
                  {facilityAppointments.upcoming?.length === 0 ? (
                    <div className="empty-state">
                      <p>No upcoming appointments at this facility.</p>
                    </div>
                  ) : (
                    facilityAppointments.upcoming.map(apt => (
                      <div key={apt.appointment_id} className="record-card">
                        <div className="record-card-header">
                          <strong>{apt.appointment_date} at {apt.appointment_time}</strong>
                          <span className="status-badge scheduled">{apt.status}</span>
                        </div>
                        <p><b>Patient:</b> {apt.patient?.first_name} {apt.patient?.last_name} (ID: {apt.patient_id})</p>
                        <p><b>Reason:</b> {apt.reason}</p>
                        {apt.provider_id ? (
                          <p><b>Assigned Doctor:</b> Dr. {apt.provider?.first_name} {apt.provider?.last_name}</p>
                        ) : (
                          <p><b>Assigned Doctor:</b> <span className="no-facility">Not yet assigned</span></p>
                        )}
                        <button 
                          className="btn-primary" 
                          style={{ marginTop: "12px", padding: "6px 12px", fontSize: "12px" }}
                          onClick={() => {
                            setSearchQuery(apt.patient_id.toString());
                            handleSearch();
                            setActiveSection("patients");
                          }}
                        >
                          View Patient →
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Past Appointments at Facility */}
                <div style={{ marginTop: "32px" }}>
                  <h3 style={{ marginBottom: "16px", color: "#64748b" }}>
                    📜 Past Appointments ({facilityAppointments.past?.length || 0})
                  </h3>
                  {facilityAppointments.past?.length === 0 ? (
                    <div className="empty-state">
                      <p>No past appointments at this facility.</p>
                    </div>
                  ) : (
                    facilityAppointments.past.slice(0, 10).map(apt => (
                      <div key={apt.appointment_id} className="record-card" style={{ opacity: 0.8 }}>
                        <div className="record-card-header">
                          <strong>{apt.appointment_date} at {apt.appointment_time}</strong>
                          <span className={`status-badge ${apt.status?.toLowerCase() === "cancelled" ? "cancelled" : "completed"}`}>
                            {apt.status === "Cancelled" ? "❌ Cancelled" : "✓ Completed"}
                          </span>
                        </div>
                        <p><b>Patient:</b> {apt.patient?.first_name} {apt.patient?.last_name} (ID: {apt.patient_id})</p>
                        <p><b>Reason:</b> {apt.reason}</p>
                      </div>
                    ))
                  )}
                  {facilityAppointments.past?.length > 10 && (
                    <p style={{ textAlign: "center", marginTop: "12px", color: "#64748b" }}>
                      + {facilityAppointments.past.length - 10} more past appointments
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeSection === "prescriptions" && (
          <div className="placeholder-section">
            <div className="empty-state">
              <div className="empty-icon">💊</div>
              <h3>Prescriptions</h3>
              <p>Search and select a patient first to view or write prescriptions.</p>
              <button className="btn-primary" onClick={() => setActiveSection("patients")}>Go to Patients →</button>
            </div>
          </div>
        )}

        {activeSection === "records" && (
          <div className="placeholder-section">
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Medical Records</h3>
              <p>Search and select a patient first to view or create medical records.</p>
              <button className="btn-primary" onClick={() => setActiveSection("patients")}>Go to Patients →</button>
            </div>
          </div>
        )}
      </main>

      {showAddPatient && <AddPatientModal onClose={() => setShowAddPatient(false)} onSuccess={(p, e, pw) => { setShowAddPatient(false); setSuccessData({ patient: p, email: e, password: pw }); }} config={config} />}
      {successData && <SuccessModal patient={successData.patient} email={successData.email} password={successData.password} onClose={() => { setSuccessData(null); setActiveSection("patients"); }} />}
    </div>
  );
}