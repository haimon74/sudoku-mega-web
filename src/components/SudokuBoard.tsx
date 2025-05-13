import React, { useState, useEffect, useCallback } from 'react';
import styles from './SudokuBoard.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';
type CharacterSet = 'colors' | 'letters' | 'animals';

interface SudokuBoardProps {
  initialDifficulty?: Difficulty;
  initialType?: CharacterSet;
}

interface Cell {
  value: number;
  isFixed: boolean;
  isValid: boolean;
  isHint?: boolean;
  isSuperscript?: boolean;
}

// Character sets for 16x16 grid
const CHARACTER_SETS = {
  colors: {
    values: Array.from({length: 16}, (_, i) => i + 1),
    display: (value: number) => null, // We'll handle colors through CSS
    getColor: (value: number) => [
      '#e3342f', '#f6993f', '#ffed4a', '#38c172', 
      '#4dc0b5', '#3490dc', '#6574cd', '#9561e2', '#f66d9b',
      '#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3',
      '#54a0ff', '#5f27cd'
    ][value - 1]
  },
  letters: {
    values: Array.from({length: 16}, (_, i) => i + 1),
    display: (value: number) => [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
      'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'
    ][value - 1]
  },
  animals: {
    values: Array.from({length: 16}, (_, i) => i + 1),
    display: (value: number) => [
      '🦩', '🦄', '🐶', '🐱', '🐰', '🐼', '🐿️', '🦋',
      '🐠', '🦁', '🐯', '🐨', '🦊', '🦒', '🦘', '🦥'
    ][value - 1]
  }
};

const SudokuBoard: React.FC<SudokuBoardProps> = ({ initialDifficulty, initialType }) => {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty || 'easy');
  const [characterSet, setCharacterSet] = useState<CharacterSet>(initialType || 'colors');
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showingInvalidCells, setShowingInvalidCells] = useState(false);

  // Update state when props change
  useEffect(() => {
    if (initialDifficulty) {
      setDifficulty(initialDifficulty);
    }
    if (initialType) {
      setCharacterSet(initialType);
    }
  }, [initialDifficulty, initialType]);

  // Initialize timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate a solved Sudoku puzzle
  const generateSolvedPuzzle = (): number[][] => {
    const grid = Array(16).fill(null).map(() => Array(16).fill(0));
    
    const isValid = (row: number, col: number, num: number): boolean => {
      // Check row
      for (let x = 0; x < 16; x++) {
        if (grid[row][x] === num) return false;
      }
      
      // Check column
      for (let x = 0; x < 16; x++) {
        if (grid[x][col] === num) return false;
      }
      
      // Check 4x4 box
      const boxRow = Math.floor(row / 4) * 4;
      const boxCol = Math.floor(col / 4) * 4;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (grid[boxRow + i][boxCol + j] === num) return false;
        }
      }
      
      return true;
    };
    
    const solve = (row: number, col: number): boolean => {
      if (col === 16) {
        row++;
        col = 0;
      }
      
      if (row === 16) return true;
      
      if (grid[row][col] !== 0) {
        return solve(row, col + 1);
      }
      
      const nums = Array.from({length: 16}, (_, i) => i + 1);
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
      
      for (const num of nums) {
        if (isValid(row, col, num)) {
          grid[row][col] = num;
          if (solve(row, col + 1)) return true;
          grid[row][col] = 0;
        }
      }
      
      return false;
    };
    
    solve(0, 0);
    return grid;
  };

  // Create puzzle with difficulty
  const createPuzzle = (solvedGrid: number[][], difficulty: Difficulty): Cell[][] => {
    const cellsToRemove = {
      easy: 80,    // ~31% of cells
      medium: 120, // ~47% of cells
      hard: 160    // ~63% of cells
    }[difficulty];

    const puzzle = solvedGrid.map(row => 
      row.map(value => ({
        value,
        isFixed: true,
        isValid: true
      }))
    );

    let removed = 0;
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 16);
      const col = Math.floor(Math.random() * 16);
      
      if (puzzle[row][col].value !== 0) {
        puzzle[row][col].value = 0;
        puzzle[row][col].isFixed = false;
        removed++;
      }
    }

    return puzzle;
  };

  // Initialize board
  const initializeBoard = useCallback(() => {
    const solvedGrid = generateSolvedPuzzle();
    const puzzle = createPuzzle(solvedGrid, difficulty);
    setBoard(puzzle);
    setTimer(0);
    setIsComplete(false);
    setSelectedCell(null);
    setSelectedNumber(null);
    setShowingInvalidCells(false);
  }, [difficulty]);

  // Initialize board when difficulty changes
  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  // Validate move
  const validateMove = (row: number, col: number, value: number): boolean => {
    // Check row
    for (let x = 0; x < 16; x++) {
      if (x !== col && board[row][x].value === value) return false;
    }
    
    // Check column
    for (let x = 0; x < 16; x++) {
      if (x !== row && board[x][col].value === value) return false;
    }
    
    // Check 4x4 box
    const boxRow = Math.floor(row / 4) * 4;
    const boxCol = Math.floor(col / 4) * 4;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const r = boxRow + i;
        const c = boxCol + j;
        if (r !== row && c !== col && board[r][c].value === value) return false;
      }
    }
    
    return true;
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    // Allow selecting any cell, including pre-revealed ones
    setSelectedCell([row, col]);
    
    // Only clear the cell if it's already selected and not fixed
    if (selectedCell?.[0] === row && selectedCell?.[1] === col && !board[row][col].isFixed) {
      const newBoard = [...board];
      newBoard[row][col].value = 0;
      newBoard[row][col].isValid = true;
      setBoard(newBoard);
    }
  };

  // Handle number input
  const handleNumberInput = (num: number) => {
    setSelectedNumber(num);
    if (selectedCell) {
      const [row, col] = selectedCell;
      // Don't modify pre-revealed cells
      if (board[row][col].isFixed) {
        return;
      }
      const newBoard = [...board];
      newBoard[row][col].value = num;
      newBoard[row][col].isValid = validateMove(row, col, num);
      setBoard(newBoard);
      
      // Check if puzzle is complete
      const isComplete = newBoard.every(row => 
        row.every(cell => cell.value !== 0 && cell.isValid)
      );
      setIsComplete(isComplete);
    }
  };

  // Handle clear
  const handleClear = () => {
    setSelectedNumber(null);
    if (selectedCell) {
      const [row, col] = selectedCell;
      // Don't clear pre-revealed cells
      if (board[row][col].isFixed) {
        return;
      }
      const newBoard = [...board];
      newBoard[row][col].value = 0;
      newBoard[row][col].isValid = true;
      setBoard(newBoard);
    }
  };

  // Handle hint toggle
  const handleHintToggle = () => {
    setShowingInvalidCells(prev => !prev);
  };

  // Handle right click
  const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault(); // Prevent context menu
    
    // Only toggle superscript for player-revealed cells with values
    if (!board[row][col].isFixed && board[row][col].value !== 0) {
      const newBoard = [...board];
      newBoard[row][col].isSuperscript = !newBoard[row][col].isSuperscript;
      setBoard(newBoard);
    }
  };

  // Get cell classes
  const getCellClasses = (row: number, col: number, cell: Cell) => {
    const classes = [styles.sudokuCell];
    
    if (selectedCell?.[0] === row && selectedCell?.[1] === col) {
      classes.push(styles.selected);
    }
    
    if (selectedCell && selectedCell[0] === row) {
      classes.push(styles.selectedRow);
    }
    
    if (selectedCell && selectedCell[1] === col) {
      classes.push(styles.selectedColumn);
    }
    
    if (selectedCell && board[selectedCell[0]][selectedCell[1]].value === cell.value && cell.value !== 0) {
      classes.push(styles.selectedNumber);
    }
    
    if (cell.isFixed) {
      classes.push(styles.fixed);
    }
    
    if (!cell.isValid && showingInvalidCells) {
      classes.push(styles.invalid);
    }

    if (cell.isSuperscript) {
      classes.push(styles.superscript);
    }
    
    return classes.join(' ');
  };

  // Format timer
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.sudokuContainer}>
      <div className={styles.controls}>
        <div className={styles.controlsLeft}>
          <select
            className={styles.difficultySelect}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            disabled={!!initialDifficulty}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            className={styles.difficultySelect}
            value={characterSet}
            onChange={(e) => setCharacterSet(e.target.value as CharacterSet)}
            disabled={!!initialType}
          >
            <option value="colors">Colors</option>
            <option value="letters">Letters</option>
            <option value="animals">Animals</option>
          </select>
          <button className={styles.controlButton} onClick={initializeBoard}>
            New
          </button>
          <button 
            className={`${styles.controlButton} ${styles.showHints} ${showingInvalidCells ? styles.active : ''}`}
            onClick={handleHintToggle}
            title="Highlight invalid cells"
          >
            💡
          </button>
          <div className={styles.timerWrapper}>
          <div className={styles.timer}>
            {formatTime(timer)}
          </div>
        </div>
        </div>
        
      </div>

      <div className={styles.sudokuBoard}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.sudokuRow}>
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getCellClasses(rowIndex, colIndex, cell)}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
                data-charset={characterSet}
                style={characterSet === 'colors' && cell.value ? {
                  backgroundColor: CHARACTER_SETS.colors.getColor(cell.value)
                } : undefined}
              >
                {cell.isSuperscript ? (
                  <span className={styles.superscript}>
                    {cell.value && characterSet !== 'colors' ? CHARACTER_SETS[characterSet].display(cell.value) : ''}
                  </span>
                ) : (
                  cell.value && characterSet !== 'colors' ? CHARACTER_SETS[characterSet].display(cell.value) : ''
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.numberPad}>
        {CHARACTER_SETS[characterSet].values.map((num) => (
          <button
            key={num}
            className={`${styles.numberButton} ${selectedNumber === num ? styles.selected : ''}`}
            onClick={() => handleNumberInput(num)}
            data-charset={characterSet}
            style={characterSet === 'colors' ? {
              backgroundColor: CHARACTER_SETS.colors.getColor(num),
              color: '#fff'
            } : undefined}
          >
            {characterSet !== 'colors' ? CHARACTER_SETS[characterSet].display(num) : ''}
          </button>
        ))}
        <button 
          className={`${styles.numberButton} ${styles.clear} ${selectedNumber === null ? styles.selected : ''}`} 
          onClick={handleClear}
          data-charset={characterSet}
          style={characterSet === 'colors' ? {
            backgroundColor: '#e0e0e0',
            color: '#333'
          } : undefined}
        >
          X
        </button>
      </div>

      {isComplete && (
        <div className={styles.completionMessage}>
          Congratulations! You completed the puzzle in {formatTime(timer)}
        </div>
      )}
    </div>
  );
};

export default SudokuBoard; 