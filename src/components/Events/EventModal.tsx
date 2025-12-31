import { createSignal, createEffect, For, Show } from "solid-js";
import { css } from "../../../styled-system/css";
import { Button } from "../shared/Button";
import { Input } from "../shared/Input";
import {
  eventModalOpen,
  selectedEvent,
  calendars,
  setSelectedEvent,
  addEvent,
  updateEvent,
  deleteEvent,
} from "../../stores";
import { useStore } from "@nanostores/solid";
import {
  createEvent,
  updateEvent as updateEventApi,
  deleteEvent as deleteEventApi,
} from "../../lib/tauri";
import type { CalendarEvent, RecurrenceRule } from "../../types";
import { Temporal } from "@js-temporal/polyfill";

const DEFAULT_DURATION_MINUTES = 60;

interface EventFormData {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isAllDay: boolean;
  calendarId: string;
  color: string;
  reminderMinutes: number | null;
  recurrence: RecurrenceRule | null;
  meetingUrl: string;
}

function getDefaultFormData(): EventFormData {
  const now = Temporal.Now.plainDateTimeISO();
  const rounded = now.round({ smallestUnit: "minute", roundingIncrement: 15 });
  const end = rounded.add({ minutes: DEFAULT_DURATION_MINUTES });

  return {
    title: "",
    description: "",
    location: "",
    startDate: rounded.toPlainDate().toString(),
    startTime: rounded.toPlainTime().toString().slice(0, 5),
    endDate: end.toPlainDate().toString(),
    endTime: end.toPlainTime().toString().slice(0, 5),
    isAllDay: false,
    calendarId: "",
    color: "#6366f1",
    reminderMinutes: 15,
    recurrence: null,
    meetingUrl: "",
  };
}

function eventToFormData(event: CalendarEvent): EventFormData {
  const start = Temporal.PlainDateTime.from(event.startTime.replace("Z", ""));
  const end = Temporal.PlainDateTime.from(event.endTime.replace("Z", ""));

  return {
    title: event.title,
    description: event.description || "",
    location: event.location || "",
    startDate: start.toPlainDate().toString(),
    startTime: start.toPlainTime().toString().slice(0, 5),
    endDate: end.toPlainDate().toString(),
    endTime: end.toPlainTime().toString().slice(0, 5),
    isAllDay: event.isAllDay,
    calendarId: event.calendarId,
    color: event.color || "#6366f1",
    reminderMinutes: event.reminderMinutes,
    recurrence: event.recurrence,
    meetingUrl: event.meetingUrl || "",
  };
}

function formDataToEvent(
  data: EventFormData,
  existingEvent?: CalendarEvent,
): Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> {
  const startDateTime = data.isAllDay
    ? `${data.startDate}T00:00:00`
    : `${data.startDate}T${data.startTime}:00`;
  const endDateTime = data.isAllDay
    ? `${data.endDate}T23:59:59`
    : `${data.endDate}T${data.endTime}:00`;

  return {
    calendarId: data.calendarId,
    title: data.title,
    description: data.description || undefined,
    location: data.location || undefined,
    startTime: startDateTime,
    endTime: endDateTime,
    isAllDay: data.isAllDay,
    color: data.color,
    reminderMinutes: data.reminderMinutes,
    recurrence: data.recurrence,
    meetingUrl: data.meetingUrl || undefined,
    status: existingEvent?.status || "confirmed",
    iCalUid: existingEvent?.iCalUid,
    etag: existingEvent?.etag,
    syncStatus: "pending",
  };
}

export function EventModal() {
  const $isOpen = useStore(eventModalOpen);
  const $selectedEvent = useStore(selectedEvent);
  const $calendars = useStore(calendars);

  const [formData, setFormData] =
    createSignal<EventFormData>(getDefaultFormData());
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [, setShowRecurrence] = createSignal(false);
  const [showDelete, setShowDelete] = createSignal(false);

  const isEditing = () => !!$selectedEvent();

  // Reset form when modal opens/closes or selected event changes
  createEffect(() => {
    if ($isOpen()) {
      const event = $selectedEvent();
      if (event) {
        setFormData(eventToFormData(event));
      } else {
        const defaultData = getDefaultFormData();
        // Set default calendar
        const calendarsList = Object.values($calendars());
        const primary =
          calendarsList.find((c) => c.isPrimary) || calendarsList[0];
        if (primary) {
          defaultData.calendarId = primary.id;
          defaultData.color = primary.color;
        }
        setFormData(defaultData);
      }
      setShowRecurrence(false);
      setShowDelete(false);
    }
  });

  const handleClose = () => {
    eventModalOpen.set(false);
    setSelectedEvent(null);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!formData().title.trim() || !formData().calendarId) return;

    setIsSubmitting(true);
    try {
      const eventData = formDataToEvent(
        formData(),
        $selectedEvent() || undefined,
      );

      if (isEditing()) {
        const updated = await updateEventApi($selectedEvent()!.id, {
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          allDay: eventData.isAllDay,
          color: eventData.color,
        });
        updateEvent($selectedEvent()!.id, updated as unknown as CalendarEvent);
      } else {
        const created = await createEvent(eventData as any);
        addEvent(created as unknown as CalendarEvent);
      }
      handleClose();
    } catch (error) {
      console.error("Failed to save event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!$selectedEvent()) return;

    setIsSubmitting(true);
    try {
      await deleteEventApi($selectedEvent()!.id);
      deleteEvent($selectedEvent()!.id);
      handleClose();
    } catch (error) {
      console.error("Failed to delete event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof EventFormData>(
    field: K,
    value: EventFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const reminderOptions = [
    { value: null, label: "No reminder" },
    { value: 0, label: "At time of event" },
    { value: 5, label: "5 minutes before" },
    { value: 15, label: "15 minutes before" },
    { value: 30, label: "30 minutes before" },
    { value: 60, label: "1 hour before" },
    { value: 1440, label: "1 day before" },
  ];

  const recurrenceOptions: {
    value: RecurrenceRule["frequency"] | null;
    label: string;
  }[] = [
    { value: null, label: "Does not repeat" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
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
            maxWidth: "32rem",
            maxHeight: "90vh",
            overflow: "auto",
            backgroundColor: "var(--colors-background)",
            borderRadius: "0.75rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid var(--colors-border)",
          })}
        >
          {/* Header */}
          <div
            class={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "20px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px",
              borderBottom: "1px solid var(--colors-border)",
            })}
          >
            <h2
              class={css({
                fontSize: "18px",
                fontWeight: "600",
                color: "var(--colors-foreground)",
              })}
            >
              {isEditing() ? "Edit Event" : "New Event"}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              class={css({
                paddingTop: "8px", paddingBottom: "8px", paddingLeft: "8px", paddingRight: "8px",
                borderRadius: "6px",
                backgroundColor: "transparent",
                border: "none",
                color: "var(--colors-foreground)",
                cursor: "pointer",
                transition: "all 150ms",
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

          {/* Form */}
          <form onSubmit={handleSubmit} class={css({ paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px" })}>
            <div
              class={css({
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              })}
            >
              {/* Title */}
              <Input
                label="Title"
                value={formData().title}
                onInput={(e) => updateField("title", e.currentTarget.value)}
                placeholder="Add title"
                required
                autofocus
              />

              {/* Calendar Selection */}
              <div>
                <label
                  class={css({
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--colors-foreground)",
                    marginBottom: "8px",
                  })}
                >
                  Calendar
                </label>
                <select
                  value={formData().calendarId}
                  onChange={(e) => {
                    const cal = $calendars()[e.currentTarget.value];
                    updateField("calendarId", e.currentTarget.value);
                    if (cal) updateField("color", cal.color);
                  }}
                  class={css({
                    width: "100%",
                    paddingTop: "8px", paddingBottom: "8px", paddingLeft: "12px", paddingRight: "12px",
                    borderRadius: "6px",
                    border: "1px solid var(--colors-border)",
                    backgroundColor: "var(--colors-background)",
                    color: "var(--colors-foreground)",
                    fontSize: "14px",
                    height: "36px",
                    outline: "none",
                    transition: "all 150ms",
                    "&:focus": {
                      borderColor: "var(--colors-primary)",
                      boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)",
                    },
                  })}
                >
                  <For each={Object.values($calendars())}>
                    {(cal) => <option value={cal.id}>{cal.name}</option>}
                  </For>
                </select>
              </div>

              {/* All Day Toggle */}
              <label
                class={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  paddingTop: "4px",
                  paddingBottom: "4px",
                })}
              >
                <input
                  type="checkbox"
                  checked={formData().isAllDay}
                  onChange={(e) =>
                    updateField("isAllDay", e.currentTarget.checked)
                  }
                  class={css({
                    width: "18px",
                    height: "18px",
                    accentColor: "var(--colors-primary)",
                  })}
                />
                <span
                  class={css({
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--colors-foreground)",
                  })}
                >
                  All day
                </span>
              </label>

              {/* Date & Time */}
              <div
                class={css({
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                })}
              >
                <Input
                  label="Start Date"
                  type="date"
                  value={formData().startDate}
                  onInput={(e) =>
                    updateField("startDate", e.currentTarget.value)
                  }
                  required
                />
                <Show when={!formData().isAllDay}>
                  <Input
                    label="Start Time"
                    type="time"
                    value={formData().startTime}
                    onInput={(e) =>
                      updateField("startTime", e.currentTarget.value)
                    }
                    required
                  />
                </Show>
              </div>

              <div
                class={css({
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                })}
              >
                <Input
                  label="End Date"
                  type="date"
                  value={formData().endDate}
                  onInput={(e) => updateField("endDate", e.currentTarget.value)}
                  required
                />
                <Show when={!formData().isAllDay}>
                  <Input
                    label="End Time"
                    type="time"
                    value={formData().endTime}
                    onInput={(e) =>
                      updateField("endTime", e.currentTarget.value)
                    }
                    required
                  />
                </Show>
              </div>

              {/* Location */}
              <Input
                label="Location"
                value={formData().location}
                onInput={(e) => updateField("location", e.currentTarget.value)}
                placeholder="Add location"
              />

              {/* Meeting URL */}
              <Input
                label="Video Call URL"
                type="url"
                value={formData().meetingUrl}
                onInput={(e) =>
                  updateField("meetingUrl", e.currentTarget.value)
                }
                placeholder="https://zoom.us/j/... or meet.google.com/..."
              />

              {/* Description */}
              <div>
                <label
                  class={css({
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--colors-foreground)",
                    marginBottom: "8px",
                  })}
                >
                  Description
                </label>
                <textarea
                  value={formData().description}
                  onInput={(e) =>
                    updateField("description", e.currentTarget.value)
                  }
                  placeholder="Add description"
                  rows={3}
                  class={css({
                    width: "100%",
                    paddingTop: "10px", paddingBottom: "10px", paddingLeft: "12px", paddingRight: "12px",
                    borderRadius: "6px",
                    border: "1px solid var(--colors-border)",
                    backgroundColor: "var(--colors-background)",
                    color: "var(--colors-foreground)",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    minHeight: "80px",
                    resize: "vertical",
                    outline: "none",
                    transition: "all 150ms",
                    "&:focus": {
                      borderColor: "var(--colors-primary)",
                      boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)",
                    },
                  })}
                />
              </div>

              {/* Reminder */}
              <div>
                <label
                  class={css({
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--colors-foreground)",
                    marginBottom: "8px",
                  })}
                >
                  Reminder
                </label>
                <select
                  value={
                    formData().reminderMinutes === null
                      ? "null"
                      : String(formData().reminderMinutes)
                  }
                  onChange={(e) =>
                    updateField(
                      "reminderMinutes",
                      e.currentTarget.value === "null"
                        ? null
                        : parseInt(e.currentTarget.value),
                    )
                  }
                  class={css({
                    width: "100%",
                    paddingTop: "8px", paddingBottom: "8px", paddingLeft: "12px", paddingRight: "12px",
                    borderRadius: "6px",
                    border: "1px solid var(--colors-border)",
                    backgroundColor: "var(--colors-background)",
                    color: "var(--colors-foreground)",
                    fontSize: "14px",
                    height: "36px",
                    outline: "none",
                    transition: "all 150ms",
                    "&:focus": {
                      borderColor: "var(--colors-primary)",
                      boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)",
                    },
                  })}
                >
                  <For each={reminderOptions}>
                    {(option) => (
                      <option
                        value={option.value === null ? "null" : option.value}
                      >
                        {option.label}
                      </option>
                    )}
                  </For>
                </select>
              </div>

              {/* Recurrence */}
              <div>
                <label
                  class={css({
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--colors-foreground)",
                    marginBottom: "8px",
                  })}
                >
                  Repeat
                </label>
                <select
                  value={formData().recurrence?.frequency || "null"}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    if (value === "null") {
                      updateField("recurrence", null);
                    } else {
                      updateField("recurrence", {
                        frequency: value as RecurrenceRule["frequency"],
                        interval: 1,
                      });
                    }
                  }}
                  class={css({
                    width: "100%",
                    paddingTop: "8px", paddingBottom: "8px", paddingLeft: "12px", paddingRight: "12px",
                    borderRadius: "6px",
                    border: "1px solid var(--colors-border)",
                    backgroundColor: "var(--colors-background)",
                    color: "var(--colors-foreground)",
                    fontSize: "14px",
                    height: "36px",
                    outline: "none",
                    transition: "all 150ms",
                    "&:focus": {
                      borderColor: "var(--colors-primary)",
                      boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)",
                    },
                  })}
                >
                  <For each={recurrenceOptions}>
                    {(option) => (
                      <option value={option.value || "null"}>
                        {option.label}
                      </option>
                    )}
                  </For>
                </select>
              </div>

              {/* Color */}
              <div>
                <label
                  class={css({
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--colors-foreground)",
                    marginBottom: "8px",
                  })}
                >
                  Color
                </label>
                <div
                  class={css({
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  })}
                >
                  <For
                    each={[
                      "#6366f1",
                      "#8b5cf6",
                      "#ec4899",
                      "#ef4444",
                      "#f97316",
                      "#eab308",
                      "#22c55e",
                      "#14b8a6",
                      "#06b6d4",
                      "#3b82f6",
                    ]}
                  >
                    {(color) => (
                      <button
                        type="button"
                        onClick={() => updateField("color", color)}
                        style={{ "background-color": color }}
                        class={css({
                          width: "36px",
                          height: "36px",
                          borderRadius: "6px",
                          border: "2px solid",
                          borderColor:
                            formData().color === color
                              ? "white"
                              : "transparent",
                          cursor: "pointer",
                          transition: "all 150ms",
                          boxShadow:
                            formData().color === color
                              ? "0 0 0 2px var(--colors-primary)"
                              : "none",
                          _hover: {
                            transform: "scale(1.1)",
                          },
                        })}
                      />
                    )}
                  </For>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              class={css({
                display: "flex",
                justifyContent: "space-between",
                marginTop: "24px",
                paddingTop: "20px",
                borderTop: "1px solid var(--colors-border)",
              })}
            >
              <Show when={isEditing()}>
                <Show
                  when={showDelete()}
                  fallback={
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowDelete(true)}
                      class={css({ color: "var(--colors-error)" })}
                    >
                      Delete
                    </Button>
                  }
                >
                  <div class={css({ display: "flex", gap: "8px" })}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDelete}
                      disabled={isSubmitting()}
                      class={css({ color: "var(--colors-error)" })}
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </Show>
              </Show>

              <div
                class={css({
                  display: "flex",
                  gap: "8px",
                  marginLeft: "auto",
                })}
              >
                <Button type="button" variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting()}
                >
                  {isSubmitting()
                    ? "Saving..."
                    : isEditing()
                      ? "Save"
                      : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
}
