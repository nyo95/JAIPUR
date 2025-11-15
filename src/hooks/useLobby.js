import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const LOBBY_STORAGE_KEY = 'jaipur:lobby';
const LOBBY_CHANNEL = 'jaipur-lobby';
const CLIENT_ID_KEY = 'jaipur:client-id';
const NAME_KEY = 'jaipur:name';
const PRESENCE_TIMEOUT = 15000;

const defaultLobbyState = {
  presence: {},
  match: null,
  instructionsAck: {},
  ready: {},
  timestamp: 0
};

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const cloneState = (state) => JSON.parse(JSON.stringify(state));

export function useLobby() {
  const clientIdRef = useRef(localStorage.getItem(CLIENT_ID_KEY));
  if (!clientIdRef.current) {
    const newId = createId();
    localStorage.setItem(CLIENT_ID_KEY, newId);
    clientIdRef.current = newId;
  }
  const clientId = clientIdRef.current;

  const [name, setNameState] = useState(localStorage.getItem(NAME_KEY) || '');
  const [lobby, setLobby] = useState(() => {
    const cached = localStorage.getItem(LOBBY_STORAGE_KEY);
    return cached ? JSON.parse(cached) : cloneState(defaultLobbyState);
  });
  const [loading, setLoading] = useState(true);
  const lastStampRef = useRef(0);
  const applyingRef = useRef(false);
  const channelRef = useRef(null);

  const applySnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    applyingRef.current = true;
    setLobby(snapshot);
    applyingRef.current = false;
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(LOBBY_CHANNEL);
    channelRef.current = channel;

    const handlePayload = (payload) => {
      if (!payload || payload.timestamp <= lastStampRef.current) return;
      lastStampRef.current = payload.timestamp;
      applySnapshot(payload);
    };

    channel.addEventListener('message', (event) => handlePayload(event.data));

    const cached = localStorage.getItem(LOBBY_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      lastStampRef.current = parsed.timestamp ?? Date.now();
      applySnapshot(parsed);
    }
    setLoading(false);

    return () => {
      channel.close();
    };
  }, [applySnapshot]);

  useEffect(() => {
    if (applyingRef.current) return;
    const payload = { ...lobby, timestamp: Date.now() };
    lastStampRef.current = payload.timestamp;
    localStorage.setItem(LOBBY_STORAGE_KEY, JSON.stringify(payload));
    channelRef.current?.postMessage(payload);
  }, [lobby]);

  useEffect(() => {
    if (!name) return;
    const updatePresence = () => {
      setLobby(prev => {
        const nextPresence = {
          ...prev.presence,
          [clientId]: {
            id: clientId,
            name,
            updatedAt: Date.now()
          }
        };
        return { ...prev, presence: nextPresence };
      });
    };
    updatePresence();
    const interval = setInterval(updatePresence, 5000);
    return () => clearInterval(interval);
  }, [name, clientId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLobby(prev => {
        const now = Date.now();
        const filteredEntries = Object.entries(prev.presence).filter(
          ([, value]) => now - (value.updatedAt || 0) < PRESENCE_TIMEOUT
        );
        const filteredPresence = Object.fromEntries(filteredEntries);
        let nextMatch = prev.match;

        if (nextMatch) {
          const activeIds = nextMatch.players || [];
          const missing = activeIds.some(id => !filteredPresence[id]);
          if (missing) {
            nextMatch = null;
          }
        }

        if (
          filteredEntries.length === Object.keys(prev.presence).length &&
          nextMatch === prev.match
        ) {
          return prev;
        }

        return {
          ...prev,
          presence: filteredPresence,
          match: nextMatch || null,
          instructionsAck: nextMatch ? prev.instructionsAck : {},
          ready: nextMatch ? prev.ready : {}
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const setName = useCallback((nextName) => {
    setNameState(nextName);
    localStorage.setItem(NAME_KEY, nextName);
  }, []);

  const invitePlayer = useCallback((targetId) => {
    if (!name || !targetId) return;
    setLobby(prev => {
      const nextMatch = {
        id: createId(),
        status: 'pending',
        inviter: clientId,
        invitee: targetId,
        players: [clientId, targetId],
        createdAt: Date.now()
      };
      return {
        ...prev,
        match: nextMatch,
        instructionsAck: {},
        ready: {}
      };
    });
  }, [clientId, name]);

  const declineInvite = useCallback(() => {
    setLobby(prev => {
      if (!prev.match) return prev;
      if (prev.match.invitee !== clientId && prev.match.inviter !== clientId) return prev;
      return { ...prev, match: null, instructionsAck: {}, ready: {} };
    });
  }, [clientId]);

  const acceptInvite = useCallback(() => {
    setLobby(prev => {
      if (!prev.match || prev.match.invitee !== clientId) return prev;
      const seatsOrder = Math.random() < 0.5 ? [1, 2] : [2, 1];
      const seats = {
        [prev.match.inviter]: seatsOrder[0],
        [prev.match.invitee]: seatsOrder[1]
      };
      const firstSeat = Math.random() < 0.5 ? 1 : 2;
      return {
        ...prev,
        match: {
          ...prev.match,
          status: 'active',
          seats,
          firstSeat
        },
        instructionsAck: {},
        ready: {}
      };
    });
  }, [clientId]);

  const acknowledgeInstructions = useCallback(() => {
    setLobby(prev => ({
      ...prev,
      instructionsAck: {
        ...prev.instructionsAck,
        [clientId]: true
      }
    }));
  }, [clientId]);

  const toggleReady = useCallback(() => {
    setLobby(prev => ({
      ...prev,
      ready: {
        ...prev.ready,
        [clientId]: !prev.ready?.[clientId]
      }
    }));
  }, [clientId]);

  const markMatchInGame = useCallback(() => {
    setLobby(prev => {
      if (!prev.match) return prev;
      return {
        ...prev,
        match: { ...prev.match, status: 'inGame' }
      };
    });
  }, []);

  const requestRematch = useCallback(() => {
    setLobby(prev => {
      if (!prev.match) return prev;
      const nextFirstSeat = Math.random() < 0.5 ? 1 : 2;
      return {
        ...prev,
        match: { ...prev.match, status: 'active', firstSeat: nextFirstSeat },
        instructionsAck: {},
        ready: {}
      };
    });
  }, []);

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

  const getSeatName = useCallback((seat) => {
    if (!seat || !lobby.match?.seats) return `Pemain ${seat}`;
    const entryId = Object.entries(lobby.match.seats).find(([, s]) => s === seat)?.[0];
    return lobby.presence?.[entryId]?.name || `Pemain ${seat}`;
  }, [lobby.match, lobby.presence]);

  const seatLabels = useMemo(() => ({
    1: getSeatName(1),
    2: getSeatName(2)
  }), [getSeatName]);

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
      markMatchInGame,
      requestRematch
    }
  };
}
