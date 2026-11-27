import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const VacationBanner = ({ startedAt }) => {
  const colors = theme[useColorScheme()];
  if (!startedAt) return null;

  const parsed = new Date(startedAt);
  const formatted = Number.isNaN(parsed.getTime())
    ? String(startedAt).slice(0, 10)
    : parsed.toLocaleDateString();

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.warningContainer, borderColor: colors.outlineVariant },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainerLowest }]}>
        <MaterialIcons name="beach-access" size={20} color={colors.warning} />
      </View>
      <View style={styles.copy}>
        <Text style={[theme.type.titleSmall, { color: colors.onWarningContainer }]}>
          Vacation Mode is active
        </Text>
        <Text style={[theme.type.bodySmall, { color: colors.onWarningContainer }]}>
          {`Started ${formatted}. SRS timers are paused on WaniKani.`}
        </Text>
      </View>
    </View>
  );
};

VacationBanner.propTypes = {
  startedAt: PropTypes.string,
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.shape.largeIncreased,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});

export default VacationBanner;
