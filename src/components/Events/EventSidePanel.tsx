import { createSignal, createEffect, For, Show } from "solid-js";
import { css } from "../../../styled-system/css";
import { Button } from "../shared/Button";
import { Input } from "../shared/Input";
import { calendars, addEvent, updateEvent, deleteEvent } from "../../stores";
import { useStore } from "@nanostores/solid";
import {
  createEvent,
  updateEvent as updateEventApi,
  deleteEvent as deleteEventApi,
} from "../../lib/tauri";
import type { CalendarEvent, RecurrenceRule } from "../../types";
import { X } from "lucide-solid";

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

interface EventSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<EventFormData>;
  existingEvent?: CalendarEvent;
}

function eventToFormData(event: CalendarEvent): EventFormData {
  const start = event.startTime.includes("T")
    ? new Date(event.startTime)
    : new Date();
  const end = event.endTime.includes("T")
    ? new Date(event.endTime)
    : new Date();

  return {
    title: event.title,
    description: event.description || "",
    location: event.location || "",
    startDate: start.toISOString().split("T")[0],
    startTime: start.toTimeString().slice(0, 5),
    endDate: end.toISOString().split("T")[0],
    endTime: end.toTimeString().slice(0, 5),
    isAllDay: event.isAllDay,
    calendarId: event.calendarId,
    color: event.color || "#6366f1",
    reminderMinutes: event.reminderMinutes || null,
    recurrence: event.recurrence || null,
    meetingUrl: event.meetingUrl || "",
  };
}

export function EventSidePanel(props: EventSidePanelProps) {
  const $calendars = useStore(calendars);

  const [formData, setFormData] = createSignal<EventFormData>({
    title: "",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    isAllDay: false,
    calendarId: "",
    color: "#6366f1",
    reminderMinutes: 15,
    recurrence: null,
    meetingUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [showDelete, setShowDelete] = createSignal(false);

  const isEditing = () => !!props.existingEvent;

  createEffect(() => {
    if (props.isOpen) {
      if (props.existingEvent) {
        setFormData(eventToFormData(props.existingEvent));
      } else {
        const calendarsList = Object.values($calendars());
        const primary =
          calendarsList.find((c) => c.isPrimary) || calendarsList[0];

        setFormData({
          title: "",
          description: "",
          location: "",
          startDate: props.initialData?.startDate || "",
          startTime: props.initialData?.startTime || "",
          endDate: props.initialData?.endDate || "",
          endTime: props.initialData?.endTime || "",
          isAllDay: props.initialData?.isAllDay || false,
          calendarId: primary?.id || "",
          color: primary?.color || "#6366f1",
          reminderMinutes: 15,
          recurrence: null,
          meetingUrl: "",
          ...props.initialData,
        });
      }
      setShowDelete(false);
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!formData().title.trim() || !formData().calendarId) return;

    setIsSubmitting(true);
    try {
      const data = formData();
      // Build ISO 8601 timestamps with UTC timezone for Rust chrono parsing
      const startDateTime = data.isAllDay
        ? `${data.startDate}T00:00:00Z`
        : `${data.startDate}T${data.startTime}:00Z`;
      const endDateTime = data.isAllDay
        ? `${data.endDate}T23:59:59Z`
        : `${data.endDate}T${data.endTime}:00Z`;

      // Build request matching CreateEventRequest struct
      const eventData = {
        calendarId: data.calendarId,
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        allDay: data.isAllDay,
        color: data.color,
        reminders: data.reminderMinutes ? [data.reminderMinutes] : undefined,
        recurrenceRule: data.recurrence
          ? `FREQ=${data.recurrence.frequency.toUpperCase()};INTERVAL=${data.recurrence.interval}`
          : undefined,
        videoLink: data.meetingUrl || undefined,
      };

      if (isEditing()) {
        const updated = await updateEventApi(props.existingEvent!.id, {
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          allDay: eventData.allDay,
          color: eventData.color,
        });
        updateEvent(
          props.existingEvent!.id,
          updated as unknown as CalendarEvent,
        );
      } else {
        const created = await createEvent(eventData);
        addEvent(created as unknown as CalendarEvent);
      }
      props.onClose();
    } catch (error) {
      console.error("Failed to save event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!props.existingEvent) return;

    setIsSubmitting(true);
    try {
      await deleteEventApi(props.existingEvent.id);
      deleteEvent(props.existingEvent.id);
      props.onClose();
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

  return (
    <Show when={props.isOpen}>
      <div
        class={css({
          position: "fixed",
          top: "56px", // Below header
          right: "16px",
          bottom: "16px",
          width: "440px",
          backgroundColor: "background",
          border: "1px solid",
          borderColor: "border",
          borderRadius: "12px",
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.15)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          animation: "slideInFromRight 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        })}
      >
        {/* Header */}
        <div
          class={css({
            paddingTop: "20px",
            paddingBottom: "20px",
            paddingLeft: "24px",
            paddingRight: "24px",
            borderBottom: "1px solid",
            borderColor: "border",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          })}
        >
          <h2
            class={css({
              fontSize: "18px",
              fontWeight: "600",
              color: "foreground",
            })}
          >
            {isEditing() ? "Edit Event" : "New Event"}
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            class={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: "none",
              color: "mutedHover",
              cursor: "pointer",
              transition: "all 150ms",
              _hover: {
                backgroundColor: "hover",
                color: "foreground",
              },
            })}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          class={css({
            flex: 1,
            overflow: "auto",
            paddingTop: "24px",
            paddingBottom: "24px",
            paddingLeft: "24px",
            paddingRight: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          })}
        >
          <Input
            label="Title"
            value={formData().title}
            onInput={(e) => updateField("title", e.currentTarget.value)}
            placeholder="Add title"
            required
            autofocus
          />

          <div>
            <label
              class={css({
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                color: "foreground",
                marginBottom: "6px",
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
                paddingTop: "8px",
                paddingBottom: "8px",
                paddingLeft: "12px",
                paddingRight: "12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: "border",
                backgroundColor: "background",
                color: "foreground",
                fontSize: "14px",
                height: "36px",
                outline: "none",
                transition: "all 150ms",
                cursor: "pointer",
                _focus: {
                  borderColor: "primary",
                },
              })}
            >
              <For each={Object.values($calendars())}>
                {(cal) => <option value={cal.id}>{cal.name}</option>}
              </For>
            </select>
          </div>

          <label
            class={css({
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            })}
          >
            <input
              type="checkbox"
              checked={formData().isAllDay}
              onChange={(e) => updateField("isAllDay", e.currentTarget.checked)}
              class={css({
                width: "16px",
                height: "16px",
                accentColor: "primary",
              })}
            />
            <span class={css({ fontSize: "14px", color: "foreground" })}>
              All day
            </span>
          </label>

          <div
            class={css({
              display: "grid",
              gridTemplateColumns: formData().isAllDay ? "1fr" : "1fr 1fr",
              gap: "12px",
            })}
          >
            <Input
              label="Start Date"
              type="date"
              value={formData().startDate}
              onInput={(e) => updateField("startDate", e.currentTarget.value)}
              required
            />
            <Show when={!formData().isAllDay}>
              <Input
                label="Start Time"
                type="time"
                value={formData().startTime}
                onInput={(e) => updateField("startTime", e.currentTarget.value)}
                required
              />
            </Show>
          </div>

          <div
            class={css({
              display: "grid",
              gridTemplateColumns: formData().isAllDay ? "1fr" : "1fr 1fr",
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
                onInput={(e) => updateField("endTime", e.currentTarget.value)}
                required
              />
            </Show>
          </div>

          <Input
            label="Location"
            value={formData().location}
            onInput={(e) => updateField("location", e.currentTarget.value)}
            placeholder="Add location"
          />

          <Input
            label="Video Call URL"
            type="url"
            value={formData().meetingUrl}
            onInput={(e) => updateField("meetingUrl", e.currentTarget.value)}
            placeholder="https://zoom.us/..."
          />

          <div>
            <label
              class={css({
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                color: "foreground",
                marginBottom: "6px",
              })}
            >
              Description
            </label>
            <textarea
              value={formData().description}
              onInput={(e) => updateField("description", e.currentTarget.value)}
              placeholder="Add description"
              rows={4}
              class={css({
                width: "100%",
                paddingTop: "10px",
                paddingBottom: "10px",
                paddingLeft: "12px",
                paddingRight: "12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: "border",
                backgroundColor: "background",
                color: "foreground",
                fontSize: "14px",
                lineHeight: "1.5",
                resize: "vertical",
                outline: "none",
                minHeight: "80px",
                transition: "all 150ms",
                _focus: {
                  borderColor: "primary",
                },
              })}
            />
          </div>

          {/* Actions */}
          <div
            class={css({
              display: "flex",
              justifyContent: "space-between",
              marginTop: "auto",
              paddingTop: "16px",
              borderTop: "1px solid",
              borderColor: "border",
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
                    class={css({ color: "error" })}
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
                    class={css({ color: "error" })}
                  >
                    Confirm
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
              <Button type="button" variant="secondary" onClick={props.onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting()}>
                {isSubmitting() ? "Saving..." : isEditing() ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Show>
  );
}
