import assert from "node:assert/strict"
import test from "node:test"

import { getScheduleLines } from "../lib/tryout-schedule.ts"

test("keeps multiple tryout sessions as separate complete entries", () => {
  const first = "Fri, Sep 11 · 4:30 PM–5:30 PM · CAA Centre · Rink 1"
  const second = "Sat, Sep 12 · 9:00 AM–10:15 AM · Memorial Arena · Rink B"

  const lines = getScheduleLines(`${first}\n${second}`)

  assert.deepEqual(lines, [first, second])
  assert.match(lines[0], /Fri, Sep 11.*4:30 PM–5:30 PM.*CAA Centre.*Rink 1/)
  assert.match(lines[1], /Sat, Sep 12.*9:00 AM–10:15 AM.*Memorial Arena.*Rink B/)
})

test("keeps a single tryout session unchanged", () => {
  const session = "Sun, Sep 13 · 1:00 PM–2:00 PM · Lakeside Arena · Pad 2"

  assert.deepEqual(getScheduleLines(session), [session])
})
