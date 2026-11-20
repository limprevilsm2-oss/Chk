import React from 'react';
import {
  AlertTriangle,
  FlipVertical,
  Hash,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Color, MaterialCount } from '../engine/draughts';
import { BoardTheme } from './DraughtsBoard';

interface PlayerStripProps {
  side: Color;
  isTurn: boolean;
  hasMandatoryCapture: boolean;
  material: MaterialCount;
  label?: string;
}

export const PlayerStrip: React.FC<PlayerStripProps> = ({
  side,
  isTurn,
  hasMandatoryCapture,
  material,
  label,
}) => {
  const men = side === 'w' ? material.whiteMen : material.blackMen;
  const kings = side === 'w' ? material.whiteKings : material.blackKings;
  const sideName = label ?? (side === 'w' ? 'Blancs' : 'Noirs');

  return (
    <div
      className={`flex items-center justify-between gap-4 px-3 py-2 rounded-md border transition-colors ${
        isTurn
          ? 'bg-[#302e2c] border-[#629924]/70 text-white'
          : 'bg-[#262421] border-[#3c3934] text-[#bababa]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`w-4 h-4 rounded-full shrink-0 border ${
            side === 'w'
              ? 'bg-[#f5f1e6] border-[#c8bcab]'
              : 'bg-[#2b2723] border-[#524e47]'
          }`}
        />
        <span className="text-sm font-semibold truncate">{sideName}</span>
        <span className="text-xs font-mono text-[#9a968e] tabular-nums whitespace-nowrap">
          {men}P · {kings}D
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isTurn && hasMandatoryCapture && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#d59120] whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5" />
            Prise obligatoire
          </span>
        )}
        {isTurn && !hasMandatoryCapture && (
          <span className="text-xs font-medium text-[#75b52c] whitespace-nowrap">
            Au trait
          </span>
        )}
      </div>
    </div>
  );
};

interface BoardToolbarProps {
  flipped: boolean;
  onToggleFlip: () => void;
  showNumbers: boolean;
  onToggleNumbers: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: BoardTheme;
  onChangeTheme: (theme: BoardTheme) => void;
}

export const BoardToolbar: React.FC<BoardToolbarProps> = ({
  flipped,
  onToggleFlip,
  showNumbers,
  onToggleNumbers,
  soundEnabled,
  onToggleSound,
  theme,
  onChangeTheme,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleFlip}
          title="Retourner l'échiquier"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            flipped
              ? 'bg-[#302e2c] border-[#629924] text-white'
              : 'bg-[#262421] border-[#3c3934] text-[#bababa] hover:text-white hover:border-[#524e47]'
          }`}
        >
          <FlipVertical className="w-3.5 h-3.5" />
          Retourner
        </button>

        <button
          type="button"
          onClick={onToggleNumbers}
          title="Afficher ou masquer les numéros FMJD (1-50)"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            showNumbers
              ? 'bg-[#302e2c] border-[#3692e7]/80 text-white'
              : 'bg-[#262421] border-[#3c3934] text-[#bababa] hover:text-white hover:border-[#524e47]'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          Cases 1–50
        </button>

        <button
          type="button"
          onClick={onToggleSound}
          title="Activer ou couper les sons"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border bg-[#262421] border-[#3c3934] text-[#bababa] hover:text-white hover:border-[#524e47] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-[#629924]" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-[#8a8680]" />
          )}
          {soundEnabled ? 'Son actif' : 'Muet'}
        </button>
      </div>

      <div className="flex items-center gap-1 bg-[#262421] p-1 rounded border border-[#3c3934]">
        {(
          [
            { id: 'classic', label: 'Bois' },
            { id: 'emerald', label: 'Émeraude' },
            { id: 'slate', label: 'Ardoise' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChangeTheme(t.id)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              theme === t.id
                ? 'bg-[#302e2c] text-white'
                : 'text-[#8a8680] hover:text-[#bababa]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};
