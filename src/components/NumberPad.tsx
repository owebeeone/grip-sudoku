import { useGrip } from '@owebeeone/grip-react';
import type { Board } from '../engine/sudoku';
import { GAME_BOARD, GAME_SELECT_DIGIT, SELECTED_DIGIT } from '../grips';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function NumberPad() {
  const board = useGrip(GAME_BOARD) as Board;
  const selectedDigit = useGrip(SELECTED_DIGIT);
  const selectDigit = useGrip(GAME_SELECT_DIGIT);

  const countOf = (d: number) => (board ?? []).filter((v) => v === d).length;

  return (
    <div className="number-pad">
      {DIGITS.map((d) => {
        const complete = countOf(d) >= 9;
        return (
          <button
            key={d}
            type="button"
            className={`number-pad-btn${selectedDigit === d ? ' active' : ''}${complete ? ' complete' : ''}`}
            disabled={complete}
            onClick={() => selectDigit?.(selectedDigit === d ? null : d)}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}
