// Card types
const CARD_TYPES = {
  DIAMOND: 'diamond',
  GOLD: 'gold',
  SILVER: 'silver',
  CLOTH: 'cloth',
  SPICE: 'spice',
  LEATHER: 'leather',
  CAMEL: 'camel'
};

// Token values for each goods type
const TOKEN_VALUES = {
  diamond: [7, 7, 5, 5, 5],
  gold: [6, 6, 5, 5, 5],
  silver: [5, 5, 5, 5, 5],
  cloth: [5, 3, 3, 2, 2, 1, 1],
  spice: [5, 3, 3, 2, 2, 1, 1],
  leather: [4, 3, 2, 1, 1, 1, 1]
};

// Bonus tokens
const BONUS_TOKENS = {
  three: [3, 2, 1],
  four: [6, 5, 4],
  five: [10, 9, 8]
};

// Create deck of cards
function createDeck() {
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
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal initial cards
const STARTING_HAND_SIZE = 5;
const MARKET_SIZE = 5;
const STARTING_CAMELS_IN_MARKET = 3;

function dealInitialCards(deck) {
  const newDeck = [...deck];
  const drawCard = () => (newDeck.length ? newDeck.pop() : null);

  const prepareHand = () => {
    const rawHand = [];
    for (let i = 0; i < STARTING_HAND_SIZE && newDeck.length; i++) {
      rawHand.push(drawCard());
    }
    const camels = rawHand.filter(card => card?.type === CARD_TYPES.CAMEL);
    const goods = rawHand.filter(card => card?.type !== CARD_TYPES.CAMEL);

    while (goods.length < STARTING_HAND_SIZE && newDeck.length) {
      const nextCard = drawCard();
      if (!nextCard) break;
      if (nextCard.type === CARD_TYPES.CAMEL) {
        camels.push(nextCard);
      } else {
        goods.push(nextCard);
      }
    }

    return {
      hand: goods,
      camelHerd: camels
    };
  };

  const player1Setup = prepareHand();
  const player2Setup = prepareHand();

  const market = buildStartingMarket(newDeck);

  return {
    deck: newDeck,
    player1: {
      hand: player1Setup.hand,
      camelHerd: player1Setup.camelHerd,
      tokens: [],
      score: 0
    },
    player2: {
      hand: player2Setup.hand,
      camelHerd: player2Setup.camelHerd,
      tokens: [],
      score: 0
    },
    market
  };
}

function buildStartingMarket(deck) {
  const market = [];

  for (let i = 0; i < STARTING_CAMELS_IN_MARKET; i++) {
    const camelIndex = deck.findIndex(card => card.type === CARD_TYPES.CAMEL);
    if (camelIndex === -1) break;
    market.push(deck.splice(camelIndex, 1)[0]);
  }

  while (market.length < MARKET_SIZE && deck.length) {
    market.push(deck.pop());
  }

  return market;
}

module.exports = {
  CARD_TYPES,
  TOKEN_VALUES,
  BONUS_TOKENS,
  createDeck,
  shuffleDeck,
  dealInitialCards,
  MARKET_SIZE
};
