import { useGrip } from '@owebeeone/grip-react';
import { DIFFICULTIES } from '../engine/sudoku';
import type { VictorySummary } from '../types';
import { GAME_EXIT_TO_DASHBOARD, GAME_START, VICTORY_SUMMARY } from '../grips';

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VictoryModal() {
  const summary = useGrip(VICTORY_SUMMARY) as VictorySummary | null;
  const startGame = useGrip(GAME_START);
  const exitToDashboard = useGrip(GAME_EXIT_TO_DASHBOARD);

  if (!summary) return null;

  const nextIndex = DIFFICULTIES.indexOf(summary.difficulty) + 1;
  const nextDifficulty = nextIndex < DIFFICULTIES.length ? DIFFICULTIES[nextIndex] : null;

  return (
    <div className="modal-overlay">
      <div className="modal victory-modal">
        <h2>{summary.isNewPersonalBest ? '🏆 New Personal Best!' : 'Puzzle Solved!'}</h2>
        <p className="victory-time">{formatTime(summary.timeSec)}</p>
        <dl className="victory-stats">
          <div>
            <dt>Difficulty</dt>
            <dd>{summary.difficulty}</dd>
          </div>
          <div>
            <dt>Mistakes</dt>
            <dd>{summary.mistakes}</dd>
          </div>
          <div>
            <dt>Previous best</dt>
            <dd>{summary.previousBestSec != null ? formatTime(summary.previousBestSec) : '—'}</dd>
          </div>
        </dl>
        <div className="victory-actions">
          <button type="button" className="primary" onClick={() => startGame?.(summary.difficulty)}>
            Play Again
          </button>
          {nextDifficulty && (
            <button type="button" onClick={() => startGame?.(nextDifficulty)}>
              Increase Difficulty
            </button>
          )}
          <button type="button" onClick={() => exitToDashboard?.()}>
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
