export type Tryout = {
  id: string
  title: string
  org: string
  city: string
  province: string
  level: string
  age: string
  date: string
  price: string
  spotsLeft: number
  rating: number
  reviews: number
  image: string
  featured?: boolean
}

export const featuredTryouts: Tryout[] = [
  {
    id: "1",
    title: "AAA Spring Prospect Camp",
    org: "Toronto Jr. Marlies",
    city: "Toronto",
    province: "ON",
    level: "AAA",
    age: "U15",
    date: "Apr 12–14, 2026",
    price: "$249",
    spotsLeft: 6,
    rating: 4.9,
    reviews: 128,
    image: "/images/tryout-aaa.png",
    featured: true,
  },
  {
    id: "2",
    title: "Elite Goalie Evaluation",
    org: "Vancouver Ice Academy",
    city: "Vancouver",
    province: "BC",
    level: "AA",
    age: "U13",
    date: "Apr 19, 2026",
    price: "$120",
    spotsLeft: 3,
    rating: 4.8,
    reviews: 74,
    image: "/images/tryout-goalie.png",
    featured: true,
  },
  {
    id: "3",
    title: "Rep Team Main Tryouts",
    org: "Calgary Northstars",
    city: "Calgary",
    province: "AB",
    level: "A",
    age: "U11",
    date: "May 3–5, 2026",
    price: "$95",
    spotsLeft: 12,
    rating: 4.7,
    reviews: 56,
    image: "/images/tryout-team.png",
    featured: true,
  },
  {
    id: "4",
    title: "Girls Prep Showcase",
    org: "Ottawa Lady Sens",
    city: "Ottawa",
    province: "ON",
    level: "AAA",
    age: "U18",
    date: "May 10, 2026",
    price: "$180",
    spotsLeft: 8,
    rating: 5.0,
    reviews: 41,
    image: "/images/tryout-girls.png",
    featured: true,
  },
]

export type TryoutListing = {
  id: string
  team: string
  city: string
  province: string
  birthYear: string
  ageGroup: string
  level: string
  dates: string
  arena: string
  cost: string
  status: "Open" | "Closing Soon" | "Waitlist" | "Full" | "Closed"
  registrationLink: string
  image: string
  // Optional relationship references (present once linked to a team/org).
  organizationId?: string
  teamId?: string
}

// Local sample data — swap for a database later.
export const tryouts: TryoutListing[] = [
  {
    id: "t1",
    team: "Toronto Jr. Marlies",
    city: "Toronto",
    province: "ON",
    birthYear: "2011",
    ageGroup: "U15",
    level: "AAA",
    dates: "Apr 12–14, 2026",
    arena: "Mastercard Centre",
    cost: "$249",
    status: "Closing Soon",
    registrationLink: "https://example.com/register/t1",
    image: "/images/tryout-aaa.png",
  },
  {
    id: "t2",
    team: "Vancouver Ice Academy",
    city: "Vancouver",
    province: "BC",
    birthYear: "2013",
    ageGroup: "U13",
    level: "AA",
    dates: "Apr 19, 2026",
    arena: "8 Rinks Burnaby",
    cost: "$120",
    status: "Open",
    registrationLink: "https://example.com/register/t2",
    image: "/images/tryout-goalie.png",
  },
  {
    id: "t3",
    team: "Calgary Northstars",
    city: "Calgary",
    province: "AB",
    birthYear: "2015",
    ageGroup: "U11",
    level: "A",
    dates: "May 3–5, 2026",
    arena: "Max Bell Centre",
    cost: "$95",
    status: "Open",
    registrationLink: "https://example.com/register/t3",
    image: "/images/tryout-team.png",
  },
  {
    id: "t4",
    team: "Ottawa Lady Sens",
    city: "Ottawa",
    province: "ON",
    birthYear: "2008",
    ageGroup: "U18",
    level: "AAA",
    dates: "May 10, 2026",
    arena: "Bell Sensplex",
    cost: "$180",
    status: "Open",
    registrationLink: "https://example.com/register/t4",
    image: "/images/tryout-girls.png",
  },
  {
    id: "t5",
    team: "Winnipeg Wild",
    city: "Winnipeg",
    province: "MB",
    birthYear: "2013",
    ageGroup: "U13",
    level: "AAA",
    dates: "Apr 26–28, 2026",
    arena: "Bell MTS Iceplex",
    cost: "$210",
    status: "Waitlist",
    registrationLink: "https://example.com/register/t5",
    image: "/images/tryout-aaa.png",
  },
  {
    id: "t6",
    team: "Halifax Hawks",
    city: "Halifax",
    province: "NS",
    birthYear: "2015",
    ageGroup: "U11",
    level: "AA",
    dates: "May 2–3, 2026",
    arena: "RBC Centre",
    cost: "$110",
    status: "Open",
    registrationLink: "https://example.com/register/t6",
    image: "/images/tryout-team.png",
  },
  {
    id: "t7",
    team: "Montreal Nord Elite",
    city: "Montreal",
    province: "QC",
    birthYear: "2011",
    ageGroup: "U15",
    level: "AA",
    dates: "May 9–11, 2026",
    arena: "Complexe Sportif Bell",
    cost: "$160",
    status: "Open",
    registrationLink: "https://example.com/register/t7",
    image: "/images/tryout-goalie.png",
  },
  {
    id: "t8",
    team: "Edmonton Oil Kings Jr.",
    city: "Edmonton",
    province: "AB",
    birthYear: "2008",
    ageGroup: "U18",
    level: "AAA",
    dates: "Apr 18–20, 2026",
    arena: "Downtown Community Arena",
    cost: "$275",
    status: "Closing Soon",
    registrationLink: "https://example.com/register/t8",
    image: "/images/tryout-aaa.png",
  },
  {
    id: "t9",
    team: "Mississauga Reps",
    city: "Mississauga",
    province: "ON",
    birthYear: "2017",
    ageGroup: "U9",
    level: "Local League",
    dates: "May 16, 2026",
    arena: "Paramount Fine Foods Centre",
    cost: "$65",
    status: "Open",
    registrationLink: "https://example.com/register/t9",
    image: "/images/tryout-team.png",
  },
  {
    id: "t10",
    team: "Surrey Storm",
    city: "Surrey",
    province: "BC",
    birthYear: "2015",
    ageGroup: "U11",
    level: "A",
    dates: "May 23–24, 2026",
    arena: "Cloverdale Arena",
    cost: "$90",
    status: "Open",
    registrationLink: "https://example.com/register/t10",
    image: "/images/tryout-team.png",
  },
  {
    id: "t11",
    team: "Quebec City Remparts Dev",
    city: "Quebec City",
    province: "QC",
    birthYear: "2011",
    ageGroup: "U15",
    level: "AAA",
    dates: "Apr 25–27, 2026",
    arena: "Centre Vidéotron Annex",
    cost: "$230",
    status: "Closing Soon",
    registrationLink: "https://example.com/register/t11",
    image: "/images/tryout-aaa.png",
  },
  {
    id: "t12",
    team: "Regina Rush",
    city: "Regina",
    province: "SK",
    birthYear: "2013",
    ageGroup: "U13",
    level: "AA",
    dates: "May 4–5, 2026",
    arena: "Co-operators Centre",
    cost: "$130",
    status: "Open",
    registrationLink: "https://example.com/register/t12",
    image: "/images/tryout-goalie.png",
  },
  {
    id: "t13",
    team: "London Jr. Knights",
    city: "London",
    province: "ON",
    birthYear: "2013",
    ageGroup: "U13",
    level: "AAA",
    dates: "May 1–3, 2026",
    arena: "Western Fair Sports Centre",
    cost: "$215",
    status: "Waitlist",
    registrationLink: "https://example.com/register/t13",
    image: "/images/tryout-aaa.png",
  },
  {
    id: "t14",
    team: "Victoria Royals Dev",
    city: "Victoria",
    province: "BC",
    birthYear: "2008",
    ageGroup: "U18",
    level: "AA",
    dates: "May 12–14, 2026",
    arena: "Save-On-Foods Memorial Centre",
    cost: "$185",
    status: "Open",
    registrationLink: "https://example.com/register/t14",
    image: "/images/tryout-girls.png",
  },
  {
    id: "t15",
    team: "Brampton Battalion Minor",
    city: "Brampton",
    province: "ON",
    birthYear: "2015",
    ageGroup: "U11",
    level: "AA",
    dates: "May 17–18, 2026",
    arena: "CAA Centre",
    cost: "$125",
    status: "Open",
    registrationLink: "https://example.com/register/t15",
    image: "/images/tryout-team.png",
  },
  {
    id: "t16",
    team: "Saskatoon Blades Dev",
    city: "Saskatoon",
    province: "SK",
    birthYear: "2011",
    ageGroup: "U15",
    level: "A",
    dates: "Apr 30 – May 2, 2026",
    arena: "SaskTel Centre",
    cost: "$100",
    status: "Open",
    registrationLink: "https://example.com/register/t16",
    image: "/images/tryout-team.png",
  },
  {
    id: "t17",
    team: "Laval Prédateurs",
    city: "Laval",
    province: "QC",
    birthYear: "2017",
    ageGroup: "U9",
    level: "Local League",
    dates: "May 20, 2026",
    arena: "Place Bell",
    cost: "$60",
    status: "Open",
    registrationLink: "https://example.com/register/t17",
    image: "/images/tryout-team.png",
  },
  {
    id: "t18",
    team: "Kitchener Rangers Minor",
    city: "Kitchener",
    province: "ON",
    birthYear: "2013",
    ageGroup: "U13",
    level: "AAA",
    dates: "May 6–8, 2026",
    arena: "The Aud Kitchener",
    cost: "$225",
    status: "Closing Soon",
    registrationLink: "https://example.com/register/t18",
    image: "/images/tryout-aaa.png",
  },
  {
    id: "t19",
    team: "Moncton Flyers",
    city: "Moncton",
    province: "NB",
    birthYear: "2015",
    ageGroup: "U11",
    level: "A",
    dates: "May 24–25, 2026",
    arena: "Superior Propane Centre",
    cost: "$85",
    status: "Open",
    registrationLink: "https://example.com/register/t19",
    image: "/images/tryout-team.png",
  },
  {
    id: "t20",
    team: "Burnaby Winter Club",
    city: "Burnaby",
    province: "BC",
    birthYear: "2008",
    ageGroup: "U18",
    level: "AAA",
    dates: "Apr 22–24, 2026",
    arena: "Burnaby Winter Club Arena",
    cost: "$260",
    status: "Waitlist",
    registrationLink: "https://example.com/register/t20",
    image: "/images/tryout-girls.png",
  },
]

export const ageGroups = [
  { label: "U7", note: "Initiation" },
  { label: "U9", note: "Novice" },
  { label: "U11", note: "Atom" },
  { label: "U13", note: "Peewee" },
  { label: "U15", note: "Bantam" },
  { label: "U18", note: "Midget" },
  { label: "Junior", note: "16–20" },
  { label: "Adult", note: "18+" },
]

export const levels = [
  { label: "House League", note: "Recreational play", tone: "from-sky-400 to-sky-500" },
  { label: "Select / A", note: "Competitive entry", tone: "from-blue-400 to-blue-500" },
  { label: "AA", note: "Regional elite", tone: "from-blue-500 to-blue-600" },
  { label: "AAA", note: "Top tier", tone: "from-blue-600 to-blue-700" },
  { label: "Junior", note: "Jr. A / B / C", tone: "from-indigo-500 to-indigo-600" },
  { label: "Prep / Showcase", note: "Scout exposure", tone: "from-blue-700 to-indigo-700" },
]

export const regions = [
  { label: "Ontario", teams: 1240 },
  { label: "British Columbia", teams: 680 },
  { label: "Alberta", teams: 720 },
  { label: "Quebec", teams: 910 },
  { label: "Manitoba", teams: 240 },
  { label: "Saskatchewan", teams: 210 },
  { label: "Nova Scotia", teams: 180 },
  { label: "Atlantic", teams: 260 },
]

export const positions = [
  { label: "Forward", note: "C · LW · RW" },
  { label: "Defense", note: "LD · RD" },
  { label: "Goalie", note: "Netminders" },
]

// Canadian provinces/territories. `value` matches the abbreviation stored in
// the Tryouts table's `province` column.
export const provinces = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
]

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

/**
 * Best-effort parse of a tryout's start date from its free-form `dates` string
 * (e.g. "Apr 12–14, 2026", "aug 18-20 2026", "May 2, 2026"). Returns null when
 * the string can't be confidently parsed, so callers can choose to keep it.
 */
export function parseTryoutStartDate(dates: string): Date | null {
  if (!dates) return null
  const lower = dates.toLowerCase()
  const yearMatch = lower.match(/\b(20\d{2})\b/)
  const monthMatch = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/)
  if (!yearMatch || !monthMatch) return null
  const dayMatch = lower.match(/\b(\d{1,2})\b/)
  const year = Number(yearMatch[1])
  const month = MONTH_INDEX[monthMatch[1]]
  const day = dayMatch ? Number(dayMatch[1]) : 1
  const parsed = new Date(year, month, day)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export type CoachCategory = {
  slug: string
  title: string
  blurb: string
  coaches: number
  from: string
  image: string
}

export type TryoutDetail = {
  id: string
  team: string
  city: string
  province: string
  birthYear: string
  ageGroup: string
  level: string
  dates: string
  arena: string
  cost: string
  status: TryoutListing["status"]
  registrationLink: string
  image: string
  title?: string
  rating?: number
  reviews?: number
}

// Approximate birth year from an age group label for featured listings.
const ageGroupBirthYear: Record<string, string> = {
  U7: "2019",
  U9: "2017",
  U11: "2015",
  U13: "2013",
  U15: "2011",
  U18: "2008",
  Junior: "2006",
  Adult: "2000",
}

export function getTryoutById(id: string): TryoutDetail | undefined {
  const listing = tryouts.find((t) => t.id === id)
  if (listing) {
    return { ...listing, title: `${listing.level} Tryouts` }
  }

  const featured = featuredTryouts.find((t) => t.id === id)
  if (featured) {
    return {
      id: featured.id,
      team: featured.org,
      city: featured.city,
      province: featured.province,
      birthYear: ageGroupBirthYear[featured.age] ?? "—",
      ageGroup: featured.age,
      level: featured.level,
      dates: featured.date,
      arena: "Arena TBA",
      cost: featured.price,
      status: featured.spotsLeft <= 3 ? "Closing Soon" : "Open",
      registrationLink: `https://example.com/register/${featured.id}`,
      image: featured.image,
      title: featured.title,
      rating: featured.rating,
      reviews: featured.reviews,
    }
  }

  return undefined
}

export const coachCategories: CoachCategory[] = [
  {
    slug: "skills",
    title: "Skills Coaches",
    blurb: "Stickhandling, shooting & hockey IQ development.",
    coaches: 320,
    from: "$60/hr",
    image: "/images/coach-skills.png",
  },
  {
    slug: "skating",
    title: "Skating Coaches",
    blurb: "Power skating, edges, and explosive acceleration.",
    coaches: 210,
    from: "$70/hr",
    image: "/images/coach-skating.png",
  },
  {
    slug: "goalie",
    title: "Goalie Coaches",
    blurb: "Positioning, tracking, and rebound control.",
    coaches: 145,
    from: "$80/hr",
    image: "/images/coach-goalie.png",
  },
  {
    slug: "off-ice",
    title: "Off-Ice Training",
    blurb: "Strength, speed, and injury-proof conditioning.",
    coaches: 190,
    from: "$50/hr",
    image: "/images/coach-offict.png",
  },
  {
    slug: "camps",
    title: "Camps",
    blurb: "Multi-day skills camps and pre-tryout prep.",
    coaches: 85,
    from: "$299",
    image: "/images/coach-camps.png",
  },
]
