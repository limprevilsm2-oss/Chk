import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pause,
  Play,
  RotateCcw,
  Target,
} from 'lucide-react';
import { STUDY_LESSONS, StudyLesson } from '../data/curriculum';
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
import { playCaptureSound, playErrorSound, playMoveSound, playSuccessSound } from '../utils/sound';
import { BoardTheme, DraughtsBoard } from './DraughtsBoard';
import { BoardToolbar, PlayerStrip } from './BoardStatusBar';

interface StudyViewProps {
  selectedLessonId: string;
  onSelectLesson: (id: string) => void;
  completedLessons: string[];
  onToggleCompleteLesson: (id: string) => void;
  flipped: boolean;
  onToggleFlip: () => void;
  showNumbers: boolean;
  onToggleNumbers: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: BoardTheme;
  onChangeTheme: (t: BoardTheme) => void;
  onStartExercises: () => void;
}

interface TimelineState {
  board: BoardArray;
  turn: Color;
  lastMove: { from: number; to: number } | null;
}

export const StudyView: React.FC<StudyViewProps> = ({
  selectedLessonId,
  onSelectLesson,
  completedLessons,
  onToggleCompleteLesson,
  flipped,
  onToggleFlip,
  showNumbers,
  onToggleNumbers,
  soundEnabled,
  onToggleSound,
  theme,
  onChangeTheme,
  onStartExercises,
}) => {
  const lesson: StudyLesson = useMemo(
    () => STUDY_LESSONS.find((l) => l.id === selectedLessonId) ?? STUDY_LESSONS[0],
    [selectedLessonId]
  );

  // Study playback state: ply 0 = initial position, 1..steps.length = after step i
  const [ply, setPly] = useState<number>(0);
  const [autoPlaying, setAutoPlaying] = useState<boolean>(false);

  // Interactive Quiz-in-Study mode ("Tester la combinaison")
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [quizPly, setQuizPly] = useState<number>(0);
  const [quizStatus, setQuizStatus] = useState<'playing' | 'wrong' | 'done'>('playing');

  // Precompute all timeline boards for the active lesson
  const timeline: TimelineState[] = useMemo(() => {
    const { board: initBoard, turn: initTurn } = parseFEN(lesson.fen);
    const states: TimelineState[] = [
      { board: initBoard, turn: initTurn, lastMove: null },
    ];
    let curBoard = initBoard;
    let curTurn = initTurn;
    for (const step of lesson.steps) {
      const m = findLegalMoveByNotation(curBoard, curTurn, step.notation);
      if (m) {
        curBoard = applyMove(curBoard, m);
        curTurn = oppositeColor(curTurn);
        states.push({
          board: curBoard,
          turn: curTurn,
          lastMove: { from: m.from, to: m.to },
        });
      }
    }
    return states;
  }, [lesson]);

  // Reset ply & quiz state when switching lesson
  useEffect(() => {
    setPly(0);
    setAutoPlaying(false);
    setQuizMode(false);
    setQuizPly(0);
    setQuizStatus('playing');
  }, [lesson.id]);

  // Auto-play timer in study mode
  useEffect(() => {
    if (!autoPlaying || quizMode) return;
    if (ply >= timeline.length - 1) {
      setAutoPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      const next = ply + 1;
      const stepNotation = lesson.steps[ply]?.notation ?? '';
      if (stepNotation.includes('x')) playCaptureSound(soundEnabled);
      else playMoveSound(soundEnabled);
      setPly(next);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [autoPlaying, quizMode, ply, timeline.length, lesson.steps, soundEnabled]);

  const activeIndex = quizMode ? quizPly : ply;
  const activeState = timeline[activeIndex] ?? timeline[0];
  const legalMoves = useMemo(
    () => getLegalMoves(activeState.board, activeState.turn),
    [activeState.board, activeState.turn]
  );
  const material = useMemo(
    () => countMaterial(activeState.board),
    [activeState.board]
  );
  const hasMandatoryCapture =
    legalMoves.length > 0 && legalMoves[0].captures.length > 0;

  // Current annotations (hidden in quiz mode so user discovers the tactic!)
  const activeAnnotations = useMemo(() => {
    if (quizMode) return null;
    if (ply === 0) return lesson.initialAnnotations ?? null;
    return lesson.steps[ply - 1]?.annotations ?? null;
  }, [quizMode, ply, lesson]);

  const handleGoToPly = (target: number) => {
    setAutoPlaying(false);
    const clamped = Math.max(0, Math.min(timeline.length - 1, target));
    if (clamped > ply) {
      const stepNotation = lesson.steps[clamped - 1]?.notation ?? '';
      if (stepNotation.includes('x')) playCaptureSound(soundEnabled);
      else playMoveSound(soundEnabled);
    }
    setPly(clamped);
  };

  // Interactive move handler in Study (only active when quizMode === true, or allow stepping forward if matching main line!)
  const handleBoardMove = (move: Move) => {
    const expectedStep = lesson.steps[activeIndex];
    if (!expectedStep) return;

    const expectedMove = findLegalMoveByNotation(
      activeState.board,
      activeState.turn,
      expectedStep.notation
    );

    const isMatch =
      expectedMove &&
      formatMoveDetailed(move) === formatMoveDetailed(expectedMove);

    if (!quizMode) {
      if (isMatch) {
        if (move.captures.length > 0) playCaptureSound(soundEnabled);
        else playMoveSound(soundEnabled);
        setPly(activeIndex + 1);
      } else {
        playErrorSound(soundEnabled);
      }
      return;
    }

    // Quiz Mode
    if (quizStatus !== 'playing') return;
    if (isMatch) {
      if (move.captures.length > 0) playCaptureSound(soundEnabled);
      else playMoveSound(soundEnabled);
      const nextPly = quizPly + 1;
      setQuizPly(nextPly);

      if (nextPly >= timeline.length - 1) {
        setQuizStatus('done');
        playSuccessSound(soundEnabled);
        if (!completedLessons.includes(lesson.id)) {
          onToggleCompleteLesson(lesson.id);
        }
      } else {
        // Opponent's forced reply plays automatically after 420ms
        const replyStep = lesson.steps[nextPly];
        if (replyStep) {
          window.setTimeout(() => {
            if (replyStep.notation.includes('x')) playCaptureSound(soundEnabled);
            else playMoveSound(soundEnabled);
            const afterReply = nextPly + 1;
            setQuizPly(afterReply);
            if (afterReply >= timeline.length - 1) {
              setQuizStatus('done');
              playSuccessSound(soundEnabled);
              if (!completedLessons.includes(lesson.id)) {
                onToggleCompleteLesson(lesson.id);
              }
            }
          }, 420);
        }
      }
    } else {
      playErrorSound(soundEnabled);
      setQuizStatus('wrong');
      window.setTimeout(() => {
        setQuizStatus('playing');
      }, 900);
    }
  };

  const toggleQuizMode = () => {
    setAutoPlaying(false);
    if (!quizMode) {
      setQuizMode(true);
      setQuizPly(0);
      setQuizStatus('playing');
    } else {
      setQuizMode(false);
      setPly(0);
    }
  };

  const isCompleted = completedLessons.includes(lesson.id);
  const progressPct = Math.round(
    (completedLessons.length / STUDY_LESSONS.length) * 100
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)_360px] gap-6 items-start">
      {/* Left Column: Curriculum Chapters */}
      <aside className="bg-[#262421] border border-[#3c3934] rounded-md overflow-hidden">
        <div className="p-4 border-b border-[#3c3934]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">
              Chapitres KNDB Niveau 6
            </h2>
            <span className="text-xs font-mono text-[#bababa] tabular-nums">
              {completedLessons.length}/{STUDY_LESSONS.length}
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-[#161512] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#629924] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <nav className="divide-y divide-[#3c3934]/60 max-h-[540px] overflow-y-auto">
          {STUDY_LESSONS.map((item) => {
            const active = item.id === lesson.id;
            const done = completedLessons.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectLesson(item.id)}
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
                  {done && (
                    <CheckCircle2 className="w-4 h-4 text-[#629924] shrink-0 mt-0.5" />
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8a8680]">
                  <span className="truncate">{item.motif}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums whitespace-nowrap">
                    {Math.ceil(item.steps.length / 2)} coups
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#3c3934] bg-[#211f1c]">
          <button
            type="button"
            onClick={onStartExercises}
            className="w-full py-2 px-3 rounded text-xs font-medium bg-[#302e2c] hover:bg-[#3c3934] text-white border border-[#3c3934] transition-colors cursor-pointer whitespace-nowrap"
          >
            Passer aux exercices pratiques
          </button>
        </div>
      </aside>

      {/* Center Column: Interactive 10x10 Board */}
      <section className="flex flex-col items-center w-full">
        <div className="w-full max-w-[600px] space-y-2.5">
          <PlayerStrip
            side={flipped ? 'w' : 'b'}
            isTurn={activeState.turn === (flipped ? 'w' : 'b')}
            hasMandatoryCapture={
              activeState.turn === (flipped ? 'w' : 'b') && hasMandatoryCapture
            }
            material={material}
            label={flipped ? 'Blancs (Vous)' : 'Noirs (Adversaire)'}
          />

          <DraughtsBoard
            board={activeState.board}
            turn={activeState.turn}
            legalMoves={legalMoves}
            onMove={handleBoardMove}
            flipped={flipped}
            showNumbers={showNumbers}
            theme={theme}
            interactive={
              quizMode
                ? quizStatus === 'playing' && activeState.turn === 'w'
                : activeIndex < timeline.length - 1
            }
            lastMove={activeState.lastMove}
            annotations={activeAnnotations}
          />

          <PlayerStrip
            side={flipped ? 'b' : 'w'}
            isTurn={activeState.turn === (flipped ? 'b' : 'w')}
            hasMandatoryCapture={
              activeState.turn === (flipped ? 'b' : 'w') && hasMandatoryCapture
            }
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

      {/* Right Column: Theory, Move Notation & Study Controls */}
      <aside className="bg-[#262421] border border-[#3c3934] rounded-md p-4 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#8a8680]">
            <span>{lesson.level}</span>
            <span aria-hidden="true">·</span>
            <span>{lesson.motif}</span>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {lesson.number}. {lesson.title}
          </h1>
          <p className="text-sm text-[#bababa] leading-relaxed">{lesson.subtitle}</p>
        </div>

        {/* Mode Toggle: Guided Study vs Test Combination */}
        <div className="flex items-center gap-1 p-1 bg-[#161512] rounded border border-[#3c3934]">
          <button
            type="button"
            onClick={() => quizMode && toggleQuizMode()}
            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              !quizMode
                ? 'bg-[#302e2c] text-white'
                : 'text-[#8a8680] hover:text-[#bababa]'
            }`}
          >
            Étude guidée
          </button>
          <button
            type="button"
            onClick={() => !quizMode && toggleQuizMode()}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              quizMode
                ? 'bg-[#629924] text-white'
                : 'text-[#8a8680] hover:text-[#bababa]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Tester la suite
          </button>
        </div>

        {quizMode ? (
          <div className="space-y-3">
            <div
              className={`p-3 rounded border text-sm ${
                quizStatus === 'done'
                  ? 'bg-[#629924]/15 border-[#629924] text-white'
                  : quizStatus === 'wrong'
                    ? 'bg-[#d59120]/15 border-[#d59120] text-white'
                    : 'bg-[#302e2c] border-[#3c3934] text-[#bababa]'
              }`}
            >
              {quizStatus === 'done' && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#75b52c] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Combinaison validée</p>
                    <p className="text-xs text-[#bababa] mt-1">
                      Vous avez exécuté exactement la manœuvre du chapitre.
                    </p>
                  </div>
                </div>
              )}
              {quizStatus === 'wrong' && (
                <p className="font-medium text-[#d59120]">
                  Ce coup ne correspond pas à la combinaison étudiée. Essayez encore.
                </p>
              )}
              {quizStatus === 'playing' && (
                <p>
                  Jouez les coups des Blancs directement sur l’échiquier pour reproduire{' '}
                  <strong className="text-white">{lesson.title}</strong>.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setQuizPly(0);
                setQuizStatus('playing');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded border border-[#3c3934] bg-[#302e2c] hover:bg-[#3c3934] text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Recommencer le test
            </button>
          </div>
        ) : (
          <>
            {/* Playback Controls */}
            <div className="flex items-center justify-between gap-1 bg-[#161512] p-1.5 rounded border border-[#3c3934]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleGoToPly(0)}
                  disabled={ply === 0}
                  title="Position initiale"
                  className="p-2 rounded text-[#bababa] hover:text-white hover:bg-[#302e2c] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleGoToPly(ply - 1)}
                  disabled={ply === 0}
                  title="Coup précédent"
                  className="p-2 rounded text-[#bababa] hover:text-white hover:bg-[#302e2c] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAutoPlaying((v) => !v)}
                  title={autoPlaying ? 'Pause' : 'Lecture automatique'}
                  className="p-2 rounded text-white bg-[#302e2c] hover:bg-[#3c3934] cursor-pointer"
                >
                  {autoPlaying ? (
                    <Pause className="w-4 h-4 text-[#d59120]" />
                  ) : (
                    <Play className="w-4 h-4 text-[#629924]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleGoToPly(ply + 1)}
                  disabled={ply >= timeline.length - 1}
                  title="Coup suivant"
                  className="p-2 rounded text-[#bababa] hover:text-white hover:bg-[#302e2c] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleGoToPly(timeline.length - 1)}
                  disabled={ply >= timeline.length - 1}
                  title="Position finale"
                  className="p-2 rounded text-[#bababa] hover:text-white hover:bg-[#302e2c] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs font-mono text-[#8a8680] pr-2 tabular-nums">
                Coup {ply}/{timeline.length - 1}
              </span>
            </div>

            {/* Interactive Move Tree */}
            <div className="bg-[#161512] border border-[#3c3934] rounded p-2.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleGoToPly(0)}
                className={`px-2 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                  ply === 0
                    ? 'bg-[#3692e7] text-white font-semibold'
                    : 'text-[#8a8680] hover:bg-[#302e2c] hover:text-white'
                }`}
              >
                Départ
              </button>
              {lesson.steps.map((step, idx) => {
                const stepNum = idx + 1;
                const moveNumber = Math.floor(idx / 2) + 1;
                const isWhite = idx % 2 === 0;
                const active = ply === stepNum;
                return (
                  <button
                    key={`${step.notation}-${idx}`}
                    type="button"
                    onClick={() => handleGoToPly(stepNum)}
                    className={`px-2 py-1 text-xs font-mono tabular-nums rounded transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#629924] text-white font-semibold'
                        : 'bg-[#262421] text-[#bababa] hover:bg-[#302e2c] hover:text-white'
                    }`}
                  >
                    {isWhite ? `${moveNumber}. ` : ''}
                    {step.notation}
                  </button>
                );
              })}
            </div>

            {/* Live Commentary */}
            <div className="bg-[#302e2c] border border-[#3c3934] rounded p-3.5 space-y-2">
              <div className="text-xs font-semibold text-white">
                {ply === 0
                  ? 'Idée directrice'
                  : `Analyse après ${lesson.steps[ply - 1]?.notation}`}
              </div>
              <p className="text-sm text-[#d4d1cb] leading-relaxed">
                {ply === 0 ? lesson.intro : lesson.steps[ply - 1]?.comment}
              </p>
            </div>

            {/* Key Takeaway */}
            <div className="border border-[#3c3934] rounded p-3.5 space-y-1">
              <div className="text-xs font-semibold text-[#d59120]">
                Point clé KNDB Niveau 6
              </div>
              <p className="text-xs text-[#bababa] leading-relaxed">
                {lesson.keyTakeaway}
              </p>
            </div>
          </>
        )}

        {/* Mark Lesson Complete */}
        <div className="pt-1 border-t border-[#3c3934] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onToggleCompleteLesson(lesson.id)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              isCompleted
                ? 'bg-[#629924]/20 border-[#629924] text-[#8ad13b]'
                : 'bg-[#302e2c] border-[#3c3934] text-white hover:bg-[#3c3934]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isCompleted ? 'Chapitre validé' : 'Marquer comme validé'}
          </button>

          {(() => {
            const idx = STUDY_LESSONS.findIndex((l) => l.id === lesson.id);
            const nextLesson = STUDY_LESSONS[idx + 1];
            if (!nextLesson) return null;
            return (
              <button
                type="button"
                onClick={() => onSelectLesson(nextLesson.id)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded text-xs font-medium text-[#bababa] hover:text-white hover:bg-[#302e2c] transition-colors cursor-pointer whitespace-nowrap"
              >
                Suivant
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            );
          })()}
        </div>
      </aside>
    </div>
  );
};
