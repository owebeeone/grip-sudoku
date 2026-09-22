import { useGrip } from '@owebeeone/grip-react';
import type { Board } from '../engine/sudoku';
import { GAME_BOARD, GAME_SELECT_DIGIT, SELECTED_DIGIT } from '../grips';
import { CheckIcon } from './icons';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function NumberPad() {
  const board = useGrip(GAME_BOARD) as Board;
  const selectedDigit = useGrip(SELECTED_DIGIT);
  const selectDigit = useGrip(GAME_SELECT_DIGIT);

  const countOf = (d: number) => (board ?? []).filter((v) => v === d).length;

  return (
    <div className="number-pad" role="group" aria-label="Number pad">
      {DIGITS.map((d) => {
        const remaining = Math.max(0, 9 - countOf(d));
        const complete = remaining === 0;
        return (
          <button
            key={d}
            type="button"
            className={`number-pad-btn${selectedDigit === d ? ' active' : ''}${complete ? ' complete' : ''}`}
            disabled={complete}
            aria-pressed={selectedDigit === d}
            aria-label={`${d}, ${remaining} left`}
            onClick={() => selectDigit?.(selectedDigit === d ? null : d)}
          >
            <span className="digit">{d}</span>
            <span className="remaining">{complete ? <CheckIcon /> : `${remaining} left`}</span>
          </button>
        );
      })}
    </div>
  );
}
