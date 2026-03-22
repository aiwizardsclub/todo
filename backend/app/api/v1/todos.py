from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
import uuid

from app.api.deps import DatabaseSession, CurrentUser
from app.models.todo import Todo, TodoStatus, TodoPriority
from app.models.user import User
from app.schemas.todo import (
    TodoCreate, TodoUpdate, TodoStatusUpdate,
    Todo as TodoSchema, TodoList
)

router = APIRouter()


@router.get("", response_model=TodoList)
async def get_todos(
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: TodoStatus | None = None,
    priority: TodoPriority | None = None,
    category_id: uuid.UUID | None = None,
    search: str | None = None,
    sort_by: str = Query("created_at", regex="^(created_at|due_date|priority|title|updated_at)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
):
    """
    Get todos for the current user with filtering, sorting, and pagination.

    Args:
        db: Database session
        current_user: Current authenticated user
        page: Page number (starts at 1)
        page_size: Number of items per page
        status: Filter by status
        priority: Filter by priority
        category_id: Filter by category
        search: Search in title and description
        sort_by: Sort field
        sort_order: Sort order (asc/desc)

    Returns:
        TodoList: Paginated list of todos
    """
    # Build query
    query = select(Todo).where(Todo.user_id == current_user.id)

    # Apply filters
    if status:
        query = query.where(Todo.status == status)
    if priority:
        query = query.where(Todo.priority == priority)
    if category_id:
        query = query.where(Todo.category_id == category_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Todo.title.ilike(search_pattern),
                Todo.description.ilike(search_pattern)
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    result = await db.execute(count_query)
    total = result.scalar_one()

    # Apply sorting
    sort_column = getattr(Todo, sort_by)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Load relationships
    query = query.options(
        selectinload(Todo.category),
        selectinload(Todo.tags)
    )

    # Execute query
    result = await db.execute(query)
    todos = result.scalars().all()

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return TodoList(
        items=list(todos),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=TodoSchema, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo_data: TodoCreate,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Create a new todo.

    Args:
        todo_data: Todo creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Todo: The created todo
    """
    # Create todo
    todo = Todo(
        user_id=current_user.id,
        title=todo_data.title,
        description=todo_data.description,
        priority=todo_data.priority,
        status=todo_data.status,
        due_date=todo_data.due_date,
        reminder_at=todo_data.reminder_at,
        category_id=todo_data.category_id,
    )

    db.add(todo)
    await db.flush()  # Flush to get the todo ID

    # Add tags if provided
    if todo_data.tag_ids:
        from app.models.todo import Tag
        tag_result = await db.execute(
            select(Tag).where(
                and_(
                    Tag.id.in_(todo_data.tag_ids),
                    Tag.user_id == current_user.id
                )
            )
        )
        tags = tag_result.scalars().all()
        todo.tags = list(tags)

    await db.commit()

    # Reload with relationships eagerly loaded
    result = await db.execute(
        select(Todo)
        .where(Todo.id == todo.id)
        .options(selectinload(Todo.category), selectinload(Todo.tags))
    )
    todo = result.scalar_one()

    return todo


@router.get("/{todo_id}", response_model=TodoSchema)
async def get_todo(
    todo_id: uuid.UUID,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Get a specific todo by ID.

    Args:
        todo_id: Todo ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Todo: The requested todo

    Raises:
        HTTPException: If todo not found or not owned by user
    """
    query = select(Todo).where(
        and_(
            Todo.id == todo_id,
            Todo.user_id == current_user.id
        )
    ).options(
        selectinload(Todo.category),
        selectinload(Todo.tags)
    )

    result = await db.execute(query)
    todo = result.scalar_one_or_none()

    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    return todo


@router.put("/{todo_id}", response_model=TodoSchema)
async def update_todo(
    todo_id: uuid.UUID,
    todo_data: TodoUpdate,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Update a todo.

    Args:
        todo_id: Todo ID
        todo_data: Todo update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Todo: The updated todo

    Raises:
        HTTPException: If todo not found or not owned by user
    """
    # Get todo
    result = await db.execute(
        select(Todo).where(
            and_(
                Todo.id == todo_id,
                Todo.user_id == current_user.id
            )
        )
    )
    todo = result.scalar_one_or_none()

    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    # Update fields
    update_data = todo_data.model_dump(exclude_unset=True, exclude={'tag_ids'})
    for field, value in update_data.items():
        setattr(todo, field, value)

    # Update tags if provided
    if todo_data.tag_ids is not None:
        from app.models.todo import Tag
        tag_result = await db.execute(
            select(Tag).where(
                and_(
                    Tag.id.in_(todo_data.tag_ids),
                    Tag.user_id == current_user.id
                )
            )
        )
        tags = tag_result.scalars().all()
        todo.tags = list(tags)

    # Update completed_at if status changed to completed
    if todo_data.status == TodoStatus.COMPLETED and todo.status != TodoStatus.COMPLETED:
        todo.completed_at = datetime.now()
    elif todo_data.status and todo_data.status != TodoStatus.COMPLETED:
        todo.completed_at = None

    await db.commit()
    await db.refresh(todo, ['category', 'tags'])

    return todo


@router.patch("/{todo_id}/status", response_model=TodoSchema)
async def update_todo_status(
    todo_id: uuid.UUID,
    status_data: TodoStatusUpdate,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Update todo status (quick toggle).

    Args:
        todo_id: Todo ID
        status_data: Status update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Todo: The updated todo

    Raises:
        HTTPException: If todo not found or not owned by user
    """
    # Get todo
    result = await db.execute(
        select(Todo).where(
            and_(
                Todo.id == todo_id,
                Todo.user_id == current_user.id
            )
        )
    )
    todo = result.scalar_one_or_none()

    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    # Update status
    todo.status = status_data.status

    # Update completed_at
    if status_data.status == TodoStatus.COMPLETED:
        todo.completed_at = datetime.now()
    else:
        todo.completed_at = None

    await db.commit()
    await db.refresh(todo, ['category', 'tags'])

    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: uuid.UUID,
    db: DatabaseSession,
    current_user: CurrentUser
):
    """
    Delete a todo.

    Args:
        todo_id: Todo ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If todo not found or not owned by user
    """
    # Get todo
    result = await db.execute(
        select(Todo).where(
            and_(
                Todo.id == todo_id,
                Todo.user_id == current_user.id
            )
        )
    )
    todo = result.scalar_one_or_none()

    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    # Delete todo
    await db.delete(todo)
    await db.commit()

    return None
