import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

export default ({
  leaveScreenDuration,
  dragRange,
  friction,
  movement,
  offscreen,
  dismissCard,
}) => {
  const dismissing = useRef(false);
  const onDismiss = useRef(dismissCard);

  useLayoutEffect(() => {
    onDismiss.current = dismissCard;
  }, [dismissCard]);

  useLayoutEffect(() => {
    dismissing.current = false;
    return () => movement.stopAnimation();
  }, [movement]);

  const triggerSwipe = useCallback((direction, onComplete) => {
    if (dismissing.current) return;
    dismissing.current = true;

    Animated.timing(movement, {
      duration: leaveScreenDuration,
      toValue: { x: offscreen.x[direction], y: offscreen.y },
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) (onComplete || onDismiss.current)(direction);
      else dismissing.current = false;
    });
  }, [movement, leaveScreenDuration, offscreen]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) =>
      !dismissing.current && (Math.abs(dx) >= 30 || Math.abs(dy) >= 30),

    onPanResponderMove: (_, { dx, dy }) => {
      if (!dismissing.current) movement.setValue({ x: dx, y: dy });
    },

    onPanResponderRelease: (_, { dx }) => {
      if (dismissing.current) return;
      if (dx < -dragRange.x) triggerSwipe('left');
      else if (dx > dragRange.x) triggerSwipe('right');
      else {
        Animated.spring(movement, {
          friction,
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    },
  }), [movement, friction, dragRange, triggerSwipe]);

  return {
    triggerSwipe,
    triggerSwipeLeft: () => triggerSwipe('left'),
    triggerSwipeRight: () => triggerSwipe('right'),
    panResponder,
  };
};
