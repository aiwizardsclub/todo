"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { todoApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Calendar from "@/components/Calendar";
import { TodoStatus } from "@/types";

type CalendarView = "week" | "month" | "year";

export default function CalendarPage() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const todos = useMemo(() => todoData?.items || [], [todoData]);

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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Calendar</h2>
        <p className="text-gray-600 mt-1">
          View your tasks on the calendar
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
    </main>
  );
}
