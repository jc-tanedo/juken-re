import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { StyleSheet, View, Animated } from "react-native";
import _ from 'lodash';

import theme from 'src/common/theme';
import device from 'src/utils/device';

import useScreenSize from "src/hooks/useScreenSize";
import useEventListener from "src/hooks/useEventListener";
import useOffScreen from "src/components/Deck/useOffScreen";
import useDragRange from "src/components/Deck/useDragRange";
import useMovement from "src/components/Deck/useMovement";
import usePanResponder from "src/components/Deck/usePanResponder";

const friction = 5;
const baseZIndex = 1;
const scaleDecreaseRate = 0.1;
const opacityDecreaseRate = 0.3;
const topGapRate = -6;
const leaveScreenDuration = 400;

const getOpacity = (i) => 1 - opacityDecreaseRate * i;
const getScale = (i) => 1 - scaleDecreaseRate * i;
const getTop = (i) => `${topGapRate * i}%`;

const STAGE_SIZE = 5;
const RENDER_SIZE = 2;

const Deck = ({
  style = {},
  cards = [],
  renderCard,
  dismissCard,
  onReveal,
  onRevealedChange,
  actionsRef,
  swipe,
  interactive = true,
  allowSkipping,
  allowSwipe = true,
}) => {
  
  // dynamic window size
  const { windowWidth, windowHeight } = useScreenSize();

  // deck size
  const [revealed, setRevealed] = useState(false);
  const [mnemonicToggled, setMnemonicToggled] = useState(false);
  const [swipeLock, setSwipeLock] = useState(true);
  const [deckWidth, setDeckWidth] = useState(null);
  const [deckHeight, setDeckHeight] = useState(null);

  const [dismissCount, setDismissCount] = useState(0);

  const topCardId = _.get(cards[0], 'id');
  const prevTopCardId = useRef(topCardId);
  useEffect(() => {
    if (prevTopCardId.current === topCardId) return;
    prevTopCardId.current = topCardId;
    setRevealed(false);
    setMnemonicToggled(false);
    setSwipeLock(!allowSkipping);
  }, [topCardId, allowSkipping]);

  useEffect(() => {
    onRevealedChange?.(revealed);
  }, [revealed, onRevealedChange]);

  // control dismiss of the top card
  const useDismiss = direction => {
    setRevealed(false);
    setMnemonicToggled(false);
    setSwipeLock(!allowSkipping);
    dismissCard(direction);
    setDismissCount(count => count + 1);
  }

  // control reveal of the top card
  const useReveal = () => {
    setRevealed(true);
    setSwipeLock(false);
    onReveal?.(cards[0]);
  }

  const useMnemonicToggle = () => {
    setMnemonicToggled(!mnemonicToggled);
  }

  // calculate coordinates which cards
  // will end up when they go off screen
  const offscreen = useOffScreen({
    deckWidth,
    deckHeight,
    windowWidth,
    windowHeight
  });

  // how far do you have to drag the cards
  // for them to be dismissed
  const dragRange = useDragRange({
    windowWidth,
    windowHeight,
    deckWidth,
    deckHeight,
  });

  // calculate stuff related to movement
  const {
    movement,
    getMovementInterpolation,
    getClearInterpolation,
  } = useMovement({
    topCard: cards[0],
    dismissCount,
    dragRange,
    windowWidth,
    windowHeight,
  });

  // create and configure pan responder
  const {
    panResponder,
    triggerSwipe,
    triggerSwipeLeft,
    triggerSwipeRight,
  } = usePanResponder({
    dismissCard: useDismiss,
    leaveScreenDuration,
    dragRange,
    friction,
    movement,
    offscreen,
  });

  const lastSwipe = useRef(null);
  useEffect(() => {
    // A requeued card gets fresh movement before the next listen is rendered.
    if (!swipe || lastSwipe.current === swipe) return;
    lastSwipe.current = swipe;
    triggerSwipe(swipe.direction, () => {
      swipe.finish();
      setDismissCount(count => count + 1);
    });
  }, [swipe, triggerSwipe]);

  useEffect(() => {
    if (!actionsRef) return undefined;
    actionsRef.current = {
      reveal: useReveal,
      swipeLeft: triggerSwipeLeft,
      swipeRight: triggerSwipeRight,
    };
    return () => {
      actionsRef.current = null;
    };
  });

  // trigger keyboard shortcuts
  useEventListener({
    el: device('web') ? document : null,
    event: 'keydown',
    handler: e => {
      if (!interactive) return;
      if (e.code === 'Space' && !revealed) useReveal();
      if (e.code === 'Space' && revealed) useMnemonicToggle();
      if (!allowSkipping && swipeLock) return;
      if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') triggerSwipeLeft();
      if (e.key === 'ArrowRight' || e.code === 'ArrowRight') triggerSwipeRight();
    }
  }, [
    revealed,
    swipeLock,
    offscreen,
    allowSkipping,
    useReveal,
    triggerSwipeLeft,
    triggerSwipeRight
  ])

  return (
    <View
      style={[styles.wrapper, style]}
      onLayout={(e) => {
        setDeckWidth(e.nativeEvent.layout.width);
        setDeckHeight(e.nativeEvent.layout.height);
      }}
    >
      {cards.slice(0, STAGE_SIZE).map((card, i) => {
        const isEmpty = i >= RENDER_SIZE;
        const isFirstCard = i === 0;
        const [topCurrent, topNext] = [getTop(i), getTop(i - 1)];
        const [opCurrent, opNext] = [getOpacity(i), getOpacity(i - 1)];
        const [scCurrent, scNext] = [getScale(i), getScale(i - 1)];
        const panHandlers = isFirstCard && allowSwipe && (allowSkipping || !swipeLock) ? panResponder.panHandlers : {};

        const dynamicStyles = {
          zIndex: baseZIndex + (cards.length - i),
          top: getMovementInterpolation('x', [topNext, topCurrent, topNext]),
          opacity: getMovementInterpolation('x', [opNext, opCurrent, opNext]),
          transform: [
            { perspective: 1000 },
            { scale: getMovementInterpolation('x', [scNext, scCurrent, scNext]) },
            isFirstCard && { rotate: getMovementInterpolation('x', ["-20deg", "0deg", "20deg"]) },
            isFirstCard && movement.getTranslateTransform(),
          ].filter(Boolean).flat(),
        };

        return (
          <Animated.View
            key={_.get(card, 'id') || `deck-card-${i}`}
            pointerEvents={interactive && isFirstCard ? "auto" : "none"}
            style={[ styles.card, dynamicStyles ]}
            {...panHandlers}
          >
            {isEmpty
              ? renderCard(null)
              : renderCard(card, {
                isFirstCard,
                getClearInterpolation,
                getMovementInterpolation,
                reveal: useReveal,
                revealed: isFirstCard && revealed,
                toggleMnemonic: useMnemonicToggle,
                mnemonicToggled: isFirstCard && mnemonicToggled,
                swipeLeft: triggerSwipeLeft,
                swipeRight: triggerSwipeRight,
              })}
          </Animated.View>
        );
      })}
    </View>
  );
};

Deck.propTypes = {
  style: PropTypes.any,
  dismissCard: PropTypes.func,
  onReveal: PropTypes.func,
  onRevealedChange: PropTypes.func,
  actionsRef: PropTypes.object,
  allowSwipe: PropTypes.bool,
  cards: PropTypes.array,
  renderCard: PropTypes.func,
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flex: 1,
    borderRadius: theme.radius.card,
    overflow: "hidden",
    ...(device("web") && { touchAction: "pan-y" }),
  },
});

export default Deck;
