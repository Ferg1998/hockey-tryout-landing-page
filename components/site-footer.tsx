import { Snowflake } from "lucide-react"

const columns = [
  {
    title: "Discover",
    links: ["Find tryouts", "Browse by age", "Browse by level", "Browse by region"],
  },
  {
    title: "Prepare",
    links: ["Skills coaches", "Skating coaches", "Goalie coaches", "Off-ice training"],
  },
  {
    title: "Organizations",
    links: ["List a tryout", "Manage registrations", "Pricing", "Success stories"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Help centre", "Contact"],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Snowflake className="size-5" />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
                Hockey<span className="text-primary">Tryouts</span>
                <span className="text-muted-foreground">.ca</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The trusted marketplace to find hockey tryouts and book elite
              coaching across Canada.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-bold text-foreground">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HockeyTryouts.ca — Built for Canadian hockey families.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
