export const FAILURE_CATEGORIES = [
  "blocked",
  "timeout",
  "invalid_page",
  "robots",
  "unsupported_content",
  "network",
  "source_rate_limit",
  "server",
  "parsing",
  "unknown",
] as const

export type FailureCategory = (typeof FAILURE_CATEGORIES)[number]

export const TEMPORARY_FAILURES = new Set<FailureCategory>([
  "timeout",
  "network",
  "source_rate_limit",
  "server",
])

export function isTemporaryFailure(category?: FailureCategory): boolean {
  return category ? TEMPORARY_FAILURES.has(category) : false
}

export function classifyFailure(message?: string): FailureCategory | undefined {
  if (!message) return undefined
  const value = message.toLowerCase()
  if (/robots\.txt/.test(value)) return "robots"
  if (/captcha|login|log in|access restricted|http 401|http 403/.test(value)) return "blocked"
  if (/timed out|timeout|aborted/.test(value)) return "timeout"
  if (/http 429|rate limited by source/.test(value)) return "source_rate_limit"
  if (/invalid source url|source not found|not html|no readable content/.test(value)) return "invalid_page"
  if (/unsupported content|unsupported pdf|application\/pdf/.test(value)) return "unsupported_content"
  if (/http 5\d\d/.test(value)) return "server"
  if (/fetch failed|network|econn|enotfound|socket|certificate|dns/.test(value)) return "network"
  if (/extract|parse|schema|save import|update import/.test(value)) return "parsing"
  return "unknown"
}
