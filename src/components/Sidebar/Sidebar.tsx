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
import { Calendar, Plus, MapPin, Clock } from "lucide-solid";

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
          borderRight: "1px solid",
          borderColor: "border",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        })}
      >
        {/* Mini Calendar */}
        <div class={css({ paddingTop: "16px", paddingBottom: "16px", paddingLeft: "16px", paddingRight: "16px" })}>
          <MiniCalendar />
        </div>

        {/* Calendars Section */}
        <div
          class={css({
            paddingTop: "16px",
            paddingBottom: "16px",
            paddingLeft: "16px",
            paddingRight: "16px",
            borderTop: "1px solid",
            borderColor: "border",
          })}
        >
          <div
            class={css({
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            })}
          >
            <h3
              class={css({
                fontSize: "12px",
                fontWeight: "600",
                color: "mutedHover",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              })}
            >
              Calendars
            </h3>
            <button
              class={css({
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: "500",
                color: "primary",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                paddingTop: "6px", paddingBottom: "6px", paddingLeft: "10px", paddingRight: "10px",
                borderRadius: "6px",
                transition: "all 150ms",
                _hover: {
                  backgroundColor: "hover",
                },
              })}
              onClick={() => accountModalOpen.set(true)}
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <div
            class={css({
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            })}
          >
            <For each={calendarsList()}>
              {(calendar) => (
                <div
                  class={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    paddingTop: "10px", paddingBottom: "10px", paddingLeft: "12px", paddingRight: "12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 150ms",
                    _hover: {
                      backgroundColor: "hover",
                    },
                  })}
                  onClick={() => toggleCalendarVisibility(calendar.id)}
                >
                  <div
                    class={css({
                      width: "14px",
                      height: "14px",
                      borderRadius: "4px",
                      flexShrink: 0,
                      transition: "all 150ms",
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
                      fontSize: "13px",
                      fontWeight: "500",
                      color: calendar.isVisible ? "foreground" : "mutedHover",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      transition: "color 150ms",
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
                  fontSize: "13px",
                  color: "mutedHover",
                  textAlign: "center",
                  paddingTop: "24px", paddingBottom: "24px", paddingLeft: "16px", paddingRight: "16px",
                })}
              >
                <Calendar
                  size={32}
                  class={css({ margin: "0 auto 8px", opacity: "0.3" })}
                />
                <div>No calendars yet</div>
              </div>
            </Show>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div
          class={css({
            flex: 1,
            paddingTop: "16px",
            paddingBottom: "16px",
            paddingLeft: "16px",
            paddingRight: "16px",
            borderTop: "1px solid",
            borderColor: "border",
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "border",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
          })}
        >
          <h3
            class={css({
              fontSize: "12px",
              fontWeight: "600",
              color: "mutedHover",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "14px",
            })}
          >
            Upcoming
          </h3>

          <Show when={upcomingEvents().length === 0}>
            <div
              class={css({
                textAlign: "center",
                paddingTop: "32px", paddingBottom: "32px", paddingLeft: "16px", paddingRight: "16px",
                color: "mutedHover",
                fontSize: "13px",
              })}
            >
              <Clock
                size={32}
                class={css({ margin: "0 auto 8px", opacity: "0.3" })}
              />
              <div>No upcoming events</div>
            </div>
          </Show>

          <div
            class={css({
              display: "flex",
              flexDirection: "column",
              gap: "10px",
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
        paddingTop: "12px", paddingBottom: "12px", paddingLeft: "12px", paddingRight: "12px",
        borderRadius: "8px",
        backgroundColor: "muted",
        borderLeft: "3px solid",
        cursor: "pointer",
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
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
          fontSize: "13px",
          fontWeight: "600",
          color: "foreground",
          marginBottom: "6px",
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
          marginBottom: "4px",
        })}
      >
        <div
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            color: "mutedHover",
          })}
        >
          <Clock size={12} />
          {timeDisplay()}
        </div>
        <span
          class={css({
            fontSize: "11px",
            fontWeight: "500",
            color: "primary",
          })}
        >
          {relativeTime()}
        </span>
      </div>
      <Show when={props.event.location}>
        <div
          class={css({
            fontSize: "11px",
            color: "mutedHover",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          })}
        >
          <MapPin size={12} />
          {props.event.location}
        </div>
      </Show>
    </div>
  );
}
