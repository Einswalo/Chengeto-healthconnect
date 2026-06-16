import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const API = 'http://localhost:8000';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [adminEmail, setAdminEmail] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Facility Form
  const [facilityForm, setFacilityForm] = useState({
    facility_name: '', facility_type: '', city: '',
    address: '', phone_number: '', email: ''
  });
  const [facilityMsg, setFacilityMsg] = useState('');

  // Provider Form
  const [providerForm, setProviderForm] = useState({
    email: '', password: '', user_type: 'doctor',
    first_name: '', last_name: '', provider_type: 'Doctor',
    specialization: '', license_number: '', phone_number: '',
    facility_id: ''
  });
  const [providerMsg, setProviderMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Provider Modal
  const [editingProvider, setEditingProvider] = useState(null);
  const [editProviderForm, setEditProviderForm] = useState({
    first_name: '', last_name: '', provider_type: '',
    specialization: '', license_number: '', phone_number: '',
    facility_id: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [me, fac, prov] = await Promise.all([
        axios.get(`${API}/auth/me`, config),
        axios.get(`${API}/facilities/`, config).catch(() => ({ data: [] })),
        axios.get(`${API}/providers/`, config).catch(() => ({ data: [] })),
      ]);
      setAdminEmail(me.data.email);
      setFacilities(fac.data);
      setProviders(prov.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFacility = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFacilityMsg('');
    try {
      await axios.post(`${API}/facilities/`, facilityForm, config);
      setFacilityMsg('✅ Facility registered successfully!');
      setFacilityForm({ facility_name: '', facility_type: '', city: '', address: '', phone_number: '', email: '' });
      fetchAll();
    } catch (err) {
      setFacilityMsg('❌ ' + (err.response?.data?.detail || 'Failed to register facility'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterProvider = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setProviderMsg('');
    try {
      await axios.post(`${API}/providers/register`, providerForm, config);
      setProviderMsg('✅ Provider registered successfully!');
      setProviderForm({
        email: '', password: '', user_type: 'doctor',
        first_name: '', last_name: '', provider_type: 'Doctor',
        specialization: '', license_number: '', phone_number: '',
        facility_id: ''
      });
      fetchAll();
    } catch (err) {
      setProviderMsg('❌ ' + (err.response?.data?.detail || 'Failed to register provider'));
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ NEW: Open Edit Provider Modal
  const openEditModal = (provider) => {
    setEditingProvider(provider);
    setEditProviderForm({
      first_name: provider.first_name || '',
      last_name: provider.last_name || '',
      provider_type: provider.provider_type || '',
      specialization: provider.specialization || '',
      license_number: provider.license_number || '',
      phone_number: provider.phone_number || '',
      facility_id: provider.facility_id || ''
    });
    setEditMsg('');
  };

  // ✅ NEW: Update Provider
  const handleUpdateProvider = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMsg('');
    try {
      // Update provider profile
      await axios.put(`${API}/providers/${editingProvider.provider_id}`, editProviderForm, config);
      setEditMsg('✅ Provider updated successfully!');
      setTimeout(() => {
        setEditingProvider(null);
        fetchAll();
      }, 1500);
    } catch (err) {
      setEditMsg('❌ ' + (err.response?.data?.detail || 'Failed to update provider'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const setF = (field) => (e) => setFacilityForm(f => ({ ...f, [field]: e.target.value }));
  const setP = (field) => (e) => setProviderForm(f => ({ ...f, [field]: e.target.value }));
  const setEP = (field) => (e) => setEditProviderForm(f => ({ ...f, [field]: e.target.value }));

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'facilities', icon: '🏥', label: 'Facilities' },
    { id: 'add-facility', icon: '➕', label: 'Add Facility' },
    { id: 'providers', icon: '👨‍⚕️', label: 'Providers' },
    { id: 'add-provider', icon: '➕', label: 'Add Provider' },
  ];

  return (
    <div className={`admin-root ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">🏥</div>
          {sidebarOpen && <span className="admin-brand-name">CHENGETO ADMIN</span>}
        </div>
        <nav className="admin-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeSection === item.id ? 'admin-nav-active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="admin-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          {sidebarOpen && (
            <div className="admin-info">
              <div className="admin-avatar">A</div>
              <div>
                <div className="admin-name">Administrator</div>
                <div className="admin-email">{adminEmail}</div>
              </div>
            </div>
          )}
          <button className="admin-nav-item" onClick={handleLogout}>
            <span className="admin-nav-icon">🚪</span>
            {sidebarOpen && <span className="admin-nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <button className="admin-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div className="admin-topbar-title">
            {navItems.find(n => n.id === activeSection)?.icon} {navItems.find(n => n.id === activeSection)?.label}
          </div>
          <div className="admin-topbar-right">
            <span className="admin-role-badge">Admin</span>
            <span className="admin-topbar-email">{adminEmail}</span>
          </div>
        </div>

        <div className="admin-content">
          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <div>
              <div className="admin-section-heading">
                <h2>System Overview</h2>
                <p>CHENGETO HealthConnect — Admin Control Panel</p>
              </div>

              <div className="admin-stats-grid">
                <div className="admin-stat" style={{ '--c': '#1d4ed8' }}>
                  <div className="admin-stat-icon">🏥</div>
                  <div className="admin-stat-val">{facilities.length}</div>
                  <div className="admin-stat-lbl">Facilities</div>
                </div>
                <div className="admin-stat" style={{ '--c': '#16a34a' }}>
                  <div className="admin-stat-icon">👨‍⚕️</div>
                  <div className="admin-stat-val">{providers.length}</div>
                  <div className="admin-stat-lbl">Providers</div>
                </div>
                <div className="admin-stat" style={{ '--c': '#ca8a04' }}>
                  <div className="admin-stat-icon">👥</div>
                  <div className="admin-stat-val">{providers.filter(p => p.provider_type === 'Doctor').length}</div>
                  <div className="admin-stat-lbl">Doctors</div>
                </div>
                <div className="admin-stat" style={{ '--c': '#0891b2' }}>
                  <div className="admin-stat-icon">💊</div>
                  <div className="admin-stat-val">{providers.filter(p => p.provider_type === 'Pharmacist').length}</div>
                  <div className="admin-stat-lbl">Pharmacists</div>
                </div>
              </div>

              <div className="admin-quick-section">
                <h3>Quick Actions</h3>
                <div className="admin-quick-btns">
                  <button className="admin-quick-btn" onClick={() => setActiveSection('add-facility')}>🏥 Register Facility</button>
                  <button className="admin-quick-btn" onClick={() => setActiveSection('add-provider')}>👨‍⚕️ Register Provider</button>
                  <button className="admin-quick-btn" onClick={() => setActiveSection('facilities')}>🔍 Manage Facilities</button>
                  <button className="admin-quick-btn" onClick={() => setActiveSection('providers')}>👥 View Providers</button>
                </div>
              </div>

              <div className="admin-cards-row">
                <div className="admin-info-card">
                  <h4>👨‍⚕️ Providers by Type</h4>
                  {['Doctor', 'Nurse', 'Pharmacist', 'Receptionist'].map(type => {
                    const count = providers.filter(p => p.provider_type === type).length;
                    return (
                      <div key={type} className="admin-bar-row">
                        <span className="admin-bar-label">{type}</span>
                        <div className="admin-bar-track">
                          <div className="admin-bar-fill" style={{ width: providers.length ? `${(count / providers.length) * 100}%` : '0%' }} />
                        </div>
                        <span className="admin-bar-count">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="admin-info-card">
                  <h4>🏥 Facilities by Type</h4>
                  {['Hospital', 'Clinic', 'Pharmacy', 'Health Center'].map(type => {
                    const count = facilities.filter(f => f.facility_type === type).length;
                    return (
                      <div key={type} className="admin-bar-row">
                        <span className="admin-bar-label">{type}</span>
                        <div className="admin-bar-track">
                          <div className="admin-bar-fill admin-bar-green" style={{ width: facilities.length ? `${(count / facilities.length) * 100}%` : '0%' }} />
                        </div>
                        <span className="admin-bar-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Facilities List */}
          {activeSection === 'facilities' && (
            <div>
              <div className="admin-section-heading">
                <h2>Facilities</h2>
                <button className="admin-btn-primary" onClick={() => setActiveSection('add-facility')}>➕ Add Facility</button>
              </div>
              {loading ? <div className="admin-loading">⏳ Loading...</div> :
                facilities.length === 0 ? (
                  <div className="admin-empty">
                    <div className="admin-empty-icon">🏥</div>
                    <p>No facilities registered yet.</p>
                    <button className="admin-btn-primary" onClick={() => setActiveSection('add-facility')}>Register First Facility</button>
                  </div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr><th>ID</th><th>Facility Name</th><th>Type</th><th>City</th><th>Phone</th><th>Email</th></tr>
                      </thead>
                      <tbody>
                        {facilities.map((f, i) => (
                          <tr key={f.facility_id}>
                            <td>{i + 1}</td>
                            <td><strong>{f.facility_name}</strong></td>
                            <td><span className="admin-type-badge">{f.facility_type || '—'}</span></td>
                            <td>{f.city || '—'}</td>
                            <td>{f.phone_number || '—'}</td>
                            <td>{f.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          )}

          {/* Add Facility */}
          {activeSection === 'add-facility' && (
            <div>
              <div className="admin-section-heading"><h2>Register New Facility</h2></div>
              <div className="admin-form-card">
                {facilityMsg && <div className={`admin-msg ${facilityMsg.startsWith('✅') ? 'admin-msg-success' : 'admin-msg-error'}`}>{facilityMsg}</div>}
                <form onSubmit={handleRegisterFacility}>
                  <div className="admin-form-grid">
                    <div className="admin-form-group full"><label>Facility Name *</label><input value={facilityForm.facility_name} onChange={setF('facility_name')} required /></div>
                    <div className="admin-form-group"><label>Facility Type *</label>
                      <select value={facilityForm.facility_type} onChange={setF('facility_type')} required>
                        <option value="">Select Type</option>
                        <option value="Hospital">Hospital</option><option value="Clinic">Clinic</option>
                        <option value="Pharmacy">Pharmacy</option><option value="Health Center">Health Center</option>
                      </select>
                    </div>
                    <div className="admin-form-group"><label>City *</label><input value={facilityForm.city} onChange={setF('city')} required /></div>
                    <div className="admin-form-group full"><label>Address</label><input value={facilityForm.address} onChange={setF('address')} /></div>
                    <div className="admin-form-group"><label>Phone Number</label><input value={facilityForm.phone_number} onChange={setF('phone_number')} /></div>
                    <div className="admin-form-group"><label>Email</label><input type="email" value={facilityForm.email} onChange={setF('email')} /></div>
                  </div>
                  <button type="submit" className="admin-btn-primary" disabled={submitting}>
                    {submitting ? '⏳ Registering...' : '🏥 Register Facility'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Providers List with Edit Button */}
          {activeSection === 'providers' && (
            <div>
              <div className="admin-section-heading">
                <h2>Healthcare Providers</h2>
                <button className="admin-btn-primary" onClick={() => setActiveSection('add-provider')}>➕ Add Provider</button>
              </div>
              {loading ? <div className="admin-loading">⏳ Loading...</div> :
                providers.length === 0 ? (
                  <div className="admin-empty"><div className="admin-empty-icon">👨‍⚕️</div><p>No providers registered yet.</p></div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Specialization</th>
                          <th>Assigned Facility</th>
                          <th>License</th>
                          <th>Phone</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providers.map((p, i) => (
                          <tr key={p.provider_id}>
                            <td>{i + 1}</td>
                            <td><strong>{p.first_name} {p.last_name}</strong></td>
                            <td><span className="admin-type-badge">{p.provider_type || '—'}</span></td>
                            <td>{p.specialization || '—'}</td>
                            <td>
                              {p.facility_name ? (
                                <span className="facility-badge">🏥 {p.facility_name}</span>
                              ) : (
                                <span className="no-facility">Not assigned</span>
                              )}
                            </td>
                            <td><code>{p.license_number || '—'}</code></td>
                            <td>{p.phone_number || '—'}</td>
                            <td>
                              <button 
                                className="admin-edit-btn" 
                                onClick={() => openEditModal(p)}
                              >
                                ✏️ Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          )}

          {/* Add Provider */}
          {activeSection === 'add-provider' && (
            <div>
              <div className="admin-section-heading"><h2>Register New Provider</h2></div>
              <div className="admin-form-card">
                {providerMsg && <div className={`admin-msg ${providerMsg.startsWith('✅') ? 'admin-msg-success' : 'admin-msg-error'}`}>{providerMsg}</div>}
                <form onSubmit={handleRegisterProvider}>
                  <div className="admin-form-grid">
                    <div className="admin-form-group"><label>First Name *</label><input value={providerForm.first_name} onChange={setP('first_name')} required /></div>
                    <div className="admin-form-group"><label>Last Name *</label><input value={providerForm.last_name} onChange={setP('last_name')} required /></div>
                    <div className="admin-form-group"><label>Email *</label><input type="email" value={providerForm.email} onChange={setP('email')} required /></div>
                    <div className="admin-form-group"><label>Password *</label><input type="password" value={providerForm.password} onChange={setP('password')} required /></div>
                    
                    <div className="admin-form-group">
                      <label>Assign to Facility</label>
                      <select value={providerForm.facility_id} onChange={setP('facility_id')}>
                        <option value="">-- Select Facility (Optional) --</option>
                        {facilities.map(f => (
                          <option key={f.facility_id} value={f.facility_id}>
                            🏥 {f.facility_name} — {f.city || 'No city'} ({f.facility_type})
                          </option>
                        ))}
                      </select>
                      {facilities.length === 0 && (
                        <small style={{ color: '#ca8a04', display: 'block', marginTop: '4px' }}>
                          No facilities available. Please register a facility first.
                        </small>
                      )}
                    </div>
                    
                    <div className="admin-form-group"><label>User Type *</label>
                      <select value={providerForm.user_type} onChange={e => { setP('user_type')(e); setProviderForm(f => ({ ...f, provider_type: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) })); }}>
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="receptionist">Receptionist</option>
                      </select>
                    </div>
                    <div className="admin-form-group"><label>Provider Type *</label>
                      <select value={providerForm.provider_type} onChange={setP('provider_type')}>
                        <option value="Doctor">Doctor</option>
                        <option value="Nurse">Nurse</option>
                        <option value="Specialist">Specialist</option>
                        <option value="Pharmacist">Pharmacist</option>
                        <option value="Receptionist">Receptionist</option>
                      </select>
                    </div>
                    <div className="admin-form-group"><label>Specialization</label><input value={providerForm.specialization} onChange={setP('specialization')} placeholder="e.g. Cardiology" /></div>
                    <div className="admin-form-group"><label>License Number *</label><input value={providerForm.license_number} onChange={setP('license_number')} required /></div>
                    <div className="admin-form-group"><label>Phone Number</label><input value={providerForm.phone_number} onChange={setP('phone_number')} placeholder="e.g. 0771234567" /></div>
                  </div>
                  <button type="submit" className="admin-btn-primary" disabled={submitting}>
                    {submitting ? '⏳ Registering...' : '👨‍⚕️ Register Provider'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Provider Modal */}
      {editingProvider && (
        <div className="modal-overlay" onClick={() => setEditingProvider(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Edit Provider</h2>
                <p>{editingProvider.first_name} {editingProvider.last_name}</p>
              </div>
              <button className="modal-close" onClick={() => setEditingProvider(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateProvider} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input value={editProviderForm.first_name} onChange={setEP('first_name')} required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input value={editProviderForm.last_name} onChange={setEP('last_name')} required />
                </div>
                <div className="form-group">
                  <label>Provider Type</label>
                  <select value={editProviderForm.provider_type} onChange={setEP('provider_type')}>
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Specialist">Specialist</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Specialization</label>
                  <input value={editProviderForm.specialization} onChange={setEP('specialization')} placeholder="e.g. Cardiology" />
                </div>
                <div className="form-group">
                  <label>License Number</label>
                  <input value={editProviderForm.license_number} onChange={setEP('license_number')} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input value={editProviderForm.phone_number} onChange={setEP('phone_number')} placeholder="e.g. 0771234567" />
                </div>
                <div className="form-group full">
                  <label>Assign to Facility</label>
                  <select value={editProviderForm.facility_id} onChange={setEP('facility_id')}>
                    <option value="">-- Select Facility (Optional) --</option>
                    {facilities.map(f => (
                      <option key={f.facility_id} value={f.facility_id}>
                        🏥 {f.facility_name} — {f.city || 'No city'} ({f.facility_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {editMsg && (
                <div className={`form-msg ${editMsg.startsWith('✅') ? 'form-msg-success' : 'form-msg-error'}`}>
                  {editMsg}
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setEditingProvider(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={editLoading}>
                  {editLoading ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}