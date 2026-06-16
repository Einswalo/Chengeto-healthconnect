import React, { useState } from "react";
import axios from "axios";
import "./PharmacistInterface.css";

const API = "http://localhost:8000";

function RxCard({ rx, onDispense, dispensing }) {
  return (
    <div className={`ph-rx-card ${rx.is_dispensed ? "dispensed" : "pending"}`}>
      <div className="ph-rx-header">
        <div className="ph-rx-med">💊 {rx.medication_name}</div>
        <span className={`ph-status ${rx.is_dispensed ? "dispensed" : "pending"}`}>
          {rx.is_dispensed ? "✔ Dispensed" : "⏳ Pending"}
        </span>
      </div>
      <div className="ph-rx-details">
        <div><span>Patient ID</span><strong>#{rx.patient_id}</strong></div>
        <div><span>Patient Name</span><strong>{rx.patient_name || "—"}</strong></div>
        <div><span>Dosage</span><strong>{rx.dosage}</strong></div>
        <div><span>Frequency</span><strong>{rx.frequency}</strong></div>
        <div><span>Duration</span><strong>{rx.duration || "As directed"}</strong></div>
        <div><span>Date</span><strong>{rx.prescription_date}</strong></div>
        <div><span>Doctor</span><strong>Dr. {rx.doctor_name || "—"}</strong></div>
      </div>
      {rx.instructions && <div className="ph-rx-instructions">📋 {rx.instructions}</div>}
      {!rx.is_dispensed && (
        <button 
          className="ph-dispense-btn" 
          onClick={() => onDispense(rx.prescription_id)} 
          disabled={dispensing === rx.prescription_id}
        >
          {dispensing === rx.prescription_id ? "⏳ Dispensing..." : "✅ Dispense Medication"}
        </button>
      )}
      {rx.is_dispensed && (
        <div className="ph-dispensed-notice">✔ Already dispensed on {new Date(rx.dispensed_at).toLocaleDateString()}</div>
      )}
    </div>
  );
}

export default function PharmacistDashboard() {
  const [tokenInput, setTokenInput] = useState("");
  const [verifiedRx, setVerifiedRx] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [dispensing, setDispensing] = useState(null);
  const [pharmacistEmail, setPharmacistEmail] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  React.useEffect(() => {
    fetchCurrentUser();
    // Load search history from localStorage
    const savedHistory = localStorage.getItem("pharmacy_search_history");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, config);
      setPharmacistEmail(res.data.email);
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleVerify = async () => {
    if (!tokenInput.trim()) { 
      setVerifyError("Please enter a prescription token"); 
      return; 
    }
    
    setVerifying(true);
    setVerifyError("");
    setVerifiedRx(null);
    
    try {
      const res = await axios.get(`${API}/prescriptions/verify/${tokenInput.trim()}`, config);
      setVerifiedRx(res.data);
      
      // Add to search history
      const newHistory = [
        { 
          token: tokenInput.trim(), 
          timestamp: new Date().toISOString(),
          patient_name: `${res.data.patient?.first_name || ""} ${res.data.patient?.last_name || ""}`,
          medication: res.data.medication_name,
          is_dispensed: res.data.is_dispensed
        },
        ...searchHistory.slice(0, 9)
      ];
      setSearchHistory(newHistory);
      localStorage.setItem("pharmacy_search_history", JSON.stringify(newHistory));
      
    } catch (err) {
      if (err.response?.status === 404) {
        setVerifyError("❌ Prescription not found. Invalid or expired token.");
      } else {
        setVerifyError("❌ " + (err.response?.data?.detail || "Error verifying prescription"));
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleDispense = async (prescriptionId) => {
    setDispensing(prescriptionId);
    try {
      await axios.put(`${API}/prescriptions/${prescriptionId}/dispense`, {}, config);
      alert("✅ Prescription dispensed successfully!");
      
      // Update the verifiedRx to show as dispensed
      setVerifiedRx(prev => ({ ...prev, is_dispensed: true, dispensed_at: new Date().toISOString() }));
      
      // Update search history to mark as dispensed
      const updatedHistory = searchHistory.map(item => 
        item.token === tokenInput ? { ...item, is_dispensed: true } : item
      );
      setSearchHistory(updatedHistory);
      localStorage.setItem("pharmacy_search_history", JSON.stringify(updatedHistory));
      
      // Clear the input after successful dispense
      setTokenInput("");
      setVerifiedRx(null);
      
    } catch (err) {
      alert("❌ " + (err.response?.data?.detail || "Error dispensing prescription"));
    } finally {
      setDispensing(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  const handleClearSearch = () => {
    setTokenInput("");
    setVerifiedRx(null);
    setVerifyError("");
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("pharmacy_search_history");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className={`pharmacist-root ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <aside className="pharmacist-sidebar">
        <div className="pharmacist-brand">
          <div className="pharmacist-logo">💊</div>
          {sidebarOpen && <span className="pharmacist-title">CHENGETO PHARMACY</span>}
        </div>
        <nav className="pharmacist-nav">
          <button className={`pharmacist-nav-item active`}>
            <span className="pharmacist-nav-icon">🔍</span>
            {sidebarOpen && <span className="pharmacist-nav-label">Verify & Dispense</span>}
          </button>
        </nav>
        <div className="pharmacist-sidebar-footer">
          {sidebarOpen && (
            <div className="pharmacist-info">
              <div className="pharmacist-avatar">💊</div>
              <div>
                <div className="pharmacist-name">Pharmacist</div>
                <div className="pharmacist-email">{pharmacistEmail}</div>
              </div>
            </div>
          )}
          <button className="pharmacist-nav-item" onClick={handleLogout}>
            <span className="pharmacist-nav-icon">🚪</span>
            {sidebarOpen && <span className="pharmacist-nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="pharmacist-main">
        <div className="pharmacist-topbar">
          <button className="pharmacist-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div className="pharmacist-topbar-title">🔍 Verify & Dispense Prescription</div>
          <div className="pharmacist-topbar-right">
            <span className="pharmacist-role">Pharmacist</span>
          </div>
        </div>

        <div className="pharmacist-content">
          {/* Instructions Card */}
          <div className="pharmacist-instructions">
            <div className="pharmacist-instructions-icon">📋</div>
            <div>
              <h3>How to Dispense a Prescription</h3>
              <p>1. Ask the patient for their prescription token (found on their prescription)</p>
              <p>2. Enter the token in the search box below</p>
              <p>3. Verify the prescription details match the patient</p>
              <p>4. Click "Dispense Medication" to complete the process</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="pharmacist-verify-section">
            <h2>🔍 Enter Prescription Token</h2>
            <div className="pharmacist-verify-bar">
              <input 
                className="pharmacist-token-input" 
                type="text" 
                placeholder="Enter blockchain token (e.g., RX-ABC123DEF456...)" 
                value={tokenInput} 
                onChange={e => setTokenInput(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <button 
                className="pharmacist-verify-btn" 
                onClick={handleVerify} 
                disabled={verifying || !tokenInput.trim()}
              >
                {verifying ? "⏳ Verifying..." : "🔍 Verify Prescription"}
              </button>
              {tokenInput && (
                <button className="pharmacist-clear-btn" onClick={handleClearSearch}>
                  ✕ Clear
                </button>
              )}
            </div>
            {verifyError && <div className="pharmacist-error">{verifyError}</div>}
          </div>

          {/* Verified Prescription Result */}
          {verifiedRx && (
            <div className="pharmacist-result-section">
              <div className="pharmacist-verify-success">
                ✅ Prescription Verified via Blockchain — Token is authentic
              </div>
              <RxCard rx={verifiedRx} onDispense={handleDispense} dispensing={dispensing} />
            </div>
          )}

          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <div className="pharmacist-history-section">
              <div className="pharmacist-history-header">
                <h3>📜 Recent Searches</h3>
                <button className="pharmacist-clear-history-btn" onClick={handleClearHistory}>
                  Clear History
                </button>
              </div>
              <div className="pharmacist-history-list">
                {searchHistory.map((item, index) => (
                  <div 
                    key={index} 
                    className={`pharmacist-history-item ${item.is_dispensed ? "dispensed" : ""}`}
                    onClick={() => {
                      setTokenInput(item.token);
                      handleVerify();
                    }}
                  >
                    <div className="pharmacist-history-token">🔐 {item.token}</div>
                    <div className="pharmacist-history-details">
                      <span>👤 {item.patient_name || "Unknown"}</span>
                      <span>💊 {item.medication}</span>
                      <span className={`pharmacist-history-status ${item.is_dispensed ? "dispensed" : "pending"}`}>
                        {item.is_dispensed ? "✓ Dispensed" : "⏳ Pending"}
                      </span>
                    </div>
                    <div className="pharmacist-history-time">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!verifiedRx && !verifyError && !searchHistory.length && (
            <div className="pharmacist-empty">
              <div className="pharmacist-empty-icon">🔐</div>
              <h3>No Prescription Loaded</h3>
              <p>Enter a prescription token above to verify and dispense medication.</p>
              <p className="pharmacist-empty-note">Tokens are provided to patients by their doctors.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}