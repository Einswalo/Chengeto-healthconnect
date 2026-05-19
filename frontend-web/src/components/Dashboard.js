import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [patientData, setPatientData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchPatientData();
    fetchPredictions();
    fetchPrescriptions();
  }, []);

  const fetchPatientData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/patients/me', config);
      setPatientData(response.data);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/ai/predictions', config);
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/prescriptions/my-prescriptions', config);
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  if (!patientData) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="header">
        <h1>👋 Welcome, {patientData.first_name}!</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={activeTab === 'predictions' ? 'active' : ''} 
          onClick={() => setActiveTab('predictions')}
        >
          AI Predictions
        </button>
        <button 
          className={activeTab === 'prescriptions' ? 'active' : ''} 
          onClick={() => setActiveTab('prescriptions')}
        >
          Prescriptions
        </button>
      </div>

      <div className="content">
        {activeTab === 'overview' && (
          <div className="overview">
            <div className="stat-card">
              <h3>{predictions.length}</h3>
              <p>AI Predictions</p>
            </div>
            <div className="stat-card">
              <h3>{prescriptions.length}</h3>
              <p>Prescriptions</p>
            </div>
            <div className="stat-card">
              <h3>0</h3>
              <p>Appointments</p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile">
            <h2>Patient Profile</h2>
            <div className="info-row">
              <span className="label">Name:</span>
              <span>{patientData.first_name} {patientData.last_name}</span>
            </div>
            <div className="info-row">
              <span className="label">Date of Birth:</span>
              <span>{patientData.date_of_birth}</span>
            </div>
            <div className="info-row">
              <span className="label">Gender:</span>
              <span>{patientData.gender}</span>
            </div>
            <div className="info-row">
              <span className="label">Blood Type:</span>
              <span>{patientData.blood_type || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="label">Phone:</span>
              <span>{patientData.phone_number}</span>
            </div>
            <div className="info-row">
              <span className="label">Location:</span>
              <span>{patientData.city}, {patientData.country}</span>
            </div>
            <div className="info-row">
              <span className="label">Allergies:</span>
              <span>{patientData.allergies || 'None'}</span>
            </div>
            <div className="info-row">
              <span className="label">Emergency Contact:</span>
              <span>{patientData.emergency_contact_name} ({patientData.emergency_contact_phone})</span>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="predictions">
            <h2>AI Predictions</h2>
            {predictions.length === 0 ? (
              <p>No predictions yet.</p>
            ) : (
              predictions.map(pred => (
                <div key={pred.prediction_id} className="prediction-card">
                  <h3>{pred.predicted_disease}</h3>
                  <div className="confidence">Confidence: {pred.confidence}%</div>
                  <p>{pred.recommendation}</p>
                  <small>{new Date(pred.predicted_at).toLocaleString()}</small>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="prescriptions">
            <h2>Prescriptions</h2>
            {prescriptions.length === 0 ? (
              <p>No prescriptions yet.</p>
            ) : (
              prescriptions.map(rx => (
                <div key={rx.prescription_id} className="prescription-card">
                  <h3>{rx.medication_name}</h3>
                  <p><strong>Dosage:</strong> {rx.dosage}</p>
                  <p><strong>Frequency:</strong> {rx.frequency}</p>
                  <p><strong>Duration:</strong> {rx.duration}</p>
                  <p><strong>Instructions:</strong> {rx.instructions}</p>
                  <div className="blockchain-token">
                    <small>🔐 Blockchain: {rx.blockchain_token}</small>
                  </div>
                  <div className={`status ${rx.dispensed ? 'dispensed' : 'pending'}`}>
                    {rx.dispensed ? '✓ Dispensed' : '○ Not Dispensed'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;