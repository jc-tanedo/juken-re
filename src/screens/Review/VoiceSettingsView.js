import React from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import List from 'src/components/List/ListWrapper';
import ListItem from 'src/components/List/ListItem';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

function itemPosition(index, count) {
  if (count <= 1) return 'single';
  if (index === 0) return 'first';
  if (index === count - 1) return 'last';
  return 'middle';
}

function segmentShape(index, count) {
  if (count <= 1) return { borderRadius: theme.shape.full };
  if (index === 0) {
    return {
      borderTopLeftRadius: theme.shape.full,
      borderBottomLeftRadius: theme.shape.full,
      borderTopRightRadius: theme.shape.extraSmall,
      borderBottomRightRadius: theme.shape.extraSmall,
    };
  }
  if (index === count - 1) {
    return {
      borderTopLeftRadius: theme.shape.extraSmall,
      borderBottomLeftRadius: theme.shape.extraSmall,
      borderTopRightRadius: theme.shape.full,
      borderBottomRightRadius: theme.shape.full,
    };
  }
  return { borderRadius: theme.shape.extraSmall };
}

const VoiceSettingsView = ({ speechSettings }) => {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = theme[scheme];
  const inactiveBg = dark ? colors.surfaceContainerLow : colors.surfaceContainerLowest;
  const {
    providers,
    activeProviderId,
    activeStrategy,
    strategies,
    selectProvider,
    selectStrategy,
    models,
    strategyDescription,
  } = speechSettings;

  const isOffline = activeProviderId !== 'android';

  return (
    <View>
      {/* Speech engine */}
      <List title="Speech engine">
        {providers.map((provider, index) => {
          const isSelected = provider.id === activeProviderId;
          return (
            <ListItem
              key={provider.id}
              position={itemPosition(index, providers.length)}
              title={provider.label}
              subtitle={provider.description}
              iconTone={isSelected ? 'primary' : 'neutral'}
              leftIcon={
                <MaterialIcons
                  name={provider.icon}
                  size={20}
                  color={isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                />
              }
              selected={isSelected}
              onPress={() => selectProvider(provider.id)}
            />
          );
        })}
      </List>

      {/* Progressive disclosure: only show listening mode & offline packs when an offline engine is chosen */}
      {isOffline && (
        <>
          <List title="Listening mode">
            <View style={styles.segmentedRow}>
              {strategies.map((strategy, index) => {
                const active = strategy.id === activeStrategy;
                return (
                  <Pressable
                    key={strategy.id}
                    accessibilityRole="radio"
                    accessibilityLabel={strategy.label}
                    accessibilityState={{ selected: active }}
                    android_ripple={{ color: colors.ripple }}
                    onPress={() => selectStrategy(strategy.id)}
                    style={({ pressed }) => [
                      styles.segment,
                      segmentShape(index, strategies.length),
                      {
                        backgroundColor: active
                          ? colors.primaryContainer
                          : pressed
                            ? colors.surfaceContainer
                            : inactiveBg,
                        borderColor: active ? colors.primaryContainer : colors.outlineVariant,
                      },
                    ]}
                  >
                    {active && (
                      <MaterialIcons name="check" size={16} color={colors.onPrimaryContainer} />
                    )}
                    <Text
                      numberOfLines={1}
                      style={[
                        theme.type.labelLarge,
                        { color: active ? colors.onPrimaryContainer : colors.onSurfaceVariant },
                      ]}
                    >
                      {strategy.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[theme.type.bodySmall, styles.caption, { color: colors.onSurfaceVariant }]}>
              {strategyDescription}
            </Text>
          </List>

          <List title="Offline models">
            {models.map((model, index) => (
              <ListItem
                key={model.id}
                position={itemPosition(index, models.length)}
                title={model.title}
                subtitle={
                  model.installed
                    ? 'Ready on this device'
                    : model.loading
                      ? 'Downloading and verifying…'
                      : `Download · ${model.size}`
                }
                iconTone={model.installed ? 'success' : 'primary'}
                leftIcon={
                  <MaterialIcons
                    name={model.installed ? 'check-circle' : 'download'}
                    size={20}
                    color={model.installed ? colors.onSuccessContainer : colors.onPrimaryContainer}
                  />
                }
                badge={
                  model.installed
                    ? { label: 'Ready', tone: 'success' }
                    : model.optional && !model.loading
                      ? { label: 'Optional', tone: 'neutral' }
                      : null
                }
                loading={model.loading}
                onPress={model.install}
              />
            ))}
          </List>

          <View style={[styles.callout, { backgroundColor: colors.surfaceContainer }]}>
            <MaterialIcons name="verified-user" size={20} color={colors.primary} style={styles.calloutIcon} />
            <Text style={[theme.type.bodySmall, styles.calloutText, { color: colors.onSurfaceVariant }]}>
              Offline speech packs run locally on your device and are verified with SHA-256 checksums before installation.
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

VoiceSettingsView.propTypes = {
  speechSettings: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  segmentedRow: {
    flexDirection: 'row',
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  caption: {
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  callout: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: theme.shape.largeIncreased,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  calloutIcon: {
    marginTop: 1,
  },
  calloutText: {
    flex: 1,
  },
});

export default VoiceSettingsView;
