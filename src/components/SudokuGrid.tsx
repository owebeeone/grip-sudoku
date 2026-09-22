import { useGrip } from '@owebeeone/grip-react';
import { BOARD_SIZE, type Board, findConflicts, peersOf } from '../engine/sudoku';
import Cell from './Cell';
import {
  CONFLICT_HIGHLIGHT_ENABLED,
  GAME_BOARD,
  GAME_NOTES,
  GAME_PUZZLE,
  GAME_SELECT_CELL,
  SELECTED_CELL,
} from '../grips';

export default function SudokuGrid() {
  const puzzle = useGrip(GAME_PUZZLE) as Board;
  const board = useGrip(GAME_BOARD) as Board;
  const notes = useGrip(GAME_NOTES) as readonly (readonly number[])[];
  const selectedCell = useGrip(SELECTED_CELL);
  const conflictHighlightEnabled = useGrip(CONFLICT_HIGHLIGHT_ENABLED);
  const selectCell = useGrip(GAME_SELECT_CELL);

  if (!board || board.length !== BOARD_SIZE) return null;

  const conflicts = conflictHighlightEnabled ? findConflicts(board) : new Set<number>();
  const crosshair = selectedCell != null ? new Set(peersOf(selectedCell)) : new Set<number>();
  const focusedDigit = selectedCell != null ? board[selectedCell] : 0;

  return (
    <div className="sudoku-grid">
      {board.map((value, index) => (
        <Cell
          key={index}
          index={index}
          value={value}
          isGiven={puzzle[index] !== 0}
          notes={notes[index] ?? []}
          isSelected={selectedCell === index}
          isCrosshair={crosshair.has(index)}
          isSameDigit={focusedDigit !== 0 && value === focusedDigit}
          isConflict={conflicts.has(index)}
          onSelect={(i) => selectCell?.(i)}
        />
      ))}
    </div>
  );
}
