import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Button from 'src/components/Button/Button';
import theme from 'src/common/theme';
import { canPass, correctionMs } from './VoiceSession';

const indicators = {
  listening: ['mic', 'primaryContainer', 'onPrimaryContainer'],
  speaking: ['activity', 'primary', 'onPrimary'],
  processing: ['message-circle', 'secondaryContainer', 'onSecondaryContainer'],
  correct: ['check', 'successContainer', 'onSuccessContainer'],
  correction: ['help-circle', 'tertiaryContainer', 'onTertiaryContainer'],
  answer: ['x', 'errorContainer', 'onErrorContainer'],
  manual: ['info', 'secondaryContainer', 'onSecondaryContainer'],
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
      toValue: 1, duration: phase === 'speaking' ? 880 : 1500,
      easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false,
    }));
    animation.start();
    return () => animation.stop();
  }, [phase, listening, reduceMotion, pulse]);

  const [icon, background, foreground] = indicators[phase] || ['mic', 'surfaceContainer', 'onSurfaceVariant'];
  return <View style={styles.indicator} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {listening && !reduceMotion && <Animated.View style={[styles.ring, {
      borderColor: colors.primary, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] }),
      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] }) }],
    }]} />}
    <View style={[styles.badge, { backgroundColor: colors[background] }]}>
      <Feather name={icon} size={21} color={colors[foreground]} />
    </View>
  </View>;
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
    return <Button text="Start voice mode" onPress={() => session.start()}
      style={[styles.start, { backgroundColor: colors.primaryContainer }]} textStyle={{ color: colors.onPrimaryContainer }}
      iconLeft={<Feather name="mic" size={20} color={colors.onPrimaryContainer} />} />;
  }

  const hasAction = phase === 'correction' || canPass(phase);
  const retry = phase === 'correction';
  return (
    <View style={[styles.panel, { backgroundColor: colors.surfaceContainerHigh }]}>
      <View style={[styles.status, { height: statusHeight }]}>
        <MicIndicator phase={phase} colors={colors} />
        <View style={styles.message}>
          <Text accessibilityLiveRegion="polite" numberOfLines={detail ? 1 : 2}
            style={[theme.type.body, styles.title, { color: colors.onSurface }]}>{message}</Text>
          {!!detail && <Text numberOfLines={1} accessibilityLabel={detail}
            style={[theme.type.label, { color: colors.onSurfaceVariant }]}>{detail}</Text>}
        </View>
      </View>
      <View style={styles.actions}>
        <Button text="Stop voice mode" variant="text" style={styles.action} onPress={() => session.stop()}
          iconLeft={<Feather name="square" size={16} color={colors.primary} />} />
        <View style={!hasAction && styles.hidden} accessibilityElementsHidden={!hasAction}
          importantForAccessibility={hasAction ? 'auto' : 'no-hide-descendants'}>
          <Button text={retry || !hasAction ? 'Retry' : 'Pass'} variant={retry ? 'filled' : 'text'}
            disabled={!hasAction} style={styles.action} onPress={retry ? () => session.retry() : () => session.pass()} />
        </View>
      </View>
      <View style={[styles.track, retry && { backgroundColor: colors.outlineVariant }]}>
        {retry && <Animated.View style={{ height: 3, backgroundColor: colors.primary,
          width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  start: { alignSelf: 'center', width: 'auto', minHeight: 48, marginTop: 8, borderRadius: 32 },
  panel: { width: '100%', flexShrink: 0, marginTop: 8, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, minHeight: 48 },
  message: { flex: 1, minWidth: 0 },
  title: { fontWeight: '700' },
  indicator: { width: 48, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  action: { width: 'auto', minHeight: 48, maxWidth: '100%' },
  hidden: { opacity: 0 },
  track: { height: 3, borderRadius: 2, overflow: 'hidden', marginHorizontal: 8 },
});
