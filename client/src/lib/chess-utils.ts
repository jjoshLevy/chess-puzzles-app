// This file contains all the core chess logic for the application.
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

const pieceTypeMap: { [key: string]: PieceType } = {
  k: 'king', q: 'queen', r: 'rook',
  b: 'bishop', n: 'knight', p: 'pawn'
};

export function fenToBoard(fen: string): (ChessPiece | null)[][] {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const fenParts = fen.split(' ');
  const position = fenParts[0];
  let rank = 0, file = 0;
  for (const char of position) {
    if (char === '/') { rank++; file = 0; }
    else if (/\d/.test(char)) { file += parseInt(char, 10); }
    else {
      const color = char === char.toUpperCase() ? 'white' : 'black';
      const type = char.toLowerCase() as keyof typeof pieceTypeMap;
      board[rank][file] = { type: pieceTypeMap[type], color };
      file++;
    }
  }
  return board;
}

export function squareToIndices(square: string): [number, number] {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(square.charAt(1), 10);
  return [rank, file];
}

export function indicesToSquare(rank: number, file: number): string {
  return `${String.fromCharCode('a'.charCodeAt(0) + file)}${8 - rank}`;
}

export function isLightSquare(rank: number, file: number): boolean {
  return (rank + file) % 2 !== 0;
}

export function getPieceSymbol(piece: ChessPiece): string {
  const symbols: { [key in PieceColor]: { [key in PieceType]: string } } = {
    white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟︎' }
  };
  return symbols[piece.color][piece.type];
}

export function isBlackToMove(fen: string): boolean {
    return fen.split(' ')[1] === 'b';
}

function isSquareAttacked(board: (ChessPiece | null)[][], rank: number, file: number, attackerColor: PieceColor): boolean {
    const opponentColor = attackerColor === 'white' ? 'black' : 'white';
    const pawnDirection = attackerColor === 'white' ? 1 : -1;
    if (rank + pawnDirection >= 0 && rank + pawnDirection < 8) {
      if (file - 1 >= 0) { const p = board[rank + pawnDirection][file - 1]; if (p && p.type === 'pawn' && p.color === attackerColor) return true; }
      if (file + 1 < 8) { const p = board[rank + pawnDirection][file + 1]; if (p && p.type === 'pawn' && p.color === attackerColor) return true; }
    }
    const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (const [dr, df] of knightMoves) {
      const r = rank + dr, f = file + df;
      if (r >= 0 && r < 8 && f >= 0 && f < 8) { const p = board[r][f]; if (p && p.type === 'knight' && p.color === attackerColor) return true; }
    }
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (let i = 0; i < directions.length; i++) {
        for (let dist = 1; dist < 8; dist++) {
            const r = rank + directions[i][0] * dist, f = file + directions[i][1] * dist;
            if (r < 0 || r >= 8 || f < 0 || f >= 8) break;
            const p = board[r][f];
            if (p) {
                if (p.color === attackerColor) {
                    if ((p.type === 'rook' && i < 4) || (p.type === 'bishop' && i >= 4) || p.type === 'queen' || (p.type === 'king' && dist === 1)) return true;
                }
                if (p.color !== attackerColor) break;
            }
        }
    }
    return false;
}

export function getPossibleMoves(fen: string, fromSquare: string): string[] {
    const board = fenToBoard(fen);
    const [rank, file] = squareToIndices(fromSquare);
    const piece = board[rank][file];
    if (!piece) return [];
    
    let pseudoLegalMoves: string[] = [];
    const color = piece.color;
    const opponentColor = color === 'white' ? 'black' : 'white';

    const addSlidingMoves = (directions: number[][]) => {
      for (const [dr, df] of directions) {
        for (let i = 1; i < 8; i++) {
          const r = rank + i * dr, f = file + i * df;
          if (r < 0 || r >= 8 || f < 0 || f >= 8) break;
          const targetPiece = board[r][f];
          if (targetPiece) {
            if (targetPiece.color !== color) pseudoLegalMoves.push(indicesToSquare(r, f));
            break;
          }
          pseudoLegalMoves.push(indicesToSquare(r, f));
        }
      }
    };
    
    switch(piece.type) {
        case 'pawn':
            const dir = color === 'white' ? -1 : 1;
            const startRank = color === 'white' ? 6 : 1;
            if (rank + dir >= 0 && rank + dir < 8 && !board[rank + dir][file]) {
                pseudoLegalMoves.push(indicesToSquare(rank + dir, file));
                if (rank === startRank && !board[rank + 2 * dir][file]) {
                    pseudoLegalMoves.push(indicesToSquare(rank + 2 * dir, file));
                }
            }
            [-1, 1].forEach(fileOffset => {
                if (file + fileOffset >= 0 && file + fileOffset < 8 && rank + dir >= 0 && rank + dir < 8) {
                    const target = board[rank + dir][file + fileOffset];
                    if (target && target.color === opponentColor) {
                        pseudoLegalMoves.push(indicesToSquare(rank + dir, file + fileOffset));
                    }
                }
            });
            break;
        case 'knight':
            [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, df]) => {
                const r = rank + dr, f = file + df;
                if (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    if (!board[r][f] || board[r][f]?.color !== color) pseudoLegalMoves.push(indicesToSquare(r, f));
                }
            });
            break;
        case 'bishop': addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1]]); break;
        case 'rook': addSlidingMoves([[-1, 0], [1, 0], [0, -1], [0, 1]]); break;
        case 'queen': addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]); break;
        case 'king':
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, df]) => {
                const r = rank + dr, f = file + df;
                if (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    if (!board[r][f] || board[r][f]?.color !== color) pseudoLegalMoves.push(indicesToSquare(r, f));
                }
            });
            break;
    }

    const legalMoves = pseudoLegalMoves.filter(toSquare => {
        const [toRank, toFile] = squareToIndices(toSquare);
        const tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard[toRank][toFile] = piece;
        tempBoard[rank][file] = null;
        let kingRank = -1, kingFile = -1;
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const p = tempBoard[r][f];
                if (p && p.type === 'king' && p.color === color) {
                    kingRank = r; kingFile = f; break;
                }
            }
            if (kingRank !== -1) break;
        }
        return !isSquareAttacked(tempBoard, kingRank, kingFile, opponentColor);
    });

    return legalMoves;
}