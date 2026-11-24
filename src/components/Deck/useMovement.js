import { useMemo, useCallback } from 'react';
import { Animated } from 'react-native';

export default ({ windowWidth, windowHeight, dragRange, topCard, dismissCount }) => {

  // The incoming card starts at rest, even when the last missed card is requeued.
  // Leave the outgoing value offscreen until React commits the new stack.
  const movement = useMemo(() => new Animated.ValueXY(), [topCard, dismissCount]);

  // create interpolation function that returns values for deck
  // based on top cards movement horizontally or vertically
  const getMovementInterpolation = useCallback((axis = 'x', outputRange) => {
    const valMovement = axis === 'x' ? movement.x : movement.y;
    const valRange = axis === 'x' ? windowWidth : windowHeight;
    return valMovement.interpolate({
      outputRange,
      inputRange: [-valRange, 0, valRange],
      extrapolate: 'clamp',
    })
  }, [movement, windowWidth, windowHeight])
  
  // interpolations for how far is the card close
  // to be cleared horizontally or vertically
  const getClearInterpolation = useCallback((axis = 'x', outputRange) => (
    movement.x.interpolate({
      outputRange,
      inputRange: [-dragRange[axis], 0, dragRange[axis]],
      extrapolate: 'clamp',
    })
  ), [movement, dragRange]);

  return {
    movement,
    getMovementInterpolation,
    getClearInterpolation,
  }
}