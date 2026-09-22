import { useGrip } from '@owebeeone/grip-react';
import type { Difficulty } from '../engine/sudoku';
import type { GameStatus } from '../types';
import SudokuGrid from '../components/SudokuGrid';
import NumberPad from '../components/NumberPad';
import Toolbar from '../components/Toolbar';
import VictoryModal from '../components/VictoryModal';
import ThemeToggle from '../components/ThemeToggle';
import { DIFFICULTY_LABEL, formatTime } from '../format';
import {
  ELAPSED_SECONDS,
  GAME_DIFFICULTY,
  GAME_EXIT_TO_DASHBOARD,
  GAME_PAUSE_TOGGLE,
  GAME_RESTART,
  GAME_STATUS,
  MISTAKE_COUNT,
  MISTAKE_LIMIT,
} from '../grips';

export default function GameView() {
  const status = useGrip(GAME_STATUS) as GameStatus;
  const difficulty = useGrip(GAME_DIFFICULTY) as Difficulty | null;
  const elapsed = useGrip(ELAPSED_SECONDS) as number;
  const mistakes = useGrip(MISTAKE_COUNT) as number;
  const mistakeLimit = useGrip(MISTAKE_LIMIT);
  const pauseToggle = useGrip(GAME_PAUSE_TOGGLE);
  const restart = useGrip(GAME_RESTART);
  const exitToDashboard = useGrip(GAME_EXIT_TO_DASHBOARD);

  if (!difficulty) return null;

  const nearLimit = mistakeLimit != null && mistakes >= mistakeLimit - 1;
  const paused = status === 'paused';

  return (
    <div className="page game-page">
      <header className="game-status-bar">
        <span className={`difficulty-tag tag-${difficulty}`}>{DIFFICULTY_LABEL[difficulty]}</span>
        <span className={`game-timer${paused ? ' paused' : ''}`} aria-live="off">
          {formatTime(elapsed)}
        </span>
        <span className={`mistake-counter${nearLimit ? ' warn' : ''}`}>
          Mistakes
          {mistakeLimit != null ? (
            <span className="pips" aria-label={`${mistakes} of ${mistakeLimit}`}>
              {Array.from({ length: mistakeLimit }, (_, i) => (
                <span key={i} className={`pip${i < mistakes ? ' hit' : ''}`} />
              ))}
            </span>
          ) : (
            <span> {mistakes}</span>
          )}
        </span>
        <div className="game-status-actions">
          <button type="button" onClick={() => pauseToggle?.()}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" onClick={() => restart?.()}>
            Restart
          </button>
          <button type="button" onClick={() => exitToDashboard?.()}>
            Exit
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className={`game-body${paused ? ' blurred' : ''}`}>
        <SudokuGrid />
        <div className="game-side-panel">
          <Toolbar />
          <NumberPad />
        </div>
      </div>

      {paused && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Paused</h2>
            <p className="muted">The board is hidden while you're away.</p>
            <button type="button" className="primary" onClick={() => pauseToggle?.()}>
              Resume
            </button>
          </div>
        </div>
      )}

      {status === 'lost' && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Out of mistakes</h2>
            <p className="muted">You hit the mistake limit for this run.</p>
            <div className="victory-actions">
              <button type="button" className="primary" onClick={() => restart?.()}>
                Try again
              </button>
              <button type="button" onClick={() => exitToDashboard?.()}>
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'won' && <VictoryModal />}
    </div>
  );
}
