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
  updateEvent,
} from "../../stores";
import {
  getWeekDates,
  getHoursArray,
  formatTime,
  isToday,
} from "../../lib/date";
import { Temporal } from "@js-temporal/polyfill";
import type { CalendarEvent } from "../../types";
import { updateEvent as updateEventApi } from "../../lib/tauri";

export function WeekView() {
  const $selectedDate = useStore(selectedDate);
  const $events = useStore(events);
  const $calendars = useStore(calendars);

  const weekDates = createMemo(() => {
    return getWeekDates($selectedDate(), "monday");
  });

  const hours = getHoursArray(0, 24);

  // Current time indicator
  const [currentTime, setCurrentTime] = createSignal(new Date());
  const updateInterval = setInterval(() => {
    setCurrentTime(new Date());
  }, 60000); // Update every minute

  onCleanup(() => {
    clearInterval(updateInterval);
  });

  const getCurrentTimePosition = (): number => {
    const now = currentTime();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / 60) * HOUR_HEIGHT;
  };

  const isCurrentWeek = (): boolean => {
    const today = Temporal.Now.plainDateISO();
    return weekDates().some((date) => date.equals(today));
  };

  // Drag to create state
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal<{
    date: Temporal.PlainDate;
    hour: number;
  } | null>(null);
  const [dragEnd, setDragEnd] = createSignal<{
    date: Temporal.PlainDate;
    hour: number;
  } | null>(null);

  // Drag to move/resize event state
  const [draggedEvent, setDraggedEvent] = createSignal<CalendarEvent | null>(
    null,
  );
  const [dragAction, setDragAction] = createSignal<
    "move" | "resize-top" | "resize-bottom" | null
  >(null);
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });
  const [eventDragStart, setEventDragStart] = createSignal({ x: 0, y: 0 });
  const [eventOriginalDate, setEventOriginalDate] =
    createSignal<Temporal.PlainDate | null>(null);

  const HOUR_HEIGHT = 64; // Height of each hour cell in pixels
  const RESIZE_HANDLE_HEIGHT = 8; // Height of resize handle zone in pixels

  const getEventsForDate = (date: Temporal.PlainDate): CalendarEvent[] => {
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
        const eventEnd = Temporal.PlainDateTime.from(
          event.endTime.replace("Z", ""),
        );

        // Check if event is on this date
        if (!eventStart.toPlainDate().equals(date)) return false;

        // Exclude events that span nearly 24 hours (treat as all-day)
        const durationHours = eventEnd.since(eventStart).total("hours");
        if (durationHours >= 23) return false;

        return true;
      } catch {
        return false;
      }
    });
  };

  const getEventPosition = (
    event: CalendarEvent,
  ): {
    top: number;
    height: number;
    startMinutes: number;
    endMinutes: number;
  } => {
    try {
      const eventStart = Temporal.PlainDateTime.from(
        event.startTime.replace("Z", ""),
      );
      const eventEnd = Temporal.PlainDateTime.from(
        event.endTime.replace("Z", ""),
      );

      // Calculate top position based on start time
      const startMinutes = eventStart.hour * 60 + eventStart.minute;
      const top = (startMinutes / 60) * HOUR_HEIGHT;

      // Calculate height based on duration
      const endMinutes = eventEnd.hour * 60 + eventEnd.minute;
      const durationMinutes = endMinutes - startMinutes;
      const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20); // Minimum 20px height

      return { top, height, startMinutes, endMinutes };
    } catch {
      return { top: 0, height: HOUR_HEIGHT, startMinutes: 0, endMinutes: 60 };
    }
  };

  // Calculate overlapping event positions for a specific day (Notion Calendar style - cascading layout)
  const getEventsWithLayoutForDate = (date: Temporal.PlainDate) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return [];

    // Get positions for all events
    const eventsWithPos = dayEvents.map((event) => ({
      event,
      ...getEventPosition(event),
    }));

    // Sort by start time, then by duration (longer events first)
    eventsWithPos.sort((a, b) => {
      if (a.startMinutes !== b.startMinutes) {
        return a.startMinutes - b.startMinutes;
      }
      return b.endMinutes - b.startMinutes - (a.endMinutes - a.startMinutes);
    });

    // Calculate layout columns
    const columns: {
      event: CalendarEvent;
      top: number;
      height: number;
      startMinutes: number;
      endMinutes: number;
      column: number;
      totalColumns: number;
    }[] = [];

    for (const ev of eventsWithPos) {
      // Find overlapping events that are already placed
      const overlapping = columns.filter(
        (placed) =>
          ev.startMinutes < placed.endMinutes &&
          ev.endMinutes > placed.startMinutes,
      );

      // Find the first available column
      const usedColumns = new Set(overlapping.map((o) => o.column));
      let column = 0;
      while (usedColumns.has(column)) {
        column++;
      }

      columns.push({ ...ev, column, totalColumns: 1 });
    }

    // Calculate total columns for each group of overlapping events
    for (const ev of columns) {
      const overlapping = columns.filter(
        (other) =>
          ev.startMinutes < other.endMinutes &&
          ev.endMinutes > other.startMinutes,
      );
      const maxColumn = Math.max(...overlapping.map((o) => o.column)) + 1;
      for (const o of overlapping) {
        o.totalColumns = Math.max(o.totalColumns, maxColumn);
      }
    }

    return columns;
  };

  const getAllDayEvents = (date: Temporal.PlainDate): CalendarEvent[] => {
    const visibleCalendarIds = new Set(
      Object.values($calendars())
        .filter((cal) => cal.isVisible)
        .map((cal) => cal.id),
    );

    return Object.values($events()).filter((event) => {
      if (!visibleCalendarIds.has(event.calendarId)) return false;

      try {
        const eventStart = Temporal.PlainDateTime.from(
          event.startTime.replace("Z", ""),
        );
        const eventEnd = Temporal.PlainDateTime.from(
          event.endTime.replace("Z", ""),
        );

        // Check if event is on this date
        if (!eventStart.toPlainDate().equals(date)) return false;

        // Include events marked as all-day OR events spanning nearly 24 hours
        if (event.isAllDay) return true;

        const durationHours = eventEnd.since(eventStart).total("hours");
        return durationHours >= 23;
      } catch {
        return false;
      }
    });
  };

  const handleEventClick = (event: CalendarEvent, e: MouseEvent) => {
    e.stopPropagation();
    // Only open modal if not dragging
    if (!draggedEvent()) {
      selectedEventId.set(event.id);
      eventModalOpen.set(true);
    }
  };

  const handleEventMouseDown = (
    event: CalendarEvent,
    date: Temporal.PlainDate,
    e: MouseEvent,
    position: { top: number; height: number },
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;

    // Determine if clicking on resize handles
    if (offsetY <= RESIZE_HANDLE_HEIGHT) {
      setDragAction("resize-top");
    } else if (offsetY >= position.height - RESIZE_HANDLE_HEIGHT) {
      setDragAction("resize-bottom");
    } else {
      setDragAction("move");
    }

    setDraggedEvent(event);
    setEventDragStart({ x: e.clientX, y: e.clientY });
    setEventOriginalDate(date);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleEventMouseMove = (e: MouseEvent) => {
    if (!draggedEvent() || !dragAction()) return;

    const deltaX = e.clientX - eventDragStart().x;
    const deltaY = e.clientY - eventDragStart().y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEventMouseUp = async () => {
    if (!draggedEvent() || !dragAction() || !eventOriginalDate()) return;

    const event = draggedEvent()!;
    const action = dragAction()!;
    const { x: deltaX, y: deltaY } = dragOffset();

    try {
      const eventStart = Temporal.PlainDateTime.from(
        event.startTime.replace("Z", ""),
      );
      const eventEnd = Temporal.PlainDateTime.from(
        event.endTime.replace("Z", ""),
      );

      let newStart: Temporal.PlainDateTime;
      let newEnd: Temporal.PlainDateTime;

      // Calculate time delta (15-minute increments)
      const minutesDelta = Math.round(((deltaY / HOUR_HEIGHT) * 60) / 15) * 15;

      // Calculate day delta for move action
      const dayColumnWidth = window.innerWidth / 7; // Approximate column width
      const daysDelta =
        action === "move" ? Math.round(deltaX / dayColumnWidth) : 0;

      if (action === "move") {
        // Move both start and end
        newStart = eventStart.add({ days: daysDelta, minutes: minutesDelta });
        newEnd = eventEnd.add({ days: daysDelta, minutes: minutesDelta });
      } else if (action === "resize-top") {
        // Resize start time
        newStart = eventStart.add({ minutes: minutesDelta });
        newEnd = eventEnd;
        // Ensure start is before end
        if (Temporal.PlainDateTime.compare(newStart, newEnd) >= 0) {
          newStart = newEnd.subtract({ minutes: 15 });
        }
      } else {
        // resize-bottom: Resize end time
        newStart = eventStart;
        newEnd = eventEnd.add({ minutes: minutesDelta });
        // Ensure end is after start
        if (Temporal.PlainDateTime.compare(newEnd, newStart) <= 0) {
          newEnd = newStart.add({ minutes: 15 });
        }
      }

      // Only update if there's an actual change
      if (!newStart.equals(eventStart) || !newEnd.equals(eventEnd)) {
        const updated = await updateEventApi(event.id, {
          startTime: `${newStart.toString()}Z`,
          endTime: `${newEnd.toString()}Z`,
        });

        updateEvent(event.id, updated as unknown as CalendarEvent);
      }
    } catch (error) {
      console.error("Failed to update event:", error);
    }

    setDraggedEvent(null);
    setDragAction(null);
    setDragOffset({ x: 0, y: 0 });
    setEventOriginalDate(null);
  };

  const handleCellClick = (date: Temporal.PlainDate, _hour: number) => {
    if (!isDragging()) {
      selectedDate.set(date.toString());
    }
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

      // Determine the chronological order
      let startDate: Temporal.PlainDate;
      let startHour: number;
      let endDate: Temporal.PlainDate;
      let endHour: number;

      const dateCompare = Temporal.PlainDate.compare(start.date, end.date);

      if (dateCompare < 0) {
        // start.date is earlier
        startDate = start.date;
        startHour = start.hour;
        endDate = end.date;
        endHour = end.hour + 1;
      } else if (dateCompare > 0) {
        // end.date is earlier
        startDate = end.date;
        startHour = end.hour;
        endDate = start.date;
        endHour = start.hour + 1;
      } else {
        // Same date
        startDate = start.date;
        endDate = end.date;
        startHour = Math.min(start.hour, end.hour);
        endHour = Math.max(start.hour, end.hour) + 1;
      }

      // Handle end hour overflow to next day
      if (endHour >= 24) {
        endDate = endDate.add({ days: 1 });
        endHour = endHour % 24;
      }

      // Format times
      const startTime = `${startHour.toString().padStart(2, "0")}:00`;
      const endTime = `${endHour.toString().padStart(2, "0")}:00`;

      // Open side panel with the selected time range
      eventSidePanelData.set({
        startDate: startDate.toString(),
        startTime: startTime,
        endDate: endDate.toString(),
        endTime: endTime,
        isAllDay: false,
      });
      eventSidePanelOpen.set(true);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Global mouse up and move handlers
  onCleanup(() => {
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("mousemove", handleEventMouseMove);
    document.removeEventListener("mouseup", handleEventMouseUp);
  });

  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("mousemove", handleEventMouseMove);
  document.addEventListener("mouseup", handleEventMouseUp);

  // Check if a cell is within the drag selection
  const isCellInSelection = (
    date: Temporal.PlainDate,
    hour: number,
  ): boolean => {
    if (!isDragging() || !dragStart() || !dragEnd()) return false;

    const start = dragStart()!;
    const end = dragEnd()!;

    // Determine the date range
    const earlierDate =
      Temporal.PlainDate.compare(start.date, end.date) <= 0
        ? start.date
        : end.date;
    const laterDate =
      Temporal.PlainDate.compare(start.date, end.date) <= 0
        ? end.date
        : start.date;

    // Check if current date is within the range
    const dateCompareStart = Temporal.PlainDate.compare(date, earlierDate);
    const dateCompareEnd = Temporal.PlainDate.compare(date, laterDate);

    if (dateCompareStart < 0 || dateCompareEnd > 0) {
      return false; // Date is outside the range
    }

    // If on the start date
    if (date.equals(start.date)) {
      if (start.date.equals(end.date)) {
        // Same day selection
        const minHour = Math.min(start.hour, end.hour);
        const maxHour = Math.max(start.hour, end.hour);
        return hour >= minHour && hour <= maxHour;
      } else {
        // Multi-day: from start hour to end of day
        const startHour = start.date.equals(earlierDate)
          ? start.hour
          : end.hour;
        return hour >= startHour;
      }
    }

    // If on the end date
    if (date.equals(end.date)) {
      // Multi-day: from start of day to end hour
      const endHour = end.date.equals(laterDate) ? end.hour : start.hour;
      return hour <= endHour;
    }

    // Date is between start and end, select all hours
    return true;
  };

  return (
    <div
      class={css({
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "background",
      })}
    >
      {/* Fixed header section */}
      <div class={css({ display: "flex", flexShrink: 0 })}>
        {/* Time column header spacer */}
        <div
          class={css({
            width: "72px",
            height: "96px",
            backgroundColor: "muted",
            "@media (max-width: 768px)": {
              width: "56px",
            },
          })}
          style={{
            "border-right": "1px solid rgba(255, 255, 255, 0.05)",
            "border-bottom": "1px solid rgba(255, 255, 255, 0.05)",
          }}
        />

        {/* Header with day names */}
        <div
          style={{
            display: "grid",
            "grid-template-columns": "repeat(7, minmax(0, 1fr))",
            height: "96px",
            "border-bottom": "1px solid rgba(255, 255, 255, 0.05)",
            flex: 1,
          }}
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
                    paddingTop: "16px",
                    paddingBottom: "16px",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    backgroundColor: "muted",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                  style={{
                    "border-right": isLastColumn
                      ? "none"
                      : "1px solid rgba(255, 255, 255, 0.05)",
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
                      backgroundColor: isTodayDate ? "accent" : "transparent",
                      color: isTodayDate ? "white" : "foreground",
                      "@media (max-width: 768px)": {
                        width: "28px",
                        height: "28px",
                        fontSize: "14px",
                      },
                    })}
                  >
                    {d.day}
                  </div>
                </div>
              );
            }}
          </Index>
        </div>
      </div>

      {/* All-day section */}
      <div class={css({ display: "flex", flexShrink: 0 })}>
        {/* All day label */}
        <div
          class={css({
            width: "72px",
            minHeight: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "500",
            color: "mutedHover",
            paddingLeft: "8px",
            paddingRight: "8px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            "@media (max-width: 768px)": {
              width: "56px",
              fontSize: "10px",
              paddingLeft: "4px",
              paddingRight: "4px",
            },
          })}
          style={{
            "border-right": "1px solid rgba(255, 255, 255, 0.05)",
            "border-bottom": "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          All day
        </div>

        {/* All-day events row */}
        <div
          style={{
            display: "grid",
            "grid-template-columns": "repeat(7, minmax(0, 1fr))",
            "border-bottom": "1px solid rgba(255, 255, 255, 0.05)",
            "min-height": "52px",
            flex: 1,
          }}
        >
          <Index each={weekDates()}>
            {(date, index) => {
              const d = date();
              const allDayEvents = createMemo(() => getAllDayEvents(d));
              const isLastColumn = index === 6;

              return (
                <div
                  class={css({
                    position: "relative",
                    paddingTop: "4px",
                    paddingBottom: "4px",
                    paddingLeft: "2px",
                    paddingRight: "2px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    cursor: "pointer",
                    transition: "background-color 150ms",
                    minHeight: "44px",
                    _hover: {
                      backgroundColor: "hover",
                    },
                  })}
                  style={{
                    "border-right": isLastColumn
                      ? "none"
                      : "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                  onClick={() => {
                    eventSidePanelData.set({
                      startDate: d.toString(),
                      startTime: "00:00",
                      endDate: d.toString(),
                      endTime: "23:59",
                      isAllDay: true,
                    });
                    eventSidePanelOpen.set(true);
                  }}
                >
                  <For each={allDayEvents()}>
                    {(event) => (
                      <div
                        class={css({
                          fontSize: "12px",
                          fontWeight: "medium",
                          paddingTop: "5px",
                          paddingBottom: "5px",
                          paddingLeft: "8px",
                          paddingRight: "8px",
                          borderRadius: "4px",
                          borderLeft: "3px solid",
                          cursor: "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          transition: "opacity 150ms",
                          _hover: {
                            opacity: 0.85,
                          },
                        })}
                        style={{
                          "background-color":
                            event.color || "var(--colors-primary)",
                          "border-left-color": `color-mix(in srgb, ${event.color || "var(--colors-primary)"} 70%, black)`,
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
      </div>

      {/* Scrollable content area with time labels and grid */}
      <div
        class={css({
          flex: 1,
          display: "flex",
          overflow: "hidden",
        })}
      >
        {/* Time labels column - scrolls with grid */}
        <div
          class={css({
            width: "72px",
            flexShrink: 0,
            overflowY: "auto",
            overflowX: "hidden",
            backgroundColor: "background",
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
            "@media (max-width: 768px)": {
              width: "56px",
            },
          })}
          style={{
            "border-right": "1px solid rgba(255, 255, 255, 0.05)",
          }}
          ref={(el) => {
            // Sync scroll with grid
            const syncScroll = (e: Event) => {
              const gridScroll = document.querySelector(".week-grid-scroll");
              if (gridScroll && e.target) {
                gridScroll.scrollTop = (e.target as HTMLElement).scrollTop;
              }
            };
            el.addEventListener("scroll", syncScroll);
          }}
        >
          <For each={hours}>
            {(hour) => (
              <div
                class={css({
                  height: "64px",
                  fontSize: "12px",
                  color: "mutedHover",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-end",
                  paddingRight: "12px",
                  paddingTop: "4px",
                  overflow: "hidden",
                  "@media (max-width: 768px)": {
                    fontSize: "10px",
                    paddingRight: "6px",
                  },
                })}
                style={{
                  "border-bottom": "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                {hour === 0
                  ? ""
                  : formatTime(`${hour.toString().padStart(2, "0")}:00`, "12h")}
              </div>
            )}
          </For>
        </div>

        {/* Grid scrollable area */}
        <div
          class={`week-grid-scroll ${css({
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
          })}`}
          ref={(el) => {
            // Sync scroll with time labels
            const syncScroll = (e: Event) => {
              const timeLabels = el.previousElementSibling;
              if (timeLabels && e.target) {
                timeLabels.scrollTop = (e.target as HTMLElement).scrollTop;
              }
            };
            el.addEventListener("scroll", syncScroll);
          }}
        >
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
                      const isSelected = createMemo(() =>
                        isCellInSelection(d, hour),
                      );

                      return (
                        <div
                          class={css({
                            height: "64px",
                            position: "relative",
                            cursor: "pointer",
                            backgroundColor: "background",
                            transition: "background-color 150ms",
                            _hover: {
                              backgroundColor: "hover",
                            },
                          })}
                          style={{
                            "border-right": isLastColumn
                              ? "none"
                              : "1px solid rgba(255, 255, 255, 0.05)",
                            "border-bottom":
                              "1px solid rgba(255, 255, 255, 0.05)",
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
                          onClick={() =>
                            !isDragging() && handleCellClick(d, hour)
                          }
                        />
                      );
                    }}
                  </Index>
                </div>
              )}
            </For>

            {/* Current time indicator line */}
            <Show when={isCurrentWeek()}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: "2px",
                  "background-color": "var(--colors-accent)",
                  "z-index": 10,
                  "pointer-events": "none",
                  top: `${getCurrentTimePosition()}px`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "-6px",
                    top: "-5px",
                    width: "12px",
                    height: "12px",
                    "border-radius": "9999px",
                    "background-color": "var(--colors-accent)",
                  }}
                />
              </div>
            </Show>

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
                  const dayEventsWithLayout = createMemo(() =>
                    getEventsWithLayoutForDate(d),
                  );
                  const isLastColumn = index === 6;

                  return (
                    <div
                      class={css({
                        position: "relative",
                      })}
                      style={{
                        "border-right": isLastColumn
                          ? "none"
                          : "1px solid transparent",
                      }}
                    >
                      <For each={dayEventsWithLayout()}>
                        {(eventWithLayout) => {
                          const event = eventWithLayout.event;
                          const position = {
                            top: eventWithLayout.top,
                            height: eventWithLayout.height,
                          };
                          const column = eventWithLayout.column;
                          const totalColumns = eventWithLayout.totalColumns;
                          const isDragged = () =>
                            draggedEvent()?.id === event.id;
                          const currentOffset = () =>
                            isDragged() ? dragOffset() : { x: 0, y: 0 };
                          const currentAction = () =>
                            isDragged() ? dragAction() : null;

                          // Notion Calendar style: cascading columns with overlap
                          const columnWidth =
                            totalColumns > 1
                              ? (100 - (totalColumns - 1) * 10) / totalColumns
                              : 100;
                          const leftOffset = column * (columnWidth + 5);

                          return (
                            <div
                              class={css({
                                position: "absolute",
                                fontSize: "11px",
                                paddingTop: "4px",
                                paddingBottom: "4px",
                                paddingLeft: "6px",
                                paddingRight: "6px",
                                borderRadius: "4px",
                                borderLeft: "3px solid",
                                cursor: "move",
                                overflow: "hidden",
                                transition: "opacity 150ms, box-shadow 150ms",
                                pointerEvents: "auto",
                                userSelect: "none",
                                _hover: {
                                  opacity: 0.85,
                                },
                              })}
                              style={{
                                "background-color": `color-mix(in srgb, ${event.color || "var(--colors-primary)"} 85%, var(--colors-background))`,
                                "border-left-color": `color-mix(in srgb, ${event.color || "var(--colors-primary)"} 70%, black)`,
                                color: "white",
                                top:
                                  currentAction() === "move" ||
                                  currentAction() === "resize-top"
                                    ? `${position.top + currentOffset().y}px`
                                    : `${position.top}px`,
                                height:
                                  currentAction() === "resize-bottom"
                                    ? `${position.height + currentOffset().y}px`
                                    : currentAction() === "resize-top"
                                      ? `${position.height - currentOffset().y}px`
                                      : `${position.height}px`,
                                left: `calc(${leftOffset}% + 2px)`,
                                width: `calc(${columnWidth}% - 4px)`,
                                transform:
                                  currentAction() === "move"
                                    ? `translateX(${currentOffset().x}px)`
                                    : "none",
                                "z-index": isDragged() ? 30 : column + 1,
                                opacity: isDragged() ? 0.7 : 1,
                                "box-shadow": isDragged()
                                  ? "0 4px 12px rgba(0,0,0,0.3)"
                                  : totalColumns > 1
                                    ? "0 1px 3px rgba(0,0,0,0.25)"
                                    : "none",
                              }}
                              onClick={(e) => handleEventClick(event, e)}
                              onMouseDown={(e) =>
                                handleEventMouseDown(event, d, e, position)
                              }
                            >
                              {/* Top resize handle */}
                              <div
                                class={css({
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: "8px",
                                  cursor: "ns-resize",
                                  zIndex: 10,
                                })}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleEventMouseDown(event, d, e, position);
                                }}
                              />
                              <div
                                class={css({
                                  fontWeight: "bold",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                })}
                              >
                                {event.title}
                              </div>
                              <div
                                class={css({ opacity: 0.9, fontSize: "10px" })}
                              >
                                {formatTime(event.startTime, "12h")}
                              </div>
                              {/* Bottom resize handle */}
                              <div
                                class={css({
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: "8px",
                                  cursor: "ns-resize",
                                  zIndex: 10,
                                })}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleEventMouseDown(event, d, e, position);
                                }}
                              />
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
