import { useGrip, useGripSetter } from '@owebeeone/grip-react';
import { DIFFICULTIES, type Difficulty } from '../engine/sudoku';
import DifficultyCard from '../components/DifficultyCard';
import StatsSummary from '../components/StatsSummary';
import LeaderboardWidget from '../components/LeaderboardWidget';
import {
  AUTH_SIGN_OUT,
  CURRENT_USER,
  CURRENT_VIEW_TAP,
  DASHBOARD_STATS,
  GAME_DIFFICULTY,
  GAME_RESUME,
  GAME_START,
  GAME_STATUS,
  LEADERBOARD,
  LEADERBOARD_SCOPE,
  SELECTED_DIFFICULTY,
  SELECT_DIFFICULTY,
  SELECT_LEADERBOARD_SCOPE,
} from '../grips';
import type { AsyncState, LeaderboardEntry, LeaderboardScope, ProfileStats } from '../types';

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function DashboardView() {
  const user = useGrip(CURRENT_USER);
  const stats = useGrip(DASHBOARD_STATS) as AsyncState<ProfileStats>;
  const selectedDifficulty = useGrip(SELECTED_DIFFICULTY) as Difficulty;
  const leaderboard = useGrip(LEADERBOARD) as AsyncState<LeaderboardEntry[]>;
  const leaderboardScope = useGrip(LEADERBOARD_SCOPE) as LeaderboardScope;
  const gameStatus = useGrip(GAME_STATUS);
  const gameDifficulty = useGrip(GAME_DIFFICULTY);

  const selectDifficulty = useGrip(SELECT_DIFFICULTY);
  const selectScope = useGrip(SELECT_LEADERBOARD_SCOPE);
  const startGame = useGrip(GAME_START);
  const resumeGame = useGrip(GAME_RESUME);
  const signOut = useGrip(AUTH_SIGN_OUT);
  const setView = useGripSetter(CURRENT_VIEW_TAP);

  const bestTimeFor = (d: Difficulty) => (stats.status === 'ready' ? stats.data.byDifficulty[d].bestTimeSec : null);
  const hasResumableGame = gameStatus === 'playing' || gameStatus === 'paused';

  return (
    <div className="page">
      <header className="app-header">
        <h1>Grip Sudoku</h1>
        <div className="header-actions">
          <span className="muted">{user?.displayName}</span>
          <button type="button" onClick={() => setView('profile')}>
            Profile
          </button>
          <button type="button" onClick={() => signOut?.()}>
            Sign Out
          </button>
        </div>
      </header>

      {hasResumableGame && gameDifficulty && (
        <section className="panel resume-banner">
          <div>
            <strong>Game in progress</strong>
            <span className="muted"> — {gameDifficulty} {gameStatus === 'paused' ? '(paused)' : ''}</span>
          </div>
          <button type="button" className="primary" onClick={() => resumeGame?.()}>
            Resume Game
          </button>
        </section>
      )}

      <section className="panel">
        <h2>Quick Play</h2>
        <div className="difficulty-grid">
          {DIFFICULTIES.map((d) => (
            <DifficultyCard
              key={d}
              difficulty={d}
              selected={d === selectedDifficulty}
              bestTimeSec={bestTimeFor(d)}
              onPlay={() => {
                selectDifficulty?.(d);
                startGame?.(d);
              }}
            />
          ))}
        </div>
      </section>

      <div className="dashboard-columns">
        <StatsSummary stats={stats} />
        <LeaderboardWidget leaderboard={leaderboard} scope={leaderboardScope} onScopeChange={(s) => selectScope?.(s)} />
      </div>

      {stats.status === 'ready' && (
        <p className="muted small">
          Your best {selectedDifficulty} time is {formatTime(bestTimeFor(selectedDifficulty) ?? 0)}.
        </p>
      )}
    </div>
  );
}
