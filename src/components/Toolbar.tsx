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
      <div className="mode-toggle">
        <button type="button" className={inputMode === 'normal' ? 'active' : ''} onClick={() => setInputMode?.('normal')}>
          Normal
        </button>
        <button type="button" className={inputMode === 'notes' ? 'active' : ''} onClick={() => setInputMode?.('notes')}>
          Pencil Notes
        </button>
      </div>
      <div className="toolbar-actions">
        <button type="button" disabled={!history || history.past.length === 0} onClick={() => undo?.()}>
          Undo
        </button>
        <button type="button" disabled={!history || history.future.length === 0} onClick={() => redo?.()}>
          Redo
        </button>
        <button type="button" disabled={selectedCell == null} onClick={() => selectedCell != null && clearCell?.(selectedCell)}>
          Erase
        </button>
      </div>
    </div>
  );
}
