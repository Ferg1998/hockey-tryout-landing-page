"use client"

import { useState } from "react"
import { Menu, X, Snowflake, Globe, UserCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Find Tryouts", href: "#featured" },
  { label: "Browse", href: "#browse-age" },
  { label: "Prepare", href: "#prepare" },
  { label: "For Organizations", href: "#" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Snowflake className="size-5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Hockey<span className="text-primary">Tryouts</span>
            <span className="text-muted-foreground">.ca</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="lg" className="gap-2 rounded-full text-foreground/80">
            <Globe className="size-4" />
            EN
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 rounded-full px-3 shadow-sm"
          >
            <Menu className="size-4" />
            <UserCircle2 className="size-6 text-muted-foreground" />
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 items-center justify-center rounded-full border border-border text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground/90 hover:bg-secondary"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="lg" className="flex-1 rounded-full">
                Log in
              </Button>
              <Button size="lg" className="flex-1 rounded-full">
                Sign up
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
