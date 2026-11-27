import React from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from 'src/common/theme';
import { KANJI } from 'src/common/constants';
import useColorScheme from 'src/hooks/useColorScheme';
import Radical from 'src/components/Radical/Radical';
import { primaryMeaningFor } from 'src/utils/extractSubject';

const SubjectChip = ({
  subject,
  label,
  fallbackId,
  selected = false,
  onPress,
  accessibilityLabel,
  iconSize = 18,
}) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const subType = subject?.object || KANJI;
  const subTheme = theme.subjectColors[scheme]?.[subType];
  const chars = subject?.data?.characters;
  const displayLabel = label ?? (primaryMeaningFor(subject) || (fallbackId != null ? `#${fallbackId}` : ''));

  const bgColor = selected
    ? colors.primary
    : (subTheme?.container ?? colors.secondaryContainer);
  const fgColor = selected
    ? colors.onPrimary
    : (subTheme?.foreground ?? colors.onSecondaryContainer);

  const content = (
    <>
      {chars ? (
        <Text style={[theme.type.labelLarge, styles.chars, { color: fgColor }]}>
          {chars}
        </Text>
      ) : subject ? (
        <Radical subject={subject} size={iconSize} color={fgColor} />
      ) : null}
      {!!displayLabel && (
        <Text style={[theme.type.labelSmall, { color: fgColor }]}>
          {displayLabel}
        </Text>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={accessibilityLabel || `Select ${displayLabel}`}
        onPress={onPress}
        style={[
          styles.chip,
          styles.interactive,
          { backgroundColor: bgColor, borderColor: selected ? colors.primary : 'transparent' },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.chip, { backgroundColor: bgColor }]}>
      {content}
    </View>
  );
};

SubjectChip.propTypes = {
  subject: PropTypes.object,
  label: PropTypes.string,
  fallbackId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selected: PropTypes.bool,
  onPress: PropTypes.func,
  accessibilityLabel: PropTypes.string,
  iconSize: PropTypes.number,
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: theme.shape.full,
  },
  interactive: {
    borderWidth: 1,
  },
  chars: {
    fontWeight: '700',
  },
});

export default SubjectChip;
