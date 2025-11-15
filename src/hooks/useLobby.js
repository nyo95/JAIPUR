import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const CLIENT_ID_KEY = 'jaipur:client-id';
const NAME_KEY = 'jaipur:name';

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const defaultLobbyState = {
  presence: {},
  match: null,
  instructionsAck: {},
  ready: {}
};

export function useLobby() {
  const clientIdRef = useRef(localStorage.getItem(CLIENT_ID_KEY));
  if (!clientIdRef.current) {
    const newId = createId();
    localStorage.setItem(CLIENT_ID_KEY, newId);
    clientIdRef.current = newId;
  }
  const clientId = clientIdRef.current;

  const [name, setNameState] = useState(localStorage.getItem(NAME_KEY) || '');
  const [lobby, setLobby] = useState(defaultLobbyState);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8080`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setLoading(false);
      ws.send(JSON.stringify({ type: 'identify', payload: { clientId, name } }));
    };

    ws.onmessage = event => {
      const { type, payload } = JSON.parse(event.data);
      if (type === 'lobby-state') {
        setLobby(payload);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setLoading(true);
    };

    return () => {
      ws.close();
    };
  }, [clientId, name]);

  const sendMessage = useCallback((type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const setName = useCallback(
    nextName => {
      setNameState(nextName);
      localStorage.setItem(NAME_KEY, nextName);
      sendMessage('update-presence', { name: nextName });
    },
    [sendMessage]
  );

  const invitePlayer = useCallback(
    targetId => {
      sendMessage('invite-player', { targetId });
    },
    [sendMessage]
  );

  const declineInvite = useCallback(() => {
    sendMessage('decline-invite');
  }, [sendMessage]);

  const acceptInvite = useCallback(() => {
    sendMessage('accept-invite');
  }, [sendMessage]);

  const acknowledgeInstructions = useCallback(() => {
    sendMessage('acknowledge-instructions');
  }, [sendMessage]);

  const toggleReady = useCallback(() => {
    sendMessage('toggle-ready');
  }, [sendMessage]);

  const markMatchInGame = useCallback(() => {
    sendMessage('mark-match-in-game');
  }, [sendMessage]);

  const requestRematch = useCallback(() => {
    sendMessage('request-rematch');
  }, [sendMessage]);

  const onlinePlayers = useMemo(() => {
    const entries = Object.values(lobby.presence || {});
    return entries.filter(p => p.id !== clientId);
  }, [lobby.presence, clientId]);

  const matchPlayers = lobby.match?.players ?? [];
  const allAck = matchPlayers.length > 0 && matchPlayers.every(id => lobby.instructionsAck?.[id]);
  const allReady = matchPlayers.length > 0 && matchPlayers.every(id => lobby.ready?.[id]);
  const localAck = !!lobby.instructionsAck?.[clientId];
  const localReady = !!lobby.ready?.[clientId];
  const localSeat = lobby.match?.seats?.[clientId] ?? null;

  const getSeatName = useCallback(
    seat => {
      if (!seat || !lobby.match?.seats) return `Pemain ${seat}`;
      const entryId = Object.entries(lobby.match.seats).find(([, s]) => s === seat)?.[0];
      return lobby.presence?.[entryId]?.name || `Pemain ${seat}`;
    },
    [lobby.match, lobby.presence]
  );

  const seatLabels = useMemo(
    () => ({
      1: getSeatName(1),
      2: getSeatName(2)
    }),
    [getSeatName]
  );

  return {
    loading,
    clientId,
    name,
    presence: lobby.presence,
    onlinePlayers,
    match: lobby.match,
    seatLabels,
    localSeat,
    localAck,
    localReady,
    allAck,
    allReady,
    actions: {
      setName,
      invitePlayer,
      acceptInvite,
      declineInvite,
      acknowledgeInstructions,
      toggleReady,
      markMatchIn-game,
      requestRematch
    }
  };
}
