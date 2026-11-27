import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import { formatTimeUntil } from 'src/features/reviews/forecast';

const ForecastCard = ({ forecast, loading = false }) => {
  const colors = theme[useColorScheme()];
  if (!forecast && !loading) return null;

  const nextLabel = forecast?.nextReviewAt != null
    ? `${formatTimeUntil(forecast.nextReviewAt)} · +${forecast.nextReviewCount}`
    : 'None within 24h';
  const buckets = (forecast?.buckets || []).slice(0, 6);
  const maxCount = Math.max(1, ...buckets.map(b => b.count));

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="schedule" size={18} color={colors.primary} />
          <Text style={[theme.type.titleSmall, { color: colors.onSurface }]}>
            Review forecast
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[theme.type.labelSmall, { color: colors.onPrimaryContainer }]}>
            {loading ? 'Loading…' : nextLabel}
          </Text>
        </View>
      </View>

      {!loading && buckets.length === 0 && (
        <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>
          No reviews scheduled in the next 24 hours.
        </Text>
      )}

      {buckets.length > 0 && (
        <>
          <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>
            {`${forecast.totalNext24h} review${forecast.totalNext24h === 1 ? '' : 's'} arriving over the next 24 hours`}
          </Text>
          <View style={styles.bars}>
            {buckets.map(bucket => {
              const widthPct = `${Math.max(12, Math.round((bucket.count / maxCount) * 100))}%`;
              return (
                <View key={bucket.hourMs} style={styles.barRow}>
                  <Text style={[theme.type.labelSmall, styles.hourLabel, { color: colors.onSurfaceVariant }]}>
                    {bucket.label}
                  </Text>
                  <View style={[styles.track, { backgroundColor: colors.surfaceContainerHighest }]}>
                    <View style={[styles.fill, { width: widthPct, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[theme.type.labelSmall, styles.countLabel, { color: colors.onSurface }]}>
                    {`+${bucket.count}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

ForecastCard.propTypes = {
  forecast: PropTypes.object,
  loading: PropTypes.bool,
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderRadius: theme.shape.extraLarge,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.shape.full,
  },
  bars: {
    gap: 6,
    marginTop: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hourLabel: {
    width: 44,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: theme.shape.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.shape.full,
  },
  countLabel: {
    width: 34,
    textAlign: 'right',
  },
});

export default ForecastCard;
