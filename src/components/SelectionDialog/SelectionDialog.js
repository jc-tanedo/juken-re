import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import Button from 'src/components/Button/Button';
import ListItem from 'src/components/List/ListItem';

function itemPosition(index, count) {
  if (count <= 1) return 'single';
  if (index === 0) return 'first';
  if (index === count - 1) return 'last';
  return 'middle';
}

const SelectionDialog = ({
  visible = false,
  title,
  subtitle,
  icon,
  options = [],
  value,
  onSelect,
  onClose,
}) => {
  const colors = theme[useColorScheme()];

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
        <Pressable accessible={false} onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.panel, { backgroundColor: colors.surfaceContainerHigh }, theme.elevation.level3]}>
          <View style={styles.header}>
            {!!icon && (
              <View style={[styles.iconBadge, { backgroundColor: colors.secondaryContainer }]}>
                {icon}
              </View>
            )}
            <Text accessibilityRole="header" style={[theme.type.headlineSmall, { color: colors.onSurface }]}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={[theme.type.bodyMedium, { color: colors.onSurfaceVariant }]}>
                {subtitle}
              </Text>
            )}
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.options}>
            {options.map((option, index) => (
              <ListItem
                key={String(option.value)}
                title={option.label}
                subtitle={option.description}
                selected={option.value === value}
                position={itemPosition(index, options.length)}
                onPress={() => {
                  onSelect?.(option.value);
                  onClose?.();
                }}
              />
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Button text="Cancel" variant="text" style={styles.cancel} onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

SelectionDialog.propTypes = {
  visible: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
  })),
  value: PropTypes.any,
  onSelect: PropTypes.func,
  onClose: PropTypes.func,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: theme.shape.extraLarge,
    overflow: 'hidden',
    paddingTop: 24,
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 6,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  options: {
    paddingHorizontal: 16,
    gap: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cancel: {
    width: 'auto',
    minHeight: 44,
    paddingHorizontal: 16,
  },
});

export default SelectionDialog;
