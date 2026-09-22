import { useGripState } from '@owebeeone/grip-react';
import { THEME, THEME_TAP } from '../grips';
import { MoonIcon, SunIcon } from './icons';

export default function ThemeToggle() {
  const [theme, setTheme] = useGripState(THEME, THEME_TAP);
  const isPaper = (theme ?? 'paper') === 'paper';
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={isPaper ? 'Switch to midnight theme' : 'Switch to paper theme'}
      title={isPaper ? 'Midnight theme' : 'Paper theme'}
      onClick={() => setTheme(isPaper ? 'midnight' : 'paper')}
    >
      {isPaper ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
