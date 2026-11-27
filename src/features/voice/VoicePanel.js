import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Button from 'src/components/Button/Button';
import theme from 'src/common/theme';
import { canPass, correctionMs } from './VoiceSession';

const indicators = {
  listening: ['mic', 'primaryContainer', 'onPrimaryContainer'],
  speaking: ['graphic-eq', 'primary', 'onPrimary'],
  processing: ['hourglass-top', 'secondaryContainer', 'onSecondaryContainer'],
  correct: ['check', 'successContainer', 'onSuccessContainer'],
  correction: ['help-outline', 'tertiaryContainer', 'onTertiaryContainer'],
  answer: ['close', 'errorContainer', 'onErrorContainer'],
  manual: ['info-outline', 'secondaryContainer', 'onSecondaryContainer'],
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
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] }) }],
            },
          ]}
        />
      )}
      <View style={[styles.badge, { backgroundColor: colors[background] }]}>
        <MaterialIcons name={icon} size={22} color={colors[foreground]} />
      </View>
    </View>
  );
}

export default function VoicePanel({ state, session, colors }) {
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
      <Button
        text="Start voice mode"
        variant="tonal"
        onPress={() => session.start()}
        style={styles.start}
        iconLeft={<MaterialIcons name="mic" size={20} color={colors.onSecondaryContainer} />}
      />
    );
  }

  const hasAction = phase === 'correction' || canPass(phase);
  const retry = phase === 'correction';
  return (
    <View style={[styles.panel, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant }]}>
      <View style={[styles.status, { height: statusHeight }]}>
        <MicIndicator phase={phase} colors={colors} />
        <View style={styles.message}>
          <Text
            accessibilityLiveRegion="polite"
            numberOfLines={detail ? 1 : 2}
            style={[theme.type.titleSmall, { color: colors.onSurface }]}
          >
            {message}
          </Text>
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
      <View style={styles.actions}>
        <Button
          text="Stop voice mode"
          variant="text"
          style={styles.action}
          onPress={() => session.stop()}
          iconLeft={<MaterialIcons name="stop" size={18} color={colors.primary} />}
        />
        <View
          style={!hasAction && styles.hidden}
          accessibilityElementsHidden={!hasAction}
          importantForAccessibility={hasAction ? 'auto' : 'no-hide-descendants'}
        >
          <Button
            text={retry || !hasAction ? 'Retry' : 'Pass'}
            variant={retry ? 'filled' : 'tonal'}
            disabled={!hasAction}
            style={styles.action}
            onPress={retry ? () => session.retry() : () => session.pass()}
          />
        </View>
      </View>
      <View style={[styles.track, retry && { backgroundColor: colors.surfaceContainerHighest }]}>
        {retry && (
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  start: { alignSelf: 'center', width: 'auto', minHeight: 48, marginTop: 10 },
  panel: {
    width: '100%',
    flexShrink: 0,
    marginTop: 10,
    borderRadius: theme.shape.extraLarge,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, minHeight: 48 },
  message: { flex: 1, minWidth: 0, gap: 2 },
  indicator: { width: 48, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 38, height: 38, borderRadius: theme.shape.full, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 38, height: 38, borderRadius: theme.shape.full, borderWidth: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  action: { width: 'auto', minHeight: 48, maxWidth: '100%' },
  hidden: { opacity: 0 },
  track: { height: 4, borderRadius: theme.shape.full, overflow: 'hidden', marginHorizontal: 8, marginTop: 4 },
  progressFill: { height: 4, borderRadius: theme.shape.full },
});
