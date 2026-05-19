import React, { useState } from 'react';
import axios from 'axios';
import './PharmacistInterface.css';

function PharmacistInterface() {
  const [tokenInput, setTokenInput] = useState('');
  const [prescription, setPrescription] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const handleVerifyPrescription = async () => {
    if (!tokenInput.trim()) {
      setError('Please enter a prescription token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `http://localhost:8000/prescriptions/verify/${tokenInput}`,
        config
      );
      setPrescription(response.data);
      setError('');
    } catch (err) {
      setError('❌ Prescription not found or invalid token');
      setPrescription(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    if (!prescription) return;

    try {
      await axios.patch(
        `http://localhost:8000/prescriptions/${prescription.prescription_id}/dispense`,
        {},
        config
      );
      alert('✅ Prescription dispensed successfully!');
      setPrescription({ ...prescription, dispensed: true });
    } catch (err) {
      alert('❌ Error dispensing prescription');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="pharmacist-interface">
      <div className="pharmacist-header">
        <h1>💊 Pharmacist Interface</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="verify-section">
        <h2>Verify Prescription via Blockchain</h2>
        
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter Blockchain Token from prescription"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="token-input"
            onKeyPress={(e) => e.key === 'Enter' && handleVerifyPrescription()}
          />
          <button 
            onClick={handleVerifyPrescription} 
            className="verify-btn"
            disabled={loading}
          >
            {loading ? 'Verifying...' : '🔍 Verify'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {prescription && (
          <div className="prescription-details">
            <div className="verification-badge">
              ✅ Prescription Verified via Blockchain
            </div>

            <div className="detail-grid">
              <div className="detail-row">
                <span className="label">Prescription ID:</span>
                <span className="value">{prescription.prescription_id}</span>
              </div>

              <div className="detail-row">
                <span className="label">Patient ID:</span>
                <span className="value">{prescription.patient_id}</span>
              </div>

              <div className="detail-row highlight">
                <span className="label">Medication:</span>
                <span className="value medication-name">{prescription.medication_name}</span>
              </div>

              <div className="detail-row">
                <span className="label">Dosage:</span>
                <span className="value">{prescription.dosage}</span>
              </div>

              <div className="detail-row">
                <span className="label">Frequency:</span>
                <span className="value">{prescription.frequency}</span>
              </div>

              <div className="detail-row">
                <span className="label">Duration:</span>
                <span className="value">{prescription.duration || 'As directed'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Instructions:</span>
                <span className="value">{prescription.instructions || 'None'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Blockchain Token:</span>
                <span className="value blockchain-token">{prescription.blockchain_token}</span>
              </div>

              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`status-badge ${prescription.dispensed ? 'dispensed' : 'pending'}`}>
                  {prescription.dispensed ? '✓ Dispensed' : '○ Not Dispensed'}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Prescribed On:</span>
                <span className="value">{new Date(prescription.prescribed_date).toLocaleString()}</span>
              </div>
            </div>

            {!prescription.dispensed ? (
              <button onClick={handleDispense} className="dispense-btn">
                ✅ Mark as Dispensed
              </button>
            ) : (
              <div className="dispensed-notice">
                ✓ This prescription has already been dispensed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PharmacistInterface;