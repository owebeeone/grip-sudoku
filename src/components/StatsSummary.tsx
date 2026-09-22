import { DIFFICULTIES } from '../engine/sudoku';
import { DIFFICULTY_LABEL, formatTime } from '../format';
import type { AsyncState, ProfileStats } from '../types';

export default function StatsSummary(props: { stats: AsyncState<ProfileStats> }) {
  const { stats } = props;

  if (stats.status === 'idle' || stats.status === 'loading') {
    return (
      <section className="panel">
        <h2>Your stats</h2>
        <p className="muted">Loading…</p>
      </section>
    );
  }
  if (stats.status === 'error') {
    return (
      <section className="panel">
        <h2>Your stats</h2>
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
      <h2>Your stats</h2>
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
                <td>{DIFFICULTY_LABEL[d]}</td>
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
