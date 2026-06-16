# 🏥 Chengeto HealthConnect

**Caring for Zimbabwe's Health**

A full-stack health information management system with role-based dashboards for Admins, Doctors, Nurses, and Pharmacists, plus a dedicated mobile app for Patients.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Database Setup](#%EF%B8%8F-database-setup)
- [Running the Backend](#-running-the-backend)
- [Running the Web Frontend](#-running-the-web-frontend)
- [Running the Mobile App](#-running-the-mobile-app)
- [Quick Start (All Services)](#-quick-start---running-everything)
- [System Access Points](#-system-access-points)
- [Default Login Credentials](#-default-login-credentials)
- [Troubleshooting](#%EF%B8%8F-troubleshooting)
- [Production Notes](#-production-deployment-notes)
- [Success Checklist](#-success-checklist)
- [Getting Help](#-getting-help)

---

## 📖 Overview

Chengeto HealthConnect connects patients and healthcare providers through a unified platform. Administrators manage the system, doctors handle patient care and prescriptions, nurses record vitals and register patients, pharmacists dispense medication, and patients can view their own health information from a mobile app.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python) |
| Web Frontend | React |
| Mobile App | React Native (Expo) |
| Database | PostgreSQL |
| Auth | JWT |

## 📂 Project Structure

```
Chengeto_HealthConnect/
├── backend/              # FastAPI Backend
├── web-frontend/         # React Web App
├── mobile-app/           # React Native Mobile App
├── database/             # Database files
└── README.md             # This file
```

## ✅ Prerequisites

Install the following before getting started:

- [Visual Studio Code](https://code.visualstudio.com/download)
- [Python 3.9+](https://www.python.org/downloads/) (3.11 recommended)
- [Node.js 18.x+ (LTS)](https://nodejs.org/en/download/)
- [PostgreSQL 14+](https://www.postgresql.org/download/)

### Recommended VS Code Extensions

- Python (`ms-python.python`)
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- React Native Tools (`msjsdiag.vscode-react-native`)
- PostCSS Language Support (`csstools.postcss`)
- SQLTools (`mtxr.sqltools`)
- Thunder Client (`rangav.vscode-thunder-client`) — for API testing

## 🚀 Installation

### 1. Get the Project

```bash
# Clone or extract the project, then navigate into it
cd Chengeto_HealthConnect
```

### 2. Open in VS Code

```bash
code .
```

Or use **File → Open Folder** and select the `Chengeto_HealthConnect` directory.

## 🗄️ Database Setup

### Start PostgreSQL

**Windows**
```bash
net start postgresql-15
```

**Mac**
```bash
brew services start postgresql@15
```

**Linux**
```bash
sudo systemctl start postgresql
```

### Create the Database

```bash
# Windows: psql -U postgres
# Mac/Linux: sudo -u postgres psql

CREATE DATABASE chengeto;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE chengeto TO your_username;
\q
```

### Import the Schema

```bash
cd database
psql -U postgres -d chengeto -f database_schema.sql
```

## 🔧 Running the Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create a `backend/.env` file:

```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/chengeto
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Run migrations and start the server:

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Success indicators:**
- Terminal shows `Application startup complete`
- Swagger UI is reachable at [http://localhost:8000/docs](http://localhost:8000/docs)
- No error messages in the terminal

## 🌐 Running the Web Frontend

```bash
cd web-frontend
npm install
```

Create a `web-frontend/.env` file:

```env
REACT_APP_API_URL=http://localhost:8000
```

Start the app:

```bash
npm start
```

**Success indicators:**
- Terminal shows `Compiled successfully!`
- Login page loads at [http://localhost:3000](http://localhost:3000)

## 📱 Running the Mobile App

### Option A: Physical Device (Recommended)

1. Install **Expo Go** from the Google Play Store or Apple App Store.
2. Run:
   ```bash
   cd mobile-app
   npm install
   npx expo start
   ```
3. Ensure your phone and computer are on the same WiFi network.
4. Scan the QR code shown in the terminal with Expo Go (Android) or the Camera app (iOS).

### Option B: Android Emulator

1. Install [Android Studio](https://developer.android.com/studio), including the Android SDK and an AVD (e.g. Pixel 4, Android 13).
2. Start the emulator, then run:
   ```bash
   npx expo start --android
   ```

### Option C: iOS Simulator (Mac only)

```bash
npx expo start --ios
```

**Success indicators:**
- Terminal shows `Expo Dev Tools running`
- QR code appears in the terminal
- App loads on the phone/emulator with a visible login screen

## ⚡ Quick Start - Running Everything

Open three terminals in VS Code:

```bash
# Terminal 1 — Backend
cd backend
source venv/bin/activate   # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

```bash
# Terminal 2 — Web Frontend
cd web-frontend
npm start
```

```bash
# Terminal 3 — Mobile App
cd mobile-app
npx expo start
```

## 📊 System Access Points

| Component | URL/Address | Description |
|---|---|---|
| API Documentation | http://localhost:8000/docs | FastAPI Swagger UI |
| Web App | http://localhost:3000 | Admin, Doctor, Nurse, Pharmacist |
| Mobile App | Expo QR Code | Patient App |
| Database | localhost:5432 | PostgreSQL |

## 🔑 Default Login Credentials

> ⚠️ These are seed/test accounts for local development only. Change or remove them before deploying to production.

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | sysadmin@chengeto.com | admin123 | Full system control |
| Doctor | doctor@chengeto.com | password123 | Patient care and prescriptions |
| Nurse | nurse@chengeto.com | nurse123 | Vitals and patient registration |
| Pharmacist | pharmacist@chengeto.com | pharmacist123 | Dispense medication |
| Patient (mobile) | patient@chengeto.com | patient123 | View health information |

## 🛠️ Troubleshooting

**Port 8000 already in use (Backend)**

```bash
# Mac/Linux
lsof -i :8000
kill -9 [PID]

# Windows
netstat -ano | findstr :8000
taskkill /PID [PID] /F
```

**Could not connect to database**

```bash
# Mac
brew services list | grep postgresql
brew services start postgresql@15

# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql
```

**npm install failed**

```bash
npm cache clean --force
rm -rf node_modules
npm install
```

**Module not found (Python)**

Make sure the virtual environment is active, then reinstall:

```bash
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Expo start fails**

```bash
npx expo start -c          # clear Metro cache
npx expo start --clear     # full reset
npx expo start --tunnel    # if QR code doesn't work
```

**CORS error in browser**

- Confirm the backend is running at `http://localhost:8000`
- Confirm `web-frontend/.env` has `REACT_APP_API_URL=http://localhost:8000`
- Restart both backend and frontend

## 🔐 Production Deployment Notes

- Change `JWT_SECRET_KEY` to a strong, unique value
- Use strong, unique database passwords
- Set `DEBUG = False`
- Serve over HTTPS
- Configure CORS for your actual domain
- Use environment-specific `.env` files
- Run the backend behind a process manager (e.g. Gunicorn)
- Set up proper logging

**Security reminders:** never commit `.env` files to Git, never expose `JWT_SECRET_KEY`, keep dependencies updated, and always use HTTPS in production.

## ✅ Success Checklist

- [ ] Python installed (3.9+)
- [ ] Node.js installed (18+)
- [ ] PostgreSQL installed (14+)
- [ ] VS Code installed
- [ ] Project opened in VS Code
- [ ] Database created and configured
- [ ] Backend running on http://localhost:8000
- [ ] Web frontend running on http://localhost:3000
- [ ] Mobile app running on device/emulator
- [ ] Can log in with test credentials
- [ ] Data visible in the dashboards

## 📞 Getting Help

If something isn't working:

1. Check the [Troubleshooting](#%EF%B8%8F-troubleshooting) section above.
2. Verify all services are running (backend, web, database).
3. Read the terminal error messages closely — they usually point to the fix.
4. Confirm you're running commands from the correct directory.
5. If all else fails, restart each service from scratch.

---

*Chengeto — Caring for Zimbabwe's Health*
