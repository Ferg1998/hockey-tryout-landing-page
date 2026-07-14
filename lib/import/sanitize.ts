import "server-only"

/**
 * Converts raw HTML into clean, plain text safe for storage and for feeding to
 * the extraction model. Removes scripts/styles and all tags, decodes common
 * entities, collapses whitespace, and caps the length so we never store or
 * send unbounded content.
 */
export function htmlToText(html: string, maxLength = 12000): string {
  if (!html) return ""

  let text = html
    // Drop entire non-content elements including their contents.
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Preserve some structure as line breaks.
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Strip all remaining tags.
    .replace(/<[^>]+>/g, " ")

  text = decodeEntities(text)

  // Collapse whitespace while keeping paragraph breaks.
  text = text
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return text.slice(0, maxLength)
}

/**
 * Sanitizes a short free-text field extracted by the model: strips any stray
 * HTML/control characters and trims. Used defensively on every imported field.
 */
export function sanitizeField(value: unknown, maxLength = 2000): string | null {
  if (value == null) return null
  const raw = String(value)
  const cleaned = decodeEntities(raw.replace(/<[^>]+>/g, " "))
    // Remove control characters.
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return null
  return cleaned.slice(0, maxLength)
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ""
    })
}
