import { createMemo, For, Show, createSignal, onCleanup } from "solid-js";
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
  getCalendarDays,
  getShortWeekDays,
  isToday,
  isSameMonth,
  formatTime,
} from "../../lib/date";
import { Temporal } from "@js-temporal/polyfill";
import type { CalendarEvent } from "../../types";
import { updateEvent as updateEventApi } from "../../lib/tauri";

export function MonthView() {
  const $selectedDate = useStore(selectedDate);
  const $events = useStore(events);
  const $calendars = useStore(calendars);

  const currentMonth = createMemo(() => {
    const date = Temporal.PlainDate.from($selectedDate());
    return { year: date.year, month: date.month };
  });

  const calendarDays = createMemo(() => {
    const { year, month } = currentMonth();
    return getCalendarDays(year, month, "monday");
  });

  const weekDays = getShortWeekDays("monday");

  // Drag to move event state
  const [draggedEvent, setDraggedEvent] = createSignal<CalendarEvent | null>(
    null,
  );
  const [dragStartPos, setDragStartPos] = createSignal({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });
  const [eventOriginalDate, setEventOriginalDate] =
    createSignal<Temporal.PlainDate | null>(null);

  const getEventsForDate = (date: Temporal.PlainDate): CalendarEvent[] => {
    const visibleCalendarIds = new Set(
      Object.values($calendars())
        .filter((cal) => cal.isVisible)
        .map((cal) => cal.id),
    );

    return Object.values($events())
      .filter((event) => {
        if (!visibleCalendarIds.has(event.calendarId)) return false;
        try {
          const eventStart = Temporal.PlainDateTime.from(
            event.startTime.replace("Z", ""),
          );
          const eventEnd = Temporal.PlainDateTime.from(
            event.endTime.replace("Z", ""),
          );
          const eventStartDate = eventStart.toPlainDate();
          const eventEndDate = eventEnd.toPlainDate();

          // Include event if date falls within the event's date range
          return (
            Temporal.PlainDate.compare(date, eventStartDate) >= 0 &&
            Temporal.PlainDate.compare(date, eventEndDate) <= 0
          );
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return a.startTime.localeCompare(b.startTime);
      });
  };

  // Helper to check if event starts on this date
  const eventStartsOnDate = (
    event: CalendarEvent,
    date: Temporal.PlainDate,
  ): boolean => {
    try {
      const eventStart = Temporal.PlainDateTime.from(
        event.startTime.replace("Z", ""),
      );
      return eventStart.toPlainDate().equals(date);
    } catch {
      return false;
    }
  };

  // Helper to check if event continues from previous day
  const eventContinuesOnDate = (
    event: CalendarEvent,
    date: Temporal.PlainDate,
  ): boolean => {
    try {
      const eventStart = Temporal.PlainDateTime.from(
        event.startTime.replace("Z", ""),
      );
      const eventEnd = Temporal.PlainDateTime.from(
        event.endTime.replace("Z", ""),
      );
      const eventStartDate = eventStart.toPlainDate();
      const eventEndDate = eventEnd.toPlainDate();

      return (
        Temporal.PlainDate.compare(date, eventStartDate) > 0 &&
        Temporal.PlainDate.compare(date, eventEndDate) <= 0
      );
    } catch {
      return false;
    }
  };

  const handleDayClick = (date: Temporal.PlainDate, e: MouseEvent) => {
    // Check if clicked on empty space (not an event)
    const target = e.target as HTMLElement;
    const clickedOnEvent = target.closest('[data-event-item="true"]');

    if (!clickedOnEvent) {
      // Open side panel for creating a new all-day event
      eventSidePanelData.set({
        startDate: date.toString(),
        startTime: "00:00",
        endDate: date.toString(),
        endTime: "23:59",
        isAllDay: true,
      });
      eventSidePanelOpen.set(true);
    } else {
      // Just update selected date if clicking on an event
      selectedDate.set(date.toString());
    }
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
  ) => {
    e.stopPropagation();
    e.preventDefault();

    setDraggedEvent(event);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setEventOriginalDate(date);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleEventMouseMove = (e: MouseEvent) => {
    if (!draggedEvent()) return;

    const deltaX = e.clientX - dragStartPos().x;
    const deltaY = e.clientY - dragStartPos().y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEventMouseUp = async () => {
    if (!draggedEvent() || !eventOriginalDate()) return;

    const event = draggedEvent()!;
    const { x: deltaX, y: deltaY } = dragOffset();

    try {
      // Calculate which day cell we're over based on mouse position
      const cellWidth = window.innerWidth / 7; // Approximate
      const cellHeight = 100; // Approximate month view cell height

      const daysDelta = Math.round(deltaX / cellWidth);
      const weeksDelta = Math.round(deltaY / cellHeight);
      const totalDaysDelta = daysDelta + weeksDelta * 7;

      if (totalDaysDelta !== 0) {
        const eventStart = Temporal.PlainDateTime.from(
          event.startTime.replace("Z", ""),
        );
        const eventEnd = Temporal.PlainDateTime.from(
          event.endTime.replace("Z", ""),
        );

        const newStart = eventStart.add({ days: totalDaysDelta });
        const newEnd = eventEnd.add({ days: totalDaysDelta });

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
    setDragOffset({ x: 0, y: 0 });
    setEventOriginalDate(null);
  };

  // Global mouse event handlers
  onCleanup(() => {
    document.removeEventListener("mousemove", handleEventMouseMove);
    document.removeEventListener("mouseup", handleEventMouseUp);
  });

  document.addEventListener("mousemove", handleEventMouseMove);
  document.addEventListener("mouseup", handleEventMouseUp);

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
      {/* Week day headers */}
      <div
        class={css({
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1px solid",
          borderColor: "border",
          backgroundColor: "muted",
        })}
      >
        <For each={weekDays}>
          {(day) => (
            <div
              class={css({
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "600",
                color: "mutedHover",
                paddingTop: "12px",
                paddingBottom: "12px",
                paddingLeft: "8px",
                paddingRight: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                "@media (max-width: 768px)": {
                  fontSize: "10px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  paddingLeft: "4px",
                  paddingRight: "4px",
                },
              })}
            >
              {day}
            </div>
          )}
        </For>
      </div>

      {/* Calendar grid */}
      <div
        class={css({
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridTemplateRows: "repeat(6, 1fr)",
          flex: 1,
          overflow: "hidden",
          gap: "1px",
          backgroundColor: "border",
          paddingTop: "1px",
          paddingBottom: "1px",
          paddingLeft: "1px",
          paddingRight: "1px",
        })}
      >
        <For each={calendarDays()}>
          {(date) => {
            const dayEvents = createMemo(() => getEventsForDate(date));
            const isTodayDate = isToday(date);
            const isCurrentMonth = isSameMonth(date, $selectedDate());
            const isSelected = date.toString() === $selectedDate();

            return (
              <div
                class={css({
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: isSelected ? "muted" : "background",
                  position: "relative",
                  minWidth: 0,
                  _hover: {
                    backgroundColor: "hover",
                  },
                  "@media (max-width: 768px)": {
                    paddingTop: "6px",
                    paddingBottom: "6px",
                    paddingLeft: "6px",
                    paddingRight: "6px",
                  },
                })}
                onClick={(e: MouseEvent) => handleDayClick(date, e)}
              >
                {/* Day number */}
                <div
                  class={css({
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "8px",
                    "@media (max-width: 768px)": {
                      marginBottom: "4px",
                    },
                  })}
                >
                  <span
                    class={css({
                      minWidth: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: isTodayDate ? "700" : "500",
                      borderRadius: "8px",
                      transition: "all 150ms",
                      backgroundColor: isTodayDate ? "accent" : "transparent",
                      color: isTodayDate
                        ? "white"
                        : isCurrentMonth
                          ? "foreground"
                          : "mutedHover",
                      "@media (max-width: 768px)": {
                        minWidth: "22px",
                        height: "22px",
                        fontSize: "11px",
                      },
                    })}
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleDayClick(date, e);
                    }}
                  >
                    {date.day}
                  </span>
                </div>

                {/* Events */}
                <div
                  class={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    overflow: "hidden",
                    minWidth: 0,
                    "@media (max-width: 768px)": {
                      gap: "2px",
                    },
                  })}
                >
                  <For
                    each={dayEvents()
                      .filter((event) => eventStartsOnDate(event, date))
                      .slice(0, 3)}
                  >
                    {(event) => {
                      const continuesFromPrevious = eventContinuesOnDate(
                        event,
                        date,
                      );
                      const startsOnDate = eventStartsOnDate(event, date);
                      const isDragged = () => draggedEvent()?.id === event.id;
                      const currentOffset = () =>
                        isDragged() ? dragOffset() : { x: 0, y: 0 };

                      return (
                        <div
                          data-event-item="true"
                          class={css({
                            fontSize: "11px",
                            fontWeight: "500",
                            paddingTop: "5px",
                            paddingBottom: "5px",
                            paddingLeft: "7px",
                            paddingRight: "7px",
                            borderRadius: startsOnDate ? "5px" : "5px 0 0 5px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "move",
                            transition:
                              "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                            minWidth: 0,
                            userSelect: "none",
                            "@media (max-width: 768px)": {
                              fontSize: "9px",
                              paddingTop: "3px",
                              paddingBottom: "3px",
                              paddingLeft: "5px",
                              paddingRight: "5px",
                            },
                            _hover: {
                              opacity: 0.8,
                            },
                            _active: {
                              transform: "scale(0.98)",
                            },
                          })}
                          style={{
                            "background-color":
                              event.color || "var(--colors-primary)",
                            color: "white",
                            transform: isDragged()
                              ? `translate(${currentOffset().x}px, ${currentOffset().y}px)`
                              : "none",
                            opacity: isDragged() ? 0.7 : 1,
                            "box-shadow": isDragged()
                              ? "0 4px 12px rgba(0,0,0,0.3)"
                              : "none",
                            "z-index": isDragged() ? 1000 : "auto",
                            position: isDragged() ? "relative" : "static",
                          }}
                          onClick={(e) => handleEventClick(event, e)}
                          onMouseDown={(e) =>
                            handleEventMouseDown(event, date, e)
                          }
                        >
                          <Show when={!event.isAllDay && startsOnDate}>
                            <span
                              class={css({
                                marginRight: "4px",
                                opacity: 0.9,
                                fontWeight: "600",
                              })}
                            >
                              {formatTime(event.startTime, "12h")
                                .replace(" AM", "a")
                                .replace(" PM", "p")}
                            </span>
                          </Show>
                          {continuesFromPrevious ? "↖ " : ""}
                          {event.title}
                        </div>
                      );
                    }}
                  </For>
                  <Show when={dayEvents().length > 3}>
                    <div
                      class={css({
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "rgb(59, 130, 246)",
                        paddingLeft: "6px",
                        paddingTop: "2px",
                      })}
                    >
                      +{dayEvents().length - 3} more
                    </div>
                  </Show>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
