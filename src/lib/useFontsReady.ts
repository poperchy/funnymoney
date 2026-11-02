'use client';

import { useEffect, useState } from 'react';

/** Canvas painters read the page font, so wait until it is actually loaded. */
export function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const family = getComputedStyle(document.body).fontFamily;
    Promise.all([document.fonts.load(`700 20px ${family}`), document.fonts.load(`400 16px ${family}`)])
      .catch(() => undefined)
      .then(() => setReady(true));
  }, []);
  return ready;
}
