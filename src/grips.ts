/**
 * Every piece of reactive state in the app, declared as grips. Nothing here
 * is React local state — see dev-docs/CodingRules.md. Two shapes:
 *
 *   - Standalone atoms (have a matching `*_TAP` handle grip): plain UI
 *     state a component writes directly with useGripState/useTextGrip
 *     (form fields, toggles, which screen/tab is showing).
 *   - Domain-owned values (no handle grip): produced by one controller tap
 *     (AuthTap, DashboardTap, ProfileTap, GameTap in src/taps/) that also
 *     exposes the *action* grips (functions) components call to change
 *     them, so the rules stay in one place instead of being poked at from
 *     every component that touches the state.
 */
import type { AtomTapHandle } from '@owebeeone/grip-react';
import { defineGrip } from './runtime';
import type { Board, Difficulty } from './engine/sudoku';
import type {
  AsyncState,
  GameStatus,
  HistoryState,
  InputMode,
  LeaderboardEntry,
  LeaderboardScope,
  ProfileStats,
  RunLogEntry,
  User,
  VictorySummary,
  ViewName,
} from './types';

function tapGrip<T>(name: string) {
  return defineGrip<AtomTapHandle<T>>(`${name}.Tap`);
}

// ---- view (standalone atom) --------------------------------------------------------------------
export const CURRENT_VIEW = defineGrip<ViewName>('View.Current', 'auth');
export const CURRENT_VIEW_TAP = tapGrip<ViewName>('View.Current');

// ---- auth: form fields are standalone atoms; session + submit are AuthTap-owned -----------------
export const AUTH_MODE = defineGrip<'login' | 'register'>('Auth.Mode', 'login');
export const AUTH_MODE_TAP = tapGrip<'login' | 'register'>('Auth.Mode');
export const AUTH_FORM_EMAIL = defineGrip<string>('Auth.Form.Email', '');
export const AUTH_FORM_EMAIL_TAP = tapGrip<string>('Auth.Form.Email');
export const AUTH_FORM_PASSWORD = defineGrip<string>('Auth.Form.Password', '');
export const AUTH_FORM_PASSWORD_TAP = tapGrip<string>('Auth.Form.Password');
export const AUTH_FORM_DISPLAY_NAME = defineGrip<string>('Auth.Form.DisplayName', '');
export const AUTH_FORM_DISPLAY_NAME_TAP = tapGrip<string>('Auth.Form.DisplayName');
export const AUTH_FORM_DIFFICULTY = defineGrip<Difficulty>('Auth.Form.Difficulty', 'medium');
export const AUTH_FORM_DIFFICULTY_TAP = tapGrip<Difficulty>('Auth.Form.Difficulty');

export const CURRENT_USER = defineGrip<User | null>('Auth.CurrentUser', null);
export const AUTH_BUSY = defineGrip<boolean>('Auth.Busy', false);
export const AUTH_ERROR = defineGrip<string | null>('Auth.Error', null);
export const AUTH_SUBMIT = defineGrip<() => void>('Auth.Submit');
export const AUTH_SIGN_OUT = defineGrip<() => void>('Auth.SignOut');

// ---- dashboard (DashboardTap-owned) --------------------------------------------------------------
export const DASHBOARD_STATS = defineGrip<AsyncState<ProfileStats>>('Dashboard.Stats', { status: 'idle' });
export const SELECTED_DIFFICULTY = defineGrip<Difficulty>('Dashboard.SelectedDifficulty', 'medium');
export const LEADERBOARD_SCOPE = defineGrip<LeaderboardScope>('Dashboard.LeaderboardScope', 'weekly');
export const LEADERBOARD = defineGrip<AsyncState<LeaderboardEntry[]>>('Dashboard.Leaderboard', { status: 'idle' });

export const SELECT_DIFFICULTY = defineGrip<(difficulty: Difficulty) => void>('Dashboard.SelectDifficulty');
export const SELECT_LEADERBOARD_SCOPE = defineGrip<(scope: LeaderboardScope) => void>('Dashboard.SelectLeaderboardScope');

// ---- profile: active tab is a standalone atom; run logs are ProfileTap-owned --------------------
export const PROFILE_ACTIVE_TAB = defineGrip<Difficulty>('Profile.ActiveTab', 'easy');
export const PROFILE_ACTIVE_TAB_TAP = tapGrip<Difficulty>('Profile.ActiveTab');
export const PROFILE_RUN_LOGS = defineGrip<AsyncState<RunLogEntry[]>>('Profile.RunLogs', { status: 'idle' });

// ---- active game (entirely GameTap-owned) --------------------------------------------------------
export const GAME_STATUS = defineGrip<GameStatus>('Game.Status', 'idle');
export const GAME_DIFFICULTY = defineGrip<Difficulty | null>('Game.Difficulty', null);
export const GAME_PUZZLE = defineGrip<Board>('Game.Puzzle', []);
export const GAME_SOLUTION = defineGrip<Board>('Game.Solution', []);
export const GAME_BOARD = defineGrip<Board>('Game.Board', []);
export const GAME_NOTES = defineGrip<readonly (readonly number[])[]>('Game.Notes', []);
export const GAME_HISTORY = defineGrip<HistoryState>('Game.History', { past: [], future: [] });

export const SELECTED_CELL = defineGrip<number | null>('Game.SelectedCell', null);
export const SELECTED_DIGIT = defineGrip<number | null>('Game.SelectedDigit', null);
export const INPUT_MODE = defineGrip<InputMode>('Game.InputMode', 'normal');

export const MISTAKE_COUNT = defineGrip<number>('Game.MistakeCount', 0);
export const ELAPSED_SECONDS = defineGrip<number>('Game.ElapsedSeconds', 0);
export const VICTORY_SUMMARY = defineGrip<VictorySummary | null>('Game.VictorySummary', null);

// Settings: standalone atoms (Settings panel writes these; GameTap reads their current value).
export const MISTAKE_LIMIT = defineGrip<number | null>('Settings.MistakeLimit', 3);
export const MISTAKE_LIMIT_TAP = tapGrip<number | null>('Settings.MistakeLimit');
export const CONFLICT_HIGHLIGHT_ENABLED = defineGrip<boolean>('Settings.ConflictHighlightEnabled', true);
export const CONFLICT_HIGHLIGHT_ENABLED_TAP = tapGrip<boolean>('Settings.ConflictHighlightEnabled');
export const AUTO_CLEAN_NOTES = defineGrip<boolean>('Settings.AutoCleanNotes', true);
export const AUTO_CLEAN_NOTES_TAP = tapGrip<boolean>('Settings.AutoCleanNotes');

// Game action grips: components call these instead of poking board state directly, keeping all
// Sudoku rules (locked clues, mistake counting, auto-clean notes, win detection, undo/redo) in
// one place — GameTap.
export const GAME_START = defineGrip<(difficulty: Difficulty) => void>('Game.Start');
export const GAME_RESUME = defineGrip<() => void>('Game.Resume');
export const GAME_RESTART = defineGrip<() => void>('Game.Restart');
export const GAME_EXIT_TO_DASHBOARD = defineGrip<() => void>('Game.ExitToDashboard');
export const GAME_PAUSE_TOGGLE = defineGrip<() => void>('Game.PauseToggle');

export const GAME_SELECT_CELL = defineGrip<(index: number) => void>('Game.SelectCell');
export const GAME_SELECT_DIGIT = defineGrip<(digit: number | null) => void>('Game.SelectDigit');
export const GAME_MOVE_SELECTION = defineGrip<(dRow: number, dCol: number) => void>('Game.MoveSelection');
export const GAME_SET_INPUT_MODE = defineGrip<(mode: InputMode) => void>('Game.SetInputMode');
export const GAME_TOGGLE_INPUT_MODE = defineGrip<() => void>('Game.ToggleInputMode');

export const GAME_ENTER_DIGIT = defineGrip<(index: number, digit: number) => void>('Game.EnterDigit');
export const GAME_ENTER_SELECTED_DIGIT = defineGrip<(index: number) => void>('Game.EnterSelectedDigit');
export const GAME_CLEAR_CELL = defineGrip<(index: number) => void>('Game.ClearCell');
export const GAME_UNDO = defineGrip<() => void>('Game.Undo');
export const GAME_REDO = defineGrip<() => void>('Game.Redo');
