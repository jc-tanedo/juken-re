import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

export const DURATION = 300;
export const DURATION_SAFE = DURATION + 100;

const ModalComp = ({
  visible,
  title,
  children,
  close,
  contentStyle,
  closeAnimation = true,
}) => {
  const colors = theme[useColorScheme()];

  if (!closeAnimation && !visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={close} animationType={closeAnimation ? 'fade' : 'none'}>
      <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
        <Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFill} />
        <View style={[styles.panel, { backgroundColor: colors.surfaceContainerHigh }, theme.elevation.level3]}>
          <View style={styles.heading}>
            {title ? (
              <Text accessibilityRole="header" style={[styles.title, { color: colors.onSurface }]}>
                {title}
              </Text>
            ) : (
              <View style={styles.titleSpacer} />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={close}
              android_ripple={{ color: colors.ripple, borderless: true }}
              style={({ pressed }) => [
                styles.close,
                pressed && { backgroundColor: colors.statePressed },
              ]}
            >
              <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <ScrollView style={[styles.contents, contentStyle]}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
};

ModalComp.propTypes = {
  children: PropTypes.any,
  visible: PropTypes.bool,
  title: PropTypes.string,
  close: PropTypes.func,
  contentStyle: PropTypes.any,
  closeAnimation: PropTypes.bool,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '88%',
    borderRadius: theme.shape.extraLarge,
    overflow: 'hidden',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 12,
    paddingVertical: 12,
    gap: 12,
  },
  title: { ...theme.type.titleLarge, flex: 1 },
  titleSpacer: { flex: 1 },
  close: {
    width: 48,
    height: 48,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  contents: { flexGrow: 0, flexShrink: 1 },
});

export default ModalComp;
