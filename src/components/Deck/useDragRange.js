import { useMemo } from 'react';
import device from 'src/utils/device';

export default ({ windowWidth, windowHeight, deckWidth, deckHeight }) => {
  const effectiveWidth = deckWidth || windowWidth;
  const effectiveHeight = deckHeight || windowHeight;
  return useMemo(() => ({
    x: device('mobile') ? Math.min(effectiveWidth / 3, 180) : 180,
    y: device('mobile') ? Math.min(effectiveHeight / 3, 180) : 120,
  }), [effectiveWidth, effectiveHeight]);
};