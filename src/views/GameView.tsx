import { useGrip } from '@owebeeone/grip-react';
import type { Difficulty } from '../engine/sudoku';
import type { GameStatus } from '../types';
import SudokuGrid from '../components/SudokuGrid';
import NumberPad from '../components/NumberPad';
import Toolbar from '../components/Toolbar';
import VictoryModal from '../components/VictoryModal';
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

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

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

  return (
    <div className="page game-page">
      <header className="game-status-bar">
        <span className={`difficulty-tag tag-${difficulty}`}>{difficulty}</span>
        <span className="game-timer">{formatTime(elapsed)}</span>
        <span className="mistake-counter">
          Mistakes: {mistakes}
          {mistakeLimit != null ? ` / ${mistakeLimit}` : ''}
        </span>
        <div className="game-status-actions">
          <button type="button" onClick={() => pauseToggle?.()}>
            {status === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <button type="button" onClick={() => restart?.()}>
            Restart
          </button>
          <button type="button" onClick={() => exitToDashboard?.()}>
            Exit
          </button>
        </div>
      </header>

      <div className="game-body">
        <SudokuGrid />
        <div className="game-side-panel">
          <Toolbar />
          <NumberPad />
        </div>
      </div>

      {status === 'paused' && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Paused</h2>
            <button type="button" className="primary" onClick={() => pauseToggle?.()}>
              Resume
            </button>
          </div>
        </div>
      )}

      {status === 'lost' && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Out of Mistakes</h2>
            <p className="muted">You hit the mistake limit for this run.</p>
            <div className="victory-actions">
              <button type="button" className="primary" onClick={() => restart?.()}>
                Try Again
              </button>
              <button type="button" onClick={() => exitToDashboard?.()}>
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'won' && <VictoryModal />}
    </div>
  );
}
