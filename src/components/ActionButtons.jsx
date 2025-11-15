import React from 'react';
import clsx from 'clsx';
import { ACTION_MODES } from '../hooks/useGameEngine.js';

const actions = [
  {
    id: ACTION_MODES.TAKE_CARD,
    title: 'Ambil Barang',
    description: 'Pilih satu kartu barang dari pasar.',
    accent: 'from-cyan-500/20 to-cyan-400/10'
  },
  {
    id: ACTION_MODES.SELL_GOODS,
    title: 'Jual Barang',
    description: 'Pilih barang sejenis di tangan lalu konfirmasi penjualan.',
    accent: 'from-amber-500/20 to-amber-400/10'
  }
];

const ActionButtons = ({
  actionMode,
  onModeChange,
  onTakeCamels,
  onConfirmSell,
  canTakeCamels,
  canSell,
  selectedCount,
  goodsCount = 0,
  disabled = false,
  lockReason = null
}) => {
  const confirmEnabled =
    actionMode === ACTION_MODES.SELL_GOODS && canSell && !disabled && !lockReason;
  return (
    <section className="rounded-3xl border border-white/5 bg-slate-950/40 p-4 text-slate-100 shadow-inner">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
        <p className="uppercase tracking-[0.4em]">Aksi</p>
        <p>{actionMode ? 'Pilih kartu atau tekan konfirmasi.' : 'Tentukan aksi untuk giliranmu.'}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {actions.map((action) => {
          const isActive = actionMode === action.id;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onModeChange?.(action.id)}
              disabled={disabled || Boolean(lockReason)}
              className={clsx(
                'rounded-2xl border border-white/10 bg-gradient-to-br p-4 text-left transition-all hover:-translate-y-1 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300',
                action.accent,
                isActive && 'border-emerald-300 shadow-[0_12px_30px_rgba(16,185,129,0.35)]',
                (disabled || lockReason) && 'cursor-not-allowed opacity-50'
              )}
            >
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                {isActive ? 'Dipilih' : 'Klik untuk memilih'}
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{action.title}</p>
              <p className="mt-2 text-sm text-slate-300">{action.description}</p>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onTakeCamels}
          disabled={disabled || !canTakeCamels || Boolean(lockReason)}
          className={clsx(
            'rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/20 p-4 text-left font-semibold text-amber-100 transition-all hover:-translate-y-1 hover:border-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300',
            (!canTakeCamels || disabled || lockReason) && 'cursor-not-allowed opacity-40'
          )}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-amber-200/80">Sekejap</p>
          <p className="mt-1 text-lg font-semibold">Ambil Semua Unta</p>
          <p className="mt-2 text-sm text-amber-100/80">Ambil seluruh unta di pasar dan isi ulang segera.</p>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-900/40 px-4 py-3 text-sm">
        <div className="space-y-1 text-slate-300">
          {actionMode === ACTION_MODES.SELL_GOODS ? (
            <span>
              Dipilih <span className="font-semibold text-white">{selectedCount}</span> barang
            </span>
          ) : (
            <span>Pilih aksi untuk mengaktifkan interaksi kartu.</span>
          )}
          <p className="text-xs text-slate-500">
            Barang di tangan: <span className="font-semibold text-slate-200">{goodsCount}</span> / batas 7
          </p>
          {lockReason && (
            <p className="text-xs text-rose-300">Terkunci: {lockReason}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onConfirmSell}
          disabled={!confirmEnabled}
          className={clsx(
            'rounded-full px-6 py-2 font-semibold text-white transition-all',
            confirmEnabled
              ? 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_10px_35px_rgba(16,185,129,0.35)]'
              : 'bg-slate-700 text-slate-300'
          )}
        >
          Konfirmasi Penjualan
        </button>
      </div>
    </section>
  );
};

export default ActionButtons;
