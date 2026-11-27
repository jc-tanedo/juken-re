import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from 'src/common/theme';
import { READING, TERMINOLOGY } from 'src/common/constants';
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
  readingMnemonic,
}) => {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];
  const subject = theme.subjectColors[colorScheme][subjectType];
  const mnemonicText = reviewType === READING ? readingMnemonic : meaningMnemonic;

  return (
    <View style={styles.wrapper}>
      {/* question */}
      <View style={[styles.question, { backgroundColor: subject?.container ?? colors.primaryContainer }]}>
        <Text
          style={[
            styles.questionText,
            { color: subject?.foreground ?? colors.onPrimaryContainer },
          ]}
        >
          {question || questionComponent}
        </Text>
      </View>

      {/* answer / review type */}
      {!mnemonicToggled && (
        <View style={styles.answer}>
          {!revealed && (
            <Text style={[theme.type.titleMedium, styles.reviewTypeText, { color: colors.onSurfaceVariant }]}>
              {TERMINOLOGY[reviewType]}
            </Text>
          )}
          {revealed && (
            <>
              <Text
                style={[
                  reviewType === READING ? styles.answerTextLarge : theme.type.headlineSmall,
                  styles.answerText,
                  { color: colors.onSurface },
                ]}
              >
                {answer}
              </Text>
              <Text style={[theme.type.bodySmall, styles.mnemonicHint, { color: colors.onSurfaceVariant }]}>
                {device('web') ? 'Press space for mnemonic' : 'Tap card for mnemonic'}
              </Text>
            </>
          )}
        </View>
      )}

      {/* mnemonic */}
      {mnemonicToggled && (
        <ScrollView
          nestedScrollEnabled
          style={[styles.mnemonicBox, { backgroundColor: colors.surfaceContainer }]}
          contentContainerStyle={styles.mnemonicContent}
        >
          <TextWithMarkups text={mnemonicText} />
        </ScrollView>
      )}
    </View>
  );
};

Question.propTypes = {
  subjectType: PropTypes.string,
  reviewType: PropTypes.string,
  question: PropTypes.string,
  questionComponent: PropTypes.any,
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
    gap: 16,
  },
  question: {
    minWidth: 128,
    maxWidth: '100%',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: theme.shape.extraLargeIncreased,
  },
  questionText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 52,
  },
  answer: {
    minHeight: 32,
    maxWidth: '100%',
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  reviewTypeText: {
    textAlign: 'center',
  },
  answerText: {
    textAlign: 'center',
  },
  answerTextLarge: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
  },
  mnemonicHint: {
    textAlign: 'center',
  },
  mnemonicBox: {
    width: '100%',
    maxHeight: 220,
    borderRadius: theme.shape.large,
    flexGrow: 0,
  },
  mnemonicContent: {
    padding: 16,
  },
});

export default Question;
