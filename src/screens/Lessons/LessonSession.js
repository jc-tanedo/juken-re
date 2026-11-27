import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStoreState } from 'easy-peasy';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import Button from 'src/components/Button/Button';
import Subject from 'src/components/Subject/Subject';
import Radical from 'src/components/Radical/Radical';
import TextWithMarkups from 'src/components/TextWithMarkups/TextWithMarkups';
import Deck from 'src/components/Deck/Deck';
import Card from 'src/components/Card/Card';
import Bar from 'src/components/Bar/Bar';
import SubjectDetailsModal from 'src/screens/SubjectDetails/SubjectDetailsModal';
import useReviewSession from 'src/features/reviews/useReviewSession';
import useVoiceReview from 'src/features/voice/useVoiceReview';
import VoicePanel from 'src/features/voice/VoicePanel';
import { speechMode } from 'src/features/voice/speechProviders';
import useStudyMaterials from 'src/features/wk/useStudyMaterials';
import usePronunciationAudio from 'src/features/audio/usePronunciationAudio';
import { selectPronunciationAudio } from 'src/features/audio/audioSelector';
import extractSubject from 'src/utils/extractSubject';
import {
  DEFAULT_VOICE_ACTOR_ID,
  KANJI,
  QUICK_MODE,
  READING_TYPE_LABELS,
  SKIP_MODE,
  SPEECH_MODE,
  TERMINOLOGY,
} from 'src/common/constants';

const VOICE_CAPTURE_PHASES = new Set(['starting', 'preparing', 'listening', 'speaking', 'processing']);

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
  const user = useStoreState(state => state?.session?.user);
  const userSettings = useStoreState(state => state?.session?.userSettings);

  const skipMode = _.get(userSettings, SKIP_MODE);
  const quickMode = _.get(userSettings, QUICK_MODE);
  const preferredVoiceActorId = _.get(userSettings, DEFAULT_VOICE_ACTOR_ID)
    ?? _.get(user, 'data.preferences.default_voice_actor_id');

  const [step, setStep] = useState('study');
  const [studyIndex, setStudyIndex] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [unlockWarning, setUnlockWarning] = useState(null);
  const [detailsSubject, setDetailsSubject] = useState(null);

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
  const voice = useVoiceReview({
    queue: step === 'quiz' ? queue : [],
    subjects: batchSubjects,
    subjectsDict,
    demo,
    submit: submitQuizAnswer,
    mode: userSettings?.[SPEECH_MODE],
    studySynonyms: studyMaterials.synonymsBySubjectId,
  });
  const voiceControlsCard = !['off', 'manual'].includes(voice.state.phase);
  const topCard = voice.cards[0];
  const quizTopSubject = topCard ? subjectsDict[_.get(topCard, 'review.data.subject_id')] : null;
  const audioTargetSubject = step === 'study' ? studySubject : quizTopSubject;

  const audio = usePronunciationAudio({
    subject: audioTargetSubject,
    preferredVoiceActorId,
    suppressPlayback: step === 'quiz' && VOICE_CAPTURE_PHASES.has(voice.state.phase),
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

    return (
      <View style={styles.sessionWrapper}>
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

        <ScrollView style={styles.studyScroll} contentContainerStyle={styles.studyContent}>
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
        </ScrollView>

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
      </View>
    );
  }

  const isQuizComplete = step === 'quiz' && voice.cards.length === 0;
  const completedCards = stats?.cards?.completed ?? 0;

  return (
    <View style={styles.sessionWrapper}>
      <SubjectDetailsModal
        visible={Boolean(detailsSubject)}
        subject={detailsSubject}
        studyMaterial={detailsSubject ? studyMaterials.materialsBySubjectId[detailsSubject.id] : null}
        subjectsById={subjectsById}
        token={token}
        preferredVoiceActorId={preferredVoiceActorId}
        onSaveStudyMaterial={studyMaterials.saveStudyMaterial}
        onClose={() => setDetailsSubject(null)}
      />

      {!isQuizComplete && voice.cards.length > 0 && (
        <>
          <Deck
            style={styles.deck}
            key={voiceControlsCard ? 'voice' : 'manual'}
            cards={voice.cards}
            swipe={voice.state.swipe}
            interactive={!voiceControlsCard}
            allowSkipping={skipMode}
            dismissCard={voice.manualDismiss}
            renderCard={(item, props) => {
              if (!item) return <Card empty />;

              const { id, review, reviewType } = item;
              const subjectId = _.get(review, 'data.subject_id');
              const subject = _.get(subjectsDict, subjectId);
              const subjectType = _.get(subject, 'object');
              const meaningMnemonic = _.get(subject, 'data.meaning_mnemonic');
              const readingMnemonic = _.get(subject, 'data.reading_mnemonic');
              const cardClip = selectPronunciationAudio(subject, { preferredVoiceActorId });
              const {
                question,
                questionComponent,
                answer,
                readingTypeLabel,
              } = extractSubject(subject, reviewType);

              return (
                <Card
                  key={`${id}_${reviewType}`}
                  deckProps={props}
                  subjectType={subjectType}
                  reviewType={reviewType}
                  reviewQuestion={question}
                  reviewQuestionComponent={questionComponent}
                  reviewAnswer={answer}
                  readingTypeLabel={readingTypeLabel}
                  hasAudio={Boolean(cardClip)}
                  playingAudio={Boolean(cardClip && audio.playingUrl === cardClip.url)}
                  onPlayAudio={cardClip ? () => audio.play(cardClip) : undefined}
                  onOpenDetails={subject ? () => {
                    audio.stop();
                    voice.session.stop();
                    setDetailsSubject(subject);
                  } : undefined}
                  meaningMnemonic={meaningMnemonic}
                  readingMnemonic={readingMnemonic}
                  voiceControlled={voiceControlsCard}
                  quickMode={quickMode}
                />
              );
            }}
          />

          {Platform.OS === 'android' && (
            <VoicePanel
              state={voice.state}
              session={voice.session}
              colors={colors}
              engineLabel={activeSpeechMode.label}
            />
          )}

          <View style={[styles.progressBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
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
        </>
      )}

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
    gap: 12,
    paddingBottom: 16,
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
    maxHeight: 560,
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
