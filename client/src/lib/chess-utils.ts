export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export function fenToBoard(fen: string): (ChessPiece | null)[][] {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const boardPart = fen.split(' ')[0];
  const ranks = boardPart.split('/');
  
  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    const rank = ranks[rankIndex];
    let fileIndex = 0;
    
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        fileIndex += parseInt(char);
      } else {
        const piece = fenCharToPiece(char);
        if (piece) {
          board[rankIndex][fileIndex] = piece;
        }
        fileIndex++;
      }
    }
  }
  return board;
}

function fenCharToPiece(char: string): ChessPiece | null {
  const color = char === char.toUpperCase() ? 'white' : 'black';
  const typeMap: { [key: string]: PieceType } = {
    'p': 'pawn', 'r': 'rook', 'n': 'knight', 'b': 'bishop', 'q': 'queen', 'k': 'king'
  };
  const type = typeMap[char.toLowerCase()];
  return type ? { type, color } : null;
}

export function squareToIndices(square: string): [number, number] {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(square[1]);
  return [rank, file];
}

export function indicesToSquare(rank: number, file: number): string {
  const fileChar = String.fromCharCode('a'.charCodeAt(0) + file);
  const rankChar = (8 - rank).toString();
  return fileChar + rankChar;
}

export function getPieceSymbol(piece: ChessPiece): string {
  const symbols: { [key: string]: { [key: string]: string } } = {
    king: { white: '♔', black: '♚' },
    queen: { white: '♕', black: '♛' },
    rook: { white: '♖', black: '♜' },
    bishop: { white: '♗', black: '♝' },
    knight: { white: '♘', black: '♞' },
    pawn: { white: '♙', black: '♟' },
  };
  return symbols[piece.type]?.[piece.color] || '?';
}

export function isLightSquare(rank: number, file: number): boolean {
  return (rank + file) % 2 === 0;
}

export function getPossibleMoves(
  board: (ChessPiece | null)[][],
  fromSquare: string
): string[] {
    // This is a placeholder for complex move generation logic
    return [];
}

export function isValidMove(
  board: (ChessPiece | null)[][],
  from: string,
  to: string
): boolean {
    // This is a placeholder for move validation logic
    return true;
}

export function isBlackToMove(fen: string): boolean {
  const parts = fen.split(' ');
  return parts.length > 1 && parts[1] === 'b';
}