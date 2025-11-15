import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import Card from './Card.jsx';
import { sortCards } from '../logic/helpers.js';

const PlayerArea = ({
  player,
  playerName,
  isActive,
  onCardSelect,
  selectedCardIds = [],
  disabled = false,
  position = 'top',
  hideHand = false,
  variant = 'full'
}) => {
  const sortedHand = sortCards(player.hand);
  const canSelect = isActive && !disabled && typeof onCardSelect === 'function';
  const orientationClasses = position === 'top' ? 'from-slate-900/80 via-slate-900/40 to-transparent' : 'from-slate-900/40 via-slate-900/80 to-transparent';
  const totalTokenValue = player.tokens?.reduce((sum, token) => sum + (token.value ?? 0), 0) ?? 0;

  return (
    <motion.section
      layout
      className={clsx(
        'rounded-3xl border border-white/5 bg-gradient-to-br text-slate-100 shadow-[0_30px_80px_rgba(2,6,23,0.65)]',
        orientationClasses,
        variant === 'compact' ? 'p-4' : 'p-5'
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {isActive ? 'Giliran aktif' : 'Menunggu'}
          </p>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-white">{playerName}</h3>
            {isActive && (
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                Aksi kamu
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Skor</p>
            <p className="text-xl font-bold text-amber-200">{player.score}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Nilai token</p>
            <p className="text-xl font-semibold text-emerald-200">{totalTokenValue}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Unta</p>
            <p className="text-xl font-semibold">{player.camelHerd.length}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Kawanan Unta</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {player.camelHerd.length ? (
              player.camelHerd.slice(0, 6).map(camel => (
                <span
                  key={camel.id}
                  className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200"
                >
                  Unta
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">Belum ada unta</span>
            )}
            {player.camelHerd.length > 6 && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                +{player.camelHerd.length - 6} lagi
              </span>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Token</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {player.tokens?.length ? (
              player.tokens.slice(-8).map((token, index) => (
                <span
                  key={`${token.type}-${index}`}
                  className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200"
                >
                  {token.value}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">Belum ada token</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Tangan</p>
          <p className="text-xs text-slate-400">{player.hand.length} kartu</p>
        </div>
        {hideHand ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 px-4 py-6 text-center text-xs uppercase tracking-[0.3em] text-slate-500">
            Disembunyikan
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {sortedHand.length ? (
              sortedHand.map(card => (
                <Card
                  key={card.id}
                  card={card}
                  size="small"
                  onClick={canSelect ? () => onCardSelect(card) : undefined}
                  selected={selectedCardIds.includes(card.id)}
                  disabled={!canSelect}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">Tangan kosong</p>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default PlayerArea;
