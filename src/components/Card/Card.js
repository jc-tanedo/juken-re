import React from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import theme from 'src/common/theme';
import device from 'src/utils/device';
import { TERMINOLOGY } from 'src/common/constants';
import useColorScheme from 'src/hooks/useColorScheme';

import CardCover from 'src/components/Card/CardCover';
import CardHeader from 'src/components/Card/CardHeader';
import Question from 'src/components/Card/Question';
import LongPressButton from 'src/components/Button/LongPressButton';

const DirectionLeftIcon = ({ color }) => (
  <View style={styles.directionRow}>
    <MaterialIcons name="chevron-left" size={18} color={color} />
    <MaterialIcons name="close" size={16} color={color} />
  </View>
);

const DirectionRightIcon = ({ color }) => (
  <View style={styles.directionRow}>
    <MaterialIcons name="check" size={16} color={color} />
    <MaterialIcons name="chevron-right" size={18} color={color} />
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
  meaningMnemonic,
  readingMnemonic,
  voiceControlled = false,
  quickMode,
}) => {
  const {
    reveal,
    revealed,
    toggleMnemonic,
    mnemonicToggled,
    isFirstCard,
    getClearInterpolation,
  } = deckProps;

  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];
  const cardSurface = colorScheme === 'dark' ? colors.surfaceContainerLow : colors.surfaceContainerLowest;
  const subjectTheme = theme.subjectColors[colorScheme][subjectType];

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
          leftIcon={revealed ? <DirectionLeftIcon color={colors.error} /> : null}
          rightIcon={revealed ? <DirectionRightIcon color={colors.success} /> : null}
          centerText={revealed
            ? (device('web') ? 'Arrow Keys' : 'Swipe')
            : (TERMINOLOGY[subjectType] || '')}
          chipBackground={revealed ? colors.secondaryContainer : (subjectTheme?.container ?? colors.secondaryContainer)}
          chipColor={revealed ? colors.onSecondaryContainer : (subjectTheme?.foreground ?? colors.onSecondaryContainer)}
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
            question={reviewQuestion}
            questionComponent={reviewQuestionComponent}
            reviewType={reviewType}
            subjectType={subjectType}
            meaningMnemonic={meaningMnemonic}
            readingMnemonic={readingMnemonic}
          />

          <View style={styles.revealSlot}>
            {!voiceControlled && !revealed && !quickMode && (
              <LongPressButton
                text="Reveal"
                flashText={`Press and Hold${device('web') ? ' / Spacebar' : ''}`}
                onComplete={reveal}
              />
            )}
          </View>
        </Pressable>
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
  meaningMnemonic: PropTypes.string,
  readingMnemonic: PropTypes.string,
  voiceControlled: PropTypes.bool,
  quickMode: PropTypes.bool,
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
    height: theme.height.touchable,
  },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});

export default Card;
