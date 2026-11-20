import {
  applyMove,
  BoardArray,
  Color,
  getLegalMoves,
  Move,
  oppositeColor,
  squareToCoords,
} from './draughts';

export interface SearchResult {
  bestMove: Move | null;
  score: number; // Centipawns from White's perspective (+ = White better, - = Black better)
  nodes: number;
}

const KING_VALUE = 330;
const MAN_VALUE = 100;

/**
 * Evaluates a 10x10 draughts board position from White's perspective.
 * Combines material, advancement, central control, back-rank defense, and mobility.
 */
export function evaluateBoard(board: BoardArray): number {
  let score = 0;

  for (let sq = 1; sq <= 50; sq++) {
    const p = board[sq];
    if (!p) continue;
    const { row, col } = squareToCoords(sq);
    const centerBonus = (4.5 - Math.abs(col - 4.5)) * 2.5;

    if (p === 'w') {
      const adv = (9 - row) * 3.5;
      const backRank = row === 9 && (sq === 47 || sq === 48 || sq === 49) ? 8 : 0;
      const centerControl = row >= 3 && row <= 6 && col >= 2 && col <= 7 ? 7 : 0;
      score += MAN_VALUE + adv + centerBonus + backRank + centerControl;
    } else if (p === 'b') {
      const adv = row * 3.5;
      const backRank = row === 0 && (sq === 2 || sq === 3 || sq === 4) ? 8 : 0;
      const centerControl = row >= 3 && row <= 6 && col >= 2 && col <= 7 ? 7 : 0;
      score -= MAN_VALUE + adv + centerBonus + backRank + centerControl;
    } else if (p === 'W') {
      const mainDiag = row + col === 9 ? 14 : 0;
      score += KING_VALUE + centerBonus + mainDiag;
    } else if (p === 'B') {
      const mainDiag = row + col === 9 ? 14 : 0;
      score -= KING_VALUE + centerBonus + mainDiag;
    }
  }

  return Math.round(score);
}

function orderMoves(moves: Move[]): Move[] {
  return moves.slice().sort((a, b) => {
    const scoreA = a.captures.length * 100 + (a.promotes ? 80 : 0);
    const scoreB = b.captures.length * 100 + (b.promotes ? 80 : 0);
    return scoreB - scoreA;
  });
}

/**
 * Alpha-Beta search with capture quiescence extension for tactical accuracy.
 */
export function findBestMove(
  board: BoardArray,
  turn: Color,
  maxDepth = 4
): SearchResult {
  let nodes = 0;
  const legal = orderMoves(getLegalMoves(board, turn));
  if (legal.length === 0) {
    return {
      bestMove: null,
      score: turn === 'w' ? -9999 : 9999,
      nodes: 1,
    };
  }
  if (legal.length === 1) {
    const next = applyMove(board, legal[0]);
    return {
      bestMove: legal[0],
      score: evaluateBoard(next),
      nodes: 1,
    };
  }

  function alphabeta(
    b: BoardArray,
    side: Color,
    depth: number,
    alpha: number,
    beta: number,
    extLeft: number
  ): number {
    nodes++;
    const moves = getLegalMoves(b, side);
    if (moves.length === 0) {
      return side === 'w' ? -9000 - depth * 10 : 9000 + depth * 10;
    }

    const isCapture = moves[0].captures.length > 0;
    if (depth <= 0) {
      if (isCapture && extLeft > 0) {
        depth = 1;
        extLeft -= 1;
      } else {
        return evaluateBoard(b);
      }
    }

    const ordered = orderMoves(moves);
    if (side === 'w') {
      let best = -Infinity;
      for (const m of ordered) {
        const val = alphabeta(
          applyMove(b, m),
          oppositeColor(side),
          depth - 1,
          alpha,
          beta,
          extLeft
        );
        if (val > best) best = val;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const m of ordered) {
        const val = alphabeta(
          applyMove(b, m),
          oppositeColor(side),
          depth - 1,
          alpha,
          beta,
          extLeft
        );
        if (val < best) best = val;
        if (best < beta) beta = best;
        if (alpha >= beta) break;
      }
      return best;
    }
  }

  let bestMove = legal[0];
  let bestScore = turn === 'w' ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const m of legal) {
    const val = alphabeta(
      applyMove(board, m),
      oppositeColor(turn),
      maxDepth - 1,
      alpha,
      beta,
      3
    );
    if (turn === 'w') {
      if (val > bestScore) {
        bestScore = val;
        bestMove = m;
      }
      if (val > alpha) alpha = val;
    } else {
      if (val < bestScore) {
        bestScore = val;
        bestMove = m;
      }
      if (val < beta) beta = val;
    }
  }

  return { bestMove, score: bestScore, nodes };
}
