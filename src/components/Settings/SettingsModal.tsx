import { createSignal, createEffect, For, Show } from "solid-js";
import { css } from "../../../styled-system/css";
import { useStore } from "@nanostores/solid";
import { Button } from "../shared/Button";
import { ThemeSelector } from "./ThemeSelector";
import {
  settingsModalOpen,
  settings as settingsStore,
  accounts,
  calendars,
} from "../../stores";
import { updateSettings, getConfigPath } from "../../lib/tauri";
import type { Settings, CalendarView } from "../../types";

type SettingsTab =
  | "general"
  | "appearance"
  | "calendars"
  | "accounts"
  | "notifications"
  | "shortcuts"
  | "advanced";

export function SettingsModal() {
  const $isOpen = useStore(settingsModalOpen);
  const $settings = useStore(settingsStore);
  const $accounts = useStore(accounts);
  const $calendars = useStore(calendars);

  const [activeTab, setActiveTab] = createSignal<SettingsTab>("general");
  const [isSaving, setIsSaving] = createSignal(false);
  const [configPath, setConfigPath] = createSignal<string>("");

  // Load config path
  createEffect(async () => {
    if ($isOpen()) {
      try {
        const path = await getConfigPath();
        setConfigPath(path);
      } catch {
        // Ignore
      }
    }
  });

  const handleClose = () => {
    settingsModalOpen.set(false);
  };

  const handleSave = async () => {
    const currentSettings = $settings();
    if (!currentSettings) return;

    setIsSaving(true);
    try {
      await updateSettings(currentSettings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    const current = $settings();
    if (current) {
      settingsStore.set({ ...current, [key]: value });
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: "general", label: "General", icon: "⚙" },
    { id: "appearance", label: "Appearance", icon: "🎨" },
    { id: "calendars", label: "Calendars", icon: "📅" },
    { id: "accounts", label: "Accounts", icon: "👤" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "shortcuts", label: "Shortcuts", icon: "⌨" },
    { id: "advanced", label: "Advanced", icon: "🔧" },
  ];

  return (
    <Show when={$isOpen()}>
      <div
        class={css({
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        })}
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <div
          class={css({
            width: "100%",
            maxWidth: "56rem",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--colors-background)",
            borderRadius: "0.75rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid var(--colors-border)",
            overflow: "hidden",
          })}
        >
          {/* Header */}
          <div
            class={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem 1.5rem",
              borderBottom: "1px solid var(--colors-border)",
            })}
          >
            <h2
              class={css({
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "var(--colors-foreground)",
              })}
            >
              Settings
            </h2>
            <button
              type="button"
              onClick={handleClose}
              class={css({
                padding: "0.5rem",
                borderRadius: "0.375rem",
                backgroundColor: "transparent",
                border: "none",
                color: "var(--colors-foreground)",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "var(--colors-muted)",
                },
              })}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div class={css({ display: "flex", flex: 1, overflow: "hidden" })}>
            {/* Sidebar */}
            <nav
              class={css({
                width: "12rem",
                borderRight: "1px solid var(--colors-border)",
                padding: "0.5rem",
                overflowY: "auto",
              })}
            >
              <For each={tabs}>
                {(tab) => (
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    class={css({
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      backgroundColor:
                        activeTab() === tab.id
                          ? "var(--colors-muted)"
                          : "transparent",
                      color: "var(--colors-foreground)",
                      fontSize: "0.875rem",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background-color 0.1s ease",
                      "&:hover": {
                        backgroundColor: "var(--colors-muted)",
                      },
                    })}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                )}
              </For>
            </nav>

            {/* Main content */}
            <div
              class={css({
                flex: 1,
                padding: "1.5rem",
                overflowY: "auto",
              })}
            >
              <Show when={activeTab() === "general"}>
                <GeneralSettings
                  settings={$settings()}
                  onUpdate={updateSetting}
                />
              </Show>

              <Show when={activeTab() === "appearance"}>
                <AppearanceSettings
                  settings={$settings()}
                  onUpdate={updateSetting}
                />
              </Show>

              <Show when={activeTab() === "calendars"}>
                <CalendarsSettings calendars={Object.values($calendars())} />
              </Show>

              <Show when={activeTab() === "accounts"}>
                <AccountsSettings accounts={Object.values($accounts())} />
              </Show>

              <Show when={activeTab() === "notifications"}>
                <NotificationSettings
                  settings={$settings()}
                  onUpdate={updateSetting}
                />
              </Show>

              <Show when={activeTab() === "shortcuts"}>
                <ShortcutsSettings
                  settings={$settings()}
                  onUpdate={updateSetting}
                />
              </Show>

              <Show when={activeTab() === "advanced"}>
                <AdvancedSettings
                  settings={$settings()}
                  configPath={configPath()}
                  onUpdate={updateSetting}
                />
              </Show>
            </div>
          </div>

          {/* Footer */}
          <div
            class={css({
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--colors-border)",
            })}
          >
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving()}
            >
              {isSaving() ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
}

// Section Components

function SectionTitle(props: { children: string }) {
  return (
    <h3
      class={css({
        fontSize: "1rem",
        fontWeight: "600",
        color: "var(--colors-foreground)",
        marginBottom: "1rem",
      })}
    >
      {props.children}
    </h3>
  );
}

function SettingRow(props: {
  label: string;
  description?: string;
  children: any;
}) {
  return (
    <div
      class={css({
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "2rem",
        paddingY: "0.75rem",
        borderBottom: "1px solid var(--colors-border)",
      })}
    >
      <div>
        <div
          class={css({
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "var(--colors-foreground)",
          })}
        >
          {props.label}
        </div>
        <Show when={props.description}>
          <div
            class={css({
              fontSize: "0.75rem",
              color: "var(--colors-foreground)",
              opacity: 0.6,
              marginTop: "0.25rem",
            })}
          >
            {props.description}
          </div>
        </Show>
      </div>
      <div class={css({ flexShrink: 0 })}>{props.children}</div>
    </div>
  );
}

function Toggle(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      onClick={() => props.onChange(!props.checked)}
      class={css({
        width: "2.5rem",
        height: "1.5rem",
        borderRadius: "0.75rem",
        backgroundColor: props.checked
          ? "var(--colors-primary)"
          : "var(--colors-muted)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background-color 0.15s ease",
      })}
    >
      <span
        class={css({
          position: "absolute",
          top: "0.125rem",
          width: "1.25rem",
          height: "1.25rem",
          borderRadius: "50%",
          backgroundColor: "white",
          transition: "left 0.15s ease",
        })}
        style={{ left: props.checked ? "1.125rem" : "0.125rem" }}
      />
    </button>
  );
}

function Select(props: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={props.value}
      onChange={(e) => props.onChange(e.currentTarget.value)}
      class={css({
        padding: "0.375rem 0.75rem",
        borderRadius: "0.375rem",
        border: "1px solid var(--colors-border)",
        backgroundColor: "var(--colors-background)",
        color: "var(--colors-foreground)",
        fontSize: "0.875rem",
        cursor: "pointer",
        outline: "none",
        "&:focus": {
          borderColor: "var(--colors-primary)",
        },
      })}
    >
      <For each={props.options}>
        {(opt) => <option value={opt.value}>{opt.label}</option>}
      </For>
    </select>
  );
}

// Tab Content Components

function GeneralSettings(props: { settings: Settings | null; onUpdate: any }) {
  const settings = () => props.settings;

  return (
    <div>
      <SectionTitle>Calendar</SectionTitle>

      <SettingRow
        label="Start of week"
        description="First day of the week in calendar views"
      >
        <Select
          value={settings()?.calendar.startOfWeek || "sunday"}
          options={[
            { value: "sunday", label: "Sunday" },
            { value: "monday", label: "Monday" },
            { value: "saturday", label: "Saturday" },
          ]}
          onChange={(v) =>
            props.onUpdate("calendar", {
              ...settings()?.calendar,
              startOfWeek: v,
            })
          }
        />
      </SettingRow>

      <SettingRow label="Default view" description="View shown when app opens">
        <Select
          value={settings()?.calendar.defaultView || "week"}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
            { value: "year", label: "Year" },
            { value: "agenda", label: "Agenda" },
          ]}
          onChange={(v) =>
            props.onUpdate("calendar", {
              ...settings()?.calendar,
              defaultView: v as CalendarView,
            })
          }
        />
      </SettingRow>

      <SettingRow label="Time format" description="12-hour or 24-hour clock">
        <Select
          value={settings()?.calendar.timeFormat || "12h"}
          options={[
            { value: "12h", label: "12-hour" },
            { value: "24h", label: "24-hour" },
          ]}
          onChange={(v) =>
            props.onUpdate("calendar", {
              ...settings()?.calendar,
              timeFormat: v,
            })
          }
        />
      </SettingRow>

      <SettingRow
        label="Show week numbers"
        description="Display week numbers in calendar views"
      >
        <Toggle
          checked={settings()?.calendar.showWeekNumbers || false}
          onChange={(v) =>
            props.onUpdate("calendar", {
              ...settings()?.calendar,
              showWeekNumbers: v,
            })
          }
        />
      </SettingRow>

      <SettingRow
        label="Show declined events"
        description="Display events you've declined"
      >
        <Toggle
          checked={settings()?.calendar.showDeclinedEvents || false}
          onChange={(v) =>
            props.onUpdate("calendar", {
              ...settings()?.calendar,
              showDeclinedEvents: v,
            })
          }
        />
      </SettingRow>

      <SettingRow
        label="Default event duration"
        description="Duration for new events in minutes"
      >
        <Select
          value={String(settings()?.calendar.defaultEventDuration || 60)}
          options={[
            { value: "15", label: "15 min" },
            { value: "30", label: "30 min" },
            { value: "45", label: "45 min" },
            { value: "60", label: "1 hour" },
            { value: "90", label: "1.5 hours" },
            { value: "120", label: "2 hours" },
          ]}
          onChange={(v) =>
            props.onUpdate("calendar", {
              ...settings()?.calendar,
              defaultEventDuration: parseInt(v),
            })
          }
        />
      </SettingRow>

      <div class={css({ marginTop: "2rem" })}>
        <SectionTitle>Sync</SectionTitle>

        <SettingRow
          label="Auto sync"
          description="Automatically sync calendars in background"
        >
          <Toggle
            checked={settings()?.sync.autoSync || false}
            onChange={(v) =>
              props.onUpdate("sync", { ...settings()?.sync, autoSync: v })
            }
          />
        </SettingRow>

        <SettingRow
          label="Sync interval"
          description="How often to sync calendars"
        >
          <Select
            value={String(settings()?.sync.syncInterval || 15)}
            options={[
              { value: "5", label: "5 minutes" },
              { value: "15", label: "15 minutes" },
              { value: "30", label: "30 minutes" },
              { value: "60", label: "1 hour" },
            ]}
            onChange={(v) =>
              props.onUpdate("sync", {
                ...settings()?.sync,
                syncInterval: parseInt(v),
              })
            }
          />
        </SettingRow>

        <SettingRow
          label="Conflict resolution"
          description="How to handle sync conflicts"
        >
          <Select
            value={settings()?.sync.conflictResolution || "most_recent"}
            options={[
              { value: "remote_wins", label: "Remote wins" },
              { value: "local_wins", label: "Local wins" },
              { value: "most_recent", label: "Most recent" },
              { value: "ask", label: "Ask me" },
            ]}
            onChange={(v) =>
              props.onUpdate("sync", {
                ...settings()?.sync,
                conflictResolution: v,
              })
            }
          />
        </SettingRow>
      </div>
    </div>
  );
}

function AppearanceSettings(props: {
  settings: Settings | null;
  onUpdate: any;
}) {
  return (
    <div>
      <SectionTitle>Theme</SectionTitle>
      <ThemeSelector />

      <div class={css({ marginTop: "2rem" })}>
        <SectionTitle>Display</SectionTitle>

        <SettingRow label="Font size" description="Base font size for the app">
          <Select
            value={String(props.settings?.appearance.fontSize || 14)}
            options={[
              { value: "12", label: "Small" },
              { value: "14", label: "Medium" },
              { value: "16", label: "Large" },
              { value: "18", label: "Extra large" },
            ]}
            onChange={(v) =>
              props.onUpdate("appearance", {
                ...props.settings?.appearance,
                fontSize: parseInt(v),
              })
            }
          />
        </SettingRow>

        <SettingRow label="UI density" description="Spacing between elements">
          <Select
            value={props.settings?.appearance.density || "comfortable"}
            options={[
              { value: "compact", label: "Compact" },
              { value: "comfortable", label: "Comfortable" },
              { value: "spacious", label: "Spacious" },
            ]}
            onChange={(v) =>
              props.onUpdate("appearance", {
                ...props.settings?.appearance,
                density: v,
              })
            }
          />
        </SettingRow>
      </div>
    </div>
  );
}

function CalendarsSettings(props: { calendars: any[] }) {
  return (
    <div>
      <SectionTitle>Your Calendars</SectionTitle>

      <Show
        when={props.calendars.length > 0}
        fallback={
          <div
            class={css({
              textAlign: "center",
              padding: "2rem",
              color: "var(--colors-foreground)",
              opacity: 0.6,
            })}
          >
            No calendars configured. Add an account to get started.
          </div>
        }
      >
        <div
          class={css({
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          })}
        >
          <For each={props.calendars}>
            {(calendar) => (
              <div
                class={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "var(--colors-muted)",
                })}
              >
                <div
                  style={{ "background-color": calendar.color }}
                  class={css({
                    width: "1rem",
                    height: "1rem",
                    borderRadius: "0.25rem",
                  })}
                />
                <div class={css({ flex: 1 })}>
                  <div
                    class={css({
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "var(--colors-foreground)",
                    })}
                  >
                    {calendar.name}
                  </div>
                  <div
                    class={css({
                      fontSize: "0.75rem",
                      color: "var(--colors-foreground)",
                      opacity: 0.6,
                    })}
                  >
                    {calendar.isPrimary ? "Primary" : "Secondary"}
                  </div>
                </div>
                <Toggle checked={calendar.isVisible} onChange={() => {}} />
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

function AccountsSettings(props: { accounts: any[] }) {
  return (
    <div>
      <SectionTitle>Connected Accounts</SectionTitle>

      <Show
        when={props.accounts.length > 0}
        fallback={
          <div
            class={css({
              textAlign: "center",
              padding: "2rem",
              color: "var(--colors-foreground)",
              opacity: 0.6,
            })}
          >
            No accounts connected yet.
          </div>
        }
      >
        <div
          class={css({
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          })}
        >
          <For each={props.accounts}>
            {(account) => (
              <div
                class={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "var(--colors-muted)",
                })}
              >
                <div
                  class={css({
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--colors-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "600",
                  })}
                >
                  {account.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div class={css({ flex: 1 })}>
                  <div
                    class={css({
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "var(--colors-foreground)",
                    })}
                  >
                    {account.email}
                  </div>
                  <div
                    class={css({
                      fontSize: "0.75rem",
                      color: "var(--colors-foreground)",
                      opacity: 0.6,
                    })}
                  >
                    {account.provider.charAt(0).toUpperCase() +
                      account.provider.slice(1)}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Remove
                </Button>
              </div>
            )}
          </For>
        </div>
      </Show>

      <div class={css({ marginTop: "1.5rem" })}>
        <Button variant="secondary">Add Account</Button>
      </div>
    </div>
  );
}

function NotificationSettings(props: {
  settings: Settings | null;
  onUpdate: any;
}) {
  const settings = () => props.settings;

  return (
    <div>
      <SectionTitle>Notifications</SectionTitle>

      <SettingRow
        label="Enable notifications"
        description="Show desktop notifications for events"
      >
        <Toggle
          checked={settings()?.notifications.enabled || false}
          onChange={(v) =>
            props.onUpdate("notifications", {
              ...settings()?.notifications,
              enabled: v,
            })
          }
        />
      </SettingRow>

      <SettingRow label="Sound" description="Play sound with notifications">
        <Toggle
          checked={settings()?.notifications.soundEnabled || false}
          onChange={(v) =>
            props.onUpdate("notifications", {
              ...settings()?.notifications,
              soundEnabled: v,
            })
          }
        />
      </SettingRow>

      <SettingRow
        label="Show event details"
        description="Include event details in notification"
      >
        <Toggle
          checked={settings()?.notifications.showEventDetails || true}
          onChange={(v) =>
            props.onUpdate("notifications", {
              ...settings()?.notifications,
              showEventDetails: v,
            })
          }
        />
      </SettingRow>

      <div class={css({ marginTop: "2rem" })}>
        <SectionTitle>Silent Hours</SectionTitle>

        <SettingRow
          label="Enable silent hours"
          description="Mute notifications during specified times"
        >
          <Toggle
            checked={settings()?.notifications.silentHours.enabled || false}
            onChange={(v) =>
              props.onUpdate("notifications", {
                ...settings()?.notifications,
                silentHours: {
                  ...settings()?.notifications.silentHours,
                  enabled: v,
                },
              })
            }
          />
        </SettingRow>
      </div>
    </div>
  );
}

function ShortcutsSettings(_props: {
  settings: Settings | null;
  onUpdate: any;
}) {
  void _props;
  const shortcuts = [
    { key: "newEvent", label: "New event", default: "Cmd+N" },
    { key: "search", label: "Search / Command palette", default: "Cmd+K" },
    { key: "today", label: "Go to today", default: "Cmd+T" },
    { key: "settings", label: "Open settings", default: "Cmd+," },
    { key: "dayView", label: "Day view", default: "D" },
    { key: "weekView", label: "Week view", default: "W" },
    { key: "monthView", label: "Month view", default: "M" },
    { key: "yearView", label: "Year view", default: "Y" },
    { key: "agendaView", label: "Agenda view", default: "A" },
    { key: "toggleSidebar", label: "Toggle sidebar", default: "Cmd+B" },
    { key: "previousPeriod", label: "Previous period", default: "Cmd+Left" },
    { key: "nextPeriod", label: "Next period", default: "Cmd+Right" },
  ];

  return (
    <div>
      <SectionTitle>Keyboard Shortcuts</SectionTitle>

      <div
        class={css({ display: "flex", flexDirection: "column", gap: "0.5rem" })}
      >
        <For each={shortcuts}>
          {(shortcut) => (
            <div
              class={css({
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.625rem 0.75rem",
                borderRadius: "0.375rem",
                backgroundColor: "var(--colors-muted)",
              })}
            >
              <span
                class={css({
                  fontSize: "0.875rem",
                  color: "var(--colors-foreground)",
                })}
              >
                {shortcut.label}
              </span>
              <kbd
                class={css({
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "var(--colors-background)",
                  border: "1px solid var(--colors-border)",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "var(--colors-foreground)",
                })}
              >
                {shortcut.default}
              </kbd>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function AdvancedSettings(props: {
  settings: Settings | null;
  configPath: string;
  onUpdate: any;
}) {
  const settings = () => props.settings;

  return (
    <div>
      <SectionTitle>Developer</SectionTitle>

      <SettingRow
        label="Developer mode"
        description="Enable advanced debugging features"
      >
        <Toggle
          checked={settings()?.advanced.developerMode || false}
          onChange={(v) =>
            props.onUpdate("advanced", {
              ...settings()?.advanced,
              developerMode: v,
            })
          }
        />
      </SettingRow>

      <SettingRow label="Log level" description="Verbosity of application logs">
        <Select
          value={settings()?.advanced.logLevel || "info"}
          options={[
            { value: "error", label: "Error" },
            { value: "warn", label: "Warning" },
            { value: "info", label: "Info" },
            { value: "debug", label: "Debug" },
            { value: "trace", label: "Trace" },
          ]}
          onChange={(v) =>
            props.onUpdate("advanced", { ...settings()?.advanced, logLevel: v })
          }
        />
      </SettingRow>

      <div class={css({ marginTop: "2rem" })}>
        <SectionTitle>Privacy</SectionTitle>

        <SettingRow
          label="Analytics"
          description="Help improve Chronos by sending anonymous usage data"
        >
          <Toggle
            checked={settings()?.privacy.analyticsEnabled || false}
            onChange={(v) =>
              props.onUpdate("privacy", {
                ...settings()?.privacy,
                analyticsEnabled: v,
              })
            }
          />
        </SettingRow>

        <SettingRow
          label="Crash reports"
          description="Automatically send crash reports"
        >
          <Toggle
            checked={settings()?.privacy.crashReportsEnabled || false}
            onChange={(v) =>
              props.onUpdate("privacy", {
                ...settings()?.privacy,
                crashReportsEnabled: v,
              })
            }
          />
        </SettingRow>
      </div>

      <div class={css({ marginTop: "2rem" })}>
        <SectionTitle>Storage</SectionTitle>

        <Show when={props.configPath}>
          <div
            class={css({
              padding: "0.75rem",
              borderRadius: "0.375rem",
              backgroundColor: "var(--colors-muted)",
              fontSize: "0.75rem",
              fontFamily: "monospace",
              color: "var(--colors-foreground)",
              wordBreak: "break-all",
            })}
          >
            Config: {props.configPath}
          </div>
        </Show>

        <div class={css({ marginTop: "1rem", display: "flex", gap: "0.5rem" })}>
          <Button variant="secondary" size="sm">
            Export Data
          </Button>
          <Button variant="secondary" size="sm">
            Import Data
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class={css({ color: "var(--colors-error)" })}
          >
            Clear Cache
          </Button>
        </div>
      </div>

      <div class={css({ marginTop: "2rem" })}>
        <SectionTitle>About</SectionTitle>
        <div
          class={css({
            fontSize: "0.875rem",
            color: "var(--colors-foreground)",
            opacity: 0.6,
          })}
        >
          <p>Chronos Calendar v{settings()?.version || "1.0.0"}</p>
          <p class={css({ marginTop: "0.5rem" })}>
            A modern, cross-platform calendar application.
          </p>
        </div>
      </div>
    </div>
  );
}
