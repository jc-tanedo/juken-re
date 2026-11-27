import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Platform } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import Deck from 'src/components/Deck/Deck';
import Card from 'src/components/Card/Card';
import SubjectDetailsModal from 'src/components/SubjectDetails/SubjectDetailsModal';
import VoicePanel from 'src/features/voice/VoicePanel';
import { selectPronunciationAudio } from 'src/features/audio/audioSelector';
import extractSubject from 'src/utils/extractSubject';

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
}) => {
  const colors = theme[useColorScheme()];
  const {
    voice,
    cards,
    voiceControlsCard,
    audio,
    detailsSubject,
    openDetails,
    closeDetails,
    onRevealCard,
  } = studyDeck;

  return (
    <>
      <SubjectDetailsModal
        visible={Boolean(detailsSubject)}
        subject={detailsSubject}
        studyMaterial={detailsSubject ? studyMaterials?.materialsBySubjectId?.[detailsSubject.id] : null}
        subjectsById={subjectsDict}
        token={token}
        preferredVoiceActorId={preferredVoiceActorId}
        onSaveStudyMaterial={studyMaterials?.saveStudyMaterial}
        onClose={closeDetails}
      />

      {cards.length > 0 && (
        <Deck
          style={deckStyle}
          key={voiceControlsCard ? 'voice' : 'manual'}
          cards={cards}
          swipe={voice.state.swipe}
          interactive={!voiceControlsCard}
          allowSkipping={skipMode}
          onReveal={onRevealCard}
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
                onOpenDetails={subject ? () => openDetails(subject) : undefined}
                meaningMnemonic={meaningMnemonic}
                readingMnemonic={readingMnemonic}
                voiceControlled={voiceControlsCard}
                quickMode={quickMode}
              />
            );
          }}
        />
      )}

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
};

export default StudyDeck;
