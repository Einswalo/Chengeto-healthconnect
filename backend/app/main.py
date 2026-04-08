from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from sqlalchemy import text
from app.db.database import engine
from app.api import auth, patients, appointments, medical_records, vital_signs, prescriptions, facilities, providers, consent_records, emergency_access, ai_predictions, blockchain

# Import all models so SQLAlchemy can find them
from app.models.user import User
from app.models.patient import Patient
from app.models.healthcare_provider import HealthcareProvider
from app.models.facility import Facility
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.vital_sign import VitalSign
from app.models.prescription import Prescription
from app.models.consent_record import ConsentRecord
from app.models.emergency_access_log import EmergencyAccessLog
from app.models.ai_prediction import AIPrediction
from app.models.blockchain import BlockchainBlock

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

@app.on_event("startup")
async def ensure_blockchain_table():
    """
    Ensure the blockchain_blocks table exists.
    
    This project doesn't run migrations automatically; without this, new setups
    that used the original schema.sql won't have the blockchain table.
    """
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS blockchain_blocks (
        block_id SERIAL PRIMARY KEY,
        block_index INTEGER UNIQUE NOT NULL,
        block_hash VARCHAR(255) UNIQUE NOT NULL,
        previous_hash VARCHAR(255) NOT NULL,
        timestamp VARCHAR(100) NOT NULL,
        block_type VARCHAR(50) NOT NULL,
        record_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """
    with engine.begin() as conn:
        conn.execute(text(create_table_sql))
        # Add blockchain_hash columns for new audited tables (best-effort, idempotent)
        conn.execute(text("ALTER TABLE IF EXISTS medical_records ADD COLUMN IF NOT EXISTS blockchain_hash VARCHAR(255);"))
        conn.execute(text("ALTER TABLE IF EXISTS ai_predictions ADD COLUMN IF NOT EXISTS blockchain_hash VARCHAR(255);"))
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_medical_records_blockchain_hash ON medical_records(blockchain_hash) WHERE blockchain_hash IS NOT NULL;"))
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_predictions_blockchain_hash ON ai_predictions(blockchain_hash) WHERE blockchain_hash IS NOT NULL;"))

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
app.include_router(consent_records.router)
app.include_router(emergency_access.router)
app.include_router(ai_predictions.router)
app.include_router(blockchain.router)


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