/**
 * Owns the dashboard's read models (profile stats summary + leaderboard)
 * and the difficulty/leaderboard-scope selection. Fetches are triggered
 * explicitly — by AuthTap on sign-in (`refresh`) and by the selection
 * actions here — rather than by a component mounting, so nothing needs a
 * "fetch on mount" effect.
 */
import { MultiAtomValueTap, type Grip, type Tap } from '@owebeeone/grip-react';
import type { Difficulty } from '../engine/sudoku';
import { mockFetchLeaderboard, mockFetchProfileStats } from '../mock/backend';
import type { AsyncState, LeaderboardEntry, LeaderboardScope, ProfileStats } from '../types';
import { DASHBOARD_STATS, LEADERBOARD, LEADERBOARD_SCOPE, SELECTED_DIFFICULTY, SELECT_DIFFICULTY, SELECT_LEADERBOARD_SCOPE } from '../grips';

export class DashboardTap extends MultiAtomValueTap implements Tap {
  static readonly outputs = [
    DASHBOARD_STATS,
    SELECTED_DIFFICULTY,
    LEADERBOARD_SCOPE,
    LEADERBOARD,
    SELECT_DIFFICULTY,
    SELECT_LEADERBOARD_SCOPE,
  ];

  private userId: string | null = null;
  private fetchToken = 0;

  constructor(initialDifficulty: Difficulty) {
    super(
      DashboardTap.outputs,
      new Map<Grip<any>, any>([
        [DASHBOARD_STATS as Grip<any>, { status: 'idle' } satisfies AsyncState<ProfileStats>],
        [SELECTED_DIFFICULTY as Grip<any>, initialDifficulty],
        [LEADERBOARD_SCOPE as Grip<any>, 'weekly' satisfies LeaderboardScope],
        [LEADERBOARD as Grip<any>, { status: 'idle' } satisfies AsyncState<LeaderboardEntry[]>],
      ]),
    );
    this.set(SELECT_DIFFICULTY, (difficulty: Difficulty) => this.selectDifficulty(difficulty));
    this.set(SELECT_LEADERBOARD_SCOPE, (scope: LeaderboardScope) => this.selectLeaderboardScope(scope));
  }

  /** Called by AuthTap right after a successful sign-in. */
  refresh(userId: string, defaultDifficulty: Difficulty): void {
    this.userId = userId;
    this.set(SELECTED_DIFFICULTY, defaultDifficulty);
    this.fetchStats();
    this.fetchLeaderboard();
  }

  recordCompletion(difficulty: Difficulty, timeSec: number): void {
    const current = this.get(DASHBOARD_STATS) as AsyncState<ProfileStats>;
    if (current.status !== 'ready') return;
    const stats = current.data.byDifficulty[difficulty];
    const gamesCompleted = stats.gamesCompleted + 1;
    const bestTimeSec = stats.bestTimeSec == null ? timeSec : Math.min(stats.bestTimeSec, timeSec);
    const avgTimeSec =
      stats.avgTimeSec == null
        ? timeSec
        : Math.round((stats.avgTimeSec * stats.gamesCompleted + timeSec) / gamesCompleted);
    const next: ProfileStats = {
      ...current.data,
      currentStreak: current.data.currentStreak + 1,
      byDifficulty: {
        ...current.data.byDifficulty,
        [difficulty]: { ...stats, gamesCompleted, bestTimeSec, avgTimeSec },
      },
    };
    this.set(DASHBOARD_STATS, { status: 'ready', data: next } satisfies AsyncState<ProfileStats>);
    if (difficulty === this.get(SELECTED_DIFFICULTY)) this.fetchLeaderboard();
  }

  bestTimeFor(difficulty: Difficulty): number | null {
    const current = this.get(DASHBOARD_STATS) as AsyncState<ProfileStats>;
    return current.status === 'ready' ? current.data.byDifficulty[difficulty].bestTimeSec : null;
  }

  private selectDifficulty(difficulty: Difficulty): void {
    if (difficulty === this.get(SELECTED_DIFFICULTY)) return;
    this.set(SELECTED_DIFFICULTY, difficulty);
    this.fetchLeaderboard();
  }

  private selectLeaderboardScope(scope: LeaderboardScope): void {
    if (scope === this.get(LEADERBOARD_SCOPE)) return;
    this.set(LEADERBOARD_SCOPE, scope);
    this.fetchLeaderboard();
  }

  private fetchStats(): void {
    const userId = this.userId;
    if (!userId) return;
    this.set(DASHBOARD_STATS, { status: 'loading' } satisfies AsyncState<ProfileStats>);
    void mockFetchProfileStats(userId).then((data) => {
      if (this.userId !== userId) return;
      this.set(DASHBOARD_STATS, { status: 'ready', data } satisfies AsyncState<ProfileStats>);
    });
  }

  private fetchLeaderboard(): void {
    const token = ++this.fetchToken;
    const difficulty = this.get(SELECTED_DIFFICULTY) as Difficulty;
    const scope = this.get(LEADERBOARD_SCOPE) as LeaderboardScope;
    this.set(LEADERBOARD, { status: 'loading' } satisfies AsyncState<LeaderboardEntry[]>);
    void mockFetchLeaderboard(difficulty, scope).then((data) => {
      if (token !== this.fetchToken) return; // a newer selection superseded this fetch
      this.set(LEADERBOARD, { status: 'ready', data } satisfies AsyncState<LeaderboardEntry[]>);
    });
  }
}
