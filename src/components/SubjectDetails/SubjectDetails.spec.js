import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import SubjectDetails from 'src/components/SubjectDetails/SubjectDetails';
import { listPronunciationAudios } from 'src/features/audio/audioSelector';
import freeSubjects from 'src/mock/freeSubjects';

jest.mock('src/hooks/useColorScheme', () => () => 'light');
jest.mock('src/features/wk/cache', () => ({ getSubjectsByIds: jest.fn(async () => ({})) }));

const nativeTest = Platform.OS !== 'web' ? test : test.skip;

describe('SubjectDetails Item Info sheet', () => {
  nativeTest('renders dynamic subject info, context sentences, audio chips, and saves synonyms', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const kanaVocab = freeSubjects.find(s => s.object === 'kana_vocabulary');
    const onSave = jest.fn(async () => ({ ok: true }));
    const onPlay = jest.fn();
    const root = createRoot();

    try {
      await act(async () => {
        root.render(
          <SubjectDetails
            subject={kanaVocab}
            studyMaterial={{ data: { subject_id: kanaVocab.id, meaning_synonyms: ['Treat'], meaning_note: 'Sweet snack' } }}
            audioClips={listPronunciationAudios(kanaVocab)}
            onPlayAudio={onPlay}
            onSaveStudyMaterial={onSave}
          />,
        );
      });

      const json = JSON.stringify(root.container.toJSON());
      expect(json).toContain('おやつ');
      expect(json).toContain('Level 4');
      expect(json).toContain('Treat');
      expect(json).toContain('今日のおやつは何にしようか');
      expect(json).toContain('Kyoko');

      const audioButton = root.container.queryAll(
        n => n.props.accessibilityLabel === 'Play pronunciation by Kyoko',
      )[0];
      await act(async () => audioButton.props.onClick({ nativeEvent: {} }));
      expect(onPlay).toHaveBeenCalledTimes(1);

      const removeBtn = root.container.queryAll(
        n => n.props.accessibilityLabel === 'Remove synonym Treat',
      )[0];
      await act(async () => removeBtn.props.onClick({ nativeEvent: {} }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        subjectId: kanaVocab.id,
        meaningSynonyms: [],
      }));
    } finally {
      await act(async () => root.unmount());
    }
  });
});
