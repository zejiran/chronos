import { Temporal } from '@js-temporal/polyfill'

export function getWeekDays(startOfWeek: 'sunday' | 'monday' | 'saturday' = 'monday'): string[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const startIndex = startOfWeek === 'sunday' ? 0 : startOfWeek === 'monday' ? 1 : 6

  return [...days.slice(startIndex), ...days.slice(0, startIndex)]
}

export function getShortWeekDays(startOfWeek: 'sunday' | 'monday' | 'saturday' = 'monday'): string[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const startIndex = startOfWeek === 'sunday' ? 0 : startOfWeek === 'monday' ? 1 : 6

  return [...days.slice(startIndex), ...days.slice(0, startIndex)]
}

export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1]
}

export function getShortMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1]
}

export function getCalendarDays(
  year: number,
  month: number,
  startOfWeek: 'sunday' | 'monday' | 'saturday' = 'monday'
): Temporal.PlainDate[] {
  const firstDayOfMonth = Temporal.PlainDate.from({ year, month, day: 1 })
  const lastDayOfMonth = firstDayOfMonth.with({ day: firstDayOfMonth.daysInMonth })

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDayOfMonth.dayOfWeek // 1 = Monday, 7 = Sunday

  // Calculate offset based on start of week preference
  let startOffset: number
  if (startOfWeek === 'sunday') {
    startOffset = firstDayOfWeek === 7 ? 0 : firstDayOfWeek
  } else if (startOfWeek === 'monday') {
    startOffset = firstDayOfWeek - 1
  } else {
    // Saturday
    startOffset = (firstDayOfWeek + 1) % 7
  }

  const days: Temporal.PlainDate[] = []

  // Add days from previous month
  for (let i = startOffset; i > 0; i--) {
    days.push(firstDayOfMonth.subtract({ days: i }))
  }

  // Add days of current month
  for (let day = 1; day <= lastDayOfMonth.day; day++) {
    days.push(Temporal.PlainDate.from({ year, month, day }))
  }

  // Add days from next month to complete the grid (6 rows of 7 days)
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push(lastDayOfMonth.add({ days: i }))
  }

  return days
}

export function getWeekDates(
  date: Temporal.PlainDate | string,
  startOfWeek: 'sunday' | 'monday' | 'saturday' = 'monday'
): Temporal.PlainDate[] {
  const currentDate = typeof date === 'string' ? Temporal.PlainDate.from(date) : date
  const dayOfWeek = currentDate.dayOfWeek // 1 = Monday, 7 = Sunday

  let daysToSubtract: number
  if (startOfWeek === 'sunday') {
    daysToSubtract = dayOfWeek === 7 ? 0 : dayOfWeek
  } else if (startOfWeek === 'monday') {
    daysToSubtract = dayOfWeek - 1
  } else {
    // Saturday
    daysToSubtract = (dayOfWeek + 1) % 7
  }

  const weekStart = currentDate.subtract({ days: daysToSubtract })

  return Array.from({ length: 7 }, (_, i) => weekStart.add({ days: i }))
}

export function formatDate(
  date: Temporal.PlainDate | string,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const d = typeof date === 'string' ? Temporal.PlainDate.from(date) : date

  switch (format) {
    case 'short':
      return `${d.month}/${d.day}/${d.year}`
    case 'medium':
      return `${getShortMonthName(d.month)} ${d.day}, ${d.year}`
    case 'long':
      return `${getMonthName(d.month)} ${d.day}, ${d.year}`
    case 'full':
      const weekDay = getWeekDays()[d.dayOfWeek === 7 ? 0 : d.dayOfWeek]
      return `${weekDay}, ${getMonthName(d.month)} ${d.day}, ${d.year}`
    default:
      return d.toString()
  }
}

export function formatTime(
  time: Temporal.PlainTime | Temporal.PlainDateTime | string,
  format: '12h' | '24h' = '12h'
): string {
  let t: Temporal.PlainTime

  if (typeof time === 'string') {
    if (time.includes('T')) {
      t = Temporal.PlainDateTime.from(time.replace('Z', '')).toPlainTime()
    } else {
      t = Temporal.PlainTime.from(time)
    }
  } else if ('toPlainTime' in time) {
    t = time.toPlainTime()
  } else {
    t = time
  }

  if (format === '24h') {
    return `${t.hour.toString().padStart(2, '0')}:${t.minute.toString().padStart(2, '0')}`
  }

  const hour = t.hour % 12 || 12
  const period = t.hour >= 12 ? 'PM' : 'AM'
  return `${hour}:${t.minute.toString().padStart(2, '0')} ${period}`
}

export function formatDateTime(
  dateTime: Temporal.PlainDateTime | string,
  dateFormat: 'short' | 'medium' | 'long' = 'medium',
  timeFormat: '12h' | '24h' = '12h'
): string {
  const dt = typeof dateTime === 'string'
    ? Temporal.PlainDateTime.from(dateTime.replace('Z', ''))
    : dateTime

  return `${formatDate(dt.toPlainDate(), dateFormat)} at ${formatTime(dt.toPlainTime(), timeFormat)}`
}

export function isToday(date: Temporal.PlainDate | string): boolean {
  const d = typeof date === 'string' ? Temporal.PlainDate.from(date) : date
  const today = Temporal.Now.plainDateISO()
  return d.equals(today)
}

export function isWeekend(date: Temporal.PlainDate | string): boolean {
  const d = typeof date === 'string' ? Temporal.PlainDate.from(date) : date
  return d.dayOfWeek === 6 || d.dayOfWeek === 7
}

export function isSameMonth(
  date1: Temporal.PlainDate | string,
  date2: Temporal.PlainDate | string
): boolean {
  const d1 = typeof date1 === 'string' ? Temporal.PlainDate.from(date1) : date1
  const d2 = typeof date2 === 'string' ? Temporal.PlainDate.from(date2) : date2
  return d1.year === d2.year && d1.month === d2.month
}

export function getHoursArray(startHour = 0, endHour = 24): number[] {
  return Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
}

export function getWeekNumber(date: Temporal.PlainDate | string): number {
  const d = typeof date === 'string' ? Temporal.PlainDate.from(date) : date

  // ISO week number calculation
  const jan1 = Temporal.PlainDate.from({ year: d.year, month: 1, day: 1 })
  const dayOfYear = d.since(jan1).days + 1
  const jan1DayOfWeek = jan1.dayOfWeek

  return Math.ceil((dayOfYear + jan1DayOfWeek - 1) / 7)
}

export function getDurationString(startTime: string, endTime: string): string {
  const start = Temporal.PlainDateTime.from(startTime.replace('Z', ''))
  const end = Temporal.PlainDateTime.from(endTime.replace('Z', ''))

  const duration = end.since(start)
  const totalMinutes = duration.hours * 60 + duration.minutes

  if (totalMinutes < 60) {
    return `${totalMinutes}m`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}

export function getRelativeTimeString(dateTime: string): string {
  const target = Temporal.Instant.from(dateTime)
  const now = Temporal.Now.instant()

  const diff = target.since(now)
  const totalMinutes = Math.round(diff.total('minutes'))

  if (Math.abs(totalMinutes) < 1) {
    return 'now'
  }

  if (totalMinutes > 0) {
    // Future
    if (totalMinutes < 60) {
      return `in ${totalMinutes}m`
    }
    const hours = Math.floor(totalMinutes / 60)
    if (hours < 24) {
      return `in ${hours}h`
    }
    const days = Math.floor(hours / 24)
    return `in ${days}d`
  } else {
    // Past
    const absMinutes = Math.abs(totalMinutes)
    if (absMinutes < 60) {
      return `${absMinutes}m ago`
    }
    const hours = Math.floor(absMinutes / 60)
    if (hours < 24) {
      return `${hours}h ago`
    }
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }
}
