from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
import uuid
from app.models.todo import TodoPriority, TodoStatus


class CategoryBase(BaseModel):
    """Base category schema."""
    name: str = Field(..., min_length=1, max_length=100)
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""
    name: str | None = Field(None, min_length=1, max_length=100)
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class Category(CategoryBase):
    """Schema for category response."""
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TagBase(BaseModel):
    """Base tag schema."""
    name: str = Field(..., min_length=1, max_length=50)


class TagCreate(TagBase):
    """Schema for creating a tag."""
    pass


class Tag(TagBase):
    """Schema for tag response."""
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TodoBase(BaseModel):
    """Base todo schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    priority: TodoPriority = TodoPriority.MEDIUM
    status: TodoStatus = TodoStatus.PENDING
    due_date: datetime | None = None
    reminder_at: datetime | None = None
    category_id: uuid.UUID | None = None


class TodoCreate(TodoBase):
    """Schema for creating a todo."""
    tag_ids: list[uuid.UUID] = Field(default_factory=list)


class TodoUpdate(BaseModel):
    """Schema for updating a todo."""
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    priority: TodoPriority | None = None
    status: TodoStatus | None = None
    due_date: datetime | None = None
    reminder_at: datetime | None = None
    category_id: uuid.UUID | None = None
    tag_ids: list[uuid.UUID] | None = None


class TodoStatusUpdate(BaseModel):
    """Schema for updating todo status."""
    status: TodoStatus


class Todo(TodoBase):
    """Schema for todo response."""
    id: uuid.UUID
    user_id: uuid.UUID
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    category: Category | None = None
    tags: list[Tag] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class TodoList(BaseModel):
    """Schema for paginated todo list."""
    items: list[Todo]
    total: int
    page: int
    page_size: int
    total_pages: int
