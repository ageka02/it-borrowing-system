from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee
from app.schemas import EmployeeLookupResponse

router = APIRouter()

# ─── Mock Employee Database (fallback) ───────────────────────────────────────

MOCK_EMPLOYEES = {
    "10240001": {"nik": "10240001", "name": "Budi Santoso", "department": "IT", "email": "budi.santoso@company.com"},
    "10240002": {"nik": "10240002", "name": "Siti Rahayu", "department": "HR", "email": "siti.rahayu@company.com"},
    "10240003": {"nik": "10240003", "name": "Ahmad Hidayat", "department": "Finance", "email": "ahmad.hidayat@company.com"},
    "10240004": {"nik": "10240004", "name": "Dewi Lestari", "department": "Marketing", "email": "dewi.lestari@company.com"},
    "10240005": {"nik": "10240005", "name": "Rizky Pratama", "department": "IT", "email": "rizky.pratama@company.com"},
    "10240006": {"nik": "10240006", "name": "Putri Wulandari", "department": "Operations", "email": "putri.wulandari@company.com"},
    "10240007": {"nik": "10240007", "name": "Fajar Nugroho", "department": "Engineering", "email": "fajar.nugroho@company.com"},
    "10240008": {"nik": "10240008", "name": "Anisa Permata", "department": "Finance", "email": "anisa.permata@company.com"},
    "10240009": {"nik": "10240009", "name": "Hendra Wijaya", "department": "IT", "email": "hendra.wijaya@company.com"},
    "10240010": {"nik": "10240010", "name": "Mega Safitri", "department": "HR", "email": "mega.safitri@company.com"},
}


@router.get("/{nik}", response_model=EmployeeLookupResponse)
def lookup_employee(nik: str, db: Session = Depends(get_db)):
    """
    Lookup employee by NIK.
    First checks the database, falls back to mock data.
    """
    # Try database first
    employee = db.query(Employee).filter(Employee.nik == nik).first()
    if employee:
        return EmployeeLookupResponse(
            nik=employee.nik,
            name=employee.name,
            department=employee.department,
            email=employee.email,
        )

    # Fallback to mock data
    if nik in MOCK_EMPLOYEES:
        return EmployeeLookupResponse(**MOCK_EMPLOYEES[nik])

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Employee with NIK '{nik}' not found",
    )
