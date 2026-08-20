# Sentinel

A dashboard for browsing and triaging container image vulnerability scan
results — 236,656+ findings across a real scan export, filterable, sortable,
comparable, and searchable in the browser.

Built with React 19, TypeScript, Vite, Redux Toolkit, React Router, and
Headless UI.

## Getting started

```
npm install
npm run dev
```

Opens the Vite dev server (defaults to `http://localhost:5173`).

**Just want to see how it actually feels, not the dev version?**

```
npm run build
npm run preview
```

`npm run dev` is for working on the code — instant reload on every save, at
the cost of running with extra safety checks that make the app itself feel
slower than it really is. `npm run build` then `npm run preview` skips all of
that and serves the real, production-built app, several times faster, just
without the ability to hot-reload while editing it. `preview` on its own
serves whatever was built last, so it has to follow a fresh `build` or it'll
either have nothing to serve or quietly show stale content.

## Scripts

- `npm run dev` — start the dev server.
- `npm run build` — type-checks (`tsc --noEmit`), then produces a production
  build with Vite. Vite itself does not type-check on build, so the type
  check is run first on purpose — a type error should fail the build, not
  ship silently.
- `npm run preview` — serves the production build locally, for checking
  performance against something closer to what actually deploys. Run
  `npm run build` first — `preview` doesn't rebuild, it just serves whatever
  is already in `build/`.
- `npm run typecheck` — `tsc --noEmit` on its own.
- `npm run format` / `npm run format:check` — Prettier, write or check.
- `npm run build:data` — regenerates `public/data/*.json` from the raw scan
  export. Only needed if that source data changes: the generated files are
  committed, so a fresh clone works without ever running this.

## Design decisions

A running log of _why_, not just _what_ — added to as design questions get
talked through, so the reasoning behind a piece of code stays attached to it
instead of living only in someone's memory.

### Why `Vulnerability.id` is the record's array position, not a field from the data

The dataset has no natural key. Verified against the real 236,656-row export:

| Candidate key                                      | Distinct values | Rows involved in a collision |
| -------------------------------------------------- | --------------- | ---------------------------- |
| `cve`                                              | 2,713           | 236,044                      |
| `cve` + `image`                                    | 193,567         | 66,799                       |
| `cve` + `image` + `packageName`                    | 233,033         | 7,040                        |
| `cve` + `image` + `packageName` + `packageVersion` | 236,653         | 6                            |
| all 14 fields                                      | 236,656         | 0                            |

Even the tightest four-field combination still collides on 6 rows (3 pairs)
— and those pairs aren't true duplicates either; they differ in `fixStatus`.
Every row is unique once all 14 fields are counted, but there is no subset of
_real_ fields that's guaranteed unique on its own. So `id` is assigned by the
loader as the record's position in `index.json` — identity has to be given,
not derived.

### Why `index.json` is `{ fields, rows }` instead of an array of objects

Repeating 14 key names on all 236,656 records costs about 37MB — roughly a
third of the file, and enough on its own to push it past GitHub's 100MiB file
limit. Writing the field names once (`fields`) and each record as a bare
values array (`rows`) removes that repetition.

The cost of that choice: a plain array carries no information about what each
position means. That mapping only exists as an assumption shared between the
file's producer (`scripts/build-data.js`) and its reader (`decodeIndex` in
`src/context/vulnerabilitiesContext.tsx`).

### How the decoder guards against that, and where the guard actually ends

`decodeIndex` never hardcodes a column's position. It looks it up by name
every time, via `fields.indexOf(name)` (the `at()` helper), so the producer's
field order can change without every reader needing a matching, coordinated
edit. If a named column is missing entirely, it throws immediately, naming
the missing column.

That covers a reader going stale relative to a producer that changes over
time. It does not cover the producer being internally inconsistent with
itself — `fields` and each row's values are two separately hand-maintained
lists in `build-data.js`, and nothing enforces that they agree. A row shorter
or longer than `fields` previously decoded silently: values after the gap
would shift into the wrong property, all silently mistyped, with no error
until something downstream broke on it.

`decodeIndex` now also checks `row.length !== fields.length` for every row
and throws immediately, naming the row index and both lengths, if they
disagree. What this still can't catch, and can't ever catch from inside the
decoder: a row of the correct length whose values are simply in the wrong
order — e.g. `packageName` and `link` swapped. Both are strings; nothing
about reading the file back can tell a value is in the wrong slot if it's the
right type and the row is the right length. That has to be prevented on the
producer side, in `build-data.js`, not guarded against on read.

### Where state lives, and why

Four different homes, picked per requirement rather than centralising on one:

| State                                        | Home                         | Why                                                |
| -------------------------------------------- | ---------------------------- | -------------------------------------------------- |
| Filters (severity, scope, dates, hide flags) | URL (`useFilters`)           | A filtered view is shareable and survives refresh. |
| Open detail drawer                           | URL (`useActiveFinding`)     | Same reason — a specific finding becomes a link.   |
| Row selection                                | Redux (`features/Selection`) | Must survive navigation to `/compare`.             |
| The dataset                                  | Context                      | Loaded once, read everywhere, never written.       |
| Sort key, modal open, export busy            | Local `useState`             | Nothing outside the page cares.                    |

### Why row selection is Redux, not the URL

Filters and the open finding are both URL state because they're small and
worth sharing — paste the address, someone sees the same filtered view or the
same finding. Selection doesn't fit either reason. Before the 10-item cap
existed (see the Compare crash below), a selection could be arbitrarily large
— up to all 236,656 rows — and there's no reasonable way to fit that many ids
in a query string; that's the real original reason it went into Redux rather
than the URL. The cap makes ten ids technically small enough for a URL today,
but the second reason still holds regardless of the cap: a set of findings
someone is actively comparing isn't a view worth being a shareable link the
way a filtered list or a specific CVE is — it's a working set for the
session, not something a colleague would want to land on.

Redux state also has to stay serialisable, which is why the slice stores
`ids: number[]` rather than the resolved `Vulnerability` objects or a `Set`.
Resolving an id back to its finding costs nothing extra either way — `id` is
the record's position in the decoded array, so it's a single index lookup
(`vulnerabilites[id]`, in `useSelectedFindings`), not a fetch. That lookup
would cost the same whether the ids came from Redux or, hypothetically, the
URL.

### How the table gets O(1) "is this row selected" checks out of an array

The table asks `selectedIds.has(id)` once per rendered row, and with
`react-virtuoso` mounting rows constantly as the list scrolls, that call
happens very often. A `Set.has()` is a constant-time hash lookup; scanning a
plain array with `.includes()` would be linear, so being a Set is what keeps
each of those individual checks cheap.

Getting a Set out of array-backed Redux state without paying to rebuild it
constantly is `selectSelectedIdSet`, in `features/Selection/selectors.ts`:

```ts
export const selectSelectedIdSet = createSelector([selectSelectedIds], (ids) => new Set(ids));
```

`createSelector` memoises on the input array's identity — it only re-runs
`new Set(ids)` when `state.selection.ids` itself has actually changed (a
checkbox ticked or cleared), not on every re-render of the page that happens
to read it (a sort change, a filter change, anything else). Scrolling itself
never reaches this selector at all — `TableVirtuoso` mounts and unmounts rows
using its own internal state, entirely separate from Redux, so it's the
_volume_ of scroll-driven `.has()` calls that makes the Set worth having, not
the trigger for rebuilding it.

### Why `useActiveFinding` is kept separate from `useFilters`

Both write to the URL, but sharing one path would break two specific things.

`useFilters`'s writes are wrapped in `startTransition`, because a filter
change forces a recompute over up to 236k rows, and that work has to be
deprioritised so it doesn't block the UI. Opening a drawer triggers no such
recompute. If it went through the same path, every row click would get
tagged as low-priority for no reason, and could visibly queue behind an
in-flight filter recompute that has nothing to do with it.

`useActiveFinding` calls `setSearchParams` with `{ replace: true }`, so
opening and closing the drawer never adds a stop to browser history — Back
should leave the page, not walk through every finding glanced at.
`useFilters` uses `{ replace: false }`, because a filter change is a real
state worth being able to undo with Back. Merging the two hooks would force
picking one of those behaviours for both, which would be wrong for whichever
one didn't get it.

### Why `applyModalFilters` makes every field's change in one `write()` call

`useSearchParams`'s function form doesn't hand back a live, up-to-the-second
view of the URL. Verified against the installed package itself:

```js
let searchParams = React.useMemo(
  () => getSearchParamsForLocation(location.search, ...),
  [location.search]
);
let setSearchParams = React.useCallback((nextInit, navigateOptions) => {
  const newSearchParams = createSearchParams(
    typeof nextInit === 'function' ? nextInit(new URLSearchParams(searchParams)) : nextInit
  );
  navigate('?' + newSearchParams, navigateOptions);
}, [navigate, searchParams]);
```

`searchParams` is fixed for the whole render, via `useMemo` on
`location.search`. Calling `setSearchParams` more than once in the same
render — before a re-render refreshes that memo — hands every call the exact
same starting point. Each call still saves its own separate result, and only
the last one to actually run survives; the earlier calls' edits are silently
lost. `applyModalFilters` used to call `setSeverities`, `setDateRange`, and
`toggleFilter` separately and hit this directly. The fix isn't a smarter
version of `setSearchParams` — there isn't one — it's making every field's
edit against one shared copy inside a single call, so there's only one save
to begin with.

Separate user interactions don't hit this. A filter click and a later row
click each get their own render in between, so `location.search` — and
`searchParams` with it — is already fresh by the time the next one's handler
runs. The risk is specifically multiple writes inside one handler, which is
why `useFilters` and `useActiveFinding` being triggered from separate click
handlers was never actually at risk of this to begin with.

### The filter modal bug, and the fix

Symptom: clicking Apply left the modal on screen for about a second, with its
numbers blanking out first.

Two things were tangled together. `setIsFilterModalOpen(false)` doesn't close
the modal instantly — it starts a ~150ms fade, and the panel is fully visible
for that whole window. The old code read the modal's live counts off
`isFilterModalOpen`, so the moment that flag flipped, the numbers had nothing
to compute from and went blank — while the modal was still sitting there,
visibly mid-fade. At the same time, the real filtering — a full pass over
236,656 rows — used to kick off in that same instant. JavaScript runs one
thing at a time and finishes what it starts before moving on, so once that
heavy pass began, the browser had no spare moment left to actually paint the
rest of the fade. The animation had been told to start; it just never got
drawn until the heavy work finished, which is what made the modal look stuck.

The fix separates two things that used to share one flag. `isFilterModalVisible`
stays `true` for the entire time the modal is genuinely visible — including
through the closing fade — and only goes `false` once Headless UI's
`afterLeave` fires, the one reliable signal that the fade has actually
finished. The modal's counts now follow this flag instead of
`isFilterModalOpen`, so they show real numbers all the way through the close.

The heavy filtering moved too — out of the click handler entirely, into
`afterLeave`. Clicking Apply doesn't call anything filtering-related; it only
stashes the chosen filters on a ref and starts the modal closing:

```ts
onApply={() => {
  applyOnCloseRef.current = draftFilters;
  setIsFilterModalOpen(false);
}}
```

`afterLeave` — which only fires once the fade is truly over — is where the
real chain begins:

```ts
afterLeave={() => {
  setIsFilterModalVisible(false);
  const toApply = applyOnCloseRef.current;
  if (!toApply) return;
  applyOnCloseRef.current = null;
  applyModalFilters(toApply);
}}
```

The ref exists because Cancel, Escape, and clicking the backdrop all trigger
`afterLeave` too, but only Apply should actually commit anything. An empty
ref means "closed without applying," and the function just returns.

### How clicking Apply actually reaches the 236k-row filter

Nothing in `onApply` or `afterLeave` calls `filterData` directly. That call
sits three hops further downstream, and it happens implicitly rather than as
a direct instruction tied to the click.

`applyModalFilters` doesn't filter anything either — it writes the chosen
values into the URL's query string. That URL change is what causes React
Router to update, which causes `VulnerabilityList` to re-render. During that
re-render, `useFilters()` reads the URL again and comes back with new values
for whichever fields actually changed. Those values are exactly what
`filterData`'s `useMemo` is watching:

```ts
const visible = useMemo(
  () => filterData(vulnerabilites, { group, repo, ... }),
  [vulnerabilites, group, repo, hideManuallyCleared, hideAiCleared, severities, hideUnreviewed, to, from]
);
```

Only when React notices one of those watched values differs from the last
render does it actually call `filterData` — the one line in the whole chain
that touches all 236,656 rows, and it's all-or-nothing: even a single changed
value (one severity checkbox) throws away the old result and rechecks every
row against every condition again, not just the part that changed.

So the real path from a click to the expensive work is: ref write →
animation → `afterLeave` → URL write → automatic re-render → `useMemo`
notices a dependency changed → `filterData` runs. Nowhere in that chain is
there a line that says "now go filter" — it falls out of a URL change and a
memoised value noticing its inputs are different.

### Why filtering feels instant sometimes and sluggish other times

Same action every time — ticking a filter — so it looks inconsistent. It
isn't. `filterData` always scans all 236,656 rows no matter what's being
filtered, so filtering itself costs roughly the same regardless: about 4 to
25 milliseconds. What actually swings is `sortFindings` afterward, because it
only sorts whatever `filterData` left standing, and sort cost grows with how
much survives. Critical-only leaves 1,773 rows and sorts in about 1ms.
Unticking "AI Cleared" leaves 224,697 rows and sorts in roughly 180ms. Same
click, same code, 300× more left over to put in order.

### Why a working, measured optimisation isn't in the codebase

Sorting first and filtering second was built and measured at **166ms → 25ms**
per filter change — a genuine, roughly 6x improvement, and provably safe:
`Array.sort` is stable and the comparator ends in `a.id - b.id` with unique
ids, so it's a true total order with no ambiguous cases left for the filter
step to disturb. Verified across 84 combinations of sort keys, directions,
and filter sets — byte-identical row order every time.

It still shipped and then got pulled back out, on purpose. Even with that fix
in place, a pause was still noticeable, which is what prompted digging
further — running the app through an actual production build
(`npm run build` + `npm run preview`) instead of the dev server, rather than
guessing. That's where the real story turned up: the dev server runs React's
development build, which skips minification and deliberately re-runs certain
work twice (via Strict Mode) to help catch bugs early — real, useful during
development, but costing real time that never actually ships. Tested honestly
against a real build, ordinary filtering was already close to instant, and
the optimisation's own remaining benefit shrank enough, in absolute terms,
that it stopped being worth what it cost to keep.

The standard applied here: nothing goes into this codebase that isn't fully,
personally understood — not memorised, actually understood well enough to
explain and defend unprompted. The optimisation's correctness rests on a
fairly subtle argument (a stable sort plus a comparator that's a genuine
total order), and once the real problem turned out to be smaller than it
first looked, that subtlety wasn't worth carrying for the reduced benefit
left over. The rule that came out of it: never form a performance opinion
from a dev build — check a real one first, or risk optimising overhead that
was never going to ship anyway.

### Why the same filtering code measures differently in dev versus production

React ships two different versions of itself — development and production —
and which one runs depends entirely on how the app was started, not on
anything in this codebase's own logic. `npm run dev` uses the development
version; `npm run build` swaps in the production one.

The development version runs Strict Mode, deliberately turned on in this app
(`index.tsx`). Strict Mode double-invokes specific categories of function —
component render bodies, and the callbacks passed to hooks like `useMemo`,
`useReducer`, and `useState`'s initialiser — on purpose, to help surface
functions that secretly aren't as side-effect-free as they're supposed to
be. `filterData` and `sortFindings` both run inside a `useMemo`, so they land
squarely in that category: every filter change was quietly running the
236,656-row scan twice, back to back, purely as a dev-mode safety check
nobody was watching for. The development build's extra internal checks and
warnings add further overhead on top of that.

None of it exists in the production build. `npm run build` swaps in React's
production version, where Strict Mode's double-invocation and the extra
internal checks are compiled away entirely — the same `filterData` and
`sortFindings` code runs exactly once, with nothing else attached. That's the
specific answer to "why does dev measure so differently": not that a
production build makes the code itself run faster, but that development mode
was deliberately doing several times the real work, on purpose, to help
catch bugs — and production mode simply isn't doing any of that.

### Why the selection cap lives in the reducer, not just the UI

Selection can be added to two genuinely different ways: `toggleSelected`, one
row's checkbox, and `addSelected`, the bulk "select all" action in the table
header. They have to be separate actions — a bulk add and a single toggle
can't be the same function — and that's exactly why a UI-only cap doesn't
work. Disabling one button once the selection is full has no way to reach a
completely different button's click handler. Someone would have to remember
to separately guard every entry point, and whichever one they forgot — a
future bulk action, a keyboard shortcut, restored session state — would have
no cap at all.

```ts
toggleSelected(state, action: PayloadAction<number>) {
  ...
  if (state.ids.length >= MAX_COMPARABLE) return;
  state.ids.push(action.payload);
},
addSelected(state, action: PayloadAction<number[]>) {
  const next = new Set(state.ids);
  for (const id of action.payload) {
    if (next.size >= MAX_COMPARABLE) break;
    next.add(id);
  }
  state.ids = Array.from(next);
},
```

Both actions enforce the cap themselves, inside the reducer, instead of
relying on whichever UI element happened to call them to have remembered to
check first. The cap travels with the action, not with any particular
button — every existing way of adding to the selection is covered, and so is
any future one, without anyone needing to re-implement the same guard
somewhere new.

### Why the CSV export guards against formula injection

A spreadsheet program doesn't just display CSV cell content — if a cell
starts with `=`, `+`, `-`, or `@`, Excel, Sheets, and LibreOffice all try to
run it as a formula the moment the file opens. That's ordinary behaviour for
a formula someone wrote themselves, but every value in this export came from
somewhere else: package names, advisory text, and links pulled from a
vulnerability scanner, which in turn pulled them from public package
registries and vulnerability feeds. This is a tool that tracks real
attackers, so it matters more here than in most apps — a hostile string
doesn't have to be common, just possible, for "scanner ingested it" to become
"formula running on an analyst's own machine" the moment they open their own
export.

```ts
const FORMULA_PREFIX = /^[=+\-@\t\r]/;
...
const guarded = FORMULA_PREFIX.test(text) ? `'${text}` : text;
```

The check only looks at the very first character — the `^` anchors it — so a
package name like `log4j-core` has a hyphen but not as its first character,
and passes through untouched. Only a cell where the dangerous character
genuinely leads it off gets a single apostrophe prepended, which spreadsheet
programs read as "treat this as literal text" and never display when the
file is opened.

Numbers are exempt, checked before the guard even runs — a real number can't
carry a formula, and prefixing one would force a genuine CVSS score like `-1`
to display as text instead of a usable number.

### Why search stays a plain scan instead of building an index

`searchFindings`, in `src/utils/helpers/search.ts`, checks every row against
the query on every search rather than building a lookup structure once and
querying that instead. That tradeoff was measured, not assumed: an indexed
lookup came out to about 5.7ms per query, against roughly 30ms for the plain
scan — indexing wins, on paper, by about 24ms. But building that index in the
first place costs about 86ms, and it has to be held in memory for the rest of
the session — around 19MB — to keep paying off on every later search.

That 24ms saving is never actually felt. The search input is wrapped in
`useDeferredValue`, so typing itself always updates instantly regardless of
which approach is behind it — only the results list is allowed to lag behind
on a deprioritised render, whether that render takes 30ms or 5.7ms. A saving
that's invisible either way isn't worth 86ms of up-front cost and 19MB held
for the whole session just to occasionally shave a few milliseconds off
something the user was never going to perceive as slow in the first place.

The one honest limitation this leaves in place is `MAX_SCORED = 500`: a very
broad query only ranks the first 500 matches encountered, in dataset order,
rather than scoring and ranking every match across all 236,656 rows. In
theory a better match past row 500 could lose to a weaker one found earlier.
In practice a query broad enough to hit that ceiling is already too broad for
ranking to matter much — the fix for a query like that is narrowing it, not a
smarter scan.

### Why Compare scrolls sideways instead of switching to a table past four findings

The design comfortably shows four findings side by side, but the selection
cap allows up to ten — so the comparison screen has to hold up for six more
than it was designed around. The alternative considered was transposing into
a table once the count passed four: findings as rows, attributes as columns.

Two separate reasons ruled that out. The first is code: one layout with one
rendering path is simpler to build and keep working than switching between
two — a table view is a different component with its own logic, not a
variant of the column view.

The second is visual, and specific to this data. In the column layout, each
attribute is its own row spanning every finding, so row height is scoped to
the attribute — only the Risk Factors row grows tall for a finding with a
long list of factors, and only the Description row grows tall for a long
advisory. Every other row for that same finding — CVE ID, Severity, CVSS —
stays exactly as compact as it would be anywhere else. Transpose that into a
table where each finding is a row spanning all thirteen attributes, and the
tallest cell in that row drags the _entire_ row down with it: a finding with
a long risk-factor list or a long description would balloon its whole row,
pulling every short field next to it — CVE ID, severity — into odd, padded
space it never needed. Keeping attributes as rows avoids that regardless of
how many findings are being compared, which a switch to a table would give
back only for the cases with more than four.

### Two CSS facts behind the pinned "Attribute" column

The label column on the left (CVE ID, Severity, Risk Factors, …) is pinned in
place with `position: sticky; left: 0` while the finding columns scroll past
underneath it. Two things about that cost real debugging time to get right.

`sticky` only controls position, not what's drawn on top of what. A
translucent or transparent pinned cell lets the scrolling columns show
through it as they pass underneath — the very content the pinned column
exists to stay in front of, visible behind its own labels. The fix is a flat,
opaque background:

```css
.surface-sticky {
  background-color: rgb(36 37 94);
}
```

Second, none of the grid rows in `ColumnComparison` use `items-start` (or any
`items-*`), and that's deliberate:

```tsx
{
  /*
  Deliberately no `items-*` on any of these grids, so every cell
  stretches to the full row height. That matters for the pinned column
  specifically: a shrink-wrapped cell paints its opaque fill only as
  tall as its own one-line label, and on a taller row — Location wraps
  to two — the scrolling columns show through underneath it.
*/
}
```

Without an `align-items` override, a grid row's cells stretch to match the
tallest cell in that row by default. `items-start` turns that stretch off,
letting each cell size to only its own content. If the pinned label cell did
that, a row where the Risk Factors column wraps to three lines would leave
the short "Risk Factors" label sized to one line — its opaque fill stopping
there too, with the taller scrolling columns visible underneath the gap
below it. Same failure as the first fact, transparency versus a height
mismatch, so both are guarded against the same way: keep the pinned cell's
fill exactly as tall as the row actually is.

### Why advisory descriptions are fetched separately and lazily, and what `inFlight` guards

Advisory text lives in its own `descriptions.json` — 2.1MB on top of the 5MB
the findings dataset already costs — and it's only ever read by two screens:
the detail drawer, opened one CVE at a time, and Compare. Most sessions never
open either. Bundling it with the main dataset at boot would make every visit
pay that 2.1MB to serve something most visits don't use, so `useDescriptions`
fetches it on demand instead, the first time either screen actually needs it:

```ts
let cache: DescriptionMap | null = null;
let inFlight: Promise<DescriptionMap> | null = null;

function loadDescriptions(): Promise<DescriptionMap> {
  if (cache) return Promise.resolve(cache);

  if (!inFlight) {
    inFlight = fetch(DESCRIPTIONS_URL)
      .then(...)
      .catch((err) => {
        inFlight = null;
        throw err;
      });
  }

  return inFlight;
}
```

`cache` and `inFlight` guard two different moments, not the same one. `cache`
answers "is it already done" — if the fetch already resolved, return the
result immediately, no network call. `inFlight` answers "is it already in
progress" — the gap in time after a fetch has started but before it's
resolved, while `cache` is still `null`. If the drawer opens and Compare
mounts close enough together that both call `loadDescriptions()` inside that
gap, both would see an empty `cache` and, without the `inFlight` check, both
would call `fetch()` — two separate requests for the same 2.1MB file running
at once, each also independently re-running the cleanup pass over all 2,713
entries when it lands. Checking `inFlight` first means the second caller sees
a request already underway and waits on that same promise instead of
starting its own — one fetch, one cleanup pass, no matter how many callers
ask for it inside that window. The `.catch` clears `inFlight` on failure
rather than leaving a rejected promise cached, so the next caller retries
instead of being stuck with a permanently broken cache entry.

### From a Create React App migration to a native-looking Vite setup

The app started on `react-scripts` and moved to Vite. The first pass through
that migration left three compatibility compromises in place, kept
specifically so nothing outside the app itself would notice the switch had
happened. They've since been removed — the sections below cover both what
they were and why, and what replaced them.

**`"type": "module"` used to be deliberately absent from `package.json`.**
Setting it makes Node treat every `.js` file in the project as ESM by
default — and three files were plain CommonJS: `tailwind.config.js`,
`postcss.config.js`, and `scripts/build-data.js`. `require`/`module.exports`
throw under ESM, so with the flag on, all three would have broken
immediately. Rather than rewrite them, the Vite config file was named
`vite.config.mts` instead — the `.mts` extension tells Node and TypeScript to
treat that one file as ESM regardless of the package-level `"type"` field,
which was one file renamed instead of three files rewritten.

That compromise is gone now. `package.json` carries `"type": "module"`, and
all three files were converted — `module.exports` became `export default` in
the Tailwind and PostCSS configs, and `build-data.js` swapped `require('fs')`
/ `require('path')` for `import fs from 'fs'` / `import path from 'path'`,
with `__dirname` (which doesn't exist under ESM) replaced by the standard
`path.dirname(fileURLToPath(import.meta.url))` equivalent. `vite.config.mts`
became `vite.config.ts`, since nothing forces the split anymore.

Because `build-data.js` is the one script that touches real data — it reads
the 389MB raw scan export and produces the three files the whole app runs
on — converting it wasn't treated as a config tidy-up. It was re-run after
the rewrite and its output diffed byte-for-byte against what was already
committed in `public/data/`: `index.json`, `descriptions.json`, and
`meta.json` all came back identical, confirming the ESM version produces
exactly the same data as the CommonJS one did.

**The dev server port and build output folder were also migration
artifacts, now dropped.** `vite.config.mts` used to pin the dev server to
port 3000 (CRA's default, kept so bookmarks and muscle memory still worked)
and the build output to a `build/` folder (Vite's own default is `dist`,
overridden so `.gitignore` and anything expecting `build/` kept working).
Neither override exists anymore — the dev server now runs on Vite's own
default, `5173`, and `npm run build` writes to `dist/`, with `.gitignore`
updated to match. A repo check turned up nothing outside `.gitignore` itself
that hardcoded `build/` or port 3000 — no CI config, no deploy config — so
nothing else needed to change alongside it.

**Vite still does not type-check**, migration or not. It strips TypeScript
types with esbuild during build and never runs `tsc`, unlike `react-scripts`,
which type-checked on every save. Losing that silently would mean a type
error first gets caught in CI, or not at all — so `package.json` still runs
the check explicitly, ahead of the actual build:

```json
"build": "tsc --noEmit && vite build",
"typecheck": "tsc --noEmit"
```

_A note on the numbers usually quoted for this section — dev server startup
in ~236ms, a production build in ~2.4s: those come from earlier notes rather
than a fresh measurement taken alongside this conversion. Both the dev
server and a production build were attempted here, and both failed for an
environment reason unrelated to the app or this change: the machine's
`node_modules` holds a macOS-native binary for Vite's bundler, and the shell
used to check it here runs inside a separate Linux environment that needs a
different one. That's a limitation of the tooling used to verify this, not
something wrong with the project — running either command from a normal
terminal on the machine itself isn't affected, and `tsc --noEmit`, Prettier,
and the `build:data` byte-diff above were all still verified successfully
from here, since none of those touch the native bundler binary._
