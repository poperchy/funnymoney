import { createEvent, createStore } from 'effector';
import { persist } from 'effector-storage/local';

export type SkinKind = 'board' | 'purse' | 'hat' | 'neck';

/** Free skins everyone has; the rest are unlocked by a (test, for now) donation. */
const FREE = ['cork', 'leather'];

export const skinSelected = createEvent<{ kind: SkinKind; id: string }>();
export const skinUnlocked = createEvent<string>();
export const shopToggled = createEvent<boolean>();

const DEFAULT_SKINS: Record<SkinKind, string> = { board: 'cork', purse: 'leather', hat: 'none', neck: 'none' };
const $savedSkins = createStore<Partial<Record<SkinKind, string>>>(DEFAULT_SKINS).on(skinSelected, (s, { kind, id }) => ({ ...s, [kind]: id }));
persist({ store: $savedSkins, key: 'nalichka:skins' });
/** Older saves don't know about newer kinds of skins, so whatever is missing falls back to the default. */
export const $skins = $savedSkins.map(s => ({ ...DEFAULT_SKINS, ...s }));

export const $ownedSkins = createStore<string[]>(FREE).on(skinUnlocked, (owned, id) => (owned.includes(id) ? owned : [...owned, id]));
persist({ store: $ownedSkins, key: 'nalichka:owned-skins' });

export const $shopOpen = createStore(false).on(shopToggled, (_, v) => v);
