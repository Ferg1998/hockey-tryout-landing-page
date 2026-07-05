"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function ShareButton({
  title,
  text,
  className,
}: {
  title: string
  text?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : ""

    // Prefer the native share sheet on supported devices (mobile especially).
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — nothing else to do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share this tryout"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="size-4 text-emerald-600" />
          Link copied
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          Share
        </>
      )}
    </button>
  )
}
