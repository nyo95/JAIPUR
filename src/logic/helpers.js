import { CARD_TYPES, TOKEN_VALUES, BONUS_TOKENS } from './deck.js';

// Check if round is over
export function isRoundOver(deck, tokenStacks) {
  return deck.length === 0 || Object.values(tokenStacks).filter(stack => stack.length === 0).length >= 3;
}

// Calculate majority bonus for camels
export function calculateCamelBonus(player1Camels, player2Camels) {
  const p1Count = player1Camels.length;
  const p2Count = player2Camels.length;
  
  if (p1Count > p2Count) {
    return { player1: 5, player2: 0 };
  } else if (p2Count > p1Count) {
    return { player1: 0, player2: 5 };
  } else {
    return { player1: 0, player2: 0 };
  }
}

// Sell goods and calculate score
export function sellGoods(cards, tokenStacks) {
  const cardType = cards[0].type;
  const count = cards.length;
  
  if (cardType === CARD_TYPES.CAMEL) {
    return { error: "Cannot sell camels" };
  }
  
  // Check minimum requirements
  const minRequired = [CARD_TYPES.DIAMOND, CARD_TYPES.GOLD, CARD_TYPES.SILVER].includes(cardType) ? 2 : 1;
  
  if (count < minRequired) {
    return { error: `Need at least ${minRequired} ${cardType} cards to sell` };
  }
  
  // Get token value
  const tokens = tokenStacks[cardType];
  if (tokens.length === 0) {
    return { error: `No ${cardType} tokens left` };
  }
  
  const tokenValue = tokens.shift();
  let totalScore = tokenValue;
  let bonusTokens = [];
  
  // Check for bonuses
  if (count >= 3) {
    if (count === 3 && BONUS_TOKENS.three.length > 0) {
      const bonus = BONUS_TOKENS.three.shift();
      bonusTokens.push({ type: 'three', value: bonus });
      totalScore += bonus;
    } else if (count === 4 && BONUS_TOKENS.four.length > 0) {
      const bonus = BONUS_TOKENS.four.shift();
      bonusTokens.push({ type: 'four', value: bonus });
      totalScore += bonus;
    } else if (count >= 5 && BONUS_TOKENS.five.length > 0) {
      const bonus = BONUS_TOKENS.five.shift();
      bonusTokens.push({ type: 'five', value: bonus });
      totalScore += bonus;
    }
  }
  
  return {
    score: totalScore,
    tokenValue,
    bonusTokens,
    newTokenStacks: tokenStacks
  };
}

// Take one goods card from market
export function takeGoodsCard(marketIndex, market, deck, playerHand) {
  if (marketIndex < 0 || marketIndex >= market.length) {
    return { error: "Invalid market index" };
  }
  
  const card = market[marketIndex];
  if (card.type === CARD_TYPES.CAMEL) {
    return { error: "Cannot take camel with take goods action" };
  }
  
  const newMarket = [...market];
  newMarket.splice(marketIndex, 1);
  
  // Refill market from deck
  if (deck.length > 0) {
    newMarket.push(deck.pop());
  }
  
  const newHand = [...playerHand, card];
  
  return {
    newMarket,
    newDeck: deck,
    newHand,
    takenCard: card
  };
}

// Take all camels from market
export function takeCamels(market, deck, playerCamelHerd) {
  const camels = market.filter(card => card.type === CARD_TYPES.CAMEL);
  
  if (camels.length === 0) {
    return { error: "No camels in market" };
  }
  
  // Remove camels from market
  const newMarket = market.filter(card => card.type !== CARD_TYPES.CAMEL);
  
  // Refill market from deck
  const cardsNeeded = camels.length;
  for (let i = 0; i < cardsNeeded && deck.length > 0; i++) {
    newMarket.push(deck.pop());
  }
  
  const newCamelHerd = [...playerCamelHerd, ...camels];
  
  return {
    newMarket,
    newDeck: deck,
    newCamelHerd,
    takenCamels: camels.length
  };
}

// Initialize token stacks
export function initializeTokenStacks() {
  const stacks = {};
  Object.keys(TOKEN_VALUES).forEach(type => {
    stacks[type] = [...TOKEN_VALUES[type]];
  });
  return stacks;
}

// Sort cards by type for display
export function sortCards(cards) {
  const typeOrder = [CARD_TYPES.DIAMOND, CARD_TYPES.GOLD, CARD_TYPES.SILVER, CARD_TYPES.CLOTH, CARD_TYPES.SPICE, CARD_TYPES.LEATHER];
  return [...cards].sort((a, b) => {
    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
  });
}

// Get card display color
export function getCardColor(cardType) {
  const colors = {
    [CARD_TYPES.DIAMOND]: 'bg-blue-500',
    [CARD_TYPES.GOLD]: 'bg-yellow-500',
    [CARD_TYPES.SILVER]: 'bg-gray-400',
    [CARD_TYPES.CLOTH]: 'bg-purple-500',
    [CARD_TYPES.SPICE]: 'bg-red-500',
    [CARD_TYPES.LEATHER]: 'bg-amber-700',
    [CARD_TYPES.CAMEL]: 'bg-orange-500'
  };
  return colors[cardType] || 'bg-gray-500';
}

// Get card display label
export function getCardLabel(cardType) {
  return cardType.charAt(0).toUpperCase() + cardType.slice(1);
}