import { createMemo, For } from "solid-js";
import { useStore } from "@nanostores/solid";
import { css } from "../../../styled-system/css";
import { selectedDate } from "../../stores";
import {
  getCalendarDays,
  getShortWeekDays,
  getMonthName,
  isToday,
  isSameMonth,
} from "../../lib/date";
import { Temporal } from "@js-temporal/polyfill";
import { ChevronLeft, ChevronRight } from "lucide-solid";

export function MiniCalendar() {
  const $selectedDate = useStore(selectedDate);

  const currentMonth = createMemo(() => {
    const date = Temporal.PlainDate.from($selectedDate());
    return { year: date.year, month: date.month };
  });

  const calendarDays = createMemo(() => {
    const { year, month } = currentMonth();
    return getCalendarDays(year, month, "monday");
  });

  const weekDays = getShortWeekDays("monday");

  const goToPreviousMonth = () => {
    const date = Temporal.PlainDate.from($selectedDate());
    const newDate = date.subtract({ months: 1 });
    selectedDate.set(newDate.toString());
  };

  const goToNextMonth = () => {
    const date = Temporal.PlainDate.from($selectedDate());
    const newDate = date.add({ months: 1 });
    selectedDate.set(newDate.toString());
  };

  const selectDate = (date: Temporal.PlainDate) => {
    selectedDate.set(date.toString());
  };

  return (
    <div
      class={css({
        paddingTop: "12px", paddingBottom: "12px", paddingLeft: "12px", paddingRight: "12px",
        borderRadius: "8px",
        backgroundColor: "muted",
      })}
    >
      {/* Header */}
      <div
        class={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        })}
      >
        <button
          class={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            backgroundColor: "transparent",
            border: "none",
            color: "mutedHover",
            cursor: "pointer",
            borderRadius: "4px",
            transition: "all 150ms",
            _hover: {
              backgroundColor: "hover",
              color: "foreground",
            },
          })}
          onClick={goToPreviousMonth}
        >
          <ChevronLeft size={16} />
        </button>
        <span
          class={css({
            fontSize: "13px",
            fontWeight: "600",
            color: "foreground",
          })}
        >
          {getMonthName(currentMonth().month)} {currentMonth().year}
        </span>
        <button
          class={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            backgroundColor: "transparent",
            border: "none",
            color: "mutedHover",
            cursor: "pointer",
            borderRadius: "4px",
            transition: "all 150ms",
            _hover: {
              backgroundColor: "hover",
              color: "foreground",
            },
          })}
          onClick={goToNextMonth}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Week day headers */}
      <div
        class={css({
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
          marginBottom: "4px",
        })}
      >
        <For each={weekDays}>
          {(day) => (
            <div
              class={css({
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "600",
                color: "mutedHover",
                paddingTop: "4px",
                paddingBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
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
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
        })}
      >
        <For each={calendarDays()}>
          {(date) => {
            const isSelected = date.toString() === $selectedDate();
            const isTodayDate = isToday(date);
            const isCurrentMonth = isSameMonth(date, $selectedDate());

            return (
              <button
                class={css({
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: isSelected
                    ? "primary"
                    : isTodayDate
                      ? "accent"
                      : "transparent",
                  color: isSelected || isTodayDate
                    ? "background"
                    : isCurrentMonth
                      ? "foreground"
                      : "mutedHover",
                  fontWeight: isTodayDate || isSelected ? "600" : "500",
                  _hover: {
                    backgroundColor: isSelected
                      ? "primaryHover"
                      : isTodayDate
                        ? "accentHover"
                        : "hover",
                  },
                  _active: {
                    transform: "scale(0.95)",
                  },
                })}
                onClick={() => selectDate(date)}
              >
                {date.day}
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
}
