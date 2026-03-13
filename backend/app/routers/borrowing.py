from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    BorrowTransaction, BorrowDetail, BorrowStatus, Item, Employee
)
from app.schemas import (
    BorrowRequest, BorrowResponse, BorrowDetailResponse, ReturnRequest
)

router = APIRouter()


def build_borrow_response(transaction: BorrowTransaction) -> BorrowResponse:
    """Build a full BorrowResponse from a transaction ORM object."""
    details = []
    for d in transaction.details:
        details.append(BorrowDetailResponse(
            id=d.id,
            item_id=d.item_id,
            item_name=d.item.item_name if d.item else "Unknown",
            quantity=d.quantity,
        ))

    return BorrowResponse(
        id=transaction.id,
        nik=transaction.nik,
        employee_name=transaction.employee.name if transaction.employee else "Unknown",
        department=transaction.employee.department if transaction.employee else "Unknown",
        borrow_date=transaction.borrow_date,
        return_date=transaction.return_date,
        actual_return_date=transaction.actual_return_date,
        status=transaction.status,
        notes=transaction.notes,
        created_at=transaction.created_at,
        details=details,
    )


@router.post("/", response_model=BorrowResponse, status_code=status.HTTP_201_CREATED)
def submit_borrow_request(request: BorrowRequest, db: Session = Depends(get_db)):
    """
    Submit a new borrow request.
    Validates stock availability and decrements available_stock.
    """
    # Validate employee exists
    employee = db.query(Employee).filter(Employee.nik == request.nik).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with NIK '{request.nik}' not found. Please register first.",
        )

    # Validate dates
    if request.return_date < request.borrow_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Return date must be on or after borrow date",
        )

    # Validate and collect items
    borrow_details = []
    items_to_update = []

    for item_req in request.items:
        item = db.query(Item).filter(
            Item.id == item_req.item_id,
            Item.is_active == True,
        ).first()

        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with id {item_req.item_id} not found or inactive",
            )

        if item.available_stock < item_req.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{item.item_name}'. "
                       f"Available: {item.available_stock}, Requested: {item_req.quantity}",
            )

        borrow_details.append({
            "item": item,
            "quantity": item_req.quantity,
        })
        items_to_update.append((item, item_req.quantity))

    # Create transaction
    transaction = BorrowTransaction(
        nik=request.nik,
        borrow_date=request.borrow_date,
        return_date=request.return_date,
        status=BorrowStatus.BORROWED,
        notes=request.notes,
    )
    db.add(transaction)
    db.flush()  # Get the transaction ID

    # Create details and decrement stock
    for detail_data in borrow_details:
        detail = BorrowDetail(
            transaction_id=transaction.id,
            item_id=detail_data["item"].id,
            quantity=detail_data["quantity"],
        )
        db.add(detail)

    for item, qty in items_to_update:
        item.available_stock -= qty

    db.commit()
    db.refresh(transaction)

    # Reload with relationships
    transaction = db.query(BorrowTransaction).options(
        joinedload(BorrowTransaction.employee),
        joinedload(BorrowTransaction.details).joinedload(BorrowDetail.item),
    ).filter(BorrowTransaction.id == transaction.id).first()

    return build_borrow_response(transaction)


@router.get("/{transaction_id}", response_model=BorrowResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a single transaction with full details."""
    transaction = db.query(BorrowTransaction).options(
        joinedload(BorrowTransaction.employee),
        joinedload(BorrowTransaction.details).joinedload(BorrowDetail.item),
    ).filter(BorrowTransaction.id == transaction_id).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found",
        )

    return build_borrow_response(transaction)


@router.get("/history/{nik}", response_model=list[BorrowResponse])
def get_borrow_history(
    nik: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[BorrowStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    """Get borrowing history for an employee by NIK."""
    query = db.query(BorrowTransaction).options(
        joinedload(BorrowTransaction.employee),
        joinedload(BorrowTransaction.details).joinedload(BorrowDetail.item),
    ).filter(BorrowTransaction.nik == nik)

    if status_filter:
        query = query.filter(BorrowTransaction.status == status_filter)

    query = query.order_by(BorrowTransaction.created_at.desc())
    transactions = query.offset(skip).limit(limit).all()

    # Deduplicate due to joinedload
    seen_ids = set()
    unique_transactions = []
    for t in transactions:
        if t.id not in seen_ids:
            seen_ids.add(t.id)
            unique_transactions.append(t)

    return [build_borrow_response(t) for t in unique_transactions]


@router.put("/{transaction_id}/return", response_model=BorrowResponse)
def return_items(
    transaction_id: int,
    return_data: ReturnRequest = None,
    db: Session = Depends(get_db),
):
    """
    Mark a transaction as returned.
    Increments available_stock back for all items in the transaction.
    """
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
            detail="This transaction has already been returned",
        )

    # Update status
    transaction.status = BorrowStatus.RETURNED
    transaction.actual_return_date = date.today()

    if return_data and return_data.notes:
        existing_notes = transaction.notes or ""
        transaction.notes = f"{existing_notes}\n[Return note] {return_data.notes}".strip()

    # Increment stock back
    for detail in transaction.details:
        item = db.query(Item).filter(Item.id == detail.item_id).first()
        if item:
            item.available_stock += detail.quantity

    db.commit()
    db.refresh(transaction)

    # Reload with relationships
    transaction = db.query(BorrowTransaction).options(
        joinedload(BorrowTransaction.employee),
        joinedload(BorrowTransaction.details).joinedload(BorrowDetail.item),
    ).filter(BorrowTransaction.id == transaction.id).first()

    return build_borrow_response(transaction)
