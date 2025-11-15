// Card types
export const CARD_TYPES = {
  DIAMOND: 'diamond',
  GOLD: 'gold',
  SILVER: 'silver',
  CLOTH: 'cloth',
  SPICE: 'spice',
  LEATHER: 'leather',
  CAMEL: 'camel'
};

// Token values for each goods type
export const TOKEN_VALUES = {
  diamond: [7, 7, 5, 5, 5],
  gold: [6, 6, 5, 5, 5],
  silver: [5, 5, 5, 5, 5],
  cloth: [5, 3, 3, 2, 2, 1, 1],
  spice: [5, 3, 3, 2, 2, 1, 1],
  leather: [4, 3, 2, 1, 1, 1, 1]
};

// Bonus tokens
export const BONUS_TOKENS = {
  three: [3, 2, 1],
  four: [6, 5, 4],
  five: [10, 9, 8]
};

// Create deck of cards
export function createDeck() {
  const deck = [];
  
  // Add goods cards (6 of each type except leather which has 8)
  for (let i = 0; i < 6; i++) {
    deck.push({ id: deck.length, type: CARD_TYPES.DIAMOND });
    deck.push({ id: deck.length, type: CARD_TYPES.GOLD });
    deck.push({ id: deck.length, type: CARD_TYPES.SILVER });
    deck.push({ id: deck.length, type: CARD_TYPES.CLOTH });
    deck.push({ id: deck.length, type: CARD_TYPES.SPICE });
  }
  
  // Add leather (8 cards)
  for (let i = 0; i < 8; i++) {
    deck.push({ id: deck.length, type: CARD_TYPES.LEATHER });
  }
  
  // Add camel cards (11 cards)
  for (let i = 0; i < 11; i++) {
    deck.push({ id: deck.length, type: CARD_TYPES.CAMEL });
  }
  
  return shuffleDeck(deck);
}

// Shuffle deck
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal initial cards
export function dealInitialCards(deck) {
  const newDeck = [...deck];
  
  // Deal 5 cards to each player
  const player1Hand = [];
  const player2Hand = [];
  
  for (let i = 0; i < 5; i++) {
    player1Hand.push(newDeck.pop());
    player2Hand.push(newDeck.pop());
  }
  
  // Put camels in herd and replacements in hand
  const player1Camels = player1Hand.filter(card => card.type === CARD_TYPES.CAMEL);
  const player2Camels = player2Hand.filter(card => card.type === CARD_TYPES.CAMEL);
  
  const player1Goods = player1Hand.filter(card => card.type !== CARD_TYPES.CAMEL);
  const player2Goods = player2Hand.filter(card => card.type !== CARD_TYPES.CAMEL);
  
  // Replace camels with new cards from deck
  while (player1Goods.length < 5 && newDeck.length > 0) {
    const newCard = newDeck.pop();
    if (newCard.type !== CARD_TYPES.CAMEL) {
      player1Goods.push(newCard);
    } else {
      player1Camels.push(newCard);
    }
  }
  
  while (player2Goods.length < 5 && newDeck.length > 0) {
    const newCard = newDeck.pop();
    if (newCard.type !== CARD_TYPES.CAMEL) {
      player2Goods.push(newCard);
    } else {
      player2Camels.push(newCard);
    }
  }
  
  // Create market with 3 cards
  const market = [];
  for (let i = 0; i < 3; i++) {
    market.push(newDeck.pop());
  }
  
  return {
    deck: newDeck,
    player1: {
      hand: player1Goods,
      camelHerd: player1Camels,
      tokens: [],
      score: 0
    },
    player2: {
      hand: player2Goods,
      camelHerd: player2Camels,
      tokens: [],
      score: 0
    },
    market
  };
}