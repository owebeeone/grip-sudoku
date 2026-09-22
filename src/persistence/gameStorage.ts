/**
 * Auto-save / crash recovery for the active game, backed directly by
 * `localStorage`. `GameTap` calls `saveGameSnapshot` after every move and
 * `loadGameSnapshot` once at construction — this is a tap-owned side
 * effect, not a React effect (see dev-docs/CodingRules.md).
 *
 * (The published `@owebeeone/grip-react` 0.2.0 does not yet export the
 * richer `Grok.attachLocalPersistence` framework that exists in the
 * grip-react source tree, so this is a small hand-rolled equivalent scoped
 * to just the one thing the spec calls out: board, timer, and move
 * history survive a refresh.)
 */
import type { Board, Difficulty } from '../engine/sudoku';
import type { GameStatus, HistoryState } from '../types';

const STORAGE_KEY = 'grip-sudoku:active-game-v1';

export interface GameSnapshot {
  readonly status: GameStatus;
  readonly difficulty: Difficulty;
  readonly puzzle: Board;
  readonly solution: Board;
  readonly board: Board;
  readonly notes: readonly (readonly number[])[];
  readonly history: HistoryState;
  readonly mistakeCount: number;
  readonly elapsedSeconds: number;
}

export function saveGameSnapshot(snapshot: GameSnapshot): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage unavailable (private browsing, quota) — the game simply won't survive a refresh.
  }
}

export function loadGameSnapshot(): GameSnapshot | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameSnapshot;
  } catch {
    return null;
  }
}

export function clearGameSnapshot(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
