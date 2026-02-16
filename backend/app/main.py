from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from sqlalchemy import text
from app.db.database import engine
from app.api import auth, patients, appointments, medical_records, vital_signs, prescriptions, facilities, providers

# Import all models so SQLAlchemy can find them
from app.models.user import User
from app.models.patient import Patient
from app.models.healthcare_provider import HealthcareProvider
from app.models.facility import Facility
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.vital_sign import VitalSign
from app.models.prescription import Prescription

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(medical_records.router)
app.include_router(vital_signs.router)
app.include_router(prescriptions.router)
app.include_router(facilities.router)
app.include_router(providers.router)



# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to CHENGETO HealthConnect API",
        "version": settings.APP_VERSION,
        "status": "running"
    }

# Database connection test
@app.get("/test-db")
async def test_database():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            return {
                "status": "success",
                "message": "Database connected successfully",
                "postgres_version": version
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}