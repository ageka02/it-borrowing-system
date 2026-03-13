import logging
from datetime import date, datetime
from typing import Optional
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    BorrowTransaction, BorrowDetail, BorrowStatus, Item, Employee, AdminUser
)
from app.schemas import DashboardStats, BorrowResponse, BorrowDetailResponse
from app.routers.auth import get_current_admin
from app.routers.borrowing import build_borrow_response

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Dashboard ───────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """Get dashboard statistics."""
    total_items = db.query(Item).count()
    total_active_items = db.query(Item).filter(Item.is_active == True).count()

    active_borrows = db.query(BorrowTransaction).filter(
        BorrowTransaction.status == BorrowStatus.BORROWED
    ).count()

    overdue_count = db.query(BorrowTransaction).filter(
        BorrowTransaction.status == BorrowStatus.OVERDUE
    ).count()

    total_transactions = db.query(BorrowTransaction).count()

    returned_count = db.query(BorrowTransaction).filter(
        BorrowTransaction.status == BorrowStatus.RETURNED
    ).count()

    total_employees_borrowed = db.query(
        func.count(func.distinct(BorrowTransaction.nik))
    ).scalar() or 0

    return DashboardStats(
        total_items=total_items,
        total_active_items=total_active_items,
        active_borrows=active_borrows,
        overdue_count=overdue_count,
        total_transactions=total_transactions,
        returned_count=returned_count,
        total_employees_borrowed=total_employees_borrowed,
    )


# ─── Transactions List ───────────────────────────────────────────────────────

@router.get("/transactions")
def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[BorrowStatus] = Query(None, alias="status"),
    department: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """List all transactions with filters, search, and pagination."""
    query = db.query(BorrowTransaction).options(
        joinedload(BorrowTransaction.employee),
        joinedload(BorrowTransaction.details).joinedload(BorrowDetail.item),
    )

    # Apply filters
    if status_filter:
        query = query.filter(BorrowTransaction.status == status_filter)

    if department:
        query = query.join(Employee).filter(Employee.department == department)

    if date_from:
        query = query.filter(BorrowTransaction.borrow_date >= date_from)

    if date_to:
        query = query.filter(BorrowTransaction.borrow_date <= date_to)

    if search:
        query = query.join(Employee, isouter=True).filter(
            or_(
                Employee.name.ilike(f"%{search}%"),
                Employee.nik.ilike(f"%{search}%"),
                BorrowTransaction.notes.ilike(f"%{search}%"),
            )
        )

    # Get total count for pagination (use subquery to avoid join duplicates)
    count_query = db.query(func.count(func.distinct(BorrowTransaction.id)))
    if status_filter:
        count_query = count_query.filter(BorrowTransaction.status == status_filter)
    if department:
        count_query = count_query.join(Employee).filter(Employee.department == department)
    if date_from:
        count_query = count_query.filter(BorrowTransaction.borrow_date >= date_from)
    if date_to:
        count_query = count_query.filter(BorrowTransaction.borrow_date <= date_to)
    total = count_query.scalar() or 0

    # Order and paginate
    query = query.order_by(BorrowTransaction.created_at.desc())
    transactions = query.offset(skip).limit(limit).all()

    # Deduplicate due to joinedload
    seen_ids = set()
    unique_transactions = []
    for t in transactions:
        if t.id not in seen_ids:
            seen_ids.add(t.id)
            unique_transactions.append(t)

    items = [build_borrow_response(t) for t in unique_transactions]

    return {
        "items": [item.model_dump() for item in items],
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total,
    }


# ─── Overdue ─────────────────────────────────────────────────────────────────

@router.get("/overdue")
def list_overdue(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """List all overdue transactions."""
    today = date.today()

    # Get transactions that are OVERDUE or BORROWED past due date
    query = db.query(BorrowTransaction).options(
        joinedload(BorrowTransaction.employee),
        joinedload(BorrowTransaction.details).joinedload(BorrowDetail.item),
    ).filter(
        or_(
            BorrowTransaction.status == BorrowStatus.OVERDUE,
            (
                (BorrowTransaction.status == BorrowStatus.BORROWED) &
                (BorrowTransaction.return_date < today)
            ),
        )
    ).order_by(BorrowTransaction.return_date.asc())

    transactions = query.offset(skip).limit(limit).all()

    # Deduplicate
    seen_ids = set()
    unique_transactions = []
    for t in transactions:
        if t.id not in seen_ids:
            seen_ids.add(t.id)
            unique_transactions.append(t)

    results = []
    for t in unique_transactions:
        resp = build_borrow_response(t)
        days_overdue = (today - t.return_date).days if t.return_date < today else 0
        results.append({
            **resp.model_dump(),
            "days_overdue": days_overdue,
        })

    return results


# ─── Manual Reminder ─────────────────────────────────────────────────────────

@router.post("/remind/{transaction_id}")
def send_manual_reminder(
    transaction_id: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """Send a manual reminder email for a transaction."""
    transaction = db.query(BorrowTransaction).options(
        joinedload(BorrowTransaction.employee),
        joinedload(BorrowTransaction.details).joinedload(BorrowDetail.item),
    ).filter(BorrowTransaction.id == transaction_id).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found",
        )

    if transaction.status == BorrowStatus.RETURNED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send reminder for already returned items",
        )

    # Build items list for email
    items_list = [
        {"name": d.item.item_name, "quantity": d.quantity}
        for d in transaction.details if d.item
    ]

    try:
        from app.services.email_service import send_reminder_email
        send_reminder_email(
            employee_email=transaction.employee.email,
            employee_name=transaction.employee.name,
            items=items_list,
            return_date=transaction.return_date,
        )
        return {
            "message": f"Reminder sent to {transaction.employee.email}",
            "transaction_id": transaction_id,
        }
    except Exception as e:
        logger.error(f"Failed to send reminder: {e}")
        return {
            "message": f"Reminder attempted but email delivery failed: {str(e)}",
            "transaction_id": transaction_id,
            "email_sent": False,
        }


# ─── Export Excel ────────────────────────────────────────────────────────────

@router.get("/export/excel")
def export_excel(
    status_filter: Optional[BorrowStatus] = Query(None, alias="status"),
    department: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """Export transactions to Excel file."""
    query = db.query(BorrowTransaction).options(
        joinedload(BorrowTransaction.employee),
        joinedload(BorrowTransaction.details).joinedload(BorrowDetail.item),
    )

    if status_filter:
        query = query.filter(BorrowTransaction.status == status_filter)
    if department:
        query = query.join(Employee).filter(Employee.department == department)
    if date_from:
        query = query.filter(BorrowTransaction.borrow_date >= date_from)
    if date_to:
        query = query.filter(BorrowTransaction.borrow_date <= date_to)

    transactions = query.order_by(BorrowTransaction.created_at.desc()).all()

    # Deduplicate
    seen_ids = set()
    unique_transactions = []
    for t in transactions:
        if t.id not in seen_ids:
            seen_ids.add(t.id)
            unique_transactions.append(t)

    try:
        from app.services.export_service import export_to_excel
        excel_bytes = export_to_excel(unique_transactions)

        return StreamingResponse(
            BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=borrowing_report_{date.today().isoformat()}.xlsx"
            },
        )
    except Exception as e:
        logger.error(f"Excel export failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}",
        )


# ─── Export PDF ──────────────────────────────────────────────────────────────

@router.get("/export/pdf")
def export_pdf(
    status_filter: Optional[BorrowStatus] = Query(None, alias="status"),
    department: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """Export transactions to PDF file."""
    query = db.query(BorrowTransaction).options(
        joinedload(BorrowTransaction.employee),
        joinedload(BorrowTransaction.details).joinedload(BorrowDetail.item),
    )

    if status_filter:
        query = query.filter(BorrowTransaction.status == status_filter)
    if department:
        query = query.join(Employee).filter(Employee.department == department)
    if date_from:
        query = query.filter(BorrowTransaction.borrow_date >= date_from)
    if date_to:
        query = query.filter(BorrowTransaction.borrow_date <= date_to)

    transactions = query.order_by(BorrowTransaction.created_at.desc()).all()

    # Deduplicate
    seen_ids = set()
    unique_transactions = []
    for t in transactions:
        if t.id not in seen_ids:
            seen_ids.add(t.id)
            unique_transactions.append(t)

    try:
        from app.services.export_service import export_to_pdf
        pdf_bytes = export_to_pdf(unique_transactions)

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=borrowing_report_{date.today().isoformat()}.pdf"
            },
        )
    except Exception as e:
        logger.error(f"PDF export failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}",
        )
