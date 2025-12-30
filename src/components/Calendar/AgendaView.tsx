import { createMemo, For, Show } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { css } from '../../../styled-system/css'
import { selectedDate, events, calendars, eventModalOpen, selectedEventId } from '../../stores'
import { formatDate, formatTime, isToday, getDurationString } from '../../lib/date'
import { Temporal } from '@js-temporal/polyfill'
import type { Event } from '../../types'

export function AgendaView() {
  const $selectedDate = useStore(selectedDate)
  const $events = useStore(events)
  const $calendars = useStore(calendars)

  const upcomingDays = createMemo(() => {
    const startDate = Temporal.PlainDate.from($selectedDate())
    return Array.from({ length: 30 }, (_, i) => startDate.add({ days: i }))
  })

  const getEventsForDate = (date: Temporal.PlainDate): Event[] => {
    const visibleCalendarIds = new Set(
      Object.values($calendars())
        .filter((cal) => cal.isVisible)
        .map((cal) => cal.id)
    )

    return Object.values($events())
      .filter((event) => {
        if (!visibleCalendarIds.has(event.calendarId)) return false

        try {
          const eventStart = Temporal.PlainDateTime.from(event.startTime.replace('Z', ''))
          return eventStart.toPlainDate().equals(date)
        } catch {
          return false
        }
      })
      .sort((a, b) => {
        if (a.allDay && !b.allDay) return -1
        if (!a.allDay && b.allDay) return 1
        return a.startTime.localeCompare(b.startTime)
      })
  }

  const daysWithEvents = createMemo(() => {
    return upcomingDays()
      .map((date) => ({
        date,
        events: getEventsForDate(date),
      }))
      .filter((day) => day.events.length > 0)
  })

  const handleEventClick = (event: Event) => {
    selectedEventId.set(event.id)
    eventModalOpen.set(true)
  }

  return (
    <div
      class={css({
        height: '100%',
        overflow: 'auto',
        padding: 'lg',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'border',
          borderRadius: 'full',
        },
      })}
    >
      <div
        class={css({
          maxWidth: '800px',
          margin: '0 auto',
        })}
      >
        <Show when={daysWithEvents().length === 0}>
          <div
            class={css({
              textAlign: 'center',
              padding: '2xl',
              color: 'mutedHover',
            })}
          >
            <div class={css({ fontSize: '3xl', marginBottom: 'md' })}>📅</div>
            <div class={css({ fontSize: 'lg', fontWeight: 'medium' })}>
              No upcoming events
            </div>
            <div class={css({ fontSize: 'sm', marginTop: 'sm' })}>
              Events for the next 30 days will appear here
            </div>
          </div>
        </Show>

        <For each={daysWithEvents()}>
          {(day) => (
            <div class={css({ marginBottom: 'lg' })}>
              {/* Date header */}
              <div
                class={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'md',
                  marginBottom: 'sm',
                  paddingBottom: 'sm',
                  borderBottom: '1px solid {colors.border}',
                })}
              >
                <div
                  class={css({
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'lg',
                    backgroundColor: isToday(day.date) ? 'primary' : 'muted',
                    color: isToday(day.date) ? 'background' : 'foreground',
                  })}
                >
                  <span class={css({ fontSize: 'xs', fontWeight: 'medium' })}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day.date.dayOfWeek - 1]}
                  </span>
                  <span class={css({ fontSize: 'lg', fontWeight: 'bold' })}>
                    {day.date.day}
                  </span>
                </div>
                <div>
                  <div class={css({ fontSize: 'base', fontWeight: 'semibold', color: 'foreground' })}>
                    {formatDate(day.date, 'long')}
                  </div>
                  <Show when={isToday(day.date)}>
                    <div class={css({ fontSize: 'sm', color: 'primary' })}>Today</div>
                  </Show>
                </div>
              </div>

              {/* Events list */}
              <div
                class={css({
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'sm',
                  paddingLeft: '64px',
                })}
              >
                <For each={day.events}>
                  {(event) => (
                    <div
                      class={css({
                        display: 'flex',
                        gap: 'md',
                        padding: 'md',
                        borderRadius: 'lg',
                        backgroundColor: 'muted',
                        cursor: 'pointer',
                        transition: 'all 150ms',
                        borderLeft: '4px solid',
                        _hover: {
                          backgroundColor: 'hover',
                          transform: 'translateX(4px)',
                        },
                      })}
                      style={{
                        'border-left-color': event.color || 'var(--colors-primary)',
                      }}
                      onClick={() => handleEventClick(event)}
                    >
                      {/* Time column */}
                      <div
                        class={css({
                          width: '80px',
                          flexShrink: 0,
                        })}
                      >
                        <Show when={event.allDay}>
                          <span class={css({ fontSize: 'sm', color: 'primary', fontWeight: 'medium' })}>
                            All day
                          </span>
                        </Show>
                        <Show when={!event.allDay}>
                          <div class={css({ fontSize: 'sm', fontWeight: 'medium', color: 'foreground' })}>
                            {formatTime(event.startTime, '12h')}
                          </div>
                          <div class={css({ fontSize: 'xs', color: 'mutedHover' })}>
                            {getDurationString(event.startTime, event.endTime)}
                          </div>
                        </Show>
                      </div>

                      {/* Event details */}
                      <div class={css({ flex: 1, minWidth: 0 })}>
                        <div
                          class={css({
                            fontSize: 'base',
                            fontWeight: 'medium',
                            color: 'foreground',
                            marginBottom: 'xs',
                          })}
                        >
                          {event.title}
                        </div>
                        <Show when={event.location}>
                          <div
                            class={css({
                              fontSize: 'sm',
                              color: 'mutedHover',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'xs',
                            })}
                          >
                            📍 {event.location}
                          </div>
                        </Show>
                        <Show when={event.description}>
                          <div
                            class={css({
                              fontSize: 'sm',
                              color: 'mutedHover',
                              marginTop: 'xs',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            })}
                          >
                            {event.description}
                          </div>
                        </Show>
                      </div>

                      {/* Video call indicator */}
                      <Show when={event.videoLink}>
                        <div
                          class={css({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'xs',
                            padding: 'xs sm',
                            borderRadius: 'md',
                            backgroundColor: 'success',
                            color: 'background',
                            fontSize: 'xs',
                            fontWeight: 'medium',
                          })}
                        >
                          🎥 Join
                        </div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
