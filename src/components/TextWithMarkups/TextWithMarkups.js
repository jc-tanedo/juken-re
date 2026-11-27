import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text } from 'react-native';
import theme from 'src/common/theme';
import { KANJI, MEANING, RADICAL, READING, VOCAB } from 'src/common/constants';
import useColorScheme from 'src/hooks/useColorScheme';

const tagToSubject = {
  '<radical>': RADICAL,
  '<kanji>': KANJI,
  '<vocabulary>': VOCAB,
};

const TextWithMarkups = ({ text = '', style = [] }) => {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];
  const subjects = theme.subjectColors[colorScheme];

  // "lorem <radical>ipsum</radical> dolor sit amet!"
  // ["lorem", "<radical>", "ipsum", "dolor", "sit", "amet!"]
  const parts = useMemo(() => {
    const r = new RegExp(/(<.*?>)(.*?)<\/.*?>/gi);
    return (text || '').split(r);
  }, [text]);

  return (
    <Text style={[styles.base, { color: colors.onSurface }]}>
      {parts.map((part, i) => {
        if (part.match(/<.*?>/gi)) return null;
        const prevTag = parts[i - 1];
        const subjectKey = tagToSubject[prevTag];
        const isAnswerTag = prevTag === `<${MEANING}>` || prevTag === `<${READING}>`;
        let tagStyle = null;
        if (subjectKey && subjects[subjectKey]) {
          tagStyle = {
            backgroundColor: subjects[subjectKey].container,
            color: subjects[subjectKey].foreground,
            fontWeight: '700',
          };
        } else if (isAnswerTag) {
          tagStyle = {
            backgroundColor: colors.secondaryContainer,
            color: colors.onSecondaryContainer,
            fontWeight: '700',
          };
        }

        return (
          <Text
            key={i}
            style={[
              ...style,
              styles.base,
              { color: colors.onSurface },
              tagStyle,
            ].filter(Boolean)}
          >
            {tagStyle ? ` ${part} ` : part}
          </Text>
        );
      }).filter(Boolean)}
    </Text>
  );
};

TextWithMarkups.propTypes = {
  text: PropTypes.string,
  style: PropTypes.array,
};

const styles = StyleSheet.create({
  base: {
    ...theme.type.bodyMedium,
    lineHeight: 22,
    borderRadius: theme.shape.extraSmall,
  },
});

export default TextWithMarkups;
