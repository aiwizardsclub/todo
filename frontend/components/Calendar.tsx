"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
  onDayClick?: (date: Date) => void;
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

function getPriorityDot(priority: TodoPriority) {
  switch (priority) {
    case TodoPriority.HIGH:
      return "bg-red-500";
    case TodoPriority.MEDIUM:
      return "bg-yellow-500";
    case TodoPriority.LOW:
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

function getStatusLabel(status: TodoStatus) {
  switch (status) {
    case TodoStatus.COMPLETED:
      return "Completed";
    case TodoStatus.IN_PROGRESS:
      return "In Progress";
    case TodoStatus.PENDING:
      return "Pending";
    default:
      return status;
  }
}

function getStatusColor(status: TodoStatus) {
  switch (status) {
    case TodoStatus.COMPLETED:
      return "text-green-600";
    case TodoStatus.IN_PROGRESS:
      return "text-blue-600";
    case TodoStatus.PENDING:
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
}

function getTodosForDay(todos: Todo[], day: Date): Todo[] {
  return todos.filter(
    (todo) => todo.due_date && isSameDay(parseISO(todo.due_date), day)
  );
}

// ─── Hover Tooltip ──────────────────────────────────────────────
function DayTooltip({
  todos,
  day,
  anchorRef,
  onClose,
}: {
  todos: Todo[];
  day: Date;
  anchorRef: HTMLElement | null;
  onClose: () => void;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef || !tooltipRef.current) return;
    const rect = anchorRef.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    let top = rect.bottom + 8;
    let left = rect.left + rect.width / 2 - tooltip.width / 2;

    if (top + tooltip.height > viewH - 20) top = rect.top - tooltip.height - 8;
    if (left < 10) left = 10;
    if (left + tooltip.width > viewW - 10) left = viewW - tooltip.width - 10;

    setPos({ top, left });
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        anchorRef &&
        !anchorRef.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorRef, onClose]);

  // Group by status
  const grouped = useMemo(() => {
    const map: Record<string, Todo[]> = {};
    todos.forEach((t) => {
      const key = t.status;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [todos]);

  const statusOrder = [TodoStatus.PENDING, TodoStatus.IN_PROGRESS, TodoStatus.COMPLETED];

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in duration-150"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
        <div className="text-white font-semibold text-sm">
          {format(day, "EEEE, MMM d, yyyy")}
        </div>
        <div className="text-blue-100 text-xs mt-0.5">
          {todos.length} task{todos.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Tasks grouped by status */}
      <div className="max-h-64 overflow-y-auto">
        {statusOrder.map((status) => {
          const items = grouped[status];
          if (!items || items.length === 0) return null;
          return (
            <div key={status}>
              <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                <span className={`text-xs font-semibold uppercase ${getStatusColor(status)}`}>
                  {getStatusLabel(status)} ({items.length})
                </span>
              </div>
              {items.map((todo) => (
                <div
                  key={todo.id}
                  className="px-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getPriorityDot(todo.priority)}`} />
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
                        <span className="text-[10px] text-gray-500 uppercase">{todo.priority}</span>
                        {todo.category && (
                          <span className="text-[10px] text-blue-600">{todo.category.name}</span>
                        )}
                        {todo.tags.length > 0 && (
                          <span className="text-[10px] text-purple-500">
                            {todo.tags.map((t) => `#${t.name}`).join(" ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hoverable Day Cell ─────────────────────────────────────────
function HoverDay({
  day,
  todos,
  children,
}: {
  day: Date;
  todos: Todo[];
  children: React.ReactNode;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = useCallback(() => {
    if (todos.length === 0) return;
    timerRef.current = setTimeout(() => setShowTooltip(true), 300);
  }, [todos.length]);

  const handleLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    // delay close so user can move to tooltip
    timerRef.current = setTimeout(() => setShowTooltip(false), 200);
  }, []);

  return (
    <div
      ref={cellRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {showTooltip && todos.length > 0 && (
        <DayTooltip
          todos={todos}
          day={day}
          anchorRef={cellRef.current}
          onClose={() => setShowTooltip(false)}
        />
      )}
    </div>
  );
}

// ─── Monthly View ───────────────────────────────────────────────
function MonthView({ todos, currentDate, onDayClick }: { todos: Todo[]; currentDate: Date; onDayClick?: (date: Date) => void }) {
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
          <div key={name} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
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
            <HoverDay key={day.toISOString()} day={day} todos={dayTodos}>
              <div
                onClick={() => onDayClick?.(day)}
                className={`border border-gray-100 p-1.5 h-full transition-colors cursor-pointer ${
                  !inMonth ? "bg-gray-50" : "bg-white"
                } hover:bg-blue-50/50`}
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
                        todo.status === TodoStatus.COMPLETED ? "line-through opacity-60" : ""
                      }`}
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
            </HoverDay>
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly View ────────────────────────────────────────────────
function WeekView({ todos, currentDate, onDayClick }: { todos: Todo[]; currentDate: Date; onDayClick?: (date: Date) => void }) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  return (
    <div className="grid grid-cols-7 gap-3 p-3">
      {days.map((day) => {
        const dayTodos = getTodosForDay(todos, day);
        const today = isToday(day);

        return (
          <HoverDay key={day.toISOString()} day={day} todos={dayTodos}>
            <div
              onClick={() => onDayClick?.(day)}
              className="min-h-[280px] cursor-pointer"
            >
              <div
                className={`text-center py-3 rounded-t-lg ${
                  today ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                <div className="text-xs font-semibold uppercase">{format(day, "EEE")}</div>
                <div className="text-lg font-bold">{format(day, "d")}</div>
              </div>
              <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-2 space-y-2 min-h-[220px]">
                {dayTodos.length > 0 ? (
                  dayTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`p-2 rounded-lg border ${getPriorityColor(todo.priority)} ${
                        todo.status === TodoStatus.COMPLETED ? "line-through opacity-60" : ""
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">{todo.title}</div>
                      {todo.description && (
                        <div className="text-[10px] mt-0.5 opacity-75 truncate">{todo.description}</div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-medium uppercase">{todo.priority}</span>
                        {todo.category && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded">
                            {todo.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 text-center pt-4">No tasks</div>
                )}
              </div>
            </div>
          </HoverDay>
        );
      })}
    </div>
  );
}

// ─── Yearly View ────────────────────────────────────────────────
function YearView({
  todos,
  currentDate,
  onMonthClick,
  onDayClick,
}: {
  todos: Todo[];
  currentDate: Date;
  onMonthClick: (date: Date) => void;
  onDayClick?: (date: Date) => void;
}) {
  const months = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
  }, [currentDate]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const calStart = startOfWeek(monthStart);
        const calEnd = endOfWeek(monthEnd);
        const days = eachDayOfInterval({ start: calStart, end: calEnd });

        const monthTodos = todos.filter(
          (todo) => todo.due_date && isSameMonth(parseISO(todo.due_date), month)
        );

        return (
          <div
            key={month.toISOString()}
            className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onMonthClick(month)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-gray-800">{format(month, "MMMM")}</h3>
              {monthTodos.length > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                  {monthTodos.length}
                </span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {DAY_NAMES.map((name) => (
                <div key={name} className="text-[9px] text-gray-400 text-center font-medium">
                  {name.charAt(0)}
                </div>
              ))}
              {days.map((day) => {
                const dayTodos = getTodosForDay(todos, day);
                const inMonth = isSameMonth(day, month);
                const today = isToday(day);
                const hasHigh = dayTodos.some((t) => t.priority === TodoPriority.HIGH);
                const hasTasks = dayTodos.length > 0;

                return (
                  <HoverDay key={day.toISOString()} day={day} todos={dayTodos}>
                    <div
                      className="flex items-center justify-center h-5"
                      onClick={(e) => {
                        if (inMonth && onDayClick) {
                          e.stopPropagation();
                          onDayClick(day);
                        }
                      }}
                    >
                      {inMonth ? (
                        <span
                          className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] cursor-pointer hover:ring-2 hover:ring-blue-300 ${
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
                        <span className="text-[9px] text-gray-300">{format(day, "d")}</span>
                      )}
                    </div>
                  </HoverDay>
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
  onDayClick,
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
      <div className="bg-white rounded-lg shadow overflow-visible">
        {view === "month" && <MonthView todos={todos} currentDate={currentDate} onDayClick={onDayClick} />}
        {view === "week" && <WeekView todos={todos} currentDate={currentDate} onDayClick={onDayClick} />}
        {view === "year" && (
          <YearView todos={todos} currentDate={currentDate} onMonthClick={handleMonthClick} onDayClick={onDayClick} />
        )}
      </div>
    </div>
  );
}
