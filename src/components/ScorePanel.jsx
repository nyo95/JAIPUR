import React from 'react';
import clsx from 'clsx';
import { getCardLabel } from '../logic/helpers.js';

const GOODS_ORDER = ['diamond', 'gold', 'silver', 'cloth', 'spice', 'leather'];
const GOOD_COLORS = {
  diamond: 'from-sky-500/30 to-sky-600/20',
  gold: 'from-amber-500/30 to-amber-600/20',
  silver: 'from-slate-300/30 to-slate-400/20',
  cloth: 'from-purple-500/30 to-purple-600/20',
  spice: 'from-rose-500/30 to-rose-600/20',
  leather: 'from-orange-800/30 to-orange-700/20'
};

const ScorePanel = ({
  players,
  deckCount,
  tokenStacks,
  emptyStacks = [],
  phase,
  roundResult,
  onRequestRematch,
  playerLabels = { 1: 'Pemain 1', 2: 'Pemain 2' }
}) => {
  const stacks = tokenStacks ?? {};
  return (
    <aside className="rounded-3xl border border-white/5 bg-slate-950/60 p-5 text-slate-100 shadow-[0_35px_80px_rgba(2,6,23,0.85)]">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Papan Skor</p>
        <h2 className="text-2xl font-semibold text-white">Ringkasan Ronde</h2>
      </div>

      <div className="space-y-3">
        {[1, 2].map((playerId) => {
          const data = players[playerId] ?? { score: 0, camelHerd: [], hand: [] };
          return (
          <div
            key={playerId}
            className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3"
          >
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{playerLabels[playerId] || `Pemain ${playerId}`}</p>
                <p className="text-lg font-semibold text-white">{data.score} poin</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>{data.camelHerd.length} unta</p>
                <p>{data.hand.length} kartu</p>
              </div>
            </div>
          </div>
        )})}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Dek</p>
            <p className="text-2xl font-semibold text-white">{deckCount}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Token habis</p>
            <p className="text-lg font-semibold text-amber-200">{emptyStacks.length}</p>
          </div>
        </div>
        {emptyStacks.length > 0 && (
          <p className="mt-2 text-xs text-amber-200">
            {emptyStacks.map(type => getCardLabel(type)).join(', ')} habis
          </p>
        )}
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Tumpukan Token</p>
        {GOODS_ORDER.map((type) => (
          <div
            key={type}
            className={clsx(
              'flex items-center justify-between rounded-2xl border border-white/5 px-3 py-2 text-slate-200',
              'bg-gradient-to-r',
              GOOD_COLORS[type]
            )}
          >
            <span className="font-semibold">{getCardLabel(type)}</span>
            <span>{stacks[type]?.length ?? 0} tersisa</span>
          </div>
        ))}
      </div>

      {phase === 'roundOver' && roundResult && (
        <div className="mt-5 rounded-2xl border border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-200">Hasil Ronde</p>
          <p className="mt-2 font-semibold">
            {roundResult.winner === 'tie'
              ? 'Seri!'
              : `Pemain ${roundResult.winner} memenangkan ronde`}
          </p>
          <p className="text-xs text-amber-200/80">
            Bonus unta: +{roundResult.camelBonus.player1} / +{roundResult.camelBonus.player2}
          </p>
          {onRequestRematch && (
            <button
              type="button"
              onClick={onRequestRematch}
              className="mt-3 w-full rounded-full bg-amber-400 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
            >
              Main Lagi
            </button>
          )}
        </div>
      )}
    </aside>
  );
};

export default ScorePanel;
