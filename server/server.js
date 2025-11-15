const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const { createDeck, dealInitialCards } = require('./deck.js');
const {
  HAND_LIMIT,
  calculateCamelBonus,
  getCardLabel,
  initializeBonusTokens,
  initializeTokenStacks,
  isRoundOver,
  sellGoods,
  takeCamels,
  takeGoodsCard
} = require('./helpers.js');

const server = http.createServer();
const wssLobby = new WebSocket.Server({ noServer: true });
const wssGames = new Map();

let lobbyState = {
  presence: {},
  match: null,
  instructionsAck: {},
  ready: {}
};
const gameStates = new Map();

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const broadcastLobbyState = () => {
  const message = JSON.stringify({ type: 'lobby-state', payload: lobbyState });
  wssLobby.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

const broadcastGameState = matchId => {
  const gameState = gameStates.get(matchId);
  if (!gameState) return;
  const message = JSON.stringify({ type: 'game-state', payload: gameState });
  const wssGame = wssGames.get(matchId);
  if (wssGame) {
    wssGame.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

wssLobby.on('connection', ws => {
  console.log('Client connected to lobby');
  ws.clientId = null;

  ws.on('message', message => {
    const { type, payload } = JSON.parse(message);

    switch (type) {
      case 'identify':
        ws.clientId = payload.clientId;
        lobbyState.presence[ws.clientId] = {
          id: ws.clientId,
          name: payload.name,
          updatedAt: Date.now()
        };
        break;
      case 'update-presence':
        if (ws.clientId) {
          lobbyState.presence[ws.clientId] = {
            ...lobbyState.presence[ws.clientId],
            name: payload.name,
            updatedAt: Date.now()
          };
        }
        break;
      case 'invite-player':
        const matchId = createId();
        lobbyState.match = {
          id: matchId,
          status: 'pending',
          inviter: ws.clientId,
          invitee: payload.targetId,
          players: [ws.clientId, payload.targetId],
          createdAt: Date.now()
        };
        lobbyState.instructionsAck = {};
        lobbyState.ready = {};
        break;
      case 'decline-invite':
        lobbyState.match = null;
        break;
      case 'accept-invite':
        if (lobbyState.match && lobbyState.match.invitee === ws.clientId) {
          const seatsOrder = Math.random() < 0.5 ? [1, 2] : [2, 1];
          lobbyState.match.seats = {
            [lobbyState.match.inviter]: seatsOrder[0],
            [lobbyState.match.invitee]: seatsOrder[1]
          };
          lobbyState.match.firstSeat = Math.random() < 0.5 ? 1 : 2;
          lobbyState.match.status = 'active';
        }
        break;
      case 'acknowledge-instructions':
        lobbyState.instructionsAck[ws.clientId] = true;
        break;
      case 'toggle-ready':
        lobbyState.ready[ws.clientId] = !lobbyState.ready[ws.clientId];
        break;
      case 'mark-match-in-game':
        if (lobbyState.match) {
          lobbyState.match.status = 'inGame';
        }
        break;
      case 'request-rematch':
        if (lobbyState.match) {
          lobbyState.match.status = 'active';
          lobbyState.match.firstSeat = Math.random() < 0.5 ? 1 : 2;
          lobbyState.instructionsAck = {};
          lobbyState.ready = {};
        }
        break;
    }

    broadcastLobbyState();
  });

  ws.on('close', () => {
    console.log('Client disconnected from lobby');
    if (ws.clientId) {
      delete lobbyState.presence[ws.clientId];
      if (
        lobbyState.match &&
        lobbyState.match.players.includes(ws.clientId)
      ) {
        lobbyState.match = null;
      }
      broadcastLobbyState();
    }
  });
});

server.on('upgrade', (request, socket, head) => {
  const { pathname } = url.parse(request.url);

  if (pathname.startsWith('/game/')) {
    const matchId = pathname.split('/')[2];
    if (!wssGames.has(matchId)) {
      wssGames.set(matchId, new WebSocket.Server({ noServer: true }));
      initializeGameServer(matchId);
    }
    const wssGame = wssGames.get(matchId);
    wssGame.handleUpgrade(request, socket, head, ws => {
      wssGame.emit('connection', ws, request);
    });
  } else {
    wssLobby.handleUpgrade(request, socket, head, ws => {
      wssLobby.emit('connection', ws, request);
    });
  }
});

function initializeGameServer(matchId) {
  const wssGame = wssGames.get(matchId);
  gameStates.set(matchId, {
    phase: 'loading',
    currentPlayer: 1,
    players: { 1: defaultPlayer(), 2: defaultPlayer() },
    market: [],
    deck: [],
    tokenStacks: {},
    bonusStacks: {},
    actionMode: null,
    message: 'Menunggu permainan dimulai...',
    selection: { hand: [], marketIndex: null },
    roundResult: null
  });

  wssGame.on('connection', ws => {
    console.log(`Client connected to game ${matchId}`);

    ws.on('message', message => {
      const { type, payload } = JSON.parse(message);
      const gameState = gameStates.get(matchId);
      const { currentPlayer, players, market, deck, tokenStacks, bonusStacks } =
        gameState;
      const playerData = players[currentPlayer];

      switch (type) {
        case 'join':
          broadcastGameState(matchId);
          break;
        case 'start-round':
          const shuffledDeck = createDeck();
          const setup = dealInitialCards(shuffledDeck);
          gameState.deck = setup.deck;
          gameState.market = setup.market;
          gameState.players = { 1: setup.player1, 2: setup.player2 };
          gameState.tokenStacks = initializeTokenStacks();
          gameState.bonusStacks = initializeBonusTokens();
          gameState.currentPlayer = payload.startingSeat;
          gameState.phase = 'playing';
          gameState.message = `Giliran ${payload.seatLabel}`;
          break;
        case 'change-action-mode':
          gameState.actionMode =
            gameState.actionMode === payload.mode ? null : payload.mode;
          gameState.selection = { hand: [], marketIndex: null };
          break;
        case 'select-market-card':
          const takeResult = takeGoodsCard(
            payload.index,
            market,
            deck,
            playerData.hand,
            { handLimit: HAND_LIMIT }
          );
          if (takeResult.error) {
            gameState.message = takeResult.error;
          } else {
            gameState.market = takeResult.newMarket;
            gameState.deck = takeResult.newDeck;
            playerData.hand = takeResult.newHand;
            advanceTurn(
              gameState,
              `Pemain ${currentPlayer} mengambil ${getCardLabel(
                takeResult.takenCard.type
              )}`
            );
          }
          break;
        case 'take-camels':
          const camelResult = takeCamels(market, deck, playerData.camelHerd);
          if (camelResult.error) {
            gameState.message = camelResult.error;
          } else {
            gameState.market = camelResult.newMarket;
            gameState.deck = camelResult.newDeck;
            playerData.camelHerd = camelResult.newCamelHerd;
            advanceTurn(
              gameState,
              `Pemain ${currentPlayer} mengambil ${camelResult.takenCamels} unta`
            );
          }
          break;
        case 'sell-goods':
          const sellResult = sellGoods(
            gameState.selection.hand,
            tokenStacks,
            bonusStacks
          );
          if (sellResult.error) {
            gameState.message = sellResult.error;
          } else {
            const soldType = gameState.selection.hand[0].type;
            const soldCount = gameState.selection.hand.length;
            playerData.hand = playerData.hand.filter(
              card =>
                !gameState.selection.hand.some(
                  selected => selected.id === card.id
                )
            );
            playerData.tokens = [
              ...playerData.tokens,
              ...sellResult.tokenValues.map(value => ({
                type: soldType,
                value
              })),
              ...sellResult.bonusTokens
            ];
            playerData.score += sellResult.score;
            gameState.tokenStacks = sellResult.newTokenStacks;
            gameState.bonusStacks = sellResult.newBonusStacks;
            advanceTurn(
              gameState,
              `Pemain ${currentPlayer} menjual ${soldCount} ${getCardLabel(
                soldType
              )} senilai ${sellResult.score} poin`
            );
          }
          break;
        case 'select-hand-card':
          const card = payload.card;
          const exists = gameState.selection.hand.find(
            selected => selected.id === card.id
          );
          gameState.selection.hand = exists
            ? gameState.selection.hand.filter(item => item.id !== card.id)
            : [...gameState.selection.hand, card];
          break;
      }

      if (
        gameState.phase === 'playing' &&
        isRoundOver(deck, tokenStacks)
      ) {
        finalizeRound(gameState);
      }

      broadcastGameState(matchId);
    });

    ws.on('close', () => {
      console.log(`Client disconnected from game ${matchId}`);
    });
  });
}

function advanceTurn(gameState, resultText) {
  gameState.selection = { hand: [], marketIndex: null };
  gameState.actionMode = null;
  gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
  gameState.message = `${resultText} • Giliran Pemain ${gameState.currentPlayer}`;
}

function finalizeRound(gameState) {
  gameState.phase = 'roundOver';
  const camelBonus = calculateCamelBonus(
    gameState.players[1].camelHerd,
    gameState.players[2].camelHerd
  );
  const finalScores = {
    1: gameState.players[1].score + camelBonus.player1,
    2: gameState.players[2].score + camelBonus.player2
  };
  const winner =
    finalScores[1] === finalScores[2]
      ? 'tie'
      : finalScores[1] > finalScores[2]
        ? 1
        : 2;
  gameState.roundResult = { camelBonus, finalScores, winner };
  gameState.message =
    winner === 'tie'
      ? 'Ronde selesai • Hasil seri!'
      : `Ronde selesai • Pemain ${winner} menang!`;
  gameState.players[1].score = finalScores[1];
  gameState.players[2].score = finalScores[2];
}

const defaultPlayer = () => ({
  hand: [],
  camelHerd: [],
  tokens: [],
  score: 0
});

server.listen(8080, () => {
  console.log('WebSocket server started on port 8080');
});
