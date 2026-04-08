import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const api = axios.create({ baseURL: apiBaseUrl, timeout: 15000 });

  const fetchUserData = useCallback(async () => {
    try {
      setError('');
      // Get current user
      const userResponse = await api.get(`/auth/me?token=${token}`);
      setUser(userResponse.data);

      // If patient, load patient-centric data
      if (userResponse.data.user_type === 'patient') {
        const patientResponse = await api.get(`/patients/me?token=${token}`);
        const p = patientResponse.data;
        setPatient(p);

        // Get AI predictions
        const predictionsResponse = await api.get(`/ai/predictions/patient/${p.patient_id}?token=${token}`);
        setPredictions(Array.isArray(predictionsResponse.data) ? predictionsResponse.data : []);

        // Get prescriptions
        const prescriptionsResponse = await api.get(`/prescriptions/patient/${p.patient_id}?token=${token}`);
        setPrescriptions(Array.isArray(prescriptionsResponse.data) ? prescriptionsResponse.data : []);
      }

      // Load blockchain integrity status (best-effort; any authenticated user)
      try {
        const bc = await api.get(`/blockchain/verify?token=${token}`);
        setBlockchainStatus(bc.data);
      } catch (_e) {
        setBlockchainStatus(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data. Please check that the backend is running and try again.');
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    window.location.reload();
  };

  const statValue = (value) => (value === null || value === undefined ? '—' : value);

  const pendingPrescriptions = prescriptions.filter(p => !p.is_dispensed).length;
  const dispensedPrescriptions = prescriptions.filter(p => p.is_dispensed).length;

  const tabs = (() => {
    const base = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'predictions', label: 'AI Predictions', icon: '🤖' },
      { id: 'prescriptions', label: 'Prescriptions', icon: '💊' },
      { id: 'blockchain', label: 'Blockchain', icon: '🔗' },
    ];

    if (user?.user_type === 'patient') {
      base.splice(1, 0, { id: 'profile', label: 'My Profile', icon: '👤' });
    }

    return base;
  })();

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
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">CH</div>
            <div className="brand-text">
              <h1>CHENGETO HealthConnect</h1>
              <p className="user-role">{user?.user_type?.toUpperCase() || 'USER'}</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="header-meta">
            <div className="meta-item">
              <div className="meta-label">Signed in</div>
              <div className="meta-value">{email}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">API</div>
              <div className="meta-value">{apiBaseUrl.replace(/^https?:\/\//, '')}</div>
            </div>
          </div>
          <button onClick={fetchUserData} className="ghost-btn" type="button">Refresh</button>
          <button onClick={handleLogout} className="logout-btn" type="button">Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav>
            {tabs.map(t => (
              <button
                key={t.id}
                className={activeTab === t.id ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveTab(t.id)}
                type="button"
              >
                <span className="nav-icon" aria-hidden="true">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-note">
              <div className="sidebar-note-title">Prototype dashboard</div>
              <div className="sidebar-note-body">
                This is a working UI that reads from your FastAPI backend. Add <code>REACT_APP_API_URL</code> if your API isn’t on localhost.
              </div>
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="main-panel">
          {error && (
            <div className="banner banner-error" role="alert">
              <div className="banner-title">Dashboard error</div>
              <div className="banner-body">{error}</div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="page-head">
                <div>
                  <h2>Dashboard</h2>
                  <p className="page-subtitle">
                    Welcome, {patient?.first_name || user?.email || 'User'}.
                    {' '}
                    Here’s what’s happening in your health profile and verification layer.
                  </p>
                </div>
                <div className="page-actions">
                  <button className="primary-btn" onClick={() => setActiveTab('blockchain')} type="button">
                    Verify integrity
                  </button>
                </div>
              </div>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{statValue(predictions.length)}</div>
                  <div className="stat-label">AI Predictions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{statValue(prescriptions.length)}</div>
                  <div className="stat-label">Prescriptions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{statValue(pendingPrescriptions)}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card accent">
                  <div className="stat-number">{statValue(blockchainStatus?.total_blocks)}</div>
                  <div className="stat-label">Blockchain Blocks</div>
                </div>
              </div>

              <div className="grid-2">
                <section className="panel">
                  <div className="panel-head">
                    <h3>Verification status</h3>
                    <div className={`pill ${blockchainStatus?.status === 'valid' ? 'pill-ok' : blockchainStatus?.status ? 'pill-warn' : 'pill-neutral'}`}>
                      {blockchainStatus?.status ? String(blockchainStatus.status).toUpperCase() : 'UNKNOWN'}
                    </div>
                  </div>
                  <div className="panel-body">
                    <div className="kv">
                      <div className="kv-item">
                        <div className="kv-label">Chain valid</div>
                        <div className="kv-value">{String(!!blockchainStatus?.chain_valid)}</div>
                      </div>
                      <div className="kv-item">
                        <div className="kv-label">Total blocks</div>
                        <div className="kv-value">{statValue(blockchainStatus?.total_blocks)}</div>
                      </div>
                      <div className="kv-item">
                        <div className="kv-label">Latest block</div>
                        <div className="kv-value mono">{blockchainStatus?.latest_block ? String(blockchainStatus.latest_block).slice(0, 18) + '…' : '—'}</div>
                      </div>
                      <div className="kv-item">
                        <div className="kv-label">Distribution</div>
                        <div className="kv-value">
                          {blockchainStatus?.block_distribution
                            ? Object.entries(blockchainStatus.block_distribution).map(([k, v]) => `${k}:${v}`).join('  ')
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <h3>Prescription activity</h3>
                    <div className="panel-subhead">Pending vs dispensed</div>
                  </div>
                  <div className="panel-body">
                    <div className="mini-bars" role="img" aria-label="Prescription status chart">
                      <div className="mini-bar">
                        <div className="mini-bar-label">Pending</div>
                        <div className="mini-bar-track">
                          <div className="mini-bar-fill warn" style={{ width: `${prescriptions.length ? (pendingPrescriptions / prescriptions.length) * 100 : 0}%` }} />
                        </div>
                        <div className="mini-bar-value">{pendingPrescriptions}</div>
                      </div>
                      <div className="mini-bar">
                        <div className="mini-bar-label">Dispensed</div>
                        <div className="mini-bar-track">
                          <div className="mini-bar-fill ok" style={{ width: `${prescriptions.length ? (dispensedPrescriptions / prescriptions.length) * 100 : 0}%` }} />
                        </div>
                        <div className="mini-bar-value">{dispensedPrescriptions}</div>
                      </div>
                    </div>
                    <div className="helper">
                      Tip: for pharmacists, use the <strong>Dispense</strong> action in your API to mark a prescription as completed.
                    </div>
                  </div>
                </section>
              </div>

              <div className="grid-2">
                <section className="panel">
                  <div className="panel-head">
                    <h3>Latest AI prediction</h3>
                    <div className="panel-subhead">Most recent diagnosis and confidence</div>
                  </div>
                  <div className="panel-body">
                    {predictions.length > 0 ? (
                      <div className="prediction-highlight">
                        <div className="prediction-disease">{predictions[0].predicted_condition}</div>
                        <div className="prediction-confidence">Confidence: {predictions[0].confidence_score}%</div>
                        <div className="prediction-date">{new Date(predictions[0].prediction_date).toLocaleString()}</div>
                      </div>
                    ) : (
                      <div className="empty-card">No AI predictions yet.</div>
                    )}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <h3>Latest prescription</h3>
                    <div className="panel-subhead">Most recent medication and status</div>
                  </div>
                  <div className="panel-body">
                    {prescriptions.length > 0 ? (
                      <div className="rx-highlight">
                        <div className="rx-name">{prescriptions[0].medication_name}</div>
                        <div className="rx-meta">
                          <span className={`status-badge ${prescriptions[0].is_dispensed ? 'dispensed' : 'pending'}`}>
                            {prescriptions[0].is_dispensed ? 'Dispensed' : 'Pending'}
                          </span>
                          <span className="rx-date">{new Date(prescriptions[0].prescription_date).toLocaleDateString()}</span>
                        </div>
                        <div className="rx-details">
                          <div><strong>Dosage:</strong> {prescriptions[0].dosage}</div>
                          <div><strong>Frequency:</strong> {prescriptions[0].frequency}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-card">No prescriptions yet.</div>
                    )}
                  </div>
                </section>
              </div>
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

          {activeTab === 'blockchain' && (
            <div className="tab-content">
              <div className="page-head">
                <div>
                  <h2>Blockchain Verification</h2>
                  <p className="page-subtitle">Verify integrity of consent, prescriptions, and emergency access audit trail.</p>
                </div>
                <div className="page-actions">
                  <button className="primary-btn" onClick={fetchUserData} type="button">Re-verify</button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h3>Chain status</h3>
                  <div className={`pill ${blockchainStatus?.status === 'valid' ? 'pill-ok' : blockchainStatus?.status ? 'pill-warn' : 'pill-neutral'}`}>
                    {blockchainStatus?.status ? String(blockchainStatus.status).toUpperCase() : 'UNKNOWN'}
                  </div>
                </div>
                <div className="panel-body">
                  {blockchainStatus ? (
                    <div className="kv">
                      <div className="kv-item">
                        <div className="kv-label">Message</div>
                        <div className="kv-value">{blockchainStatus.message || '—'}</div>
                      </div>
                      <div className="kv-item">
                        <div className="kv-label">Total blocks</div>
                        <div className="kv-value">{statValue(blockchainStatus.total_blocks)}</div>
                      </div>
                      <div className="kv-item">
                        <div className="kv-label">Genesis</div>
                        <div className="kv-value mono">{blockchainStatus.genesis_block ? String(blockchainStatus.genesis_block).slice(0, 18) + '…' : '—'}</div>
                      </div>
                      <div className="kv-item">
                        <div className="kv-label">Latest</div>
                        <div className="kv-value mono">{blockchainStatus.latest_block ? String(blockchainStatus.latest_block).slice(0, 18) + '…' : '—'}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-card">
                      Blockchain status not available. Make sure your backend has the <code>/blockchain/verify</code> route enabled.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;