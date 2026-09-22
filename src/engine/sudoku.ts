/**
 * Pure Sudoku engine: generation, solving, and validation.
 *
 * No React, no grips — this module is deliberately framework-free so it is
 * trivial to unit test. `src/taps/gameTaps.ts` is the only place that wires
 * it up to reactive state.
 */

export type Board = readonly number[]; // length 81, 0 = empty, 1-9 = filled
export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane';

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'insane'];

// Inclusive range of given (pre-filled) clues per difficulty. Lower givens
// means more solving work and (generally) more advanced techniques required.
export const DIFFICULTY_GIVENS: Record<Difficulty, readonly [number, number]> = {
  easy: [36, 45],
  medium: [30, 35],
  hard: [26, 29],
  insane: [22, 25],
};

export const BOARD_SIZE = 81;
const SIDE = 9;
const BOX = 3;
const FULL_MASK = 0b111111111; // digits 1-9 as bits 0-8

/** Small, fast, seedable PRNG (mulberry32) so puzzle generation is deterministic in tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rowOf(i: number): number {
  return Math.floor(i / SIDE);
}
export function colOf(i: number): number {
  return i % SIDE;
}
export function boxOf(i: number): number {
  return Math.floor(rowOf(i) / BOX) * BOX + Math.floor(colOf(i) / BOX);
}
export function cellIndex(row: number, col: number): number {
  return row * SIDE + col;
}

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Bitmasks of digits already used per row/col/box, for O(1) candidate lookup. */
class Masks {
  rows = new Array<number>(SIDE).fill(0);
  cols = new Array<number>(SIDE).fill(0);
  boxes = new Array<number>(SIDE).fill(0);

  constructor(board: Board) {
    for (let i = 0; i < BOARD_SIZE; i++) {
      const v = board[i];
      if (v) this.place(i, v);
    }
  }

  place(i: number, v: number): void {
    const bit = 1 << (v - 1);
    this.rows[rowOf(i)] |= bit;
    this.cols[colOf(i)] |= bit;
    this.boxes[boxOf(i)] |= bit;
  }

  remove(i: number, v: number): void {
    const bit = ~(1 << (v - 1));
    this.rows[rowOf(i)] &= bit;
    this.cols[colOf(i)] &= bit;
    this.boxes[boxOf(i)] &= bit;
  }

  candidateMask(i: number): number {
    return FULL_MASK & ~(this.rows[rowOf(i)] | this.cols[colOf(i)] | this.boxes[boxOf(i)]);
  }
}

function popcount(mask: number): number {
  let n = mask;
  let count = 0;
  while (n) {
    n &= n - 1;
    count++;
  }
  return count;
}

function digitsOf(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & (1 << (d - 1))) out.push(d);
  return out;
}

/** Mutable node budget shared across one search() call tree, so a search can bail out cheaply. */
interface SearchBudget {
  remaining: number;
  exceeded: boolean;
}

/**
 * Backtracking search shared by solve() and countSolutions(). Uses
 * minimum-remaining-value (fewest candidates) cell ordering, which is what
 * keeps this fast enough to call repeatedly during puzzle digging.
 *
 * `budget` bounds the number of nodes visited: proving a sparse board's
 * solution is *unique* (as opposed to just finding *a* solution) can blow up
 * combinatorially with plain MRV backtracking, so callers that need a hard
 * time bound (puzzle digging) pass one. `budget.exceeded` is set and the
 * search unwinds immediately when the budget runs out.
 */
function search(
  board: number[],
  masks: Masks,
  onSolution: () => boolean, // return true to stop searching (found enough)
  order: (candidates: number[]) => number[],
  budget?: SearchBudget,
): boolean {
  if (budget) {
    if (budget.remaining <= 0) {
      budget.exceeded = true;
      return true;
    }
    budget.remaining--;
  }

  let bestIndex = -1;
  let bestMask = 0;
  let bestCount = 10;

  for (let i = 0; i < BOARD_SIZE; i++) {
    if (board[i] !== 0) continue;
    const mask = masks.candidateMask(i);
    const count = popcount(mask);
    if (count === 0) return false; // dead end
    if (count < bestCount) {
      bestCount = count;
      bestIndex = i;
      bestMask = mask;
      if (count === 1) break;
    }
  }

  if (bestIndex === -1) {
    // No empty cells left: a complete, valid assignment.
    return onSolution();
  }

  const candidates = order(digitsOf(bestMask));
  for (const v of candidates) {
    board[bestIndex] = v;
    masks.place(bestIndex, v);
    const stop = search(board, masks, onSolution, order, budget);
    masks.remove(bestIndex, v);
    board[bestIndex] = 0;
    if (stop) return true;
  }
  return false;
}

/**
 * Solves a board; returns the first solution found, or null if unsolvable.
 *
 * Pre-existing duplicate givens (already-conflicting clues) are rejected
 * upfront via `findConflicts`: without this, a board that is only
 * infeasible for a subtle "not enough remaining candidates for a box"
 * reason (e.g. two clues sharing a value) can force the backtracker to
 * explore almost the entire rest of the board before discovering the
 * contradiction, since MRV ordering has no reason to visit the affected box
 * early. `maxNodes` bounds the search itself as a second line of defense.
 */
export function solve(board: Board, rng: () => number = Math.random, maxNodes = 500_000): Board | null {
  if (findConflicts(board).size > 0) return null;
  const working = board.slice() as number[];
  const masks = new Masks(working);
  let solution: number[] | null = null;
  const budget: SearchBudget = { remaining: maxNodes, exceeded: false };
  search(
    working,
    masks,
    () => {
      solution = working.slice();
      return true;
    },
    (candidates) => shuffled(candidates, rng),
    budget,
  );
  return solution;
}

/**
 * Counts distinct solutions up to `limit` (default 2, i.e. "is it unique?").
 *
 * Rejects boards with pre-existing duplicate givens immediately (see
 * `solve`'s doc comment for why). If the search would otherwise need more
 * than `maxNodes` steps to decide, this returns `limit + 1` — treated by
 * callers as "not confirmed unique" — so generation always terminates
 * quickly instead of chasing a proof on a pathologically sparse board.
 */
export function countSolutions(board: Board, limit = 2, maxNodes = 40_000): number {
  if (findConflicts(board).size > 0) return 0;
  const working = board.slice() as number[];
  const masks = new Masks(working);
  let found = 0;
  const budget: SearchBudget = { remaining: maxNodes, exceeded: false };
  search(
    working,
    masks,
    () => {
      found++;
      return found >= limit;
    },
    (candidates) => candidates, // order doesn't matter for counting
    budget,
  );
  return budget.exceeded ? limit + 1 : found;
}

/** Generates a fully-solved, randomized 9x9 board. */
export function generateSolvedBoard(rng: () => number = Math.random): Board {
  const board = new Array<number>(BOARD_SIZE).fill(0);
  const solved = solve(board, rng);
  if (!solved) throw new Error('unreachable: empty board is always solvable');
  return solved;
}

export interface GeneratedPuzzle {
  readonly puzzle: Board;
  readonly solution: Board;
  readonly difficulty: Difficulty;
  readonly givens: number;
}

/**
 * Generates a puzzle for the given difficulty by digging holes out of a
 * solved board, keeping the solution unique at every step (classic "unique
 * solution" Sudoku generation).
 */
export function generatePuzzle(difficulty: Difficulty, rng: () => number = Math.random): GeneratedPuzzle {
  const solution = generateSolvedBoard(rng);
  const puzzle = solution.slice() as number[];
  const [minGivens, maxGivens] = DIFFICULTY_GIVENS[difficulty];
  const targetGivens = minGivens + Math.floor(rng() * (maxGivens - minGivens + 1));

  const order = shuffled(
    Array.from({ length: BOARD_SIZE }, (_, i) => i),
    rng,
  );

  let givens = BOARD_SIZE;
  for (const i of order) {
    if (givens <= targetGivens) break;
    if (puzzle[i] === 0) continue;
    const removed = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, 2) === 1) {
      givens--;
    } else {
      puzzle[i] = removed;
    }
  }

  return { puzzle, solution, difficulty, givens };
}

/** Indices of every cell that shares a row, column, or box with `index` (not including itself). */
export function peersOf(index: number): number[] {
  const peers = new Set<number>();
  const r = rowOf(index);
  const c = colOf(index);
  for (let i = 0; i < SIDE; i++) {
    peers.add(cellIndex(r, i));
    peers.add(cellIndex(i, c));
  }
  const boxRow = Math.floor(r / BOX) * BOX;
  const boxCol = Math.floor(c / BOX) * BOX;
  for (let dr = 0; dr < BOX; dr++) {
    for (let dc = 0; dc < BOX; dc++) {
      peers.add(cellIndex(boxRow + dr, boxCol + dc));
    }
  }
  peers.delete(index);
  return Array.from(peers);
}

/** Indices of every filled cell that conflicts with another same-valued cell in its row/col/box. */
export function findConflicts(board: Board): ReadonlySet<number> {
  const conflicts = new Set<number>();
  for (let i = 0; i < BOARD_SIZE; i++) {
    const v = board[i];
    if (!v) continue;
    for (const p of peersOf(i)) {
      if (board[p] === v) {
        conflicts.add(i);
        conflicts.add(p);
        break;
      }
    }
  }
  return conflicts;
}

/** True when every cell is filled and no row/col/box has a duplicate. */
export function isSolved(board: Board): boolean {
  if (board.some((v) => v === 0)) return false;
  return findConflicts(board).size === 0;
}

/** Counts how many cells in `board` differ from `solution` (and are filled). Used for the mistake counter. */
export function countMismatches(board: Board, solution: Board): number {
  let count = 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (board[i] !== 0 && board[i] !== solution[i]) count++;
  }
  return count;
}
