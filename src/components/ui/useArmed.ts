import { useEffect, useState } from 'react';

const DISARM_MS = 3000;

/** A button that needs a second press: the first arms it, the second acts. Left alone, it disarms itself. */
export function useArmed(action: () => void) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), DISARM_MS);
    return () => clearTimeout(t);
  }, [armed]);

  const press = () => {
    if (armed) action();
    setArmed(!armed);
  };
  return { armed, press };
}
