import { createMemo, Show, createSignal, onMount, onCleanup } from "solid-js";
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
  ChevronDown,
  Calendar,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  ListTodo,
} from "lucide-solid";
import { WindowControls } from "../shared/WindowControls";

export function Header() {
  const $selectedDate = useStore(selectedDate);
  const $currentView = useStore(currentView);
  const $sidebarVisible = useStore(sidebarVisible);
  const $isSyncing = useStore(isSyncing);
  const [dropdownOpen, setDropdownOpen] = createSignal(false);
  let dropdownRef: HTMLDivElement | undefined;

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

  const views: {
    id: CalendarView;
    label: string;
    shortcut: string;
    icon: any;
  }[] = [
    { id: "day", label: "Day", shortcut: "D", icon: Calendar },
    { id: "week", label: "Week", shortcut: "W", icon: CalendarDays },
    { id: "month", label: "Month", shortcut: "M", icon: CalendarRange },
    { id: "year", label: "Year", shortcut: "Y", icon: CalendarClock },
    { id: "agenda", label: "Agenda", shortcut: "A", icon: ListTodo },
  ];

  const currentViewData = createMemo(() => {
    return views.find((v) => v.id === $currentView()) || views[2];
  });

  // Close dropdown when clicking outside
  onMount(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownOpen() &&
        dropdownRef &&
        !dropdownRef.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    onCleanup(() => {
      document.removeEventListener("click", handleClickOutside);
    });
  });

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

      {/* Center section - View switcher dropdown */}
      <div
        ref={dropdownRef}
        style={{ "-webkit-app-region": "no-drag" }}
        class={css({
          position: "relative",
        })}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen());
          }}
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingTop: "6px",
            paddingBottom: "6px",
            paddingLeft: "12px",
            paddingRight: "12px",
            borderRadius: "8px",
            border: "1px solid",
            borderColor: "border",
            backgroundColor: "transparent",
            color: "foreground",
            fontSize: "13px",
            fontWeight: "500",
            height: "32px",
            cursor: "pointer",
            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            whiteSpace: "nowrap",
            _hover: {
              backgroundColor: "hover",
              borderColor: "mutedHover",
            },
            _active: {
              transform: "scale(0.97)",
            },
            "@media (max-width: 768px)": {
              paddingLeft: "10px",
              paddingRight: "10px",
              fontSize: "12px",
              height: "28px",
            },
          })}
        >
          <Show when={currentViewData()}>
            {(data) => {
              const Icon = data().icon;
              return (
                <>
                  <Icon size={14} />
                  <span>{data().label}</span>
                  <ChevronDown size={14} />
                </>
              );
            }}
          </Show>
        </button>

        {/* Dropdown menu */}
        <Show when={dropdownOpen()}>
          <div
            class={css({
              position: "absolute",
              top: "calc(100% + 4px)",
              left: "0",
              backgroundColor: "sidebar",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: "border",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
              zIndex: 1000,
              minWidth: "160px",
              animation: "fadeIn 150ms ease-out",
            })}
            onClick={(e) => e.stopPropagation()}
          >
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  class={css({
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    paddingTop: "10px",
                    paddingBottom: "10px",
                    paddingLeft: "14px",
                    paddingRight: "14px",
                    border: "none",
                    backgroundColor:
                      $currentView() === view.id ? "muted" : "transparent",
                    color:
                      $currentView() === view.id ? "primary" : "foreground",
                    fontSize: "13px",
                    fontWeight: $currentView() === view.id ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 150ms",
                    textAlign: "left",
                    _hover: {
                      backgroundColor: "hover",
                    },
                  })}
                  onClick={() => {
                    setView(view.id);
                    setDropdownOpen(false);
                  }}
                >
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{view.label}</span>
                  <span
                    class={css({
                      fontSize: "11px",
                      color: "mutedHover",
                      fontWeight: "600",
                    })}
                  >
                    {view.shortcut}
                  </span>
                </button>
              );
            })}
          </div>
        </Show>
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
