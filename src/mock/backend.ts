/**
 * Mock backend: stands in for a real API. Every call resolves after a
 * simulated network delay so the UI exercises the same loading/async paths
 * a real backend would produce. Consumers (taps) never know this isn't a
 * real fetch — swapping this module for `fetch()` calls is the only change
 * a real backend integration would need.
 */
import { DIFFICULTIES, type Difficulty } from '../engine/sudoku';
import type { LeaderboardEntry, LeaderboardScope, ProfileStats, RunLogEntry, User } from '../types';
import { DEMO_USER, buildLeaderboard, defaultProfileStats, defaultRunLogs } from './fixtures';

function delay<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface AuthResult {
  readonly user: User;
}

/** Accepts any non-empty password for the one seeded demo account (mock auth, no real security). */
export async function mockLogin(email: string, password: string): Promise<AuthResult> {
  if (!password) throw new Error('Password is required.');
  if (email.trim().toLowerCase() !== DEMO_USER.email) {
    throw new Error(`No account found for ${email}. Try ${DEMO_USER.email} or register.`);
  }
  return delay({ user: DEMO_USER });
}

export async function mockRegister(
  email: string,
  password: string,
  displayName: string,
  defaultDifficulty: Difficulty,
): Promise<AuthResult> {
  if (!password || password.length < 4) throw new Error('Password must be at least 4 characters.');
  if (!displayName.trim()) throw new Error('Display name is required.');
  const user: User = {
    id: `user-${Date.now()}`,
    email: email.trim().toLowerCase(),
    displayName: displayName.trim(),
    defaultDifficulty,
  };
  return delay({ user });
}

export async function mockFetchProfileStats(_userId: string): Promise<ProfileStats> {
  return delay(defaultProfileStats());
}

export async function mockFetchRunLogs(_userId: string): Promise<RunLogEntry[]> {
  return delay(defaultRunLogs(), 350);
}

export async function mockFetchLeaderboard(
  difficulty: Difficulty,
  scope: LeaderboardScope,
): Promise<LeaderboardEntry[]> {
  return delay(buildLeaderboard(difficulty, scope), 350);
}

export function isKnownDifficulty(value: string): value is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value);
}
