import React from 'react';

const ScorePanel = ({ 
  player1, 
  player2, 
  tokenStacks, 
  deck, 
  roundOver = false 
}) => {
  const getRemainingTokens = (type) => {
    return tokenStacks[type] ? tokenStacks[type].length : 0;
  };

  const getTokenDisplay = (type, values) => {
    const remaining = getRemainingTokens(type);
    if (remaining === 0) return null;
    
    const colors = {
      diamond: 'bg-blue-500',
      gold: 'bg-yellow-500',
      silver: 'bg-gray-400',
      cloth: 'bg-purple-500',
      spice: 'bg-red-500',
      leather: 'bg-amber-700'
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 ${colors[type]} rounded`}></div>
        <span className="text-sm font-medium">{type}:</span>
        <span className="text-sm text-gray-600">{remaining} left</span>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
      <h3 className="text-lg font-bold text-center mb-4 text-gray-800">Game Status</h3>
      
      {/* Scores */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded p-3 text-center">
          <h4 className="font-semibold text-blue-600">Player 1</h4>
          <div className="text-2xl font-bold text-gray-800">{player1.score}</div>
          <div className="text-xs text-gray-500">🐪 {player1.camelHerd.length} camels</div>
        </div>
        <div className="bg-white rounded p-3 text-center">
          <h4 className="font-semibold text-red-600">Player 2</h4>
          <div className="text-2xl font-bold text-gray-800">{player2.score}</div>
          <div className="text-xs text-gray-500">🐪 {player2.camelHerd.length} camels</div>
        </div>
      </div>

      {/* Deck Status */}
      <div className="bg-white rounded p-3 mb-4 text-center">
        <div className="text-sm text-gray-600">Cards in Deck</div>
        <div className="text-xl font-bold text-gray-800">{deck.length}</div>
        {roundOver && (
          <div className="text-sm text-orange-600 font-semibold mt-1">Round Over!</div>
        )}
      </div>

      {/* Token Stacks */}
      <div className="bg-white rounded p-3">
        <h4 className="font-semibold text-gray-700 mb-2">Remaining Tokens</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {getTokenDisplay('diamond')}
          {getTokenDisplay('gold')}
          {getTokenDisplay('silver')}
          {getTokenDisplay('cloth')}
          {getTokenDisplay('spice')}
          {getTokenDisplay('leather')}
        </div>
      </div>

      {/* Empty Token Stacks Warning */}
      {Object.values(tokenStacks).filter(stack => stack.length === 0).length >= 3 && (
        <div className="mt-3 bg-orange-100 border border-orange-300 rounded p-2 text-center">
          <div className="text-sm text-orange-700 font-semibold">
            ⚠️ 3+ token stacks empty - Round will end!
          </div>
        </div>
      )}
    </div>
  );
};

export default ScorePanel;