# grip-sudoku coding rules

Repository-specific coding rules for `grip-sudoku`. Adopted from `gryth-ui`'s
`dev-docs/CodingRules.md`.

## State management: no React local state — use exclusively grip

- **Do not use `useState` or `useEffect`** (nor `useRef`/`useReducer`/
  `useMemo`/`useCallback`/`useLayoutEffect`) for application or UI state. All
  state — the board, notes, timer, mistakes, current view, session, stats,
  leaderboard — lives in **grips** (atom taps), so it is inspectable,
  swappable (mock taps today, a real backend later is a provider swap, not a
  consumer rewrite), and persistable.
- Patterns to use instead:
  - **UI state** (selected cell, input mode, which view is showing, form
    fields): a grip + atom tap. Read with `useGrip`/`useGripState`, write via
    the tap handle's `set`/`update`.
  - **DOM side effects** (autofocus, scroll-into-view): a **ref callback**,
    never `useEffect`.
  - **Timers** (the run clock, the time-tick tap): a **tap** that owns the
    interval and publishes to a grip — the component stays pure and just
    reads the grip.
  - **Auto-save / crash recovery**: `GameTap` calls `saveGameSnapshot`
    (`src/persistence/gameStorage.ts`, a thin `localStorage` wrapper) after
    every move and restores it once at construction — a tap-owned side
    effect, not a component one. (The published `@owebeeone/grip-react`
    0.2.0 doesn't yet export the richer `Grok.attachLocalPersistence`
    framework present in the grip-react source tree, hence the hand-rolled
    version here instead of that.)
- This is enforced for all seven hooks: `pnpm lint` bans the calls and
  imports (`eslint.config.js`, `no-restricted-syntax`), and `pnpm test` runs
  `scripts/no-react-state.test.mjs` first, which independently re-scans
  `src/` (comments/strings stripped) and fails on any unapproved use — so a
  locally-disabled lint rule can't sneak one through.

### Approved exceptions

A use site may be explicitly approved. Requirements:

1. A registry entry in `scripts/no-react-state.test.mjs` (`APPROVALS`):
   `{ id, hook, file, reason }`. **Do not add entries without explicit
   project-owner approval**; record the approval in the commit that adds it.
2. A marker on the **same line** as the use (import lines included):
   `/* Approved: useMemo: Approval ID 1 */` — hook, ID, and file must all
   match the registry entry; anything else fails as a forged marker.
3. An `// eslint-disable-next-line no-restricted-syntax` for the lint ban.

When the approved use is removed, remove the registry entry too — a stale
entry fails the test.

## Mock data

The app has no real backend. Everything under `src/mock/` (users, puzzle
bank, leaderboard, stats history) is fixture data served through taps in
`src/taps/` with a small simulated network delay, so the UI exercises the
same loading/async paths a real backend would produce.

## General

- Model new reactive state as grips + taps, not component state.
- Consumers (views/components) never know a source is mocked — they only
  reference grips.
