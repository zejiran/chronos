import { createMemo, For } from "solid-js";
import { useStore } from "@nanostores/solid";
import { css } from "../../../styled-system/css";
import { selectedDate, setView } from "../../stores";
import { getCalendarDays, getMonthName, isToday } from "../../lib/date";
import { Temporal } from "@js-temporal/polyfill";

export function YearView() {
  const $selectedDate = useStore(selectedDate);

  const currentYear = createMemo(() => {
    return Temporal.PlainDate.from($selectedDate()).year;
  });

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleMonthClick = (month: number) => {
    const date = Temporal.PlainDate.from({
      year: currentYear(),
      month,
      day: 1,
    });
    selectedDate.set(date.toString());
    setView("month");
  };

  const handleDayClick = (date: Temporal.PlainDate) => {
    selectedDate.set(date.toString());
    setView("day");
  };

  return (
    <div
      class={css({
        height: "100%",
        overflow: "auto",
        padding: "lg",
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "border",
          borderRadius: "full",
        },
      })}
    >
      <div
        class={css({
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "lg",
          maxWidth: "1200px",
          margin: "0 auto",
        })}
      >
        <For each={months}>
          {(month) => (
            <MiniMonth
              year={currentYear()}
              month={month}
              selectedDate={$selectedDate()}
              onMonthClick={() => handleMonthClick(month)}
              onDayClick={handleDayClick}
            />
          )}
        </For>
      </div>
    </div>
  );
}

function MiniMonth(props: {
  year: number;
  month: number;
  selectedDate: string;
  onMonthClick: () => void;
  onDayClick: (date: Temporal.PlainDate) => void;
}) {
  const calendarDays = createMemo(() => {
    return getCalendarDays(props.year, props.month, "monday");
  });

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div
      class={css({
        padding: "md",
        borderRadius: "lg",
        backgroundColor: "muted",
        cursor: "pointer",
        transition: "all 150ms",
        _hover: {
          backgroundColor: "hover",
          transform: "scale(1.02)",
        },
      })}
    >
      {/* Month header */}
      <div
        class={css({
          fontSize: "sm",
          fontWeight: "semibold",
          color: "foreground",
          marginBottom: "sm",
          textAlign: "center",
        })}
        onClick={props.onMonthClick}
      >
        {getMonthName(props.month)}
      </div>

      {/* Week day headers */}
      <div
        class={css({
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "1px",
          marginBottom: "xs",
        })}
      >
        <For each={weekDays}>
          {(day) => (
            <div
              class={css({
                textAlign: "center",
                fontSize: "10px",
                color: "mutedHover",
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
          gap: "1px",
        })}
      >
        <For each={calendarDays()}>
          {(date) => {
            const isTodayDate = isToday(date);
            const isCurrentMonth = date.month === props.month;
            const isSelected = date.toString() === props.selectedDate;

            return (
              <div
                class={css({
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  borderRadius: "full",
                  cursor: "pointer",
                  backgroundColor: isTodayDate
                    ? "accent"
                    : isSelected
                      ? "primary"
                      : "transparent",
                  color:
                    isTodayDate || isSelected
                      ? "white"
                      : isCurrentMonth
                        ? "foreground"
                        : "transparent",
                  fontWeight: isTodayDate ? "bold" : "normal",
                  _hover: {
                    backgroundColor: isTodayDate
                      ? "accentHover"
                      : isSelected
                        ? "primaryHover"
                        : "border",
                  },
                })}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCurrentMonth) {
                    props.onDayClick(date);
                  }
                }}
              >
                {isCurrentMonth ? date.day : ""}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
