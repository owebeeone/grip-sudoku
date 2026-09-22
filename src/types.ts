import type { Board, Difficulty } from './engine/sudoku';

/** Common shape for anything backed by a mock async tap (auth, stats, leaderboard). */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: string };

export const ASYNC_IDLE: AsyncState<never> = { status: 'idle' };
export const ASYNC_LOADING: AsyncState<never> = { status: 'loading' };

export interface User {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly defaultDifficulty: Difficulty;
}

export interface DifficultyStats {
  readonly gamesCompleted: number;
  readonly gamesAbandoned: number;
  readonly bestTimeSec: number | null;
  readonly avgTimeSec: number | null;
}

export interface ProfileStats {
  readonly currentStreak: number;
  readonly winRate: number; // 0..1
  readonly byDifficulty: Record<Difficulty, DifficultyStats>;
}

export interface RunLogEntry {
  readonly id: string;
  readonly difficulty: Difficulty;
  readonly dateIso: string;
  readonly timeSec: number;
  readonly mistakes: number;
  readonly result: 'won' | 'abandoned';
}

export type LeaderboardScope = 'daily' | 'weekly' | 'allTime';

export interface LeaderboardEntry {
  readonly rank: number;
  readonly userName: string;
  readonly difficulty: Difficulty;
  readonly timeSec: number;
  readonly dateIso: string;
  readonly isCurrentUser?: boolean;
}

export type InputMode = 'normal' | 'notes';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost';

/** One undo/redo checkpoint: a full board + notes snapshot (cheap enough at 81 cells). */
export interface HistoryEntry {
  readonly board: Board;
  readonly notes: readonly (readonly number[])[];
}

export interface HistoryState {
  readonly past: readonly HistoryEntry[];
  readonly future: readonly HistoryEntry[];
}

export interface VictorySummary {
  readonly difficulty: Difficulty;
  readonly timeSec: number;
  readonly mistakes: number;
  readonly isNewPersonalBest: boolean;
  readonly previousBestSec: number | null;
}

export type ViewName = 'auth' | 'dashboard' | 'game' | 'profile';
