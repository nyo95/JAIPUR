import React from 'react';
import Card from './Card.jsx';
import { sortCards } from '../logic/helpers.js';

const PlayerArea = ({ 
  player, 
  playerName, 
  isActive, 
  onCardSelect, 
  selectedCards = [], 
  disabled = false,
  position = 'top' 
}) => {
  const sortedHand = sortCards(player.hand);
  
  const handleCardClick = (card) => {
    if (!disabled && onCardSelect) {
      onCardSelect(card);
    }
  };

  const isCardSelected = (card) => {
    return selectedCards.some(selected => selected.id === card.id);
  };

  const positionClasses = position === 'top' ? 'border-b-4' : 'border-t-4';
  const activeBorder = isActive ? 'border-blue-500' : 'border-gray-300';

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${positionClasses} ${activeBorder} transition-all duration-300`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className={`text-lg font-bold ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
            {playerName}
            {isActive && <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded-full">Active</span>}
          </h3>
          <div className="text-sm text-gray-600">
            Score: {player.score}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            🐪 Camels: {player.camelHerd.length}
          </div>
          <div className="text-sm text-gray-600">
            🎴 Hand: {player.hand.length}
          </div>
        </div>
      </div>

      {/* Camel Herd */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Camel Herd</h4>
        <div className="flex gap-2 flex-wrap">
          {player.camelHerd.length > 0 ? (
            player.camelHerd.map((camel, index) => (
              <Card
                key={camel.id}
                card={camel}
                disabled={true}
                size="small"
              />
            ))
          ) : (
            <div className="text-gray-400 text-sm italic">No camels</div>
          )}
        </div>
      </div>

      {/* Hand */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Hand</h4>
        <div className="flex gap-2 flex-wrap min-h-[6rem]">
          {sortedHand.length > 0 ? (
            sortedHand.map((card) => (
              <Card
                key={card.id}
                card={card}
                onClick={handleCardClick}
                selected={isCardSelected(card)}
                disabled={disabled}
                size="small"
              />
            ))
          ) : (
            <div className="text-gray-400 text-sm italic">No cards</div>
          )}
        </div>
      </div>

      {/* Tokens */}
      {player.tokens && player.tokens.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Tokens</h4>
          <div className="flex gap-1 flex-wrap">
            {player.tokens.map((token, index) => (
              <div
                key={index}
                className="bg-yellow-100 border border-yellow-300 rounded px-2 py-1 text-xs font-semibold text-yellow-800"
              >
                {token.value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerArea;