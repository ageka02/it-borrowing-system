from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Item, AdminUser
from app.schemas import ItemCreate, ItemUpdate, ItemResponse
from app.routers.auth import get_current_admin

router = APIRouter()


@router.get("/", response_model=list[ItemResponse])
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = None,
    search: Optional[str] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
):
    """List all active items with stock info. Supports filtering and pagination."""
    query = db.query(Item)

    if not include_inactive:
        query = query.filter(Item.is_active == True)

    if category:
        query = query.filter(Item.category == category)

    if search:
        query = query.filter(Item.item_name.ilike(f"%{search}%"))

    query = query.order_by(Item.item_name)
    items = query.offset(skip).limit(limit).all()
    return items


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get a single item by ID."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found",
        )
    return item


@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    item_data: ItemCreate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """Create a new item (admin only)."""
    # Check for duplicate item name
    existing = db.query(Item).filter(Item.item_name == item_data.item_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Item '{item_data.item_name}' already exists",
        )

    item = Item(
        item_name=item_data.item_name,
        total_stock=item_data.total_stock,
        available_stock=item_data.available_stock if item_data.available_stock is not None else item_data.total_stock,
        category=item_data.category,
        is_active=item_data.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    item_data: ItemUpdate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """Update an item (admin only)."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found",
        )

    # Check for duplicate name if changing
    if item_data.item_name and item_data.item_name != item.item_name:
        existing = db.query(Item).filter(Item.item_name == item_data.item_name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Item '{item_data.item_name}' already exists",
            )

    update_fields = item_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """Soft delete an item - sets is_active to False (admin only)."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found",
        )

    item.is_active = False
    db.commit()
    return {"message": f"Item '{item.item_name}' has been deactivated", "id": item_id}
