import { createSignal, createEffect, For, Show, JSX } from "solid-js";
import { css } from "../../../styled-system/css";
import { useStore } from "@nanostores/solid";
import { ArrowRight, Calendar, Eye, Zap, Settings } from "lucide-solid";
import {
  commandPaletteOpen,
  eventModalOpen,
  settingsModalOpen,
  events,
  goToToday,
  goToPrevious,
  goToNext,
  setView,
  setSelectedEvent,
} from "../../stores";
import type { CalendarEvent } from "../../types";
import { Temporal } from "@js-temporal/polyfill";

interface Command {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  category: "navigation" | "event" | "view" | "action" | "settings";
  keywords?: string[];
  action: () => void;
}

// Simple fuzzy search implementation
function fuzzyMatch(
  text: string,
  pattern: string,
): { match: boolean; score: number } {
  const textLower = text.toLowerCase();
  const patternLower = pattern.toLowerCase();

  if (!pattern) return { match: true, score: 0 };
  if (textLower === patternLower) return { match: true, score: 100 };
  if (textLower.includes(patternLower)) return { match: true, score: 80 };
  if (textLower.startsWith(patternLower)) return { match: true, score: 90 };

  // Character-by-character fuzzy match
  let patternIdx = 0;
  let score = 0;
  let consecutiveMatches = 0;

  for (
    let i = 0;
    i < textLower.length && patternIdx < patternLower.length;
    i++
  ) {
    if (textLower[i] === patternLower[patternIdx]) {
      patternIdx++;
      consecutiveMatches++;
      score += consecutiveMatches * 2;
    } else {
      consecutiveMatches = 0;
    }
  }

  return {
    match: patternIdx === patternLower.length,
    score: patternIdx === patternLower.length ? score : 0,
  };
}

export function CommandPalette() {
  const $isOpen = useStore(commandPaletteOpen);
  const $events = useStore(events);

  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  let inputRef: HTMLInputElement | undefined;

  // Generate base commands
  const getBaseCommands = (): Command[] => [
    // Navigation
    {
      id: "nav-today",
      title: "Go to Today",
      description: "Navigate to current date",
      category: "navigation",
      keywords: ["today", "now", "current"],
      action: () => {
        goToToday();
        commandPaletteOpen.set(false);
      },
    },
    {
      id: "nav-prev",
      title: "Previous Period",
      description: "Go to previous day/week/month",
      category: "navigation",
      keywords: ["back", "previous", "earlier"],
      action: () => {
        goToPrevious();
        commandPaletteOpen.set(false);
      },
    },
    {
      id: "nav-next",
      title: "Next Period",
      description: "Go to next day/week/month",
      category: "navigation",
      keywords: ["forward", "next", "later"],
      action: () => {
        goToNext();
        commandPaletteOpen.set(false);
      },
    },

    // Views
    {
      id: "view-day",
      title: "Day View",
      description: "Switch to day view",
      category: "view",
      keywords: ["day", "daily", "single"],
      action: () => {
        setView("day");
        commandPaletteOpen.set(false);
      },
    },
    {
      id: "view-week",
      title: "Week View",
      description: "Switch to week view",
      category: "view",
      keywords: ["week", "weekly", "7 days"],
      action: () => {
        setView("week");
        commandPaletteOpen.set(false);
      },
    },
    {
      id: "view-month",
      title: "Month View",
      description: "Switch to month view",
      category: "view",
      keywords: ["month", "monthly", "calendar"],
      action: () => {
        setView("month");
        commandPaletteOpen.set(false);
      },
    },
    {
      id: "view-year",
      title: "Year View",
      description: "Switch to year view",
      category: "view",
      keywords: ["year", "yearly", "annual"],
      action: () => {
        setView("year");
        commandPaletteOpen.set(false);
      },
    },
    {
      id: "view-agenda",
      title: "Agenda View",
      description: "Switch to agenda/list view",
      category: "view",
      keywords: ["agenda", "list", "schedule"],
      action: () => {
        setView("agenda");
        commandPaletteOpen.set(false);
      },
    },

    // Actions
    {
      id: "action-new-event",
      title: "New Event",
      description: "Create a new calendar event",
      category: "action",
      keywords: ["create", "add", "new", "event", "appointment"],
      action: () => {
        commandPaletteOpen.set(false);
        eventModalOpen.set(true);
      },
    },
    {
      id: "action-settings",
      title: "Open Settings",
      description: "Configure app preferences",
      category: "settings",
      keywords: ["settings", "preferences", "options", "configure"],
      action: () => {
        commandPaletteOpen.set(false);
        settingsModalOpen.set(true);
      },
    },
  ];

  // Generate event commands from stored events
  const getEventCommands = (): Command[] => {
    const eventList = Object.values($events());
    return eventList.slice(0, 20).map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      description: formatEventTime(event),
      category: "event" as const,
      keywords: [
        event.title,
        event.location || "",
        event.description || "",
      ].filter(Boolean),
      action: () => {
        setSelectedEvent(event);
        commandPaletteOpen.set(false);
        eventModalOpen.set(true);
      },
    }));
  };

  // Filter and sort commands based on query
  const getFilteredCommands = () => {
    const allCommands = [...getBaseCommands(), ...getEventCommands()];
    const q = query().trim();

    if (!q) {
      return allCommands.slice(0, 10);
    }

    const results = allCommands
      .map((cmd) => {
        const titleMatch = fuzzyMatch(cmd.title, q);
        const descMatch = cmd.description
          ? fuzzyMatch(cmd.description, q)
          : { match: false, score: 0 };
        const keywordMatches = (cmd.keywords || []).map((k) =>
          fuzzyMatch(k, q),
        );
        const bestKeywordScore = Math.max(
          0,
          ...keywordMatches.map((m) => m.score),
        );

        const score = Math.max(
          titleMatch.score * 1.5,
          descMatch.score,
          bestKeywordScore,
        );
        const match =
          titleMatch.match ||
          descMatch.match ||
          keywordMatches.some((m) => m.match);

        return { cmd, score, match };
      })
      .filter((r) => r.match)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.cmd)
      .slice(0, 10);

    return results;
  };

  const filteredCommands = () => getFilteredCommands();

  // Reset selection when query changes
  createEffect(() => {
    query();
    setSelectedIndex(0);
  });

  // Focus input when opened
  createEffect(() => {
    if ($isOpen()) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef?.focus(), 0);
    }
  });

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    const commands = filteredCommands();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, commands.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        const selected = commands[selectedIndex()];
        if (selected) {
          selected.action();
        }
        break;
      case "Escape":
        e.preventDefault();
        commandPaletteOpen.set(false);
        break;
    }
  };

  const categoryLabels: Record<Command["category"], string> = {
    navigation: "Navigation",
    event: "Events",
    view: "Views",
    action: "Actions",
    settings: "Settings",
  };

  const categoryIcons: Record<Command["category"], () => JSX.Element> = {
    navigation: () => <ArrowRight size={14} />,
    event: () => <Calendar size={14} />,
    view: () => <Eye size={14} />,
    action: () => <Zap size={14} />,
    settings: () => <Settings size={14} />,
  };

  return (
    <Show when={$isOpen()}>
      <div
        class={css({
          position: "fixed",
          inset: 0,
          zIndex: 1100,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "15vh",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        })}
        onClick={(e) =>
          e.target === e.currentTarget && commandPaletteOpen.set(false)
        }
      >
        <div
          class={css({
            width: "100%",
            maxWidth: "36rem",
            backgroundColor: "var(--colors-background)",
            borderRadius: "0.75rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid var(--colors-border)",
            overflow: "hidden",
          })}
        >
          {/* Search Input */}
          <div
            class={css({
              display: "flex",
              alignItems: "center",
              padding: "0.75rem 1rem",
              borderBottom: "1px solid var(--colors-border)",
            })}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              class={css({
                color: "var(--colors-foreground)",
                opacity: 0.5,
                marginRight: "0.75rem",
              })}
            >
              <path
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                fill="currentColor"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commands, events..."
              class={css({
                flex: 1,
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                color: "var(--colors-foreground)",
                fontSize: "1rem",
                "&::placeholder": {
                  color: "var(--colors-foreground)",
                  opacity: 0.5,
                },
              })}
            />
            <kbd
              class={css({
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                backgroundColor: "var(--colors-muted)",
                color: "var(--colors-foreground)",
                fontSize: "0.75rem",
                fontFamily: "monospace",
              })}
            >
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            class={css({
              maxHeight: "20rem",
              overflowY: "auto",
            })}
          >
            <Show
              when={filteredCommands().length > 0}
              fallback={
                <div
                  class={css({
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--colors-foreground)",
                    opacity: 0.5,
                  })}
                >
                  No results found
                </div>
              }
            >
              <For each={filteredCommands()}>
                {(command, index) => (
                  <button
                    type="button"
                    onClick={() => command.action()}
                    onMouseEnter={() => setSelectedIndex(index())}
                    class={css({
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      backgroundColor:
                        selectedIndex() === index()
                          ? "var(--colors-muted)"
                          : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.1s ease",
                      "&:hover": {
                        backgroundColor: "var(--colors-muted)",
                      },
                    })}
                  >
                    <span
                      class={css({
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "0.375rem",
                        backgroundColor: "var(--colors-muted-hover)",
                        fontSize: "0.875rem",
                      })}
                    >
                      {categoryIcons[command.category]()}
                    </span>
                    <div class={css({ flex: 1, minWidth: 0 })}>
                      <div
                        class={css({
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "var(--colors-foreground)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        })}
                      >
                        {command.title}
                      </div>
                      <Show when={command.description}>
                        <div
                          class={css({
                            fontSize: "0.75rem",
                            color: "var(--colors-foreground)",
                            opacity: 0.6,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          })}
                        >
                          {command.description}
                        </div>
                      </Show>
                    </div>
                    <span
                      class={css({
                        fontSize: "0.625rem",
                        color: "var(--colors-foreground)",
                        opacity: 0.4,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      })}
                    >
                      {categoryLabels[command.category]}
                    </span>
                  </button>
                )}
              </For>
            </Show>
          </div>

          {/* Footer */}
          <div
            class={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5rem 1rem",
              borderTop: "1px solid var(--colors-border)",
              backgroundColor: "var(--colors-muted)",
              fontSize: "0.75rem",
              color: "var(--colors-foreground)",
              opacity: 0.6,
            })}
          >
            <div class={css({ display: "flex", gap: "1rem" })}>
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>esc Close</span>
            </div>
            <span>Cmd+K to open</span>
          </div>
        </div>
      </div>
    </Show>
  );
}

function formatEventTime(event: CalendarEvent): string {
  try {
    const start = Temporal.PlainDateTime.from(event.startTime.replace("Z", ""));
    const date = start.toPlainDate();
    const time = start.toPlainTime();

    const today = Temporal.Now.plainDateISO();
    const tomorrow = today.add({ days: 1 });

    let dateStr: string;
    if (date.equals(today)) {
      dateStr = "Today";
    } else if (date.equals(tomorrow)) {
      dateStr = "Tomorrow";
    } else {
      dateStr = date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    if (event.isAllDay) {
      return `${dateStr} (All day)`;
    }

    const timeStr = time.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dateStr} at ${timeStr}`;
  } catch {
    return "";
  }
}
