import { createMemo, Show } from "solid-js";
import { useStore } from "@nanostores/solid";
import { css } from "../../../styled-system/css";
import { Button } from "../shared/Button";
import {
  selectedDate,
  currentView,
  goToToday,
  goToPrevious,
  goToNext,
  setView,
  toggleSidebar,
  sidebarVisible,
  commandPaletteOpen,
  eventModalOpen,
  isSyncing,
} from "../../stores";
import { formatDate, getMonthName } from "../../lib/date";
import { Temporal } from "@js-temporal/polyfill";
import type { CalendarView } from "../../types";

export function Header() {
  const $selectedDate = useStore(selectedDate);
  const $currentView = useStore(currentView);
  const $sidebarVisible = useStore(sidebarVisible);
  const $isSyncing = useStore(isSyncing);

  const dateDisplay = createMemo(() => {
    const date = Temporal.PlainDate.from($selectedDate());
    const view = $currentView();

    switch (view) {
      case "day":
        return formatDate(date, "full");
      case "week":
        return `${getMonthName(date.month)} ${date.year}`;
      case "month":
        return `${getMonthName(date.month)} ${date.year}`;
      case "year":
        return `${date.year}`;
      case "agenda":
        return formatDate(date, "long");
      default:
        return formatDate(date, "medium");
    }
  });

  const views: { id: CalendarView; label: string; shortcut: string }[] = [
    { id: "day", label: "Day", shortcut: "D" },
    { id: "week", label: "Week", shortcut: "W" },
    { id: "month", label: "Month", shortcut: "M" },
    { id: "year", label: "Year", shortcut: "Y" },
    { id: "agenda", label: "Agenda", shortcut: "A" },
  ];

  return (
    <header
      class={css({
        height: "56px",
        borderBottom: "1px solid",
        borderColor: "border",
        backgroundColor: "background",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        gap: "16px",
        flexShrink: 0,
      })}
    >
      {/* Left section */}
      <div
        class={css({
          display: "flex",
          alignItems: "center",
          gap: "md",
        })}
      >
        {/* Sidebar toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSidebar()}
          title={$sidebarVisible() ? "Hide sidebar" : "Show sidebar"}
        >
          {$sidebarVisible() ? "◀" : "▶"}
        </Button>

        {/* Logo */}
        <div
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "sm",
          })}
        >
          <span
            class={css({
              fontSize: "xl",
              fontWeight: "bold",
              color: "primary",
            })}
          >
            Chronos
          </span>
        </div>

        {/* Navigation */}
        <div
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "xs",
          })}
        >
          <Button variant="ghost" size="sm" onClick={() => goToPrevious()}>
            ←
          </Button>
          <Button variant="secondary" size="sm" onClick={() => goToToday()}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => goToNext()}>
            →
          </Button>
        </div>

        {/* Date display */}
        <h1
          class={css({
            fontSize: "xl",
            fontWeight: "semibold",
            color: "foreground",
            minWidth: "200px",
          })}
        >
          {dateDisplay()}
        </h1>
      </div>

      {/* Center section - View switcher */}
      <div
        class={css({
          display: "flex",
          alignItems: "center",
          gap: "xs",
          backgroundColor: "muted",
          borderRadius: "md",
          padding: "xs",
        })}
      >
        {views.map((view) => (
          <button
            class={css({
              padding: "xs md",
              borderRadius: "sm",
              border: "none",
              fontSize: "sm",
              fontWeight: "medium",
              cursor: "pointer",
              transition: "all 150ms",
              backgroundColor:
                $currentView() === view.id ? "background" : "transparent",
              color: $currentView() === view.id ? "primary" : "foreground",
              boxShadow: $currentView() === view.id ? "sm" : "none",
              _hover: {
                backgroundColor:
                  $currentView() === view.id ? "background" : "hover",
              },
            })}
            onClick={() => setView(view.id)}
            title={`${view.label} view (${view.shortcut})`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Right section */}
      <div
        class={css({
          display: "flex",
          alignItems: "center",
          gap: "sm",
        })}
      >
        {/* Sync indicator */}
        <Show when={$isSyncing()}>
          <span
            class={css({
              fontSize: "sm",
              color: "muted",
              display: "flex",
              alignItems: "center",
              gap: "xs",
            })}
          >
            <span
              class={css({
                animation: "spin 1s linear infinite",
              })}
            >
              ↻
            </span>
            Syncing...
          </span>
        </Show>

        {/* Search / Command palette */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => commandPaletteOpen.set(true)}
          title="Command palette (Cmd+K)"
        >
          <span
            class={css({ display: "flex", alignItems: "center", gap: "xs" })}
          >
            🔍
            <span
              class={css({
                fontSize: "xs",
                color: "muted",
                padding: "2px 6px",
                backgroundColor: "hover",
                borderRadius: "sm",
              })}
            >
              ⌘K
            </span>
          </span>
        </Button>

        {/* New event button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => eventModalOpen.set(true)}
          title="New event (Cmd+N)"
        >
          + New Event
        </Button>
      </div>
    </header>
  );
}
