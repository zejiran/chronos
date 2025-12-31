import { createMemo, For, Show } from "solid-js";
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
  getCalendarDays,
  getShortWeekDays,
  isToday,
  isSameMonth,
  formatTime,
} from "../../lib/date";
import { Temporal } from "@js-temporal/polyfill";
import type { CalendarEvent } from "../../types";

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
          return eventStart.toPlainDate().equals(date);
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

  const handleDayClick = (date: Temporal.PlainDate) => {
    selectedDate.set(date.toString());
  };

  const handleEventClick = (event: CalendarEvent, e: MouseEvent) => {
    e.stopPropagation();
    selectedEventId.set(event.id);
    eventModalOpen.set(true);
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
                paddingTop: "12px", paddingBottom: "12px", paddingLeft: "8px", paddingRight: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
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
          paddingTop: "1px", paddingBottom: "1px", paddingLeft: "1px", paddingRight: "1px",
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
                  paddingTop: "10px", paddingBottom: "10px", paddingLeft: "10px", paddingRight: "10px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: isSelected ? "muted" : "background",
                  position: "relative",
                  _hover: {
                    backgroundColor: "hover",
                  },
                })}
                onClick={() => handleDayClick(date)}
              >
                {/* Day number */}
                <div
                  class={css({
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "8px",
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
                      backgroundColor: isTodayDate ? "primary" : "transparent",
                      color: isTodayDate
                        ? "background"
                        : isCurrentMonth
                          ? "foreground"
                          : "mutedHover",
                    })}
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
                  })}
                >
                  <For each={dayEvents().slice(0, 3)}>
                    {(event) => (
                      <div
                        class={css({
                          fontSize: "11px",
                          fontWeight: "500",
                          paddingTop: "5px", paddingBottom: "5px", paddingLeft: "7px", paddingRight: "7px",
                          borderRadius: "5px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                          transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
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
                        }}
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        <Show when={!event.isAllDay}>
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
                        {event.title}
                      </div>
                    )}
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
