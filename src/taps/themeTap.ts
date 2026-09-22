/**
 * Owns THEME. Mirroring the value onto `<html data-theme>` (which is what
 * the stylesheet keys its variables off) is a DOM side effect, so it lives
 * here in the tap rather than in a component effect. The choice is
 * remembered in localStorage.
 */
import { AtomValueTap } from '@owebeeone/grip-react';
import type { ThemeName } from '../types';
import { THEME, THEME_TAP } from '../grips';

const STORAGE_KEY = 'grip-sudoku:theme';
const THEMES: readonly ThemeName[] = ['paper', 'midnight'];

function loadTheme(): ThemeName {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored as ThemeName) ? (stored as ThemeName) : 'paper';
  } catch {
    return 'paper';
  }
}

function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export class ThemeTap extends AtomValueTap<ThemeName> {
  constructor() {
    const initial = loadTheme();
    super(THEME, initial, { handleGrip: THEME_TAP });
    applyTheme(initial);
  }

  override set(next: ThemeName): void {
    super.set(next);
    applyTheme(next);
  }
}
