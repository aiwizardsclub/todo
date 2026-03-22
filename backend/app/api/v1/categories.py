from fastapi import APIRouter, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List
import uuid

from app.api.deps import DatabaseSession, CurrentUser
from app.models.todo import Category
from app.schemas.todo import (
    CategoryCreate, CategoryUpdate,
    Category as CategorySchema
)

router = APIRouter()


@router.get("", response_model=List[CategorySchema])
async def get_categories(
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Get all categories for the current user.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        List[Category]: List of categories
    """
    result = await db.execute(
        select(Category)
        .where(Category.user_id == current_user.id)
        .order_by(Category.name)
    )
    categories = result.scalars().all()
    return list(categories)


@router.post("", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Create a new category.

    Args:
        category_data: Category creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Category: The created category

    Raises:
        HTTPException: If category name already exists for user
    """
    # Check if category name already exists for this user
    result = await db.execute(
        select(Category).where(
            and_(
                Category.user_id == current_user.id,
                Category.name == category_data.name
            )
        )
    )
    existing_category = result.scalar_one_or_none()

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )

    # Create category
    category = Category(
        user_id=current_user.id,
        name=category_data.name,
        color=category_data.color
    )

    db.add(category)
    await db.commit()
    await db.refresh(category)

    return category


@router.get("/{category_id}", response_model=CategorySchema)
async def get_category(
    category_id: uuid.UUID,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Get a specific category by ID.

    Args:
        category_id: Category ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Category: The requested category

    Raises:
        HTTPException: If category not found or not owned by user
    """
    result = await db.execute(
        select(Category).where(
            and_(
                Category.id == category_id,
                Category.user_id == current_user.id
            )
        )
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    return category


@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: uuid.UUID,
    category_data: CategoryUpdate,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Update a category.

    Args:
        category_id: Category ID
        category_data: Category update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Category: The updated category

    Raises:
        HTTPException: If category not found, not owned by user, or name already exists
    """
    # Get category
    result = await db.execute(
        select(Category).where(
            and_(
                Category.id == category_id,
                Category.user_id == current_user.id
            )
        )
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Check if new name already exists (if name is being changed)
    if category_data.name and category_data.name != category.name:
        result = await db.execute(
            select(Category).where(
                and_(
                    Category.user_id == current_user.id,
                    Category.name == category_data.name
                )
            )
        )
        existing_category = result.scalar_one_or_none()

        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )

    # Update fields
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)

    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Delete a category.

    Args:
        category_id: Category ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If category not found, not owned by user, or has associated todos

    Note:
        This will fail if there are todos associated with this category.
        The todos' category_id will be set to NULL due to ON DELETE SET NULL.
    """
    # Get category
    result = await db.execute(
        select(Category).where(
            and_(
                Category.id == category_id,
                Category.user_id == current_user.id
            )
        )
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Check if category has associated todos
    from app.models.todo import Todo
    result = await db.execute(
        select(func.count()).select_from(Todo).where(Todo.category_id == category_id)
    )
    todo_count = result.scalar_one()

    if todo_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category with {todo_count} associated todo(s). Please reassign or delete the todos first."
        )

    # Delete category
    await db.delete(category)
    await db.commit()

    return None
