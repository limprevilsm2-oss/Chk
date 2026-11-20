import React, { useMemo, useRef, useState } from 'react';
import {
  BoardArray,
  Color,
  coordsToSquare,
  isKing,
  Move,
  pieceColor,
  squareToCoords,
} from '../engine/draughts';
import { BoardAnnotation } from '../data/curriculum';

export type BoardTheme = 'classic' | 'emerald' | 'slate';

const BOARD_THEMES: Record<
  BoardTheme,
  { dark: string; light: string; label: string; coordOnDark: string }
> = {
  classic: {
    dark: '#b58863',
    light: '#f0d9b5',
    label: 'Bois Classique',
    coordOnDark: 'rgba(255, 255, 255, 0.65)',
  },
  emerald: {
    dark: '#6e8c52',
    light: '#eaecd0',
    label: 'Émeraude',
    coordOnDark: 'rgba(255, 255, 255, 0.7)',
  },
  slate: {
    dark: '#647282',
    light: '#dce2e8',
    label: 'Ardoise KNDB',
    coordOnDark: 'rgba(255, 255, 255, 0.72)',
  },
};

const ANNOTATION_COLORS = {
  green: '#629924',
  blue: '#3692e7',
  gold: '#d59120',
};

interface DraughtsBoardProps {
  board: BoardArray;
  turn: Color;
  legalMoves: Move[];
  onMove: (move: Move) => void;
  flipped?: boolean;
  showNumbers?: boolean;
  theme?: BoardTheme;
  interactive?: boolean;
  lastMove?: { from: number; to: number } | null;
  annotations?: BoardAnnotation | null;
  customArrows?: Array<{ from: number; to: number; color: 'green' | 'blue' | 'gold' }>;
  customHighlights?: Array<{ sq: number; color: 'green' | 'blue' | 'gold' }>;
  onToggleCustomHighlight?: (sq: number) => void;
  onAddCustomArrow?: (from: number, to: number) => void;
  // Editor mode support (for Analyse Libre)
  editorTool?: 'play' | 'w' | 'W' | 'b' | 'B' | 'erase';
  onEditorSquareClick?: (sq: number) => void;
}

function getSquareCenter(sq: number, flipped: boolean): { x: number; y: number } {
  const { row, col } = squareToCoords(sq);
  const visRow = flipped ? 9 - row : row;
  const visCol = flipped ? 9 - col : col;
  return {
    x: visCol * 100 + 50,
    y: visRow * 100 + 50,
  };
}

export const DraughtsBoard: React.FC<DraughtsBoardProps> = ({
  board,
  turn,
  legalMoves,
  onMove,
  flipped = false,
  showNumbers = true,
  theme = 'classic',
  interactive = true,
  lastMove = null,
  annotations = null,
  customArrows = [],
  customHighlights = [],
  onToggleCustomHighlight,
  onAddCustomArrow,
  editorTool = 'play',
  onEditorSquareClick,
}) => {
  // Selection state supports multi-step capture path disambiguation
  const [selectedSq, setSelectedSq] = useState<number | null>(null);
  const [capturePrefix, setCapturePrefix] = useState<number[]>([]);
  const rightDragStartRef = useRef<number | null>(null);

  const colors = BOARD_THEMES[theme];

  // Reset selection if board/turn changes externally
  const legalByFrom = useMemo(() => {
    const map = new Map<number, Move[]>();
    for (const m of legalMoves) {
      const list = map.get(m.from) ?? [];
      list.push(m);
      map.set(m.from, list);
    }
    return map;
  }, [legalMoves]);

  // Active candidate moves matching current selection + capturePrefix
  const candidateMoves = useMemo(() => {
    if (selectedSq === null) return [];
    const fromMoves = legalByFrom.get(selectedSq) ?? [];
    if (capturePrefix.length <= 1) return fromMoves;
    return fromMoves.filter((m) =>
      capturePrefix.every((sq, idx) => m.path[idx] === sq)
    );
  }, [selectedSq, capturePrefix, legalByFrom]);

  // Next reachable squares from current step
  const nextStepSquares = useMemo(() => {
    const stepIdx = Math.max(1, capturePrefix.length);
    const set = new Set<number>();
    for (const m of candidateMoves) {
      if (m.path[stepIdx] !== undefined) {
        set.add(m.path[stepIdx]);
      }
    }
    return set;
  }, [candidateMoves, capturePrefix]);

  // Direct final destination squares (when clicking a final square uniquely picks a move)
  const finalTargetSquares = useMemo(() => {
    const set = new Set<number>();
    for (const m of candidateMoves) {
      set.add(m.to);
    }
    return set;
  }, [candidateMoves]);

  // Pieces that have forced captures (only highlight when mandatory capture is active)
  const forcedCaptureSources = useMemo(() => {
    const set = new Set<number>();
    if (legalMoves.length > 0 && legalMoves[0].captures.length > 0) {
      for (const m of legalMoves) set.add(m.from);
    }
    return set;
  }, [legalMoves]);

  const clearSelection = () => {
    setSelectedSq(null);
    setCapturePrefix([]);
  };

  const handleSquareClick = (sq: number) => {
    if (editorTool !== 'play' && onEditorSquareClick) {
      clearSelection();
      onEditorSquareClick(sq);
      return;
    }

    if (!interactive) return;

    // 1. Check if clicking a valid next step or final target square
    if (selectedSq !== null) {
      const stepIdx = Math.max(1, capturePrefix.length);

      // Check exact moves whose next path step is `sq`
      const stepMatches = candidateMoves.filter((m) => m.path[stepIdx] === sq);
      if (stepMatches.length > 0) {
        // If there is only 1 candidate and `sq` is its final square (or all paths finish here)
        if (stepMatches.length === 1 && stepMatches[0].path.length - 1 === stepIdx) {
          const chosen = stepMatches[0];
          clearSelection();
          onMove(chosen);
          return;
        }
        // Check if multiple steps remain -> advance the capture prefix
        const remaining = stepMatches.filter((m) => m.path.length - 1 > stepIdx);
        if (remaining.length > 0) {
          setCapturePrefix([...(capturePrefix.length ? capturePrefix : [selectedSq]), sq]);
          return;
        }
        // Single terminal match
        const chosen = stepMatches[0];
        clearSelection();
        onMove(chosen);
        return;
      }

      // Also support clicking the final `to` square directly if unique!
      const finalMatches = candidateMoves.filter((m) => m.to === sq);
      if (finalMatches.length === 1) {
        clearSelection();
        onMove(finalMatches[0]);
        return;
      }
    }

    // 2. Selecting a piece owned by `turn` that has legal moves
    const piece = board[sq];
    if (piece && pieceColor(piece) === turn && legalByFrom.has(sq)) {
      if (selectedSq === sq && capturePrefix.length <= 1) {
        clearSelection();
      } else {
        setSelectedSq(sq);
        setCapturePrefix([sq]);
      }
      return;
    }

    clearSelection();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onToggleCustomHighlight || onAddCustomArrow) {
      e.preventDefault();
    }
  };

  const handleMouseDown = (e: React.MouseEvent, sq: number | null) => {
    if (e.button === 2 && sq !== null) {
      rightDragStartRef.current = sq;
    }
  };

  const handleMouseUp = (e: React.MouseEvent, sq: number | null) => {
    if (e.button === 2 && sq !== null && rightDragStartRef.current !== null) {
      const startSq = rightDragStartRef.current;
      rightDragStartRef.current = null;
      if (startSq === sq) {
        onToggleCustomHighlight?.(sq);
      } else {
        onAddCustomArrow?.(startSq, sq);
      }
    }
  };

  // Combine study annotations + user custom annotations
  const mergedHighlights = useMemo(() => {
    const map = new Map<number, 'green' | 'blue' | 'gold'>();
    annotations?.highlights?.forEach((h) => map.set(h.sq, h.color));
    customHighlights.forEach((h) => map.set(h.sq, h.color));
    return map;
  }, [annotations, customHighlights]);

  const mergedArrows = useMemo(() => {
    return [...(annotations?.arrows ?? []), ...customArrows];
  }, [annotations, customArrows]);

  // Currently active partial path ghost position
  const activeStepSq =
    capturePrefix.length > 1 ? capturePrefix[capturePrefix.length - 1] : null;

  const rows = useMemo(() => {
    const arr = Array.from({ length: 10 }, (_, i) => (flipped ? 9 - i : i));
    return arr;
  }, [flipped]);

  const cols = useMemo(() => {
    const arr = Array.from({ length: 10 }, (_, i) => (flipped ? 9 - i : i));
    return arr;
  }, [flipped]);

  return (
    <div
      className="relative w-full aspect-square max-w-[600px] select-none rounded-md overflow-hidden border border-[#3c3934] shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
      onContextMenu={handleContextMenu}
    >
      <div className="grid grid-cols-10 grid-rows-10 w-full h-full">
        {rows.map((row) =>
          cols.map((col) => {
            const sq = coordsToSquare(row, col);
            const isDark = sq !== null;
            const piece = sq !== null ? board[sq] : null;
            const isSelected = sq !== null && selectedSq === sq;
            const isLastFrom = sq !== null && lastMove?.from === sq;
            const isLastTo = sq !== null && lastMove?.to === sq;
            const isNextStep = sq !== null && nextStepSquares.has(sq);
            const isFinalTarget = sq !== null && finalTargetSquares.has(sq);
            const isForcedSource =
              interactive &&
              editorTool === 'play' &&
              sq !== null &&
              forcedCaptureSources.has(sq);
            const highlightColor = sq !== null ? mergedHighlights.get(sq) : undefined;
            const isVisitedInChain =
              sq !== null && capturePrefix.length > 1 && capturePrefix.includes(sq);

            return (
              <div
                key={`${row}-${col}`}
                onClick={() => sq !== null && handleSquareClick(sq)}
                onMouseDown={(e) => handleMouseDown(e, sq)}
                onMouseUp={(e) => handleMouseUp(e, sq)}
                style={{
                  backgroundColor: isDark ? colors.dark : colors.light,
                }}
                className={`relative flex items-center justify-center ${
                  isDark && (interactive || editorTool !== 'play')
                    ? 'cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                {/* Last move indicator */}
                {(isLastFrom || isLastTo) && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: 'rgba(155, 199, 0, 0.36)' }}
                  />
                )}

                {/* Selected square indicator */}
                {isSelected && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: 'rgba(98, 153, 36, 0.55)' }}
                  />
                )}

                {/* Annotation highlight */}
                {highlightColor && (
                  <div
                    className="absolute inset-0 pointer-events-none border-2"
                    style={{
                      backgroundColor: `${ANNOTATION_COLORS[highlightColor]}38`,
                      borderColor: ANNOTATION_COLORS[highlightColor],
                    }}
                  />
                )}

                {/* Forced capture indicator ring */}
                {isForcedSource && !isSelected && (
                  <div
                    className="absolute inset-[5%] rounded-full border-2 border-[#d59120]/80 pointer-events-none"
                    title="Prise obligatoire"
                  />
                )}

                {/* Visited square in multi-capture chain */}
                {isVisitedInChain && !isSelected && (
                  <div className="absolute w-3 h-3 rounded-full bg-[#629924]/70 pointer-events-none" />
                )}

                {/* FMJD Square Number (1-50) */}
                {showNumbers && sq !== null && (
                  <span
                    className="absolute top-[2px] left-[3px] text-[9px] sm:text-[10px] leading-none font-mono font-semibold tabular-nums pointer-events-none"
                    style={{ color: colors.coordOnDark }}
                  >
                    {sq}
                  </span>
                )}

                {/* Draughts Piece */}
                {piece && (
                  <DraughtsPiece
                    piece={piece}
                    dimmed={isSelected && activeStepSq !== null}
                  />
                )}

                {/* Ghost piece at active intermediate landing square */}
                {sq !== null && activeStepSq === sq && selectedSq !== null && board[selectedSq] && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-85">
                    <DraughtsPiece piece={board[selectedSq]!} />
                  </div>
                )}

                {/* Valid destination indicators */}
                {(isNextStep || isFinalTarget) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`rounded-full transition-transform duration-150 ${
                        isNextStep
                          ? 'w-[28%] h-[28%] bg-[#629924]/85 ring-2 ring-white/40'
                          : 'w-[22%] h-[22%] bg-[#3692e7]/75'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Tactical Arrows Overlay */}
      {mergedArrows.length > 0 && (
        <svg
          viewBox="0 0 1000 1000"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            {(['green', 'blue', 'gold'] as const).map((c) => (
              <marker
                key={c}
                id={`arrow-head-${c}`}
                markerWidth="4"
                markerHeight="4"
                refX="2.4"
                refY="2"
                orient="auto"
              >
                <path d="M0,0.4 L3.5,2 L0,3.6 Z" fill={ANNOTATION_COLORS[c]} />
              </marker>
            ))}
          </defs>
          {mergedArrows.map((arrow, idx) => {
            const p1 = getSquareCenter(arrow.from, flipped);
            const p2 = getSquareCenter(arrow.to, flipped);
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            // Shorten start and end slightly for crisp visual framing
            const x1 = p1.x + ux * 18;
            const y1 = p1.y + uy * 18;
            const x2 = p2.x - ux * 22;
            const y2 = p2.y - uy * 22;
            return (
              <line
                key={`${arrow.from}-${arrow.to}-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={ANNOTATION_COLORS[arrow.color]}
                strokeWidth="13"
                strokeLinecap="round"
                strokeOpacity="0.82"
                markerEnd={`url(#arrow-head-${arrow.color})`}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
};

interface DraughtsPieceProps {
  piece: 'w' | 'b' | 'W' | 'B';
  dimmed?: boolean;
}

const DraughtsPiece: React.FC<DraughtsPieceProps> = ({ piece, dimmed = false }) => {
  const isWhite = piece === 'w' || piece === 'W';
  const king = isKing(piece);

  return (
    <div
      className={`relative w-[78%] h-[78%] transition-transform duration-150 ${
        dimmed ? 'opacity-35 scale-90' : 'scale-100'
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_3px_4px_rgba(0,0,0,0.5)]">
        {isWhite ? (
          <>
            {/* Base thickness rim */}
            <circle cx="50" cy="54" r="42" fill="#b8aa96" />
            {/* Main disc */}
            <circle cx="50" cy="48" r="42" fill="#f5f1e6" stroke="#c8bcab" strokeWidth="2" />
            {/* Concentric tournament ridges */}
            <circle cx="50" cy="48" r="33" fill="none" stroke="#ded6c6" strokeWidth="2.5" />
            <circle cx="50" cy="48" r="22" fill="none" stroke="#e6dfd1" strokeWidth="2" />
            {king && (
              <g transform="translate(50, 48)">
                <circle r="16" fill="#d59120" fillOpacity="0.18" />
                <path
                  d="M-15 8 L-17 -6 L-7 1 L0 -11 L7 1 L17 -6 L15 8 Z"
                  fill="#d59120"
                  stroke="#9c650c"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </>
        ) : (
          <>
            {/* Base thickness rim */}
            <circle cx="50" cy="54" r="42" fill="#0f0e0c" />
            {/* Main disc */}
            <circle cx="50" cy="48" r="42" fill="#2b2723" stroke="#181614" strokeWidth="2" />
            {/* Concentric tournament ridges */}
            <circle cx="50" cy="48" r="33" fill="none" stroke="#3c3732" strokeWidth="2.5" />
            <circle cx="50" cy="48" r="22" fill="none" stroke="#46403a" strokeWidth="2" />
            {king && (
              <g transform="translate(50, 48)">
                <circle r="16" fill="#d59120" fillOpacity="0.16" />
                <path
                  d="M-15 8 L-17 -6 L-7 1 L0 -11 L7 1 L17 -6 L15 8 Z"
                  fill="#d59120"
                  stroke="#f4c76a"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </>
        )}
      </svg>
    </div>
  );
};
