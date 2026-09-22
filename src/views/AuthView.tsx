import { useGrip, useGripSetter, useGripState, useTextGrip } from '@owebeeone/grip-react';
import { DIFFICULTIES, type Difficulty } from '../engine/sudoku';
import {
  AUTH_BUSY,
  AUTH_ERROR,
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
  AUTH_SUBMIT,
} from '../grips';

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  insane: 'Insane',
};

export default function AuthView() {
  const mode = useGrip(AUTH_MODE);
  const busy = useGrip(AUTH_BUSY);
  const error = useGrip(AUTH_ERROR);
  const setMode = useGripSetter(AUTH_MODE_TAP);
  const submit = useGrip(AUTH_SUBMIT);

  const email = useTextGrip(AUTH_FORM_EMAIL, AUTH_FORM_EMAIL_TAP);
  const password = useTextGrip(AUTH_FORM_PASSWORD, AUTH_FORM_PASSWORD_TAP);
  const displayName = useTextGrip(AUTH_FORM_DISPLAY_NAME, AUTH_FORM_DISPLAY_NAME_TAP);
  const [difficulty, setDifficulty] = useGripState(AUTH_FORM_DIFFICULTY, AUTH_FORM_DIFFICULTY_TAP);

  return (
    <div className="centered-page">
      <form
        className="auth-card"
        onSubmit={(e) => {
          e.preventDefault();
          submit?.();
        }}
      >
        <h1>Grip Sudoku</h1>
        <p className="auth-subtitle">A Sudoku SPA where every pixel of state lives in a grip.</p>

        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Sign In
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <label>
          Email
          <input type="email" autoComplete="email" placeholder="demo@gripsudoku.app" {...email} />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" placeholder="anything works for the demo" {...password} />
        </label>

        {mode === 'register' && (
          <>
            <label>
              Display name
              <input type="text" autoComplete="nickname" placeholder="Your name" {...displayName} />
            </label>
            <fieldset className="difficulty-picker">
              <legend>Default difficulty</legend>
              {DIFFICULTIES.map((d) => (
                <label key={d} className={difficulty === d ? 'active' : ''}>
                  <input type="radio" name="difficulty" checked={difficulty === d} onChange={() => setDifficulty(d)} />
                  {DIFFICULTY_LABEL[d]}
                </label>
              ))}
            </fieldset>
          </>
        )}

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <p className="auth-hint">
          Demo account: <code>demo@gripsudoku.app</code> / any password.
        </p>
      </form>
    </div>
  );
}
