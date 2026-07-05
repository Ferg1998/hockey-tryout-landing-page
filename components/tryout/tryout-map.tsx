import { MapPin, ExternalLink } from "lucide-react"

/**
 * Embedded Google Map for the arena location. Uses Google's keyless embed
 * endpoint so no API key is required; the query is derived from the arena and
 * location data pulled from Supabase.
 */
export function TryoutMap({
  arena,
  city,
  province,
  address,
  mapLink,
}: {
  arena: string
  city: string
  province: string
  address?: string
  mapLink?: string
}) {
  // Prefer a specific street address for accuracy, else fall back to arena + city.
  const query = [arena, address, city, province].filter(Boolean).join(", ")
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
  const linkHref =
    mapLink ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <MapPin className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{arena}</p>
            <p className="text-sm text-muted-foreground">
              {address ? `${address}, ` : ""}
              {city}, {province}
            </p>
          </div>
        </div>
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Directions
          <ExternalLink className="size-3.5" />
        </a>
      </div>
      <iframe
        title={`Map showing ${arena} in ${city}, ${province}`}
        src={embedSrc}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-64 w-full border-0 sm:h-80"
        allowFullScreen
      />
    </div>
  )
}
