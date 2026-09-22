import { useGrip } from '@owebeeone/grip-react';
import type { HistoryState, InputMode } from '../types';
import {
  GAME_CLEAR_CELL,
  GAME_HISTORY,
  GAME_REDO,
  GAME_SET_INPUT_MODE,
  GAME_UNDO,
  INPUT_MODE,
  SELECTED_CELL,
} from '../grips';
import { EraserIcon, PenIcon, PencilIcon, RedoIcon, UndoIcon } from './icons';

export default function Toolbar() {
  const inputMode = useGrip(INPUT_MODE) as InputMode;
  const selectedCell = useGrip(SELECTED_CELL);
  const history = useGrip(GAME_HISTORY) as HistoryState;
  const setInputMode = useGrip(GAME_SET_INPUT_MODE);
  const undo = useGrip(GAME_UNDO);
  const redo = useGrip(GAME_REDO);
  const clearCell = useGrip(GAME_CLEAR_CELL);

  return (
    <div className="toolbar">
      <div className="mode-toggle" role="group" aria-label="Input mode">
        <button
          type="button"
          className={inputMode === 'normal' ? 'active' : ''}
          aria-pressed={inputMode === 'normal'}
          onClick={() => setInputMode?.('normal')}
        >
          <PenIcon /> Pen
        </button>
        <button
          type="button"
          className={inputMode === 'notes' ? 'active' : ''}
          aria-pressed={inputMode === 'notes'}
          onClick={() => setInputMode?.('notes')}
        >
          <PencilIcon /> Pencil
        </button>
      </div>
      <div className="toolbar-actions">
        <button type="button" disabled={!history || history.past.length === 0} onClick={() => undo?.()}>
          <UndoIcon /> Undo
        </button>
        <button type="button" disabled={!history || history.future.length === 0} onClick={() => redo?.()}>
          <RedoIcon /> Redo
        </button>
        <button type="button" disabled={selectedCell == null} onClick={() => selectedCell != null && clearCell?.(selectedCell)}>
          <EraserIcon /> Erase
        </button>
      </div>
      <p className="shortcut-hint">
        <kbd>1</kbd>–<kbd>9</kbd> enter · <kbd>Space</kbd> pen/pencil · <kbd>←↑↓→</kbd> move · <kbd>⌫</kbd> erase ·{' '}
        <kbd>⌘Z</kbd> undo
      </p>
    </div>
  );
}
