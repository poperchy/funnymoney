// What happens when money lands somewhere on the phone: by drag or from the cell sheet. Same texts as the desktop scene.
import { CURRENCIES } from '@/lib/money/currency';
import { moneyShort } from '@/lib/money/format';
import { draftStarted, toastShown } from '@/model/ui';
import { $wallet, billMoved, coinMoved } from '@/model/wallet';
import { coinLocation, slotKey, type BillLocation, type Pose } from '@/model/types';
import { play } from '@/sound/sfx';

export type Item = { kind: 'bill' | 'coin'; id: string; value: number; from: BillLocation };

/** Drop zones are marked with `data-drop`: a cell id, 'pile', 'spent' or 'piggy'. */
export type DropKey = string;

const locOf = (key: DropKey): BillLocation | null =>
  key === 'pile' ? { type: 'pile' } : key === 'piggy' ? { type: 'piggy' } : key === 'spent' ? null : { type: 'cell', cellId: key };

const placeName = (key: string) =>
  key === 'pile' ? 'кошелька' : '«' + ($wallet.getState().categories.find(c => c.id === key)?.name ?? '') + '»';

export function itemOf(id: string): Item | null {
  const w = $wallet.getState();
  const b = w.bills.find(x => x.id === id);
  if (b) return { kind: 'bill', id, value: b.value, from: b.location };
  const c = w.coins.find(x => x.id === id);
  return c ? { kind: 'coin', id, value: c.value, from: coinLocation(c) } : null;
}

/** Returns false when nothing happened (dropped back where it was, or the till refused a coin). */
export function dropItem(item: Item, to: DropKey, pose?: Pose): boolean {
  const from = slotKey(item.from);
  const sym = CURRENCIES[$wallet.getState().currency].symbol;
  if (item.kind === 'coin') {
    if (to === 'spent') {
      toastShown('Касса берёт только купюры. Мелочь — в ячейку или свинке');
      return false;
    }
    if (to === from) return false;
    coinMoved({ id: item.id, to: locOf(to)! });
    if (to === 'piggy') {
      toastShown('Мелочь в свинку: +' + moneyShort(item.value) + '. Хрю');
      play('oink', 0.35);
    } else play('clink');
    return true;
  }
  if (to === 'spent') {
    draftStarted({ billId: item.id, from: item.from });
    play('till');
    return true;
  }
  if (to === 'piggy') {
    billMoved({ id: item.id, to: { type: 'piggy' } });
    toastShown('Свинка довольна: +' + moneyShort(item.value) + '. Хрю');
    play('oink', 0.3);
    return true;
  }
  if (to === from && (to === 'pile' || !pose)) return false;
  billMoved({ id: item.id, to: locOf(to)!, pose });
  play('rustle');
  if (to !== from)
    toastShown(
      to === 'pile'
        ? 'Вернул в кошелёк. Подумаем ещё'
        : `Переезд: ${moneyShort(item.value)} ${sym} из ${placeName(from)} в ${placeName(to)}. Прошёл успешно`,
    );
  return true;
}
