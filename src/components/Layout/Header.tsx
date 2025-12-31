import { createMemo, Show } from "solid-js";
import { useStore } from "@nanostores/solid";
import { css } from "../../../styled-system/css";
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
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
} from "lucide-solid";
import { WindowControls } from "../shared/WindowControls";

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
      style={{ "-webkit-app-region": "drag" }}
      class={css({
        height: "56px",
        backgroundColor: "sidebar",
        borderBottom: "1px solid",
        borderColor: "border",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: "16px",
        paddingRight: "20px",
        gap: "16px",
        flexShrink: 0,
        position: "relative",
      })}
    >
      {/* Left section */}
      <div
        style={{ "-webkit-app-region": "drag" }}
        class={css({
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flex: "1",
          minWidth: 0,
        })}
      >
        {/* Window controls (macOS traffic lights replacement) */}
        <WindowControls />

        {/* Sidebar toggle */}
        <button
          style={{ "-webkit-app-region": "no-drag" }}
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
          style={{ "-webkit-app-region": "no-drag" }}
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "muted",
            borderRadius: "8px",
            paddingTop: "6px",
            paddingBottom: "6px",
            paddingLeft: "6px",
            paddingRight: "6px",
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
              paddingTop: "0",
              paddingBottom: "0",
              paddingLeft: "12px",
              paddingRight: "12px",
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
          style={{ "-webkit-app-region": "drag" }}
          class={css({
            fontSize: "18px",
            fontWeight: "600",
            color: "foreground",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
            maxWidth: "300px",
            "@media (max-width: 768px)": {
              fontSize: "16px",
              maxWidth: "200px",
            },
          })}
        >
          {dateDisplay()}
        </h1>
      </div>

      {/* Center section - View switcher */}
      <div
        style={{ "-webkit-app-region": "no-drag" }}
        class={css({
          display: "flex",
          alignItems: "center",
          gap: "4px",
          backgroundColor: "muted",
          borderRadius: "8px",
          paddingTop: "4px",
          paddingBottom: "4px",
          paddingLeft: "4px",
          paddingRight: "4px",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1,
          "@media (max-width: 1200px)": {
            position: "static",
            transform: "none",
            marginLeft: "auto",
            marginRight: "auto",
          },
        })}
      >
        {views.map((view) => (
          <button
            class={css({
              paddingTop: "6px",
              paddingBottom: "6px",
              paddingLeft: "12px",
              paddingRight: "12px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: "500",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              backgroundColor:
                $currentView() === view.id ? "primary" : "transparent",
              color: $currentView() === view.id ? "background" : "mutedHover",
              _hover: {
                backgroundColor:
                  $currentView() === view.id ? "primaryHover" : "hover",
                color: $currentView() === view.id ? "background" : "foreground",
              },
              _active: {
                transform: "scale(0.97)",
              },
              "@media (max-width: 768px)": {
                paddingLeft: "8px",
                paddingRight: "8px",
                fontSize: "12px",
                height: "28px",
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
        style={{ "-webkit-app-region": "drag" }}
        class={css({
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flex: "1",
          justifyContent: "flex-end",
          minWidth: 0,
          "@media (max-width: 768px)": {
            gap: "8px",
          },
        })}
      >
        {/* Sync indicator */}
        <Show when={$isSyncing()}>
          <div
            class={css({
              display: "flex",
              alignItems: "center",
              gap: "6px",
              paddingTop: "6px",
              paddingBottom: "6px",
              paddingLeft: "10px",
              paddingRight: "10px",
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
          style={{ "-webkit-app-region": "no-drag" }}
          onClick={() => commandPaletteOpen.set(true)}
          title="Search (⌘K)"
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "6px",
            paddingTop: "6px",
            paddingBottom: "6px",
            paddingLeft: "10px",
            paddingRight: "10px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "muted",
            color: "mutedHover",
            fontSize: "13px",
            fontWeight: "500",
            height: "32px",
            cursor: "pointer",
            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            _hover: {
              backgroundColor: "hover",
              color: "foreground",
            },
            _active: {
              transform: "scale(0.97)",
            },
            "@media (max-width: 768px)": {
              paddingLeft: "8px",
              paddingRight: "8px",
              height: "28px",
            },
          })}
        >
          <Search size={14} />
          <span
            class={css({
              fontSize: "11px",
              paddingTop: "1px",
              paddingBottom: "1px",
              paddingLeft: "5px",
              paddingRight: "5px",
              backgroundColor: "hover",
              borderRadius: "4px",
              fontWeight: "600",
              "@media (max-width: 768px)": {
                display: "none",
              },
            })}
          >
            ⌘K
          </span>
        </button>

        {/* New event button */}
        <button
          style={{ "-webkit-app-region": "no-drag" }}
          onClick={() => eventModalOpen.set(true)}
          title="New event (⌘N)"
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "6px",
            paddingTop: "6px",
            paddingBottom: "6px",
            paddingLeft: "12px",
            paddingRight: "12px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "primary",
            color: "background",
            fontSize: "13px",
            fontWeight: "600",
            height: "32px",
            cursor: "pointer",
            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            whiteSpace: "nowrap",
            _hover: {
              backgroundColor: "primaryHover",
            },
            _active: {
              transform: "translateY(0) scale(0.98)",
            },
            "@media (max-width: 768px)": {
              paddingLeft: "10px",
              paddingRight: "10px",
              fontSize: "12px",
              height: "28px",
            },
            "@media (max-width: 600px)": {
              "& span": {
                display: "none",
              },
              paddingLeft: "8px",
              paddingRight: "8px",
            },
          })}
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New Event</span>
        </button>
      </div>
    </header>
  );
}
