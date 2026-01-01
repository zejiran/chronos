import { createMemo, For, Show, createSignal, onCleanup } from "solid-js";
import { useStore } from "@nanostores/solid";
import { css } from "../../../styled-system/css";
import { MapPin } from "lucide-solid";
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
import { getHoursArray, formatTime, formatDate, isToday } from "../../lib/date";
import { Temporal } from "@js-temporal/polyfill";
import type { CalendarEvent } from "../../types";
import { updateEvent as updateEventApi } from "../../lib/tauri";

export function DayView() {
  const $selectedDate = useStore(selectedDate);
  const $events = useStore(events);
  const $calendars = useStore(calendars);

  const hours = getHoursArray(0, 24);

  const currentDate = createMemo(() =>
    Temporal.PlainDate.from($selectedDate()),
  );

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

  const isCurrentDay = (): boolean => {
    const today = Temporal.Now.plainDateISO();
    return currentDate().equals(today);
  };

  // Drag to create state
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal<number | null>(null);
  const [dragEnd, setDragEnd] = createSignal<number | null>(null);

  // Drag to move/resize event state
  const [draggedEvent, setDraggedEvent] = createSignal<CalendarEvent | null>(
    null,
  );
  const [dragAction, setDragAction] = createSignal<
    "move" | "resize-top" | "resize-bottom" | null
  >(null);
  const [dragOffset, setDragOffset] = createSignal(0);
  const [eventDragStartY, setEventDragStartY] = createSignal(0);

  const HOUR_HEIGHT = 60; // Height of each hour cell in pixels
  const RESIZE_HANDLE_HEIGHT = 8; // Height of resize handle zone in pixels

  const getEventsForDate = (): CalendarEvent[] => {
    const date = currentDate();
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

  // Calculate overlapping event positions (Notion Calendar style - cascading layout)
  const getEventsWithLayout = () => {
    const dayEvents = getEventsForDate();
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

  const getAllDayEvents = (): CalendarEvent[] => {
    const date = currentDate();
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
    setEventDragStartY(e.clientY);
    setDragOffset(0);
  };

  const handleEventMouseMove = (e: MouseEvent) => {
    if (!draggedEvent() || !dragAction()) return;

    const deltaY = e.clientY - eventDragStartY();
    setDragOffset(deltaY);
  };

  const handleEventMouseUp = async () => {
    if (!draggedEvent() || !dragAction()) return;

    const event = draggedEvent()!;
    const action = dragAction()!;
    const deltaY = dragOffset();

    // Convert pixel delta to time delta (15-minute increments)
    const minutesDelta = Math.round(((deltaY / HOUR_HEIGHT) * 60) / 15) * 15;

    if (minutesDelta === 0) {
      // No change, just reset
      setDraggedEvent(null);
      setDragAction(null);
      setDragOffset(0);
      return;
    }

    try {
      const eventStart = Temporal.PlainDateTime.from(
        event.startTime.replace("Z", ""),
      );
      const eventEnd = Temporal.PlainDateTime.from(
        event.endTime.replace("Z", ""),
      );

      let newStart: Temporal.PlainDateTime;
      let newEnd: Temporal.PlainDateTime;

      if (action === "move") {
        // Move both start and end
        newStart = eventStart.add({ minutes: minutesDelta });
        newEnd = eventEnd.add({ minutes: minutesDelta });
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

      // Update the event
      const updated = await updateEventApi(event.id, {
        startTime: `${newStart.toString()}Z`,
        endTime: `${newEnd.toString()}Z`,
      });

      updateEvent(event.id, updated as unknown as CalendarEvent);
    } catch (error) {
      console.error("Failed to update event:", error);
    }

    setDraggedEvent(null);
    setDragAction(null);
    setDragOffset(0);
  };

  const handleMouseDown = (hour: number) => {
    setIsDragging(true);
    setDragStart(hour);
    setDragEnd(hour);
  };

  const handleMouseEnter = (hour: number) => {
    if (isDragging()) {
      setDragEnd(hour);
    }
  };

  const handleMouseUp = () => {
    if (isDragging() && dragStart() !== null && dragEnd() !== null) {
      const start = dragStart()!;
      const end = dragEnd()!;

      // Determine which is earlier
      const startHour = Math.min(start, end);
      const endHour = Math.max(start, end) + 1; // +1 for end time

      // Format times
      const startTime = `${startHour.toString().padStart(2, "0")}:00`;
      const endTime = `${endHour.toString().padStart(2, "0")}:00`;

      // Open side panel with the selected time range
      eventSidePanelData.set({
        startDate: currentDate().toString(),
        startTime: startTime,
        endDate: currentDate().toString(),
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
  const isCellInSelection = (hour: number): boolean => {
    if (!isDragging() || dragStart() === null || dragEnd() === null)
      return false;

    const start = dragStart()!;
    const end = dragEnd()!;

    const minHour = Math.min(start, end);
    const maxHour = Math.max(start, end);

    return hour >= minHour && hour <= maxHour;
  };

  return (
    <div
      class={css({
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      })}
    >
      {/* Header */}
      <div
        class={css({
          padding: "md",
          borderBottom: "1px solid {colors.border}",
          backgroundColor: "muted",
          display: "flex",
          alignItems: "center",
          gap: "md",
          flexShrink: 0,
        })}
      >
        <div
          class={css({
            width: "64px",
            height: "64px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "lg",
            backgroundColor: isToday(currentDate()) ? "accent" : "background",
            color: isToday(currentDate()) ? "white" : "foreground",
          })}
        >
          <span class={css({ fontSize: "xs", fontWeight: "medium" })}>
            {
              ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                currentDate().dayOfWeek - 1
              ]
            }
          </span>
          <span class={css({ fontSize: "2xl", fontWeight: "bold" })}>
            {currentDate().day}
          </span>
        </div>
        <div>
          <div
            class={css({
              fontSize: "lg",
              fontWeight: "semibold",
              color: "foreground",
            })}
          >
            {formatDate(currentDate(), "long")}
          </div>
          <Show when={isToday(currentDate())}>
            <div class={css({ fontSize: "sm", color: "primary" })}>Today</div>
          </Show>
        </div>
      </div>

      {/* All-day events section - always visible */}
      <div
        class={css({
          display: "flex",
          flexDirection: "row",
          borderBottom: "1px solid {colors.border}",
          flexShrink: 0,
          minHeight: "40px",
        })}
      >
        {/* Time column spacer with close/collapse icon area */}
        <div
          class={css({
            width: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRight: "1px solid {colors.border}",
            color: "mutedHover",
            fontSize: "xs",
            cursor: "pointer",
            transition: "background-color 150ms",
            _hover: {
              backgroundColor: "hover",
            },
          })}
          onClick={() => {
            eventSidePanelData.set({
              startDate: currentDate().toString(),
              startTime: "00:00",
              endDate: currentDate().toString(),
              endTime: "23:59",
              isAllDay: true,
            });
            eventSidePanelOpen.set(true);
          }}
        >
          <span class={css({ fontSize: "lg", opacity: 0.5 })}>×</span>
        </div>

        {/* All-day events container */}
        <div
          class={css({
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            padding: "4px 8px",
            cursor: "pointer",
          })}
          onClick={() => {
            eventSidePanelData.set({
              startDate: currentDate().toString(),
              startTime: "00:00",
              endDate: currentDate().toString(),
              endTime: "23:59",
              isAllDay: true,
            });
            eventSidePanelOpen.set(true);
          }}
        >
          <For each={getAllDayEvents()}>
            {(event) => (
              <div
                class={css({
                  fontSize: "sm",
                  fontWeight: "medium",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "opacity 150ms",
                  borderLeft: "3px solid",
                  _hover: {
                    opacity: 0.85,
                  },
                })}
                style={{
                  "background-color": event.color || "var(--colors-primary)",
                  "border-left-color": `color-mix(in srgb, ${event.color || "var(--colors-primary)"} 70%, black)`,
                  color: "white",
                }}
                onClick={(e) => handleEventClick(event, e)}
              >
                {event.title}
              </div>
            )}
          </For>
          <Show when={getAllDayEvents().length === 0}>
            <div
              class={css({
                fontSize: "sm",
                color: "mutedHover",
                fontStyle: "italic",
                padding: "6px 0",
              })}
            >
              Click to add all-day event
            </div>
          </Show>
        </div>
      </div>

      {/* Time grid */}
      <div
        class={css({
          flex: 1,
          overflow: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "border",
            borderRadius: "full",
          },
        })}
      >
        <div class={css({ position: "relative" })}>
          {/* Hour grid rows */}
          <For each={hours}>
            {(hour) => {
              const isSelected = createMemo(() => isCellInSelection(hour));

              return (
                <div
                  class={css({
                    display: "grid",
                    gridTemplateColumns: "80px 1fr",
                    minHeight: "60px",
                    borderBottom: "1px solid {colors.border}",
                  })}
                >
                  {/* Time label */}
                  <div
                    class={css({
                      fontSize: "sm",
                      color: "mutedHover",
                      textAlign: "right",
                      paddingRight: "md",
                      paddingTop: "xs",
                      borderRight: "1px solid {colors.border}",
                    })}
                  >
                    {hour === 0
                      ? "12 AM"
                      : formatTime(
                          `${hour.toString().padStart(2, "0")}:00`,
                          "12h",
                        )}
                  </div>

                  {/* Events area */}
                  <div
                    class={css({
                      padding: "xs",
                      cursor: "pointer",
                      transition: "background-color 150ms",
                      _hover: {
                        backgroundColor: "hover",
                      },
                    })}
                    style={{
                      "background-color": isSelected()
                        ? "rgba(59, 130, 246, 0.15)"
                        : undefined,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMouseDown(hour);
                    }}
                    onMouseEnter={() => handleMouseEnter(hour)}
                  />
                </div>
              );
            }}
          </For>

          {/* Current time indicator line */}
          <Show when={isCurrentDay()}>
            <div
              style={{
                position: "absolute",
                left: "80px",
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
              left: "80px",
              right: 0,
              bottom: 0,
              pointerEvents: "none",
            })}
          >
            <For each={getEventsWithLayout()}>
              {(eventWithLayout) => {
                const event = eventWithLayout.event;
                const position = {
                  top: eventWithLayout.top,
                  height: eventWithLayout.height,
                };
                const column = eventWithLayout.column;
                const totalColumns = eventWithLayout.totalColumns;
                const isDragged = () => draggedEvent()?.id === event.id;
                const currentOffset = () => (isDragged() ? dragOffset() : 0);
                const currentAction = () => (isDragged() ? dragAction() : null);

                // Notion Calendar style: cascading columns with overlap
                // Each column takes a portion of the width, but overlaps slightly
                const columnWidth =
                  totalColumns > 1
                    ? (100 - (totalColumns - 1) * 8) / totalColumns
                    : 100;
                const leftOffset = column * (columnWidth + 4);

                return (
                  <div
                    class={css({
                      position: "absolute",
                      padding: "sm md",
                      borderRadius: "md",
                      cursor: "move",
                      borderLeft: "4px solid",
                      pointerEvents: "auto",
                      transition: "opacity 150ms, box-shadow 150ms",
                      userSelect: "none",
                      overflow: "hidden",
                      _hover: {
                        opacity: 0.9,
                        zIndex: 20,
                      },
                    })}
                    style={{
                      "background-color": `color-mix(in srgb, ${event.color || "var(--colors-primary)"} 25%, var(--colors-background))`,
                      "border-left-color":
                        event.color || "var(--colors-primary)",
                      top:
                        currentAction() === "move" ||
                        currentAction() === "resize-top"
                          ? `${position.top + currentOffset()}px`
                          : `${position.top}px`,
                      height:
                        currentAction() === "resize-bottom"
                          ? `${position.height + currentOffset()}px`
                          : currentAction() === "resize-top"
                            ? `${position.height - currentOffset()}px`
                            : `${position.height}px`,
                      left: `calc(${leftOffset}% + 4px)`,
                      width: `calc(${columnWidth}% - 8px)`,
                      "z-index": isDragged() ? 30 : column + 1,
                      opacity: isDragged() ? 0.7 : 1,
                      "box-shadow": isDragged()
                        ? "0 4px 12px rgba(0,0,0,0.3)"
                        : totalColumns > 1
                          ? "0 1px 3px rgba(0,0,0,0.2)"
                          : "none",
                    }}
                    onClick={(e) => handleEventClick(event, e)}
                    onMouseDown={(e) =>
                      handleEventMouseDown(event, e, position)
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
                        handleEventMouseDown(event, e, position);
                      }}
                    />

                    <div
                      class={css({
                        fontSize: "sm",
                        fontWeight: "medium",
                        color: "foreground",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      })}
                    >
                      {event.title}
                    </div>
                    <div class={css({ fontSize: "xs", color: "mutedHover" })}>
                      {formatTime(event.startTime, "12h")} -{" "}
                      {formatTime(event.endTime, "12h")}
                    </div>
                    <Show when={event.location}>
                      <div
                        class={css({
                          fontSize: "xs",
                          color: "mutedHover",
                          marginTop: "xs",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        })}
                      >
                        <MapPin size={12} /> {event.location}
                      </div>
                    </Show>

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
                        handleEventMouseDown(event, e, position);
                      }}
                    />
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}
