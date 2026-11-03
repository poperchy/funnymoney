'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { amountNumber, money, moneyShort } from '@/lib/money/format';
import { catName, DEFAULT_JOKE, JOKES } from '@/model/defaults';
import { frequentAmounts, planSpend, totalIn, sourceLocation } from '@/model/ops';
import { $manualSpendOpen, manualSpendToggled, tillFed, toastShown } from '@/model/ui';
import { $wallet, spent } from '@/model/wallet';
import { Button, Chip } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { play } from '@/sound/sfx';
import { tr } from '@/lib/i18n';

export function ManualSpendDialog() {
  const open = useUnit($manualSpendOpen);
  return open ? <ManualSpendForm /> : null;
}

/** Spending without dragging: pick a cell and an amount, the bills are chosen for you. */
function ManualSpendForm() {
  const w = useUnit($wallet);
  const sources = [...w.categories.map(c => ({ id: c.id, name: catName(c) })), { id: 'pile', name: tr.common.wallet }];
  const firstWithMoney = ['eda', ...sources.map(s => s.id)].find(id => totalIn(w, sourceLocation(id)) > 0) ?? 'eda';
  const [source, setSource] = useState(firstWithMoney);
  const [amount, setAmount] = useState(0);
  const [input, setInput] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const typed = input !== null ? Math.round(amountNumber(input) * 100) : NaN;
  const amt = input !== null ? (Number.isFinite(typed) ? typed : 0) : amount;
  const plan = planSpend(w, source, amt);
  const name = sources.find(s => s.id === source)?.name ?? '';
  const close = () => manualSpendToggled(false);

  let planText: string;
  if (!plan.ok) {
    planText = plan.reason === 'no-amount' ? tr.manualSpend.pickAmount : tr.manualSpend.notEnough(name, moneyShort(plan.total), money(amt - plan.total));
  } else {
    planText = tr.manualSpend.take(plan.taken.map(b => moneyShort(b.value)).join(' + '), name);
    if (plan.paid === amt) planText += tr.manualSpend.noChange;
    else {
      if (plan.back.length) planText += tr.manualSpend.changeBills(plan.back.map(moneyShort).join(' + '));
      const c = plan.coins.reduce((a, b) => a + b, 0);
      if (c) planText += tr.manualSpend.changeCoins(money(c));
    }
  }

  const submit = () => {
    if (!plan.ok) return;
    // The biggest bill or coin handed over is the one the till swallows.
    tillFed(Math.max(...plan.taken.map(b => b.value)));
    spent({ source, billIds: plan.taken.map(b => b.id), change: [...plan.back, ...plan.coins], label: note ?? undefined });
    toastShown((JOKES[source] ?? DEFAULT_JOKE) + ' · −' + money(amt));
    play('till', 0.3);
  };

  return (
    <Modal open onClose={close} title={tr.common.spend}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-[3px]">
          <span className="text-[26px] font-bold tracking-[-0.025em]">{tr.manualSpend.title}</span>
          <span className="text-sm text-ink2">{tr.manualSpend.sub}</span>
        </div>
        <button onClick={close} aria-label={tr.common.close} className="h-11 w-11 shrink-0 rounded-full bg-btn2 text-base">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {sources.map(s => {
          const k = totalIn(w, sourceLocation(s.id));
          const on = s.id === source;
          return (
            <button
              key={s.id}
              disabled={k === 0}
              onClick={() => setSource(s.id)}
              className={`flex min-h-14 flex-col gap-0.5 rounded-[14px] border-2 px-3 py-2 text-left disabled:opacity-40 ${on ? 'border-accent bg-accent-wash' : 'border-line'}`}
            >
              <span className="text-sm font-semibold">{s.name}</span>
              <span className="text-xs text-ink2">{k ? tr.manualSpend.has(moneyShort(k)) : tr.manualSpend.none}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm text-ink2">{tr.manualSpend.howMuch}</span>
        <div className="flex flex-wrap items-center gap-2">
          {frequentAmounts(w).map(a => (
            <Chip
              key={a}
              on={input === null && amount === a}
              className="!h-11 !px-5 !text-base"
              onClick={() => {
                setAmount(a);
                setInput(null);
              }}
            >
              {moneyShort(a)}
            </Chip>
          ))}
          {input === null ? (
            <Button variant="link" onClick={() => setInput('')}>
              {tr.common.typeIt}
            </Button>
          ) : (
            <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-field px-3.5">
              <input
                autoFocus
                value={input}
                inputMode="decimal"
                placeholder={tr.common.amountPlaceholder}
                onChange={e => setInput(e.target.value.replace(/[^\d.,]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && submit()}
                className="w-[90px] bg-transparent text-base font-semibold text-ink"
              />
            </label>
          )}
        </div>
      </div>

      <div className="rounded-[14px] bg-field px-4 py-3.5 text-sm leading-[1.55]" style={{ color: plan.ok || amt <= 0 ? 'var(--ink2)' : 'var(--danger)' }}>
        {planText}
      </div>

      {note === null ? (
        <Button variant="link" className="self-start" onClick={() => setNote('')}>
          {tr.common.addNote}
        </Button>
      ) : (
        <input
          autoFocus
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={tr.common.notePlaceholder}
          className="h-[46px] rounded-[14px] border border-line bg-field px-4 text-[15px] text-ink"
        />
      )}

      <div className="flex justify-end gap-2.5">
        <Button variant="outline" size="lg" onClick={close}>
          {tr.common.changedMind}
        </Button>
        <Button variant="primary" size="lg" disabled={!plan.ok} onClick={submit}>
          {amt > 0 ? tr.manualSpend.spendSum(money(amt)) : tr.common.spend}
        </Button>
      </div>
    </Modal>
  );
}
