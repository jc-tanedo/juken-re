import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Button from 'src/components/Button/Button';
import theme from 'src/common/theme';
import { canPass, correctionMs } from './VoiceSession';

const indicators = {
  listening: ['mic', 'primaryContainer', 'onPrimaryContainer'],
  speaking: ['graphic-eq', 'primary', 'onPrimary'],
  processing: ['hourglass-top', 'secondaryContainer', 'onSecondaryContainer'],
  correct: ['check-circle', 'successContainer', 'onSuccessContainer'],
  correction: ['help-outline', 'tertiaryContainer', 'onTertiaryContainer'],
  answer: ['close', 'errorContainer', 'onErrorContainer'],
  manual: ['touch-app', 'secondaryContainer', 'onSecondaryContainer'],
};

const phaseBorders = {
  speaking: 'primary',
  correct: 'success',
  correction: 'tertiary',
  answer: 'error',
};

function MicIndicator({ phase, colors }) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduceMotion(value); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; sub.remove(); };
  }, []);

  const listening = phase === 'listening' || phase === 'speaking';
  useEffect(() => {
    pulse.setValue(0);
    if (!listening || reduceMotion) return;
    const animation = Animated.loop(Animated.timing(pulse, {
      toValue: 1,
      duration: phase === 'speaking' ? 880 : 1500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
      isInteraction: false,
    }));
    animation.start();
    return () => animation.stop();
  }, [phase, listening, reduceMotion, pulse]);

  const [icon, background, foreground] = indicators[phase] || ['mic', 'surfaceContainerHighest', 'onSurfaceVariant'];
  return (
    <View style={styles.indicator} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {listening && !reduceMotion && (
        <Animated.View
          style={[
            styles.ring,
            {
              borderColor: colors.primary,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.badge,
          phase === 'speaking' && styles.badgeSpeaking,
          { backgroundColor: colors[background] },
        ]}
      >
        <MaterialIcons name={icon} size={22} color={colors[foreground]} />
      </View>
    </View>
  );
}

export default function VoicePanel({ state, session, colors, engineLabel, onOpenVoiceSettings }) {
  const { fontScale } = useWindowDimensions();
  const statusHeight = Math.ceil(50 * Math.max(1, fontScale));
  const progress = useRef(new Animated.Value(1)).current;
  const { phase, message, detail } = state;

  useEffect(() => {
    if (phase !== 'correction') return;
    progress.setValue(1);
    const animation = Animated.timing(progress, { toValue: 0, duration: correctionMs, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [phase, progress]);

  if (phase === 'off') {
    return (
      <View
        style={[
          styles.dock,
          { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
          theme.elevation.level1,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start voice mode"
          onPress={() => session.start()}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.22)' }}
          style={({ pressed }) => [
            styles.launchPill,
            { backgroundColor: colors.primary },
            pressed && styles.launchPillPressed,
          ]}
        >
          <View style={[styles.launchIconWell, { backgroundColor: colors.primaryContainer }]}>
            <MaterialIcons name="mic" size={20} color={colors.onPrimaryContainer} />
          </View>
          <View style={styles.launchCopy}>
            <Text numberOfLines={1} style={[theme.type.labelLarge, { color: colors.onPrimary }]}>
              Start voice mode
            </Text>
            {!!engineLabel && (
              <Text numberOfLines={1} style={[theme.type.bodySmall, styles.launchSub, { color: colors.onPrimary }]}>
                {engineLabel} · Tap to speak
              </Text>
            )}
          </View>
          <MaterialIcons name="graphic-eq" size={18} color={colors.onPrimary} style={styles.launchTrailing} />
        </Pressable>

        {!!onOpenVoiceSettings && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice recognition settings"
            onPress={onOpenVoiceSettings}
            android_ripple={{ color: colors.ripple, borderless: true }}
            style={({ pressed }) => [
              styles.settingsButton,
              { backgroundColor: colors.secondaryContainer },
              pressed && styles.settingsButtonPressed,
            ]}
          >
            <MaterialIcons name="tune" size={22} color={colors.onSecondaryContainer} />
          </Pressable>
        )}
      </View>
    );
  }

  const hasAction = phase === 'correction' || canPass(phase);
  const retry = phase === 'correction';
  const borderColor = colors[phaseBorders[phase]] || colors.outlineVariant;

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.surfaceContainerHigh, borderColor },
        theme.elevation.level2,
      ]}
    >
      <View style={[styles.status, { minHeight: statusHeight }]}>
        <MicIndicator phase={phase} colors={colors} />
        <View style={styles.message}>
          <View style={styles.titleRow}>
            <Text
              accessibilityLiveRegion="polite"
              numberOfLines={detail ? 1 : 2}
              style={[theme.type.titleSmall, styles.statusTitle, { color: colors.onSurface }]}
            >
              {message}
            </Text>
            {!!engineLabel && (
              <Text
                numberOfLines={1}
                style={[
                  theme.type.labelSmall,
                  styles.engineChip,
                  { backgroundColor: colors.surfaceContainerHighest, color: colors.onSurfaceVariant },
                ]}
              >
                {engineLabel}
              </Text>
            )}
          </View>
          {!!detail && (
            <Text
              numberOfLines={1}
              accessibilityLabel={detail}
              style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}
            >
              {detail}
            </Text>
          )}
        </View>
      </View>

      {retry && (
        <View style={[styles.track, { backgroundColor: colors.surfaceContainerHighest }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>
      )}

      <View style={styles.actions}>
        <Button
          text="Stop voice mode"
          variant="outlined"
          style={[styles.action, styles.stopAction, { borderColor: colors.outlineVariant }]}
          textStyle={{ color: colors.onSurfaceVariant }}
          onPress={() => session.stop()}
          iconLeft={<MaterialIcons name="stop" size={18} color={colors.onSurfaceVariant} />}
        />
        <View
          style={[styles.actionSlot, !hasAction && styles.hidden]}
          accessibilityElementsHidden={!hasAction}
          importantForAccessibility={hasAction ? 'auto' : 'no-hide-descendants'}
        >
          <Button
            text={retry || !hasAction ? 'Retry' : 'Pass'}
            variant={retry ? 'filled' : 'tonal'}
            disabled={!hasAction}
            style={styles.action}
            iconLeft={retry || !hasAction
              ? <MaterialIcons name="refresh" size={18} color={colors.onPrimary} />
              : <MaterialIcons name="skip-next" size={18} color={colors.onSecondaryContainer} />}
            onPress={retry ? () => session.retry() : () => session.pass()}
          />
        </View>
      </View>
    </View>
  );
}

VoicePanel.propTypes = {
  state: PropTypes.object.isRequired,
  session: PropTypes.object.isRequired,
  colors: PropTypes.object.isRequired,
  engineLabel: PropTypes.string,
  onOpenVoiceSettings: PropTypes.func,
};

const styles = StyleSheet.create({
  dock: {
    width: '100%',
    flexShrink: 0,
    marginTop: 10,
    borderRadius: theme.shape.extraLarge,
    borderWidth: 1,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  launchPill: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    borderRadius: theme.shape.full,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  launchPillPressed: {
    borderRadius: theme.shape.large,
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  launchIconWell: {
    width: 36,
    height: 36,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  launchCopy: {
    flex: 1,
    minWidth: 0,
  },
  launchSub: {
    opacity: 0.86,
  },
  launchTrailing: {
    opacity: 0.85,
    marginRight: 4,
    flexShrink: 0,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  settingsButtonPressed: {
    borderRadius: theme.shape.large,
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  panel: {
    width: '100%',
    flexShrink: 0,
    marginTop: 10,
    borderRadius: theme.shape.extraLarge,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  message: { flex: 1, minWidth: 0, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusTitle: { flex: 1, minWidth: 0 },
  engineChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.shape.full,
    overflow: 'hidden',
    flexShrink: 0,
  },
  indicator: { width: 48, alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 44,
    height: 44,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSpeaking: {
    borderRadius: theme.shape.large,
  },
  ring: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: theme.shape.full,
    borderWidth: 2,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopAction: { flex: 1 },
  actionSlot: { flex: 1 },
  action: { width: '100%', minHeight: 44 },
  hidden: { opacity: 0 },
  track: { height: 4, borderRadius: theme.shape.full, overflow: 'hidden', marginHorizontal: 4 },
  progressFill: { height: 4, borderRadius: theme.shape.full },
});
