from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models import BorrowStatus


# ─── Employee Schemas ────────────────────────────────────────────────────────

class EmployeeLookupResponse(BaseModel):
    nik: str
    name: str
    department: str
    email: str

    class Config:
        from_attributes = True


# ─── Item Schemas ────────────────────────────────────────────────────────────

class ItemCreate(BaseModel):
    item_name: str = Field(..., min_length=1, max_length=100)
    total_stock: int = Field(..., ge=0)
    available_stock: Optional[int] = None
    category: str = Field(default="General", max_length=50)
    is_active: bool = True


class ItemUpdate(BaseModel):
    item_name: Optional[str] = Field(None, min_length=1, max_length=100)
    total_stock: Optional[int] = Field(None, ge=0)
    available_stock: Optional[int] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class ItemResponse(BaseModel):
    id: int
    item_name: str
    total_stock: int
    available_stock: int
    category: str
    is_active: bool

    class Config:
        from_attributes = True


# ─── Borrow Schemas ──────────────────────────────────────────────────────────

class BorrowItemDetail(BaseModel):
    item_id: int
    quantity: int = Field(..., ge=1)


class BorrowRequest(BaseModel):
    nik: str = Field(..., min_length=1)
    borrow_date: date
    return_date: date
    items: List[BorrowItemDetail] = Field(..., min_length=1)
    notes: Optional[str] = None


class BorrowDetailResponse(BaseModel):
    id: int
    item_id: int
    item_name: str
    quantity: int

    class Config:
        from_attributes = True


class BorrowResponse(BaseModel):
    id: int
    nik: str
    employee_name: str
    department: str
    borrow_date: date
    return_date: date
    actual_return_date: Optional[date] = None
    status: BorrowStatus
    notes: Optional[str] = None
    created_at: datetime
    details: List[BorrowDetailResponse] = []

    class Config:
        from_attributes = True


class ReturnRequest(BaseModel):
    notes: Optional[str] = None


# ─── Transaction Filter ─────────────────────────────────────────────────────

class TransactionFilter(BaseModel):
    status: Optional[BorrowStatus] = None
    department: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    search: Optional[str] = None


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class AdminLogin(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class AdminUserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Dashboard Schemas ───────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_items: int
    total_active_items: int
    active_borrows: int
    overdue_count: int
    total_transactions: int
    returned_count: int
    total_employees_borrowed: int


# ─── Pagination ──────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: List[dict] = []
    total: int = 0
    skip: int = 0
    limit: int = 20
    has_more: bool = False
