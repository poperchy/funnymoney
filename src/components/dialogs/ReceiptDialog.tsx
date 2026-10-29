'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { money, moneyShort } from '@/lib/money/format';
import { planReceiptEdit } from '@/model/ops';
import { $editingReceipt, receiptEditOpened, toastShown } from '@/model/ui';
import { $currency, $wallet, receiptDeleted, receiptEdited } from '@/model/wallet';
import type { Receipt } from '@/model/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { play } from '@/sound/sfx';

export function ReceiptDialog() {
  const [id, w] = useUnit([$editingReceipt, $wallet]);
  const r = w.receipts.find(x => x.id === id);
  return r ? <ReceiptForm key={r.id} r={r} /> : null;
}

/** Fixing a mistake in a receipt. Money moves for real, and the preview says exactly how. */
function ReceiptForm({ r }: { r: Receipt }) {
  const [w, cur] = useUnit([$wallet, $currency]);
  const [label, setLabel] = useState(r.label);
  const [amountText, setAmountText] = useState(String(r.amount / 100).replace('.', ','));
  const [source, setSource] = useState(r.source);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const close = () => receiptEditOpened(null);

  const nameOf = (s: string) => (s === 'pile' ? 'Кошелёк' : (w.categories.find(c => c.id === s)?.name ?? 'Удалённая ячейка'));
  const sources = [...w.categories.map(c => c.id), 'pile'];
  if (!sources.includes(r.source)) sources.push(r.source);

  const typed = Math.round(parseFloat(amountText.replace(/\s/g, '').replace(',', '.')) * 100);
  const amount = Number.isFinite(typed) ? typed : 0;
  const edit = { label, amount, source };
  const unchanged = amount === r.amount && source === r.source && label.trim() === r.label;
  const plan = planReceiptEdit(w, r.id, edit);

  let preview: string;
  if (!plan.ok) {
    preview =
      plan.reason === 'no-amount'
        ? 'Потратил ноль? Тогда это не трата, а мечта. Можно просто отменить чек.'
        : `В «${nameOf(plan.source!)}» только ${moneyShort(plan.total!)}, а нужно ещё ${money(plan.need!)}. Перекинь туда купюру или выбери другое место.`;
  } else if (!plan.refund && !plan.charge) {
    preview = label.trim() !== r.label ? 'Деньги не трогаем, только переименуем.' : 'Пока ничего не меняется.';
  } else {
    const parts: string[] = [];
    if (plan.refund) parts.push(`Вернём ${money(plan.refund.amount)} в «${nameOf(plan.refund.source)}»`);
    if (plan.charge) {
      const p = plan.charge.plan;
      let t = `${plan.refund ? 'заплатим' : 'Доберём'} ${money(plan.charge.amount)} из «${nameOf(plan.charge.source)}»: возьмём ${p.taken.map(b => moneyShort(b.value)).join(' + ')}`;
      if (p.back.length) t += `, сдача ${p.back.map(moneyShort).join(' + ')} вернётся`;
      parts.push(t);
    }
    preview = parts.join(', а ') + '.';
  }

  const save = () => {
    if (!plan.ok || unchanged) return;
    receiptEdited({ id: r.id, edit });
    toastShown(plan.refund && !plan.charge ? `Чек поправлен. ${money(plan.refund.amount)} вернулось. Бухгалтерия довольна` : 'Чек поправлен. Бухгалтерия довольна');
    play('rustle');
    close();
  };

  const remove = () => {
    receiptDeleted(r.id);
    toastShown(`Трата отменена: ${money(r.amount)} вернулось в «${nameOf(r.source)}». Как будто и не было`);
    play('flutter');
    close();
  };

  if (confirmDelete) {
    return (
      <Modal open onClose={() => setConfirmDelete(false)} title="Отменить трату" width={460}>
        <span className="text-[26px] leading-tight font-bold tracking-[-0.025em]">Этой траты не было?</span>
        <span className="text-[15px] leading-normal text-ink2">
          {money(r.amount)} {cur.symbol} вернутся в «{nameOf(r.source)}», чек исчезнет. Мы никому не скажем.
        </span>
        <div className="flex justify-end gap-2.5">
          <Button variant="outline" size="lg" onClick={() => setConfirmDelete(false)}>
            Не, была
          </Button>
          <Button variant="primary" size="lg" onClick={remove}>
            Не было, верни деньги
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={close} title="Чек" width={520}>
      <div className="flex flex-col gap-1">
        <span className="text-[26px] font-bold tracking-[-0.025em]">Поправить чек</span>
        <span className="text-sm text-ink2">Ошибся с суммой или местом? Бывает. Деньги переложим сами.</span>
      </div>
      <label className="flex flex-col gap-2 text-sm text-ink2">
        На что
        <input
          value={label}
          maxLength={40}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          className="h-[46px] rounded-[14px] border border-line bg-field px-4 text-[15px] text-ink"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-ink2">
        Сколько на самом деле потратил
        <span className="flex h-[46px] items-center gap-2 rounded-[14px] border border-line bg-field px-4">
          <input
            autoFocus
            value={amountText}
            inputMode="decimal"
            onChange={e => setAmountText(e.target.value.replace(/[^\d.,]/g, ''))}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="w-full bg-transparent text-[15px] font-semibold text-ink"
          />
          <span className="text-[13px]">{cur.symbol}</span>
        </span>
      </label>
      <div className="flex flex-col gap-2 text-sm text-ink2">
        Откуда брал
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
          Этой траты не было
        </Button>
        <Button variant="outline" size="lg" onClick={close}>
          Отмена
        </Button>
        <Button variant="primary" size="lg" disabled={!plan.ok || unchanged} onClick={save}>
          Сохранить
        </Button>
      </div>
    </Modal>
  );
}
