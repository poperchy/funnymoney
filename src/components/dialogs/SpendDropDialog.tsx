'use client';

import { useUnit } from 'effector-react';
import { money, moneyShort } from '@/lib/money/format';
import { changeFor, sum } from '@/lib/money/math';
import { DEFAULT_JOKE, JOKES } from '@/model/defaults';
import { billsIn, frequentAmounts, sourceLocation } from '@/model/ops';
import { $spendDraft, draftCancelled, draftChanged, draftConfirmed, draftTopUp, toastShown } from '@/model/ui';
import { $currency, $wallet } from '@/model/wallet';
import { BillImg, CoinFace, CountButton } from '@/components/money/BillImg';
import { Button, Chip } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { play } from '@/sound/sfx';

/** Opens after a bill is dropped into "Потрачено": how much was it, and what change came back. */
export function SpendDropDialog() {
  const [draft, w, cur] = useUnit([$spendDraft, $wallet, $currency]);
  if (!draft) return null;

  const paidBills = draft.billIds.map(id => w.bills.find(b => b.id === id)).filter(b => !!b);
  const paid = sum(paidBills.map(b => b.value));
  const changeSum = sum(draft.change);
  const spent = paid - changeSum;
  const sourceName = draft.source === 'pile' ? 'кошелька' : '«' + (w.categories.find(c => c.id === draft.source)?.name ?? '') + '»';
  const rest = billsIn(w, sourceLocation(draft.source)).filter(b => !draft.billIds.includes(b.id));
  const topUps = [...new Set(rest.map(b => b.value))].sort((a, b) => a - b);
  const quick = [paid, ...frequentAmounts(w).filter(a => a < paid)];
  const changeBills = cur.bills.filter(v => v < paid);
  const changeCoins = cur.coins.slice(-5).reverse();
  const back = draft.change.filter(v => v >= cur.bills[0]);
  const coins = sum(draft.change.filter(v => v < cur.bills[0]));

  const addChange = (v: number) => draftChanged({ change: [...draft.change, v] });
  const removeChange = (v: number) => {
    const i = draft.change.lastIndexOf(v);
    if (i >= 0) draftChanged({ change: draft.change.filter((_, j) => j !== i) });
  };

  let summary: string;
  if (spent <= 0) summary = 'Сдачи больше, чем дал? Так не бывает. Ну или тебе очень повезло';
  else {
    summary = `Потратил ${money(spent)} ${cur.symbol}.`;
    if (!changeSum) summary += ' Без сдачи, чисто.';
    else {
      if (back.length) summary += ` ${back.map(moneyShort).join(' + ')} вернутся в ${sourceName}.`;
      if (coins) summary += ` ${money(coins)} мелочью — свинке.`;
    }
  }

  const confirm = () => {
    if (spent <= 0) return;
    toastShown(
      'Прощай, дружок · −' + money(spent) + (back.length ? ' · сдача ' + back.map(moneyShort).join(' + ') + ' вернулась' : '') + (coins ? ' · ' + money(coins) + ' свинке' : ''),
    );
    play('till');
    draftConfirmed();
  };

  const cancel = () => {
    toastShown('Вернул на место. Мудро');
    play('rustle');
    draftCancelled();
  };

  const changeButton = (v: number, bill: boolean) => (
    <CountButton
      key={(bill ? 'b' : 'c') + v}
      label={(bill ? 'Купюра ' : 'Монета ') + moneyShort(v)}
      count={draft.change.filter(x => x === v).length}
      onAdd={() => addChange(v)}
      onRemove={() => removeChange(v)}
    >
      {bill ? <BillImg value={v} scale={0.8} /> : <CoinFace value={v} />}
    </CountButton>
  );

  return (
    <Modal open onClose={cancel} title="Трата" width={620}>
      <div className="flex items-center gap-4">
        <div className="shrink-0 -rotate-6">{paidBills[0] && <BillImg value={paidBills[0].value} />}</div>
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="text-[26px] leading-[1.1] font-bold tracking-[-0.025em]">{JOKES[draft.source] ?? DEFAULT_JOKE}</span>
          <span className="text-sm text-ink2">
            Из {sourceName}: {paidBills.map(b => moneyShort(b.value)).join(' + ')} {cur.symbol}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm text-ink2">Сколько потратил?</span>
        <div className="flex flex-wrap gap-2">
          {quick.map((a, i) => (
            <Chip key={a} on={spent === a} onClick={() => draftChanged({ change: changeFor(paid - a, cur) })}>
              {i === 0 ? 'Без сдачи · ' + moneyShort(a) : moneyShort(a)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm text-ink2">Или отметь сдачу, которую дали</span>
        <div className="flex flex-wrap items-end gap-3">
          {changeBills.map(v => changeButton(v, true))}
          {changeCoins.map(v => changeButton(v, false))}
        </div>
      </div>

      {topUps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-ink2">
          <span>Не хватило? Докинь отсюда же:</span>
          {topUps.map(v => (
            <Button
              key={v}
              variant="secondary"
              className="!h-[34px] !px-3.5 border border-line"
              onClick={() => {
                const b = rest.find(x => x.value === v);
                if (b) {
                  draftTopUp(b.id);
                  play('rustle');
                }
              }}
            >
              +{moneyShort(v)}
            </Button>
          ))}
        </div>
      )}

      <div className="rounded-[14px] bg-field px-4 py-3.5 text-[15px] leading-[1.55]" style={{ color: spent <= 0 ? 'var(--danger)' : 'var(--ink2)' }}>
        {summary}
      </div>

      {draft.showNote ? (
        <input
          autoFocus
          value={draft.note}
          onChange={e => draftChanged({ note: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && confirm()}
          placeholder="На что, если не секрет"
          className="h-[46px] rounded-[14px] border border-line bg-field px-4 text-[15px] text-ink"
        />
      ) : (
        <Button variant="link" className="self-start" onClick={() => draftChanged({ showNote: true })}>
          + комментарий, если хочется
        </Button>
      )}

      <div className="flex justify-end gap-2.5">
        <Button variant="outline" size="lg" onClick={cancel}>
          Ой, верни обратно
        </Button>
        <Button variant="primary" size="lg" disabled={spent <= 0} onClick={confirm}>
          {spent > 0 ? 'Готово · −' + money(spent) : 'Готово'}
        </Button>
      </div>
    </Modal>
  );
}
