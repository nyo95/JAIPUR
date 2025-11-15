import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card.jsx';
import { MARKET_SIZE } from '../logic/deck.js';

const Market = ({
  market,
  onCardClick,
  selectedCardIndex = null,
  disabled = false,
  camelsInMarket = 0
}) => {
  return (
    <motion.section
      layout
      className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-900/40 p-6 text-slate-100 shadow-[0_40px_90px_rgba(4,120,87,0.25)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Pasar Pusat</p>
          <h2 className="text-2xl font-semibold text-white">Ambil Satu Barang</h2>
        </div>
        <div className="text-right text-sm text-slate-300">
          <div>
            <span className="font-semibold text-amber-200">{camelsInMarket}</span> unta tersedia
          </div>
          <div className="text-xs text-slate-500">
            {disabled ? 'Ronde berakhir' : 'Klik setelah memilih aksi Ambil Barang'}
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
        {market.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            size="normal"
            onClick={() => onCardClick?.(index)}
            selected={selectedCardIndex === index}
            disabled={disabled}
          />
        ))}
        {market.length < MARKET_SIZE &&
          [...Array(MARKET_SIZE - market.length)].map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex h-32 w-20 items-center justify-center rounded-2xl border border-white/10 border-dashed text-xs uppercase tracking-wide text-slate-500"
            >
              Kosong
            </div>
          ))}
      </div>
    </motion.section>
  );
};

export default Market;
