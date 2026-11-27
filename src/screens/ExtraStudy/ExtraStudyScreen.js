import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStoreState } from 'easy-peasy';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import Page from 'src/components/Page/Page';
import TopBar from 'src/components/TopBar/TopBar';
import Bar from 'src/components/Bar/Bar';
import Button from 'src/components/Button/Button';
import Deck from 'src/components/Deck/Deck';
import Card from 'src/components/Card/Card';
import Message from 'src/screens/Message/Message';
import SubjectDetailsModal from 'src/screens/SubjectDetails/SubjectDetailsModal';
import useReviewSession from 'src/features/reviews/useReviewSession';
import useExtraStudy from 'src/features/extraStudy/useExtraStudy';
import { createPracticeAssignments } from 'src/features/extraStudy/decks';
import useVoiceReview from 'src/features/voice/useVoiceReview';
import VoicePanel from 'src/features/voice/VoicePanel';
import { speechMode } from 'src/features/voice/speechProviders';
import useStudyMaterials from 'src/features/wk/useStudyMaterials';
import usePronunciationAudio from 'src/features/audio/usePronunciationAudio';
import { selectPronunciationAudio } from 'src/features/audio/audioSelector';
import extractSubject from 'src/utils/extractSubject';
import {
  AUTOPLAY_AUDIO,
  DEFAULT_VOICE_ACTOR_ID,
  QUICK_MODE,
  SKIP_MODE,
  SPEECH_MODE,
} from 'src/common/constants';

const VOICE_CAPTURE_PHASES = new Set(['starting', 'preparing', 'listening', 'speaking', 'processing']);

const TONE_MAP = (colors, tone) => {
  if (tone === 'error') return { bg: colors.errorContainer, fg: colors.onErrorContainer };
  if (tone === 'warning') return { bg: colors.warningContainer, fg: colors.onWarningContainer };
  if (tone === 'secondary') return { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer };
  return { bg: colors.primaryContainer, fg: colors.onPrimaryContainer };
};

const ExtraStudyScreen = ({ demo = false } = {}) => {
  const token = useStoreState(state => state?.session?.token);
  const user = useStoreState(state => state?.session?.user);
  const userSettings = useStoreState(state => state?.session?.userSettings);

  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];

  const skipMode = _.get(userSettings, SKIP_MODE);
  const quickMode = _.get(userSettings, QUICK_MODE);
  const autoplayAudio = Boolean(_.get(userSettings, AUTOPLAY_AUDIO));
  const preferredVoiceActorId = _.get(userSettings, DEFAULT_VOICE_ACTOR_ID)
    ?? _.get(user, 'data.preferences.default_voice_actor_id');

  const { decks, loading, reload } = useExtraStudy({ token, demo });
  const studyMaterials = useStudyMaterials({ token, demo, enabled: Boolean(demo || token) });

  const [activeDeckMeta, setActiveDeckMeta] = useState(null);
  const [practiceAssignments, setPracticeAssignments] = useState(null);
  const [practiceSubjects, setPracticeSubjects] = useState(null);
  const [detailsSubject, setDetailsSubject] = useState(null);

  const {
    queue,
    submitAnswer,
    subjectsDict,
    totalCards,
    stats,
  } = useReviewSession(practiceAssignments, practiceSubjects);

  // Zero-SRS-impact invariant: Extra Study NEVER calls POST /v2/reviews or submitReview.
  function practiceSubmit(item, correct) {
    submitAnswer(item, correct);
  }

  const activeSpeechMode = speechMode(userSettings?.[SPEECH_MODE]);
  const voice = useVoiceReview({
    queue,
    subjects: practiceSubjects || [],
    subjectsDict,
    demo,
    submit: practiceSubmit,
    mode: userSettings?.[SPEECH_MODE],
    studySynonyms: studyMaterials.synonymsBySubjectId,
  });
  const voiceControlsCard = !['off', 'manual'].includes(voice.state.phase);
  const topCard = voice.cards[0];
  const topSubject = topCard ? subjectsDict[_.get(topCard, 'review.data.subject_id')] : null;
  const audio = usePronunciationAudio({
    subject: topSubject,
    preferredVoiceActorId,
    suppressPlayback: VOICE_CAPTURE_PHASES.has(voice.state.phase),
  });

  useEffect(() => {
    if (!autoplayAudio || detailsSubject) return;
    if (voice.state.phase === 'correct' || voice.state.phase === 'answer') {
      audio.play();
    }
  }, [autoplayAudio, voice.state.phase, topCard?.id, detailsSubject]);

  function startDeck(deckMeta) {
    if (!deckMeta?.subjects?.length) return;
    const shuffled = _.shuffle(deckMeta.subjects);
    setActiveDeckMeta(deckMeta);
    setPracticeSubjects(shuffled);
    setPracticeAssignments(createPracticeAssignments(shuffled));
  }

  function exitDeck() {
    audio.stop();
    voice.session.stop();
    setActiveDeckMeta(null);
    setPracticeAssignments(null);
    setPracticeSubjects(null);
  }

  const isSessionComplete = Boolean(activeDeckMeta) && voice.cards.length === 0;
  const completedCards = stats?.cards?.completed ?? 0;

  return (
    <Page style={[styles.page, { backgroundColor: colors.surface }]}>
      <View style={styles.column}>
        <TopBar
          style={styles.topBar}
          left={activeDeckMeta ? (
            <View style={[styles.iconCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
            </View>
          ) : null}
          leftLabel={activeDeckMeta ? 'Back to Extra Study decks' : undefined}
          leftOnPress={activeDeckMeta ? exitDeck : null}
          center={(
            <View style={styles.centerTitle}>
              <Text accessibilityRole="header" style={[theme.type.titleLarge, { color: colors.onSurface }]}>
                {activeDeckMeta ? activeDeckMeta.title : 'Extra Study'}
              </Text>
              <View style={[styles.modeChip, { backgroundColor: colors.secondaryContainer }]}>
                <Text style={[theme.type.labelSmall, { color: colors.onSecondaryContainer }]}>
                  Practice · No SRS impact
                </Text>
              </View>
            </View>
          )}
          right={!activeDeckMeta ? (
            <View style={[styles.iconCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialIcons name="refresh" size={20} color={colors.onSurface} />
            </View>
          ) : null}
          rightLabel={!activeDeckMeta ? 'Reload Extra Study decks' : undefined}
          rightOnPress={!activeDeckMeta ? reload : null}
        />

        <SubjectDetailsModal
          visible={Boolean(detailsSubject)}
          subject={detailsSubject}
          studyMaterial={detailsSubject ? studyMaterials.materialsBySubjectId[detailsSubject.id] : null}
          subjectsById={subjectsDict}
          token={token}
          preferredVoiceActorId={preferredVoiceActorId}
          onSaveStudyMaterial={studyMaterials.saveStudyMaterial}
          onClose={() => setDetailsSubject(null)}
        />

        {!activeDeckMeta && loading && <Message loading />}

        {!activeDeckMeta && !loading && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.deckList}>
            {decks.map(deck => {
              const count = deck.subjects.length;
              const toneColors = TONE_MAP(colors, deck.tone);
              return (
                <Pressable
                  key={deck.id}
                  disabled={count === 0}
                  accessibilityRole="button"
                  accessibilityLabel={`${deck.title}, ${count} items`}
                  onPress={() => startDeck(deck)}
                  android_ripple={{ color: colors.ripple }}
                  style={({ pressed }) => [
                    styles.deckCard,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      borderColor: colors.outlineVariant,
                      opacity: count === 0 ? 0.6 : pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={[styles.deckIcon, { backgroundColor: toneColors.bg }]}>
                    <MaterialIcons name={deck.icon} size={24} color={toneColors.fg} />
                  </View>
                  <View style={styles.deckCopy}>
                    <Text style={[theme.type.titleMedium, { color: colors.onSurface }]}>
                      {deck.title}
                    </Text>
                    <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>
                      {deck.subtitle}
                    </Text>
                  </View>
                  <View style={[styles.countPill, { backgroundColor: colors.surfaceContainerHighest }]}>
                    <Text style={[theme.type.labelMedium, { color: colors.onSurface }]}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {Boolean(activeDeckMeta) && voice.cards.length > 0 && (
          <>
            <Deck
              style={styles.deck}
              key={voiceControlsCard ? 'voice' : 'manual'}
              cards={voice.cards}
              swipe={voice.state.swipe}
              interactive={!voiceControlsCard}
              allowSkipping={skipMode}
              onReveal={() => {
                if (autoplayAudio && !detailsSubject) audio.play();
              }}
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
                const synonymsText = (studyMaterials.synonymsBySubjectId?.[subjectId] || []).join(', ');
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
                    synonymsText={synonymsText}
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
              <View style={styles.progressHeader}>
                <Text style={[theme.type.labelMedium, { color: colors.onSurface }]}>
                  Practice cards
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

        {isSessionComplete && (
          <View style={styles.doneWrapper}>
            <View style={[styles.doneCard, { backgroundColor: colors.successContainer }, theme.elevation.level1]}>
              <View style={[styles.doneIcon, { backgroundColor: colors.surfaceContainerLowest }]}>
                <MaterialIcons name="check-circle" size={30} color={colors.success} />
              </View>
              <Text accessibilityRole="header" style={[theme.type.headlineMedium, { color: colors.onSuccessContainer }]}>
                Practice complete!
              </Text>
              <Text style={[theme.type.bodyLarge, { color: colors.onSuccessContainer }]}>
                Your WaniKani SRS stages were unchanged.
              </Text>
            </View>
            <Button
              variant="filled"
              text="Reshuffle Deck"
              iconLeft={<MaterialIcons name="shuffle" size={18} color={colors.onPrimary} />}
              onPress={() => startDeck(activeDeckMeta)}
            />
            <Button
              variant="tonal"
              text="All Extra Study Decks"
              onPress={exitDeck}
            />
          </View>
        )}
      </View>
    </Page>
  );
};

ExtraStudyScreen.propTypes = {
  demo: PropTypes.bool,
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
  },
  topBar: {
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    alignItems: 'center',
    gap: 2,
  },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: theme.shape.full,
  },
  scroll: {
    flex: 1,
  },
  deckList: {
    gap: 12,
    paddingVertical: 8,
  },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: theme.shape.extraLarge,
    borderWidth: 1,
  },
  deckIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.shape.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckCopy: {
    flex: 1,
    gap: 2,
  },
  countPill: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.shape.full,
    alignItems: 'center',
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doneWrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  doneCard: {
    padding: 24,
    borderRadius: theme.shape.extraLarge,
    gap: 8,
    marginBottom: 6,
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

export default ExtraStudyScreen;
