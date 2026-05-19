import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacistInterface from './components/PharmacistInterface';

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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('http://localhost:8000/auth/me', config);
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '24px',
        color: '#667eea'
      }}>
        Loading...
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={(newToken) => setToken(newToken)} />;
  }

  // Route based on user role
  if (userRole === 'doctor' || userRole === 'nurse') {
    return <DoctorDashboard />;
  }

  if (userRole === 'pharmacist') {
    return <PharmacistInterface />;
  }

  // Default to patient dashboard
  return <Dashboard />;
}

export default App;