import enum
from datetime import datetime, date

from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime, Enum, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


class BorrowStatus(str, enum.Enum):
    BORROWED = "BORROWED"
    RETURNED = "RETURNED"
    OVERDUE = "OVERDUE"


class Employee(Base):
    __tablename__ = "employees"

    nik = Column(String(20), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("BorrowTransaction", back_populates="employee")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    item_name = Column(String(100), unique=True, nullable=False)
    total_stock = Column(Integer, nullable=False, default=0)
    available_stock = Column(Integer, nullable=False, default=0)
    category = Column(String(50), nullable=False, default="General")
    is_active = Column(Boolean, default=True)

    borrow_details = relationship("BorrowDetail", back_populates="item")


class BorrowTransaction(Base):
    __tablename__ = "borrow_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    nik = Column(String(20), ForeignKey("employees.nik"), nullable=False)
    borrow_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=False)
    actual_return_date = Column(Date, nullable=True)
    status = Column(Enum(BorrowStatus), default=BorrowStatus.BORROWED, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="transactions")
    details = relationship("BorrowDetail", back_populates="transaction", cascade="all, delete-orphan")


class BorrowDetail(Base):
    __tablename__ = "borrow_details"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    transaction_id = Column(Integer, ForeignKey("borrow_transactions.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    transaction = relationship("BorrowTransaction", back_populates="details")
    item = relationship("Item", back_populates="borrow_details")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
