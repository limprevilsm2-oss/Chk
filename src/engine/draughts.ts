export type Piece = 'w' | 'b' | 'W' | 'B';
export type Color = 'w' | 'b';
export type BoardArray = (Piece | null)[];

export interface Move {
  from: number;
  to: number;
  path: number[]; // Full sequence of squares visited, starting with `from` and ending with `to`
  captures: number[]; // Squares of captured opponent pieces in sequence
  promotes: boolean;
}

export interface MaterialCount {
  whiteMen: number;
  whiteKings: number;
  blackMen: number;
  blackKings: number;
  whiteTotal: number;
  blackTotal: number;
}

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], // NW
  [-1, 1],  // NE
  [1, -1],  // SW
  [1, 1],   // SE
];

export function isWhitePiece(piece: Piece | null): boolean {
  return piece === 'w' || piece === 'W';
}

export function isBlackPiece(piece: Piece | null): boolean {
  return piece === 'b' || piece === 'B';
}

export function isKing(piece: Piece | null): boolean {
  return piece === 'W' || piece === 'B';
}

export function pieceColor(piece: Piece | null): Color | null {
  if (piece === 'w' || piece === 'W') return 'w';
  if (piece === 'b' || piece === 'B') return 'b';
  return null;
}

export function oppositeColor(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

export function squareToCoords(sq: number): { row: number; col: number } {
  const idx = sq - 1;
  const row = Math.floor(idx / 5);
  const col = (idx % 5) * 2 + (row % 2 === 0 ? 1 : 0);
  return { row, col };
}

export function coordsToSquare(row: number, col: number): number | null {
  if (row < 0 || row > 9 || col < 0 || col > 9) return null;
  if ((row + col) % 2 === 0) return null;
  return row * 5 + Math.floor(col / 2) + 1;
}

// Precompute neighbors for each square 1..50 in the 4 diagonal directions
const NEIGHBORS: (number | null)[][] = Array.from({ length: 51 }, (_, sq) => {
  if (sq === 0) return [null, null, null, null];
  const { row, col } = squareToCoords(sq);
  return DIRS.map(([dr, dc]) => coordsToSquare(row + dr, col + dc));
});

export function createEmptyBoard(): BoardArray {
  return Array<Piece | null>(51).fill(null);
}

export function createInitialBoard(): BoardArray {
  const board = createEmptyBoard();
  for (let sq = 1; sq <= 20; sq++) board[sq] = 'b';
  for (let sq = 31; sq <= 50; sq++) board[sq] = 'w';
  return board;
}

export function cloneBoard(board: BoardArray): BoardArray {
  return board.slice();
}

function expandSquareToken(token: string): Array<{ sq: number; king: boolean }> {
  const trimmed = token.trim();
  if (!trimmed) return [];
  const king = trimmed.startsWith('K') || trimmed.startsWith('D');
  const raw = king ? trimmed.slice(1) : trimmed;
  if (raw.includes('-')) {
    const [aStr, bStr] = raw.split('-');
    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return [];
    const res: Array<{ sq: number; king: boolean }> = [];
    const step = a <= b ? 1 : -1;
    for (let s = a; step > 0 ? s <= b : s >= b; s += step) {
      if (s >= 1 && s <= 50) res.push({ sq: s, king });
    }
    return res;
  }
  const sq = parseInt(raw, 10);
  if (Number.isFinite(sq) && sq >= 1 && sq <= 50) {
    return [{ sq, king }];
  }
  return [];
}

/**
 * Parses standard FMJD FEN, e.g. "W:W31-50:B1-20" or "B:WK5,32:B14,K46"
 */
export function parseFEN(fen: string): { board: BoardArray; turn: Color } {
  const board = createEmptyBoard();
  const clean = fen.trim().replace(/\.$/, '');
  const parts = clean.split(':');

  let turn: Color = 'w';
  if (parts[0]?.toUpperCase() === 'B') turn = 'b';

  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i].trim();
    if (!seg) continue;
    const sideChar = seg[0].toUpperCase();
    if (sideChar !== 'W' && sideChar !== 'B') continue;
    const isWhite = sideChar === 'W';
    const listStr = seg.slice(1);
    if (!listStr) continue;
    for (const tok of listStr.split(',')) {
      for (const { sq, king } of expandSquareToken(tok)) {
        board[sq] = isWhite ? (king ? 'W' : 'w') : king ? 'B' : 'b';
      }
    }
  }

  return { board, turn };
}

export function toFEN(board: BoardArray, turn: Color): string {
  const whites: string[] = [];
  const blacks: string[] = [];
  for (let sq = 1; sq <= 50; sq++) {
    const p = board[sq];
    if (p === 'w') whites.push(String(sq));
    else if (p === 'W') whites.push(`K${sq}`);
    else if (p === 'b') blacks.push(String(sq));
    else if (p === 'B') blacks.push(`K${sq}`);
  }
  const t = turn === 'w' ? 'W' : 'B';
  return `${t}:W${whites.join(',')}:B${blacks.join(',')}`;
}

export function getCapturesForPiece(
  board: BoardArray,
  startSq: number,
  turn: Color
): Move[] {
  const piece = board[startSq];
  if (!piece || pieceColor(piece) !== turn) return [];

  const king = isKing(piece);
  const opponent = oppositeColor(turn);
  const results: Move[] = [];

  function isAvailableSquare(sq: number): boolean {
    return board[sq] === null || sq === startSq;
  }

  if (!king) {
    function dfsMan(
      currentSq: number,
      path: number[],
      captures: number[],
      capturedSet: Set<number>
    ) {
      let extended = false;
      for (let d = 0; d < 4; d++) {
        const mid = NEIGHBORS[currentSq][d];
        if (mid === null) continue;
        const midPiece = board[mid];
        if (midPiece && pieceColor(midPiece) === opponent && !capturedSet.has(mid)) {
          const land = NEIGHBORS[mid][d];
          if (land !== null && isAvailableSquare(land)) {
            extended = true;
            capturedSet.add(mid);
            path.push(land);
            captures.push(mid);
            dfsMan(land, path, captures, capturedSet);
            captures.pop();
            path.pop();
            capturedSet.delete(mid);
          }
        }
      }
      if (!extended && captures.length > 0) {
        const to = path[path.length - 1];
        const { row } = squareToCoords(to);
        const promotes = (turn === 'w' && row === 0) || (turn === 'b' && row === 9);
        results.push({
          from: startSq,
          to,
          path: path.slice(),
          captures: captures.slice(),
          promotes,
        });
      }
    }

    dfsMan(startSq, [startSq], [], new Set<number>());
  } else {
    function dfsKing(
      currentSq: number,
      path: number[],
      captures: number[],
      capturedSet: Set<number>
    ) {
      let extended = false;
      for (let d = 0; d < 4; d++) {
        let scan = NEIGHBORS[currentSq][d];
        while (scan !== null && isAvailableSquare(scan)) {
          scan = NEIGHBORS[scan][d];
        }
        if (scan === null) continue;
        const targetPiece = board[scan];
        if (
          targetPiece &&
          pieceColor(targetPiece) === opponent &&
          !capturedSet.has(scan)
        ) {
          const mid = scan;
          let land = NEIGHBORS[mid][d];
          while (land !== null && isAvailableSquare(land)) {
            extended = true;
            capturedSet.add(mid);
            path.push(land);
            captures.push(mid);
            dfsKing(land, path, captures, capturedSet);
            captures.pop();
            path.pop();
            capturedSet.delete(mid);
            land = NEIGHBORS[land][d];
          }
        }
      }
      if (!extended && captures.length > 0) {
        results.push({
          from: startSq,
          to: path[path.length - 1],
          path: path.slice(),
          captures: captures.slice(),
          promotes: false,
        });
      }
    }

    dfsKing(startSq, [startSq], [], new Set<number>());
  }

  return results;
}

export function getQuietMovesForPiece(
  board: BoardArray,
  sq: number,
  turn: Color
): Move[] {
  const piece = board[sq];
  if (!piece || pieceColor(piece) !== turn) return [];

  const moves: Move[] = [];
  if (!isKing(piece)) {
    const dirIndices = turn === 'w' ? [0, 1] : [2, 3];
    for (const d of dirIndices) {
      const to = NEIGHBORS[sq][d];
      if (to !== null && board[to] === null) {
        const { row } = squareToCoords(to);
        const promotes = (turn === 'w' && row === 0) || (turn === 'b' && row === 9);
        moves.push({
          from: sq,
          to,
          path: [sq, to],
          captures: [],
          promotes,
        });
      }
    }
  } else {
    for (let d = 0; d < 4; d++) {
      let to = NEIGHBORS[sq][d];
      while (to !== null && board[to] === null) {
        moves.push({
          from: sq,
          to,
          path: [sq, to],
          captures: [],
          promotes: false,
        });
        to = NEIGHBORS[to][d];
      }
    }
  }
  return moves;
}

/**
 * Generates all FMJD legal moves for `turn`, strictly enforcing mandatory
 * capture and the majority capture rule (maximum number of captured pieces).
 */
export function getLegalMoves(board: BoardArray, turn: Color): Move[] {
  let allCaptures: Move[] = [];
  let maxCap = 0;

  for (let sq = 1; sq <= 50; sq++) {
    const p = board[sq];
    if (p && pieceColor(p) === turn) {
      const caps = getCapturesForPiece(board, sq, turn);
      for (const c of caps) {
        if (c.captures.length > maxCap) {
          maxCap = c.captures.length;
          allCaptures = [c];
        } else if (c.captures.length === maxCap) {
          allCaptures.push(c);
        }
      }
    }
  }

  if (maxCap > 0) {
    return allCaptures;
  }

  const quietMoves: Move[] = [];
  for (let sq = 1; sq <= 50; sq++) {
    const p = board[sq];
    if (p && pieceColor(p) === turn) {
      quietMoves.push(...getQuietMovesForPiece(board, sq, turn));
    }
  }
  return quietMoves;
}

export function applyMove(board: BoardArray, move: Move): BoardArray {
  const next = cloneBoard(board);
  const piece = next[move.from];
  if (!piece) return next;

  next[move.from] = null;
  for (const capSq of move.captures) {
    next[capSq] = null;
  }

  if (move.promotes) {
    next[move.to] = piece === 'w' ? 'W' : piece === 'b' ? 'B' : piece;
  } else {
    next[move.to] = piece;
  }
  return next;
}

export function formatMove(move: Move): string {
  const sep = move.captures.length > 0 ? 'x' : '-';
  return `${move.from}${sep}${move.to}`;
}

export function formatMoveDetailed(move: Move): string {
  if (move.captures.length === 0) return `${move.from}-${move.to}`;
  return move.path.join('x');
}

/**
 * Matches a move notation string (e.g. "32-28", "28x19", "28x19x8") against legal moves.
 */
export function findLegalMoveByNotation(
  board: BoardArray,
  turn: Color,
  notation: string
): Move | null {
  const clean = notation.trim().replace(/[+!?]+$/, '');
  const legal = getLegalMoves(board, turn);

  // Exact detailed path match first (e.g. "28x19x8")
  const exactDetailed = legal.find((m) => formatMoveDetailed(m) === clean);
  if (exactDetailed) return exactDetailed;

  // Compact match (e.g. "32-28" or "28x8")
  const exactCompact = legal.find((m) => formatMove(m) === clean);
  if (exactCompact) return exactCompact;

  return null;
}

export function countMaterial(board: BoardArray): MaterialCount {
  let whiteMen = 0;
  let whiteKings = 0;
  let blackMen = 0;
  let blackKings = 0;
  for (let sq = 1; sq <= 50; sq++) {
    const p = board[sq];
    if (p === 'w') whiteMen++;
    else if (p === 'W') whiteKings++;
    else if (p === 'b') blackMen++;
    else if (p === 'B') blackKings++;
  }
  return {
    whiteMen,
    whiteKings,
    blackMen,
    blackKings,
    whiteTotal: whiteMen + whiteKings,
    blackTotal: blackMen + blackKings,
  };
}
