import React, { useMemo, useState } from 'react';
import axios from 'axios';
import './Register.css';

function Register({ onGoToLogin }) {
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    phone_number: '',
    address: '',
    city: '',
    national_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_type: '',
    allergies: '',
    chronic_conditions: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canSubmit = useMemo(() => {
    return (
      form.first_name &&
      form.last_name &&
      form.date_of_birth &&
      form.email &&
      form.password
    );
  }, [form]);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post(`${apiBaseUrl}/patients/register`, {
        email: form.email,
        password: form.password,
        user_type: 'patient',
        first_name: form.first_name,
        last_name: form.last_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender || null,
        phone_number: form.phone_number || null,
        address: form.address || null,
        city: form.city || null,
        national_id: form.national_id || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        blood_type: form.blood_type || null,
        allergies: form.allergies || null,
        chronic_conditions: form.chronic_conditions || null,
      });

      setSuccess('Registration successful. You can now log in.');
      setTimeout(() => onGoToLogin?.(), 700);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Create patient account</h1>
          <p>Register once, then your doctor can add clinical notes and prescriptions.</p>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
          <div className="grid">
            <div className="form-group">
              <label>First name *</label>
              <input value={form.first_name} onChange={update('first_name')} required />
            </div>
            <div className="form-group">
              <label>Last name *</label>
              <input value={form.last_name} onChange={update('last_name')} required />
            </div>
            <div className="form-group">
              <label>Date of birth *</label>
              <input type="date" value={form.date_of_birth} onChange={update('date_of_birth')} required />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={update('gender')}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid">
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={update('email')} required />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input type="password" value={form.password} onChange={update('password')} required />
            </div>
          </div>

          <div className="grid">
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone_number} onChange={update('phone_number')} />
            </div>
            <div className="form-group">
              <label>City</label>
              <input value={form.city} onChange={update('city')} />
            </div>
            <div className="form-group">
              <label>National ID</label>
              <input value={form.national_id} onChange={update('national_id')} />
            </div>
            <div className="form-group">
              <label>Blood type</label>
              <input value={form.blood_type} onChange={update('blood_type')} placeholder="e.g. O+" />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input value={form.address} onChange={update('address')} />
          </div>

          <div className="grid">
            <div className="form-group">
              <label>Emergency contact name</label>
              <input value={form.emergency_contact_name} onChange={update('emergency_contact_name')} />
            </div>
            <div className="form-group">
              <label>Emergency contact phone</label>
              <input value={form.emergency_contact_phone} onChange={update('emergency_contact_phone')} />
            </div>
          </div>

          <div className="grid">
            <div className="form-group">
              <label>Allergies</label>
              <input value={form.allergies} onChange={update('allergies')} />
            </div>
            <div className="form-group">
              <label>Chronic conditions</label>
              <input value={form.chronic_conditions} onChange={update('chronic_conditions')} />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="register-button" disabled={loading || !canSubmit}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <div className="register-footer">
          <button type="button" className="link-button" onClick={onGoToLogin}>
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;

