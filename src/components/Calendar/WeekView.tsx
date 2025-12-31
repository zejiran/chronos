import { createMemo, For } from "solid-js";
import { useStore } from "@nanostores/solid";
import { css } from "../../../styled-system/css";
import {
  selectedDate,
  events,
  calendars,
  eventModalOpen,
  selectedEventId,
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

  const getEventsForDateAndHour = (
    date: Temporal.PlainDate,
    _hour: number,
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
        return (
          eventStart.toPlainDate().equals(date) && eventStart.hour === _hour
        );
      } catch {
        return false;
      }
    });
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
    void _hour; // Could open event modal with pre-filled time here
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
      {/* Header with day names */}
      <div
        class={css({
          display: "grid",
          gridTemplateColumns: "60px repeat(7, 1fr)",
          borderBottom: "1px solid",
          borderColor: "border",
          flexShrink: 0,
        })}
      >
        {/* Empty corner */}
        <div
          class={css({
            borderRight: "1px solid",
            borderColor: "border",
            backgroundColor: "muted",
          })}
        />

        <For each={weekDates()}>
          {(date) => {
            const isTodayDate = isToday(date);
            const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const dayName = dayNames[date.dayOfWeek - 1];

            return (
              <div
                class={css({
                  textAlign: "center",
                  padding: "sm",
                  borderRight: "1px solid",
                  borderColor: "border",
                  backgroundColor: "muted",
                })}
              >
                <div
                  class={css({
                    fontSize: "xs",
                    color: "foreground",
                    opacity: 0.5,
                    marginBottom: "xs",
                  })}
                >
                  {dayName}
                </div>
                <div
                  class={css({
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    fontSize: "lg",
                    fontWeight: isTodayDate ? "bold" : "medium",
                    borderRadius: "full",
                    backgroundColor: isTodayDate ? "primary" : "transparent",
                    color: isTodayDate ? "background" : "foreground",
                  })}
                >
                  {date.day}
                </div>
              </div>
            );
          }}
        </For>
      </div>

      {/* All-day events row */}
      <div
        class={css({
          display: "grid",
          gridTemplateColumns: "60px repeat(7, 1fr)",
          borderBottom: "1px solid",
          borderColor: "border",
          minHeight: "40px",
          flexShrink: 0,
        })}
      >
        <div
          class={css({
            borderRight: "1px solid",
            borderColor: "border",
            fontSize: "xs",
            color: "foreground",
            opacity: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          All day
        </div>
        <For each={weekDates()}>
          {(date) => {
            const allDayEvents = createMemo(() => getAllDayEvents(date));

            return (
              <div
                class={css({
                  borderRight: "1px solid",
                  borderColor: "border",
                  padding: "xs",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                })}
              >
                <For each={allDayEvents()}>
                  {(event) => (
                    <div
                      class={css({
                        fontSize: "xs",
                        padding: "2px 4px",
                        borderRadius: "sm",
                        cursor: "pointer",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
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
        </For>
      </div>

      {/* Time grid */}
      <div
        class={css({
          flex: 1,
          overflow: "auto",
        })}
      >
        <For each={hours}>
          {(hour) => (
            <div
              class={css({
                display: "grid",
                gridTemplateColumns: "60px repeat(7, 1fr)",
              })}
            >
              {/* Time label */}
              <div
                class={css({
                  height: "48px",
                  borderRight: "1px solid",
                  borderBottom: "1px solid",
                  borderColor: "border",
                  fontSize: "xs",
                  color: "foreground",
                  opacity: 0.5,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-end",
                  paddingRight: "sm",
                  paddingTop: "2px",
                })}
              >
                {hour === 0
                  ? ""
                  : formatTime(`${hour.toString().padStart(2, "0")}:00`, "12h")}
              </div>

              {/* Day cells */}
              <For each={weekDates()}>
                {(date) => {
                  const cellEvents = createMemo(() =>
                    getEventsForDateAndHour(date, hour),
                  );
                  const isTodayDate = isToday(date);

                  return (
                    <div
                      class={css({
                        height: "48px",
                        borderRight: "1px solid",
                        borderBottom: "1px solid",
                        borderColor: "border",
                        position: "relative",
                        cursor: "pointer",
                        backgroundColor: isTodayDate
                          ? "rgba(137, 180, 250, 0.1)"
                          : "transparent",
                        _hover: {
                          backgroundColor: "hover",
                        },
                      })}
                      onClick={() => handleCellClick(date, hour)}
                    >
                      <For each={cellEvents()}>
                        {(event) => (
                          <div
                            class={css({
                              position: "absolute",
                              top: "2px",
                              left: "2px",
                              right: "2px",
                              fontSize: "xs",
                              padding: "2px 4px",
                              borderRadius: "sm",
                              cursor: "pointer",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              zIndex: 1,
                            })}
                            style={{
                              "background-color":
                                event.color || "var(--colors-primary)",
                              color: "white",
                            }}
                            onClick={(e) => handleEventClick(event, e)}
                          >
                            {formatTime(event.startTime, "12h")} {event.title}
                          </div>
                        )}
                      </For>
                    </div>
                  );
                }}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
