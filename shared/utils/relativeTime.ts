import { formatDistance } from "date-fns";
import { getCurrentLocale } from "shared/utils/setLocale";

// Describes `to` relative to `from`, e.g. "2 minutes ago" or "in an hour".
// Wrapped rather than called directly so the active locale is wired in one place
export const formatRelativeTime = (from: Date, to: Date): string =>
  formatDistance(to, from, { addSuffix: true, locale: getCurrentLocale() });
