export const CHECKERS_SIZE = 8;

const DIRECTIONS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1]
];

export function getCheckersOwner(piece = "") {
  if (!piece) return "";
  return String(piece).toLowerCase() === "p" ? "playerOne" : "playerTwo";
}

export function getCheckersEnemy(owner = "") {
  return owner === "playerOne" ? "playerTwo" : "playerOne";
}

export function isCheckersKing(piece = "") {
  return Boolean(piece) && piece === String(piece).toUpperCase();
}

export function isInsideCheckers(row, col) {
  return row >= 0 && row < CHECKERS_SIZE && col >= 0 && col < CHECKERS_SIZE;
}

export function countCheckersPieces(board = [], owner = "") {
  let total = 0;
  for (let row = 0; row < CHECKERS_SIZE; row += 1) {
    for (let col = 0; col < CHECKERS_SIZE; col += 1) {
      if (getCheckersOwner(board?.[row]?.[col]) === owner) total += 1;
    }
  }
  return total;
}

export function createInitialCheckersBoard() {
  const board = Array.from({ length: CHECKERS_SIZE }, () => Array(CHECKERS_SIZE).fill(""));
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < CHECKERS_SIZE; col += 1) {
      if ((row + col) % 2 === 1) board[row][col] = "o";
    }
  }
  for (let row = 5; row < CHECKERS_SIZE; row += 1) {
    for (let col = 0; col < CHECKERS_SIZE; col += 1) {
      if ((row + col) % 2 === 1) board[row][col] = "p";
    }
  }
  return board;
}

export function cloneCheckersBoard(board = []) {
  return board.map((row) => row.slice());
}

export function crownCheckersPiece(piece = "", row = 0) {
  if (piece === "p" && row === 0) return "P";
  if (piece === "o" && row === CHECKERS_SIZE - 1) return "O";
  return piece;
}

function simpleDirectionsFor(piece = "") {
  if (isCheckersKing(piece)) return DIRECTIONS;
  return String(piece).toLowerCase() === "p" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

export function getCheckersSimpleMovesForPiece(board = [], row = 0, col = 0) {
  const piece = board?.[row]?.[col];
  if (!piece) return [];
  const moves = [];

  if (isCheckersKing(piece)) {
    DIRECTIONS.forEach(([rowStep, colStep]) => {
      let nextRow = row + rowStep;
      let nextCol = col + colStep;
      while (isInsideCheckers(nextRow, nextCol) && !board[nextRow][nextCol]) {
        moves.push({ from: { row, col }, to: { row: nextRow, col: nextCol }, capture: null });
        nextRow += rowStep;
        nextCol += colStep;
      }
    });
    return moves;
  }

  simpleDirectionsFor(piece).forEach(([rowStep, colStep]) => {
    const nextRow = row + rowStep;
    const nextCol = col + colStep;
    if (isInsideCheckers(nextRow, nextCol) && !board[nextRow][nextCol]) {
      moves.push({ from: { row, col }, to: { row: nextRow, col: nextCol }, capture: null });
    }
  });
  return moves;
}

export function getCheckersCapturesForPiece(board = [], row = 0, col = 0) {
  const piece = board?.[row]?.[col];
  if (!piece) return [];
  const owner = getCheckersOwner(piece);
  const enemy = getCheckersEnemy(owner);
  const captures = [];

  if (isCheckersKing(piece)) {
    DIRECTIONS.forEach(([rowStep, colStep]) => {
      let scanRow = row + rowStep;
      let scanCol = col + colStep;
      while (isInsideCheckers(scanRow, scanCol) && !board[scanRow][scanCol]) {
        scanRow += rowStep;
        scanCol += colStep;
      }
      if (!isInsideCheckers(scanRow, scanCol) || getCheckersOwner(board[scanRow][scanCol]) !== enemy) return;
      const capture = { row: scanRow, col: scanCol };
      let landingRow = scanRow + rowStep;
      let landingCol = scanCol + colStep;
      while (isInsideCheckers(landingRow, landingCol) && !board[landingRow][landingCol]) {
        captures.push({
          from: { row, col },
          to: { row: landingRow, col: landingCol },
          capture
        });
        landingRow += rowStep;
        landingCol += colStep;
      }
    });
    return captures;
  }

  DIRECTIONS.forEach(([rowStep, colStep]) => {
    const enemyRow = row + rowStep;
    const enemyCol = col + colStep;
    const landingRow = enemyRow + rowStep;
    const landingCol = enemyCol + colStep;
    if (
      isInsideCheckers(landingRow, landingCol) &&
      getCheckersOwner(board?.[enemyRow]?.[enemyCol]) === enemy &&
      !board[landingRow][landingCol]
    ) {
      captures.push({
        from: { row, col },
        to: { row: landingRow, col: landingCol },
        capture: { row: enemyRow, col: enemyCol }
      });
    }
  });
  return captures;
}

export function applyCheckersMove(board = [], move = {}) {
  const next = cloneCheckersBoard(board);
  const piece = next?.[move?.from?.row]?.[move?.from?.col] || "";
  if (!piece) return next;
  next[move.from.row][move.from.col] = "";
  if (move.capture) next[move.capture.row][move.capture.col] = "";
  next[move.to.row][move.to.col] = crownCheckersPiece(piece, move.to.row);
  return next;
}

function maxCaptureDepthFrom(board = [], row = 0, col = 0) {
  const captures = getCheckersCapturesForPiece(board, row, col);
  if (!captures.length) return 0;
  return Math.max(
    ...captures.map((move) => 1 + maxCaptureDepthFrom(applyCheckersMove(board, move), move.to.row, move.to.col))
  );
}

function normalizeForcedPiece(forcedPiece = null) {
  if (!forcedPiece) return null;
  const row = Number(forcedPiece.row);
  const col = Number(forcedPiece.col);
  return Number.isInteger(row) && Number.isInteger(col) && isInsideCheckers(row, col) ? { row, col } : null;
}

export function getCheckersLegalMoves(board = [], owner = "", forcedPiece = null) {
  const forced = normalizeForcedPiece(forcedPiece);
  const captureMoves = [];
  for (let row = 0; row < CHECKERS_SIZE; row += 1) {
    for (let col = 0; col < CHECKERS_SIZE; col += 1) {
      if (forced && (forced.row !== row || forced.col !== col)) continue;
      if (getCheckersOwner(board?.[row]?.[col]) !== owner) continue;
      getCheckersCapturesForPiece(board, row, col).forEach((move) => {
        captureMoves.push({
          ...move,
          chainLength: 1 + maxCaptureDepthFrom(applyCheckersMove(board, move), move.to.row, move.to.col)
        });
      });
    }
  }
  if (captureMoves.length) {
    const maxChain = Math.max(...captureMoves.map((move) => move.chainLength || 1));
    return captureMoves.filter((move) => (move.chainLength || 1) === maxChain);
  }
  if (forced) return [];

  const simpleMoves = [];
  for (let row = 0; row < CHECKERS_SIZE; row += 1) {
    for (let col = 0; col < CHECKERS_SIZE; col += 1) {
      if (getCheckersOwner(board?.[row]?.[col]) === owner) {
        simpleMoves.push(...getCheckersSimpleMovesForPiece(board, row, col));
      }
    }
  }
  return simpleMoves;
}

export function getCheckersOutcome(board = []) {
  const playerOnePieces = countCheckersPieces(board, "playerOne");
  const playerTwoPieces = countCheckersPieces(board, "playerTwo");
  if (!playerOnePieces) return "playerTwo";
  if (!playerTwoPieces) return "playerOne";
  if (!getCheckersLegalMoves(board, "playerOne").length) return "playerTwo";
  if (!getCheckersLegalMoves(board, "playerTwo").length) return "playerOne";
  return "";
}
