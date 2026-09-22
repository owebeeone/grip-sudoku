import type { Difficulty } from '../engine/sudoku';

const LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard', insane: 'Insane' };
const BLURB: Record<Difficulty, string> = {
  easy: 'Relaxed solving, gentle logic.',
  medium: 'A fair, classic challenge.',
  hard: 'Requires real deduction.',
  insane: 'Only 22-25 givens. Good luck.',
};

function formatTime(sec: number | null): string {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
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
      <span className={`difficulty-tag tag-${difficulty}`}>{LABEL[difficulty]}</span>
      <p className="difficulty-blurb">{BLURB[difficulty]}</p>
      <p className="difficulty-best">Best: {formatTime(bestTimeSec)}</p>
    </button>
  );
}
