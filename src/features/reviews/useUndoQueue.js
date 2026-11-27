import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export default function useUndoQueue({ onCommit, onUndoSession, delayMs = 3000 } = {}) {
  const [pendingLabel, setPendingLabel] = useState(null);
  const pendingRef = useRef(null);
  const timerRef = useRef(null);
  const callbacksRef = useRef({ onCommit, onUndoSession });
  callbacksRef.current = { onCommit, onUndoSession };

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    clearTimer();
    const entry = pendingRef.current;
    pendingRef.current = null;
    setPendingLabel(null);
    if (entry && typeof callbacksRef.current.onCommit === 'function') {
      callbacksRef.current.onCommit(entry.payload);
    }
  }, [clearTimer]);

  const enqueue = useCallback((payload, label = 'Review recorded') => {
    flush();
    pendingRef.current = { payload, label };
    setPendingLabel(label);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const entry = pendingRef.current;
      pendingRef.current = null;
      setPendingLabel(null);
      if (entry && typeof callbacksRef.current.onCommit === 'function') {
        callbacksRef.current.onCommit(entry.payload);
      }
    }, delayMs);
  }, [delayMs, flush]);

  const undo = useCallback(() => {
    if (!pendingRef.current) return false;
    clearTimer();
    pendingRef.current = null;
    setPendingLabel(null);
    callbacksRef.current.onUndoSession?.();
    return true;
  }, [clearTimer]);

  useEffect(() => {
    const sub = AppState.addEventListener?.('change', status => {
      if (status !== 'active') flush();
    });
    return () => {
      sub?.remove?.();
      flush();
    };
  }, [flush]);

  return {
    pendingLabel,
    hasPending: Boolean(pendingLabel),
    enqueue,
    undo,
    flush,
  };
}
