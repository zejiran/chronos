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
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Plus,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
} from "lucide-solid";

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
      data-tauri-drag-region
      class={css({
        height: "56px",
        backgroundColor: "sidebar",
        borderBottom: "1px solid",
        borderColor: "border",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        paddingLeft: "80px", // Space for macOS traffic lights
        gap: "16px",
        flexShrink: 0,
        position: "relative",
      })}
    >
      {/* Left section */}
      <div
        class={css({
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flex: "1",
        })}
      >
        {/* Sidebar toggle */}
        <button
          onClick={() => toggleSidebar()}
          title={$sidebarVisible() ? "Hide sidebar" : "Show sidebar"}
          class={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            color: "mutedHover",
            cursor: "pointer",
            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            _hover: {
              backgroundColor: "hover",
              color: "foreground",
            },
            _active: {
              transform: "scale(0.95)",
            },
          })}
        >
          {$sidebarVisible() ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeft size={18} />
          )}
        </button>

        {/* Navigation */}
        <div
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: "muted",
            borderRadius: "8px",
            padding: "4px",
          })}
        >
          <button
            onClick={() => goToPrevious()}
            title="Previous"
            class={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "transparent",
              color: "mutedHover",
              cursor: "pointer",
              transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
              _hover: {
                backgroundColor: "hover",
                color: "foreground",
              },
              _active: {
                transform: "scale(0.95)",
              },
            })}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => goToToday()}
            title="Today"
            class={css({
              padding: "0 12px",
              height: "28px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "transparent",
              color: "foreground",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              _hover: {
                backgroundColor: "hover",
              },
              _active: {
                transform: "scale(0.97)",
              },
            })}
          >
            Today
          </button>

          <button
            onClick={() => goToNext()}
            title="Next"
            class={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "transparent",
              color: "mutedHover",
              cursor: "pointer",
              transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
              _hover: {
                backgroundColor: "hover",
                color: "foreground",
              },
              _active: {
                transform: "scale(0.95)",
              },
            })}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Date display */}
        <h1
          class={css({
            fontSize: "18px",
            fontWeight: "600",
            color: "foreground",
            letterSpacing: "-0.01em",
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
          gap: "4px",
          backgroundColor: "muted",
          borderRadius: "8px",
          padding: "4px",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        })}
      >
        {views.map((view) => (
          <button
            class={css({
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
              backgroundColor:
                $currentView() === view.id ? "primary" : "transparent",
              color:
                $currentView() === view.id ? "background" : "mutedHover",
              _hover: {
                backgroundColor:
                  $currentView() === view.id ? "primaryHover" : "hover",
                color:
                  $currentView() === view.id ? "background" : "foreground",
              },
              _active: {
                transform: "scale(0.97)",
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
          gap: "8px",
          flex: "1",
          justifyContent: "flex-end",
        })}
      >
        {/* Sync indicator */}
        <Show when={$isSyncing()}>
          <div
            class={css({
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 10px",
              borderRadius: "6px",
              backgroundColor: "muted",
              color: "primary",
              fontSize: "12px",
              fontWeight: "500",
            })}
          >
            <div
              class={css({
                animation: "spin 1s linear infinite",
              })}
            >
              <RefreshCw size={14} />
            </div>
            Syncing
          </div>
        </Show>

        {/* Search / Command palette */}
        <button
          onClick={() => commandPaletteOpen.set(true)}
          title="Search (⌘K)"
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "muted",
            color: "mutedHover",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            _hover: {
              backgroundColor: "hover",
              color: "foreground",
            },
            _active: {
              transform: "scale(0.97)",
            },
          })}
        >
          <Search size={16} />
          <span
            class={css({
              fontSize: "11px",
              padding: "2px 6px",
              backgroundColor: "hover",
              borderRadius: "4px",
              fontWeight: "600",
            })}
          >
            ⌘K
          </span>
        </button>

        {/* New event button */}
        <button
          onClick={() => eventModalOpen.set(true)}
          title="New event (⌘N)"
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "primary",
            color: "background",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            _hover: {
              backgroundColor: "primaryHover",
            },
            _active: {
              transform: "translateY(0) scale(0.98)",
            },
          })}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Event
        </button>
      </div>
    </header>
  );
}
