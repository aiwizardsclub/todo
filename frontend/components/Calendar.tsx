"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addYears,
  subYears,
  parseISO,
} from "date-fns";
import type { Todo } from "@/types";
import { TodoPriority, TodoStatus } from "@/types";

type CalendarView = "week" | "month" | "year";

interface CalendarProps {
  todos: Todo[];
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getPriorityColor(priority: TodoPriority) {
  switch (priority) {
    case TodoPriority.HIGH:
      return "bg-red-100 text-red-700 border-red-200";
    case TodoPriority.MEDIUM:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case TodoPriority.LOW:
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getTodosForDay(todos: Todo[], day: Date): Todo[] {
  return todos.filter(
    (todo) => todo.due_date && isSameDay(parseISO(todo.due_date), day)
  );
}

// ─── Monthly View ───────────────────────────────────────────────
function MonthView({ todos, currentDate }: { todos: Todo[]; currentDate: Date }) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-xs font-semibold text-gray-500 uppercase"
          >
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[minmax(100px,1fr)]">
        {days.map((day) => {
          const dayTodos = getTodosForDay(todos, day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`border border-gray-100 p-1.5 ${
                !inMonth ? "bg-gray-50" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    today
                      ? "bg-blue-600 text-white"
                      : !inMonth
                      ? "text-gray-400"
                      : "text-gray-700"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayTodos.length > 0 && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    {dayTodos.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayTodos.slice(0, 3).map((todo) => (
                  <div
                    key={todo.id}
                    className={`text-[11px] px-1.5 py-0.5 rounded border truncate ${getPriorityColor(
                      todo.priority
                    )} ${
                      todo.status === TodoStatus.COMPLETED
                        ? "line-through opacity-60"
                        : ""
                    }`}
                    title={todo.title}
                  >
                    {todo.title}
                  </div>
                ))}
                {dayTodos.length > 3 && (
                  <div className="text-[10px] text-gray-500 pl-1.5">
                    +{dayTodos.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly View ────────────────────────────────────────────────
function WeekView({ todos, currentDate }: { todos: Todo[]; currentDate: Date }) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  return (
    <div>
      <div className="grid grid-cols-7 gap-3">
        {days.map((day) => {
          const dayTodos = getTodosForDay(todos, day);
          const today = isToday(day);

          return (
            <div key={day.toISOString()} className="min-h-[300px]">
              <div
                className={`text-center py-3 rounded-t-lg ${
                  today
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <div className="text-xs font-semibold uppercase">
                  {format(day, "EEE")}
                </div>
                <div className="text-lg font-bold">{format(day, "d")}</div>
              </div>
              <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-2 space-y-2 min-h-[250px]">
                {dayTodos.length > 0 ? (
                  dayTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`p-2 rounded-lg border ${getPriorityColor(
                        todo.priority
                      )} ${
                        todo.status === TodoStatus.COMPLETED
                          ? "line-through opacity-60"
                          : ""
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">
                        {todo.title}
                      </div>
                      {todo.description && (
                        <div className="text-[10px] mt-0.5 opacity-75 truncate">
                          {todo.description}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-medium uppercase">
                          {todo.priority}
                        </span>
                        {todo.category && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded">
                            {todo.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 text-center pt-4">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Yearly View ────────────────────────────────────────────────
function YearView({
  todos,
  currentDate,
  onMonthClick,
}: {
  todos: Todo[];
  currentDate: Date;
  onMonthClick: (date: Date) => void;
}) {
  const months = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
  }, [currentDate]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const calStart = startOfWeek(monthStart);
        const calEnd = endOfWeek(monthEnd);
        const days = eachDayOfInterval({ start: calStart, end: calEnd });

        const monthTodos = todos.filter(
          (todo) =>
            todo.due_date &&
            isSameMonth(parseISO(todo.due_date), month)
        );

        return (
          <div
            key={month.toISOString()}
            className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onMonthClick(month)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-gray-800">
                {format(month, "MMMM")}
              </h3>
              {monthTodos.length > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                  {monthTodos.length}
                </span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {DAY_NAMES.map((name) => (
                <div
                  key={name}
                  className="text-[9px] text-gray-400 text-center font-medium"
                >
                  {name.charAt(0)}
                </div>
              ))}
              {days.map((day) => {
                const dayTodos = getTodosForDay(todos, day);
                const inMonth = isSameMonth(day, month);
                const today = isToday(day);
                const hasHigh = dayTodos.some(
                  (t) => t.priority === TodoPriority.HIGH
                );
                const hasTasks = dayTodos.length > 0;

                return (
                  <div
                    key={day.toISOString()}
                    className="flex items-center justify-center h-5"
                  >
                    {inMonth ? (
                      <span
                        className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] ${
                          today
                            ? "bg-blue-600 text-white font-bold"
                            : hasTasks
                            ? hasHigh
                              ? "bg-red-100 text-red-700 font-semibold"
                              : "bg-blue-100 text-blue-700 font-semibold"
                            : "text-gray-600"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-300">
                        {format(day, "d")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Calendar Component ────────────────────────────────────
export default function Calendar({
  todos,
  view,
  onViewChange,
  currentDate,
  onDateChange,
}: CalendarProps) {
  const handlePrev = () => {
    if (view === "month") onDateChange(subMonths(currentDate, 1));
    else if (view === "week") onDateChange(subWeeks(currentDate, 1));
    else onDateChange(subYears(currentDate, 1));
  };

  const handleNext = () => {
    if (view === "month") onDateChange(addMonths(currentDate, 1));
    else if (view === "week") onDateChange(addWeeks(currentDate, 1));
    else onDateChange(addYears(currentDate, 1));
  };

  const handleToday = () => onDateChange(new Date());

  const handleMonthClick = (date: Date) => {
    onDateChange(date);
    onViewChange("month");
  };

  const periodLabel = useMemo(() => {
    if (view === "year") return format(currentDate, "yyyy");
    if (view === "month") return format(currentDate, "MMMM yyyy");
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
  }, [view, currentDate]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
            {periodLabel}
          </h2>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          {(["week", "month", "year"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                view === v
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Body */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {view === "month" && (
          <MonthView todos={todos} currentDate={currentDate} />
        )}
        {view === "week" && (
          <WeekView todos={todos} currentDate={currentDate} />
        )}
        {view === "year" && (
          <YearView
            todos={todos}
            currentDate={currentDate}
            onMonthClick={handleMonthClick}
          />
        )}
      </div>
    </div>
  );
}
