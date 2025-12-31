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
} from "../../stores";
import { getHoursArray, formatTime, formatDate, isToday } from "../../lib/date";
import { Temporal } from "@js-temporal/polyfill";
import type { CalendarEvent } from "../../types";

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

  const HOUR_HEIGHT = 60; // Height of each hour cell in pixels

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
        return eventStart.toPlainDate().equals(date);
      } catch {
        return false;
      }
    });
  };

  const getEventPosition = (
    event: CalendarEvent,
  ): { top: number; height: number } => {
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

      return { top, height };
    } catch {
      return { top: 0, height: HOUR_HEIGHT };
    }
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

  // Global mouse up handler
  onCleanup(() => {
    document.removeEventListener("mouseup", handleMouseUp);
  });

  document.addEventListener("mouseup", handleMouseUp);

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

      {/* All-day events */}
      <Show when={getAllDayEvents().length > 0}>
        <div
          class={css({
            padding: "sm md",
            borderBottom: "1px solid {colors.border}",
            display: "flex",
            gap: "sm",
            flexWrap: "wrap",
            flexShrink: 0,
          })}
        >
          <span
            class={css({
              fontSize: "xs",
              color: "mutedHover",
              marginRight: "sm",
            })}
          >
            All day:
          </span>
          <For each={getAllDayEvents()}>
            {(event) => (
              <div
                class={css({
                  fontSize: "sm",
                  padding: "xs md",
                  borderRadius: "md",
                  cursor: "pointer",
                })}
                style={{
                  "background-color": event.color || "var(--colors-primary)",
                  color: "white",
                }}
                onClick={(e) => handleEventClick(event, e)}
              >
                {event.title}
              </div>
            )}
          </For>
        </div>
      </Show>

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
            <For each={getEventsForDate()}>
              {(event) => {
                const position = getEventPosition(event);
                return (
                  <div
                    class={css({
                      position: "absolute",
                      left: "8px",
                      right: "8px",
                      padding: "sm md",
                      borderRadius: "md",
                      cursor: "pointer",
                      borderLeft: "4px solid",
                      pointerEvents: "auto",
                      transition: "opacity 150ms",
                      _hover: {
                        opacity: 0.9,
                      },
                    })}
                    style={{
                      "background-color": `color-mix(in srgb, ${event.color || "var(--colors-primary)"} 20%, transparent)`,
                      "border-left-color":
                        event.color || "var(--colors-primary)",
                      top: `${position.top}px`,
                      height: `${position.height}px`,
                    }}
                    onClick={(e) => handleEventClick(event, e)}
                  >
                    <div
                      class={css({
                        fontSize: "sm",
                        fontWeight: "medium",
                        color: "foreground",
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
                        })}
                      >
                        <MapPin size={12} /> {event.location}
                      </div>
                    </Show>
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
