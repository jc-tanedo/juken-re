import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Platform, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import device from 'src/utils/device';
import Deck from 'src/components/Deck/Deck';
import Card from 'src/components/Card/Card';
import Button from 'src/components/Button/Button';
import LongPressButton from 'src/components/Button/LongPressButton';
import SubjectDetailsModal from 'src/components/SubjectDetails/SubjectDetailsModal';
import AdaptivePaneLayout from 'src/components/Layout/AdaptivePaneLayout';
import StudyCompanionPane from 'src/components/Deck/StudyCompanionPane';
import VoicePanel from 'src/features/voice/VoicePanel';
import { selectPronunciationAudio } from 'src/features/audio/audioSelector';
import extractSubject from 'src/utils/extractSubject';
import {
  ANSWER_INPUT_BOTH,
  ANSWER_INPUT_BUTTONS,
  ANSWER_INPUT_SWIPE,
  CARD_SIDE_LEFT,
  CARD_SIDE_RIGHT,
} from 'src/common/constants';

const StudyDeck = ({
  studyDeck,
  subjectsDict = {},
  studyMaterials,
  token,
  preferredVoiceActorId,
  speechModeLabel,
  skipMode,
  quickMode,
  deckStyle,
  onOpenVoiceSettings,
  layout,
  cardSide = CARD_SIDE_RIGHT,
  answerInputMode = ANSWER_INPUT_BOTH,
  progressSlot,
}) => {
  const colors = theme[useColorScheme()];
  const {
    voice,
    cards,
    topCard,
    topSubject,
    isTopRevealed,
    setTopCardRevealed,
    expandedDetails,
    setExpandedDetails,
    deckActionsRef,
    voiceControlsCard,
    audio,
    detailsSubject,
    openDetails,
    closeDetails,
    onRevealCard,
  } = studyDeck;

  const useTabletop = Boolean(layout?.isTabletop);
  const useSideCompanion = Boolean(layout?.isWide && !useTabletop);
  const useAdaptiveCompanion = useTabletop || useSideCompanion;
  const allowSwipe = answerInputMode !== ANSWER_INPUT_BUTTONS;
  const showAnswerButtons = answerInputMode !== ANSWER_INPUT_SWIPE && !useTabletop;

  const deckElement = cards.length > 0 ? (
    <Deck
      style={useTabletop
        ? [deckStyle, styles.tabletopDeck]
        : useSideCompanion
          ? [deckStyle, styles.sideCompanionDeck]
          : deckStyle}
      key={voiceControlsCard ? 'voice' : 'manual'}
      cards={cards}
      swipe={voice.state.swipe}
      interactive={!voiceControlsCard}
      allowSkipping={skipMode}
      allowSwipe={allowSwipe}
      onReveal={onRevealCard}
      onRevealedChange={setTopCardRevealed}
      actionsRef={deckActionsRef}
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
        const synonymsText = (studyMaterials?.synonymsBySubjectId?.[subjectId] || []).join(', ');
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
            onOpenDetails={subject ? () => (
              useSideCompanion ? setExpandedDetails(true) : openDetails(subject)
            ) : undefined}
            meaningMnemonic={meaningMnemonic}
            readingMnemonic={readingMnemonic}
            voiceControlled={voiceControlsCard}
            quickMode={quickMode}
            allowSwipe={allowSwipe}
          />
        );
      }}
    />
  ) : null;

  const topSubjectId = topSubject?.id;
  const showExternalControls = cards.length > 0 && !useTabletop && !voiceControlsCard && (showAnswerButtons || !quickMode);
  const actionBarElement = showExternalControls ? (
    <View style={styles.actionSlot}>
      {showAnswerButtons && (isTopRevealed || (skipMode && quickMode)) ? (
        <View style={styles.answerActions}>
          <Button
            variant="tonal"
            text="Missed"
            style={[styles.answerBtn, { backgroundColor: colors.errorContainer }]}
            textStyle={{ color: colors.onErrorContainer }}
            iconLeft={<MaterialIcons name="close" size={18} color={colors.onErrorContainer} />}
            onPress={() => deckActionsRef?.current?.swipeLeft?.()}
          />
          <Button
            variant="tonal"
            text="Correct"
            style={[styles.answerBtn, { backgroundColor: colors.successContainer }]}
            textStyle={{ color: colors.onSuccessContainer }}
            iconLeft={<MaterialIcons name="check" size={18} color={colors.onSuccessContainer} />}
            onPress={() => deckActionsRef?.current?.swipeRight?.()}
          />
        </View>
      ) : !isTopRevealed ? (
        !quickMode ? (
          <LongPressButton
            key={topCard?.id || 'reveal'}
            text="Reveal"
            flashText={`Press and Hold${device('web') ? ' / Spacebar' : ''}`}
            onComplete={() => deckActionsRef?.current?.reveal?.()}
          />
        ) : (
          <Button
            variant="tonal"
            text="Reveal"
            style={{ backgroundColor: colors.primaryContainer }}
            textStyle={{ color: colors.onPrimaryContainer }}
            iconLeft={<MaterialIcons name="visibility" size={20} color={colors.onPrimaryContainer} />}
            onPress={() => deckActionsRef?.current?.reveal?.()}
          />
        )
      ) : null}
    </View>
  ) : null;

  const companionElement = cards.length > 0 && useAdaptiveCompanion ? (
    <StudyCompanionPane
      topCard={topCard}
      subject={topSubject}
      studyMaterial={topSubjectId ? studyMaterials?.materialsBySubjectId?.[topSubjectId] : null}
      subjectsById={subjectsDict}
      synonyms={topSubjectId ? (studyMaterials?.synonymsBySubjectId?.[topSubjectId] || []) : []}
      token={token}
      isRevealed={isTopRevealed}
      expandedDetails={expandedDetails}
      onToggleExpandedDetails={setExpandedDetails}
      onOpenDetailsModal={openDetails}
      audio={audio}
      voice={voice}
      voiceControlsCard={voiceControlsCard}
      speechModeLabel={speechModeLabel}
      onOpenVoiceSettings={onOpenVoiceSettings}
      deckActionsRef={deckActionsRef}
      progressSlot={progressSlot}
      isTabletop={useTabletop}
      onSaveStudyMaterial={studyMaterials?.saveStudyMaterial}
    />
  ) : null;

  return (
    <>
      <SubjectDetailsModal
        visible={Boolean(detailsSubject) && !useSideCompanion}
        subject={detailsSubject}
        studyMaterial={detailsSubject ? studyMaterials?.materialsBySubjectId?.[detailsSubject.id] : null}
        subjectsById={subjectsDict}
        token={token}
        preferredVoiceActorId={preferredVoiceActorId}
        onSaveStudyMaterial={studyMaterials?.saveStudyMaterial}
        onClose={closeDetails}
      />

      {useAdaptiveCompanion && deckElement ? (
        <AdaptivePaneLayout
          layout={layout}
          reverseWide={cardSide !== CARD_SIDE_LEFT}
          primaryStyle={useSideCompanion ? styles.deckPaneCentered : undefined}
          primary={(
            <>
              {deckElement}
              {actionBarElement}
            </>
          )}
          secondary={companionElement}
        />
      ) : deckElement ? (
        <View style={styles.compactWrapper}>
          {deckElement}
          {actionBarElement}
          {Platform.OS === 'android' && (
            <VoicePanel
              state={voice.state}
              session={voice.session}
              colors={colors}
              engineLabel={speechModeLabel}
              onOpenVoiceSettings={onOpenVoiceSettings}
            />
          )}
          {progressSlot}
        </View>
      ) : null}
    </>
  );
};

StudyDeck.propTypes = {
  studyDeck: PropTypes.object.isRequired,
  subjectsDict: PropTypes.object,
  studyMaterials: PropTypes.object,
  token: PropTypes.string,
  preferredVoiceActorId: PropTypes.number,
  speechModeLabel: PropTypes.string,
  skipMode: PropTypes.bool,
  quickMode: PropTypes.bool,
  deckStyle: PropTypes.any,
  onOpenVoiceSettings: PropTypes.func,
  layout: PropTypes.object,
  cardSide: PropTypes.oneOf([CARD_SIDE_LEFT, CARD_SIDE_RIGHT]),
  answerInputMode: PropTypes.oneOf([ANSWER_INPUT_SWIPE, ANSWER_INPUT_BUTTONS, ANSWER_INPUT_BOTH]),
  progressSlot: PropTypes.node,
};

const styles = StyleSheet.create({
  compactWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  sideCompanionDeck: {
    width: '100%',
    flex: 1,
    maxHeight: 420,
  },
  tabletopDeck: {
    width: '100%',
    flex: 1,
    maxHeight: '100%',
  },
  deckPaneCentered: {
    justifyContent: 'center',
  },
  actionSlot: {
    width: '100%',
    height: 56,
    marginTop: 12,
    justifyContent: 'center',
    flexShrink: 0,
  },
  answerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  answerBtn: {
    flex: 1,
    paddingHorizontal: 14,
  },
});

export default StudyDeck;
