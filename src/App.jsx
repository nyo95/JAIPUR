import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Market from './components/Market.jsx';
import PlayerArea from './components/PlayerArea.jsx';
import ActionButtons from './components/ActionButtons.jsx';
import ScorePanel from './components/ScorePanel.jsx';
import { ACTION_MODES, useGameEngine } from './hooks/useGameEngine.js';
import { useLobby } from './hooks/useLobby.js';

const App = () => {
  const {
    hydrated,
    phase,
    currentPlayer,
    players,
    market,
    deck,
    tokenStacks,
    actionMode,
    message,
    selection,
    roundResult,
    derived,
    actions
  } = useGameEngine();
  const lobby = useLobby();
  const [nameDraft, setNameDraft] = useState(lobby.name);

  useEffect(() => {
    setNameDraft(lobby.name);
  }, [lobby.name]);

  const selectedHandIds = selection.hand.map(card => card.id);
  const seatLabels = lobby.seatLabels || { 1: 'Pemain 1', 2: 'Pemain 2' };
  const localSeat = lobby.localSeat;
  const seatIsActive = phase === 'playing' && localSeat === currentPlayer;
  const currentSeatLabel = seatLabels[currentPlayer] || `Pemain ${currentPlayer}`;
  const marketDisabled =
    phase !== 'playing' || actionMode !== ACTION_MODES.TAKE_CARD || !seatIsActive;
  const lockReason =
    phase === 'playing' && !seatIsActive ? `Menunggu ${currentSeatLabel}` : null;
  const playerAreaConfig = (seatNumber, position) => ({
    player: players[seatNumber],
    playerName: seatLabels[seatNumber] || `Pemain ${seatNumber}`,
    isActive: currentPlayer === seatNumber && phase === 'playing',
    onCardSelect: actions.handleSelectHandCard,
    selectedCardIds:
      localSeat && localSeat !== seatNumber
        ? []
        : currentPlayer === seatNumber
          ? selectedHandIds
          : [],
    disabled:
      currentPlayer !== seatNumber ||
      phase !== 'playing' ||
      actionMode !== ACTION_MODES.SELL_GOODS ||
      (localSeat && localSeat !== seatNumber),
    position,
    hideHand: Boolean(localSeat && localSeat !== seatNumber),
    variant: !localSeat || localSeat === seatNumber ? 'full' : 'compact'
  });

  useEffect(() => {
    if (
      lobby.match &&
      lobby.match.status === 'active' &&
      lobby.allAck &&
      lobby.allReady &&
      lobby.match.inviter === lobby.clientId &&
      phase !== 'playing'
    ) {
      const startingSeat = lobby.match.firstSeat || 1;
      actions.startRound(startingSeat, seatLabels[startingSeat] || `Pemain ${startingSeat}`);
      lobby.actions.markMatchInGame();
    }
  }, [
    lobby.match,
    lobby.allAck,
    lobby.allReady,
    lobby.clientId,
    lobby.actions,
    actions,
    phase,
    seatLabels
  ]);

  const opponentId = lobby.match?.players?.find(id => id !== lobby.clientId);
  const opponentName =
    opponentId ? lobby.presence?.[opponentId]?.name || 'Lawan' : 'Lawan';

  const OverlayCard = ({ title, children }) => (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-slate-100 shadow-2xl">
        {title && <h2 className="mb-4 text-2xl font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  );

  const overlayContent = (() => {
    if (lobby.loading) {
      return (
        <OverlayCard title="Menghubungkan">
          <p className="text-sm text-slate-300">Memuat data pemain&hellip;</p>
        </OverlayCard>
      );
    }

    if (!lobby.name) {
      return (
        <OverlayCard title="Masukkan Namamu">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!nameDraft.trim()) return;
              lobby.actions.setName(nameDraft.trim());
            }}
          >
            <input
              type="text"
              value={nameDraft}
              onChange={event => setNameDraft(event.target.value)}
              placeholder="Contoh: Rani"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-500 py-3 text-base font-semibold text-white transition hover:bg-emerald-400"
            >
              Masuk
            </button>
          </form>
        </OverlayCard>
      );
    }

    if (!lobby.match) {
      return (
        <OverlayCard title="Cari Lawan">
          <p className="mb-4 text-sm text-slate-300">
            Hai <span className="font-semibold text-white">{lobby.name}</span>! Pilih pemain lain yang sedang online untuk mulai bermain.
          </p>
          <div className="space-y-3">
            {lobby.onlinePlayers.length > 0 ? (
              lobby.onlinePlayers.map(player => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{player.name}</p>
                    <p className="text-xs text-slate-400">Sedang online</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => lobby.actions.invitePlayer(player.id)}
                    className="rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Ajak main
                  </button>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
                Belum ada pemain lain online. Buka tab baru atau ajak teman untuk bergabung.
              </p>
            )}
          </div>
        </OverlayCard>
      );
    }

    if (lobby.match.status === 'pending') {
      if (lobby.match.invitee === lobby.clientId) {
        const inviterName = lobby.presence?.[lobby.match.inviter]?.name || 'Seorang pemain';
        return (
          <OverlayCard title="Undangan Bermain">
            <p className="mb-4 text-sm text-slate-300">{inviterName} mengajak kamu bermain Jaipur.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={lobby.actions.acceptInvite}
                className="flex-1 rounded-2xl bg-emerald-500 py-2 text-white transition hover:bg-emerald-400"
              >
                Terima
              </button>
              <button
                type="button"
                onClick={lobby.actions.declineInvite}
                className="flex-1 rounded-2xl border border-white/20 py-2 text-white transition hover:border-white/40"
              >
                Tolak
              </button>
            </div>
          </OverlayCard>
        );
      }

      const inviteeName = lobby.presence?.[lobby.match.invitee]?.name || 'lawan';
      return (
        <OverlayCard title="Menunggu Konfirmasi">
          <p className="mb-4 text-sm text-slate-300">
            Menunggu {inviteeName} menerima ajakanmu.
          </p>
          <button
            type="button"
            onClick={lobby.actions.declineInvite}
            className="w-full rounded-2xl border border-white/20 py-2 text-white transition hover:border-white/40"
          >
            Batalkan ajakan
          </button>
        </OverlayCard>
      );
    }

    if (lobby.match.status === 'active') {
      if (!lobby.localAck) {
        return (
          <OverlayCard title="Aturan Singkat">
            <ul className="mb-4 list-disc space-y-2 pl-5 text-sm text-slate-200">
              <li>Ambil satu barang dari pasar atau ambil semua unta yang tersedia.</li>
              <li>Jual barang sejenis untuk mendapatkan token poin dan bonus.</li>
              <li>Tumpukan token habis atau dek kartu kosong akan mengakhiri ronde.</li>
              <li>Jumlah poin tertinggi ditambah bonus unta menentukan pemenang.</li>
            </ul>
            <button
              type="button"
              onClick={lobby.actions.acknowledgeInstructions}
              className="w-full rounded-2xl bg-emerald-500 py-2 text-white transition hover:bg-emerald-400"
            >
              Saya mengerti
            </button>
          </OverlayCard>
        );
      }

      if (!lobby.allAck) {
        return (
          <OverlayCard title="Menunggu Lawan">
            <p className="text-sm text-slate-300">
              Menunggu {opponentName} membaca aturan.
            </p>
          </OverlayCard>
        );
      }

      if (!lobby.localReady) {
        return (
          <OverlayCard title="Siap Bermain?">
            <p className="mb-4 text-sm text-slate-300">
              Tekan tombol siap ketika kamu dan lawan sudah memahami aturan.
            </p>
            <button
              type="button"
              onClick={lobby.actions.toggleReady}
              className="w-full rounded-2xl bg-emerald-500 py-2 text-white transition hover:bg-emerald-400"
            >
              Saya siap
            </button>
          </OverlayCard>
        );
      }

      if (!lobby.allReady) {
        return (
          <OverlayCard title="Menunggu Lawan">
            <p className="text-sm text-slate-300">
              Menunggu {opponentName} menekan tombol siap.
            </p>
          </OverlayCard>
        );
      }

      return (
        <OverlayCard title="Menunggu">
          <p className="text-sm text-slate-300">Menunggu permainan dimulai&hellip;</p>
        </OverlayCard>
      );
    }

    if (lobby.match.status === 'inGame' && phase !== 'playing' && phase !== 'roundOver') {
      return (
        <OverlayCard title="Menyiapkan Permainan">
          <p className="text-sm text-slate-300">Mengocok dek dan membagikan kartu&hellip;</p>
        </OverlayCard>
      );
    }

    return null;
  })();

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Memuat sesi permainan&hellip;
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_rgba(2,6,23,1))]" />
        <div className="pointer-events-none absolute inset-y-0 inset-x-32 bg-[radial-gradient(circle,_rgba(236,72,153,0.25),transparent_65%)] blur-[140px]" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:px-8">
          <motion.header
            layout
            className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.65)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-amber-200">Jaipur</p>
                <h1 className="font-display text-4xl font-semibold text-white">Duel Pedagang</h1>
              </div>
              <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-200">
                {phase === 'roundOver' ? 'Ronde Selesai' : `Giliran ${currentSeatLabel}`}
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={message}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 text-lg text-slate-200"
              >
                {message}
              </motion.p>
            </AnimatePresence>

          </motion.header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="space-y-6">
              <PlayerArea {...playerAreaConfig(2, 'top')} />

              <Market
                market={market}
                onCardClick={actions.handleSelectMarketCard}
                selectedCardIndex={selection.marketIndex}
                disabled={marketDisabled}
                camelsInMarket={derived.camelsInMarket}
              />

              {phase === 'playing' && (
                <ActionButtons
                  actionMode={actionMode}
                  onModeChange={actions.changeActionMode}
                  onTakeCamels={actions.performTakeCamels}
                  onConfirmSell={actions.performSellGoods}
                  canTakeCamels={derived.camelsInMarket > 0}
                  canSell={selection.hand.length > 0}
                  selectedCount={selection.hand.length}
                  goodsCount={derived.goodsCount}
                  disabled={!seatIsActive}
                  lockReason={lockReason}
                />
              )}

              <PlayerArea {...playerAreaConfig(1, 'bottom')} />
            </div>

            <ScorePanel
              players={players}
              deckCount={deck.length}
              tokenStacks={tokenStacks}
              emptyStacks={derived.emptyStacks}
              phase={phase}
              roundResult={roundResult}
              onRequestRematch={phase === 'roundOver' ? lobby.actions.requestRematch : undefined}
              playerLabels={seatLabels}
            />
          </div>
        </div>
        {overlayContent}
      </div>
    </div>
  );
};

export default App;
