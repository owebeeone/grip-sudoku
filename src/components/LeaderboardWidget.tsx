import type { AsyncState, LeaderboardEntry, LeaderboardScope } from '../types';

const SCOPES: { value: LeaderboardScope; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'allTime', label: 'All-time' },
];

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LeaderboardWidget(props: {
  leaderboard: AsyncState<LeaderboardEntry[]>;
  scope: LeaderboardScope;
  onScopeChange: (scope: LeaderboardScope) => void;
}) {
  const { leaderboard, scope, onScopeChange } = props;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Leaderboard</h2>
        <div className="scope-toggle">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={s.value === scope ? 'active' : ''}
              onClick={() => onScopeChange(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {(leaderboard.status === 'idle' || leaderboard.status === 'loading') && <p className="muted">Loading…</p>}
      {leaderboard.status === 'error' && <p className="auth-error">{leaderboard.error}</p>}
      {leaderboard.status === 'ready' && (
        <ol className="leaderboard-list">
          {leaderboard.data.map((row) => (
            <li key={row.rank} className={row.isCurrentUser ? 'current-user' : ''}>
              <span className="rank">#{row.rank}</span>
              <span className="name">{row.userName}</span>
              <span className="time">{formatTime(row.timeSec)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
