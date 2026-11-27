import React from 'react';
import PropTypes from 'prop-types';
import { Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import device from 'src/utils/device';
import useColorScheme from 'src/hooks/useColorScheme';

const iconSize = 40;

const CardCover = ({ getClearInterpolation }) => {
  const coverOpacity = getClearInterpolation('x', [1, 0, 1]);
  const iconSmileOpacity = getClearInterpolation('x', [0, 0, 1]);
  const iconFrownOpacity = getClearInterpolation('x', [1, 0, 0]);
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const neutral = scheme === 'dark' ? colors.surfaceContainerLow : colors.surfaceContainerLowest;
  const coverBackground = getClearInterpolation('x', [
    colors.errorContainer,
    neutral,
    colors.successContainer,
  ]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          backgroundColor: coverBackground,
          opacity: coverOpacity,
        },
      ]}
    >
      {/* correct icon */}
      <Animated.View style={[styles.icon, styles.iconSmile, { opacity: iconSmileOpacity }]}>
        <MaterialIcons
          name="check-circle-outline"
          size={iconSize}
          color={colors.onSuccessContainer}
        />
      </Animated.View>

      {/* incorrect icon */}
      <Animated.View style={[styles.icon, styles.iconFrown, { opacity: iconFrownOpacity }]}>
        <MaterialIcons
          name="highlight-off"
          size={iconSize}
          color={colors.onErrorContainer}
        />
      </Animated.View>
    </Animated.View>
  );
};

CardCover.propTypes = {
  getClearInterpolation: PropTypes.func,
};

const styles = StyleSheet.create({
  wrapper: device({
    base: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 9,
    },
    web: {
      pointerEvents: 'none',
    },
  }),
  icon: device({
    base: { position: 'absolute' },
    mobile: { top: 20 },
    web: {
      top: '50%',
      left: '50%',
      marginTop: -iconSize / 2,
      marginLeft: -iconSize / 2,
    },
  }),
  iconSmile: device({ mobile: { left: 20 } }),
  iconFrown: device({ mobile: { right: 20 } }),
});

export default CardCover;
