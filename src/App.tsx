import { useEffect, useState } from 'react';
import { PUZZLES, STUDY_LESSONS } from './data/curriculum';
import { BoardTheme } from './components/DraughtsBoard';
import { StudyView } from './components/StudyView';
import { PuzzlesView } from './components/PuzzlesView';
import { AnalysisView } from './components/AnalysisView';
import { SyllabusView } from './components/SyllabusView';

type AppTab = 'study' | 'puzzles' | 'analysis' | 'syllabus';

const STORAGE_LESSONS_KEY = 'lidraughts_hoogland_lessons_v1';
const STORAGE_PUZZLES_KEY = 'lidraughts_hoogland_puzzles_v1';

function readStoredIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('study');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    STUDY_LESSONS[0].id
  );
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string>(
    PUZZLES[0].id
  );

  const [completedLessons, setCompletedLessons] = useState<string[]>(() =>
    readStoredIds(STORAGE_LESSONS_KEY)
  );
  const [solvedPuzzles, setSolvedPuzzles] = useState<string[]>(() =>
    readStoredIds(STORAGE_PUZZLES_KEY)
  );

  const [flipped, setFlipped] = useState<boolean>(false);
  const [showNumbers, setShowNumbers] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [theme, setTheme] = useState<BoardTheme>('classic');

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_LESSONS_KEY,
        JSON.stringify(completedLessons)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [completedLessons]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PUZZLES_KEY, JSON.stringify(solvedPuzzles));
    } catch {
      // Ignore storage quota errors
    }
  }, [solvedPuzzles]);

  const handleToggleCompleteLesson = (id: string) => {
    setCompletedLessons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMarkPuzzleSolved = (id: string) => {
    setSolvedPuzzles((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleJumpToNextExercise = () => {
    const nextUnsolved =
      PUZZLES.find((p) => !solvedPuzzles.includes(p.id)) ?? PUZZLES[0];
    setSelectedPuzzleId(nextUnsolved.id);
    setActiveTab('puzzles');
  };

  const handleResetProgress = () => {
    setCompletedLessons([]);
    setSolvedPuzzles([]);
  };

  const navItems: Array<{ id: AppTab; label: string }> = [
    { id: 'study', label: 'Cours & Études' },
    { id: 'puzzles', label: 'Exercices' },
    { id: 'analysis', label: 'Analyse Libre' },
    { id: 'syllabus', label: 'Programme' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#161512] text-[#bababa]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-[#161512]/95 backdrop-blur border-b border-[#3c3934]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('study');
            }}
            className="text-base sm:text-lg font-semibold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Lidraughts Hoogland
          </a>

          {/* Zone 2: Single-line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'text-white border-[#629924]'
                      : 'text-[#bababa] border-transparent hover:text-white hover:border-[#524e47]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleJumpToNextExercise}
              className="px-4 py-2 text-xs font-semibold rounded bg-[#629924] hover:bg-[#75b52c] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              S’entraîner
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <nav className="md:hidden flex items-center gap-2 px-4 pb-2.5 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#302e2c] text-white'
                    : 'text-[#bababa] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'study' && (
          <StudyView
            selectedLessonId={selectedLessonId}
            onSelectLesson={(id) => setSelectedLessonId(id)}
            completedLessons={completedLessons}
            onToggleCompleteLesson={handleToggleCompleteLesson}
            flipped={flipped}
            onToggleFlip={() => setFlipped((v) => !v)}
            showNumbers={showNumbers}
            onToggleNumbers={() => setShowNumbers((v) => !v)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((v) => !v)}
            theme={theme}
            onChangeTheme={setTheme}
            onStartExercises={handleJumpToNextExercise}
          />
        )}

        {activeTab === 'puzzles' && (
          <PuzzlesView
            selectedPuzzleId={selectedPuzzleId}
            onSelectPuzzle={(id) => setSelectedPuzzleId(id)}
            solvedPuzzles={solvedPuzzles}
            onMarkPuzzleSolved={handleMarkPuzzleSolved}
            flipped={flipped}
            onToggleFlip={() => setFlipped((v) => !v)}
            showNumbers={showNumbers}
            onToggleNumbers={() => setShowNumbers((v) => !v)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((v) => !v)}
            theme={theme}
            onChangeTheme={setTheme}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisView
            flipped={flipped}
            onToggleFlip={() => setFlipped((v) => !v)}
            showNumbers={showNumbers}
            onToggleNumbers={() => setShowNumbers((v) => !v)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((v) => !v)}
            theme={theme}
            onChangeTheme={setTheme}
          />
        )}

        {activeTab === 'syllabus' && (
          <SyllabusView
            completedLessons={completedLessons}
            solvedPuzzles={solvedPuzzles}
            onOpenLesson={(lessonId) => {
              setSelectedLessonId(lessonId);
              setActiveTab('study');
            }}
            onOpenExercises={handleJumpToNextExercise}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-[#3c3934]/70 py-4 px-4 sm:px-6">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[#8a8680]">
          <span>
            Lidraughts Hoogland · Cours KNDB Niveau 6 · Jeu de dames international 10×10
          </span>
          <span className="font-mono tabular-nums">
            {completedLessons.length}/{STUDY_LESSONS.length} chapitres ·{' '}
            {solvedPuzzles.length}/{PUZZLES.length} exercices
          </span>
        </div>
      </footer>
    </div>
  );
}
