import React from 'react';

const ActionButtons = ({ 
  onTakeCard, 
  onTakeCamels, 
  onSellGoods, 
  canTakeCard = true, 
  canTakeCamels = true, 
  canSellGoods = true,
  disabled = false 
}) => {
  const buttonClasses = `
    px-6 py-3 rounded-lg font-semibold text-white
    transition-all duration-200 transform
    hover:scale-105 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:hover:scale-100 shadow-md
  `;

  return (
    <div className="flex justify-center gap-4 p-4 bg-gray-100 rounded-lg">
      <button
        onClick={onTakeCard}
        disabled={disabled || !canTakeCard}
        className={`${buttonClasses} bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400`}
      >
        🎴 Take Card
      </button>
      
      <button
        onClick={onTakeCamels}
        disabled={disabled || !canTakeCamels}
        className={`${buttonClasses} bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400`}
      >
        🐪 Take Camels
      </button>
      
      <button
        onClick={onSellGoods}
        disabled={disabled || !canSellGoods}
        className={`${buttonClasses} bg-green-500 hover:bg-green-600 disabled:bg-gray-400`}
      >
        💰 Sell Goods
      </button>
    </div>
  );
};

export default ActionButtons;