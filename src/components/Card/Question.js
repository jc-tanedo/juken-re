import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import theme from 'src/common/theme';
import {
  KANJI,
  RADICAL,
  VOCAB,
  READING,
  TERMINOLOGY,
} from 'src/common/constants';
import useColorScheme from 'src/hooks/useColorScheme';

import device from 'src/utils/device';

import TextWithMarkups from 'src/components/TextWithMarkups/TextWithMarkups';

const Question = ({
  subjectType,
  reviewType,
  question,
  questionComponent,
  answer,
  revealed,
  mnemonicToggled,
  meaningMnemonic,
  readingMnemonic
}) => {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];
  const subject = subjectColors[colorScheme][subjectType];
  return (
    <View style={[styles.wrapper]}>

      {/* question */}
      <View style={[styles.question, { backgroundColor: subject?.container ?? colors.primaryContainer }]}>
        <Text
          style={[
            styles.questionText,
            { color: subject?.foreground ?? colors.onPrimaryContainer }
          ]}
        >
          {question || questionComponent}
        </Text>
      </View>

      {/* answer */}
      {!mnemonicToggled && <View style={styles.answer}>
        <Text
          style={[
            styles.answerText, { color: colors.onSurface },
            (
              revealed &&
              reviewType === READING &&
              styles.answerTextLarge
            ),
          ]}
        >
          {/* answer itself */}
          {revealed && answer}

          {/* review type */}
          {!revealed && TERMINOLOGY[reviewType]}

          {/* mnemic toggle hint */}
          {revealed && <Text style={[styles.mnemonicHint, { color: colors.onSurfaceVariant }]}>
            {/* one new line is sufficient with readings as the answer font adds enough vertical space by itself */}
            {reviewType === READING ? '\n' : '\n\n'} 
            {device('web') ? 'Press space for mnemonic' : 'Tap for mnemonic'}
          </Text>}
        </Text>
      </View>}

      {mnemonicToggled && <View>
        <TextWithMarkups text={reviewType === READING ? readingMnemonic : meaningMnemonic} />
      </View>}

    </View>
  );
};

Question.propTypes = {
  reviewType: PropTypes.string,
  question: PropTypes.string,
  answer: PropTypes.string,
  revealed: PropTypes.bool,
  mnemonicToggled: PropTypes.bool,
  meaningMnemonic: PropTypes.string,
  readingMnemonic: PropTypes.string,
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flexGrow: 1,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  question: {
    minWidth: 126,
    maxWidth: '100%',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 36,
  },
  questionText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 52,
  },
  answer: {
    minHeight: 28,
    maxWidth: '100%',
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: {
    textAlign: 'center',
    color: theme.palette.black,
    fontSize: 16,
    fontWeight: '700',
  },
  answerTextLarge: {
    fontSize: 20
  },
  mnemonicHint: {
    fontSize: 14,
    fontWeight: 400,
  },
});

const subjectColors = {
  light: {
    [KANJI]: { container: '#FFD9E9', foreground: '#7D204D' },
    [RADICAL]: { container: theme.light.secondaryContainer, foreground: theme.light.onSecondaryContainer },
    [VOCAB]: { container: '#EDDDFF', foreground: '#512880' },
  },
  dark: {
    [KANJI]: { container: '#59233F', foreground: '#FFD1E3' },
    [RADICAL]: { container: theme.dark.secondaryContainer, foreground: theme.dark.onSecondaryContainer },
    [VOCAB]: { container: '#493263', foreground: '#EDDDFF' },
  },
};

export default Question;
