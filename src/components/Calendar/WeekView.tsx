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

  const HOUR_HEIGHT = 64; // Height of each hour cell in pixels

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
  const isCellInSelection = (
    date: Temporal.PlainDate,
    hour: number,
  ): boolean => {
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
                    paddingTop: "8px",
                    paddingBottom: "8px",
                    paddingLeft: "8px",
                    paddingRight: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  })}
                  style={{
                    "border-right": isLastColumn
                      ? "none"
                      : "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <For each={allDayEvents()}>
                    {(event) => (
                      <div
                        class={css({
                          fontSize: "12px",
                          paddingTop: "4px",
                          paddingBottom: "4px",
                          paddingLeft: "6px",
                          paddingRight: "6px",
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
                  const dayEvents = createMemo(() => getEventsForDate(d));
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
                                paddingTop: "4px",
                                paddingBottom: "4px",
                                paddingLeft: "6px",
                                paddingRight: "6px",
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
