from pydantic import BaseModel

class PatientLogin(BaseModel):
    national_id: str
    password: str