// What happens when a dragged bill or coin lands somewhere on the phone. Same texts as the desktop scene.
import { moneyShort } from '@/lib/money/format';
import { placeName as placeIn } from '@/model/defaults';
import { sheetOpened } from '@/model/mobile';
import { toastShown } from '@/model/ui';
import { $wallet, billMoved, coinMoved } from '@/model/wallet';
import { slotKey, type BillLocation, type Pose } from '@/model/types';
import { play } from '@/sound/sfx';
import { tr } from '@/lib/i18n';

export type Item = { kind: 'bill' | 'coin'; id: string; value: number; from: BillLocation };

/** Drop zones are marked with `data-drop`: a cell id, 'pile', 'spent' or 'piggy'. */
export type DropKey = string;

const locOf = (key: DropKey): BillLocation | null =>
  key === 'pile' ? { type: 'pile' } : key === 'piggy' ? { type: 'piggy' } : key === 'spent' ? null : { type: 'cell', cellId: key };

const placeName = (key: string) => placeIn(key, $wallet.getState().categories);

/** Returns false when nothing happened (dropped back where it was). */
export function dropItem(item: Item, to: DropKey, pose?: Pose): boolean {
  const from = slotKey(item.from);
  if (to === 'spent') {
    // Same as the "Потратить" button: type the amount. The sound and the flight come after it.
    sheetOpened({ type: 'spend', source: from });
    return true;
  }
  if (item.kind === 'coin') {
    if (to === from) return false;
    coinMoved({ id: item.id, to: locOf(to)! });
    if (to === 'piggy') {
      toastShown(tr.toasts.pigFedCoin(moneyShort(item.value)));
      play('oink', 0.35);
    } else play('clink');
    return true;
  }
  if (to === 'piggy') {
    billMoved({ id: item.id, to: { type: 'piggy' } });
    toastShown(tr.toasts.pigFed(moneyShort(item.value)));
    play('oink', 0.3);
    return true;
  }
  if (to === from && (to === 'pile' || !pose)) return false;
  billMoved({ id: item.id, to: locOf(to)!, pose });
  play('rustle');
  if (to !== from)
    toastShown(to === 'pile' ? tr.toasts.backToWallet : tr.toasts.moved(moneyShort(item.value), placeName(from), placeName(to)));
  return true;
}
