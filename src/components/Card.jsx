import React from 'react';
import { getCardColor, getCardLabel } from '../logic/helpers.js';

const Card = ({ card, onClick, selected, disabled = false, size = 'normal' }) => {
  const sizeClasses = {
    small: 'w-12 h-16 text-xs',
    normal: 'w-16 h-24 text-sm',
    large: 'w-20 h-28 text-base'
  };

  const baseClasses = `
    ${sizeClasses[size]}
    ${getCardColor(card.type)}
    rounded-lg shadow-md border-2 border-white
    flex flex-col items-center justify-center
    text-white font-bold cursor-pointer
    transition-all duration-200 transform
    hover:scale-105 hover:shadow-lg
    ${selected ? 'ring-4 ring-yellow-400 scale-105' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
  `;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(card);
    }
  };

  return (
    <div className={baseClasses} onClick={handleClick}>
      <div className="text-center">
        {card.type === 'camel' ? (
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-1">🐪</div>
            <div>{getCardLabel(card.type)}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-lg mb-1">
              {card.type === 'diamond' && '💎'}
              {card.type === 'gold' && '🪙'}
              {card.type === 'silver' && '🥈'}
              {card.type === 'cloth' && '🧵'}
              {card.type === 'spice' && '🌶️'}
              {card.type === 'leather' && '👞'}
            </div>
            <div>{getCardLabel(card.type)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;