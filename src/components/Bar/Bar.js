import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const Bar = ({ style, values = [], colors = [] }) => {
  const palette = theme[useColorScheme()];

  return (
    <View style={[styles.wrapper, { backgroundColor: palette.surfaceContainerHighest }, style]}>
      {values.map((val, i) => {
        if (!val || val <= 0) return null;
        return (
          <View
            key={`bar-${i}`}
            style={[
              styles.bar,
              {
                width: `${val}%`,
                backgroundColor: colors[i],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

Bar.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  // percent - [20, 80]
  values: PropTypes.array,
  // ['green', 'red']
  colors: PropTypes.array,
};

const styles = StyleSheet.create({
  wrapper: {
    height: 8,
    borderRadius: theme.shape.full,
    overflow: 'hidden',
    width: '100%',
    flexDirection: 'row',
    gap: 3,
  },
  bar: {
    height: '100%',
    borderRadius: theme.shape.full,
    flexShrink: 1,
  },
});

export default Bar;
