'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { amountField, amountNumber, money, moneyShort } from '@/lib/money/format';
import { sourceLabel } from '@/model/defaults';
import { planReceiptEdit } from '@/model/ops';
import { $editingReceipt, receiptEditOpened, toastShown } from '@/model/ui';
import { $wallet, receiptDeleted, receiptEdited } from '@/model/wallet';
import type { Receipt } from '@/model/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { play } from '@/sound/sfx';
import { tr } from '@/lib/i18n';

export function ReceiptDialog() {
  const [id, w] = useUnit([$editingReceipt, $wallet]);
  const r = w.receipts.find(x => x.id === id);
  return r ? <ReceiptForm key={r.id} r={r} /> : null;
}

/** Fixing a mistake in a receipt. Money moves for real, and the preview says exactly how. */
function ReceiptForm({ r }: { r: Receipt }) {
  const w = useUnit($wallet);
  const [label, setLabel] = useState(r.label);
  const [amountText, setAmountText] = useState(amountField(r.amount));
  const [source, setSource] = useState(r.source);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const close = () => receiptEditOpened(null);

  const nameOf = (s: string) => sourceLabel(s, w.categories, tr.common.wallet, tr.common.deletedCell);
  const sources = [...w.categories.map(c => c.id), 'pile'];
  if (!sources.includes(r.source)) sources.push(r.source);

  const typed = Math.round(amountNumber(amountText) * 100);
  const amount = Number.isFinite(typed) ? typed : 0;
  const edit = { label, amount, source };
  const unchanged = amount === r.amount && source === r.source && label.trim() === r.label;
  const plan = planReceiptEdit(w, r.id, edit);

  let preview: string;
  if (!plan.ok) {
    preview = plan.reason === 'no-amount' ? tr.receipt.zero : tr.receipt.short(nameOf(plan.source!), moneyShort(plan.total!), money(plan.need!));
  } else if (!plan.refund && !plan.charge) {
    preview = label.trim() !== r.label ? tr.receipt.renameOnly : tr.receipt.nothing;
  } else {
    const parts: string[] = [];
    if (plan.refund) parts.push(tr.receipt.refund(money(plan.refund.amount), nameOf(plan.refund.source)));
    if (plan.charge) {
      const p = plan.charge.plan;
      const taken = p.taken.map(b => moneyShort(b.value)).join(' + ');
      let t = (plan.refund ? tr.receipt.chargeAfter : tr.receipt.charge)(money(plan.charge.amount), nameOf(plan.charge.source), taken);
      if (p.back.length) t += tr.receipt.chargeBack(p.back.map(moneyShort).join(' + '));
      parts.push(t);
    }
    preview = parts.join(tr.receipt.joinWith) + '.';
  }

  const save = () => {
    if (!plan.ok || unchanged) return;
    receiptEdited({ id: r.id, edit });
    toastShown(plan.refund && !plan.charge ? tr.receipt.fixedRefund(money(plan.refund.amount)) : tr.receipt.fixed);
    play('rustle');
    close();
  };

  const remove = () => {
    receiptDeleted(r.id);
    toastShown(tr.receipt.undone(money(r.amount), nameOf(r.source)));
    play('flutter');
    close();
  };

  if (confirmDelete) {
    return (
      <Modal open onClose={() => setConfirmDelete(false)} title={tr.receipt.deleteTitle} width={460}>
        <span className="text-[26px] leading-tight font-bold tracking-[-0.025em]">{tr.receipt.deleteAsk}</span>
        <span className="text-[15px] leading-normal text-ink2">{tr.receipt.deleteNote(money(r.amount), nameOf(r.source))}</span>
        <div className="flex justify-end gap-2.5">
          <Button variant="outline" size="lg" onClick={() => setConfirmDelete(false)}>
            {tr.receipt.keep}
          </Button>
          <Button variant="primary" size="lg" onClick={remove}>
            {tr.receipt.confirmDelete}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={close} title={tr.receipt.title} width={520}>
      <div className="flex flex-col gap-1">
        <span className="text-[26px] font-bold tracking-[-0.025em]">{tr.receipt.heading}</span>
        <span className="text-sm text-ink2">{tr.receipt.sub}</span>
      </div>
      <label className="flex flex-col gap-2 text-sm text-ink2">
        {tr.receipt.what}
        <input
          value={label}
          maxLength={40}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          className="h-[46px] rounded-[14px] border border-line bg-field px-4 text-[15px] text-ink"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-ink2">
        {tr.receipt.howMuch}
        <span className="flex h-[46px] items-center gap-2 rounded-[14px] border border-line bg-field px-4">
          <input
            autoFocus
            value={amountText}
            inputMode="decimal"
            onChange={e => setAmountText(e.target.value.replace(/[^\d.,]/g, ''))}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="w-full bg-transparent text-[15px] font-semibold text-ink"
          />
        </span>
      </label>
      <div className="flex flex-col gap-2 text-sm text-ink2">
        {tr.receipt.where}
        <div className="flex flex-wrap gap-2">
          {sources.map(s => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`h-9 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold text-ink ${source === s ? 'border-accent bg-accent-wash' : 'border-line'}`}
            >
              {nameOf(s)}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-[14px] bg-field px-4 py-3.5 text-sm leading-[1.55]" style={{ color: plan.ok ? 'var(--ink2)' : 'var(--danger)' }}>
        {preview}
      </div>
      <div className="flex items-center gap-2.5">
        <Button variant="link" className="!text-danger mr-auto" onClick={() => setConfirmDelete(true)}>
          {tr.receipt.neverHappened}
        </Button>
        <Button variant="outline" size="lg" onClick={close}>
          {tr.common.cancel}
        </Button>
        <Button variant="primary" size="lg" disabled={!plan.ok || unchanged} onClick={save}>
          {tr.common.save}
        </Button>
      </div>
    </Modal>
  );
}
