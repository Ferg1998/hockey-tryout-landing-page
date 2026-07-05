import { SiteHeader } from "@/components/site-header"
import { TryoutFinder } from "@/components/tryout-finder"
import { ChoosePath } from "@/components/choose-path"
import { FeaturedTryouts } from "@/components/featured-tryouts"
import {
  BrowseByAge,
  BrowseByLevel,
  BrowseByRegion,
  BrowseByPosition,
} from "@/components/browse-sections"
import { PrepareSection } from "@/components/prepare-section"
import { WhyParents } from "@/components/why-parents"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <TryoutFinder />
        <ChoosePath />
        <FeaturedTryouts />
        <BrowseByAge />
        <BrowseByLevel />
        <BrowseByRegion />
        <BrowseByPosition />
        <PrepareSection />
        <WhyParents />
      </main>
      <SiteFooter />
    </div>
  )
}
