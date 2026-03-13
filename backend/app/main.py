import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.database import engine, Base
from app.config import get_settings
from app.routers import auth, employees, items, borrowing, admin
from app.services.qrcode_service import generate_qr_code

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

settings = get_settings()


def run_seed():
    """Run database seeding on startup."""
    try:
        from seed_data import seed_database
        seed_database()
    except Exception as e:
        logger.warning(f"Seed import from root failed, trying inline: {e}")
        # Inline minimal seed if seed_data.py is not on path
        import sys
        import hashlib
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
        try:
            from seed_data import seed_database
            seed_database()
        except Exception as ex:
            logger.error(f"Seeding failed: {ex}")


def start_scheduler():
    """Start the APScheduler background job."""
    try:
        from app.services.scheduler_service import start_overdue_checker
        start_overdue_checker()
        logger.info("Scheduler started successfully.")
    except Exception as e:
        logger.warning(f"Scheduler failed to start: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    # Startup
    logger.info("Starting IT Equipment Borrowing System...")
    Base.metadata.create_all(bind=engine)
    run_seed()
    start_scheduler()
    logger.info("Application started successfully.")
    yield
    # Shutdown
    logger.info("Shutting down...")
    try:
        from app.services.scheduler_service import stop_scheduler
        stop_scheduler()
    except Exception:
        pass


# ─── Create FastAPI App ──────────────────────────────────────────────────────

app = FastAPI(
    title="IT Equipment Borrowing System",
    description="Backend API for managing IT equipment borrowing in the office.",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS Middleware ─────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ────────────────────────────────────────────────────────

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(items.router, prefix="/api/items", tags=["Items"])
app.include_router(borrowing.router, prefix="/api/borrow", tags=["Borrowing"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


# ─── Root & Health ───────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "message": "IT Equipment Borrowing System API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "it-borrowing-system"}


# ─── QR Code Endpoint ────────────────────────────────────────────────────────

@app.get("/api/qrcode", tags=["Utility"])
def get_qr_code(url: str = None):
    """Generate a QR code for the borrow page URL."""
    target_url = url or f"{settings.APP_URL}/borrow"
    try:
        qr_bytes = generate_qr_code(target_url)
        return Response(content=qr_bytes, media_type="image/png")
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to generate QR code: {str(e)}"}
        )
