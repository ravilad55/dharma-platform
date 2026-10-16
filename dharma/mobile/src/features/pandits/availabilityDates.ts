// Date/time helpers for the availability flow. Kept route-free so Jest can import them directly.

export interface SelectableDate {
  /** yyyy-MM-dd value sent to the API. */
  value: string;
  /** Short weekday label, e.g. "Mon". */
  weekday: string;
  /** Day of month, e.g. "15". */
  day: string;
  /** Short month label, e.g. "Jun". */
  month: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

/** Builds the yyyy-MM-dd value for a Date in its local fields. */
export function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Returns the next `count` selectable dates starting today. The customer picks one of these; the
 * value is sent to the availability API. We intentionally keep this on the device's local calendar
 * for selection — the API reports the authoritative display timezone for the returned slots.
 */
export function buildSelectableDates(count = 14, from: Date = new Date()): SelectableDate[] {
  const dates: SelectableDate[] = [];
  for (let offset = 0; offset < count; offset++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    dates.push({
      value: toDateValue(d),
      weekday: WEEKDAYS[d.getDay()],
      day: pad(d.getDate()),
      month: MONTHS[d.getMonth()],
    });
  }
  return dates;
}

/**
 * Formats an ISO-8601 slot timestamp (with offset, e.g. 2030-06-15T09:00:00+05:30) to a display time
 * like "9:00 AM". Parses the wall-clock fields directly so the label matches the API's display zone
 * regardless of the device timezone.
 */
export function formatSlotTime(iso: string): string {
  const match = /T(\d{2}):(\d{2})/.exec(iso);
  if (!match) return iso;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${period}`;
}

/** Human label for a date value (yyyy-MM-dd), e.g. "Mon, 15 Jun". */
export function formatDateHeading(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const d = new Date(year, monthIndex, day);
  return `${WEEKDAYS[d.getDay()]}, ${day} ${MONTHS[monthIndex]}`;
}
