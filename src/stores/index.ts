import { atom, map } from 'nanostores'
import { persistentAtom, persistentMap } from '@nanostores/persistent'
import type { Event, Calendar, Account, Settings, CalendarView } from '../types'
import { Temporal } from '@js-temporal/polyfill'

// UI State
export const sidebarVisible = persistentAtom<boolean>('sidebar-visible', true, {
  encode: JSON.stringify,
  decode: JSON.parse,
})

export const currentView = persistentAtom<CalendarView>('current-view', 'week', {
  encode: JSON.stringify,
  decode: JSON.parse,
})

export const selectedDate = atom<string>(
  Temporal.Now.plainDateISO().toString()
)

export const commandPaletteOpen = atom<boolean>(false)
export const settingsModalOpen = atom<boolean>(false)
export const eventModalOpen = atom<boolean>(false)
export const accountModalOpen = atom<boolean>(false)

// Selected event for editing
export const selectedEventId = atom<string | null>(null)

// Search
export const searchQuery = atom<string>('')
export const searchResults = atom<Event[]>([])

// Data stores
export const events = map<Record<string, Event>>({})
export const calendars = map<Record<string, Calendar>>({})
export const accounts = map<Record<string, Account>>({})

// Settings
export const settings = atom<Settings | null>(null)

// Sync state
export const isSyncing = atom<boolean>(false)
export const lastSyncTime = atom<string | null>(null)
export const syncErrors = atom<string[]>([])

// Helper functions
export function getEventsList(): Event[] {
  return Object.values(events.get())
}

export function getCalendarsList(): Calendar[] {
  return Object.values(calendars.get())
}

export function getAccountsList(): Account[] {
  return Object.values(accounts.get())
}

export function getVisibleCalendars(): Calendar[] {
  return getCalendarsList().filter(cal => cal.isVisible)
}

export function getEventsForDate(date: string): Event[] {
  const targetDate = Temporal.PlainDate.from(date)

  return getEventsList().filter(event => {
    const eventStart = Temporal.PlainDateTime.from(event.startTime.replace('Z', ''))
    const eventDate = eventStart.toPlainDate()
    return eventDate.equals(targetDate)
  })
}

export function getEventsForDateRange(start: string, end: string): Event[] {
  const startDate = Temporal.PlainDate.from(start)
  const endDate = Temporal.PlainDate.from(end)

  return getEventsList().filter(event => {
    const eventStart = Temporal.PlainDateTime.from(event.startTime.replace('Z', ''))
    const eventDate = eventStart.toPlainDate()
    return Temporal.PlainDate.compare(eventDate, startDate) >= 0 &&
           Temporal.PlainDate.compare(eventDate, endDate) <= 0
  })
}

export function addEvent(event: Event): void {
  events.setKey(event.id, event)
}

export function updateEvent(id: string, updates: Partial<Event>): void {
  const current = events.get()[id]
  if (current) {
    events.setKey(id, { ...current, ...updates })
  }
}

export function removeEvent(id: string): void {
  const current = events.get()
  delete current[id]
  events.set({ ...current })
}

export function addCalendar(calendar: Calendar): void {
  calendars.setKey(calendar.id, calendar)
}

export function updateCalendar(id: string, updates: Partial<Calendar>): void {
  const current = calendars.get()[id]
  if (current) {
    calendars.setKey(id, { ...current, ...updates })
  }
}

export function toggleCalendarVisibility(id: string): void {
  const current = calendars.get()[id]
  if (current) {
    calendars.setKey(id, { ...current, isVisible: !current.isVisible })
  }
}

export function addAccount(account: Account): void {
  accounts.setKey(account.id, account)
}

export function removeAccount(id: string): void {
  const current = accounts.get()
  delete current[id]
  accounts.set({ ...current })
}

// Navigation helpers
export function goToToday(): void {
  selectedDate.set(Temporal.Now.plainDateISO().toString())
}

export function goToPrevious(): void {
  const current = Temporal.PlainDate.from(selectedDate.get())
  const view = currentView.get()

  let newDate: Temporal.PlainDate
  switch (view) {
    case 'day':
      newDate = current.subtract({ days: 1 })
      break
    case 'week':
      newDate = current.subtract({ weeks: 1 })
      break
    case 'month':
      newDate = current.subtract({ months: 1 })
      break
    case 'year':
      newDate = current.subtract({ years: 1 })
      break
    default:
      newDate = current.subtract({ days: 1 })
  }

  selectedDate.set(newDate.toString())
}

export function goToNext(): void {
  const current = Temporal.PlainDate.from(selectedDate.get())
  const view = currentView.get()

  let newDate: Temporal.PlainDate
  switch (view) {
    case 'day':
      newDate = current.add({ days: 1 })
      break
    case 'week':
      newDate = current.add({ weeks: 1 })
      break
    case 'month':
      newDate = current.add({ months: 1 })
      break
    case 'year':
      newDate = current.add({ years: 1 })
      break
    default:
      newDate = current.add({ days: 1 })
  }

  selectedDate.set(newDate.toString())
}

export function setView(view: CalendarView): void {
  currentView.set(view)
}

export function toggleSidebar(): void {
  sidebarVisible.set(!sidebarVisible.get())
}
