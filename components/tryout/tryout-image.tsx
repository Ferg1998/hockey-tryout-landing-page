"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getTryoutImageCandidates,
  type TryoutImageSource,
} from "@/lib/tryout-image"
import { cn } from "@/lib/utils"

type TryoutImageProps = TryoutImageSource & {
  alt: string
  className?: string
  priority?: boolean
}

export function TryoutImage({
  alt,
  className,
  priority = false,
  ...source
}: TryoutImageProps) {
  const candidates = useMemo(
    () => getTryoutImageCandidates(source),
    [source.heroImage, source.image, source.organizationBanner, source.teamLogo, source.organizationLogo],
  )
  const [index, setIndex] = useState(0)

  useEffect(() => setIndex(0), [candidates])
  const current = candidates[index] ?? candidates[candidates.length - 1]
  if (!current) return null

  const isLogo = current.kind === "logo"

  return (
    <div className={cn("relative size-full overflow-hidden", isLogo && "bg-slate-50", className)}>
      <img
        src={current.src}
        alt={alt}
        className={cn(
          "absolute inset-0 size-full",
          isLogo ? "object-contain p-6" : "object-cover",
        )}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onError={() => setIndex((value) => Math.min(value + 1, candidates.length - 1))}
      />
    </div>
  )
}
