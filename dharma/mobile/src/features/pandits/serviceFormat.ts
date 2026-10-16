// Formats a service duration in minutes into a human label, e.g. 120 -> "2 hrs", 90 -> "1 hr 30 min".
// Kept in a route-free module so screens and Jest can share it.
export function formatDurationLabel(durationMinutes: number): string {
  const total = Number.isFinite(durationMinutes) && durationMinutes > 0 ? Math.floor(durationMinutes) : 0;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}${minutes ? ` ${minutes} min` : ""}`;
  }
  return `${minutes} min`;
}
