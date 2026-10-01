/** Maldives is UTC+5. Datetime-local values are parsed as server-local time, so allow a small skew. */
export const PUBLISH_TIME_SKEW_MS = 6 * 60 * 60 * 1000;

export function publishTimeReached(pubDate: string | undefined | null, nowMs: number): boolean {
  if (!pubDate) return false;
  const pubTime = new Date(pubDate).getTime();
  if (Number.isNaN(pubTime)) return false;
  return pubTime <= nowMs + PUBLISH_TIME_SKEW_MS;
}

export interface EventVisibility {
  status?: string;
  isDraft?: boolean;
  isPublished?: boolean;
  emailNotified?: boolean;
  notified?: boolean;
  publishDateTime?: string;
  triggerDateTime?: string;
  fromDateTime?: string;
}

/** Members see an event once its publish time is due. The event start time is not a publish time. */
export function memberCanSeeEvent(evt: EventVisibility, nowMs: number): boolean {
  if (evt.status === 'Draft' || evt.isDraft === true) return false;
  if (evt.isPublished || evt.emailNotified || evt.notified) return true;
  const pubDate = evt.publishDateTime || evt.triggerDateTime;
  if (!pubDate) return true;
  return publishTimeReached(pubDate, nowMs);
}
