import { For, Show, createMemo } from "solid-js";
import { useStore } from "@nanostores/solid";
import { css } from "../../../styled-system/css";
import { MiniCalendar } from "./MiniCalendar";
import {
  sidebarVisible,
  events,
  accountModalOpen,
  getCalendarsList,
  toggleCalendarVisibility,
} from "../../stores";
import { Temporal } from "@js-temporal/polyfill";
import { formatTime, getRelativeTimeString } from "../../lib/date";
import type { CalendarEvent } from "../../types";

export function Sidebar() {
  const $sidebarVisible = useStore(sidebarVisible);
  const $events = useStore(events);

  const calendarsList = createMemo(() => getCalendarsList());

  const upcomingEvents = createMemo(() => {
    const now = Temporal.Now.zonedDateTimeISO();
    const next24h = now.add({ hours: 24 });

    return Object.values($events())
      .filter((event) => {
        try {
          const start = Temporal.Instant.from(event.startTime);
          const nowInstant = now.toInstant();
          const futureInstant = next24h.toInstant();
          return (
            Temporal.Instant.compare(start, nowInstant) >= 0 &&
            Temporal.Instant.compare(start, futureInstant) <= 0
          );
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const aStart = Temporal.Instant.from(a.startTime);
        const bStart = Temporal.Instant.from(b.startTime);
        return Temporal.Instant.compare(aStart, bStart);
      })
      .slice(0, 5);
  });

  return (
    <Show when={$sidebarVisible()}>
      <aside
        class={css({
          width: "280px",
          height: "100%",
          backgroundColor: "sidebar",
          borderRight: "1px solid {colors.border}",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        })}
      >
        {/* Mini Calendar */}
        <div class={css({ padding: "md" })}>
          <MiniCalendar />
        </div>

        {/* Calendars Section */}
        <div
          class={css({
            padding: "md",
            borderTop: "1px solid {colors.border}",
          })}
        >
          <div
            class={css({
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "sm",
            })}
          >
            <h3
              class={css({
                fontSize: "sm",
                fontWeight: "semibold",
                color: "foreground",
              })}
            >
              Calendars
            </h3>
            <button
              class={css({
                fontSize: "xs",
                color: "primary",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                _hover: { textDecoration: "underline" },
              })}
              onClick={() => accountModalOpen.set(true)}
            >
              + Add
            </button>
          </div>

          <div
            class={css({
              display: "flex",
              flexDirection: "column",
              gap: "xs",
            })}
          >
            <For each={calendarsList()}>
              {(calendar) => (
                <div
                  class={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "sm",
                    padding: "xs sm",
                    borderRadius: "sm",
                    cursor: "pointer",
                    _hover: { backgroundColor: "hover" },
                  })}
                  onClick={() => toggleCalendarVisibility(calendar.id)}
                >
                  <div
                    class={css({
                      width: "12px",
                      height: "12px",
                      borderRadius: "sm",
                      flexShrink: 0,
                    })}
                    style={{
                      "background-color": calendar.isVisible
                        ? calendar.color
                        : "transparent",
                      border: `2px solid ${calendar.color}`,
                    }}
                  />
                  <span
                    class={css({
                      fontSize: "sm",
                      color: calendar.isVisible ? "foreground" : "mutedHover",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    })}
                  >
                    {calendar.name}
                  </span>
                </div>
              )}
            </For>

            <Show when={calendarsList().length === 0}>
              <div
                class={css({
                  fontSize: "sm",
                  color: "mutedHover",
                  textAlign: "center",
                  padding: "md",
                })}
              >
                No calendars yet
              </div>
            </Show>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div
          class={css({
            flex: 1,
            padding: "md",
            borderTop: "1px solid {colors.border}",
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "border",
              borderRadius: "full",
            },
          })}
        >
          <h3
            class={css({
              fontSize: "sm",
              fontWeight: "semibold",
              color: "foreground",
              marginBottom: "sm",
            })}
          >
            Upcoming
          </h3>

          <Show when={upcomingEvents().length === 0}>
            <div
              class={css({
                textAlign: "center",
                padding: "lg",
                color: "mutedHover",
                fontSize: "sm",
              })}
            >
              No upcoming events
            </div>
          </Show>

          <div
            class={css({
              display: "flex",
              flexDirection: "column",
              gap: "sm",
            })}
          >
            <For each={upcomingEvents()}>
              {(event) => <UpcomingEventCard event={event} />}
            </For>
          </div>
        </div>
      </aside>
    </Show>
  );
}

function UpcomingEventCard(props: { event: CalendarEvent }) {
  const timeDisplay = createMemo(() => {
    if (props.event.isAllDay) {
      return "All day";
    }
    return formatTime(props.event.startTime, "12h");
  });

  const relativeTime = createMemo(() => {
    return getRelativeTimeString(props.event.startTime);
  });

  return (
    <div
      class={css({
        padding: "sm",
        borderRadius: "md",
        backgroundColor: "muted",
        borderLeft: "3px solid",
        cursor: "pointer",
        transition: "all 150ms",
        _hover: {
          backgroundColor: "hover",
          transform: "translateX(2px)",
        },
      })}
      style={{
        "border-left-color": props.event.color || "var(--colors-primary)",
      }}
    >
      <div
        class={css({
          fontSize: "sm",
          fontWeight: "medium",
          color: "foreground",
          marginBottom: "xs",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        })}
      >
        {props.event.title}
      </div>
      <div
        class={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span
          class={css({
            fontSize: "xs",
            color: "mutedHover",
          })}
        >
          {timeDisplay()}
        </span>
        <span
          class={css({
            fontSize: "xs",
            color: "primary",
          })}
        >
          {relativeTime()}
        </span>
      </div>
      <Show when={props.event.location}>
        <div
          class={css({
            fontSize: "xs",
            color: "mutedHover",
            marginTop: "xs",
            display: "flex",
            alignItems: "center",
            gap: "xs",
          })}
        >
          📍 {props.event.location}
        </div>
      </Show>
    </div>
  );
}
