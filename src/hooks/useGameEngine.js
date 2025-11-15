import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HAND_LIMIT
} from '../logic/helpers.js';

export const ACTION_MODES = {
  TAKE_CARD: 'takeCard',
  SELL_GOODS: 'sellGoods'
};

const defaultPlayer = () => ({
  hand: [],
  camelHerd: [],
  tokens: [],
  score: 0
});

const EMPTY_SELECTION = { hand: [], marketIndex: null };

export function useGameEngine(lobby) {
  const [gameState, setGameState] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!lobby.match || lobby.match.status !== 'inGame') return;

    const ws = new WebSocket(`ws://${window.location.hostname}:8080/game/${lobby.match.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to game server for match ${lobby.match.id}`);
      ws.send(JSON.stringify({ type: 'join', payload: { clientId: lobby.clientId } }));
    };

    ws.onmessage = event => {
      const { type, payload } = JSON.parse(event.data);
      if (type === 'game-state') {
        setGameState(payload);
        setHydrated(true);
      }
    };

    ws.onclose = () => {
      console.log(`Disconnected from game server for match ${lobby.match.id}`);
    };

    return () => {
      ws.close();
    };
  }, [lobby.match, lobby.clientId]);

  const sendMessage = useCallback((type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const startRound = useCallback(
    (startingSeat = 1, seatLabel = `Pemain ${startingSeat}`) => {
      sendMessage('start-round', { startingSeat, seatLabel });
    },
    [sendMessage]
  );

  const changeActionMode = useCallback(
    mode => {
      sendMessage('change-action-mode', { mode });
    },
    [sendMessage]
  );

  const handleSelectMarketCard = useCallback(
    index => {
      sendMessage('select-market-card', { index });
    },
    [sendMessage]
  );

  const handleSelectHandCard = useCallback(
    card => {
      sendMessage('select-hand-card', { card });
    },
    [sendMessage]
  );

  const performTakeCamels = useCallback(() => {
    sendMessage('take-camels');
  }, [sendMessage]);

  const performSellGoods = useCallback(() => {
    sendMessage('sell-goods');
  }, [sendMessage]);

  const currentPlayerData = gameState?.players[gameState.currentPlayer] ?? defaultPlayer();

  const derived = useMemo(() => {
    if (!gameState)
      return { goodsCount: 0, camelsInMarket: 0, emptyStacks: [] };
    const goodsCount =
      currentPlayerData.hand.filter(card => card.type !== 'camel').length;
    const camelsInMarket = gameState.market.filter(
      card => card.type === 'camel'
    ).length;
    const emptyStacks = Object.entries(gameState.tokenStacks)
      .filter(([, stack]) => stack.length === 0)
      .map(([type]) => type);

    return {
      goodsCount,
      camelsInMarket,
      emptyStacks
    };
  }, [currentPlayerData, gameState]);

  return {
    hydrated,
    phase: gameState?.phase ?? 'loading',
    currentPlayer: gameState?.currentPlayer,
    players: gameState?.players ?? { 1: defaultPlayer(), 2: defaultPlayer() },
    market: gameState?.market ?? [],
    deck: gameState?.deck ?? [],
    tokenStacks: gameState?.tokenStacks ?? {},
    bonusStacks: gameState?.bonusStacks ?? {},
    actionMode: gameState?.actionMode,
    message: gameState?.message ?? 'Menunggu permainan dimulai...',
    selection: gameState?.selection ?? EMPTY_SELECTION,
    roundResult: gameState?.roundResult,
    derived,
    actions: {
      changeActionMode,
      handleSelectMarketCard,
      handleSelectHandCard,
      performSellGoods,
      performTakeCamels,
      startRound
    }
  };
}
