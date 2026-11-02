'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { money, moneyShort } from '@/lib/money/format';
import { pigGoalProgress } from '@/model/ops';
import { $pigGoalOpen, pigGoalToggled, toastShown } from '@/model/ui';
import { $currency, $wallet, pigGoalSet } from '@/model/wallet';
import type { Wallet } from '@/model/types';
import { Button, Chip } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const NAMES = ['Отпуск', 'Велик', 'Телефон', 'Чёрный день'];
// In BYN kopecks, like the default budgets.
const AMOUNTS_BYN = [50000, 100000, 300000, 500000];

/** What breaking the pig means for the goal: said before the pig is broken. */
export function pigGoalNote(w: Wallet, symbol: string) {
  const goal = pigGoalProgress(w);
  if (!goal) return null;
  return goal.reached
    ? `На «${goal.name}» уже хватает. Разбивай с чистой совестью.`
    : `До цели «${goal.name}» ещё ${money(goal.left)} ${symbol}. Разобьёшь — и копить придётся заново.`;
}

export function PigGoalDialog() {
  const open = useUnit($pigGoalOpen);
  return open ? <GoalForm /> : null;
}

function GoalForm() {
  const [w, cur] = useUnit([$wallet, $currency]);
  const goal = w.pigGoal;
  const [name, setName] = useState(goal?.name ?? '');
  const [amount, setAmount] = useState(goal ? String(goal.amount / 100) : '');
  const typed = Math.round(parseFloat(amount.replace(/\s/g, '').replace(',', '.')) * 100);
  const parsed = Number.isFinite(typed) ? typed : 0;
  const valid = name.trim().length > 0 && parsed > 0;
  // Round sums in a big bill of the currency, so they look round in any of them.
  const step = cur.bills[cur.bills.length - 2];
  const amounts = AMOUNTS_BYN.map(v => Math.max(step, Math.round((v * cur.scale) / step) * step));
  const close = () => pigGoalToggled(false);

  const save = () => {
    if (!valid) return;
    pigGoalSet({ name: name.trim().slice(0, 24), amount: parsed });
    toastShown(`Копим на «${name.trim()}». Хрю, я в деле`);
    close();
  };

  const remove = () => {
    pigGoalSet(null);
    toastShown('Цели больше нет. Буду копить просто так, из любви к искусству');
    close();
  };

  return (
    <Modal open onClose={close} title="Цель копилки" width={480}>
      <div className="flex flex-col gap-1">
        <span className="text-[26px] font-bold tracking-[-0.025em]">На что копим?</span>
        <span className="text-sm text-ink2">Свинка ест охотнее, когда знает зачем</span>
      </div>
      <div className="flex flex-col gap-2 text-sm text-ink2">
        <label className="flex flex-col gap-2">
          Цель
          <input
            value={name}
            maxLength={24}
            placeholder="Например, Велик"
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="h-[46px] rounded-[14px] border border-line bg-field px-4 text-[15px] text-ink"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {NAMES.map(n => (
            <Chip key={n} on={name === n} onClick={() => setName(n)}>
              {n}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm text-ink2">
        <label className="flex flex-col gap-2">
          Сколько нужно
          <span className="flex h-[46px] items-center gap-2 rounded-[14px] border border-line bg-field px-4">
            <input
              value={amount}
              inputMode="decimal"
              placeholder="0"
              onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && save()}
              className="w-full bg-transparent text-[15px] font-semibold text-ink"
            />
            <span className="text-[13px]">{cur.symbol}</span>
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {[...new Set(amounts)].map(a => (
            <Chip key={a} on={parsed === a} onClick={() => setAmount(String(a / 100))}>
              {moneyShort(a)}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {goal && (
          <Button variant="link" className="!text-danger mr-auto" onClick={remove}>
            Убрать цель
          </Button>
        )}
        <div className="ml-auto flex gap-2.5">
          <Button variant="outline" size="lg" onClick={close}>
            Передумал
          </Button>
          <Button variant="primary" size="lg" disabled={!valid} onClick={save}>
            Копим
          </Button>
        </div>
      </div>
    </Modal>
  );
}
