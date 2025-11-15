import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { getCardAsset, getCardLabel } from '../logic/helpers.js';

const SIZE_CLASSES = {
  small: 'h-24 w-16',
  normal: 'h-32 w-20',
  large: 'h-44 w-28'
};

const Card = ({ card, onClick, selected, disabled = false, size = 'normal' }) => {
  if (!card) return null;

  const handleClick = () => {
    if (!disabled) {
      onClick?.(card);
    }
  };

  return (
    <motion.button
      type="button"
      layout
      whileHover={!disabled ? { y: -4 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      onClick={handleClick}
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-1 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        SIZE_CLASSES[size],
        disabled && 'cursor-not-allowed opacity-40',
        selected && 'ring-2 ring-amber-300 shadow-[0_20px_45px_rgba(251,191,36,0.35)]'
      )}
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-slate-900/40">
        <img
          src={getCardAsset(card.type)}
          alt={`${getCardLabel(card.type)} card`}
          draggable={false}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-slate-950/80 px-3 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-slate-100">
        {getCardLabel(card.type)}
      </div>
    </motion.button>
  );
};

export default Card;
