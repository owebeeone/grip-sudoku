/**
 * Owns the entire Active Game View: the board, notes, undo/redo, selection,
 * timer, mistakes, and win/pause/restart lifecycle. Every rule (locked
 * clues can't be edited, auto-clean notes on entry, mistake-limit loss,
 * win detection) lives here so components only ever call an action grip —
 * see dev-docs/CodingRules.md.
 */
import { MultiAtomValueTap, type AtomTapHandle, type Grip, type Tap } from '@owebeeone/grip-react';
import {
  BOARD_SIZE,
  type Board,
  type Difficulty,
  findConflicts,
  generatePuzzle,
  isSolved,
  peersOf,
} from '../engine/sudoku';
import type { GameStatus, HistoryEntry, HistoryState, InputMode, VictorySummary, ViewName } from '../types';
import { clearGameSnapshot, loadGameSnapshot, saveGameSnapshot, type GameSnapshot } from '../persistence/gameStorage';
import {
  ELAPSED_SECONDS,
  GAME_BOARD,
  GAME_CLEAR_CELL,
  GAME_DIFFICULTY,
  GAME_ENTER_DIGIT,
  GAME_ENTER_SELECTED_DIGIT,
  GAME_EXIT_TO_DASHBOARD,
  GAME_HISTORY,
  GAME_MOVE_SELECTION,
  GAME_NOTES,
  GAME_PAUSE_TOGGLE,
  GAME_PUZZLE,
  GAME_REDO,
  GAME_RESTART,
  GAME_RESUME,
  GAME_SELECT_CELL,
  GAME_SELECT_DIGIT,
  GAME_SET_INPUT_MODE,
  GAME_SOLUTION,
  GAME_START,
  GAME_STATUS,
  GAME_TOGGLE_INPUT_MODE,
  GAME_UNDO,
  INPUT_MODE,
  LAST_MISTAKE,
  MISTAKE_COUNT,
  SELECTED_CELL,
  SELECTED_DIGIT,
  VICTORY_SUMMARY,
} from '../grips';

const MAX_HISTORY = 100;

export interface GameTapDeps {
  currentView: AtomTapHandle<ViewName>;
  mistakeLimit: AtomTapHandle<number | null>;
  autoCleanNotes: AtomTapHandle<boolean>;
  bestTimeFor: (difficulty: Difficulty) => number | null;
  onGameWon: (difficulty: Difficulty, timeSec: number, mistakes: number) => void;
  onGameAbandoned: (difficulty: Difficulty, timeSec: number, mistakes: number) => void;
}

function emptyNotes(): readonly (readonly number[])[] {
  return Array.from({ length: BOARD_SIZE }, () => [] as readonly number[]);
}

export class GameTap extends MultiAtomValueTap implements Tap {
  static readonly outputs = [
    GAME_STATUS,
    GAME_DIFFICULTY,
    GAME_PUZZLE,
    GAME_SOLUTION,
    GAME_BOARD,
    GAME_NOTES,
    GAME_HISTORY,
    SELECTED_CELL,
    SELECTED_DIGIT,
    INPUT_MODE,
    MISTAKE_COUNT,
    LAST_MISTAKE,
    ELAPSED_SECONDS,
    VICTORY_SUMMARY,
    GAME_START,
    GAME_RESUME,
    GAME_RESTART,
    GAME_EXIT_TO_DASHBOARD,
    GAME_PAUSE_TOGGLE,
    GAME_SELECT_CELL,
    GAME_SELECT_DIGIT,
    GAME_MOVE_SELECTION,
    GAME_SET_INPUT_MODE,
    GAME_TOGGLE_INPUT_MODE,
    GAME_ENTER_DIGIT,
    GAME_ENTER_SELECTED_DIGIT,
    GAME_CLEAR_CELL,
    GAME_UNDO,
    GAME_REDO,
  ];

  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly deps: GameTapDeps;

  constructor(deps: GameTapDeps) {
    super(
      GameTap.outputs,
      new Map<Grip<any>, any>([
        [GAME_STATUS as Grip<any>, 'idle' satisfies GameStatus],
        [GAME_HISTORY as Grip<any>, { past: [], future: [] } satisfies HistoryState],
        [INPUT_MODE as Grip<any>, 'normal' satisfies InputMode],
      ]),
    );
    this.deps = deps;
    this.set(GAME_START, (difficulty: Difficulty) => this.start(difficulty));
    this.set(GAME_RESUME, () => this.resume());
    this.set(GAME_RESTART, () => this.restart());
    this.set(GAME_EXIT_TO_DASHBOARD, () => this.exitToDashboard());
    this.set(GAME_PAUSE_TOGGLE, () => this.pauseToggle());
    this.set(GAME_SELECT_CELL, (index: number) => this.selectCell(index));
    this.set(GAME_SELECT_DIGIT, (digit: number | null) => this.selectDigit(digit));
    this.set(GAME_MOVE_SELECTION, (dRow: number, dCol: number) => this.moveSelection(dRow, dCol));
    this.set(GAME_SET_INPUT_MODE, (mode: InputMode) => this.set(INPUT_MODE, mode));
    this.set(GAME_TOGGLE_INPUT_MODE, () => this.set(INPUT_MODE, this.get(INPUT_MODE) === 'normal' ? 'notes' : 'normal'));
    this.set(GAME_ENTER_DIGIT, (index: number, digit: number) => this.enterDigit(index, digit));
    this.set(GAME_ENTER_SELECTED_DIGIT, (index: number) => {
      const digit = this.get(SELECTED_DIGIT) as number | null;
      if (digit != null) this.enterDigit(index, digit);
    });
    this.set(GAME_CLEAR_CELL, (index: number) => this.clearCell(index));
    this.set(GAME_UNDO, () => this.undo());
    this.set(GAME_REDO, () => this.redo());

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.get(GAME_STATUS) === 'playing') this.pause();
    });
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    this.restore();
  }

  // ---- keyboard shortcuts (global; guarded so typing elsewhere, e.g. the auth form, is unaffected) --

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.get(GAME_STATUS) !== 'playing') return;
    const target = e.target as HTMLElement | null;
    if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;

    const cell = this.get(SELECTED_CELL) as number | null;
    if (e.key >= '1' && e.key <= '9') {
      if (cell != null) this.enterDigit(cell, Number(e.key));
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (cell != null) this.clearCell(cell);
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      this.set(INPUT_MODE, this.get(INPUT_MODE) === 'normal' ? 'notes' : 'normal');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) this.redo();
      else this.undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      this.redo();
      return;
    }
    const arrow: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      w: [-1, 0],
      s: [1, 0],
      a: [0, -1],
      d: [0, 1],
    };
    const delta = arrow[e.key];
    if (delta) {
      e.preventDefault();
      this.moveSelection(delta[0], delta[1]);
    }
  }

  // ---- persistence (auto-save / crash recovery) ---------------------------------------------------

  private restore(): void {
    const snapshot = loadGameSnapshot();
    if (!snapshot || snapshot.status === 'idle') return;
    this.set(GAME_DIFFICULTY, snapshot.difficulty);
    this.set(GAME_PUZZLE, snapshot.puzzle);
    this.set(GAME_SOLUTION, snapshot.solution);
    this.set(GAME_BOARD, snapshot.board);
    this.set(GAME_NOTES, snapshot.notes);
    this.set(GAME_HISTORY, snapshot.history);
    this.set(MISTAKE_COUNT, snapshot.mistakeCount);
    this.set(ELAPSED_SECONDS, snapshot.elapsedSeconds);
    // A refresh always lands paused — the timer never silently resumes in the background.
    this.set(GAME_STATUS, snapshot.status === 'playing' ? 'paused' : snapshot.status);
  }

  private persist(): void {
    const status = this.get(GAME_STATUS) as GameStatus;
    if (status === 'idle') {
      clearGameSnapshot();
      return;
    }
    const snapshot: GameSnapshot = {
      status,
      difficulty: this.get(GAME_DIFFICULTY) as Difficulty,
      puzzle: this.get(GAME_PUZZLE) as Board,
      solution: this.get(GAME_SOLUTION) as Board,
      board: this.get(GAME_BOARD) as Board,
      notes: this.get(GAME_NOTES) as readonly (readonly number[])[],
      history: this.get(GAME_HISTORY) as HistoryState,
      mistakeCount: this.get(MISTAKE_COUNT) as number,
      elapsedSeconds: this.get(ELAPSED_SECONDS) as number,
    };
    saveGameSnapshot(snapshot);
  }

  // ---- lifecycle -------------------------------------------------------------------------------

  private start(difficulty: Difficulty): void {
    this.abandonIfInProgress();
    const { puzzle, solution } = generatePuzzle(difficulty);
    this.set(GAME_DIFFICULTY, difficulty);
    this.set(GAME_PUZZLE, puzzle);
    this.set(GAME_SOLUTION, solution);
    this.set(GAME_BOARD, puzzle);
    this.set(GAME_NOTES, emptyNotes());
    this.set(GAME_HISTORY, { past: [], future: [] } satisfies HistoryState);
    this.set(SELECTED_CELL, null);
    this.set(SELECTED_DIGIT, null);
    this.set(INPUT_MODE, 'normal');
    this.set(MISTAKE_COUNT, 0);
    this.set(LAST_MISTAKE, null);
    this.set(ELAPSED_SECONDS, 0);
    this.set(VICTORY_SUMMARY, null);
    this.set(GAME_STATUS, 'playing');
    this.deps.currentView.set('game');
    this.startTimer();
    this.persist();
  }

  private resume(): void {
    if (this.get(GAME_STATUS) === 'idle') return;
    this.deps.currentView.set('game');
  }

  private restart(): void {
    const difficulty = this.get(GAME_DIFFICULTY) as Difficulty | null;
    if (!difficulty) return;
    this.abandonIfInProgress();
    const puzzle = this.get(GAME_PUZZLE) as Board;
    this.set(GAME_BOARD, puzzle);
    this.set(GAME_NOTES, emptyNotes());
    this.set(GAME_HISTORY, { past: [], future: [] } satisfies HistoryState);
    this.set(SELECTED_CELL, null);
    this.set(SELECTED_DIGIT, null);
    this.set(MISTAKE_COUNT, 0);
    this.set(LAST_MISTAKE, null);
    this.set(ELAPSED_SECONDS, 0);
    this.set(VICTORY_SUMMARY, null);
    this.set(GAME_STATUS, 'playing');
    this.startTimer();
    this.persist();
  }

  private exitToDashboard(): void {
    if (this.get(GAME_STATUS) === 'playing') this.pause();
    this.deps.currentView.set('dashboard');
  }

  private pauseToggle(): void {
    if (this.get(GAME_STATUS) === 'playing') this.pause();
    else if (this.get(GAME_STATUS) === 'paused') this.unpause();
  }

  private pause(): void {
    this.stopTimer();
    this.set(GAME_STATUS, 'paused');
    this.persist();
  }

  private unpause(): void {
    this.set(GAME_STATUS, 'playing');
    this.startTimer();
    this.persist();
  }

  private abandonIfInProgress(): void {
    const status = this.get(GAME_STATUS) as GameStatus;
    const difficulty = this.get(GAME_DIFFICULTY) as Difficulty | null;
    if (!difficulty || (status !== 'playing' && status !== 'paused')) return;
    this.stopTimer();
    this.deps.onGameAbandoned(difficulty, this.get(ELAPSED_SECONDS) as number, this.get(MISTAKE_COUNT) as number);
  }

  // ---- selection ---------------------------------------------------------------------------------

  private selectCell(index: number): void {
    this.set(SELECTED_CELL, index);
    const digit = this.get(SELECTED_DIGIT) as number | null;
    // Digit-first workflow: a digit is already picked, so clicking a cell fills it immediately.
    if (digit != null && this.get(GAME_STATUS) === 'playing') this.enterDigit(index, digit);
  }

  private selectDigit(digit: number | null): void {
    this.set(SELECTED_DIGIT, digit);
    // Cell-first workflow: a cell is already selected, so picking a digit fills it immediately.
    const cell = this.get(SELECTED_CELL) as number | null;
    if (digit != null && cell != null && this.get(GAME_STATUS) === 'playing') this.enterDigit(cell, digit);
  }

  private moveSelection(dRow: number, dCol: number): void {
    const current = (this.get(SELECTED_CELL) as number | null) ?? 0;
    const row = Math.min(8, Math.max(0, Math.floor(current / 9) + dRow));
    const col = Math.min(8, Math.max(0, (current % 9) + dCol));
    this.set(SELECTED_CELL, row * 9 + col);
  }

  // ---- editing -------------------------------------------------------------------------------------

  private enterDigit(index: number, digit: number): void {
    if (this.get(GAME_STATUS) !== 'playing') return;
    const puzzle = this.get(GAME_PUZZLE) as Board;
    if (puzzle[index] !== 0) return; // locked clue
    const notesMode = this.get(INPUT_MODE) === 'notes';
    if (!notesMode && (this.get(GAME_BOARD) as Board)[index] === digit) return; // already this value

    this.pushHistory();
    const board = (this.get(GAME_BOARD) as Board).slice();
    const notes = (this.get(GAME_NOTES) as readonly (readonly number[])[]).slice();

    if (notesMode) {
      const cellNotes = notes[index];
      notes[index] = cellNotes.includes(digit) ? cellNotes.filter((d) => d !== digit) : [...cellNotes, digit].sort();
      this.set(GAME_NOTES, notes);
      this.persist();
      return;
    }

    board[index] = digit;
    notes[index] = [];
    if (this.deps.autoCleanNotes.get()) {
      for (const peer of peersOf(index)) {
        if (notes[peer].includes(digit)) notes[peer] = notes[peer].filter((d) => d !== digit);
      }
    }
    this.set(GAME_BOARD, board);
    this.set(GAME_NOTES, notes);

    const solution = this.get(GAME_SOLUTION) as Board;
    if (digit !== solution[index]) {
      const mistakes = (this.get(MISTAKE_COUNT) as number) + 1;
      this.set(MISTAKE_COUNT, mistakes);
      this.set(LAST_MISTAKE, { index, digit, seq: mistakes });
      const limit = this.deps.mistakeLimit.get();
      if (limit != null && mistakes >= limit) {
        this.lose();
        return;
      }
    }
    if (isSolved(board) && findConflicts(board).size === 0) {
      this.win();
      return;
    }
    this.persist();
  }

  private clearCell(index: number): void {
    if (this.get(GAME_STATUS) !== 'playing') return;
    const puzzle = this.get(GAME_PUZZLE) as Board;
    if (puzzle[index] !== 0) return;
    this.pushHistory();
    const board = (this.get(GAME_BOARD) as Board).slice();
    board[index] = 0;
    this.set(GAME_BOARD, board);
    this.persist();
  }

  private win(): void {
    this.stopTimer();
    const difficulty = this.get(GAME_DIFFICULTY) as Difficulty;
    const timeSec = this.get(ELAPSED_SECONDS) as number;
    const mistakes = this.get(MISTAKE_COUNT) as number;
    const previousBestSec = this.deps.bestTimeFor(difficulty);
    this.set(VICTORY_SUMMARY, {
      difficulty,
      timeSec,
      mistakes,
      previousBestSec,
      isNewPersonalBest: previousBestSec == null || timeSec < previousBestSec,
    } satisfies VictorySummary);
    this.set(GAME_STATUS, 'won');
    this.deps.onGameWon(difficulty, timeSec, mistakes);
    this.persist();
  }

  private lose(): void {
    this.stopTimer();
    this.set(GAME_STATUS, 'lost');
    this.persist();
  }

  // ---- undo / redo -------------------------------------------------------------------------------

  private pushHistory(): void {
    const entry: HistoryEntry = { board: this.get(GAME_BOARD) as Board, notes: this.get(GAME_NOTES) as readonly (readonly number[])[] };
    const history = this.get(GAME_HISTORY) as HistoryState;
    const past = [...history.past, entry].slice(-MAX_HISTORY);
    this.set(GAME_HISTORY, { past, future: [] });
  }

  private undo(): void {
    if (this.get(GAME_STATUS) !== 'playing') return;
    const history = this.get(GAME_HISTORY) as HistoryState;
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const current: HistoryEntry = { board: this.get(GAME_BOARD) as Board, notes: this.get(GAME_NOTES) as readonly (readonly number[])[] };
    this.set(GAME_HISTORY, { past: history.past.slice(0, -1), future: [current, ...history.future] });
    this.set(GAME_BOARD, previous.board);
    this.set(GAME_NOTES, previous.notes);
    this.persist();
  }

  private redo(): void {
    if (this.get(GAME_STATUS) !== 'playing') return;
    const history = this.get(GAME_HISTORY) as HistoryState;
    if (history.future.length === 0) return;
    const next = history.future[0];
    const current: HistoryEntry = { board: this.get(GAME_BOARD) as Board, notes: this.get(GAME_NOTES) as readonly (readonly number[])[] };
    this.set(GAME_HISTORY, { past: [...history.past, current], future: history.future.slice(1) });
    this.set(GAME_BOARD, next.board);
    this.set(GAME_NOTES, next.notes);
    this.persist();
  }

  // ---- timer -------------------------------------------------------------------------------------

  private startTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.set(ELAPSED_SECONDS, (this.get(ELAPSED_SECONDS) as number) + 1);
      this.persist();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
