"""
Seed script to populate default items and admin user.
Run: python seed_data.py
"""
import hashlib
import sys
import os

# Ensure the app package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import Item, AdminUser, Employee
from app.config import get_settings

settings = get_settings()

# ─── Default Items ───────────────────────────────────────────────────────────

DEFAULT_ITEMS = [
    {"item_name": "Monitor", "total_stock": 20, "category": "Display"},
    {"item_name": "PC/Laptop", "total_stock": 15, "category": "Computer"},
    {"item_name": "USB Drive", "total_stock": 50, "category": "Storage"},
    {"item_name": "Converter", "total_stock": 30, "category": "Adapter"},
    {"item_name": "Mouse", "total_stock": 40, "category": "Peripheral"},
    {"item_name": "Keyboard", "total_stock": 35, "category": "Peripheral"},
    {"item_name": "VGA Cable", "total_stock": 25, "category": "Cable"},
    {"item_name": "HDMI Cable", "total_stock": 25, "category": "Cable"},
    {"item_name": "Speaker", "total_stock": 10, "category": "Audio"},
    {"item_name": "Camera", "total_stock": 8, "category": "Recording"},
    {"item_name": "Ladder", "total_stock": 5, "category": "Tool"},
    {"item_name": "Projector", "total_stock": 6, "category": "Display"},
]

# ─── Mock Employees ──────────────────────────────────────────────────────────

MOCK_EMPLOYEES = [
    {"nik": "10240001", "name": "Budi Santoso", "department": "IT", "email": "budi.santoso@company.com"},
    {"nik": "10240002", "name": "Siti Rahayu", "department": "HR", "email": "siti.rahayu@company.com"},
    {"nik": "10240003", "name": "Ahmad Hidayat", "department": "Finance", "email": "ahmad.hidayat@company.com"},
    {"nik": "10240004", "name": "Dewi Lestari", "department": "Marketing", "email": "dewi.lestari@company.com"},
    {"nik": "10240005", "name": "Rizky Pratama", "department": "IT", "email": "rizky.pratama@company.com"},
    {"nik": "10240006", "name": "Putri Wulandari", "department": "Operations", "email": "putri.wulandari@company.com"},
    {"nik": "10240007", "name": "Fajar Nugroho", "department": "Engineering", "email": "fajar.nugroho@company.com"},
    {"nik": "10240008", "name": "Anisa Permata", "department": "Finance", "email": "anisa.permata@company.com"},
    {"nik": "10240009", "name": "Hendra Wijaya", "department": "IT", "email": "hendra.wijaya@company.com"},
    {"nik": "10240010", "name": "Mega Safitri", "department": "HR", "email": "mega.safitri@company.com"},
]


def hash_password(password: str) -> str:
    """Simple SHA-256 hash for MVP."""
    return hashlib.sha256(password.encode()).hexdigest()


def seed_database():
    """Create tables and seed default data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables created.")

    db = SessionLocal()
    try:
        # Seed items
        existing_items = db.query(Item).count()
        if existing_items == 0:
            for item_data in DEFAULT_ITEMS:
                item = Item(
                    item_name=item_data["item_name"],
                    total_stock=item_data["total_stock"],
                    available_stock=item_data["total_stock"],  # Initially all available
                    category=item_data["category"],
                    is_active=True,
                )
                db.add(item)
            db.commit()
            print(f"[OK] Seeded {len(DEFAULT_ITEMS)} default items.")
        else:
            print(f"[SKIP] Items already exist ({existing_items} found).")

        # Seed mock employees
        existing_employees = db.query(Employee).count()
        if existing_employees == 0:
            for emp_data in MOCK_EMPLOYEES:
                employee = Employee(
                    nik=emp_data["nik"],
                    name=emp_data["name"],
                    department=emp_data["department"],
                    email=emp_data["email"],
                )
                db.add(employee)
            db.commit()
            print(f"[OK] Seeded {len(MOCK_EMPLOYEES)} mock employees.")
        else:
            print(f"[SKIP] Employees already exist ({existing_employees} found).")

        # Seed admin user
        existing_admin = db.query(AdminUser).filter(
            AdminUser.username == settings.ADMIN_USERNAME
        ).first()
        if not existing_admin:
            admin = AdminUser(
                username=settings.ADMIN_USERNAME,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
            )
            db.add(admin)
            db.commit()
            print(f"[OK] Created admin user: {settings.ADMIN_USERNAME}")
        else:
            print(f"[SKIP] Admin user '{settings.ADMIN_USERNAME}' already exists.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seed failed: {e}")
        raise
    finally:
        db.close()

    print("\n[DONE] Database seeding complete!")


if __name__ == "__main__":
    seed_database()
