# CHENGETO HealthConnect

**A Blockchain-Secured, AI-Enhanced Patient-Centric Healthcare System**

---

## 🎯 Project Overview

CHENGETO HealthConnect is a revolutionary healthcare information system that empowers patients with ownership of their medical data while enabling secure, consent-based access across multiple healthcare facilities in Zimbabwe.

### Key Features:
- 🔐 **Blockchain-Secured Trust** - Immutable consent management and prescription verification using Hyperledger Fabric
- 🤖 **AI-Powered Clinical Support** - Disease prediction (malaria, typhoid, TB) and drug interaction warnings
- 👥 **Patient-Centric Design** - Patients control who accesses their data
- 💊 **Digital Prescriptions** - Blockchain-verified prescriptions accessible at any pharmacy
- 🚨 **Emergency Access Protocol** - Time-bound verified access during emergencies
- 📱 **Multi-Platform** - Web and mobile applications

---

## 🏗️ Technology Stack

### Backend
- **Python + FastAPI** - RESTful API services
- **PostgreSQL** - Operational database

### Blockchain
- **Hyperledger Fabric** - Consent management, audit trails, prescription verification

### AI/ML
- **Ollama + Llama 3** - Disease prediction and clinical decision support
- **Python ML libraries** - scikit-learn, pandas, numpy

### Frontend
- **React** - Web application for healthcare facilities
- **React Native** - Mobile application for patients

### DevOps
- **Docker** - Containerization
- **Git** - Version control

---

## 📊 Database Schema

### Core Tables:
- `users` - Authentication (patients, doctors, nurses, admin, pharmacists)
- `patients` - Patient demographics and medical information
- `healthcare_providers` - Medical staff details
- `facilities` - Hospitals, clinics, pharmacies
- `appointments` - Appointment scheduling
- `medical_records` - Patient medical history
- `prescriptions` - Medication prescriptions with blockchain verification
- `consent_records` - Patient consent with blockchain tracking
- `vital_signs` - Patient vital measurements
- `emergency_access_logs` - Emergency access audit trail
- `ai_predictions` - AI disease prediction tracking

See `database/schema.sql` for complete schema.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Docker
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/chengeto-healthconnect.git
cd chengeto-healthconnect
```

2. **Set up PostgreSQL database**
```bash
psql -U postgres
CREATE DATABASE chengeto_db;
\c chengeto_db
\i database/schema.sql
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Install backend dependencies**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

5. **Install frontend dependencies**
```bash
cd frontend-web
npm install
```

---

## 📅 Development Timeline

**10-Week Implementation Plan**

- **Weeks 1-2:** Planning & Architecture ✅
- **Weeks 3-5:** Core Backend Development
- **Weeks 6-7:** AI & Blockchain Integration
- **Weeks 8-9:** Frontend Development
- **Week 10:** Testing & Refinement
- **Weeks 11-12:** Documentation
- **Week 13:** Defense Preparation

---

## 🎓 Project Information

**Course:** Final Year Project  
**Institution:** [Your University]  
**Student:** [Your Name]  
**Supervisor:** [Supervisor Name]  
**Year:** 2026

---

## 📝 Documentation

- [Technical Architecture Document](docs/CHENGETO_HealthConnect_Technical_Document.docx)
- [Setup Notes](SETUP_NOTES.md)
- [API Documentation](docs/api-documentation.md) - Coming soon
- [User Manual](docs/user-manual.md) - Coming soon

---

## 🤝 Contributing

This is an academic project. Contributions are not currently accepted.

---

## 📄 License

This project is part of academic work and is not licensed for commercial use.

---

## 📧 Contact

[Your Email]  
[Your GitHub Profile]

---

**Status:** 🚧 In Development - Week 1 Complete