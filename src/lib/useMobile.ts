import { useSyncExternalStore } from 'react';

/** Narrower than this, the scaled-down desktop wall gets too small to touch: the phone layout takes over. */
const MOBILE_QUERY = '(max-width: 720px)';

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

export const useMobile = () => useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches, () => false);
