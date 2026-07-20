const DAY_MS = 24 * 60 * 60 * 1000;

export const COMPLETION_DAYS_STORAGE_KEY = 'plank-as-one:completion-days:v1';

export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function shiftUtcDay(dayKey, offset) {
  return new Date(Date.parse(`${dayKey}T00:00:00Z`) + offset * DAY_MS).toISOString().slice(0, 10);
}

export function normalizeCompletionDays(days) {
  if (!Array.isArray(days)) return [];
  return [...new Set(days.filter((day) => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)))].sort();
}

export function addCompletionDay(days, date = new Date()) {
  return normalizeCompletionDays([...normalizeCompletionDays(days), utcDayKey(date)]);
}

export function calculateStreak(days, date = new Date()) {
  const completed = new Set(normalizeCompletionDays(days));
  const today = utcDayKey(date);
  let cursor = completed.has(today) ? today : shiftUtcDay(today, -1);
  let streak = 0;
  while (completed.has(cursor)) {
    streak += 1;
    cursor = shiftUtcDay(cursor, -1);
  }
  return streak;
}

export function formatResetCountdown(date = new Date()) {
  const nextReset = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
  const remainingSeconds = Math.max(0, Math.ceil((nextReset - date.getTime()) / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}
