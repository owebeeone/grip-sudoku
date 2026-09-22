# Grip Sudoku

**Play it: https://owebeeone.github.io/grip-sudoku/**

A complete Sudoku single-page app — sign in, pick a difficulty, play with
pen and pencil marks, undo/redo, a timer, mistake limits, auto-save, a
dashboard with stats and leaderboards, and a profile with run history —
built as a demonstration of [GRIP](https://github.com/owebeeone/grip-react)
(`@owebeeone/grip-react`).

The point of the demo: **there is no React state in this app.** Not one
`useState`, `useEffect`, `useRef`, `useReducer`, `useMemo`, `useCallback`, or
`useLayoutEffect`. Every value a component renders is read from a *grip*, and
every change goes through a *tap*. That rule is enforced by a lint rule and an
independent test (see [Enforcement](#enforcement)), so it can't quietly erode.

Sign in with `demo@gripsudoku.app` and any password. The backend is mocked —
auth, stats, and leaderboards are fixture data served through taps with a
simulated network delay, so the UI exercises real loading/async paths.

## Running it

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # no-react-state gate, then vitest
pnpm lint
pnpm build
```

Pushes to `main` build and deploy to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## How the grip context graph is set up

GRIP's model, in one breath: a **Grip** is a typed key (`GAME_BOARD: Grip<Board>`),
a **Tap** is a producer that provides one or more grips, a **GripContext** is a
node in a DAG where taps are registered and values are consumed, and the
**Grok** engine resolves, for any `(context, grip)` pair, the closest tap that
provides it. Components subscribe with `useGrip(grip)` and re-render when the
value changes.

### The graph

This app uses the simplest useful topology — everything lives in Grok's
built-in main context:

```
root
 └── main-home               ← every tap is registered here (grok.registerTap)
      └── main-presentation  ← every component reads from here (GripProvider)
```

[`src/runtime.ts`](src/runtime.ts) creates the `GripRegistry`, the `Grok`, and
exposes `grok.mainContext`. [`src/main.tsx`](src/main.tsx) calls
`registerAllTaps(grok)` once, then renders `<GripProvider grok={grok} context={main}>`.
When a component calls `useGrip(GAME_BOARD)`, the resolver walks up from
`main-presentation` to `main-home`, finds `GameTap` as the provider, connects a
drip, and the component receives the live value.

The demo deliberately doesn't use child contexts or parameterised taps — the
only reason to add nesting would be to scope state (e.g. two boards on screen
at once), and a single-board Sudoku doesn't need it. What it *does* show is
how far you get with the two kinds of tap below.

### Two kinds of tap

All grips are declared in [`src/grips.ts`](src/grips.ts), grouped by owner.

**1. Standalone atoms** — plain UI state a component writes directly
([`src/taps/simpleAtoms.ts`](src/taps/simpleAtoms.ts)). Each is a
`createAtomValueTap(VALUE_GRIP, { handleGrip: VALUE_GRIP_TAP })`. The tap
provides *two* grips: the value, and a handle with `get/set/update`. Components
use `useGripState(VALUE, VALUE_TAP)` or `useTextGrip(...)` for form-style
binding. Auth form fields, the current view, the profile tab, and the settings
toggles are all atoms.

**2. Controller taps** — one per domain, each a `MultiAtomValueTap` subclass
that owns a *bundle* of related value grips **and** the action grips (plain
functions) used to change them:

| Tap | Owns | Actions it exposes |
| --- | --- | --- |
| [`AuthTap`](src/taps/authTap.ts) | `CURRENT_USER`, `AUTH_BUSY`, `AUTH_ERROR` | `AUTH_SUBMIT`, `AUTH_SIGN_OUT` |
| [`DashboardTap`](src/taps/dashboardTap.ts) | stats, leaderboard, selected difficulty/scope | `SELECT_DIFFICULTY`, `SELECT_LEADERBOARD_SCOPE` |
| [`ProfileTap`](src/taps/profileTap.ts) | `PROFILE_RUN_LOGS` | — (fed by other taps) |
| [`GameTap`](src/taps/gameTap.ts) | board, notes, history, selection, timer, mistakes, status | `GAME_START`, `GAME_ENTER_DIGIT`, `GAME_UNDO`, `GAME_PAUSE_TOGGLE`, … |
| [`ThemeTap`](src/taps/themeTap.ts) | `THEME` | (atom handle) |

A component never mutates board state; it calls
`useGrip(GAME_ENTER_DIGIT)?.(index, digit)` and `GameTap` applies the rules —
locked clues, pencil-mark toggling, auto-clean of peer notes, mistake counting,
win/loss detection, undo snapshots — then publishes the new values. That keeps
every Sudoku rule in one file instead of smeared across components.

Taps are wired together in [`src/taps/registerTaps.ts`](src/taps/registerTaps.ts)
by passing handles and callbacks at construction: `GameTap` receives the
`CURRENT_VIEW` atom's handle so it can navigate, the `MISTAKE_LIMIT` and
`AUTO_CLEAN_NOTES` handles so it can read settings, and `onGameWon` /
`onGameAbandoned` callbacks that update `DashboardTap` and `ProfileTap`.
`AuthTap` gets an `onSignedIn` callback that tells the dashboard and profile
taps to fetch. No tap imports another tap's *state*; they compose through
handles, which is what makes the mock backend a provider swap rather than a
rewrite.

### Side effects belong to taps, not components

Because `useEffect` is banned, anything that would normally be an effect is
owned by the tap whose state it concerns:

- **Timer** — `GameTap` starts/stops a `setInterval` on play/pause and
  publishes `ELAPSED_SECONDS`.
- **Keyboard shortcuts** — `GameTap` attaches one `document` `keydown` listener
  in its constructor (digits, arrows/WASD, Space for pen/pencil, ⌘Z/⌘Y).
- **Auto-pause on tab blur** — a `visibilitychange` listener, same place.
- **Auto-save / crash recovery** — `GameTap` writes a snapshot to
  `localStorage` after every move ([`src/persistence/gameStorage.ts`](src/persistence/gameStorage.ts))
  and restores it once at construction. Refresh mid-game and the board, timer,
  and undo history come back (paused).
- **Theme** — `ThemeTap` mirrors `THEME` onto `<html data-theme>`, which the
  stylesheet keys its variables off.
- **Animations** — pop-in and shake are pure CSS, restarted by re-keying the
  element from grip values (`LAST_MISTAKE` carries a sequence number for
  exactly this).

### Enforcement

`pnpm lint` bans the seven hooks by `no-restricted-syntax` (calls *and*
imports), and `pnpm test` first runs
[`scripts/no-react-state.test.mjs`](scripts/no-react-state.test.mjs), which
independently scans `src/` with comments and strings stripped, so a locally
disabled lint rule can't sneak one through. An escape hatch exists (an
approval registry plus a same-line marker) but is empty. Full rules in
[`dev-docs/CodingRules.md`](dev-docs/CodingRules.md).

## Layout

```
src/
  engine/       pure Sudoku generator / solver / validator (unit tested)
  grips.ts      every grip, grouped by owning tap
  taps/         AuthTap, DashboardTap, ProfileTap, GameTap, ThemeTap, atoms, wiring
  mock/         fixture data + simulated-latency "backend"
  persistence/  localStorage snapshot for the active game
  views/        Auth, Dashboard, Game, Profile
  components/   board, cells, number pad, toolbar, modals, cards
scripts/        no-react-state gate
dev-docs/       coding rules
```

## Notes on the engine

[`src/engine/sudoku.ts`](src/engine/sudoku.ts) is framework-free: a bitmask
backtracking solver with minimum-remaining-value ordering, a generator that
digs clues out of a solved grid while keeping the solution unique, and helpers
for conflicts and peers. Uniqueness checks are node-budgeted so generation
always terminates quickly even for the sparse "insane" tier, and boards with
already-conflicting givens are rejected up front rather than searched.
