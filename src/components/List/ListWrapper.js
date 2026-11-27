import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const ListWrapper = ({ style, title, children }) => {
  const colors = theme[useColorScheme()];

  return (
    <View style={[styles.wrapper, style]}>
      {!!title && (
        <View style={styles.titleWrapper}>
          <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
        </View>
      )}
      <View style={styles.items}>{children}</View>
    </View>
  );
};

ListWrapper.propTypes = {
  children: PropTypes.any,
  title: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 4,
  },
  titleWrapper: {
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  title: {
    ...theme.type.labelLarge,
  },
  items: {
    gap: 2,
  },
});

export default ListWrapper;
