import {
  listPronunciationAudios,
  selectPronunciationAudio,
} from 'src/features/audio/audioSelector';

const sampleSubject = {
  id: 2502,
  data: {
    pronunciation_audios: [
      {
        url: 'https://cdn.example/kenichi.ogg',
        content_type: 'audio/ogg',
        metadata: { voice_actor_id: 2, voice_actor_name: 'Kenichi', pronunciation: 'ふたり' },
      },
      {
        url: 'https://cdn.example/kyoko.mp3',
        content_type: 'audio/mpeg',
        metadata: { voice_actor_id: 1, voice_actor_name: 'Kyoko', pronunciation: 'ふたり' },
      },
      {
        url: 'https://cdn.example/kenichi.mp3',
        content_type: 'audio/mpeg',
        metadata: { voice_actor_id: 2, voice_actor_name: 'Kenichi', pronunciation: 'ふたり' },
      },
    ],
  },
};

describe('pronunciation audio selector', () => {
  test('prefers audio/mpeg and respects user default voice actor ID', () => {
    expect(selectPronunciationAudio(sampleSubject, { preferredVoiceActorId: 2 })).toMatchObject({
      url: 'https://cdn.example/kenichi.mp3',
      voiceActorId: 2,
    });
    expect(selectPronunciationAudio(sampleSubject, { preferredVoiceActorId: 1 })).toMatchObject({
      url: 'https://cdn.example/kyoko.mp3',
      voiceActorId: 1,
    });
  });

  test('deduplicates clips by voice actor and pronunciation for Item Info', () => {
    const clips = listPronunciationAudios(sampleSubject);
    expect(clips).toHaveLength(2);
    expect(clips.map(c => c.contentType)).toEqual(['audio/mpeg', 'audio/mpeg']);
  });
});
