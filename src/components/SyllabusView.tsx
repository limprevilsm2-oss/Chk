import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  KNDB_NIVEAU_6_SYLLABUS,
  PUZZLES,
  STUDY_LESSONS,
} from '../data/curriculum';

interface SyllabusViewProps {
  completedLessons: string[];
  solvedPuzzles: string[];
  onOpenLesson: (lessonId: string) => void;
  onOpenExercises: () => void;
  onResetProgress: () => void;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  completedLessons,
  solvedPuzzles,
  onOpenLesson,
  onOpenExercises,
  onResetProgress,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'Tactique' | 'Stratégie' | 'Finales'
  >('all');

  const filteredTopics = useMemo(() => {
    if (categoryFilter === 'all') return KNDB_NIVEAU_6_SYLLABUS;
    return KNDB_NIVEAU_6_SYLLABUS.filter((t) => t.category === categoryFilter);
  }, [categoryFilter]);

  const totalItems = STUDY_LESSONS.length + PUZZLES.length;
  const doneItems = completedLessons.length + solvedPuzzles.length;
  const globalPct = Math.round((doneItems / totalItems) * 100);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header & KPI Summary Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-[#262421] border border-[#3c3934] rounded-md p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-[#8a8680]">
              Fédération Royale Néerlandaise · Cursus Hoogland
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight text-balance">
              Programme KNDB Niveau 6
            </h1>
            <p className="text-sm text-[#bababa] leading-relaxed max-w-2xl">
              Maîtrisez les combinaisons avancées du jeu de dames international
              10×10, les règles FMJD de prise majoritaire et les techniques de
              jeu classique et de finale.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenLesson(STUDY_LESSONS[0].id)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-[#629924] hover:bg-[#75b52c] text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Ouvrir le cours
            </button>
            <button
              type="button"
              onClick={onOpenExercises}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded border border-[#3c3934] bg-[#302e2c] hover:bg-[#3c3934] text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Série d’exercices
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Metrics */}
        <div className="lg:col-span-5 bg-[#262421] border border-[#3c3934] rounded-md p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">
              Progression personnelle
            </h2>
            {doneItems > 0 && (
              <button
                type="button"
                onClick={onResetProgress}
                className="inline-flex items-center gap-1 text-xs text-[#8a8680] hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#161512] border border-[#3c3934] rounded p-3">
              <div className="text-xs text-[#8a8680]">Chapitres</div>
              <div className="mt-1 text-xl font-mono font-semibold text-white tabular-nums">
                {completedLessons.length}/{STUDY_LESSONS.length}
              </div>
            </div>
            <div className="bg-[#161512] border border-[#3c3934] rounded p-3">
              <div className="text-xs text-[#8a8680]">Exercices</div>
              <div className="mt-1 text-xl font-mono font-semibold text-white tabular-nums">
                {solvedPuzzles.length}/{PUZZLES.length}
              </div>
            </div>
            <div className="bg-[#161512] border border-[#3c3934] rounded p-3">
              <div className="text-xs text-[#8a8680]">Maîtrise</div>
              <div className="mt-1 text-xl font-mono font-semibold text-[#75b52c] tabular-nums">
                {globalPct}%
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full bg-[#161512] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#629924] transition-all duration-300"
                style={{ width: `${globalPct}%` }}
              />
            </div>
            <div className="text-xs text-[#8a8680] tabular-nums">
              {doneItems} modules validés sur {totalItems}
            </div>
          </div>
        </div>
      </section>

      {/* Syllabus Modules Grid */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">
            Modules du cursus Hoogland
          </h2>

          <div className="flex items-center gap-1 p-1 bg-[#262421] rounded border border-[#3c3934]">
            {(['all', 'Tactique', 'Stratégie', 'Finales'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-[#302e2c] text-white'
                      : 'text-[#8a8680] hover:text-[#bababa]'
                  }`}
                >
                  {cat === 'all' ? 'Tout le programme' : cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic) => {
            const isDone =
              topic.linkedLessonId !== undefined &&
              completedLessons.includes(topic.linkedLessonId);
            return (
              <div
                key={topic.code}
                className="bg-[#262421] border border-[#3c3934] rounded-md p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#8a8680]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums">
                        {topic.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{topic.category}</span>
                    </div>
                    {isDone && (
                      <span className="inline-flex items-center gap-1 text-[#75b52c] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Validé
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-[#bababa] leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                {topic.linkedLessonId && (
                  <div className="pt-2 border-t border-[#3c3934]">
                    <button
                      type="button"
                      onClick={() => onOpenLesson(topic.linkedLessonId!)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3692e7] hover:text-[#5aa8f0] transition-colors cursor-pointer"
                    >
                      Étudier ce module sur l’échiquier
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FMJD 10x10 Rules Quick Reference */}
      <section className="bg-[#262421] border border-[#3c3934] rounded-md p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">
          Rappel des règles officielles FMJD (10×10)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
          <div className="space-y-1">
            <h3 className="font-semibold text-white text-sm">
              Prise majoritaire
            </h3>
            <p className="text-xs text-[#bababa] leading-relaxed">
              La prise est obligatoire et le joueur doit impérativement exécuter
              la rafle qui capture le plus grand nombre de pièces adverses.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-white text-sm">
              Dame volante
            </h3>
            <p className="text-xs text-[#bababa] leading-relaxed">
              La dame se déplace d’un nombre quelconque de cases libres en
              diagonale et peut atterrir sur n’importe quelle case libre après
              la pièce capturée.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-white text-sm">
              Règle du Coup Turc
            </h3>
            <p className="text-xs text-[#bababa] leading-relaxed">
              Les pièces prises ne sont retirées qu’à la fin complète du coup :
              on ne peut pas sauter deux fois la même pièce ni traverser une
              pièce déjà prise.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-white text-sm">
              Couronnement final
            </h3>
            <p className="text-xs text-[#bababa] leading-relaxed">
              Un pion qui traverse la dernière rangée au milieu d’une rafle ne
              devient dame que s’il termine son mouvement sur cette rangée.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
