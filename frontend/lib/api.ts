import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Todo,
  TodoCreate,
  TodoUpdate,
  TodoList,
  TodoFilters,
  Category,
  CategoryCreate,
  Tag,
  TagCreate,
  TodoStatus,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post<AuthResponse>(
            `${API_URL}/api/v1/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token, refresh_token } = response.data;
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", refresh_token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>("/api/v1/auth/register", data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/api/v1/auth/login", data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/api/v1/auth/me");
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

// Todo API
export const todoApi = {
  getTodos: async (filters?: TodoFilters): Promise<TodoList> => {
    const response = await api.get<TodoList>("/api/v1/todos", {
      params: filters,
    });
    return response.data;
  },

  getTodo: async (id: string): Promise<Todo> => {
    const response = await api.get<Todo>(`/api/v1/todos/${id}`);
    return response.data;
  },

  createTodo: async (data: TodoCreate): Promise<Todo> => {
    const response = await api.post<Todo>("/api/v1/todos", data);
    return response.data;
  },

  updateTodo: async (id: string, data: TodoUpdate): Promise<Todo> => {
    const response = await api.put<Todo>(`/api/v1/todos/${id}`, data);
    return response.data;
  },

  updateTodoStatus: async (id: string, status: TodoStatus): Promise<Todo> => {
    const response = await api.patch<Todo>(`/api/v1/todos/${id}/status`, {
      status,
    });
    return response.data;
  },

  deleteTodo: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/todos/${id}`);
  },
};

// Category API
export const categoryApi = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>("/api/v1/categories");
    return response.data;
  },

  getCategory: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/api/v1/categories/${id}`);
    return response.data;
  },

  createCategory: async (data: CategoryCreate): Promise<Category> => {
    const response = await api.post<Category>("/api/v1/categories", data);
    return response.data;
  },

  updateCategory: async (
    id: string,
    data: Partial<CategoryCreate>
  ): Promise<Category> => {
    const response = await api.put<Category>(
      `/api/v1/categories/${id}`,
      data
    );
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/categories/${id}`);
  },
};

// Tag API
export const tagApi = {
  getTags: async (): Promise<Tag[]> => {
    const response = await api.get<Tag[]>("/api/v1/tags");
    return response.data;
  },

  getTag: async (id: string): Promise<Tag> => {
    const response = await api.get<Tag>(`/api/v1/tags/${id}`);
    return response.data;
  },

  createTag: async (data: TagCreate): Promise<Tag> => {
    const response = await api.post<Tag>("/api/v1/tags", data);
    return response.data;
  },

  deleteTag: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/tags/${id}`);
  },
};

export default api;
