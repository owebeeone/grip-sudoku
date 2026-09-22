import { DIFFICULTIES, type Difficulty } from '../engine/sudoku';
import type { AsyncState, ProfileStats } from '../types';

const LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard', insane: 'Insane' };

function formatTime(sec: number | null): string {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function StatsSummary(props: { stats: AsyncState<ProfileStats> }) {
  const { stats } = props;

  if (stats.status === 'idle' || stats.status === 'loading') {
    return (
      <section className="panel">
        <h2>Your Stats</h2>
        <p className="muted">Loading…</p>
      </section>
    );
  }
  if (stats.status === 'error') {
    return (
      <section className="panel">
        <h2>Your Stats</h2>
        <p className="auth-error">{stats.error}</p>
      </section>
    );
  }

  const { data } = stats;
  const totalCompleted = DIFFICULTIES.reduce((sum, d) => sum + data.byDifficulty[d].gamesCompleted, 0);
  const totalAbandoned = DIFFICULTIES.reduce((sum, d) => sum + data.byDifficulty[d].gamesAbandoned, 0);
  const total = totalCompleted + totalAbandoned;
  const winRate = total === 0 ? data.winRate : totalCompleted / total;

  return (
    <section className="panel">
      <h2>Your Stats</h2>
      <div className="stats-headline">
        <div>
          <span className="stats-number">{data.currentStreak}</span>
          <span className="muted">day streak</span>
        </div>
        <div>
          <span className="stats-number">{Math.round(winRate * 100)}%</span>
          <span className="muted">win rate</span>
        </div>
        <div>
          <span className="stats-number">{totalCompleted}</span>
          <span className="muted">completed</span>
        </div>
      </div>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Difficulty</th>
            <th>Best</th>
            <th>Avg</th>
            <th>Played</th>
          </tr>
        </thead>
        <tbody>
          {DIFFICULTIES.map((d) => {
            const s = data.byDifficulty[d];
            return (
              <tr key={d}>
                <td>{LABEL[d]}</td>
                <td>{formatTime(s.bestTimeSec)}</td>
                <td>{formatTime(s.avgTimeSec)}</td>
                <td>
                  {s.gamesCompleted}
                  {s.gamesAbandoned > 0 ? ` (+${s.gamesAbandoned} left)` : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
