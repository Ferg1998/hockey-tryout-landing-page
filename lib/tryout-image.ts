export const DEFAULT_TRYOUT_IMAGE = "/images/tryout-team.png"

export type TryoutImageSource = {
  heroImage?: string | null
  image?: string | null
  organizationBanner?: string | null
  teamLogo?: string | null
  organizationLogo?: string | null
}

export type ResolvedTryoutImage = {
  src: string
  kind: "photo" | "logo" | "default"
}

function usable(value?: string | null): value is string {
  return Boolean(value && value.trim() && value !== "/placeholder.svg")
}

export function getTryoutImageCandidates(source: TryoutImageSource): ResolvedTryoutImage[] {
  const candidates: ResolvedTryoutImage[] = [
    { src: source.heroImage ?? "", kind: "photo" },
    { src: source.image ?? "", kind: "photo" },
    { src: source.organizationBanner ?? "", kind: "photo" },
    { src: source.teamLogo ?? "", kind: "logo" },
    { src: source.organizationLogo ?? "", kind: "logo" },
    { src: DEFAULT_TRYOUT_IMAGE, kind: "default" },
  ]

  return candidates.filter(
    (candidate, index, all) =>
      usable(candidate.src) &&
      all.findIndex((other) => other.src === candidate.src) === index,
  )
}

export function resolveTryoutImage(source: TryoutImageSource): ResolvedTryoutImage {
  return getTryoutImageCandidates(source)[0] ?? {
    src: DEFAULT_TRYOUT_IMAGE,
    kind: "default",
  }
}
