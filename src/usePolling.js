import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/** Runs `fn` immediately and then every `ms` while the screen is focused and `enabled` is true.
 *  `fn` must be memoised with useCallback. */
export function usePolling(fn, ms = 8000, enabled = true) {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      let active = true;
      const tick = () => active && fn();
      tick();
      const id = setInterval(tick, ms);
      return () => { active = false; clearInterval(id); };
    }, [fn, ms, enabled])
  );
}
