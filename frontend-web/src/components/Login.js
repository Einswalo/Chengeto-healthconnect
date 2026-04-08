import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

function Login({ onGoToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const stringifyError = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return v.map(stringifyError).filter(Boolean).join('\n');
    if (typeof v === 'object') {
      if ('detail' in v) return stringifyError(v.detail);
      if ('msg' in v && typeof v.msg === 'string') return v.msg;
      try {
        return JSON.stringify(v, null, 2);
      } catch {
        return String(v);
      }
    }
    return String(v);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${apiBaseUrl}/auth/login`, {
        email: email,
        password: password
      });

      // Store token
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('email', email);
      
      window.location.reload();
             // This will trigger App.js to show Dashboard


    } catch (err) {
      setError(stringifyError(err.response?.data?.detail || err.message || 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>CHENGETO HealthConnect</h1>
          <p>Healthcare Data Management System</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="link-button"
            onClick={onGoToRegister}
          >
            Create a patient account
          </button>
          <p>Test Accounts:</p>
          <p>Doctor: drchim@chengeto.com / password123</p>
          <p>Patient: hussein@chengeto.com / password123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;