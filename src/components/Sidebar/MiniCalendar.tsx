import { createMemo, For } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { css } from '../../../styled-system/css'
import { selectedDate } from '../../stores'
import { getCalendarDays, getShortWeekDays, getMonthName, isToday, isSameMonth } from '../../lib/date'
import { Temporal } from '@js-temporal/polyfill'

export function MiniCalendar() {
  const $selectedDate = useStore(selectedDate)

  const currentMonth = createMemo(() => {
    const date = Temporal.PlainDate.from($selectedDate())
    return { year: date.year, month: date.month }
  })

  const calendarDays = createMemo(() => {
    const { year, month } = currentMonth()
    return getCalendarDays(year, month, 'monday')
  })

  const weekDays = getShortWeekDays('monday')

  const goToPreviousMonth = () => {
    const date = Temporal.PlainDate.from($selectedDate())
    const newDate = date.subtract({ months: 1 })
    selectedDate.set(newDate.toString())
  }

  const goToNextMonth = () => {
    const date = Temporal.PlainDate.from($selectedDate())
    const newDate = date.add({ months: 1 })
    selectedDate.set(newDate.toString())
  }

  const selectDate = (date: Temporal.PlainDate) => {
    selectedDate.set(date.toString())
  }

  return (
    <div
      class={css({
        padding: 'sm',
        borderRadius: 'md',
        backgroundColor: 'muted',
      })}
    >
      {/* Header */}
      <div
        class={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'sm',
        })}
      >
        <button
          class={css({
            padding: 'xs',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'foreground',
            cursor: 'pointer',
            borderRadius: 'sm',
            _hover: { backgroundColor: 'hover' },
          })}
          onClick={goToPreviousMonth}
        >
          ←
        </button>
        <span
          class={css({
            fontSize: 'sm',
            fontWeight: 'semibold',
            color: 'foreground',
          })}
        >
          {getMonthName(currentMonth().month)} {currentMonth().year}
        </span>
        <button
          class={css({
            padding: 'xs',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'foreground',
            cursor: 'pointer',
            borderRadius: 'sm',
            _hover: { backgroundColor: 'hover' },
          })}
          onClick={goToNextMonth}
        >
          →
        </button>
      </div>

      {/* Week day headers */}
      <div
        class={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          marginBottom: 'xs',
        })}
      >
        <For each={weekDays}>
          {(day) => (
            <div
              class={css({
                textAlign: 'center',
                fontSize: 'xs',
                fontWeight: 'medium',
                color: 'mutedHover',
                padding: 'xs',
              })}
            >
              {day.charAt(0)}
            </div>
          )}
        </For>
      </div>

      {/* Calendar grid */}
      <div
        class={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
        })}
      >
        <For each={calendarDays()}>
          {(date) => {
            const isSelected = date.toString() === $selectedDate()
            const isTodayDate = isToday(date)
            const isCurrentMonth = isSameMonth(date, $selectedDate())

            return (
              <button
                class={css({
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'xs',
                  border: 'none',
                  borderRadius: 'full',
                  cursor: 'pointer',
                  transition: 'all 100ms',
                  backgroundColor: isSelected
                    ? 'primary'
                    : isTodayDate
                    ? 'accent'
                    : 'transparent',
                  color: isSelected || isTodayDate
                    ? 'background'
                    : isCurrentMonth
                    ? 'foreground'
                    : 'mutedHover',
                  fontWeight: isTodayDate ? 'bold' : 'normal',
                  _hover: {
                    backgroundColor: isSelected
                      ? 'primaryHover'
                      : isTodayDate
                      ? 'accentHover'
                      : 'hover',
                  },
                })}
                onClick={() => selectDate(date)}
              >
                {date.day}
              </button>
            )
          }}
        </For>
      </div>
    </div>
  )
}
