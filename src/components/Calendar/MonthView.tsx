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
      })}
    >
      {/* Week day headers */}
      <div
        class={css({
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1px solid {colors.border}",
        })}
      >
        <For each={weekDays}>
          {(day) => (
            <div
              class={css({
                textAlign: "center",
                fontSize: "sm",
                fontWeight: "semibold",
                color: "mutedHover",
                padding: "sm",
                backgroundColor: "muted",
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
                  borderRight: "1px solid {colors.border}",
                  borderBottom: "1px solid {colors.border}",
                  padding: "xs",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "background-color 100ms",
                  backgroundColor: isSelected ? "hover" : "transparent",
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
                    marginBottom: "xs",
                  })}
                >
                  <span
                    class={css({
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "sm",
                      fontWeight: isTodayDate ? "bold" : "normal",
                      borderRadius: "full",
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
                    gap: "2px",
                    overflow: "hidden",
                  })}
                >
                  <For each={dayEvents().slice(0, 3)}>
                    {(event) => (
                      <div
                        class={css({
                          fontSize: "xs",
                          padding: "2px 4px",
                          borderRadius: "sm",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                          transition: "opacity 100ms",
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
                        <Show when={!event.isAllDay}>
                          <span class={css({ marginRight: "4px" })}>
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
                        fontSize: "xs",
                        color: "primary",
                        paddingLeft: "xs",
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
