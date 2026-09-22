import { useGrip, useGripSetter, useGripState } from '@owebeeone/grip-react';
import { DIFFICULTIES, type Difficulty } from '../engine/sudoku';
import type { AsyncState, ProfileStats, RunLogEntry } from '../types';
import { CURRENT_VIEW_TAP, DASHBOARD_STATS, PROFILE_ACTIVE_TAB, PROFILE_ACTIVE_TAB_TAP, PROFILE_RUN_LOGS } from '../grips';

const LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard', insane: 'Insane' };

function formatTime(sec: number | null): string {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ProfileView() {
  const [activeTab, setActiveTab] = useGripState(PROFILE_ACTIVE_TAB, PROFILE_ACTIVE_TAB_TAP);
  const stats = useGrip(DASHBOARD_STATS) as AsyncState<ProfileStats>;
  const runLogs = useGrip(PROFILE_RUN_LOGS) as AsyncState<RunLogEntry[]>;
  const setView = useGripSetter(CURRENT_VIEW_TAP);

  const tab = activeTab ?? 'easy';
  const tabStats = stats.status === 'ready' ? stats.data.byDifficulty[tab] : null;
  const tabLogs = runLogs.status === 'ready' ? runLogs.data.filter((log) => log.difficulty === tab) : [];

  return (
    <div className="page">
      <header className="app-header">
        <h1>Profile & Statistics</h1>
        <button type="button" onClick={() => setView('dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="profile-tabs">
        {DIFFICULTIES.map((d) => (
          <button key={d} type="button" className={tab === d ? 'active' : ''} onClick={() => setActiveTab(d)}>
            {LABEL[d]}
          </button>
        ))}
      </div>

      <section className="panel">
        <h2>{LABEL[tab]} Summary</h2>
        {stats.status !== 'ready' || !tabStats ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="stats-headline">
            <div>
              <span className="stats-number">{tabStats.gamesCompleted}</span>
              <span className="muted">completed</span>
            </div>
            <div>
              <span className="stats-number">{tabStats.gamesAbandoned}</span>
              <span className="muted">abandoned</span>
            </div>
            <div>
              <span className="stats-number">{formatTime(tabStats.bestTimeSec)}</span>
              <span className="muted">best time</span>
            </div>
            <div>
              <span className="stats-number">{formatTime(tabStats.avgTimeSec)}</span>
              <span className="muted">avg time</span>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Run History</h2>
        {runLogs.status !== 'ready' ? (
          <p className="muted">Loading…</p>
        ) : tabLogs.length === 0 ? (
          <p className="muted">No {LABEL[tab].toLowerCase()} runs yet.</p>
        ) : (
          <table className="stats-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Mistakes</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {tabLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.dateIso)}</td>
                  <td>{formatTime(log.timeSec)}</td>
                  <td>{log.mistakes}</td>
                  <td className={log.result === 'won' ? 'result-won' : 'result-abandoned'}>{log.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
