import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'src/components/Modal/Modal';
import SubjectDetails from 'src/components/SubjectDetails/SubjectDetails';
import usePronunciationAudio from 'src/features/audio/usePronunciationAudio';

const SubjectDetailsModal = ({
  visible,
  subject,
  studyMaterial,
  subjectsById,
  token,
  preferredVoiceActorId,
  onSaveStudyMaterial,
  onClose,
}) => {
  const audio = usePronunciationAudio({
    subject: visible ? subject : null,
    preferredVoiceActorId,
  });

  const handleClose = () => {
    audio.stop();
    onClose?.();
  };

  return (
    <Modal
      presentation="page"
      visible={visible}
      navigationIcon="close"
      title="Item info"
      subtitle={subject?.data?.document_url ? `Level ${subject.data.level}` : undefined}
      onBack={handleClose}
      close={handleClose}
      closeAnimation={false}
    >
      <SubjectDetails
        subject={subject}
        studyMaterial={studyMaterial}
        subjectsById={subjectsById}
        token={token}
        audioClips={audio.clips}
        playingAudioUrl={audio.playingUrl}
        onPlayAudio={clip => audio.play(clip)}
        onSaveStudyMaterial={onSaveStudyMaterial}
      />
    </Modal>
  );
};

SubjectDetailsModal.propTypes = {
  visible: PropTypes.bool,
  subject: PropTypes.object,
  studyMaterial: PropTypes.object,
  subjectsById: PropTypes.object,
  token: PropTypes.string,
  preferredVoiceActorId: PropTypes.number,
  onSaveStudyMaterial: PropTypes.func,
  onClose: PropTypes.func,
};

export default SubjectDetailsModal;
