import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/auth/login', {
        email,
        password
      });

      localStorage.setItem('token', response.data.access_token);
      onLogin(response.data.access_token);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="login-container">
    <div className="login-box">
    <h1>🏥 CHENGETO</h1>
    <h2>HealthConnect</h2>
    <p>Patient-Centric Healthcare Platform</p>
      
      <img 
        src="/logo.png" 
        alt="Watermark Logo" 
        className="watermark-logo"
      />

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="test-accounts">
        <p>Test Accounts:</p>
        <small>Patient: hussein@chengeto.com / password123</small><br/>
        <small>Doctor: drchim@chengeto.com / password123</small>
      </div>

    </div>
  </div>
);
}

export default Login;
