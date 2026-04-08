import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get current user
      const userResponse = await axios.get(`http://localhost:8000/auth/me?token=${token}`);
      setUser(userResponse.data);

      // If patient, get patient profile
      if (userResponse.data.user_type === 'patient') {
        const patientResponse = await axios.get(`http://localhost:8000/patients/me?token=${token}`);
        setPatient(patientResponse.data);

        // Get AI predictions
        const predictionsResponse = await axios.get(
          `http://localhost:8000/ai/predictions/patient/${patientResponse.data.patient_id}?token=${token}`
        );
        setPredictions(predictionsResponse.data);

        // Get prescriptions
        const prescriptionsResponse = await axios.get(
          `http://localhost:8000/prescriptions/patient/${patientResponse.data.patient_id}?token=${token}`
        );
        setPrescriptions(prescriptionsResponse.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>CHENGETO HealthConnect</h1>
          <p className="user-role">{user?.user_type?.toUpperCase()}</p>
        </div>
        <div className="header-right">
          <span className="user-email">{email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav>
            <button 
              className={activeTab === 'overview' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={activeTab === 'profile' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setActiveTab('profile')}
            >
              👤 My Profile
            </button>
            <button 
              className={activeTab === 'predictions' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setActiveTab('predictions')}
            >
              🤖 AI Predictions
            </button>
            <button 
              className={activeTab === 'prescriptions' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setActiveTab('prescriptions')}
            >
              💊 Prescriptions
            </button>
          </nav>
        </aside>

        {/* Main Panel */}
        <main className="main-panel">
          {activeTab === 'overview' && (
            <div className="tab-content">
              <h2>Welcome, {patient?.first_name || user?.email}!</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{predictions.length}</div>
                  <div className="stat-label">AI Predictions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{prescriptions.length}</div>
                  <div className="stat-label">Prescriptions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {prescriptions.filter(p => !p.is_dispensed).length}
                  </div>
                  <div className="stat-label">Pending</div>
                </div>
              </div>

              {predictions.length > 0 && (
                <div className="recent-section">
                  <h3>Latest AI Prediction</h3>
                  <div className="prediction-highlight">
                    <div className="prediction-disease">{predictions[0].predicted_condition}</div>
                    <div className="prediction-confidence">
                      Confidence: {predictions[0].confidence_score}%
                    </div>
                    <div className="prediction-date">
                      {new Date(predictions[0].prediction_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && patient && (
            <div className="tab-content">
              <h2>Patient Profile</h2>
              <div className="profile-grid">
                <div className="profile-item">
                  <label>Full Name</label>
                  <div>{patient.first_name} {patient.last_name}</div>
                </div>
                <div className="profile-item">
                  <label>Date of Birth</label>
                  <div>{patient.date_of_birth}</div>
                </div>
                <div className="profile-item">
                  <label>Gender</label>
                  <div>{patient.gender}</div>
                </div>
                <div className="profile-item">
                  <label>Blood Type</label>
                  <div>{patient.blood_type || 'Not specified'}</div>
                </div>
                <div className="profile-item">
                  <label>Phone</label>
                  <div>{patient.phone_number}</div>
                </div>
                <div className="profile-item">
                  <label>City</label>
                  <div>{patient.city}</div>
                </div>
                <div className="profile-item full-width">
                  <label>Allergies</label>
                  <div>{patient.allergies || 'None'}</div>
                </div>
                <div className="profile-item full-width">
                  <label>Chronic Conditions</label>
                  <div>{patient.chronic_conditions || 'None'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="tab-content">
              <h2>AI Disease Predictions</h2>
              {predictions.length === 0 ? (
                <p className="empty-state">No AI predictions yet.</p>
              ) : (
                <div className="predictions-list">
                  {predictions.map(pred => (
                    <div key={pred.prediction_id} className="prediction-card">
                      <div className="prediction-header">
                        <span className="disease-name">{pred.predicted_condition}</span>
                        <span className={`confidence-badge ${pred.confidence_score >= 80 ? 'high' : pred.confidence_score >= 60 ? 'medium' : 'low'}`}>
                          {pred.confidence_score}% confidence
                        </span>
                      </div>
                      <div className="prediction-body">
                        <p><strong>Symptoms:</strong> {pred.symptoms}</p>
                        <p><strong>AI Model:</strong> {pred.ai_model_version}</p>
                        <p><strong>Date:</strong> {new Date(pred.prediction_date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="tab-content">
              <h2>My Prescriptions</h2>
              {prescriptions.length === 0 ? (
                <p className="empty-state">No prescriptions yet.</p>
              ) : (
                <div className="prescriptions-list">
                  {prescriptions.map(rx => (
                    <div key={rx.prescription_id} className="prescription-card">
                      <div className="prescription-header">
                        <span className="medication-name">{rx.medication_name}</span>
                        <span className={`status-badge ${rx.is_dispensed ? 'dispensed' : 'pending'}`}>
                          {rx.is_dispensed ? 'Dispensed' : 'Pending'}
                        </span>
                      </div>
                      <div className="prescription-body">
                        <p><strong>Dosage:</strong> {rx.dosage}</p>
                        <p><strong>Frequency:</strong> {rx.frequency}</p>
                        <p><strong>Duration:</strong> {rx.duration}</p>
                        {rx.instructions && <p><strong>Instructions:</strong> {rx.instructions}</p>}
                        <p><strong>Date:</strong> {new Date(rx.prescription_date).toLocaleDateString()}</p>
                        <p className="blockchain-token"><strong>Blockchain Token:</strong> {rx.blockchain_token}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;