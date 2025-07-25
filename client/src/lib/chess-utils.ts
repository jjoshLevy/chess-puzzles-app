// Chess piece Unicode symbols - filled symbols for both colors
export const CHESS_PIECES = {
  white: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟︎'
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟︎'
  }
};

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export interface ChessMove {
  from: string;
  to: string;
  piece: ChessPiece;
  captured?: ChessPiece;
  promotion?: PieceType;
}

// Convert FEN notation to board position
export function fenToBoard(fen: string): (ChessPiece | null)[][] {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  if (!fen || typeof fen !== 'string') {
    return board;
  }
  
  const position = fen.split(' ')[0];
  const rows = position.split('/');

  // Ensure we have exactly 8 rows
  if (rows.length !== 8) {
    return board;
  }

  for (let rank = 0; rank < 8; rank++) {
    const row = rows[rank];
    if (!row || typeof row !== 'string') {
      continue;
    }
    
    let file = 0;
    for (const char of row) {
      if (char >= '1' && char <= '8') {
        file += parseInt(char);
      } else {
        const piece = fenCharToPiece(char);
        if (piece && file < 8) {
          board[rank][file] = piece;
        }
        file++;
      }
      
      // Prevent array overflow
      if (file >= 8) break;
    }
  }

  return board;
}

function fenCharToPiece(char: string): ChessPiece | null {
  const pieceMap: { [key: string]: ChessPiece } = {
    'K': { type: 'king', color: 'white' },
    'Q': { type: 'queen', color: 'white' },
    'R': { type: 'rook', color: 'white' },
    'B': { type: 'bishop', color: 'white' },
    'N': { type: 'knight', color: 'white' },
    'P': { type: 'pawn', color: 'white' },
    'k': { type: 'king', color: 'black' },
    'q': { type: 'queen', color: 'black' },
    'r': { type: 'rook', color: 'black' },
    'b': { type: 'bishop', color: 'black' },
    'n': { type: 'knight', color: 'black' },
    'p': { type: 'pawn', color: 'black' },
  };

  return pieceMap[char] || null;
}

// Convert square notation to array indices
export function squareToIndices(square: string): [number, number] {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(square[1]);
  return [rank, file];
}

// Convert array indices to square notation
export function indicesToSquare(rank: number, file: number): string {
  const fileChar = String.fromCharCode('a'.charCodeAt(0) + file);
  const rankNum = 8 - rank;
  return `${fileChar}${rankNum}`;
}

// Get piece symbol for display
export function getPieceSymbol(piece: ChessPiece): string {
  return CHESS_PIECES[piece.color][piece.type];
}

// Check if square is light or dark
export function isLightSquare(rank: number, file: number): boolean {
  return (rank + file) % 2 === 0;
}

// Generate all possible moves for a piece at a given square
export function getPossibleMoves(
  board: (ChessPiece | null)[][],
  fromSquare: string
): string[] {
  const [fromRank, fromFile] = squareToIndices(fromSquare);
  const piece = board[fromRank][fromFile];
  
  if (!piece) return [];

  const moves: string[] = [];

  switch (piece.type) {
    case 'pawn':
      moves.push(...getPawnMoves(board, fromRank, fromFile, piece.color));
      break;
    case 'rook':
      moves.push(...getRookMoves(board, fromRank, fromFile, piece.color));
      break;
    case 'bishop':
      moves.push(...getBishopMoves(board, fromRank, fromFile, piece.color));
      break;
    case 'queen':
      moves.push(...getQueenMoves(board, fromRank, fromFile, piece.color));
      break;
    case 'king':
      moves.push(...getKingMoves(board, fromRank, fromFile, piece.color));
      break;
    case 'knight':
      moves.push(...getKnightMoves(board, fromRank, fromFile, piece.color));
      break;
  }

  return moves;
}

function getPawnMoves(board: (ChessPiece | null)[][], rank: number, file: number, color: PieceColor): string[] {
  const moves: string[] = [];
  const direction = color === 'white' ? -1 : 1;
  const startRank = color === 'white' ? 6 : 1;

  // Forward move
  const newRank = rank + direction;
  if (newRank >= 0 && newRank < 8 && !board[newRank][file]) {
    moves.push(indicesToSquare(newRank, file));
    
    // Double move from starting position
    if (rank === startRank && !board[newRank + direction][file]) {
      moves.push(indicesToSquare(newRank + direction, file));
    }
  }

  // Captures
  for (const captureFile of [file - 1, file + 1]) {
    if (captureFile >= 0 && captureFile < 8 && newRank >= 0 && newRank < 8) {
      const targetPiece = board[newRank][captureFile];
      if (targetPiece && targetPiece.color !== color) {
        moves.push(indicesToSquare(newRank, captureFile));
      }
    }
  }

  return moves;
}

function getRookMoves(board: (ChessPiece | null)[][], rank: number, file: number, color: PieceColor): string[] {
  const moves: string[] = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  for (const [dRank, dFile] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRank = rank + dRank * i;
      const newFile = file + dFile * i;

      if (newRank < 0 || newRank >= 8 || newFile < 0 || newFile >= 8) break;

      const targetPiece = board[newRank][newFile];
      if (!targetPiece) {
        moves.push(indicesToSquare(newRank, newFile));
      } else {
        if (targetPiece.color !== color) {
          moves.push(indicesToSquare(newRank, newFile));
        }
        break;
      }
    }
  }

  return moves;
}

function getBishopMoves(board: (ChessPiece | null)[][], rank: number, file: number, color: PieceColor): string[] {
  const moves: string[] = [];
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  for (const [dRank, dFile] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRank = rank + dRank * i;
      const newFile = file + dFile * i;

      if (newRank < 0 || newRank >= 8 || newFile < 0 || newFile >= 8) break;

      const targetPiece = board[newRank][newFile];
      if (!targetPiece) {
        moves.push(indicesToSquare(newRank, newFile));
      } else {
        if (targetPiece.color !== color) {
          moves.push(indicesToSquare(newRank, newFile));
        }
        break;
      }
    }
  }

  return moves;
}

function getQueenMoves(board: (ChessPiece | null)[][], rank: number, file: number, color: PieceColor): string[] {
  return [
    ...getRookMoves(board, rank, file, color),
    ...getBishopMoves(board, rank, file, color)
  ];
}

function getKingMoves(board: (ChessPiece | null)[][], rank: number, file: number, color: PieceColor): string[] {
  const moves: string[] = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dRank, dFile] of directions) {
    const newRank = rank + dRank;
    const newFile = file + dFile;

    if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
      const targetPiece = board[newRank][newFile];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push(indicesToSquare(newRank, newFile));
      }
    }
  }

  return moves;
}

function getKnightMoves(board: (ChessPiece | null)[][], rank: number, file: number, color: PieceColor): string[] {
  const moves: string[] = [];
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];

  for (const [dRank, dFile] of knightMoves) {
    const newRank = rank + dRank;
    const newFile = file + dFile;

    if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
      const targetPiece = board[newRank][newFile];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push(indicesToSquare(newRank, newFile));
      }
    }
  }

  return moves;
}

// Basic move validation (simplified)
export function isValidMove(
  board: (ChessPiece | null)[][],
  from: string,
  to: string
): boolean {
  const possibleMoves = getPossibleMoves(board, from);
  return possibleMoves.includes(to);
}

// Format time in mm:ss format
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get difficulty stars
export function getDifficultyStars(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return '★☆☆';
    case 'intermediate': return '★★☆';
    case 'advanced': return '★★★';
    default: return '★☆☆';
  }
}

// Check if it's Black's turn to move based on FEN
export function isBlackToMove(fen: string): boolean {
  const fenParts = fen.split(' ');
  return fenParts.length > 1 && fenParts[1] === 'b';
}
