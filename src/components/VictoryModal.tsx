import { useGrip } from '@owebeeone/grip-react';
import { DIFFICULTIES } from '../engine/sudoku';
import type { VictorySummary } from '../types';
import { GAME_EXIT_TO_DASHBOARD, GAME_START, VICTORY_SUMMARY } from '../grips';
import { DIFFICULTY_LABEL, formatTime } from '../format';

const CONFETTI_COLORS = ['var(--accent)', 'var(--entered-text)', 'var(--warning)', 'var(--success)', 'var(--danger)'];
const PIECES = 36;

/** Paper confetti: positions/delays are a pure function of the index, so no state is needed. */
function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: PIECES }, (_, i) => {
        const left = ((i * 37) % 100) + (i % 3);
        const delay = ((i * 53) % 90) / 100;
        const duration = 1.8 + ((i * 29) % 80) / 100;
        return (
          <span
            key={i}
            style={{
              left: `${left}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${(i * 47) % 360}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function VictoryModal() {
  const summary = useGrip(VICTORY_SUMMARY) as VictorySummary | null;
  const startGame = useGrip(GAME_START);
  const exitToDashboard = useGrip(GAME_EXIT_TO_DASHBOARD);

  if (!summary) return null;

  const nextIndex = DIFFICULTIES.indexOf(summary.difficulty) + 1;
  const nextDifficulty = nextIndex < DIFFICULTIES.length ? DIFFICULTIES[nextIndex] : null;
  const delta = summary.previousBestSec != null ? summary.timeSec - summary.previousBestSec : null;

  return (
    <div className="modal-overlay">
      <div className="modal victory-modal">
        <Confetti />
        {summary.isNewPersonalBest && <div className="pb-banner">New personal best</div>}
        <h2>{summary.isNewPersonalBest ? 'Record run!' : 'Puzzle solved'}</h2>
        <p className="victory-time">{formatTime(summary.timeSec)}</p>
        <dl className="victory-stats">
          <div>
            <dt>Difficulty</dt>
            <dd>{DIFFICULTY_LABEL[summary.difficulty]}</dd>
          </div>
          <div>
            <dt>Mistakes</dt>
            <dd>{summary.mistakes}</dd>
          </div>
          <div>
            <dt>{delta == null ? 'Previous best' : delta < 0 ? 'Faster by' : 'Behind best'}</dt>
            <dd>{delta == null ? '—' : formatTime(Math.abs(delta))}</dd>
          </div>
        </dl>
        <div className="victory-actions">
          <button type="button" className="primary" onClick={() => startGame?.(summary.difficulty)}>
            Play again
          </button>
          {nextDifficulty && (
            <button type="button" onClick={() => startGame?.(nextDifficulty)}>
              Step up to {DIFFICULTY_LABEL[nextDifficulty]}
            </button>
          )}
          <button type="button" onClick={() => exitToDashboard?.()}>
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
