import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
  const tileBg = subject?.container ?? colors.primaryContainer;
  const tileFg = subject?.foreground ?? colors.onPrimaryContainer;
  const isLongQuestion = typeof question === 'string' && question.length > 3;
  const isReading = reviewType === READING;

  if (mnemonicToggled) {
    return (
      <View style={styles.mnemonicWrapper}>
        <View style={styles.mnemonicHeader}>
          <View style={[styles.miniTile, { backgroundColor: tileBg }]}>
            {question ? (
              <Text style={[styles.miniTileText, { color: tileFg }]}>{question}</Text>
            ) : (
              questionComponent
            )}
          </View>
          <View style={styles.mnemonicTitleCol}>
            <Text style={[theme.type.labelSmall, { color: colors.onSurfaceVariant }]}>
              {TERMINOLOGY[reviewType]}
            </Text>
            <Text numberOfLines={2} style={[theme.type.titleMedium, { color: colors.onSurface }]}>
              {answer}
            </Text>
          </View>
        </View>

        <ScrollView
          nestedScrollEnabled
          style={[styles.mnemonicBox, { backgroundColor: colors.surfaceContainerHigh }]}
          contentContainerStyle={styles.mnemonicContent}
        >
          <TextWithMarkups text={mnemonicText} />
        </ScrollView>

        <Text style={[theme.type.labelSmall, styles.mnemonicToggleHint, { color: colors.onSurfaceVariant }]}>
          {device('web') ? 'Press space to hide mnemonic' : 'Tap card to hide mnemonic'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.question, { backgroundColor: tileBg }]}>
        <Text
          style={[
            styles.questionText,
            isLongQuestion && styles.questionTextCompact,
            { color: tileFg },
          ]}
        >
          {question || questionComponent}
        </Text>
      </View>

      <View style={styles.answer}>
        {!revealed && (
          <>
            <View style={[styles.promptPill, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialIcons
                name={isReading ? 'record-voice-over' : 'lightbulb-outline'}
                size={18}
                color={colors.primary}
              />
              <Text style={[theme.type.titleSmall, { color: colors.onSurface }]}>
                {TERMINOLOGY[reviewType]}
              </Text>
            </View>
            <Text style={[theme.type.bodySmall, styles.helperText, { color: colors.onSurfaceVariant }]}>
              {isReading ? 'Recall the Japanese reading' : 'Recall the English meaning'}
            </Text>
          </>
        )}

        {revealed && (
          <>
            <Text
              style={[
                isReading ? styles.answerTextLarge : theme.type.headlineSmall,
                styles.answerText,
                { color: colors.onSurface },
              ]}
            >
              {answer}
            </Text>
            <View
              style={[
                styles.assistChip,
                { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
              ]}
            >
              <MaterialIcons name="menu-book" size={16} color={colors.primary} />
              <Text style={[theme.type.labelMedium, { color: colors.onSurface }]}>
                {device('web') ? 'Mnemonic · Space' : 'Show mnemonic'}
              </Text>
            </View>
          </>
        )}
      </View>
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
    gap: 18,
  },
  question: {
    minWidth: 152,
    minHeight: 132,
    maxWidth: '100%',
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 56,
  },
  questionTextCompact: {
    fontSize: 40,
  },
  answer: {
    minHeight: 48,
    maxWidth: '100%',
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.shape.full,
  },
  helperText: {
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
  assistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.shape.full,
    borderWidth: 1,
    marginTop: 2,
  },
  mnemonicWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  mnemonicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniTile: {
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.shape.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTileText: {
    fontSize: 22,
    fontWeight: '700',
  },
  mnemonicTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  mnemonicBox: {
    width: '100%',
    maxHeight: 240,
    borderRadius: theme.shape.largeIncreased,
    flexGrow: 0,
  },
  mnemonicContent: {
    padding: 16,
  },
  mnemonicToggleHint: {
    textAlign: 'center',
  },
});

export default Question;
