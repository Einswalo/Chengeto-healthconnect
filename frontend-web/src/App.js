import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
// In App.js, right after the imports
import PatientDashboard from './components/PatientsDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacistDashboard from './components/PharmacistInterface';
import NurseDashboard from './components/NurseDashboard';
import AdminDashboard from './components/AdminDashboard';

// Add these debug logs
console.log('PatientDashboard:', PatientDashboard);
console.log('DoctorDashboard:', DoctorDashboard);
console.log('PharmacistDashboard:', PharmacistDashboard);
console.log('NurseDashboard:', NurseDashboard);
console.log('AdminDashboard:', AdminDashboard);
const API = 'http://localhost:8000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserRole = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const role = response.data.role || response.data.user_type;
      setUserRole(role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUserRole(null);
    setLoading(true);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0fdf4',
        gap: '16px'
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid #bbf7d0',
          borderTop: '3px solid #16a34a',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748b', fontFamily: 'Inter, sans-serif', fontSize: '15px' }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  if (!userRole) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        justifyContent: 'center', alignItems: 'center',
        background: '#f0fdf4'
      }}>
        <p style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
          Loading your profile...
        </p>
      </div>
    );
  }

  // Role-based routing
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'nurse':
      return <NurseDashboard />;
    case 'pharmacist':
      return <PharmacistDashboard />;
    case 'patient':
      return <PatientDashboard />;
    default:
      localStorage.removeItem('token');
      return <Login onLogin={handleLogin} />;
  }
}

export default App;