import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const Badge = ({ style, text, textColor, icon }) => {
  const colors = theme[useColorScheme()];
  const hasText = text !== null && text !== undefined && text !== '';
  const hasBoth = !!icon && hasText;

  return (
    <View style={[styles.wrapper, !hasText && styles.iconOnly, { backgroundColor: colors.primaryContainer }, style]}>
      {!!icon && <View style={styles.icon}>{icon}</View>}
      {hasText && (
        <Text style={[styles.text, { color: textColor ?? colors.onPrimaryContainer }, hasBoth && styles.textHasIcon]}>
          {text}
        </Text>
      )}
    </View>
  );
};

Badge.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  icon: PropTypes.any,
  textColor: PropTypes.string,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const styles = StyleSheet.create({
  wrapper: {
    minWidth: 32,
    minHeight: 32,
    borderRadius: theme.shape.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOnly: {
    paddingHorizontal: 8,
  },
  text: {
    ...theme.type.labelMedium,
  },
  textHasIcon: {
    marginLeft: 4,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Badge;
