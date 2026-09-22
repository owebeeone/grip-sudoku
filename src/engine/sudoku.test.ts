import { describe, expect, it } from 'vitest';
import {
  BOARD_SIZE,
  DIFFICULTIES,
  DIFFICULTY_GIVENS,
  countMismatches,
  countSolutions,
  findConflicts,
  generatePuzzle,
  generateSolvedBoard,
  isSolved,
  mulberry32,
  solve,
} from './sudoku';

describe('generateSolvedBoard', () => {
  it('produces a full, conflict-free board', () => {
    const board = generateSolvedBoard(mulberry32(1));
    expect(board).toHaveLength(BOARD_SIZE);
    expect(board.every((v) => v >= 1 && v <= 9)).toBe(true);
    expect(isSolved(board)).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    const a = generateSolvedBoard(mulberry32(42));
    const b = generateSolvedBoard(mulberry32(42));
    expect(a).toEqual(b);
  });
});

describe('generatePuzzle', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`produces a unique-solution ${difficulty} puzzle within its givens range`, () => {
      const { puzzle, solution, givens } = generatePuzzle(difficulty, mulberry32(7));
      const [min, max] = DIFFICULTY_GIVENS[difficulty];
      const filled = puzzle.filter((v) => v !== 0).length;

      expect(filled).toBe(givens);
      expect(givens).toBeGreaterThanOrEqual(min);
      expect(givens).toBeLessThanOrEqual(max);
      expect(countSolutions(puzzle, 2)).toBe(1);
      expect(isSolved(solution)).toBe(true);

      // Every given clue must match the solution.
      for (let i = 0; i < BOARD_SIZE; i++) {
        if (puzzle[i] !== 0) expect(puzzle[i]).toBe(solution[i]);
      }
    });
  }
});

describe('solve', () => {
  it('solves a puzzle back to a valid board', () => {
    const { puzzle } = generatePuzzle('easy', mulberry32(3));
    const solved = solve(puzzle);
    expect(solved).not.toBeNull();
    expect(isSolved(solved!)).toBe(true);
  });

  it('returns null for a board with an already-conflicting clue', () => {
    const board = new Array(BOARD_SIZE).fill(0);
    board[0] = 5;
    board[1] = 5; // same row, immediate conflict
    expect(solve(board)).toBeNull();
  });
});

describe('findConflicts', () => {
  it('flags duplicate digits sharing a row', () => {
    const board = new Array(BOARD_SIZE).fill(0);
    board[0] = 7;
    board[3] = 7; // same row as index 0
    const conflicts = findConflicts(board);
    expect(conflicts.has(0)).toBe(true);
    expect(conflicts.has(3)).toBe(true);
    expect(conflicts.size).toBe(2);
  });

  it('is empty for a solved board', () => {
    const board = generateSolvedBoard(mulberry32(9));
    expect(findConflicts(board).size).toBe(0);
  });
});

describe('countMismatches', () => {
  it('counts cells that differ from the solution', () => {
    const solution = generateSolvedBoard(mulberry32(5));
    const board = solution.slice();
    board[0] = (board[0] % 9) + 1 === solution[0] ? ((board[0] + 1) % 9) + 1 : (board[0] % 9) + 1;
    expect(countMismatches(board, solution)).toBe(1);
    expect(countMismatches(solution, solution)).toBe(0);
  });
});
