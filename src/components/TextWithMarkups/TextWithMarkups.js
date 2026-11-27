import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text } from 'react-native';
import theme from 'src/common/theme';
import { KANA_VOCAB, KANJI, MEANING, RADICAL, READING, VOCAB } from 'src/common/constants';
import useColorScheme from 'src/hooks/useColorScheme';
import { parseMarkup } from 'src/components/TextWithMarkups/parseMarkup';

const SUBJECT_TAGS = new Set([RADICAL, KANJI, VOCAB, KANA_VOCAB]);

function styleForTags(tags, colors, subjects) {
  let activeStyle = null;
  let hasBadge = false;
  let hasJapanese = false;

  for (const tag of tags) {
    if (SUBJECT_TAGS.has(tag) && subjects[tag]) {
      activeStyle = {
        backgroundColor: subjects[tag].container,
        color: subjects[tag].foreground,
        fontWeight: '700',
      };
      hasBadge = true;
    } else if (tag === MEANING || tag === READING) {
      activeStyle = {
        backgroundColor: colors.secondaryContainer,
        color: colors.onSecondaryContainer,
        fontWeight: '700',
      };
      hasBadge = true;
    } else if (tag === 'ja') {
      hasJapanese = true;
    }
  }

  if (hasJapanese && !hasBadge) {
    activeStyle = {
      color: colors.onSurface,
      fontWeight: '700',
    };
  }

  return { activeStyle, hasBadge };
}

const TextWithMarkups = ({ text = '', style = [] }) => {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];
  const subjects = theme.subjectColors[colorScheme];
  const extraStyles = Array.isArray(style) ? style : [style];

  const segments = useMemo(() => parseMarkup(text), [text]);

  return (
    <Text style={[styles.base, { color: colors.onSurface }, ...extraStyles]}>
      {segments.map((seg, idx) => {
        const { activeStyle, hasBadge } = styleForTags(seg.tags, colors, subjects);
        const prevBadge = idx > 0 && styleForTags(segments[idx - 1].tags, colors, subjects).hasBadge;
        const padLeft = hasBadge && !prevBadge && !(seg.tags.length > 0 && segments[idx - 1]?.tags?.some(t => SUBJECT_TAGS.has(t) || t === MEANING || t === READING));
        const nextSeg = segments[idx + 1];
        const sameBadgeContinues = Boolean(
          hasBadge && nextSeg && seg.tags.some(t => nextSeg.tags.includes(t) && (SUBJECT_TAGS.has(t) || t === MEANING || t === READING)),
        );

        const content = `${padLeft ? ' ' : ''}${seg.text}${hasBadge && !sameBadgeContinues ? ' ' : ''}`;

        return (
          <Text
            key={idx}
            style={[
              styles.base,
              { color: colors.onSurface },
              activeStyle,
            ].filter(Boolean)}
          >
            {content}
          </Text>
        );
      })}
    </Text>
  );
};

TextWithMarkups.propTypes = {
  text: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
};

const styles = StyleSheet.create({
  base: {
    ...theme.type.bodyMedium,
    lineHeight: 22,
    borderRadius: theme.shape.extraSmall,
  },
});

export default TextWithMarkups;
