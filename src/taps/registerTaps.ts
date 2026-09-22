import type { Grok } from '@owebeeone/grip-react';
import { registerSimpleAtoms } from './simpleAtoms';
import { AuthTap } from './authTap';
import { DashboardTap } from './dashboardTap';
import { ProfileTap } from './profileTap';
import { GameTap } from './gameTap';

/** Wires every controller tap together and registers them with `grok`. Called once at bootstrap. */
export function registerAllTaps(grok: Grok): void {
  const atoms = registerSimpleAtoms(grok);

  const dashboardTap = new DashboardTap(atoms.authFormDifficulty.get());
  const profileTap = new ProfileTap();

  const gameTap = new GameTap({
    currentView: atoms.currentView,
    mistakeLimit: atoms.mistakeLimit,
    autoCleanNotes: atoms.autoCleanNotes,
    bestTimeFor: (difficulty) => dashboardTap.bestTimeFor(difficulty),
    onGameWon: (difficulty, timeSec, mistakes) => {
      dashboardTap.recordCompletion(difficulty, timeSec);
      profileTap.appendCompletion(difficulty, timeSec, mistakes, 'won');
    },
    onGameAbandoned: (difficulty, timeSec, mistakes) => {
      profileTap.appendCompletion(difficulty, timeSec, mistakes, 'abandoned');
    },
  });

  const authTap = new AuthTap({
    authMode: atoms.authMode,
    formEmail: atoms.authFormEmail,
    formPassword: atoms.authFormPassword,
    formDisplayName: atoms.authFormDisplayName,
    formDifficulty: atoms.authFormDifficulty,
    currentView: atoms.currentView,
    onSignedIn: (userId, defaultDifficulty) => {
      dashboardTap.refresh(userId, defaultDifficulty);
      profileTap.refresh(userId);
    },
    onSignedOut: () => {
      // Nothing further to reset — DashboardTap/ProfileTap naturally refresh on next sign-in.
    },
  });

  grok.registerTap(authTap);
  grok.registerTap(dashboardTap);
  grok.registerTap(profileTap);
  grok.registerTap(gameTap);
}
