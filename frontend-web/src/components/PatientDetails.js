import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DoctorDashboard.css';

const API = 'http://localhost:8000';

function PatientDetails({ patient, goBack }) {

  const [activeTab, setActiveTab] = useState('history');

  const [medicalHistory, setMedicalHistory] = useState([]);
  const [vitalHistory, setVitalHistory] = useState([]);

  const token = localStorage.getItem('token');

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const [medicalRecordForm, setMedicalRecordForm] = useState({
    diagnosis: '',
    symptoms: '',
    treatment_plan: '',
    notes: '',
    visit_date: new Date().toISOString().split('T')[0],
  });

 const [vitalSignsForm, setVitalSignsForm] = useState({
  temperature: '',
  blood_pressure_systolic: '',
  blood_pressure_diastolic: '',
  heart_rate: '',
  respiratory_rate: '',
  oxygen_saturation: '',
});

  useEffect(() => {
    fetchMedicalHistory();
    fetchVitalHistory();
  }, []);

  // FETCH MEDICAL HISTORY
  const fetchMedicalHistory = async () => {
    try {
      const response = await axios.get(
        `${API}/medical-records/patient/${patient.patient_id}`,
        config
      );

      setMedicalHistory(response.data);

    } catch (error) {
      console.error(error);
      setMedicalHistory([]);
    }
  };

  // FETCH VITAL HISTORY
  const fetchVitalHistory = async () => {
    try {
      const response = await axios.get(
        `${API}/vital-signs/patient/${patient.patient_id}`,
        config
      );

      setVitalHistory(response.data);

    } catch (error) {
      console.error(error);
      setVitalHistory([]);
    }
  };

  // CREATE MEDICAL RECORD
  const handleCreateMedicalRecord = async (e) => {
    e.preventDefault();

    try {

      await axios.post(
        `${API}/medical-records/`,
        {
          patient_id: patient.patient_id,
          ...medicalRecordForm,
        },
        config
      );

      alert('✅ Medical record created');

      fetchMedicalHistory();

      setMedicalRecordForm({
        diagnosis: '',
        symptoms: '',
        treatment_plan: '',
        notes: '',
        visit_date: new Date().toISOString().split('T')[0],
      });

      setActiveTab('history');

    } catch (error) {
      console.error(error);
      alert('❌ Failed to create medical record');
    }
  };

  // RECORD VITALS
  const handleRecordVitals = async (e) => {
  e.preventDefault();

  try {
    await axios.post(
      `${API}/vital-signs/`,
      {
        patient_id: patient.patient_id,
        temperature: Number(vitalSignsForm.temperature),
        blood_pressure_systolic: Number(vitalSignsForm.blood_pressure_systolic),
        blood_pressure_diastolic: Number(vitalSignsForm.blood_pressure_diastolic),
        heart_rate: Number(vitalSignsForm.heart_rate),
        respiratory_rate: Number(vitalSignsForm.respiratory_rate),
        oxygen_saturation: Number(vitalSignsForm.oxygen_saturation),
      },
      config
    );

    alert('✅ Vitals recorded');

    fetchVitalHistory();

    setVitalSignsForm({
      temperature: '',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      respiratory_rate: '',
      oxygen_saturation: '',
    });

    setActiveTab('vitals-history');

  } catch (error) {
    console.error(error);
    alert('❌ Failed to record vitals');
  }
};

  return (
    <div className="patient-details-page">

      {/* TOPBAR */}

      <div className="patient-topbar">

        <button
          className="back-btn"
          onClick={goBack}
        >
          ← Back
        </button>

        <div>
          <h1>
            👤 {patient.first_name} {patient.last_name}
          </h1>

          <p>
            📞 {patient.phone_number}
          </p>
        </div>

      </div>

      {/* PATIENT INFO */}

      <div className="patient-info-card">

        <div className="info-grid">

          <div>
            <strong>Blood Type:</strong>
            <p>{patient.blood_type || 'Unknown'}</p>
          </div>

          <div>
            <strong>Gender:</strong>
            <p>{patient.gender || 'N/A'}</p>
          </div>

          <div>
            <strong>City:</strong>
            <p>{patient.city || 'N/A'}</p>
          </div>

          <div>
            <strong>Patient ID:</strong>
            <p>{patient.patient_id}</p>
          </div>

        </div>

      </div>

      {/* TABS */}

      <div className="details-tabs">

        <button
          className={activeTab === 'history' ? 'active-tab' : ''}
          onClick={() => setActiveTab('history')}
        >
          📋 Medical History
        </button>

        <button
          className={activeTab === 'vitals-history' ? 'active-tab' : ''}
          onClick={() => setActiveTab('vitals-history')}
        >
          ❤️ Vital History
        </button>

        <button
          className={activeTab === 'record' ? 'active-tab' : ''}
          onClick={() => setActiveTab('record')}
        >
          ➕ Create Record
        </button>

        <button
          className={activeTab === 'vitals' ? 'active-tab' : ''}
          onClick={() => setActiveTab('vitals')}
        >
          ❤️ Record Vitals
        </button>

      </div>

      {/* MEDICAL HISTORY */}

      {activeTab === 'history' && (

        <div>

          <h2>Medical History</h2>

          {medicalHistory.length === 0 ? (
            <p>No medical history found.</p>
          ) : (
            medicalHistory.map((record, index) => (

              <div key={index} className="history-card">

                <p>
                  <strong>Date:</strong> {record.visit_date}
                </p>

                <p>
                  <strong>Diagnosis:</strong> {record.diagnosis}
                </p>

                <p>
                  <strong>Symptoms:</strong> {record.symptoms}
                </p>

                <p>
                  <strong>Treatment:</strong> {record.treatment_plan}
                </p>

                <p>
                  <strong>Notes:</strong> {record.notes}
                </p>

              </div>

            ))
          )}

        </div>

      )}

      {/* VITAL HISTORY */}

      {activeTab === 'vitals-history' && (

        <div>

          <h2>Vital Signs History</h2>

          {vitalHistory.length === 0 ? (
            <p>No vital history found.</p>
          ) : (
            vitalHistory.map((vital, index) => (

              <div key={index} className="history-card">

                <p>🌡 Temperature: {vital.temperature}°C</p>

                <p>💓 Blood Pressure: {vital.blood_pressure}</p>

                <p>❤️ Heart Rate: {vital.heart_rate}</p>

                <p>🫁 Respiratory Rate: {vital.respiratory_rate}</p>

                <p>🩸 Oxygen Saturation: {vital.oxygen_saturation}%</p>

              </div>

            ))
          )}

        </div>

      )}

      {/* CREATE MEDICAL RECORD */}

      {activeTab === 'record' && (

        <form onSubmit={handleCreateMedicalRecord}>

          <input
            type="date"
            className="form-input"
            value={medicalRecordForm.visit_date}
            onChange={(e) =>
              setMedicalRecordForm({
                ...medicalRecordForm,
                visit_date: e.target.value,
              })
            }
          />

          <input
            type="text"
            placeholder="Diagnosis"
            className="form-input"
            value={medicalRecordForm.diagnosis}
            onChange={(e) =>
              setMedicalRecordForm({
                ...medicalRecordForm,
                diagnosis: e.target.value,
              })
            }
          />

          <textarea
            placeholder="Symptoms"
            className="form-textarea"
            value={medicalRecordForm.symptoms}
            onChange={(e) =>
              setMedicalRecordForm({
                ...medicalRecordForm,
                symptoms: e.target.value,
              })
            }
          />

          <textarea
            placeholder="Treatment Plan"
            className="form-textarea"
            value={medicalRecordForm.treatment_plan}
            onChange={(e) =>
              setMedicalRecordForm({
                ...medicalRecordForm,
                treatment_plan: e.target.value,
              })
            }
          />

          <textarea
            placeholder="Notes"
            className="form-textarea"
            value={medicalRecordForm.notes}
            onChange={(e) =>
              setMedicalRecordForm({
                ...medicalRecordForm,
                notes: e.target.value,
              })
            }
          />

          <button className="submit-btn">
            Save Medical Record
          </button>

        </form>

      )}

      {/* RECORD VITALS */}

      {activeTab === 'vitals' && (

  <form onSubmit={handleRecordVitals}>

    <input
      type="number"
      step="0.1"
      placeholder="Temperature (°C)"
      className="form-input"
      value={vitalSignsForm.temperature}
      onChange={(e) =>
        setVitalSignsForm({
          ...vitalSignsForm,
          temperature: e.target.value,
        })
      }
    />

    <input
      type="number"
      placeholder="Blood Pressure (Systolic)"
      className="form-input"
      value={vitalSignsForm.blood_pressure_systolic}
      onChange={(e) =>
        setVitalSignsForm({
          ...vitalSignsForm,
          blood_pressure_systolic: e.target.value,
        })
      }
    />

    <input
      type="number"
      placeholder="Blood Pressure (Diastolic)"
      className="form-input"
      value={vitalSignsForm.blood_pressure_diastolic}
      onChange={(e) =>
        setVitalSignsForm({
          ...vitalSignsForm,
          blood_pressure_diastolic: e.target.value,
        })
      }
    />

    <input
      type="number"
      placeholder="Heart Rate"
      className="form-input"
      value={vitalSignsForm.heart_rate}
      onChange={(e) =>
        setVitalSignsForm({
          ...vitalSignsForm,
          heart_rate: e.target.value,
        })
      }
    />

    <input
      type="number"
      placeholder="Respiratory Rate"
      className="form-input"
      value={vitalSignsForm.respiratory_rate}
      onChange={(e) =>
        setVitalSignsForm({
          ...vitalSignsForm,
          respiratory_rate: e.target.value,
        })
      }
    />

    <input
      type="number"
      placeholder="Oxygen Saturation (%)"
      className="form-input"
      value={vitalSignsForm.oxygen_saturation}
      onChange={(e) =>
        setVitalSignsForm({
          ...vitalSignsForm,
          oxygen_saturation: e.target.value,
        })
      }
    />

    <button className="submit-btn">
      Save Vital Signs
    </button>

  </form>
)}

    </div>
  );
}

export default PatientDetails;