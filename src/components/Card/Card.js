import React from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import theme from 'src/common/theme';
import device from 'src/utils/device';
import { KANA_VOCAB, KANJI, RADICAL, TERMINOLOGY, VOCAB } from 'src/common/constants';
import useColorScheme from 'src/hooks/useColorScheme';

import CardCover from 'src/components/Card/CardCover';
import CardHeader from 'src/components/Card/CardHeader';
import Question from 'src/components/Card/Question';
import Button from 'src/components/Button/Button';
import LongPressButton from 'src/components/Button/LongPressButton';

const subjectIcons = {
  [RADICAL]: 'category',
  [KANJI]: 'translate',
  [VOCAB]: 'menu-book',
  [KANA_VOCAB]: 'menu-book',
};

const SwipeCuePill = ({ direction, label, containerColor, contentColor }) => (
  <View style={[styles.cuePill, { backgroundColor: containerColor }]}>
    {direction === 'left' && (
      <MaterialIcons name="chevron-left" size={16} color={contentColor} />
    )}
    <Text style={[theme.type.labelSmall, { color: contentColor }]}>{label}</Text>
    {direction === 'right' && (
      <MaterialIcons name="chevron-right" size={16} color={contentColor} />
    )}
  </View>
);

const Card = ({
  empty,
  deckProps = {},
  reviewType,
  subjectType,
  reviewQuestion,
  reviewQuestionComponent,
  reviewAnswer,
  readingTypeLabel,
  synonymsText,
  hasAudio,
  playingAudio,
  onPlayAudio,
  onOpenDetails,
  meaningMnemonic,
  readingMnemonic,
  voiceControlled = false,
  quickMode,
  skipMode = false,
  allowSwipe = true,
  showAnswerButtons = false,
}) => {
  const {
    reveal,
    revealed,
    toggleMnemonic,
    mnemonicToggled,
    isFirstCard,
    getClearInterpolation,
    swipeLeft,
    swipeRight,
  } = deckProps;

  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];
  const cardSurface = colorScheme === 'dark' ? colors.surfaceContainerLow : colors.surfaceContainerLowest;
  const subjectTheme = theme.subjectColors[colorScheme][subjectType];
  const subjectIconName = subjectIcons[subjectType];

  if (empty) {
    return (
      <View
        style={[
          styles.wrapper,
          { backgroundColor: cardSurface, borderColor: colors.outlineVariant },
        ]}
      />
    );
  }

  const onCardPressed = () => {
    if (revealed) {
      toggleMnemonic();
    } else if (quickMode) {
      if (device('mobile')) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      reveal();
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: cardSurface, borderColor: colors.outlineVariant },
        isFirstCard && theme.elevation.level1,
      ]}
    >
      {/* red / green cover */}
      {isFirstCard && (
        <CardCover getClearInterpolation={getClearInterpolation} />
      )}

      {/* card contents */}
      <View style={styles.container}>
        <CardHeader
          leftIcon={revealed && allowSwipe ? (
            <SwipeCuePill
              direction="left"
              label="Missed"
              containerColor={colors.errorContainer}
              contentColor={colors.onErrorContainer}
            />
          ) : null}
          rightIcon={revealed && allowSwipe ? (
            <SwipeCuePill
              direction="right"
              label="Correct"
              containerColor={colors.successContainer}
              contentColor={colors.onSuccessContainer}
            />
          ) : null}
          centerText={revealed && allowSwipe
            ? (device('web') ? 'Arrow Keys' : 'Swipe')
            : (TERMINOLOGY[subjectType] || '')}
          chipIcon={(!revealed || !allowSwipe) && subjectIconName ? (
            <MaterialIcons
              name={subjectIconName}
              size={15}
              color={subjectTheme?.foreground ?? colors.onSecondaryContainer}
            />
          ) : null}
          chipBackground={revealed && allowSwipe
            ? colors.surfaceContainerHigh
            : (subjectTheme?.container ?? colors.secondaryContainer)}
          chipColor={revealed && allowSwipe
            ? colors.onSurfaceVariant
            : (subjectTheme?.foreground ?? colors.onSecondaryContainer)}
        />
        <Pressable
          disabled={voiceControlled || (!revealed && !quickMode)}
          onPress={onCardPressed}
          style={styles.body}
        >
          <Question
            revealed={revealed}
            mnemonicToggled={mnemonicToggled}
            answer={reviewAnswer}
            readingTypeLabel={readingTypeLabel}
            synonymsText={synonymsText}
            hasAudio={hasAudio}
            playingAudio={playingAudio}
            onPlayAudio={onPlayAudio}
            onOpenDetails={onOpenDetails}
            question={reviewQuestion}
            questionComponent={reviewQuestionComponent}
            reviewType={reviewType}
            subjectType={subjectType}
            meaningMnemonic={meaningMnemonic}
            readingMnemonic={readingMnemonic}
          />
        </Pressable>

        <View style={styles.revealSlot}>
          {!voiceControlled && showAnswerButtons && (revealed || (skipMode && quickMode)) ? (
            <View style={styles.answerActions}>
              <Button
                variant="tonal"
                text="Missed"
                style={[styles.answerBtn, { backgroundColor: colors.errorContainer }]}
                textStyle={{ color: colors.onErrorContainer }}
                iconLeft={<MaterialIcons name="close" size={18} color={colors.onErrorContainer} />}
                onPress={swipeLeft}
              />
              <Button
                variant="tonal"
                text="Correct"
                style={[styles.answerBtn, { backgroundColor: colors.successContainer }]}
                textStyle={{ color: colors.onSuccessContainer }}
                iconLeft={<MaterialIcons name="check" size={18} color={colors.onSuccessContainer} />}
                onPress={swipeRight}
              />
            </View>
          ) : !voiceControlled && !revealed && !quickMode ? (
            <LongPressButton
              text="Reveal"
              flashText={`Press and Hold${device('web') ? ' / Spacebar' : ''}`}
              onComplete={reveal}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
};

Card.propTypes = {
  empty: PropTypes.bool,
  deckProps: PropTypes.object,
  subjectType: PropTypes.string,
  reviewType: PropTypes.string,
  reviewQuestion: PropTypes.string,
  reviewQuestionComponent: PropTypes.any,
  reviewAnswer: PropTypes.string,
  readingTypeLabel: PropTypes.string,
  synonymsText: PropTypes.string,
  hasAudio: PropTypes.bool,
  playingAudio: PropTypes.bool,
  onPlayAudio: PropTypes.func,
  onOpenDetails: PropTypes.func,
  meaningMnemonic: PropTypes.string,
  readingMnemonic: PropTypes.string,
  voiceControlled: PropTypes.bool,
  quickMode: PropTypes.bool,
  skipMode: PropTypes.bool,
  allowSwipe: PropTypes.bool,
  showAnswerButtons: PropTypes.bool,
};

const styles = StyleSheet.create({
  wrapper: device({
    base: {
      flex: 1,
      position: 'relative',
      borderRadius: theme.shape.extraLarge,
      borderWidth: 1,
      overflow: 'hidden',
    },
    web: {
      userSelect: 'none',
    },
  }),
  container: {
    flex: 1,
    padding: theme.padding.card,
  },
  body: {
    flex: 1,
  },
  revealSlot: {
    height: 56,
  },
  answerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  answerBtn: {
    flex: 1,
    paddingHorizontal: 14,
  },
  cuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.shape.full,
  },
});

export default Card;
