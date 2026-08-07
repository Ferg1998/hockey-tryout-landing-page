/** Convert a stored, newline-delimited schedule into public display entries. */
export function getScheduleLines(schedule: string): string[] {
  return schedule
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}
