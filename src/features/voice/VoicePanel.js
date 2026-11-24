import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Button from 'src/components/Button/Button';
import theme from 'src/common/theme';
import { correctionMs } from './VoiceSession';

export default function VoicePanel({ state, session, colors }) {
  const progress = useRef(new Animated.Value(1)).current;
  const { phase, message } = state;
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

  const icon = { correct: 'check-circle', answer: 'x-circle', correction: 'help-circle', manual: 'info' }[phase] || 'mic';
  const retry = phase === 'correction';
  return (
    <View style={[styles.panel, { backgroundColor: colors.surfaceContainerHigh }]}>
      <View style={styles.status} accessibilityLiveRegion="polite">
        <Feather name={icon} size={22} color={phase === 'answer' ? colors.error : colors.primary} />
        <Text style={[theme.type.body, styles.message, { color: colors.onSurface }]}>{message}</Text>
      </View>
      <View style={styles.actions}>
        <Button text="Stop voice mode" variant="text" style={styles.action} onPress={() => session.stop()}
          iconLeft={<Feather name="square" size={16} color={colors.primary} />} />
        {(retry || phase === 'listening') && (
          <Button text={retry ? 'Retry' : 'Pass'} variant={retry ? 'filled' : 'text'} style={styles.action}
            onPress={retry ? () => session.retry() : () => session.pass()} />
        )}
      </View>
      <View style={[styles.track, retry && { backgroundColor: colors.outlineVariant }]}>
        {retry && <Animated.View style={{ height: 3, backgroundColor: colors.primary,
          width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  start: { alignSelf: 'flex-start', width: 'auto', minHeight: 48, marginTop: 8, borderRadius: 32 },
  panel: { width: '100%', flexShrink: 0, marginTop: 8, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, minHeight: 48 },
  message: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  action: { width: 'auto', minHeight: 48, maxWidth: '100%' },
  track: { height: 3, borderRadius: 2, overflow: 'hidden', marginHorizontal: 8 },
});
