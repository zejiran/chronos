import { createMemo, For, Show } from "solid-js";
import { useStore } from "@nanostores/solid";
import { css } from "../../../styled-system/css";
import { MapPin } from "lucide-solid";
import {
  selectedDate,
  events,
  calendars,
  eventModalOpen,
  selectedEventId,
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

  const getEventsForHour = (hour: number): CalendarEvent[] => {
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
        return (
          eventStart.toPlainDate().equals(date) && eventStart.hour === hour
        );
      } catch {
        return false;
      }
    });
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
            backgroundColor: isToday(currentDate()) ? "primary" : "background",
            color: isToday(currentDate()) ? "background" : "foreground",
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
        <For each={hours}>
          {(hour) => {
            const hourEvents = createMemo(() => getEventsForHour(hour));

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
                    display: "flex",
                    flexDirection: "column",
                    gap: "xs",
                    _hover: {
                      backgroundColor: "hover",
                    },
                  })}
                >
                  <For each={hourEvents()}>
                    {(event) => (
                      <div
                        class={css({
                          padding: "sm md",
                          borderRadius: "md",
                          cursor: "pointer",
                          borderLeft: "4px solid",
                        })}
                        style={{
                          "background-color": `color-mix(in srgb, ${event.color || "var(--colors-primary)"} 20%, transparent)`,
                          "border-left-color":
                            event.color || "var(--colors-primary)",
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
                        <div
                          class={css({ fontSize: "xs", color: "mutedHover" })}
                        >
                          {formatTime(event.startTime, "12h")} -{" "}
                          {formatTime(event.endTime, "12h")}
                        </div>
                        <Show when={event.location}>
                          <div
                            class={css({
                              fontSize: "xs",
                              color: "mutedHover",
                              marginTop: "xs",
                            })}
                          >
                            <MapPin size={12} /> {event.location}
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
