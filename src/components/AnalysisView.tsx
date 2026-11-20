import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  Cpu,
  Eraser,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  applyMove,
  BoardArray,
  cloneBoard,
  Color,
  countMaterial,
  createEmptyBoard,
  createInitialBoard,
  formatMoveDetailed,
  getLegalMoves,
  Move,
  oppositeColor,
  parseFEN,
  toFEN,
} from '../engine/draughts';
import { evaluateBoard, findBestMove } from '../engine/search';
import { playCaptureSound, playMoveSound } from '../utils/sound';
import { BoardTheme, DraughtsBoard } from './DraughtsBoard';
import { BoardToolbar, PlayerStrip } from './BoardStatusBar';

interface AnalysisViewProps {
  flipped: boolean;
  onToggleFlip: () => void;
  showNumbers: boolean;
  onToggleNumbers: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: BoardTheme;
  onChangeTheme: (t: BoardTheme) => void;
}

interface HistoryEntry {
  board: BoardArray;
  turn: Color;
  notation: string | null;
  lastMove: { from: number; to: number } | null;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  flipped,
  onToggleFlip,
  showNumbers,
  onToggleNumbers,
  soundEnabled,
  onToggleSound,
  theme,
  onChangeTheme,
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      board: createInitialBoard(),
      turn: 'w',
      notation: null,
      lastMove: null,
    },
  ]);

  const [editorTool, setEditorTool] = useState<
    'play' | 'w' | 'W' | 'b' | 'B' | 'erase'
  >('play');
  const [playVsBot, setPlayVsBot] = useState<boolean>(false);
  const [botThinking, setBotThinking] = useState<boolean>(false);
  const [fenInput, setFenInput] = useState<string>('');
  const [fenError, setFenError] = useState<string | null>(null);
  const [copiedFen, setCopiedFen] = useState<boolean>(false);

  const [engineHint, setEngineHint] = useState<{
    move: Move;
    score: number;
    nodes: number;
  } | null>(null);

  const [customArrows, setCustomArrows] = useState<
    Array<{ from: number; to: number; color: 'green' | 'blue' | 'gold' }>
  >([]);
  const [customHighlights, setCustomHighlights] = useState<
    Array<{ sq: number; color: 'green' | 'blue' | 'gold' }>
  >([]);

  const current = history[history.length - 1];
  const legalMoves = useMemo(
    () => getLegalMoves(current.board, current.turn),
    [current.board, current.turn]
  );
  const material = useMemo(
    () => countMaterial(current.board),
    [current.board]
  );
  const staticEval = useMemo(
    () => evaluateBoard(current.board),
    [current.board]
  );
  const hasMandatoryCapture =
    legalMoves.length > 0 && legalMoves[0].captures.length > 0;

  // Sync FEN input box when board changes
  useEffect(() => {
    setFenInput(toFEN(current.board, current.turn));
    setFenError(null);
  }, [current.board, current.turn]);

  // Bot auto-reply when playing vs Computer (Black)
  useEffect(() => {
    if (!playVsBot || editorTool !== 'play' || current.turn !== 'b') return;
    if (legalMoves.length === 0) return;

    setBotThinking(true);
    const timer = window.setTimeout(() => {
      const result = findBestMove(current.board, 'b', 4);
      if (result.bestMove) {
        const m = result.bestMove;
        if (m.captures.length > 0) playCaptureSound(soundEnabled);
        else playMoveSound(soundEnabled);

        setHistory((prev) => [
          ...prev,
          {
            board: applyMove(current.board, m),
            turn: 'w',
            notation: formatMoveDetailed(m),
            lastMove: { from: m.from, to: m.to },
          },
        ]);
        setEngineHint(null);
      }
      setBotThinking(false);
    }, 360);

    return () => window.clearTimeout(timer);
  }, [playVsBot, editorTool, current.turn, current.board, legalMoves.length, soundEnabled]);

  const handleMove = (move: Move) => {
    if (botThinking) return;
    if (move.captures.length > 0) playCaptureSound(soundEnabled);
    else playMoveSound(soundEnabled);

    const nextBoard = applyMove(current.board, move);
    setHistory((prev) => [
      ...prev,
      {
        board: nextBoard,
        turn: oppositeColor(current.turn),
        notation: formatMoveDetailed(move),
        lastMove: { from: move.from, to: move.to },
      },
    ]);
    setEngineHint(null);
  };

  const handleEditorSquareClick = (sq: number) => {
    const nextBoard = cloneBoard(current.board);
    if (editorTool === 'erase') {
      nextBoard[sq] = null;
    } else if (editorTool !== 'play') {
      nextBoard[sq] = nextBoard[sq] === editorTool ? null : editorTool;
    }
    setHistory([
      {
        board: nextBoard,
        turn: current.turn,
        notation: null,
        lastMove: null,
      },
    ]);
    setEngineHint(null);
  };

  const handleUndo = () => {
    if (history.length <= 1 || botThinking) return;
    const stepsBack = playVsBot && current.turn === 'w' && history.length >= 3 ? 2 : 1;
    setHistory((prev) => prev.slice(0, prev.length - stepsBack));
    setEngineHint(null);
  };

  const handleResetStandard = () => {
    setPlayVsBot(false);
    setEditorTool('play');
    setHistory([
      {
        board: createInitialBoard(),
        turn: 'w',
        notation: null,
        lastMove: null,
      },
    ]);
    setEngineHint(null);
    setCustomArrows([]);
    setCustomHighlights([]);
  };

  const handleClearBoard = () => {
    setPlayVsBot(false);
    setHistory([
      {
        board: createEmptyBoard(),
        turn: 'w',
        notation: null,
        lastMove: null,
      },
    ]);
    setEngineHint(null);
  };

  const handleSwitchTurn = (nextTurn: Color) => {
    setHistory((prev) => [
      ...prev.slice(0, -1),
      { ...current, turn: nextTurn },
    ]);
    setEngineHint(null);
  };

  const handleLoadFEN = () => {
    try {
      const parsed = parseFEN(fenInput);
      const total =
        parsed.board.filter((p) => p !== null).length;
      if (total === 0 && !fenInput.includes(':W:B')) {
        setFenError('Aucune pièce détectée dans ce code FEN.');
        return;
      }
      setHistory([
        {
          board: parsed.board,
          turn: parsed.turn,
          notation: null,
          lastMove: null,
        },
      ]);
      setEngineHint(null);
      setFenError(null);
    } catch {
      setFenError('Format FEN FMJD invalide (ex. W:W31-50:B1-20).');
    }
  };

  const handleCopyFEN = () => {
    const fen = toFEN(current.board, current.turn);
    navigator.clipboard?.writeText(fen).catch(() => {});
    setCopiedFen(true);
    window.setTimeout(() => setCopiedFen(false), 1400);
  };

  const handleAnalyzeBestMove = () => {
    if (legalMoves.length === 0) return;
    const res = findBestMove(current.board, current.turn, 4);
    if (res.bestMove) {
      setEngineHint({
        move: res.bestMove,
        score: res.score,
        nodes: res.nodes,
      });
    }
  };

  const handleToggleCustomHighlight = (sq: number) => {
    setCustomHighlights((prev) => {
      const exists = prev.some((h) => h.sq === sq);
      return exists
        ? prev.filter((h) => h.sq !== sq)
        : [...prev, { sq, color: 'green' }];
    });
  };

  const handleAddCustomArrow = (from: number, to: number) => {
    setCustomArrows((prev) => {
      const exists = prev.some((a) => a.from === from && a.to === to);
      return exists
        ? prev.filter((a) => !(a.from === from && a.to === to))
        : [...prev, { from, to, color: 'gold' }];
    });
  };

  const displayedArrows = useMemo(() => {
    const arr = [...customArrows];
    if (engineHint) {
      arr.push({
        from: engineHint.move.from,
        to: engineHint.move.to,
        color: 'blue',
      });
    }
    return arr;
  }, [customArrows, engineHint]);

  const evalFormatted = useMemo(() => {
    const raw = engineHint ? engineHint.score : staticEval;
    const pawns = (raw / 100).toFixed(2);
    return raw > 0 ? `+${pawns}` : pawns;
  }, [engineHint, staticEval]);

  const gameOver = legalMoves.length === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)_360px] gap-6 items-start">
      {/* Left Column: Board Editor & FEN */}
      <aside className="bg-[#262421] border border-[#3c3934] rounded-md p-4 space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-white">
            Éditeur d’échiquier 10×10
          </h2>
          <p className="text-xs text-[#8a8680]">
            Placez des pièces ou testez une variante FMJD librement.
          </p>
        </div>

        {/* Tool selector */}
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'play', label: 'Jouer coups' },
              { id: 'erase', label: 'Effacer case' },
              { id: 'w', label: 'Pion Blanc' },
              { id: 'b', label: 'Pion Noir' },
              { id: 'W', label: 'Dame Blanche' },
              { id: 'B', label: 'Dame Noire' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setEditorTool(t.id)}
              className={`px-2.5 py-2 text-xs font-medium rounded border transition-colors cursor-pointer text-left ${
                editorTool === t.id
                  ? 'bg-[#629924] border-[#629924] text-white'
                  : 'bg-[#161512] border-[#3c3934] text-[#bababa] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Turn Selector */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-[#bababa]">
            Trait actif
          </span>
          <div className="flex items-center gap-1 p-1 bg-[#161512] rounded border border-[#3c3934]">
            <button
              type="button"
              onClick={() => handleSwitchTurn('w')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                current.turn === 'w'
                  ? 'bg-[#302e2c] text-white'
                  : 'text-[#8a8680] hover:text-[#bababa]'
              }`}
            >
              Blancs
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTurn('b')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                current.turn === 'b'
                  ? 'bg-[#302e2c] text-white'
                  : 'text-[#8a8680] hover:text-[#bababa]'
              }`}
            >
              Noirs
            </button>
          </div>
        </div>

        {/* Quick Setup Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetStandard}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded border border-[#3c3934] bg-[#302e2c] hover:bg-[#3c3934] text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Initiale
          </button>
          <button
            type="button"
            onClick={handleClearBoard}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded border border-[#3c3934] bg-[#161512] hover:bg-[#302e2c] text-[#bababa] hover:text-white transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vider
          </button>
        </div>

        {/* FEN Import / Export */}
        <div className="pt-3 border-t border-[#3c3934] space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="fen-input" className="text-xs font-medium text-white">
              Notation FEN FMJD
            </label>
            <button
              type="button"
              onClick={handleCopyFEN}
              className="inline-flex items-center gap-1 text-xs text-[#3692e7] hover:underline cursor-pointer"
            >
              {copiedFen ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedFen ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            id="fen-input"
            value={fenInput}
            onChange={(e) => setFenInput(e.target.value)}
            rows={2}
            className="w-full px-2.5 py-2 text-xs font-mono bg-[#161512] border border-[#3c3934] rounded text-white focus:outline-none focus:border-[#3692e7]"
          />
          {fenError && <p className="text-xs text-[#e06c6c]">{fenError}</p>}
          <button
            type="button"
            onClick={handleLoadFEN}
            className="w-full py-1.5 px-3 text-xs font-medium rounded bg-[#302e2c] hover:bg-[#3c3934] text-white border border-[#3c3934] transition-colors cursor-pointer"
          >
            Charger cette position
          </button>
        </div>
      </aside>

      {/* Center Column: Interactive 10x10 Board */}
      <section className="flex flex-col items-center w-full">
        <div className="w-full max-w-[600px] space-y-2.5">
          <PlayerStrip
            side={flipped ? 'w' : 'b'}
            isTurn={current.turn === (flipped ? 'w' : 'b')}
            hasMandatoryCapture={
              current.turn === (flipped ? 'w' : 'b') && hasMandatoryCapture
            }
            material={material}
            label={
              flipped
                ? 'Blancs'
                : playVsBot
                  ? botThinking
                    ? 'Ordinateur (réfléchit...)'
                    : 'Ordinateur (Noirs)'
                  : 'Noirs'
            }
          />

          <DraughtsBoard
            board={current.board}
            turn={current.turn}
            legalMoves={legalMoves}
            onMove={handleMove}
            flipped={flipped}
            showNumbers={showNumbers}
            theme={theme}
            interactive={
              editorTool === 'play' &&
              !gameOver &&
              !(playVsBot && current.turn === 'b')
            }
            lastMove={current.lastMove}
            customArrows={displayedArrows}
            customHighlights={customHighlights}
            onToggleCustomHighlight={handleToggleCustomHighlight}
            onAddCustomArrow={handleAddCustomArrow}
            editorTool={editorTool}
            onEditorSquareClick={handleEditorSquareClick}
          />

          <PlayerStrip
            side={flipped ? 'b' : 'w'}
            isTurn={current.turn === (flipped ? 'b' : 'w')}
            hasMandatoryCapture={
              current.turn === (flipped ? 'b' : 'w') && hasMandatoryCapture
            }
            material={material}
            label={flipped ? 'Noirs' : 'Blancs'}
          />

          <BoardToolbar
            flipped={flipped}
            onToggleFlip={onToggleFlip}
            showNumbers={showNumbers}
            onToggleNumbers={onToggleNumbers}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            theme={theme}
            onChangeTheme={onChangeTheme}
          />
        </div>
      </section>

      {/* Right Column: Tactical Evaluator, Bot & PDN History */}
      <aside className="bg-[#262421] border border-[#3c3934] rounded-md p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white">
            Évaluation & Coups légaux
          </h2>
          <span className="font-mono text-sm font-semibold text-white bg-[#161512] border border-[#3c3934] px-2.5 py-1 rounded tabular-nums">
            {evalFormatted}
          </span>
        </div>

        {/* Engine & Sparring Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleAnalyzeBestMove}
            disabled={gameOver || botThinking}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded bg-[#3692e7] hover:bg-[#49a0f0] text-white disabled:opacity-45 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            Calculer le meilleur coup
          </button>

          <button
            type="button"
            onClick={() => {
              setEditorTool('play');
              setPlayVsBot((v) => !v);
            }}
            className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded border transition-colors cursor-pointer ${
              playVsBot
                ? 'bg-[#629924]/20 border-[#629924] text-[#8ad13b]'
                : 'bg-[#302e2c] border-[#3c3934] text-white hover:bg-[#3c3934]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            {playVsBot
              ? 'Mode Sparring actif (vous jouez Blancs)'
              : 'Jouer contre l’ordinateur (Noirs)'}
          </button>
        </div>

        {engineHint && (
          <div className="p-3 rounded bg-[#161512] border border-[#3692e7]/60 text-xs space-y-1">
            <div className="flex items-center justify-between text-white font-semibold">
              <span>Coup recommandé</span>
              <span className="font-mono text-[#3692e7] tabular-nums">
                {formatMoveDetailed(engineHint.move)}
              </span>
            </div>
            <p className="text-[#8a8680] font-mono tabular-nums">
              Évaluation : {evalFormatted} · {engineHint.nodes} nœuds explorés
            </p>
          </div>
        )}

        {gameOver && (
          <div className="p-3 rounded bg-[#d59120]/15 border border-[#d59120] text-xs text-white font-medium">
            Partie terminée — Plus aucun coup légal pour les{' '}
            {current.turn === 'w' ? 'Blancs' : 'Noirs'}. Victoire des{' '}
            {current.turn === 'w' ? 'Noirs' : 'Blancs'}.
          </div>
        )}

        {/* Legal Moves Explorer */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#8a8680]">
            <span>
              Coups légaux ({current.turn === 'w' ? 'Blancs' : 'Noirs'})
            </span>
            <span className="font-mono tabular-nums">{legalMoves.length}</span>
          </div>
          <div className="max-h-36 overflow-y-auto bg-[#161512] border border-[#3c3934] rounded p-2 flex flex-wrap gap-1.5">
            {legalMoves.map((m, idx) => (
              <button
                key={`${m.from}-${m.to}-${idx}`}
                type="button"
                disabled={botThinking || (playVsBot && current.turn === 'b')}
                onClick={() => handleMove(m)}
                className="px-2 py-1 text-xs font-mono tabular-nums rounded bg-[#262421] hover:bg-[#629924] text-[#bababa] hover:text-white transition-colors cursor-pointer disabled:opacity-45"
              >
                {formatMoveDetailed(m)}
              </button>
            ))}
          </div>
        </div>

        {/* History & Annotation Controls */}
        <div className="space-y-2 pt-2 border-t border-[#3c3934]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-white">
              Historique de la partie
            </span>
            <div className="flex items-center gap-1.5">
              {(customArrows.length > 0 || customHighlights.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomArrows([]);
                    setCustomHighlights([]);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-[#3c3934] bg-[#161512] text-[#bababa] hover:text-white cursor-pointer"
                >
                  <Eraser className="w-3 h-3" />
                  Flèches
                </button>
              )}
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length <= 1 || botThinking}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-[#3c3934] bg-[#302e2c] hover:bg-[#3c3934] text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <Undo2 className="w-3 h-3" />
                Annuler
              </button>
            </div>
          </div>

          <div className="max-h-32 overflow-y-auto bg-[#161512] border border-[#3c3934] rounded p-2.5 text-xs font-mono text-[#bababa] tabular-nums">
            {history.length <= 1 ? (
              <span className="text-[#8a8680] font-sans">
                Aucun coup joué. Clic droit sur l’échiquier pour tracer des flèches.
              </span>
            ) : (
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {history.slice(1).map((h, i) => (
                  <span key={i} className="text-white">
                    {i % 2 === 0 ? (
                      <span className="text-[#8a8680] mr-1">
                        {Math.floor(i / 2) + 1}.
                      </span>
                    ) : null}
                    {h.notation}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
