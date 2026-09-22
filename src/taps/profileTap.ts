/**
 * Owns PROFILE_RUN_LOGS. Fetched once per sign-in (via `refresh`, called by
 * AuthTap) and appended to locally after each completed game — the profile
 * view's per-difficulty tab filtering happens client-side over this list.
 */
import { MultiAtomValueTap, type Grip, type Tap } from '@owebeeone/grip-react';
import type { Difficulty } from '../engine/sudoku';
import { mockFetchRunLogs } from '../mock/backend';
import type { AsyncState, RunLogEntry } from '../types';
import { PROFILE_RUN_LOGS } from '../grips';

export class ProfileTap extends MultiAtomValueTap implements Tap {
  static readonly outputs = [PROFILE_RUN_LOGS];

  private userId: string | null = null;

  constructor() {
    super(
      ProfileTap.outputs,
      new Map<Grip<any>, any>([[PROFILE_RUN_LOGS as Grip<any>, { status: 'idle' } satisfies AsyncState<RunLogEntry[]>]]),
    );
  }

  refresh(userId: string): void {
    this.userId = userId;
    this.set(PROFILE_RUN_LOGS, { status: 'loading' } satisfies AsyncState<RunLogEntry[]>);
    void mockFetchRunLogs(userId).then((data) => {
      if (this.userId !== userId) return;
      this.set(PROFILE_RUN_LOGS, { status: 'ready', data } satisfies AsyncState<RunLogEntry[]>);
    });
  }

  appendCompletion(difficulty: Difficulty, timeSec: number, mistakes: number, result: 'won' | 'abandoned'): void {
    const current = this.get(PROFILE_RUN_LOGS) as AsyncState<RunLogEntry[]>;
    if (current.status !== 'ready') return;
    const entry: RunLogEntry = {
      id: `log-${Date.now()}`,
      difficulty,
      dateIso: new Date().toISOString(),
      timeSec,
      mistakes,
      result,
    };
    this.set(PROFILE_RUN_LOGS, { status: 'ready', data: [entry, ...current.data] } satisfies AsyncState<RunLogEntry[]>);
  }
}
