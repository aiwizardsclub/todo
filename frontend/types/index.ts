// User types
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Todo types
export enum TodoStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export enum TodoPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  priority: TodoPriority;
  status: TodoStatus;
  due_date: string | null;
  reminder_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  category: Category | null;
  tags: Tag[];
}

export interface TodoCreate {
  title: string;
  description?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
  due_date?: string;
  reminder_at?: string;
  category_id?: string;
  tag_ids?: string[];
}

export interface TodoUpdate {
  title?: string;
  description?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
  due_date?: string;
  reminder_at?: string;
  category_id?: string;
  tag_ids?: string[];
}

export interface TodoList {
  items: Todo[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CategoryCreate {
  name: string;
  color?: string;
}

export interface TagCreate {
  name: string;
}

// Filter types
export interface TodoFilters {
  status?: TodoStatus;
  priority?: TodoPriority;
  category_id?: string;
  search?: string;
  sort_by?: "created_at" | "due_date" | "priority" | "title" | "updated_at";
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}
