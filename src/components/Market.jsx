import React from 'react';
import Card from './Card.jsx';

const Market = ({ market, onCardClick, selectedCard = null, disabled = false }) => {
  return (
    <div className="bg-green-100 rounded-xl p-6 shadow-inner">
      <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Market</h2>
      <div className="flex justify-center gap-4 flex-wrap">
        {market.map((card, index) => (
          <div key={card.id} className="relative">
            <Card
              card={card}
              onClick={() => onCardClick && onCardClick(index)}
              selected={selectedCard === index}
              disabled={disabled}
            />
            <div className="absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-700 shadow-md">
              {index + 1}
            </div>
          </div>
        ))}
        {/* Empty slots for visual consistency */}
        {[...Array(Math.max(0, 5 - market.length))].map((_, index) => (
          <div
            key={`empty-${index}`}
            className="w-16 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
          >
            <span className="text-gray-400 text-sm">Empty</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Market;