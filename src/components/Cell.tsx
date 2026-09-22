export interface CellProps {
  index: number;
  value: number;
  isGiven: boolean;
  notes: readonly number[];
  isSelected: boolean;
  isCrosshair: boolean;
  isSameDigit: boolean;
  isConflict: boolean;
  onSelect: (index: number) => void;
}

export default function Cell(props: CellProps) {
  const { index, value, isGiven, notes, isSelected, isCrosshair, isSameDigit, isConflict, onSelect } = props;
  const row = Math.floor(index / 9);
  const col = index % 9;

  const classes = [
    'sudoku-cell',
    isGiven ? 'given' : 'entered',
    isSelected ? 'selected' : '',
    isCrosshair && !isSelected ? 'crosshair' : '',
    isSameDigit && !isSelected ? 'same-digit' : '',
    isConflict ? 'conflict' : '',
    row % 3 === 0 ? 'box-top' : '',
    col % 3 === 0 ? 'box-left' : '',
    row === 8 ? 'box-bottom' : '',
    col === 8 ? 'box-right' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} onClick={() => onSelect(index)}>
      {value !== 0 ? (
        <span className="cell-value">{value}</span>
      ) : notes.length > 0 ? (
        <span className="cell-notes">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => (
            <span key={d} className="cell-note">
              {notes.includes(d) ? d : ''}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
