import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DoctorDashboard.css';

const API = 'http://localhost:8000';

function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const [medicalRecordForm, setMedicalRecordForm] = useState({
    diagnosis: '',
    symptoms: '',
    treatment_plan: '',
    notes: '',
    visit_date: new Date().toISOString().split('T')[0], // ✅ default to today
  });

  const [vitalSignsForm, setVitalSignsForm] = useState({
    temperature: '',
    blood_pressure: '',
    heart_rate: '',
    respiratory_rate: '',
    oxygen_saturation: ''
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  const [aiPrediction, setAiPrediction] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [location, setLocation] = useState('Harare');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchCurrentUser();
    fetchAllPatients();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, config);
      setCurrentUserEmail(response.data.email);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchAllPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients/`, config);
      setPatients(response.data);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults(patients);
      return;
    }
    setIsSearching(true);
    try {
      const response = await axios.get(
        `${API}/patients/search?q=${query}`,  // ✅ fixed param name from 'query' to 'q'
        config
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
      alert('❌ Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetAIPrediction = async () => {
    if (!selectedPatient || !symptoms) {
      alert('Please select a patient and enter symptoms');
      return;
    }
    try {
      const response = await axios.post(
        `${API}/ai/predict`,  // ✅ trailing slash not needed for POST
        {
          patient_id: selectedPatient.patient_id,
          symptoms: symptoms,
          patient_location: location,  // ✅ fixed: was 'location', must be 'patient_location'
        },
        config
      );
      setAiPrediction(response.data);
      setMedicalRecordForm(prev => ({
        ...prev,
        diagnosis: response.data.predicted_disease,
        symptoms: symptoms
      }));
    } catch (error) {
      console.error('Error getting AI prediction:', error);
      alert('❌ Error getting AI prediction. Make sure you have consent for this patient.');
    }
  };

  const handleCreateMedicalRecord = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    try {
      await axios.post(
        `${API}/medical-records/`,  // ✅ trailing slash added
        {
          patient_id: selectedPatient.patient_id,
          visit_date: medicalRecordForm.visit_date,  // ✅ now included
          diagnosis: medicalRecordForm.diagnosis,
          symptoms: medicalRecordForm.symptoms,
          treatment_plan: medicalRecordForm.treatment_plan,
          notes: medicalRecordForm.notes,
        },
        config
      );
      alert('✅ Medical record created successfully!');
      setMedicalRecordForm({
        diagnosis: '',
        symptoms: '',
        treatment_plan: '',
        notes: '',
        visit_date: new Date().toISOString().split('T')[0],
      });
      setAiPrediction(null);
      setSymptoms('');
    } catch (error) {
      console.error('Error creating medical record:', error.response?.data || error);
      alert('❌ Error creating medical record: ' + JSON.stringify(error.response?.data?.detail || error.message));
    }
  };

  const handleRecordVitalSigns = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    try {
      await axios.post(
        `${API}/vital-signs/`,  // ✅ trailing slash added
        {
          patient_id: selectedPatient.patient_id,
          ...vitalSignsForm
        },
        config
      );
      alert('✅ Vital signs recorded successfully!');
      setVitalSignsForm({
        temperature: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        oxygen_saturation: ''
      });
    } catch (error) {
      console.error('Error recording vital signs:', error.response?.data || error);
      alert('❌ Error recording vital signs: ' + JSON.stringify(error.response?.data?.detail || error.message));
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    try {
      const response = await axios.post(
        `${API}/prescriptions/`,  // ✅ trailing slash added
        {
          patient_id: selectedPatient.patient_id,
          ...prescriptionForm
        },
        config
      );
      alert('✅ Prescription created!\n\n🔐 Blockchain Token:\n' + response.data.blockchain_token);
      setPrescriptionForm({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    } catch (error) {
      console.error('Error creating prescription:', error.response?.data || error);
      alert('❌ Error creating prescription: ' + JSON.stringify(error.response?.data?.detail || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="doctor-dashboard">
      <div className="doctor-header">
        <div>
          <h1>👨‍⚕️ Doctor Dashboard</h1>
          <p className="user-info">Logged in as: {currentUserEmail}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card stat-patients">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{searchResults.length}</h3>
            <p>Total Patients</p>
          </div>
        </div>
        <div className="stat-card stat-appointments">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>0</h3>
            <p>Today's Appointments</p>
          </div>
        </div>
        <div className="stat-card stat-prescriptions">
          <div className="stat-icon">💊</div>
          <div className="stat-content">
            <h3>0</h3>
            <p>Pending Prescriptions</p>
          </div>
        </div>
        {selectedPatient && (
          <div className="stat-card stat-selected">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{selectedPatient.first_name} {selectedPatient.last_name}</h3>
              <p>Currently Selected</p>
            </div>
          </div>
        )}
      </div>

      <div className="tabs">
        {['patients', 'medical-record', 'vital-signs', 'prescription'].map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {/* PATIENTS TAB */}
        {activeTab === 'patients' && (
          <div>
            <h2>Search & Select Patient</h2>
            <div className="search-section">
              <input
                type="text"
                placeholder={isSearching ? "⏳ Searching..." : "🔍 Type patient name, phone, or email..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length >= 2) handleSearch(e.target.value);
                  else if (e.target.value.length === 0) setSearchResults(patients);
                }}
                className="search-input"
                disabled={isSearching}
              />
              <button onClick={() => handleSearch(searchQuery)} className="search-btn" disabled={isSearching}>
                🔍 Search
              </button>
              <button onClick={() => { setSearchQuery(''); setSearchResults(patients); }} className="clear-btn">
                ✖ Clear
              </button>
            </div>

            <p className="results-count">
              {searchResults.length > 0 ? (
                <span className="match">✔ Found {searchResults.length} patient{searchResults.length !== 1 ? 's' : ''}</span>
              ) : (
                <span className="no-match">✖ No patients match "{searchQuery}"</span>
              )}
            </p>

            {selectedPatient && (
              <div className="selected-patient-banner">
                <div className="banner-icon">✅</div>
                <div className="banner-content">
                  <h3>{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                  <div className="patient-quick-info">
                    <span>📋 ID: {selectedPatient.patient_id}</span>
                    <span>🩸 {selectedPatient.blood_type || 'Unknown'}</span>
                    <span>📞 {selectedPatient.phone_number}</span>
                    <span>📍 {selectedPatient.city}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="deselect-btn">✖ Deselect</button>
              </div>
            )}

            <div className="patients-list">
              {searchResults.length === 0 ? (
                <div className="no-results"><p>No patients found.</p></div>
              ) : (
                searchResults.map(patient => (
                  <div
                    key={patient.patient_id}
                    className={`patient-card ${selectedPatient?.patient_id === patient.patient_id ? 'selected' : ''}`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <h3>{patient.first_name} {patient.last_name}</h3>
                    <p>📅 DOB: {patient.date_of_birth}</p>
                    <p>🩸 Blood: {patient.blood_type || 'Unknown'}</p>
                    <p>📞 Phone: {patient.phone_number || 'N/A'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MEDICAL RECORD TAB */}
        {activeTab === 'medical-record' && (
          <div>
            <h2>Create Medical Record</h2>
            {!selectedPatient && <p className="warning">⚠️ Please select a patient first!</p>}

            <div className="ai-section">
              <h3>🤖 AI Diagnostic Assistant</h3>
              <input
                type="text"
                placeholder="Enter symptoms (e.g., fever, cough, headache)"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Location (e.g., Harare, Kariba)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input"
              />
              <button onClick={handleGetAIPrediction} className="ai-btn" disabled={!selectedPatient}>
                Get AI Prediction
              </button>

              {aiPrediction && (
                <div className="ai-result">
                  <h4>✨ AI Prediction:</h4>
                  <p><strong>Disease:</strong> {aiPrediction.predicted_disease}</p>
                  <p><strong>Confidence:</strong> {aiPrediction.confidence}%</p>
                  <p><strong>Recommendation:</strong> {aiPrediction.recommendation}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateMedicalRecord}>
              {/* ✅ visit_date field added */}
              <label className="form-label">Visit Date</label>
              <input
                type="date"
                value={medicalRecordForm.visit_date}
                onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, visit_date: e.target.value })}
                required
                className="form-input"
              />
              <input
                type="text"
                placeholder="Diagnosis"
                value={medicalRecordForm.diagnosis}
                onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, diagnosis: e.target.value })}
                required
                className="form-input"
              />
              <textarea
                placeholder="Symptoms"
                value={medicalRecordForm.symptoms}
                onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, symptoms: e.target.value })}
                className="form-textarea"
              />
              <textarea
                placeholder="Treatment Plan"
                value={medicalRecordForm.treatment_plan}
                onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, treatment_plan: e.target.value })}
                className="form-textarea"
              />
              <textarea
                placeholder="Notes"
                value={medicalRecordForm.notes}
                onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, notes: e.target.value })}
                className="form-textarea"
              />
              <button type="submit" className="submit-btn" disabled={!selectedPatient}>
                Create Medical Record
              </button>
            </form>
          </div>
        )}

        {/* VITAL SIGNS TAB */}
        {activeTab === 'vital-signs' && (
          <div>
            <h2>Record Vital Signs</h2>
            {!selectedPatient && <p className="warning">⚠️ Please select a patient first!</p>}
            <form onSubmit={handleRecordVitalSigns}>
              <input type="number" step="0.1" placeholder="Temperature (°C)" value={vitalSignsForm.temperature}
                onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, temperature: e.target.value })} required className="form-input" />
              <input type="text" placeholder="Blood Pressure (e.g., 120/80)" value={vitalSignsForm.blood_pressure}
                onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, blood_pressure: e.target.value })} className="form-input" />
              <input type="number" placeholder="Heart Rate (bpm)" value={vitalSignsForm.heart_rate}
                onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, heart_rate: e.target.value })} className="form-input" />
              <input type="number" placeholder="Respiratory Rate (breaths/min)" value={vitalSignsForm.respiratory_rate}
                onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, respiratory_rate: e.target.value })} className="form-input" />
              <input type="number" placeholder="Oxygen Saturation (%)" value={vitalSignsForm.oxygen_saturation}
                onChange={(e) => setVitalSignsForm({ ...vitalSignsForm, oxygen_saturation: e.target.value })} className="form-input" />
              <button type="submit" className="submit-btn" disabled={!selectedPatient}>Record Vital Signs</button>
            </form>
          </div>
        )}

        {/* PRESCRIPTION TAB */}
        {activeTab === 'prescription' && (
          <div>
            <h2>Create Prescription</h2>
            {!selectedPatient && <p className="warning">⚠️ Please select a patient first!</p>}
            <form onSubmit={handleCreatePrescription}>
              <input type="text" placeholder="Medication Name" value={prescriptionForm.medication_name}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication_name: e.target.value })} required className="form-input" />
              <input type="text" placeholder="Dosage (e.g., 500mg)" value={prescriptionForm.dosage}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })} required className="form-input" />
              <input type="text" placeholder="Frequency (e.g., Twice daily)" value={prescriptionForm.frequency}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })} required className="form-input" />
              <input type="text" placeholder="Duration (e.g., 7 days)" value={prescriptionForm.duration}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })} className="form-input" />
              <textarea placeholder="Instructions" value={prescriptionForm.instructions}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })} className="form-textarea" />
              <button type="submit" className="submit-btn" disabled={!selectedPatient}>
                💊 Create Prescription (Blockchain)
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboard;
