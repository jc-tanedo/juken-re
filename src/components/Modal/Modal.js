import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, ScrollView, Pressable, Modal, Text } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
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
      <View style={styles.overlay}>
        <Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFill} />
        <View style={[styles.panel, { backgroundColor: colors.surface }]}>
          <View style={[styles.heading, { backgroundColor: colors.primaryContainer }]}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.onPrimaryContainer }]}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close}
              style={[styles.close, { backgroundColor: colors.surfaceBright }]}>
              <AntDesign name="close" size={20} color={colors.onSurface} />
            </Pressable>
          </View>
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
  closeAnimation: PropTypes.bool,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, .62)',
  },
  panel: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '88%',
    borderRadius: theme.radius.card,
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
  title: { ...theme.type.headline, flex: 1 },
  close: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  contents: { flexGrow: 0, flexShrink: 1 },
});

export default ModalComp;
