"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoApi, categoryApi, tagApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Calendar from "@/components/Calendar";
import { TodoStatus, TodoPriority } from "@/types";
import { format } from "date-fns";

type CalendarView = "week" | "month" | "year";

export default function CalendarPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // ─── Create Modal State ────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: "",
    description: "",
    priority: TodoPriority.MEDIUM,
    due_date: "",
    category_id: "",
    tag_ids: [] as string[],
  });

  // ─── Unscheduled Drawer State ──────────────────────────────────
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [assigningDateForId, setAssigningDateForId] = useState<string | null>(null);
  const [assignDateValue, setAssignDateValue] = useState("");

  // ─── Data Queries ──────────────────────────────────────────────
  const { data: todoData, isLoading } = useQuery({
    queryKey: ["todos", "calendar"],
    queryFn: () =>
      todoApi.getTodos({
        page: 1,
        page_size: 100,
      }),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getCategories(),
    enabled: isAuthenticated,
  });

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagApi.getTags(),
    enabled: isAuthenticated,
  });

  const todos = useMemo(() => todoData?.items || [], [todoData]);

  const unscheduledTodos = useMemo(
    () => todos.filter((t) => !t.due_date),
    [todos]
  );

  // Auto-expand drawer when there are unscheduled tasks (on first load)
  const [drawerInitialized, setDrawerInitialized] = useState(false);
  useEffect(() => {
    if (!drawerInitialized && todos.length > 0) {
      setDrawerInitialized(true);
      if (unscheduledTodos.length > 0) {
        setIsDrawerOpen(true);
      }
    }
  }, [drawerInitialized, todos.length, unscheduledTodos.length]);

  const stats = useMemo(() => {
    const withDueDate = todos.filter((t) => t.due_date);
    const overdue = withDueDate.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < new Date() &&
        t.status !== TodoStatus.COMPLETED
    );
    const completed = todos.filter(
      (t) => t.status === TodoStatus.COMPLETED
    );
    const pending = todos.filter(
      (t) => t.status === TodoStatus.PENDING
    );
    return {
      total: todos.length,
      withDueDate: withDueDate.length,
      overdue: overdue.length,
      completed: completed.length,
      pending: pending.length,
    };
  }, [todos]);

  // Group tasks by status for sidebar
  const tasksByStatus = useMemo(() => {
    const pending = todos.filter((t) => t.status === TodoStatus.PENDING);
    const inProgress = todos.filter((t) => t.status === TodoStatus.IN_PROGRESS);
    const completed = todos.filter((t) => t.status === TodoStatus.COMPLETED);
    return { pending, inProgress, completed };
  }, [todos]);

  // ─── Mutations ─────────────────────────────────────────────────
  const createTodoMutation = useMutation({
    mutationFn: (data: typeof createFormData) =>
      todoApi.createTodo({
        ...data,
        category_id: data.category_id || undefined,
        due_date: data.due_date || undefined,
        tag_ids: data.tag_ids.length > 0 ? data.tag_ids : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", "calendar"] });
      setIsCreateModalOpen(false);
      setCreateFormData({
        title: "",
        description: "",
        priority: TodoPriority.MEDIUM,
        due_date: "",
        category_id: "",
        tag_ids: [],
      });
    },
  });

  const assignDateMutation = useMutation({
    mutationFn: ({ id, due_date }: { id: string; due_date: string }) =>
      todoApi.updateTodo(id, { due_date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", "calendar"] });
      setAssigningDateForId(null);
      setAssignDateValue("");
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────
  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd'T'09:00");
    setCreateFormData({
      title: "",
      description: "",
      priority: TodoPriority.MEDIUM,
      due_date: dateStr,
      category_id: "",
      tag_ids: [],
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.title.trim()) return;
    createTodoMutation.mutate(createFormData);
  };

  const handleAssignDate = (todoId: string) => {
    if (!assignDateValue) return;
    assignDateMutation.mutate({
      id: todoId,
      due_date: assignDateValue + "T09:00:00",
    });
  };

  const getPriorityBadgeClass = (priority: TodoPriority) => {
    switch (priority) {
      case TodoPriority.HIGH:
        return "bg-red-100 text-red-700";
      case TodoPriority.MEDIUM:
        return "bg-yellow-100 text-yellow-700";
      case TodoPriority.LOW:
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Calendar</h2>
        <p className="text-gray-600 mt-1">
          View your tasks on the calendar. Click any day to create a task.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-600">Loading calendar...</div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar */}
          <div className="flex-1 min-w-0">
            <Calendar
              todos={todos}
              view={view}
              onViewChange={setView}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onDayClick={handleDayClick}
            />
          </div>

          {/* Task Sidebar - shown for week/month */}
          {(view === "week" || view === "month") && (
            <div className="lg:w-80 space-y-4">
              {/* Pending */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                  <h3 className="text-sm font-semibold text-gray-800">Pending</h3>
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    {tasksByStatus.pending.length}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {tasksByStatus.pending.length > 0 ? (
                    tasksByStatus.pending.slice(0, 8).map((todo) => (
                      <div key={todo.id} className="px-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <div className="text-sm font-medium text-gray-800 truncate">{todo.title}</div>
                        <div className="text-xs text-gray-500">
                          {todo.due_date && new Date(todo.due_date).toLocaleDateString()}
                          {todo.category && <span className="ml-2 text-blue-600">{todo.category.name}</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-400">No pending tasks</div>
                  )}
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  <h3 className="text-sm font-semibold text-gray-800">In Progress</h3>
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {tasksByStatus.inProgress.length}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {tasksByStatus.inProgress.length > 0 ? (
                    tasksByStatus.inProgress.slice(0, 8).map((todo) => (
                      <div key={todo.id} className="px-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <div className="text-sm font-medium text-gray-800 truncate">{todo.title}</div>
                        <div className="text-xs text-gray-500">
                          {todo.due_date && new Date(todo.due_date).toLocaleDateString()}
                          {todo.category && <span className="ml-2 text-blue-600">{todo.category.name}</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-400">No tasks in progress</div>
                  )}
                </div>
              </div>

              {/* Completed */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                  <h3 className="text-sm font-semibold text-gray-800">Completed</h3>
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {tasksByStatus.completed.length}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {tasksByStatus.completed.length > 0 ? (
                    tasksByStatus.completed.slice(0, 8).map((todo) => (
                      <div key={todo.id} className="px-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <div className="text-sm font-medium text-gray-500 truncate line-through">{todo.title}</div>
                        <div className="text-xs text-gray-400">
                          {todo.due_date && new Date(todo.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-400">No completed tasks</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Unscheduled Tasks Drawer ──────────────────────────────── */}
      {!isLoading && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Drawer Header (always visible) */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    isDrawerOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-800">Unscheduled Tasks</h3>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  {unscheduledTodos.length}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {isDrawerOpen ? "Click to collapse" : "Click to expand"}
              </span>
            </button>

            {/* Drawer Content */}
            {isDrawerOpen && (
              <div className="border-t border-gray-100">
                {unscheduledTodos.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {unscheduledTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${getPriorityBadgeClass(
                              todo.priority
                            )}`}
                          >
                            {todo.priority}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-sm font-medium truncate ${
                                todo.status === TodoStatus.COMPLETED
                                  ? "line-through text-gray-400"
                                  : "text-gray-800"
                              }`}
                            >
                              {todo.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {todo.category && (
                                <span className="text-xs text-blue-600">{todo.category.name}</span>
                              )}
                              {todo.tags.length > 0 && (
                                <span className="text-xs text-purple-500">
                                  {todo.tags.map((t) => `#${t.name}`).join(" ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Assign Date UI */}
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {assigningDateForId === todo.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={assignDateValue}
                                onChange={(e) => setAssignDateValue(e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                              />
                              <button
                                onClick={() => handleAssignDate(todo.id)}
                                disabled={!assignDateValue || assignDateMutation.isPending}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                {assignDateMutation.isPending ? "..." : "Set"}
                              </button>
                              <button
                                onClick={() => {
                                  setAssigningDateForId(null);
                                  setAssignDateValue("");
                                }}
                                className="px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAssigningDateForId(todo.id);
                                setAssignDateValue("");
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              Assign Date
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-gray-400">
                      All tasks have a due date assigned. Great job!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Create Task Modal ─────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Task</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Pre-filled date indicator */}
              {createFormData.due_date && (
                <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  Due date pre-set to:{" "}
                  <span className="font-semibold">
                    {new Date(createFormData.due_date).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}

              <form onSubmit={handleCreateTodo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.title}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={createFormData.priority}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          priority: e.target.value as TodoPriority,
                        })
                      }
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
                      value={createFormData.due_date}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, due_date: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={createFormData.category_id}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, category_id: e.target.value })
                    }
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags?.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={createFormData.tag_ids.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateFormData({
                                ...createFormData,
                                tag_ids: [...createFormData.tag_ids, tag.id],
                              });
                            } else {
                              setCreateFormData({
                                ...createFormData,
                                tag_ids: createFormData.tag_ids.filter((id) => id !== tag.id),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))}
                    {(!tags || tags.length === 0) && (
                      <p className="text-sm text-gray-500">No tags available.</p>
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
    </main>
  );
}
