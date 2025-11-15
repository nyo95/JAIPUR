import { CARD_TYPES, TOKEN_VALUES, BONUS_TOKENS, MARKET_SIZE } from './deck.js';

export const HAND_LIMIT = 7;
const PRECIOUS_GOODS = new Set([CARD_TYPES.DIAMOND, CARD_TYPES.GOLD, CARD_TYPES.SILVER]);
const CARD_LABELS = {
  [CARD_TYPES.DIAMOND]: 'Berlian',
  [CARD_TYPES.GOLD]: 'Emas',
  [CARD_TYPES.SILVER]: 'Perak',
  [CARD_TYPES.CLOTH]: 'Kain',
  [CARD_TYPES.SPICE]: 'Rempah',
  [CARD_TYPES.LEATHER]: 'Kulit',
  [CARD_TYPES.CAMEL]: 'Unta'
};

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
export function sellGoods(cards, tokenStacks, bonusStacks) {
  if (!cards || cards.length === 0) {
    return { error: 'Pilih barang untuk dijual' };
  }

  const cardType = cards[0].type;
  const count = cards.length;

  if (cardType === CARD_TYPES.CAMEL) {
    return { error: 'Tidak bisa menjual unta' };
  }

  const isMixedSet = cards.some(card => card.type !== cardType);
  if (isMixedSet) {
    return { error: 'Barang yang dijual harus sejenis' };
  }

  const minRequired = PRECIOUS_GOODS.has(cardType) ? 2 : 1;
  if (count < minRequired) {
    return { error: `Butuh minimal ${minRequired} ${getCardLabel(cardType)} untuk menjual` };
  }

  const availableTokens = tokenStacks[cardType] ?? [];
  if (availableTokens.length < count) {
    return { error: `Token ${getCardLabel(cardType)} tidak mencukupi` };
  }

  const newTokenStacks = {
    ...tokenStacks,
    [cardType]: availableTokens.slice(count)
  };

  const tokenValues = availableTokens.slice(0, count);
  let totalScore = tokenValues.reduce((sum, value) => sum + value, 0);

  const { bonusTokens, updatedBonusStacks } = pullBonusTokens(count, bonusStacks);
  totalScore += bonusTokens.reduce((sum, token) => sum + token.value, 0);

  return {
    score: totalScore,
    tokenValues,
    bonusTokens,
    newTokenStacks,
    newBonusStacks: updatedBonusStacks
  };
}

// Take one goods card from market
export function takeGoodsCard(marketIndex, market, deck, playerHand, options = {}) {
  const handLimit = options.handLimit ?? HAND_LIMIT;
  if (marketIndex < 0 || marketIndex >= market.length) {
    return { error: 'Pilihan pasar tidak valid' };
  }

  const card = market[marketIndex];
  if (card.type === CARD_TYPES.CAMEL) {
    return { error: 'Tidak bisa mengambil unta lewat aksi ini' };
  }

  const goodsCount = playerHand.filter(item => item.type !== CARD_TYPES.CAMEL).length;
  if (goodsCount >= handLimit) {
    return { error: `Jumlah barang di tangan sudah mencapai batas (${handLimit})` };
  }
  if (goodsCount + 1 > handLimit) {
    return { error: `Mengambil kartu ini akan melewati batas ${handLimit} barang di tangan` };
  }
  
  const newMarket = [...market];
  const newDeck = [...deck];
  const replacementCard = newDeck.length ? newDeck.pop() : null;
  
  if (replacementCard) {
    newMarket.splice(marketIndex, 1, replacementCard);
  } else {
    newMarket.splice(marketIndex, 1);
  }
  
  const newHand = [...playerHand, card];
  
  return {
    newMarket,
    newDeck,
    newHand,
    takenCard: card
  };
}

// Take all camels from market
export function takeCamels(market, deck, playerCamelHerd) {
  const camels = market.filter(card => card.type === CARD_TYPES.CAMEL);

  if (camels.length === 0) {
    return { error: 'Tidak ada unta di pasar' };
  }
  
  const newMarket = market.filter(card => card.type !== CARD_TYPES.CAMEL);
  const newDeck = [...deck];
  
  while (newMarket.length < MARKET_SIZE && newDeck.length > 0) {
    newMarket.push(newDeck.pop());
  }
  
  const newCamelHerd = [...playerCamelHerd, ...camels];
  
  return {
    newMarket,
    newDeck,
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

export function initializeBonusTokens() {
  return {
    three: [...BONUS_TOKENS.three],
    four: [...BONUS_TOKENS.four],
    five: [...BONUS_TOKENS.five]
  };
}

// Sort cards by type for display
export function sortCards(cards) {
  const typeOrder = [CARD_TYPES.DIAMOND, CARD_TYPES.GOLD, CARD_TYPES.SILVER, CARD_TYPES.CLOTH, CARD_TYPES.SPICE, CARD_TYPES.LEATHER];
  return [...cards].sort((a, b) => {
    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
  });
}

// Get card display label
export function getCardLabel(cardType) {
  return CARD_LABELS[cardType] || cardType;
}

export function getCardAsset(cardType) {
  return `/cards/${cardType}.png`;
}

function pullBonusTokens(count, bonusStacks = { three: [], four: [], five: [] }) {
  const updatedBonusStacks = {
    three: [...(bonusStacks.three ?? [])],
    four: [...(bonusStacks.four ?? [])],
    five: [...(bonusStacks.five ?? [])]
  };

  let bonusTokens = [];
  if (count === 3 && updatedBonusStacks.three.length) {
    bonusTokens = [{ type: 'three', value: updatedBonusStacks.three.shift() }];
  } else if (count === 4 && updatedBonusStacks.four.length) {
    bonusTokens = [{ type: 'four', value: updatedBonusStacks.four.shift() }];
  } else if (count >= 5 && updatedBonusStacks.five.length) {
    bonusTokens = [{ type: 'five', value: updatedBonusStacks.five.shift() }];
  }

  return { bonusTokens, updatedBonusStacks };
}
