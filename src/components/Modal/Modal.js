import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import useSafeInsets from 'src/hooks/useSafeInsets';
import useLayoutMode from 'src/hooks/useLayoutMode';

const ModalComp = ({
  visible,
  title,
  subtitle,
  children,
  close,
  onBack,
  navigationIcon = 'back',
  presentation = 'dialog',
  contentStyle,
  closeAnimation = true,
}) => {
  const colors = theme[useColorScheme()];
  const insets = useSafeInsets();
  const layout = useLayoutMode();

  if (!closeAnimation && !visible) return null;

  if (presentation === 'page') {
    const handleNav = onBack || close;
    const isBack = navigationIcon === 'back';

    return (
      <Modal
        transparent={false}
        visible={visible}
        onRequestClose={close}
        animationType={closeAnimation ? 'slide' : 'none'}
      >
        <View
          style={[
            styles.pageScreen,
            {
              backgroundColor: colors.surface,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
        >
          <View style={[styles.pageColumn, layout.isWide && styles.pageColumnWide]}>
            <View style={styles.pageTopBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isBack ? 'Back' : 'Close'}
                onPress={handleNav}
                android_ripple={{ color: colors.ripple, borderless: true }}
                style={({ pressed }) => [
                  styles.navButton,
                  pressed && { backgroundColor: colors.statePressed },
                ]}
              >
                <MaterialIcons
                  name={isBack ? 'arrow-back' : 'close'}
                  size={24}
                  color={colors.onSurface}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.pageScroll}
              contentContainerStyle={[styles.pageContent, contentStyle]}
              showsVerticalScrollIndicator={false}
            >
              {(!!title || !!subtitle) && (
                <View style={styles.pageHeader}>
                  {!!title && (
                    <Text accessibilityRole="header" style={[theme.type.headlineLarge, { color: colors.onSurface }]}>
                      {title}
                    </Text>
                  )}
                  {!!subtitle && (
                    <Text style={[theme.type.bodyMedium, { color: colors.onSurfaceVariant }]}>
                      {subtitle}
                    </Text>
                  )}
                </View>
              )}
              {children}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

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
  subtitle: PropTypes.string,
  close: PropTypes.func,
  onBack: PropTypes.func,
  navigationIcon: PropTypes.oneOf(['back', 'close']),
  presentation: PropTypes.oneOf(['dialog', 'page']),
  contentStyle: PropTypes.any,
  closeAnimation: PropTypes.bool,
};

const styles = StyleSheet.create({
  pageScreen: {
    flex: 1,
  },
  pageColumn: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  pageColumnWide: {
    maxWidth: 780,
    paddingHorizontal: 16,
  },
  pageTopBar: {
    height: 64,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    paddingBottom: 24,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 6,
  },
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
