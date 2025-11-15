import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createDeck, dealInitialCards } from '../logic/deck.js';
import {
  HAND_LIMIT,
  calculateCamelBonus,
  getCardLabel,
  initializeBonusTokens,
  initializeTokenStacks,
  isRoundOver,
  sellGoods,
  takeCamels,
  takeGoodsCard
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

const STORAGE_KEY = 'jaipur:shared-state';
const CHANNEL_KEY = 'jaipur-shared-channel';
const EMPTY_SELECTION = { hand: [], marketIndex: null };

export function useGameEngine() {
  const [phase, setPhase] = useState('loading'); // loading, preparing, playing, roundOver
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [actionMode, setActionMode] = useState(null);
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [message, setMessage] = useState('Menunggu permainan dimulai...');
  const [deck, setDeck] = useState([]);
  const [market, setMarket] = useState([]);
  const [players, setPlayers] = useState({ 1: defaultPlayer(), 2: defaultPlayer() });
  const [tokenStacks, setTokenStacks] = useState({});
  const [bonusStacks, setBonusStacks] = useState({});
  const [roundResult, setRoundResult] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const applyingRef = useRef(false);
  const channelRef = useRef(null);
  const lastStampRef = useRef(0);

  const startRound = useCallback((startingSeat = 1, seatLabel = `Pemain ${startingSeat}`) => {
    const shuffledDeck = createDeck();
    const setup = dealInitialCards(shuffledDeck);

    setDeck(setup.deck);
    setMarket(setup.market);
    setPlayers({
      1: setup.player1,
      2: setup.player2
    });
    setTokenStacks(initializeTokenStacks());
    setBonusStacks(initializeBonusTokens());
    setCurrentPlayer(startingSeat);
    setActionMode(null);
    setSelection(EMPTY_SELECTION);
    setPhase('playing');
    setRoundResult(null);
    setMessage(`Giliran ${seatLabel}`);
    setHydrated(true);
  }, []);

  const updatePlayer = useCallback((playerId, updater) => {
    setPlayers(prev => ({
      ...prev,
      [playerId]: typeof updater === 'function' ? updater(prev[playerId]) : updater
    }));
  }, []);

  const advanceTurn = useCallback(
    (resultText) => {
      setSelection(EMPTY_SELECTION);
      setActionMode(null);
      setCurrentPlayer(prev => {
        const next = prev === 1 ? 2 : 1;
        setMessage(`${resultText} • Giliran Pemain ${next}`);
        return next;
      });
    },
    []
  );

  const handleSelectMarketCard = useCallback((index) => {
    if (phase !== 'playing' || actionMode !== ACTION_MODES.TAKE_CARD) {
      return;
    }

    setSelection(prev => ({ ...prev, marketIndex: index }));

    const playerData = players[currentPlayer];
    const result = takeGoodsCard(
      index,
      market,
      deck,
      playerData.hand,
      { handLimit: HAND_LIMIT }
    );

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMarket(result.newMarket);
    setDeck(result.newDeck);
    updatePlayer(currentPlayer, prev => ({
      ...prev,
      hand: result.newHand
    }));

    advanceTurn(`Pemain ${currentPlayer} mengambil ${getCardLabel(result.takenCard.type)}`);
  }, [phase, actionMode, players, currentPlayer, market, deck, updatePlayer, advanceTurn]);

  const handleSelectHandCard = useCallback((card) => {
    if (phase !== 'playing' || actionMode !== ACTION_MODES.SELL_GOODS) {
      return;
    }

    setSelection(prev => {
      const exists = prev.hand.find(selected => selected.id === card.id);
      return {
        ...prev,
        hand: exists ? prev.hand.filter(item => item.id !== card.id) : [...prev.hand, card]
      };
    });
  }, [phase, actionMode]);

  const performTakeCamels = useCallback(() => {
    if (phase !== 'playing') return;

    const playerData = players[currentPlayer];
    const result = takeCamels(market, deck, playerData.camelHerd);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMarket(result.newMarket);
    setDeck(result.newDeck);
    updatePlayer(currentPlayer, prev => ({
      ...prev,
      camelHerd: result.newCamelHerd
    }));

    advanceTurn(`Pemain ${currentPlayer} mengambil ${result.takenCamels} unta`);
  }, [phase, players, currentPlayer, market, deck, updatePlayer, advanceTurn]);

  const performSellGoods = useCallback(() => {
    if (phase !== 'playing') return;

    if (!selection.hand.length) {
      setMessage('Pilih minimal satu barang untuk dijual');
      return;
    }

    const result = sellGoods(selection.hand, tokenStacks, bonusStacks);
    if (result.error) {
      setMessage(result.error);
      return;
    }

    const soldType = selection.hand[0].type;
    const soldCount = selection.hand.length;

    updatePlayer(currentPlayer, prev => {
      const remainingHand = prev.hand.filter(
        card => !selection.hand.some(selected => selected.id === card.id)
      );
      return {
        ...prev,
        hand: remainingHand,
        tokens: [
          ...prev.tokens,
          ...result.tokenValues.map(value => ({ type: soldType, value })),
          ...result.bonusTokens
        ],
        score: prev.score + result.score
      };
    });

    setTokenStacks(result.newTokenStacks);
    setBonusStacks(result.newBonusStacks);
    setSelection(EMPTY_SELECTION);
    setActionMode(null);
    advanceTurn(
      `Pemain ${currentPlayer} menjual ${soldCount} ${getCardLabel(soldType)} senilai ${result.score} poin`
    );
  }, [phase, selection, tokenStacks, bonusStacks, updatePlayer, currentPlayer, advanceTurn]);

  const changeActionMode = useCallback((mode) => {
    if (phase !== 'playing') return;
    setActionMode(prev => (prev === mode ? null : mode));
    setSelection(EMPTY_SELECTION);
  }, [phase]);

  const finalizeRound = useCallback(() => {
    setPhase('roundOver');
    setActionMode(null);
    setSelection(EMPTY_SELECTION);
    setPlayers(prev => {
      const camelBonus = calculateCamelBonus(prev[1].camelHerd, prev[2].camelHerd);
      const finalScores = {
        1: prev[1].score + camelBonus.player1,
        2: prev[2].score + camelBonus.player2
      };
      const winner =
        finalScores[1] === finalScores[2]
          ? 'tie'
          : finalScores[1] > finalScores[2]
            ? 1
            : 2;

      setRoundResult({ camelBonus, finalScores, winner });
      setMessage(
        winner === 'tie'
          ? 'Ronde selesai • Hasil seri!'
          : `Ronde selesai • Pemain ${winner} menang!`
      );

      return {
        1: { ...prev[1], score: finalScores[1] },
        2: { ...prev[2], score: finalScores[2] }
      };
    });
  }, []);

  useEffect(() => {
    if (phase === 'playing' && isRoundOver(deck, tokenStacks)) {
      finalizeRound();
    }
  }, [phase, deck, tokenStacks, finalizeRound]);

  const applySnapshot = useCallback((snapshot) => {
    applyingRef.current = true;
    setPhase(snapshot.phase);
    setCurrentPlayer(snapshot.currentPlayer);
    setPlayers(snapshot.players);
    setMarket(snapshot.market);
    setDeck(snapshot.deck);
    setTokenStacks(snapshot.tokenStacks);
    setBonusStacks(snapshot.bonusStacks);
    setActionMode(snapshot.actionMode);
    setMessage(snapshot.message);
    setSelection(snapshot.selection ?? EMPTY_SELECTION);
    setRoundResult(snapshot.roundResult ?? null);
    applyingRef.current = false;
    setHydrated(true);
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_KEY);
    channelRef.current = channel;

    const handleIncoming = (payload) => {
      if (!payload || payload.timestamp <= lastStampRef.current) return;
      lastStampRef.current = payload.timestamp;
      applySnapshot(payload);
    };

    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        handleIncoming(payload);
      } catch {
        // ignore malformed payloads
      }
    };

    const handleMessage = (event) => {
      handleIncoming(event.data);
    };

    window.addEventListener('storage', handleStorage);
    channel.addEventListener('message', handleMessage);

    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed) {
          lastStampRef.current = parsed.timestamp ?? Date.now();
          applySnapshot(parsed);
        }
      } catch {
        // ignore malformed cache
      }
    }
    setPhase('loading');
    setHydrated(true);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [applySnapshot]);

  const snapshot = useMemo(
    () => ({
      phase,
      currentPlayer,
      players,
      market,
      deck,
      tokenStacks,
      bonusStacks,
      actionMode,
      message,
      selection,
      roundResult
    }),
    [
      phase,
      currentPlayer,
      players,
      market,
      deck,
      tokenStacks,
      bonusStacks,
      actionMode,
      message,
      selection,
      roundResult
    ]
  );

  useEffect(() => {
    if (!hydrated || applyingRef.current) return;
    const payload = { ...snapshot, timestamp: Date.now() };
    lastStampRef.current = payload.timestamp;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    channelRef.current?.postMessage(payload);
  }, [snapshot, hydrated]);

  const currentPlayerData = players[currentPlayer] ?? defaultPlayer();

  const derived = useMemo(() => {
    const goodsCount = currentPlayerData.hand.filter(card => card.type !== 'camel').length;
    const camelsInMarket = market.filter(card => card.type === 'camel').length;
    const emptyStacks = Object.entries(tokenStacks)
      .filter(([, stack]) => stack.length === 0)
      .map(([type]) => type);

    return {
      goodsCount,
      camelsInMarket,
      emptyStacks
    };
  }, [currentPlayerData, market, tokenStacks]);

  return {
    hydrated,
    phase,
    currentPlayer,
    players,
    market,
    deck,
    tokenStacks,
    bonusStacks,
    actionMode,
    message,
    selection,
    roundResult,
    derived,
    actions: {
      changeActionMode,
      handleSelectMarketCard,
      handleSelectHandCard,
      performSellGoods,
      performTakeCamels,
      startRound,
      setPhase,
      setMessage
    }
  };
}
