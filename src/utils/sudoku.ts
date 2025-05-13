export const SIZE = 9;
export const BOX_SIZE = 3;

export type SudokuBoard = number[][];
type Difficulty = 'easy' | 'medium' | 'hard';
type Strategy = 'Naked Single' | 'Backtracking' | 'Advanced';

// Create an empty board
export const createEmptyBoard = (): SudokuBoard => {
    return Array(SIZE).fill(0).map(() => Array(SIZE).fill(0));
};

// Deep copy a board
export const boardCopy = (board: SudokuBoard): SudokuBoard => {
    return board.map(row => [...row]);
};

// Check if placement is valid
export const isValidPlacement = (board: SudokuBoard, row: number, col: number, num: number): boolean => {
    // Check row
    for (let i = 0; i < SIZE; i++) {
        if (board[row][i] === num) {
            return false;
        }
    }

    // Check column
    for (let i = 0; i < SIZE; i++) {
        if (board[i][col] === num) {
            return false;
        }
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
    for (let i = 0; i < BOX_SIZE; i++) {
        for (let j = 0; j < BOX_SIZE; j++) {
            if (board[boxRow + i][boxCol + j] === num) {
                return false;
            }
        }
    }

    return true;
};

// Find an empty cell in the board
const findEmptyCell = (board: SudokuBoard): [number, number] | null => {
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (board[i][j] === 0) {
                return [i, j];
            }
        }
    }
    return null;
};

// Solve with strategies and track used strategies
const solveWithStrategies = (board: SudokuBoard, strategiesUsed: Set<Strategy>): boolean => {
    const emptyCell = findEmptyCell(board);
    if (!emptyCell) {
        return true; // Board is complete
    }

    const [row, col] = emptyCell;
    const candidates: number[] = [];

    // Find candidates for this cell
    for (let num = 1; num <= SIZE; num++) {
        if (isValidPlacement(board, row, col, num)) {
            candidates.push(num);
        }
    }

    // Track strategies
    if (candidates.length === 1) {
        strategiesUsed.add('Naked Single');
    } else if (candidates.length > 1) {
        strategiesUsed.add('Backtracking');
    }

    // Try each candidate
    for (const num of candidates) {
        board[row][col] = num;
        if (solveWithStrategies(board, strategiesUsed)) {
            return true;
        }
        board[row][col] = 0; // Backtrack
    }

    return false;
};

// Fill board completely
const fillBoard = (board: SudokuBoard): boolean => {
    const emptyCell = findEmptyCell(board);
    if (!emptyCell) {
        return true; // Board is complete
    }

    const [row, col] = emptyCell;
    const nums = Array.from({length: SIZE}, (_, i) => i + 1);
    
    // Shuffle numbers for randomness
    shuffleArray(nums);

    for (const num of nums) {
        if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) {
                return true;
            }
            board[row][col] = 0; // Backtrack
        }
    }

    return false;
};

// Get strategy set based on difficulty
const getStrategySet = (difficulty: Difficulty): Set<Strategy> => {
    if (difficulty === 'easy') {
        return new Set<Strategy>(['Naked Single']);
    } else if (difficulty === 'medium') {
        return new Set<Strategy>(['Naked Single', 'Backtracking']);
    } else { // 'hard'
        return new Set<Strategy>(['Naked Single', 'Backtracking', 'Advanced']);
    }
};

// Remove numbers strategically based on difficulty
const removeNumbersStrategically = (
    fullBoard: SudokuBoard, 
    targetStrategies: Set<Strategy>, 
    maxAttempts = 60
): SudokuBoard => {
    const puzzle = boardCopy(fullBoard);
    const cells: [number, number][] = [];
    
    // Create a list of all cells
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            cells.push([i, j]);
        }
    }
    
    // Shuffle cells for randomness
    shuffleArray(cells);
    
    let attempts = 0;
    
    while (attempts < maxAttempts && cells.length > 0) {
        const [row, col] = cells.pop()!;
        const backup = puzzle[row][col];
        puzzle[row][col] = 0;
        
        const strategiesUsed = new Set<Strategy>();
        const puzzleCopy = boardCopy(puzzle);
        
        if (!solveWithStrategies(puzzleCopy, strategiesUsed)) {
            puzzle[row][col] = backup;
            continue;
        }
        
        // Check if strategies used are within target strategies
        const isWithinTargets = Array.from(strategiesUsed).every(
            strategy => targetStrategies.has(strategy)
        );
        
        if (!isWithinTargets) {
            puzzle[row][col] = backup;
        }
        
        attempts++;
    }
    
    return puzzle;
};

// Shuffle array in place
const shuffleArray = <T>(array: T[]): void => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

// Generate a complete Sudoku board
export const generateBoard = (): SudokuBoard => {
    const board = createEmptyBoard();
    fillBoard(board);
    return board;
};

// Remove numbers from a complete board based on difficulty
export const removeNumbers = (board: SudokuBoard, difficulty: Difficulty): SudokuBoard => {
    const targetStrategies = getStrategySet(difficulty);
    return removeNumbersStrategically(board, targetStrategies);
};

// Check if the whole board is valid
export const isBoardValid = (board: SudokuBoard): boolean => {
    // Check rows
    for (let i = 0; i < SIZE; i++) {
        const row = new Set<number>();
        for (let j = 0; j < SIZE; j++) {
            if (board[i][j] !== 0) {
                if (row.has(board[i][j])) return false;
                row.add(board[i][j]);
            }
        }
    }

    // Check columns
    for (let j = 0; j < SIZE; j++) {
        const col = new Set<number>();
        for (let i = 0; i < SIZE; i++) {
            if (board[i][j] !== 0) {
                if (col.has(board[i][j])) return false;
                col.add(board[i][j]);
            }
        }
    }

    // Check boxes
    for (let boxRow = 0; boxRow < SIZE; boxRow += BOX_SIZE) {
        for (let boxCol = 0; boxCol < SIZE; boxCol += BOX_SIZE) {
            const box = new Set<number>();
            for (let i = 0; i < BOX_SIZE; i++) {
                for (let j = 0; j < BOX_SIZE; j++) {
                    const value = board[boxRow + i][boxCol + j];
                    if (value !== 0) {
                        if (box.has(value)) return false;
                        box.add(value);
                    }
                }
            }
        }
    }

    return true;
}; 