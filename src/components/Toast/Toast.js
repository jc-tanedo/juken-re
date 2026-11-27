import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import Toast, { DURATION as _DURATION } from 'src/tp/react-native-easy-toast';
import device from 'src/utils/device';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import {
  APPRENTICE,
  BURNED,
  ENLIGHTENED,
  GURU,
  MASTER,
} from 'src/common/constants';

export const DURATION = _DURATION;
export const TYPES = {
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
};

const ToastComponent = React.forwardRef(({
  type,
  style,
  styleText,
  position,
}, ref) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const srs = theme.srsColors[scheme][type];

  let backgroundColor = colors.inverseSurface;
  let textColor = colors.inverseOnSurface;

  if (type === TYPES.ERROR) {
    backgroundColor = colors.errorContainer;
    textColor = colors.onErrorContainer;
  } else if (type === TYPES.SUCCESS) {
    backgroundColor = colors.successContainer;
    textColor = colors.onSuccessContainer;
  } else if (type === TYPES.WARNING) {
    backgroundColor = colors.warningContainer;
    textColor = colors.onWarningContainer;
  } else if (srs) {
    backgroundColor = srs.container;
    textColor = srs.foreground;
  }

  return (
    <Toast
      ref={ref}
      position={position}
      textStyle={[
        styles.styleText,
        { color: textColor },
        styleText,
      ]}
      style={[
        styles.wrapper,
        { backgroundColor },
        theme.elevation.level2,
        position === 'top' && styles.webTop,
        position !== 'top' && styles.webBottom,
        style,
      ].filter(Boolean)}
    />
  );
});

ToastComponent.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  styleText: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  position: PropTypes.string,
  type: PropTypes.oneOf([
    TYPES.ERROR,
    TYPES.SUCCESS,
    TYPES.WARNING,
    APPRENTICE,
    GURU,
    MASTER,
    ENLIGHTENED,
    BURNED,
  ]),
};

const styles = StyleSheet.create({
  wrapper: device({
    base: {
      borderRadius: theme.shape.medium,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    web: {
      position: 'fixed',
      userSelect: 'none',
    },
  }),
  webTop: device({
    web: { top: '18%' },
  }),
  webBottom: device({
    web: { bottom: '8%' },
  }),
  styleText: device({
    base: {
      ...theme.type.labelLarge,
    },
    web: {
      userSelect: 'none',
    },
  }),
});

export default ToastComponent;
