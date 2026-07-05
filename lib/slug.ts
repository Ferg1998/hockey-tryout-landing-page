/**
 * Converts an arbitrary string into a URL-safe slug.
 * e.g. "Toronto Marlboros U16 AAA" -> "toronto-marlboros-u16-aaa"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric
    .replace(/[\s_-]+/g, "-") // collapse whitespace/underscores to a single dash
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
}

/**
 * Appends a short suffix to a base slug to help ensure uniqueness when a
 * collision is detected (e.g. "toronto-marlboros" -> "toronto-marlboros-2").
 */
export function slugWithSuffix(base: string, suffix: number | string): string {
  const clean = slugify(base) || "item"
  return `${clean}-${suffix}`
}
