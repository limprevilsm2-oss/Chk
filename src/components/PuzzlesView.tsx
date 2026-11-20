import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  HelpCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { PUZZLES, Puzzle } from '../data/curriculum';
import {
  applyMove,
  BoardArray,
  Color,
  countMaterial,
  findLegalMoveByNotation,
  formatMoveDetailed,
  getLegalMoves,
  Move,
  oppositeColor,
  parseFEN,
} from '../engine/draughts';
import {
  playCaptureSound,
  playErrorSound,
  playMoveSound,
  playSuccessSound,
} from '../utils/sound';
import { BoardTheme, DraughtsBoard } from './DraughtsBoard';
import { BoardToolbar, PlayerStrip } from './BoardStatusBar';

interface PuzzlesViewProps {
  selectedPuzzleId: string;
  onSelectPuzzle: (id: string) => void;
  solvedPuzzles: string[];
  onMarkPuzzleSolved: (id: string) => void;
  flipped: boolean;
  onToggleFlip: () => void;
  showNumbers: boolean;
  onToggleNumbers: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: BoardTheme;
  onChangeTheme: (t: BoardTheme) => void;
}

export const PuzzlesView: React.FC<PuzzlesViewProps> = ({
  selectedPuzzleId,
  onSelectPuzzle,
  solvedPuzzles,
  onMarkPuzzleSolved,
  flipped,
  onToggleFlip,
  showNumbers,
  onToggleNumbers,
  soundEnabled,
  onToggleSound,
  theme,
  onChangeTheme,
}) => {
  const [filter, setFilter] = useState<'all' | 'todo' | 'solved'>('all');

  const puzzle: Puzzle = useMemo(
    () => PUZZLES.find((p) => p.id === selectedPuzzleId) ?? PUZZLES[0],
    [selectedPuzzleId]
  );

  const [board, setBoard] = useState<BoardArray>(() => parseFEN(puzzle.fen).board);
  const [turn, setTurn] = useState<Color>(() => parseFEN(puzzle.fen).turn);
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [lastMove, setLastMove] = useState<{ from: number; to: number } | null>(
    null
  );
  const [status, setStatus] = useState<'playing' | 'wrong' | 'solved' | 'revealed'>(
    'playing'
  );
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [attempts, setAttempts] = useState<number>(0);

  // Reset puzzle state whenever puzzle changes
  const resetPuzzle = () => {
    const { board: b, turn: t } = parseFEN(puzzle.fen);
    setBoard(b);
    setTurn(t);
    setStepIdx(0);
    setLastMove(null);
    setStatus('playing');
    setHintLevel(0);
  };

  useEffect(() => {
    resetPuzzle();
    setAttempts(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id]);

  const legalMoves = useMemo(() => getLegalMoves(board, turn), [board, turn]);
  const material = useMemo(() => countMaterial(board), [board]);
  const hasMandatoryCapture =
    legalMoves.length > 0 && legalMoves[0].captures.length > 0;

  // Highlight source square if Hint 1 or 2 is active
  const hintAnnotations = useMemo(() => {
    if (hintLevel === 0 || status === 'solved' || status === 'revealed') {
      return null;
    }
    const expectedNotation = puzzle.solution[stepIdx];
    if (!expectedNotation) return null;
    const expectedMove = findLegalMoveByNotation(board, turn, expectedNotation);
    if (!expectedMove) return null;

    if (hintLevel === 1) {
      return {
        highlights: [{ sq: expectedMove.from, color: 'gold' as const }],
      };
    }
    return {
      highlights: [
        { sq: expectedMove.from, color: 'green' as const },
        { sq: expectedMove.to, color: 'blue' as const },
      ],
      arrows: [
        { from: expectedMove.from, to: expectedMove.to, color: 'green' as const },
      ],
    };
  }, [hintLevel, status, puzzle.solution, stepIdx, board, turn]);

  const handlePlayerMove = (move: Move) => {
    if (status !== 'playing' || turn !== 'w') return;

    const expectedNotation = puzzle.solution[stepIdx];
    const expectedMove = expectedNotation
      ? findLegalMoveByNotation(board, turn, expectedNotation)
      : null;

    const isMatch =
      expectedMove &&
      formatMoveDetailed(move) === formatMoveDetailed(expectedMove);

    if (!isMatch) {
      playErrorSound(soundEnabled);
      setAttempts((a) => a + 1);
      setStatus('wrong');
      window.setTimeout(() => {
        setStatus('playing');
      }, 950);
      return;
    }

    // Valid White move!
    if (move.captures.length > 0) playCaptureSound(soundEnabled);
    else playMoveSound(soundEnabled);

    const nextBoard = applyMove(board, move);
    const nextTurn = oppositeColor(turn);
    const nextStep = stepIdx + 1;

    setBoard(nextBoard);
    setTurn(nextTurn);
    setLastMove({ from: move.from, to: move.to });
    setStepIdx(nextStep);
    setHintLevel(0);

    if (nextStep >= puzzle.solution.length) {
      setStatus('solved');
      playSuccessSound(soundEnabled);
      onMarkPuzzleSolved(puzzle.id);
      return;
    }

    // Execute opponent's forced reply after short pause
    const replyNotation = puzzle.solution[nextStep];
    window.setTimeout(() => {
      const replyMove = findLegalMoveByNotation(
        nextBoard,
        nextTurn,
        replyNotation
      );
      if (!replyMove) return;

      if (replyMove.captures.length > 0) playCaptureSound(soundEnabled);
      else playMoveSound(soundEnabled);

      const afterReplyBoard = applyMove(nextBoard, replyMove);
      const afterReplyTurn = oppositeColor(nextTurn);
      const afterReplyStep = nextStep + 1;

      setBoard(afterReplyBoard);
      setTurn(afterReplyTurn);
      setLastMove({ from: replyMove.from, to: replyMove.to });
      setStepIdx(afterReplyStep);

      if (afterReplyStep >= puzzle.solution.length) {
        setStatus('solved');
        playSuccessSound(soundEnabled);
        onMarkPuzzleSolved(puzzle.id);
      }
    }, 420);
  };

  const handleRevealSolution = () => {
    const { board: initB, turn: initT } = parseFEN(puzzle.fen);
    let curB = initB;
    let curT = initT;
    let last: { from: number; to: number } | null = null;
    for (const mStr of puzzle.solution) {
      const m = findLegalMoveByNotation(curB, curT, mStr);
      if (m) {
        curB = applyMove(curB, m);
        curT = oppositeColor(curT);
        last = { from: m.from, to: m.to };
      }
    }
    setBoard(curB);
    setTurn(curT);
    setLastMove(last);
    setStepIdx(puzzle.solution.length);
    setStatus('revealed');
    playMoveSound(soundEnabled);
  };

  const filteredPuzzles = useMemo(() => {
    if (filter === 'todo') {
      return PUZZLES.filter((p) => !solvedPuzzles.includes(p.id));
    }
    if (filter === 'solved') {
      return PUZZLES.filter((p) => solvedPuzzles.includes(p.id));
    }
    return PUZZLES;
  }, [filter, solvedPuzzles]);

  const currentIdx = PUZZLES.findIndex((p) => p.id === puzzle.id);
  const nextPuzzle = PUZZLES[currentIdx + 1] ?? PUZZLES[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)_360px] gap-6 items-start">
      {/* Left Column: Puzzle List */}
      <aside className="bg-[#262421] border border-[#3c3934] rounded-md overflow-hidden">
        <div className="p-4 border-b border-[#3c3934] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">
              Exercices tactiques
            </h2>
            <span className="text-xs font-mono text-[#bababa] tabular-nums">
              {solvedPuzzles.length}/{PUZZLES.length}
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#161512] rounded border border-[#3c3934]">
            {(
              [
                { id: 'all', label: 'Tous' },
                { id: 'todo', label: 'À faire' },
                { id: 'solved', label: 'Résolus' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`flex-1 py-1 px-2 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  filter === f.id
                    ? 'bg-[#302e2c] text-white'
                    : 'text-[#8a8680] hover:text-[#bababa]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <nav className="divide-y divide-[#3c3934]/60 max-h-[520px] overflow-y-auto">
          {filteredPuzzles.length === 0 ? (
            <div className="p-5 text-center text-xs text-[#8a8680]">
              Aucun exercice dans cette catégorie.
            </div>
          ) : (
            filteredPuzzles.map((item) => {
              const active = item.id === puzzle.id;
              const isSolved = solvedPuzzles.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPuzzle(item.id)}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#302e2c] text-white'
                      : 'hover:bg-[#302e2c]/50 text-[#bababa]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug">
                      <span className="font-mono text-xs text-[#8a8680] mr-1.5 tabular-nums">
                        {item.number}.
                      </span>
                      {item.title}
                    </span>
                    {isSolved && (
                      <CheckCircle2 className="w-4 h-4 text-[#629924] shrink-0 mt-0.5" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8a8680]">
                    <span>{item.motif}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.difficulty}</span>
                  </div>
                </button>
              );
            })
          )}
        </nav>
      </aside>

      {/* Center Column: Interactive 10x10 Board */}
      <section className="flex flex-col items-center w-full">
        <div className="w-full max-w-[600px] space-y-2.5">
          <PlayerStrip
            side={flipped ? 'w' : 'b'}
            isTurn={turn === (flipped ? 'w' : 'b')}
            hasMandatoryCapture={turn === (flipped ? 'w' : 'b') && hasMandatoryCapture}
            material={material}
            label={flipped ? 'Blancs (Vous)' : 'Noirs (Adversaire)'}
          />

          <DraughtsBoard
            board={board}
            turn={turn}
            legalMoves={legalMoves}
            onMove={handlePlayerMove}
            flipped={flipped}
            showNumbers={showNumbers}
            theme={theme}
            interactive={status === 'playing' && turn === 'w'}
            lastMove={lastMove}
            annotations={hintAnnotations}
          />

          <PlayerStrip
            side={flipped ? 'b' : 'w'}
            isTurn={turn === (flipped ? 'b' : 'w')}
            hasMandatoryCapture={turn === (flipped ? 'b' : 'w') && hasMandatoryCapture}
            material={material}
            label={flipped ? 'Noirs (Adversaire)' : 'Blancs (Vous)'}
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

      {/* Right Column: Objective, Feedback & Progressive Hints */}
      <aside className="bg-[#262421] border border-[#3c3934] rounded-md p-4 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#8a8680]">
            <span>Exercice {puzzle.number}</span>
            <span aria-hidden="true">·</span>
            <span>{puzzle.motif}</span>
            <span aria-hidden="true">·</span>
            <span>{puzzle.difficulty}</span>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {puzzle.title}
          </h1>
          <p className="text-sm text-[#d4d1cb] leading-relaxed">
            {puzzle.objective}
          </p>
        </div>

        {/* Status Feedback Banner (Explicit Icon + Text, never hue-only) */}
        <div
          className={`p-3.5 rounded border text-sm ${
            status === 'solved'
              ? 'bg-[#629924]/15 border-[#629924] text-white'
              : status === 'wrong'
                ? 'bg-[#c94a4a]/15 border-[#c94a4a] text-white'
                : status === 'revealed'
                  ? 'bg-[#3692e7]/15 border-[#3692e7] text-white'
                  : 'bg-[#302e2c] border-[#3c3934] text-[#bababa]'
          }`}
        >
          {status === 'playing' && (
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-white">
                {turn === 'w'
                  ? 'À vous de jouer (Blancs)'
                  : 'Réponse des Noirs...'}
              </span>
              <span className="text-xs font-mono text-[#8a8680] tabular-nums">
                Essais : {attempts}
              </span>
            </div>
          )}

          {status === 'wrong' && (
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-[#e06c6c] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Coup incorrect</p>
                <p className="text-xs text-[#d4d1cb] mt-0.5">
                  Vérifiez les prises majoritaires et les cases de blocage.
                </p>
              </div>
            </div>
          )}

          {(status === 'solved' || status === 'revealed') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    status === 'solved' ? 'text-[#75b52c]' : 'text-[#3692e7]'
                  }`}
                />
                <span className="font-semibold">
                  {status === 'solved'
                    ? 'Combinaison réussie'
                    : 'Solution complète affichée'}
                </span>
              </div>
              <p className="text-xs font-mono text-white/90 bg-[#161512]/70 px-2.5 py-1.5 rounded tabular-nums">
                {puzzle.solution.join('  ')}
              </p>
              <p className="text-xs text-[#d4d1cb] leading-relaxed">
                {puzzle.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Progressive Hint System */}
        {status !== 'solved' && status !== 'revealed' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHintLevel((h) => (h < 2 ? ((h + 1) as 1 | 2) : 2))}
                disabled={hintLevel >= 2}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded border border-[#3c3934] bg-[#302e2c] hover:bg-[#3c3934] text-white disabled:opacity-45 disabled:pointer-events-none transition-colors cursor-pointer whitespace-nowrap"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#d59120]" />
                {hintLevel === 0
                  ? 'Indice 1 : Pièce clé'
                  : hintLevel === 1
                    ? 'Indice 2 : Case cible'
                    : 'Tous les indices affichés'}
              </button>

              <button
                type="button"
                onClick={handleRevealSolution}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded border border-[#3c3934] bg-[#161512] hover:bg-[#302e2c] text-[#bababa] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5" />
                Solution
              </button>
            </div>

            {hintLevel >= 1 && (
              <div className="p-3 rounded bg-[#161512] border border-[#3c3934] text-xs text-[#d4d1cb] space-y-1.5">
                <p>
                  <strong className="text-[#d59120]">Indice 1 :</strong>{' '}
                  {puzzle.hints[0]}
                </p>
                {hintLevel >= 2 && (
                  <p>
                    <strong className="text-[#3692e7]">Indice 2 :</strong>{' '}
                    {puzzle.hints[1]}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-[#3c3934] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={resetPuzzle}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded border border-[#3c3934] bg-[#302e2c] hover:bg-[#3c3934] text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réessayer
          </button>

          <button
            type="button"
            onClick={() => onSelectPuzzle(nextPuzzle.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded bg-[#629924] hover:bg-[#75b52c] text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Exercice suivant
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </div>
  );
};
