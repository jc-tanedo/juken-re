import { useEffect, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';

const getFoldModule = () => requireOptionalNativeModule('JukenFold');

export const EMPTY_FOLD_STATE = Object.freeze({
  hasFold: false,
  state: 'none',
  orientation: 'none',
  isSeparating: false,
  occlusionType: 'none',
  hingeBounds: null,
});

/**
 * Observes Android Jetpack WindowManager FoldingFeature posture and hinge bounds
 * when compiled with JukenFold; returns a flat non-folding fallback elsewhere.
 */
export default function useFoldState() {
  const [foldState, setFoldState] = useState(() => getFoldModule()?.getFoldState?.() || EMPTY_FOLD_STATE);

  useEffect(() => {
    const native = getFoldModule();
    if (!native) return undefined;
    const initial = native.getFoldState?.();
    if (initial) setFoldState(initial);

    const subscription = native.addListener?.('foldChange', next => {
      setFoldState(next || EMPTY_FOLD_STATE);
    });

    return () => {
      subscription?.remove?.();
    };
  }, []);

  return foldState;
}
