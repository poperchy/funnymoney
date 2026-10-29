import { createEvent, createStore } from 'effector';
import { persist } from 'effector-storage/local';

export type SkinKind = 'board' | 'purse';

/** Free skins everyone has; the rest are unlocked by a (test, for now) donation. */
const FREE = ['cork', 'leather'];

export const skinSelected = createEvent<{ kind: SkinKind; id: string }>();
export const skinUnlocked = createEvent<string>();
export const shopToggled = createEvent<boolean>();

export const $skins = createStore<Record<SkinKind, string>>({ board: 'cork', purse: 'leather' }).on(skinSelected, (s, { kind, id }) => ({ ...s, [kind]: id }));
persist({ store: $skins, key: 'nalichka:skins' });

export const $ownedSkins = createStore<string[]>(FREE).on(skinUnlocked, (owned, id) => (owned.includes(id) ? owned : [...owned, id]));
persist({ store: $ownedSkins, key: 'nalichka:owned-skins' });

export const $shopOpen = createStore(false).on(shopToggled, (_, v) => v);
