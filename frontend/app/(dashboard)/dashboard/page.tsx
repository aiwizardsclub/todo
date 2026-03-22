"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoApi, categoryApi, tagApi } from "@/lib/api";
import { useState } from "react";
import { TodoFilters, TodoStatus, TodoPriority } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<TodoFilters>({
    page: 1,
    page_size: 20,
    sort_by: "created_at",
    sort_order: "desc",
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: TodoPriority.MEDIUM,
    due_date: "",
    category_id: "",
    tag_ids: [] as string[],
  });

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showTagForm, setShowTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch todos
  const { data: todos, isLoading: todosLoading } = useQuery({
    queryKey: ["todos", filters],
    queryFn: () => todoApi.getTodos(filters),
    enabled: isAuthenticated,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getCategories(),
    enabled: isAuthenticated,
  });

  // Fetch tags
  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagApi.getTags(),
    enabled: isAuthenticated,
  });

  // Toggle todo status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TodoStatus }) =>
      todoApi.updateTodoStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  // Delete todo mutation
  const deleteTodoMutation = useMutation({
    mutationFn: (id: string) => todoApi.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: (data: typeof formData) => todoApi.createTodo({
      ...data,
      category_id: data.category_id || undefined,
      due_date: data.due_date || undefined,
      tag_ids: data.tag_ids.length > 0 ? data.tag_ids : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setIsCreateModalOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: TodoPriority.MEDIUM,
        due_date: "",
        category_id: "",
        tag_ids: [],
      });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => categoryApi.createCategory({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategoryName("");
      setShowCategoryForm(false);
    },
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: (name: string) => tagApi.createTag({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setNewTagName("");
      setShowTagForm(false);
    },
  });

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    createTodoMutation.mutate(formData);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createCategoryMutation.mutate(newCategoryName);
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    createTagMutation.mutate(newTagName);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TODO App
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username}!
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Tasks</h2>
            <p className="text-gray-600 mt-1">
              {todos?.total || 0} total tasks
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            + Create Task
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.status || ""}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as TodoStatus || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filters.priority || ""}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value as TodoPriority || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search || ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* TODO List */}
        <div className="space-y-4">
          {todosLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading tasks...</div>
            </div>
          ) : todos && todos.items.length > 0 ? (
            todos.items.map((todo) => (
              <div
                key={todo.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={todo.status === TodoStatus.COMPLETED}
                      onChange={() =>
                        toggleStatusMutation.mutate({
                          id: todo.id,
                          status: todo.status === TodoStatus.COMPLETED ? TodoStatus.PENDING : TodoStatus.COMPLETED,
                        })
                      }
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${
                        todo.status === TodoStatus.COMPLETED ? "line-through text-gray-500" : "text-gray-900"
                      }`}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="text-gray-600 mt-1">{todo.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          todo.priority === TodoPriority.HIGH ? "bg-red-100 text-red-700" :
                          todo.priority === TodoPriority.MEDIUM ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {todo.priority}
                        </span>
                        {todo.category && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {todo.category.name}
                          </span>
                        )}
                        {todo.tags.map((tag) => (
                          <span key={tag.id} className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this task?")) {
                        deleteTodoMutation.mutate(todo.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600 text-lg">No tasks found</p>
              <p className="text-gray-500 text-sm mt-2">Create your first task to get started!</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {todos && todos.total_pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              disabled={(filters.page || 1) === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {filters.page || 1} of {todos.total_pages}
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              disabled={(filters.page || 1) >= todos.total_pages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Create TODO Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateTodo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as TodoPriority })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(!showCategoryForm)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Category
                    </button>
                  </div>
                  {showCategoryForm ? (
                    <form onSubmit={handleCreateCategory} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={createCategoryMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {createCategoryMutation.isPending ? "..." : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCategoryForm(false); setNewCategoryName(""); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : null}
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No Category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Tags
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTagForm(!showTagForm)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Tag
                    </button>
                  </div>
                  {showTagForm ? (
                    <form onSubmit={handleCreateTag} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Tag name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={createTagMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {createTagMutation.isPending ? "..." : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowTagForm(false); setNewTagName(""); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {tags?.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.tag_ids.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, tag_ids: [...formData.tag_ids, tag.id] });
                            } else {
                              setFormData({ ...formData, tag_ids: formData.tag_ids.filter(id => id !== tag.id) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))}
                    {(!tags || tags.length === 0) && (
                      <p className="text-sm text-gray-500">No tags available. Click &quot;+ Add Tag&quot; to create one!</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createTodoMutation.isPending}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createTodoMutation.isPending ? "Creating..." : "Create Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
