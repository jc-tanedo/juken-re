import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const Collapsible = ({
  initialCollapsedValue = false,
  title,
  contents,
}) => {
  const [collapsed, setCollapsed] = useState(initialCollapsedValue);
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const surface = scheme === 'dark' ? colors.surfaceContainerLow : colors.surfaceContainerLowest;

  return (
    <View style={[styles.wrapper, { backgroundColor: surface, borderColor: colors.outlineVariant }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        android_ripple={{ color: colors.ripple }}
        onPress={() => setCollapsed(!collapsed)}
        style={styles.header}
      >
        <Text style={[styles.headerText, { color: colors.onSurface }]}>
          {title}
        </Text>
        <MaterialIcons
          name={collapsed ? 'expand-more' : 'expand-less'}
          size={22}
          color={colors.onSurfaceVariant}
        />
      </Pressable>

      {!collapsed && (
        <View style={styles.contents}>
          {contents}
        </View>
      )}
    </View>
  );
};

Collapsible.propTypes = {
  initialCollapsedValue: PropTypes.bool,
  title: PropTypes.string,
  contents: PropTypes.any,
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: theme.shape.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerText: {
    ...theme.type.titleSmall,
  },
  contents: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
});

export default Collapsible;
