import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStoreState } from 'easy-peasy';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import useLayoutMode from 'src/hooks/useLayoutMode';
import AdaptivePaneLayout from 'src/components/Layout/AdaptivePaneLayout';
import Button from 'src/components/Button/Button';
import Subject from 'src/components/Subject/Subject';
import Radical from 'src/components/Radical/Radical';
import TextWithMarkups from 'src/components/TextWithMarkups/TextWithMarkups';
import StudyDeck from 'src/components/Deck/StudyDeck';
import Bar from 'src/components/Bar/Bar';
import useReviewSession from 'src/features/reviews/useReviewSession';
import useStudyDeck from 'src/features/reviews/useStudyDeck';
import { speechMode } from 'src/features/voice/speechProviders';
import useStudyMaterials from 'src/features/wk/useStudyMaterials';
import {
  ANSWER_INPUT_BOTH,
  ANSWER_INPUT_MODE,
  CARD_SIDE_RIGHT,
  DEFAULT_VOICE_ACTOR_ID,
  KANJI,
  QUICK_MODE,
  READING_TYPE_LABELS,
  SKIP_MODE,
  SPEECH_MODE,
  TERMINOLOGY,
  UNFOLDED_CARD_SIDE,
} from 'src/common/constants';

const LessonSession = ({
  assignments = [],
  subjectsById = {},
  demo = false,
  token,
  onUnlockAssignment,
  onBackToPicker,
}) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const layout = useLayoutMode();
  const user = useStoreState(state => state?.session?.user);
  const userSettings = useStoreState(state => state?.session?.userSettings);

  const skipMode = _.get(userSettings, SKIP_MODE);
  const quickMode = _.get(userSettings, QUICK_MODE);
  const unfoldedCardSide = _.get(userSettings, UNFOLDED_CARD_SIDE, CARD_SIDE_RIGHT);
  const answerInputMode = _.get(userSettings, ANSWER_INPUT_MODE, ANSWER_INPUT_BOTH);
  const preferredVoiceActorId = _.get(userSettings, DEFAULT_VOICE_ACTOR_ID)
    ?? _.get(user, 'data.preferences.default_voice_actor_id');

  const [step, setStep] = useState('study');
  const [studyIndex, setStudyIndex] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [unlockWarning, setUnlockWarning] = useState(null);

  const batchSubjects = useMemo(
    () => assignments.map(a => subjectsById[a.data?.subject_id]).filter(Boolean),
    [assignments, subjectsById],
  );

  const studyAssignment = assignments[studyIndex];
  const studySubject = studyAssignment ? subjectsById[studyAssignment.data?.subject_id] : null;
  const studyMaterials = useStudyMaterials({ token, demo, enabled: Boolean(demo || token) });

  const {
    queue,
    submitAnswer,
    subjectsDict,
    totalCards,
    stats,
  } = useReviewSession(
    step === 'quiz' ? assignments : null,
    step === 'quiz' ? batchSubjects : null,
  );

  function submitQuizAnswer(item, correct) {
    submitAnswer(item, correct, async ({ review }) => {
      const res = await onUnlockAssignment?.(review);
      if (res?.ok) {
        setUnlockedCount(c => c + 1);
      } else if (res?.message) {
        setUnlockWarning(res.message);
      }
    });
  }

  const activeSpeechMode = speechMode(userSettings?.[SPEECH_MODE]);
  const quizSubjectsDict = Object.keys(subjectsDict).length > 0 ? subjectsDict : subjectsById;
  const studyDeck = useStudyDeck({
    queue: step === 'quiz' ? queue : [],
    subjects: batchSubjects,
    subjectsDict: quizSubjectsDict,
    demo,
    submit: submitQuizAnswer,
    speechModeId: userSettings?.[SPEECH_MODE],
    preferredVoiceActorId,
    studyMaterials,
    overrideAudioSubject: step === 'study' ? studySubject : null,
  });

  if (step === 'study' && studySubject) {
    const type = studySubject.object || KANJI;
    const subTheme = theme.subjectColors[scheme]?.[type];
    const chars = studySubject.data?.characters;
    const meanings = (studySubject.data?.meanings || []).map(m => m.meaning).join(', ');
    const readings = studySubject.data?.readings || [];
    const meaningMnemonic = studySubject.data?.meaning_mnemonic;
    const meaningHint = studySubject.data?.meaning_hint;
    const readingMnemonic = studySubject.data?.reading_mnemonic;
    const readingHint = studySubject.data?.reading_hint;
    const sentences = studySubject.data?.context_sentences || [];
    const isLast = studyIndex >= assignments.length - 1;
    const { audio } = studyDeck;

    const studyHeader = (
      <View style={styles.stepHeader}>
        <Text style={[theme.type.labelMedium, { color: colors.onSurfaceVariant }]}>
          {`Study ${studyIndex + 1} of ${assignments.length}`}
        </Text>
        <View style={[styles.typeChip, { backgroundColor: subTheme?.container ?? colors.secondaryContainer }]}>
          <Text style={[theme.type.labelSmall, { color: subTheme?.foreground ?? colors.onSecondaryContainer }]}>
            {TERMINOLOGY[type] || type}
          </Text>
        </View>
      </View>
    );

    const studyHero = (
      <>
        <View style={[styles.heroTile, { backgroundColor: subTheme?.container ?? colors.primaryContainer }]}>
          <Subject
            subjectCharacters={chars || <Radical subject={studySubject} size={56} />}
            subjectType={type}
          />
        </View>

        <Text style={[theme.type.headlineSmall, styles.centerText, { color: colors.onSurface }]}>
          {meanings}
        </Text>

        {readings.length > 0 && (
          <View style={styles.readingRow}>
            {readings.map((r, i) => (
              <View key={i} style={[styles.readingChip, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={[theme.type.titleSmall, { color: colors.onSurface }]}>
                  {r.reading}
                </Text>
                {r.type && READING_TYPE_LABELS[r.type] && (
                  <Text style={[theme.type.labelSmall, { color: colors.onSurfaceVariant }]}>
                    {READING_TYPE_LABELS[r.type]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {audio.activeClip && (
          <Button
            variant="tonal"
            text={audio.playing ? 'Playing pronunciation…' : `Listen (${audio.activeClip.voiceActorName})`}
            iconLeft={<MaterialIcons name={audio.playing ? 'graphic-eq' : 'volume-up'} size={18} color={colors.onSecondaryContainer} />}
            onPress={() => audio.play()}
          />
        )}
      </>
    );

    const studyExplanations = (
      <>
        {meaningMnemonic && (
          <View style={[styles.infoBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <Text style={[theme.type.labelMedium, { color: colors.onSurfaceVariant }]}>
              Meaning explanation
            </Text>
            <TextWithMarkups text={meaningMnemonic} />
            {meaningHint && <TextWithMarkups text={meaningHint} />}
          </View>
        )}

        {readingMnemonic && (
          <View style={[styles.infoBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <Text style={[theme.type.labelMedium, { color: colors.onSurfaceVariant }]}>
              Reading explanation
            </Text>
            <TextWithMarkups text={readingMnemonic} />
            {readingHint && <TextWithMarkups text={readingHint} />}
          </View>
        )}

        {sentences.length > 0 && (
          <View style={[styles.infoBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <Text style={[theme.type.labelMedium, { color: colors.onSurfaceVariant }]}>
              Example
            </Text>
            <Text style={[theme.type.bodyMedium, { color: colors.onSurface }]}>{sentences[0].ja}</Text>
            <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>{sentences[0].en}</Text>
          </View>
        )}
      </>
    );

    const studyControls = (
      <View style={styles.studyNav}>
        <Button
          variant="outlined"
          text="Prev"
          disabled={studyIndex === 0}
          style={styles.navBtn}
          onPress={() => {
            audio.stop();
            setStudyIndex(i => Math.max(0, i - 1));
          }}
        />
        <Button
          variant="filled"
          text={isLast ? 'Start Quiz' : 'Next'}
          iconRight={<MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />}
          style={styles.navBtn}
          onPress={() => {
            audio.stop();
            if (isLast) setStep('quiz');
            else setStudyIndex(i => i + 1);
          }}
        />
      </View>
    );

    if (layout.isWide || layout.isTabletop) {
      return (
        <View style={styles.sessionWrapper}>
          {studyHeader}
          <AdaptivePaneLayout
            layout={layout}
            primary={(
              <View style={styles.wideHeroPane}>
                <ScrollView
                  style={styles.studyScroll}
                  contentContainerStyle={styles.wideHeroContent}
                  showsVerticalScrollIndicator={false}
                >
                  {studyHero}
                </ScrollView>
                {!layout.isTabletop && studyControls}
              </View>
            )}
            secondary={(
              <View style={styles.wideHeroPane}>
                <ScrollView
                  style={styles.studyScroll}
                  contentContainerStyle={styles.studyContent}
                  showsVerticalScrollIndicator={false}
                >
                  {studyExplanations}
                </ScrollView>
                {layout.isTabletop && studyControls}
              </View>
            )}
          />
        </View>
      );
    }

    return (
      <View style={styles.sessionWrapper}>
        {studyHeader}

        <ScrollView style={styles.studyScroll} contentContainerStyle={styles.studyContent}>
          {studyHero}
          {studyExplanations}
        </ScrollView>

        {studyControls}
      </View>
    );
  }

  const isQuizComplete = step === 'quiz' && studyDeck.cards.length === 0;
  const completedCards = stats?.cards?.completed ?? 0;
  const useAdaptiveQuizLayout = (layout.isWide || layout.isTabletop) && studyDeck.cards.length > 0;
  const quizProgressBox = !isQuizComplete && studyDeck.cards.length > 0 ? (
    <View
      style={[
        styles.progressBox,
        useAdaptiveQuizLayout && styles.progressBoxAdaptive,
        { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
      ]}
    >
      <View style={styles.stepHeader}>
        <Text style={[theme.type.labelMedium, { color: colors.onSurface }]}>
          Lesson quiz
        </Text>
        <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>
          {`${completedCards}/${totalCards}`}
        </Text>
      </View>
      <Bar
        style={{ backgroundColor: colors.surfaceContainerHighest }}
        values={[stats?.cards?.incorrectPercent || 0, stats?.cards?.correctPercent || 0]}
        colors={[colors.error, colors.success]}
      />
    </View>
  ) : null;

  return (
    <View style={styles.sessionWrapper}>
      <StudyDeck
        studyDeck={studyDeck}
        subjectsDict={quizSubjectsDict}
        studyMaterials={studyMaterials}
        token={token}
        preferredVoiceActorId={preferredVoiceActorId}
        speechModeLabel={activeSpeechMode.label}
        skipMode={skipMode}
        quickMode={quickMode}
        deckStyle={styles.deck}
        layout={layout}
        cardSide={unfoldedCardSide}
        answerInputMode={answerInputMode}
        progressSlot={quizProgressBox}
      />

      {isQuizComplete && (
        <View style={styles.doneWrapper}>
          <View style={[styles.doneCard, { backgroundColor: colors.successContainer }, theme.elevation.level1]}>
            <View style={[styles.doneIcon, { backgroundColor: colors.surfaceContainerLowest }]}>
              <MaterialIcons name="check-circle" size={30} color={colors.success} />
            </View>
            <Text accessibilityRole="header" style={[theme.type.headlineMedium, { color: colors.onSuccessContainer }]}>
              Lesson quiz complete!
            </Text>
            <Text style={[theme.type.bodyLarge, { color: colors.onSuccessContainer }]}>
              {`${unlockedCount} lesson${unlockedCount === 1 ? '' : 's'} unlocked into Apprentice 1.`}
            </Text>
          </View>
          {unlockWarning && (
            <Text style={[theme.type.bodySmall, { color: colors.warning }]}>
              {unlockWarning}
            </Text>
          )}
          <Button
            variant="filled"
            text="Back to Lesson Picker"
            onPress={onBackToPicker}
          />
        </View>
      )}
    </View>
  );
};

LessonSession.propTypes = {
  assignments: PropTypes.array,
  subjectsById: PropTypes.object,
  demo: PropTypes.bool,
  token: PropTypes.string,
  onUnlockAssignment: PropTypes.func,
  onBackToPicker: PropTypes.func,
};

const styles = StyleSheet.create({
  sessionWrapper: {
    flex: 1,
    width: '100%',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.shape.full,
  },
  studyScroll: {
    flex: 1,
  },
  studyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 16,
  },
  wideHeroPane: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  wideHeroContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 8,
  },
  heroTile: {
    alignSelf: 'center',
    minWidth: 132,
    minHeight: 112,
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  readingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  readingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.shape.full,
  },
  infoBox: {
    padding: 14,
    borderRadius: theme.shape.large,
    borderWidth: 1,
    gap: 6,
  },
  studyNav: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  navBtn: {
    flex: 1,
  },
  deck: {
    width: '100%',
    flex: 1,
    zIndex: 9,
  },
  progressBox: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderRadius: theme.shape.extraLarge,
    marginTop: 8,
  },
  progressBoxAdaptive: {
    marginTop: 0,
  },
  doneWrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  doneCard: {
    padding: 24,
    borderRadius: theme.shape.extraLarge,
    gap: 8,
  },
  doneIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.shape.largeIncreased,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});

export default LessonSession;
