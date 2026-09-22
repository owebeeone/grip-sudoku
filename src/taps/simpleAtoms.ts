/**
 * Standalone UI atoms: plain state a component writes directly (form
 * fields, toggles, which screen/tab is showing). See grips.ts for which
 * grips belong here vs. which are owned by a domain controller tap.
 */
import { createAtomValueTap, type Tap, type Grok } from '@owebeeone/grip-react';
import {
  AUTH_FORM_DIFFICULTY,
  AUTH_FORM_DIFFICULTY_TAP,
  AUTH_FORM_DISPLAY_NAME,
  AUTH_FORM_DISPLAY_NAME_TAP,
  AUTH_FORM_EMAIL,
  AUTH_FORM_EMAIL_TAP,
  AUTH_FORM_PASSWORD,
  AUTH_FORM_PASSWORD_TAP,
  AUTH_MODE,
  AUTH_MODE_TAP,
  AUTO_CLEAN_NOTES,
  AUTO_CLEAN_NOTES_TAP,
  CONFLICT_HIGHLIGHT_ENABLED,
  CONFLICT_HIGHLIGHT_ENABLED_TAP,
  CURRENT_VIEW,
  CURRENT_VIEW_TAP,
  MISTAKE_LIMIT,
  MISTAKE_LIMIT_TAP,
  PROFILE_ACTIVE_TAB,
  PROFILE_ACTIVE_TAB_TAP,
} from '../grips';

/** Registers every standalone atom and returns the tap instances other controller taps depend on. */
export function registerSimpleAtoms(grok: Grok) {
  const currentView = createAtomValueTap(CURRENT_VIEW, { handleGrip: CURRENT_VIEW_TAP });
  const authMode = createAtomValueTap(AUTH_MODE, { handleGrip: AUTH_MODE_TAP });
  const authFormEmail = createAtomValueTap(AUTH_FORM_EMAIL, { handleGrip: AUTH_FORM_EMAIL_TAP });
  const authFormPassword = createAtomValueTap(AUTH_FORM_PASSWORD, { handleGrip: AUTH_FORM_PASSWORD_TAP });
  const authFormDisplayName = createAtomValueTap(AUTH_FORM_DISPLAY_NAME, { handleGrip: AUTH_FORM_DISPLAY_NAME_TAP });
  const authFormDifficulty = createAtomValueTap(AUTH_FORM_DIFFICULTY, { handleGrip: AUTH_FORM_DIFFICULTY_TAP });
  const profileActiveTab = createAtomValueTap(PROFILE_ACTIVE_TAB, { handleGrip: PROFILE_ACTIVE_TAB_TAP });
  const mistakeLimit = createAtomValueTap(MISTAKE_LIMIT, { handleGrip: MISTAKE_LIMIT_TAP });
  const conflictHighlightEnabled = createAtomValueTap(CONFLICT_HIGHLIGHT_ENABLED, {
    handleGrip: CONFLICT_HIGHLIGHT_ENABLED_TAP,
  });
  const autoCleanNotes = createAtomValueTap(AUTO_CLEAN_NOTES, { handleGrip: AUTO_CLEAN_NOTES_TAP });

  const taps: Tap[] = [
    currentView,
    authMode,
    authFormEmail,
    authFormPassword,
    authFormDisplayName,
    authFormDifficulty,
    profileActiveTab,
    mistakeLimit,
    conflictHighlightEnabled,
    autoCleanNotes,
  ] as unknown as Tap[];
  for (const tap of taps) grok.registerTap(tap);

  return {
    currentView,
    authMode,
    authFormEmail,
    authFormPassword,
    authFormDisplayName,
    authFormDifficulty,
    profileActiveTab,
    mistakeLimit,
    conflictHighlightEnabled,
    autoCleanNotes,
  };
}
