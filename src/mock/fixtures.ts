import type { DifficultyStats, LeaderboardEntry, ProfileStats, RunLogEntry, User } from '../types';
import { DIFFICULTIES, type Difficulty } from '../engine/sudoku';

/** Pretend "existing account" a visitor can sign in with — any password is accepted (mock backend). */
export const DEMO_USER: User = {
  id: 'user-1',
  email: 'demo@gripsudoku.app',
  displayName: 'Demo Player',
  defaultDifficulty: 'medium',
};

const emptyStats: DifficultyStats = {
  gamesCompleted: 0,
  gamesAbandoned: 0,
  bestTimeSec: null,
  avgTimeSec: null,
};

export function defaultProfileStats(): ProfileStats {
  return {
    currentStreak: 4,
    winRate: 0.82,
    byDifficulty: {
      easy: { gamesCompleted: 18, gamesAbandoned: 1, bestTimeSec: 142, avgTimeSec: 198 },
      medium: { gamesCompleted: 11, gamesAbandoned: 2, bestTimeSec: 301, avgTimeSec: 412 },
      hard: { gamesCompleted: 4, gamesAbandoned: 3, bestTimeSec: 587, avgTimeSec: 690 },
      insane: { ...emptyStats },
    },
  };
}

const FIRST_NAMES = [
  'Ava', 'Kai', 'Mo', 'Priya', 'Theo', 'Nina', 'Sam', 'Ines', 'Leo', 'Zara',
  'Omar', 'Yuki', 'Cleo', 'Finn', 'Rosa',
];

function pseudoRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a * 1103515245 + 12345) & 0x7fffffff;
    return a / 0x7fffffff;
  };
}

/** Deterministic leaderboard fixture so the same scope/difficulty always renders the same rows. */
export function buildLeaderboard(difficulty: Difficulty, scope: 'daily' | 'weekly' | 'allTime'): LeaderboardEntry[] {
  const baseTimeByDifficulty: Record<Difficulty, number> = {
    easy: 95,
    medium: 210,
    hard: 420,
    insane: 780,
  };
  const scopeSpread: Record<typeof scope, number> = { daily: 40, weekly: 90, allTime: 160 } as const;
  const rng = pseudoRandom(difficulty.length * 31 + scope.length * 7 + 11);
  const base = baseTimeByDifficulty[difficulty];
  const spread = scopeSpread[scope];

  const rows = FIRST_NAMES.map((name, i) => ({
    userName: name,
    timeSec: Math.round(base + rng() * spread + i * (spread / FIRST_NAMES.length) * 0.4),
    dateIso: new Date(Date.now() - Math.floor(rng() * 6) * 86_400_000).toISOString(),
  }))
    .sort((a, b) => a.timeSec - b.timeSec)
    .slice(0, 10)
    .map((row, i) => ({
      rank: i + 1,
      userName: row.userName,
      difficulty,
      timeSec: row.timeSec,
      dateIso: row.dateIso,
    }));

  // Slot the demo user in near their personal-best for this difficulty.
  const demoStats = defaultProfileStats().byDifficulty[difficulty];
  if (demoStats.bestTimeSec != null) {
    const demoRow: LeaderboardEntry = {
      rank: 0,
      userName: DEMO_USER.displayName,
      difficulty,
      timeSec: demoStats.bestTimeSec,
      dateIso: new Date().toISOString(),
      isCurrentUser: true,
    };
    const merged = [...rows, demoRow].sort((a, b) => a.timeSec - b.timeSec).slice(0, 10);
    return merged.map((row, i) => ({ ...row, rank: i + 1 }));
  }
  return rows;
}

export function defaultRunLogs(): RunLogEntry[] {
  const logs: RunLogEntry[] = [];
  let id = 0;
  const now = Date.now();
  for (const difficulty of DIFFICULTIES) {
    const stats = defaultProfileStats().byDifficulty[difficulty];
    for (let i = 0; i < stats.gamesCompleted; i++) {
      logs.push({
        id: `log-${id++}`,
        difficulty,
        dateIso: new Date(now - i * 36_00_0000 - difficulty.length * 1_000_000).toISOString(),
        timeSec: Math.round((stats.avgTimeSec ?? 300) * (0.85 + (i % 5) * 0.07)),
        mistakes: i % 4,
        result: 'won',
      });
    }
    for (let i = 0; i < stats.gamesAbandoned; i++) {
      logs.push({
        id: `log-${id++}`,
        difficulty,
        dateIso: new Date(now - (i + 1) * 5_000_000).toISOString(),
        timeSec: Math.round((stats.avgTimeSec ?? 300) * 0.4),
        mistakes: 3,
        result: 'abandoned',
      });
    }
  }
  return logs.sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1));
}
