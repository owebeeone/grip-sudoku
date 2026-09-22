import { DIFFICULTY_GIVENS, type Difficulty } from '../engine/sudoku';
import { DIFFICULTY_LABEL, formatTime } from '../format';

const BLURB: Record<Difficulty, string> = {
  easy: 'Relaxed solving, gentle logic.',
  medium: 'A fair, classic challenge.',
  hard: 'Requires real deduction.',
  insane: 'Only 22–25 givens. Good luck.',
};

/**
 * A tiny 9x9 "density" glyph: roughly as many inked cells as the tier gives
 * you as clues, laid out in a fixed pseudo-random pattern so each tier
 * always looks the same. Reads at a glance as "how much help you get".
 */
function DensityPreview(props: { difficulty: Difficulty }) {
  const [min, max] = DIFFICULTY_GIVENS[props.difficulty];
  const givens = Math.round((min + max) / 2);
  const cells: boolean[] = new Array(81).fill(false);
  // Pick `givens` distinct cells deterministically (tiny LCG seeded by tier).
  let picked = 0;
  let x = 5 + props.difficulty.length * 7;
  while (picked < givens) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const i = x % 81;
    if (!cells[i]) {
      cells[i] = true;
      picked++;
    }
  }
  return (
    <svg className="difficulty-preview" viewBox="0 0 45 45" aria-hidden="true">
      <rect x="0.5" y="0.5" width="44" height="44" rx="3" fill="var(--bg-panel)" stroke="var(--border-strong)" />
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={2 + (i % 9) * 4.6 + 0.9}
            y={2 + Math.floor(i / 9) * 4.6 + 0.9}
            width="2.9"
            height="2.9"
            rx="0.6"
            fill={`var(--tag-${props.difficulty})`}
            opacity="0.85"
          />
        ) : null,
      )}
      <g stroke="var(--border-strong)" strokeWidth="0.6" opacity="0.5">
        <line x1="15.8" y1="1" x2="15.8" y2="44" />
        <line x1="29.6" y1="1" x2="29.6" y2="44" />
        <line x1="1" y1="15.8" x2="44" y2="15.8" />
        <line x1="1" y1="29.6" x2="44" y2="29.6" />
      </g>
    </svg>
  );
}

export default function DifficultyCard(props: {
  difficulty: Difficulty;
  selected: boolean;
  bestTimeSec: number | null;
  onPlay: () => void;
}) {
  const { difficulty, selected, bestTimeSec, onPlay } = props;
  return (
    <button type="button" className={`difficulty-card${selected ? ' selected' : ''}`} onClick={onPlay}>
      <span className={`difficulty-tag tag-${difficulty}`}>{DIFFICULTY_LABEL[difficulty]}</span>
      <DensityPreview difficulty={difficulty} />
      <p className="difficulty-blurb">{BLURB[difficulty]}</p>
      <p className="difficulty-best">
        Best <strong>{formatTime(bestTimeSec)}</strong>
      </p>
    </button>
  );
}
