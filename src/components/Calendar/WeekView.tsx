import { createMemo, For, Index, createSignal, onCleanup } from "solid-js";
import { useStore } from "@nanostores/solid";
import { css } from "../../../styled-system/css";
import {
  selectedDate,
  events,
  calendars,
  eventModalOpen,
  selectedEventId,
  eventSidePanelOpen,
  eventSidePanelData,
} from "../../stores";
import {
  getWeekDates,
  getHoursArray,
  formatTime,
  isToday,
} from "../../lib/date";
import { Temporal } from "@js-temporal/polyfill";
import type { CalendarEvent } from "../../types";

export function WeekView() {
  const $selectedDate = useStore(selectedDate);
  const $events = useStore(events);
  const $calendars = useStore(calendars);

  const weekDates = createMemo(() => {
    return getWeekDates($selectedDate(), "monday");
  });

  const hours = getHoursArray(0, 24);

  // Drag to create state
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal<{ date: Temporal.PlainDate; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = createSignal<{ date: Temporal.PlainDate; hour: number } | null>(null);

  const HOUR_HEIGHT = 64; // Height of each hour cell in pixels

  const getEventsForDate = (
    date: Temporal.PlainDate,
  ): CalendarEvent[] => {
    const visibleCalendarIds = new Set(
      Object.values($calendars())
        .filter((cal) => cal.isVisible)
        .map((cal) => cal.id),
    );

    return Object.values($events()).filter((event) => {
      if (!visibleCalendarIds.has(event.calendarId)) return false;
      if (event.isAllDay) return false;

      try {
        const eventStart = Temporal.PlainDateTime.from(
          event.startTime.replace("Z", ""),
        );
        return eventStart.toPlainDate().equals(date);
      } catch {
        return false;
      }
    });
  };

  const getEventPosition = (event: CalendarEvent): { top: number; height: number } => {
    try {
      const eventStart = Temporal.PlainDateTime.from(event.startTime.replace("Z", ""));
      const eventEnd = Temporal.PlainDateTime.from(event.endTime.replace("Z", ""));

      // Calculate top position based on start time
      const startMinutes = eventStart.hour * 60 + eventStart.minute;
      const top = (startMinutes / 60) * HOUR_HEIGHT;

      // Calculate height based on duration
      const endMinutes = eventEnd.hour * 60 + eventEnd.minute;
      const durationMinutes = endMinutes - startMinutes;
      const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20); // Minimum 20px height

      return { top, height };
    } catch {
      return { top: 0, height: HOUR_HEIGHT };
    }
  };

  const getAllDayEvents = (date: Temporal.PlainDate): CalendarEvent[] => {
    const visibleCalendarIds = new Set(
      Object.values($calendars())
        .filter((cal) => cal.isVisible)
        .map((cal) => cal.id),
    );

    return Object.values($events()).filter((event) => {
      if (!visibleCalendarIds.has(event.calendarId)) return false;
      if (!event.isAllDay) return false;

      try {
        const eventStart = Temporal.PlainDateTime.from(
          event.startTime.replace("Z", ""),
        );
        return eventStart.toPlainDate().equals(date);
      } catch {
        return false;
      }
    });
  };

  const handleEventClick = (event: CalendarEvent, e: MouseEvent) => {
    e.stopPropagation();
    selectedEventId.set(event.id);
    eventModalOpen.set(true);
  };

  const handleCellClick = (date: Temporal.PlainDate, _hour: number) => {
    selectedDate.set(date.toString());
    void _hour;
  };

  const handleMouseDown = (date: Temporal.PlainDate, hour: number) => {
    setIsDragging(true);
    setDragStart({ date, hour });
    setDragEnd({ date, hour });
  };

  const handleMouseEnter = (date: Temporal.PlainDate, hour: number) => {
    if (isDragging()) {
      setDragEnd({ date, hour });
    }
  };

  const handleMouseUp = () => {
    if (isDragging() && dragStart() && dragEnd()) {
      const start = dragStart()!;
      const end = dragEnd()!;

      // Determine which is earlier
      const startHour = Math.min(start.hour, end.hour);
      const endHour = Math.max(start.hour, end.hour) + 1; // +1 for end time

      // Format times
      const startTime = `${startHour.toString().padStart(2, "0")}:00`;
      const endTime = `${endHour.toString().padStart(2, "0")}:00`;

      // Open side panel with the selected time range
      eventSidePanelData.set({
        startDate: start.date.toString(),
        startTime: startTime,
        endDate: end.date.toString(),
        endTime: endTime,
        isAllDay: false,
      });
      eventSidePanelOpen.set(true);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Global mouse up handler
  onCleanup(() => {
    document.removeEventListener("mouseup", handleMouseUp);
  });

  document.addEventListener("mouseup", handleMouseUp);

  // Check if a cell is within the drag selection
  const isCellInSelection = (date: Temporal.PlainDate, hour: number): boolean => {
    if (!isDragging() || !dragStart() || !dragEnd()) return false;

    const start = dragStart()!;
    const end = dragEnd()!;

    // For now, only support single-day selections
    if (!start.date.equals(date) || !end.date.equals(date)) return false;

    const minHour = Math.min(start.hour, end.hour);
    const maxHour = Math.max(start.hour, end.hour);

    return hour >= minHour && hour <= maxHour;
  };

  return (
    <div
      class={css({
        display: "flex",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "background",
      })}
    >
      {/* Time labels column - separate from scrollable content */}
      <div
        class={css({
          width: "72px",
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "border",
          backgroundColor: "background",
        })}
      >
        {/* Header spacer */}
        <div
          class={css({
            height: "96px",
            borderBottom: "1px solid",
            borderColor: "border",
            backgroundColor: "muted",
          })}
        />
        {/* All day spacer */}
        <div
          class={css({
            minHeight: "52px",
            borderBottom: "1px solid",
            borderColor: "border",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "500",
            color: "mutedHover",
            paddingLeft: "8px",
            paddingRight: "8px",
          })}
        >
          All day
        </div>
        {/* Time labels */}
        <div>
          <For each={hours}>
            {(hour) => (
              <div
                class={css({
                  height: "64px",
                  borderBottom: "1px solid",
                  borderColor: "border",
                  fontSize: "12px",
                  color: "mutedHover",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-end",
                  paddingRight: "12px",
                  paddingTop: "4px",
                })}
              >
                {hour === 0
                  ? ""
                  : formatTime(`${hour.toString().padStart(2, "0")}:00`, "12h")}
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Scrollable content area */}
      <div
        class={css({
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
        })}
      >
        <div>
          {/* Header with day names */}
          <div
            class={css({
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              height: "96px",
              borderBottom: "1px solid",
              borderColor: "border",
            })}
          >
            <Index each={weekDates()}>
              {(date, index) => {
                const d = date();
                const isTodayDate = isToday(d);
                const dayNames = [
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                  "Sun",
                ];
                const dayName = dayNames[d.dayOfWeek - 1];
                const isLastColumn = index === 6;

                return (
                  <div
                    class={css({
                      textAlign: "center",
                      paddingTop: "16px", paddingBottom: "16px", paddingLeft: "12px", paddingRight: "12px",
                      borderRight: "1px solid",
                      borderColor: "border",
                      backgroundColor: "muted",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                    style={{
                      "border-right": isLastColumn ? "none" : undefined,
                    }}
                  >
                    <div
                      class={css({
                        fontSize: "12px",
                        color: "mutedHover",
                        marginBottom: "6px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      })}
                    >
                      {dayName}
                    </div>
                    <div
                      class={css({
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: isTodayDate ? "bold" : "medium",
                        borderRadius: "full",
                        backgroundColor: isTodayDate
                          ? "primary"
                          : "transparent",
                        color: isTodayDate ? "background" : "foreground",
                      })}
                    >
                      {d.day}
                    </div>
                  </div>
                );
              }}
            </Index>
          </div>

          {/* All-day events row */}
          <div
            class={css({
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              borderBottom: "1px solid",
              borderColor: "border",
              minHeight: "52px",
            })}
          >
            <Index each={weekDates()}>
              {(date, index) => {
                const d = date();
                const allDayEvents = createMemo(() => getAllDayEvents(d));
                const isLastColumn = index === 6;

                return (
                  <div
                    class={css({
                      borderRight: "1px solid",
                      borderColor: "border",
                      paddingTop: "8px", paddingBottom: "8px", paddingLeft: "8px", paddingRight: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    })}
                    style={{
                      "border-right": isLastColumn ? "none" : undefined,
                    }}
                  >
                    <For each={allDayEvents()}>
                      {(event) => (
                        <div
                          class={css({
                            fontSize: "12px",
                            paddingTop: "4px", paddingBottom: "4px", paddingLeft: "6px", paddingRight: "6px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            transition: "opacity 150ms",
                            _hover: {
                              opacity: 0.8,
                            },
                          })}
                          style={{
                            "background-color":
                              event.color || "var(--colors-primary)",
                            color: "white",
                          }}
                          onClick={(e) => handleEventClick(event, e)}
                        >
                          {event.title}
                        </div>
                      )}
                    </For>
                  </div>
                );
              }}
            </Index>
          </div>

          {/* Time grid container with overlaid events */}
          <div
            class={css({
              position: "relative",
            })}
          >
            {/* Hour grid rows */}
            <For each={hours}>
              {(hour) => (
                <div
                  class={css({
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  })}
                >
                  <Index each={weekDates()}>
                    {(date, index) => {
                      const d = date();
                      const isTodayDate = isToday(d);
                      const isLastColumn = index === 6;
                      const isSelected = createMemo(() => isCellInSelection(d, hour));

                      return (
                        <div
                          class={css({
                            height: "64px",
                            borderRight: "1px solid",
                            borderBottom: "1px solid",
                            borderColor: "border",
                            position: "relative",
                            cursor: "pointer",
                            backgroundColor: "background",
                            transition: "background-color 150ms",
                            _hover: {
                              backgroundColor: "hover",
                            },
                          })}
                          style={{
                            "border-right": isLastColumn ? "none" : undefined,
                            "background-color": isSelected()
                              ? "rgba(59, 130, 246, 0.15)"
                              : isTodayDate
                                ? "var(--colors-muted)"
                                : undefined,
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleMouseDown(d, hour);
                          }}
                          onMouseEnter={() => handleMouseEnter(d, hour)}
                          onClick={() => !isDragging() && handleCellClick(d, hour)}
                        />
                      );
                    }}
                  </Index>
                </div>
              )}
            </For>

            {/* Events overlay - positioned absolutely over the grid */}
            <div
              class={css({
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none",
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              })}
            >
              <Index each={weekDates()}>
                {(date, index) => {
                  const d = date();
                  const dayEvents = createMemo(() => getEventsForDate(d));
                  const isLastColumn = index === 6;

                  return (
                    <div
                      class={css({
                        position: "relative",
                        borderRight: "1px solid",
                        borderColor: "transparent",
                      })}
                      style={{
                        "border-right": isLastColumn ? "none" : undefined,
                      }}
                    >
                      <For each={dayEvents()}>
                        {(event) => {
                          const position = getEventPosition(event);
                          return (
                            <div
                              class={css({
                                position: "absolute",
                                left: "2px",
                                right: "2px",
                                fontSize: "11px",
                                paddingTop: "4px", paddingBottom: "4px", paddingLeft: "6px", paddingRight: "6px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                overflow: "hidden",
                                zIndex: 1,
                                transition: "opacity 150ms",
                                pointerEvents: "auto",
                                _hover: {
                                  opacity: 0.8,
                                },
                              })}
                              style={{
                                "background-color":
                                  event.color || "var(--colors-primary)",
                                color: "white",
                                top: `${position.top}px`,
                                height: `${position.height}px`,
                              }}
                              onClick={(e) => handleEventClick(event, e)}
                            >
                              <strong>
                                {formatTime(event.startTime, "12h")}
                              </strong>{" "}
                              {event.title}
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  );
                }}
              </Index>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
