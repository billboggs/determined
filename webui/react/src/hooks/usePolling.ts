import { useCallback, useEffect, useRef } from 'react';

type PollingFn = (() => Promise<void>) | (() => void);

interface PollingHooks {
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
}

interface PollingOptions {
  interval?: number;
  runImmediately?: boolean;
}

const DEFAULT_OPTIONS: PollingOptions = {
  interval: 5000,
  runImmediately: true,
};

const usePolling = (pollingFn: PollingFn, options: PollingOptions = {}): PollingHooks => {
  const savedPollingFn = useRef<PollingFn>(pollingFn);
  const pollingOptions = useRef<PollingOptions>({ ...DEFAULT_OPTIONS, ...options });
  const timer = useRef<NodeJS.Timeout>();
  const isPolling = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, []);

  const poll = useCallback(() => {
    clearTimer();

    timer.current = setTimeout(async () => {
      await savedPollingFn.current();
      timer.current = undefined;
      if (isPolling.current) poll();
    }, pollingOptions.current.interval) as unknown as NodeJS.Timeout;
  }, [ clearTimer ]);

  const startPolling = useCallback(async () => {
    isPolling.current = true;
    if (pollingOptions.current.runImmediately) await savedPollingFn.current();
    poll();
  }, [ poll ]);

  const stopPolling = useCallback(() => {
    isPolling.current = false;
    clearTimer();
  }, [ clearTimer ]);

  // Update polling function if a new one is passed in.
  useEffect(() => {
    savedPollingFn.current = pollingFn;
  }, [ pollingFn ]);

  // Start polling when mounted and stop polling when umounted.
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [ startPolling, stopPolling ]);

  return { isPolling: isPolling.current, startPolling, stopPolling };
};

export default usePolling;
