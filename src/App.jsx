import React, { useState, useEffect } from 'react';
import Market from './components/Market.jsx';
import PlayerArea from './components/PlayerArea.jsx';
import ActionButtons from './components/ActionButtons.jsx';
import ScorePanel from './components/ScorePanel.jsx';
import { createDeck, dealInitialCards } from './logic/deck.js';
import { 
  isRoundOver, 
  sellGoods, 
  takeGoodsCard, 
  takeCamels, 
  initializeTokenStacks,
  calculateCamelBonus 
} from './logic/helpers.js';

const App = () => {
  const [gameState, setGameState] = useState('setup'); // setup, playing, roundOver, gameOver
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [selectedMarketCard, setSelectedMarketCard] = useState(null);
  const [selectedHandCards, setSelectedHandCards] = useState([]);
  const [actionMode, setActionMode] = useState(null); // 'takeCard', 'takeCamels', 'sellGoods', null
  const [message, setMessage] = useState('');
  
  const [deck, setDeck] = useState([]);
  const [market, setMarket] = useState([]);
  const [player1, setPlayer1] = useState({
    hand: [],
    camelHerd: [],
    tokens: [],
    score: 0
  });
  const [player2, setPlayer2] = useState({
    hand: [],
    camelHerd: [],
    tokens: [],
    score: 0
  });
  const [tokenStacks, setTokenStacks] = useState({});

  // Initialize game
  const initializeGame = () => {
    const newDeck = createDeck();
    const initialSetup = dealInitialCards(newDeck);
    const initialTokenStacks = initializeTokenStacks();
    
    setDeck(initialSetup.deck);
    setMarket(initialSetup.market);
    setPlayer1(initialSetup.player1);
    setPlayer2(initialSetup.player2);
    setTokenStacks(initialTokenStacks);
    setCurrentPlayer(1);
    setGameState('playing');
    setMessage('Player 1\'s turn');
    setSelectedMarketCard(null);
    setSelectedHandCards([]);
    setActionMode(null);
  };

  // Start new game
  useEffect(() => {
    initializeGame();
  }, []);

  // Check if round is over
  useEffect(() => {
    if (gameState === 'playing' && isRoundOver(deck, tokenStacks)) {
      endRound();
    }
  }, [deck, tokenStacks, gameState]);

  const getCurrentPlayer = () => {
    return currentPlayer === 1 ? player1 : player2;
  };

  const setCurrentPlayerData = (data) => {
    if (currentPlayer === 1) {
      setPlayer1(data);
    } else {
      setPlayer2(data);
    }
  };

  const endTurn = () => {
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);
    setMessage(`Player ${nextPlayer}'s turn`);
    setSelectedMarketCard(null);
    setSelectedHandCards([]);
    setActionMode(null);
  };

  const handleMarketCardClick = (index) => {
    if (actionMode === 'takeCard') {
      setSelectedMarketCard(index);
      performTakeCard(index);
    }
  };

  const handleHandCardClick = (card) => {
    if (actionMode === 'sellGoods') {
      const isSelected = selectedHandCards.some(c => c.id === card.id);
      if (isSelected) {
        setSelectedHandCards(selectedHandCards.filter(c => c.id !== card.id));
      } else {
        setSelectedHandCards([...selectedHandCards, card]);
      }
    }
  };

  const performTakeCard = (marketIndex) => {
    const currentPlayerData = getCurrentPlayer();
    const result = takeGoodsCard(marketIndex, market, deck, currentPlayerData.hand);
    
    if (result.error) {
      setMessage(result.error);
      return;
    }
    
    setMarket(result.newMarket);
    setDeck(result.newDeck);
    setCurrentPlayerData({
      ...currentPlayerData,
      hand: result.newHand
    });
    
    setMessage(`Player ${currentPlayer} took ${result.takenCard.type}`);
    endTurn();
  };

  const performTakeCamels = () => {
    const currentPlayerData = getCurrentPlayer();
    const result = takeCamels(market, deck, currentPlayerData.camelHerd);
    
    if (result.error) {
      setMessage(result.error);
      return;
    }
    
    setMarket(result.newMarket);
    setDeck(result.newDeck);
    setCurrentPlayerData({
      ...currentPlayerData,
      camelHerd: result.newCamelHerd
    });
    
    setMessage(`Player ${currentPlayer} took ${result.takenCamels} camels`);
    endTurn();
  };

  const performSellGoods = () => {
    if (selectedHandCards.length === 0) {
      setMessage('Please select cards to sell');
      return;
    }
    
    const result = sellGoods(selectedHandCards, tokenStacks);
    
    if (result.error) {
      setMessage(result.error);
      return;
    }
    
    const currentPlayerData = getCurrentPlayer();
    const newHand = currentPlayerData.hand.filter(
      card => !selectedHandCards.some(selected => selected.id === card.id)
    );
    
    setTokenStacks(result.newTokenStacks);
    setCurrentPlayerData({
      ...currentPlayerData,
      hand: newHand,
      tokens: [...currentPlayerData.tokens, { value: result.tokenValue, type: selectedHandCards[0].type }, ...result.bonusTokens],
      score: currentPlayerData.score + result.score
    });
    
    setMessage(`Player ${currentPlayer} sold ${selectedHandCards.length} ${selectedHandCards[0].type} for ${result.score} points`);
    setSelectedHandCards([]);
    endTurn();
  };

  const endRound = () => {
    setGameState('roundOver');
    
    // Calculate camel bonus
    const camelBonus = calculateCamelBonus(player1.camelHerd, player2.camelHerd);
    
    const finalPlayer1Score = player1.score + camelBonus.player1;
    const finalPlayer2Score = player2.score + camelBonus.player2;
    
    setPlayer1(prev => ({ ...prev, score: finalPlayer1Score }));
    setPlayer2(prev => ({ ...prev, score: finalPlayer2Score }));
    
    const winner = finalPlayer1Score > finalPlayer2Score ? 1 : finalPlayer2Score > finalPlayer1Score ? 2 : 'tie';
    setMessage(`Round Over! ${winner === 'tie' ? 'It\'s a tie!' : `Player ${winner} wins!`}`);
  };

  const canTakeCamels = () => {
    return market.some(card => card.type === 'camel');
  };

  const canSellGoods = () => {
    return selectedHandCards.length > 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">Jaipur</h1>
        
        {/* Message */}
        <div className="text-center mb-4">
          <div className="inline-block bg-white rounded-lg px-6 py-3 shadow-md">
            <p className="text-lg font-semibold text-gray-700">{message}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Game Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Player 2 Area */}
            <PlayerArea
              player={player2}
              playerName="Player 2"
              isActive={currentPlayer === 2 && gameState === 'playing'}
              onCardSelect={handleHandCardClick}
              selectedCards={selectedHandCards}
              disabled={currentPlayer !== 2 || gameState !== 'playing'}
              position="top"
            />

            {/* Market */}
            <Market
              market={market}
              onCardClick={handleMarketCardClick}
              selectedCard={selectedMarketCard}
              disabled={gameState !== 'playing'}
            />

            {/* Action Buttons */}
            {gameState === 'playing' && (
              <ActionButtons
                onTakeCard={() => setActionMode('takeCard')}
                onTakeCamels={performTakeCamels}
                onSellGoods={performSellGoods}
                canTakeCard={actionMode === null}
                canTakeCamels={canTakeCamels()}
                canSellGoods={canSellGoods()}
                disabled={currentPlayer !== (currentPlayer === 1 ? 1 : 2)}
              />
            )}

            {/* Player 1 Area */}
            <PlayerArea
              player={player1}
              playerName="Player 1"
              isActive={currentPlayer === 1 && gameState === 'playing'}
              onCardSelect={handleHandCardClick}
              selectedCards={selectedHandCards}
              disabled={currentPlayer !== 1 || gameState !== 'playing'}
              position="bottom"
            />
          </div>

          {/* Score Panel */}
          <div className="lg:col-span-1">
            <ScorePanel
              player1={player1}
              player2={player2}
              tokenStacks={tokenStacks}
              deck={deck}
              roundOver={gameState === 'roundOver'}
            />
            
            {/* Game Over Controls */}
            {gameState === 'roundOver' && (
              <div className="mt-4 text-center">
                <button
                  onClick={initializeGame}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transform transition hover:scale-105"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;