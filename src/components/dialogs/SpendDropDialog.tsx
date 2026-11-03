'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { amountNumber, money, moneyShort } from '@/lib/money/format';
import { changeFor, sum } from '@/lib/money/math';
import { DEFAULT_JOKE, JOKES, placeName } from '@/model/defaults';
import { billsIn, coinsIn, sourceLocation } from '@/model/ops';
import { $spendDraft, draftCancelled, draftChanged, draftConfirmed, draftTopUp, toastShown } from '@/model/ui';
import { $denoms, $wallet } from '@/model/wallet';
import { BillImg, CoinFace } from '@/components/money/BillImg';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { play } from '@/sound/sfx';
import { tr } from '@/lib/i18n';

/** Opens after a bill or coin is dropped into "Потрачено". */
export function SpendDropDialog() {
  const open = useUnit($spendDraft) !== null;
  return open ? <SpendDropForm /> : null;
}

/** You type how much it was; the change is worked out from the money you dropped. */
function SpendDropForm() {
  const [draft, w, denoms] = useUnit([$spendDraft, $wallet, $denoms]);
  const [text, setText] = useState('');
  if (!draft) return null;

  const allMoney = [...w.bills, ...w.coins];
  const paidItems = draft.billIds.map(id => allMoney.find(b => b.id === id)).filter(b => !!b);
  const paid = sum(paidItems.map(b => b.value));
  const typed = Math.round(amountNumber(text) * 100);
  const spent = Number.isFinite(typed) && typed > 0 ? typed : 0;
  const lacks = spent - paid;
  const change = spent > 0 && lacks < 0 ? changeFor(-lacks, denoms) : [];
  // Kopecks there is no coin for can't come back as change.
  const odd = spent > 0 && lacks < 0 && sum(change) !== -lacks;
  const ok = spent > 0 && lacks <= 0 && !odd;
  const sourceName = placeName(draft.source, w.categories);
  const backTo = draft.source === 'pile' ? tr.common.walletTo : sourceName;
  const here = sourceLocation(draft.source);
  const rest = [...billsIn(w, here), ...coinsIn(w, here)].filter(b => !draft.billIds.includes(b.id));
  const topUps = [...new Set(rest.map(b => b.value))].sort((a, b) => a - b);
  const back = change.filter(v => v >= denoms.bills[0]);
  const coins = sum(change.filter(v => v < denoms.bills[0]));

  let summary: string;
  if (!spent) summary = tr.spendDrop.enter;
  else if (lacks > 0) summary = rest.length ? tr.spendDrop.short(money(lacks)) : tr.spendDrop.noMore(money(lacks));
  else if (odd) summary = tr.spendDrop.odd;
  else {
    summary = tr.spendDrop.spent(money(spent));
    if (!change.length) summary += tr.spendDrop.noChange;
    else {
      if (back.length) summary += tr.spendDrop.back(back.map(moneyShort).join(' + '), backTo);
      if (coins) summary += tr.spendDrop.coins(money(coins));
    }
  }

  const confirm = () => {
    if (!ok) return;
    toastShown(tr.spendDrop.toast(money(spent)) + (back.length ? tr.spendDrop.toastBack(back.map(moneyShort).join(' + ')) : '') + (coins ? tr.spendDrop.toastCoins(money(coins)) : ''));
    play('till');
    draftChanged({ change });
    draftConfirmed();
  };

  const cancel = () => {
    toastShown(tr.spendDrop.returned);
    play('rustle');
    draftCancelled();
  };

  return (
    <Modal open onClose={cancel} title={tr.spendDrop.title} width={620}>
      <div className="flex items-center gap-4">
        <div className="shrink-0 -rotate-6">{paidItems[0] && (paidItems[0].value < denoms.bills[0] ? <CoinFace value={paidItems[0].value} size={56} /> : <BillImg value={paidItems[0].value} />)}</div>
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="text-[26px] leading-[1.1] font-bold tracking-[-0.025em]">{JOKES[draft.source] ?? DEFAULT_JOKE}</span>
          <span className="text-sm text-ink2">{tr.spendDrop.from(sourceName, `${paidItems.map(b => moneyShort(b.value)).join(' + ')}`)}</span>
        </div>
      </div>

      <label className="flex flex-col gap-2 text-sm text-ink2">
        {tr.spendDrop.howMuch}
        <span className="flex h-[60px] items-center gap-2 rounded-[16px] border border-line bg-field px-4">
          <input
            autoFocus
            value={text}
            inputMode="decimal"
            placeholder={tr.common.amountPlaceholder}
            onChange={e => setText(e.target.value.replace(/[^\d.,]/g, '').slice(0, 10))}
            onKeyDown={e => e.key === 'Enter' && confirm()}
            className="w-full min-w-0 bg-transparent text-[28px] font-bold tracking-[-0.02em] text-ink"
          />
        </span>
      </label>

      {lacks > 0 && topUps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-ink2">
          <span>{tr.spendDrop.topUp}</span>
          {topUps.map(v => (
            <Button
              key={v}
              variant="secondary"
              className="!h-[34px] !px-3.5 border border-line"
              onClick={() => {
                const b = rest.find(x => x.value === v);
                if (b) {
                  draftTopUp(b.id);
                  play(v < denoms.bills[0] ? 'clink' : 'rustle');
                }
              }}
            >
              +{moneyShort(v)}
            </Button>
          ))}
        </div>
      )}

      <div className="rounded-[14px] bg-field px-4 py-3.5 text-[15px] leading-[1.55]" style={{ color: lacks > 0 || odd ? 'var(--danger)' : 'var(--ink2)' }}>
        {summary}
      </div>

      {draft.showNote ? (
        <input
          autoFocus
          value={draft.note}
          onChange={e => draftChanged({ note: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && confirm()}
          placeholder={tr.common.notePlaceholder}
          className="h-[46px] rounded-[14px] border border-line bg-field px-4 text-[15px] text-ink"
        />
      ) : (
        <Button variant="link" className="self-start" onClick={() => draftChanged({ showNote: true })}>
          {tr.common.addNote}
        </Button>
      )}

      <div className="flex justify-end gap-2.5">
        <Button variant="outline" size="lg" onClick={cancel}>
          {tr.spendDrop.undo}
        </Button>
        <Button variant="primary" size="lg" disabled={!ok} onClick={confirm}>
          {ok ? tr.spendDrop.doneSum(money(spent)) : tr.spendDrop.done}
        </Button>
      </div>
    </Modal>
  );
}
