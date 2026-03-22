from fastapi import APIRouter, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List
import uuid

from app.api.deps import DatabaseSession, CurrentUser
from app.models.todo import Tag
from app.schemas.todo import TagCreate, Tag as TagSchema

router = APIRouter()


@router.get("", response_model=List[TagSchema])
async def get_tags(
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Get all tags for the current user.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        List[Tag]: List of tags
    """
    result = await db.execute(
        select(Tag)
        .where(Tag.user_id == current_user.id)
        .order_by(Tag.name)
    )
    tags = result.scalars().all()
    return list(tags)


@router.post("", response_model=TagSchema, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Create a new tag.

    Args:
        tag_data: Tag creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Tag: The created tag

    Raises:
        HTTPException: If tag name already exists for user
    """
    # Check if tag name already exists for this user
    result = await db.execute(
        select(Tag).where(
            and_(
                Tag.user_id == current_user.id,
                Tag.name == tag_data.name
            )
        )
    )
    existing_tag = result.scalar_one_or_none()

    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag with this name already exists"
        )

    # Create tag
    tag = Tag(
        user_id=current_user.id,
        name=tag_data.name
    )

    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return tag


@router.get("/{tag_id}", response_model=TagSchema)
async def get_tag(
    tag_id: uuid.UUID,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Get a specific tag by ID.

    Args:
        tag_id: Tag ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Tag: The requested tag

    Raises:
        HTTPException: If tag not found or not owned by user
    """
    result = await db.execute(
        select(Tag).where(
            and_(
                Tag.id == tag_id,
                Tag.user_id == current_user.id
            )
        )
    )
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )

    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: uuid.UUID,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Delete a tag.

    Args:
        tag_id: Tag ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If tag not found or not owned by user

    Note:
        This will also remove the tag from all todos that use it.
    """
    # Get tag
    result = await db.execute(
        select(Tag).where(
            and_(
                Tag.id == tag_id,
                Tag.user_id == current_user.id
            )
        )
    )
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )

    # Delete tag (will automatically remove from todo_tags due to CASCADE)
    await db.delete(tag)
    await db.commit()

    return None
