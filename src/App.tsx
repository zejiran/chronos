import { onMount, onCleanup, Show } from "solid-js";
import { css } from "../styled-system/css";
import { Header } from "./components/Layout/Header";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { CalendarLayout } from "./components/Calendar/CalendarLayout";
import { EventModal } from "./components/Events/EventModal";
import { CommandPalette } from "./components/CommandPalette/CommandPalette";
import { SettingsModal } from "./components/Settings/SettingsModal";
import { AccountModal } from "./components/Accounts/AccountModal";
import {
  settings,
  calendars,
  accounts,
  addCalendar,
  addAccount,
  commandPaletteOpen,
  eventModalOpen,
  settingsModalOpen,
  goToToday,
  goToPrevious,
  goToNext,
  setView,
  toggleSidebar,
} from "./stores";
import { getSettings, getCalendars, getAccounts } from "./lib/tauri";
import { listen } from "@tauri-apps/api/event";
import { initTheme, useThemeHotReload } from "./lib/theme";
import type { Settings } from "./types";

function App() {
  // Enable theme hot reload from config changes
  useThemeHotReload();

  onMount(async () => {
    // Initialize theme system
    initTheme();

    // Load initial data
    try {
      const [loadedSettings, loadedCalendars, loadedAccounts] =
        await Promise.all([getSettings(), getCalendars(), getAccounts()]);

      settings.set(loadedSettings);

      loadedCalendars.forEach((cal) => {
        addCalendar(cal);
      });

      loadedAccounts.forEach((acc) => {
        addAccount(acc);
      });

      // Apply theme
      applyTheme(loadedSettings);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      // Add default local calendar if loading fails
      addCalendar({
        id: "local",
        accountId: "local",
        name: "Local Calendar",
        color: "#6366f1",
        isVisible: true,
        isPrimary: true,
        isReadonly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Listen for settings changes from Rust
    const unlisten = await listen<Settings>("settings-changed", (event) => {
      settings.set(event.payload);
      applyTheme(event.payload);
    });

    onCleanup(() => {
      unlisten();
    });

    // Set up keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Global shortcuts (work even in inputs with Cmd/Ctrl)
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "k":
            e.preventDefault();
            commandPaletteOpen.set(true);
            break;
          case "n":
            e.preventDefault();
            eventModalOpen.set(true);
            break;
          case "t":
            e.preventDefault();
            goToToday();
            break;
          case ",":
            e.preventDefault();
            settingsModalOpen.set(true);
            break;
          case "b":
            e.preventDefault();
            toggleSidebar();
            break;
          case "arrowleft":
            e.preventDefault();
            goToPrevious();
            break;
          case "arrowright":
            e.preventDefault();
            goToNext();
            break;
        }
        return;
      }

      // Non-input shortcuts
      if (!isInput) {
        switch (e.key.toLowerCase()) {
          case "d":
            setView("day");
            break;
          case "w":
            setView("week");
            break;
          case "m":
            setView("month");
            break;
          case "y":
            setView("year");
            break;
          case "a":
            setView("agenda");
            break;
          case "/":
            e.preventDefault();
            commandPaletteOpen.set(true);
            break;
          case "escape":
            commandPaletteOpen.set(false);
            eventModalOpen.set(false);
            settingsModalOpen.set(false);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      window.removeEventListener("keydown", handleKeyDown);
    });
  });

  return (
    <div
      class={css({
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "background",
        color: "foreground",
      })}
    >
      <Header />
      <div
        class={css({
          display: "flex",
          flex: 1,
          overflow: "hidden",
        })}
      >
        <Sidebar />
        <CalendarLayout />
      </div>

      {/* Modals */}
      <EventModal />
      <CommandPalette />
      <SettingsModal />
      <AccountModal />
    </div>
  );
}

function applyTheme(settings: Settings) {
  const root = document.documentElement;

  if (settings.theme.mode === "custom") {
    const colors = settings.theme.custom.colors;
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === "string") {
        root.style.setProperty(`--colors-${camelToKebab(key)}`, value);
      } else if (typeof value === "object") {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(
            `--colors-${camelToKebab(key)}-${camelToKebab(subKey)}`,
            subValue as string,
          );
        });
      }
    });
  } else {
    // Apply built-in theme
    root.setAttribute("data-theme", settings.theme.activeTheme);
    root.setAttribute(
      "data-mode",
      settings.theme.mode === "auto"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : settings.theme.mode,
    );
  }

  // Apply appearance settings
  root.style.setProperty(
    "--font-size-base",
    `${settings.appearance.fontSize}px`,
  );
  root.setAttribute("data-density", settings.appearance.density);

  if (settings.appearance.highContrast) {
    root.setAttribute("data-contrast", "high");
  } else {
    root.removeAttribute("data-contrast");
  }

  if (settings.appearance.reduceMotion) {
    root.style.setProperty("--animation-duration", "0ms");
  }
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export default App;
