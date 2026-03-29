"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { todoApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Calendar from "@/components/Calendar";
import { TodoStatus, TodoPriority } from "@/types";

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
        page_size: 200,
        sort_by: "due_date",
        sort_order: "asc",
      }),
    enabled: isAuthenticated,
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
    const highPriority = todos.filter(
      (t) =>
        t.priority === TodoPriority.HIGH &&
        t.status !== TodoStatus.COMPLETED
    );
    return {
      total: todos.length,
      withDueDate: withDueDate.length,
      overdue: overdue.length,
      completed: completed.length,
      highPriority: highPriority.length,
    };
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
          <div className="text-2xl font-bold text-blue-600">
            {stats.withDueDate}
          </div>
          <div className="text-sm text-gray-500">Scheduled</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">
            {stats.overdue}
          </div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {stats.completed}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-600">Loading calendar...</div>
        </div>
      ) : (
        <Calendar
          todos={todos}
          view={view}
          onViewChange={setView}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
      )}
    </main>
  );
}
