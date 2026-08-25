// Formats an ISO date string into a short relative time label,
// e.g. "just now", "5m", "3h", "2d", or a plain date once it's old.
export function timeAgo(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  // A malformed or missing timestamp used to render the literal string
  // "Invalid Date" in the feed. Fall back to an empty label instead.
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}
