import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API = 'http://localhost:8000';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [patientData, setPatientData] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Appointment booking form
  const [appointmentForm, setAppointmentForm] = useState({
    appointment_date: '',
    appointment_time: '',
    reason: '',
  });

  // AI symptom checker
  const [symptomInput, setSymptomInput] = useState('');
  const [symptomLocation, setSymptomLocation] = useState('Harare');
  const [symptomResult, setSymptomResult] = useState(null);
  const [symptomLoading, setSymptomLoading] = useState(false);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Use the new single dashboard endpoint
      const response = await axios.get(`${API}/dashboard/`, config);
      const data = response.data;
      setPatientData(data.profile);
      setMedicalRecords(data.medical_records);
      setPrescriptions(data.prescriptions);
      setAppointments(data.appointments);
      setPredictions(data.ai_predictions);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!patientData) return;

    try {
      await axios.post(
        `${API}/appointments/`,  // ✅ trailing slash
        {
          patient_id: patientData.patient_id,
          appointment_date: appointmentForm.appointment_date,
          appointment_time: appointmentForm.appointment_time,
          reason: appointmentForm.reason,
        },
        config
      );
      alert('✅ Appointment booked successfully!');
      setAppointmentForm({ appointment_date: '', appointment_time: '', reason: '' });
      fetchDashboard(); // refresh
    } catch (err) {
      console.error('Error booking appointment:', err.response?.data || err);
      alert('❌ Error booking appointment: ' + JSON.stringify(err.response?.data?.detail || err.message));
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await axios.delete(`${API}/appointments/${appointmentId}`, config);
      alert('✅ Appointment cancelled.');
      fetchDashboard();
    } catch (err) {
      console.error('Error cancelling appointment:', err.response?.data || err);
      alert('❌ Error cancelling appointment.');
    }
  };

  const handleSymptomCheck = async (e) => {
    e.preventDefault();
    if (!symptomInput.trim()) {
      alert('Please describe your symptoms');
      return;
    }
    setSymptomLoading(true);
    setSymptomResult(null);
    try {
      const response = await axios.post(
        `${API}/ai/symptom-check`,  // ✅ patient-facing AI endpoint
        {
          symptoms: symptomInput,
          patient_location: symptomLocation,
        },
        config
      );
      setSymptomResult(response.data);
    } catch (err) {
      console.error('Error checking symptoms:', err.response?.data || err);
      alert('❌ Error checking symptoms. Please try again.');
    } finally {
      setSymptomLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  if (loading) return <div className="loading">⏳ Loading your health data...</div>;
  if (error) return <div className="error-state">❌ {error} <button onClick={fetchDashboard}>Retry</button></div>;
  if (!patientData) return <div className="loading">No patient profile found.</div>;

  return (
    <div className="dashboard">
      <div className="header">
        <h1>👋 Welcome, {patientData.first_name}!</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="tabs">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'profile', label: '👤 Profile' },
          { id: 'records', label: '📋 Medical Records' },
          { id: 'prescriptions', label: '💊 Prescriptions' },
          { id: 'appointments', label: '📅 Appointments' },
          { id: 'ai-chat', label: '🤖 AI Symptom Check' },
        ].map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="overview">
            <div className="stat-card"><h3>{medicalRecords.length}</h3><p>Medical Records</p></div>
            <div className="stat-card"><h3>{prescriptions.length}</h3><p>Prescriptions</p></div>
            <div className="stat-card"><h3>{appointments.length}</h3><p>Appointments</p></div>
            <div className="stat-card"><h3>{predictions.length}</h3><p>AI Predictions</p></div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div className="profile">
            <h2>Patient Profile</h2>
            {[
              ['Name', `${patientData.first_name} ${patientData.last_name}`],
              ['Date of Birth', patientData.date_of_birth],
              ['Gender', patientData.gender],
              ['Blood Type', patientData.blood_type || 'Not specified'],
              ['Phone', patientData.phone_number],
              ['Location', `${patientData.city || ''}`],
              ['Allergies', patientData.allergies || 'None'],
              ['Chronic Conditions', patientData.chronic_conditions || 'None'],
              ['Emergency Contact', `${patientData.emergency_contact_name || 'N/A'} (${patientData.emergency_contact_phone || 'N/A'})`],
            ].map(([label, value]) => (
              <div className="info-row" key={label}>
                <span className="label">{label}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* MEDICAL RECORDS */}
        {activeTab === 'records' && (
          <div className="records">
            <h2>Medical Records</h2>
            {medicalRecords.length === 0 ? (
              <p className="empty-state">No medical records yet. Records will appear here after a doctor's visit.</p>
            ) : (
              medicalRecords.map(record => (
                <div key={record.record_id} className="record-card">
                  <div className="record-header">
                    <h3>📋 {record.diagnosis || 'Visit Record'}</h3>
                    <span className="record-date">{record.visit_date}</span>
                  </div>
                  {record.symptoms && <p><strong>Symptoms:</strong> {record.symptoms}</p>}
                  {record.treatment_plan && <p><strong>Treatment:</strong> {record.treatment_plan}</p>}
                  {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <div className="prescriptions">
            <h2>Prescriptions</h2>
            {prescriptions.length === 0 ? (
              <p className="empty-state">No prescriptions yet.</p>
            ) : (
              prescriptions.map(rx => (
                <div key={rx.prescription_id} className="prescription-card">
                  <h3>💊 {rx.medication_name}</h3>
                  <p><strong>Dosage:</strong> {rx.dosage}</p>
                  <p><strong>Frequency:</strong> {rx.frequency}</p>
                  <p><strong>Duration:</strong> {rx.duration}</p>
                  {rx.instructions && <p><strong>Instructions:</strong> {rx.instructions}</p>}
                  {rx.blockchain_token && (
                    <div className="blockchain-token">
                      <small>🔐 Blockchain: {rx.blockchain_token}</small>
                    </div>
                  )}
                  <div className={`status ${rx.dispensed ? 'dispensed' : 'pending'}`}>
                    {rx.dispensed ? '✔ Dispensed' : '○ Pending'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="appointments">
            <h2>Book an Appointment</h2>
            <form onSubmit={handleBookAppointment} className="appointment-form">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={appointmentForm.appointment_date}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
                required
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
              <label className="form-label">Time</label>
              <input
                type="time"
                value={appointmentForm.appointment_time}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_time: e.target.value })}
                required
                className="form-input"
              />
              <label className="form-label">Reason for Visit</label>
              <textarea
                placeholder="Describe your reason for visiting..."
                value={appointmentForm.reason}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                required
                className="form-textarea"
              />
              <button type="submit" className="submit-btn">📅 Book Appointment</button>
            </form>

            <h2>My Appointments</h2>
            {appointments.length === 0 ? (
              <p className="empty-state">No appointments booked yet.</p>
            ) : (
              appointments.map(appt => (
                <div key={appt.appointment_id} className="appointment-card">
                  <div className="appt-header">
                    <h3>📅 {appt.appointment_date} at {appt.appointment_time}</h3>
                    <span className={`appt-status ${appt.status}`}>{appt.status}</span>
                  </div>
                  <p><strong>Reason:</strong> {appt.reason}</p>
                  {appt.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelAppointment(appt.appointment_id)}
                      className="cancel-btn"
                    >
                      ✖ Cancel
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* AI SYMPTOM CHECKER */}
        {activeTab === 'ai-chat' && (
          <div className="ai-chat">
            <h2>🤖 AI Symptom Checker</h2>
            <p className="ai-disclaimer">
              ⚠️ This tool provides general health guidance only — it is <strong>not a medical diagnosis</strong>.
              Always consult a qualified healthcare provider.
            </p>

            <form onSubmit={handleSymptomCheck} className="symptom-form">
              <label className="form-label">Describe your symptoms</label>
              <textarea
                placeholder="e.g., I have a high fever, chills, and headache for the past 2 days..."
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                required
                className="form-textarea"
                rows={4}
              />
              <label className="form-label">Your Location</label>
              <input
                type="text"
                placeholder="e.g., Harare, Kariba, Bulawayo"
                value={symptomLocation}
                onChange={(e) => setSymptomLocation(e.target.value)}
                className="form-input"
              />
              <button type="submit" className="ai-btn" disabled={symptomLoading}>
                {symptomLoading ? '⏳ Checking...' : '🤖 Check Symptoms'}
              </button>
            </form>

            {symptomResult && (
              <div className="symptom-result">
                <h3>AI Assessment</h3>
                <div className={`urgency urgency-${symptomResult.urgency_level}`}>
                  Urgency: <strong>{symptomResult.urgency_level?.toUpperCase()}</strong>
                </div>
                <div className="possible-conditions">
                  <h4>Possible Conditions:</h4>
                  <ul>
                    {(symptomResult.possible_conditions || []).map((condition, i) => (
                      <li key={i}>{condition}</li>
                    ))}
                  </ul>
                </div>
                <div className="recommendation">
                  <h4>Recommendation:</h4>
                  <p>{symptomResult.recommendation}</p>
                </div>
                <div className="disclaimer-box">
                  <small>⚠️ {symptomResult.disclaimer}</small>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
