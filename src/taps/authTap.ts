/**
 * Owns the session: CURRENT_USER, AUTH_BUSY, AUTH_ERROR, and the
 * AUTH_SUBMIT/AUTH_SIGN_OUT actions. Talks to the mock backend (src/mock)
 * so the auth form components never know it isn't real.
 */
import { MultiAtomValueTap, type AtomTapHandle, type Grip, type Tap } from '@owebeeone/grip-react';
import type { Difficulty } from '../engine/sudoku';
import { mockLogin, mockRegister } from '../mock/backend';
import type { ViewName } from '../types';
import {
  AUTH_BUSY,
  AUTH_ERROR,
  AUTH_SIGN_OUT,
  AUTH_SUBMIT,
  CURRENT_USER,
} from '../grips';

export interface AuthTapDeps {
  authMode: AtomTapHandle<'login' | 'register'>;
  formEmail: AtomTapHandle<string>;
  formPassword: AtomTapHandle<string>;
  formDisplayName: AtomTapHandle<string>;
  formDifficulty: AtomTapHandle<Difficulty>;
  currentView: AtomTapHandle<ViewName>;
  onSignedIn: (userId: string, difficulty: Difficulty) => void;
  onSignedOut: () => void;
}

export class AuthTap extends MultiAtomValueTap implements Tap {
  static readonly outputs = [CURRENT_USER, AUTH_BUSY, AUTH_ERROR, AUTH_SUBMIT, AUTH_SIGN_OUT];

  private readonly deps: AuthTapDeps;

  constructor(deps: AuthTapDeps) {
    super(
      AuthTap.outputs,
      new Map<Grip<any>, any>([
        [CURRENT_USER as Grip<any>, null],
        [AUTH_BUSY as Grip<any>, false],
        [AUTH_ERROR as Grip<any>, null],
      ]),
    );
    this.deps = deps;
    this.set(AUTH_SUBMIT, () => void this.submit());
    this.set(AUTH_SIGN_OUT, () => this.signOut());
  }

  private async submit(): Promise<void> {
    const { deps } = this;
    this.set(AUTH_BUSY, true);
    this.set(AUTH_ERROR, null);
    try {
      const mode = deps.authMode.get();
      const email = deps.formEmail.get();
      const password = deps.formPassword.get();
      const result =
        mode === 'login'
          ? await mockLogin(email, password)
          : await mockRegister(email, password, deps.formDisplayName.get(), deps.formDifficulty.get());
      this.set(CURRENT_USER, result.user);
      this.set(AUTH_BUSY, false);
      deps.currentView.set('dashboard');
      deps.onSignedIn(result.user.id, result.user.defaultDifficulty);
    } catch (err) {
      this.set(AUTH_BUSY, false);
      this.set(AUTH_ERROR, err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  private signOut(): void {
    this.set(CURRENT_USER, null);
    this.set(AUTH_ERROR, null);
    this.deps.formPassword.set('');
    this.deps.currentView.set('auth');
    this.deps.onSignedOut();
  }
}
