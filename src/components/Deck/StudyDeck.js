import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Platform, StyleSheet } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import Deck from 'src/components/Deck/Deck';
import Card from 'src/components/Card/Card';
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
            skipMode={skipMode}
            allowSwipe={allowSwipe}
            showAnswerButtons={showAnswerButtons}
          />
        );
      }}
    />
  ) : null;

  const topSubjectId = topSubject?.id;
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
          primary={deckElement}
          secondary={companionElement}
        />
      ) : (
        <>
          {deckElement}
          {Platform.OS === 'android' && cards.length > 0 && (
            <VoicePanel
              state={voice.state}
              session={voice.session}
              colors={colors}
              engineLabel={speechModeLabel}
              onOpenVoiceSettings={onOpenVoiceSettings}
            />
          )}
        </>
      )}
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
  sideCompanionDeck: {
    width: '100%',
    flex: 1,
    maxHeight: 460,
  },
  tabletopDeck: {
    width: '100%',
    flex: 1,
    maxHeight: '100%',
  },
  deckPaneCentered: {
    justifyContent: 'center',
  },
});

export default StudyDeck;
