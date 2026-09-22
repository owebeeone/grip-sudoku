export interface CellProps {
  index: number;
  value: number;
  isGiven: boolean;
  notes: readonly number[];
  isSelected: boolean;
  isCrosshair: boolean;
  isSameDigit: boolean;
  isConflict: boolean;
  /** Non-null when this cell was the site of the most recent mistake; changes re-key the shake. */
  mistakeSeq: number | null;
  onSelect: (index: number) => void;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function Cell(props: CellProps) {
  const { index, value, isGiven, notes, isSelected, isCrosshair, isSameDigit, isConflict, mistakeSeq, onSelect } = props;
  const row = Math.floor(index / 9);
  const col = index % 9;

  const classes = [
    'sudoku-cell',
    isGiven ? 'given' : 'entered',
    isSelected ? 'selected' : '',
    isCrosshair && !isSelected ? 'crosshair' : '',
    isSameDigit && !isSelected ? 'same-digit' : '',
    isConflict ? 'conflict' : '',
    row % 3 === 0 && row > 0 ? 'box-top' : '',
    col % 3 === 0 && col > 0 ? 'box-left' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Keying the value span by value (and by mistake seq) remounts it, which is what restarts the
  // CSS pop-in / shake animations without any component state.
  const valueKey = `${value}-${mistakeSeq ?? ''}`;

  return (
    <button
      type="button"
      className={classes}
      onClick={() => onSelect(index)}
      aria-label={`Row ${row + 1} column ${col + 1}${value ? `, ${value}` : ', empty'}`}
    >
      {value !== 0 ? (
        <span key={valueKey} className={`cell-value${mistakeSeq != null ? ' shake' : ''}`}>
          {value}
        </span>
      ) : notes.length > 0 ? (
        <span className="cell-notes">
          {DIGITS.map((d) => (
            <span key={d} className="cell-note">
              {notes.includes(d) ? d : ''}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
