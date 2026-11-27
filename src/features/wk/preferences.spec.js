import {
  mapWaniKaniPreferences,
  mergeDefaultSettings,
} from 'src/features/wk/preferences';
import {
  APPRENTICE_FIRST,
  AUTOPLAY_AUDIO,
  DEFAULT_VOICE_ACTOR_ID,
  LESSONS_BATCH_SIZE,
  LOWEST_LEVEL_FIRST,
  REVIEW_ORDER,
  SHOW_SRS_INDICATOR,
} from 'src/common/constants';

describe('WaniKani account preference sync', () => {
  test('maps WaniKani user preferences into local setting keys', () => {
    expect(mapWaniKaniPreferences({
      reviews_presentation_order: 'lower_levels_first',
      reviews_autoplay_audio: true,
      reviews_display_srs_indicator: false,
      default_voice_actor_id: 2,
      lessons_batch_size: 10,
    })).toEqual({
      [REVIEW_ORDER]: LOWEST_LEVEL_FIRST,
      [AUTOPLAY_AUDIO]: true,
      [SHOW_SRS_INDICATOR]: false,
      [DEFAULT_VOICE_ACTOR_ID]: 2,
      [LESSONS_BATCH_SIZE]: 10,
    });
  });

  test('seeds missing local keys without overwriting user overrides', () => {
    const existing = {
      [REVIEW_ORDER]: APPRENTICE_FIRST,
      [AUTOPLAY_AUDIO]: false,
    };
    const merged = mergeDefaultSettings(existing, {
      reviews_presentation_order: 'lower_levels_first',
      reviews_autoplay_audio: true,
      reviews_display_srs_indicator: true,
      default_voice_actor_id: 1,
      lessons_batch_size: 5,
    });
    expect(merged).toEqual({
      [REVIEW_ORDER]: APPRENTICE_FIRST,
      [AUTOPLAY_AUDIO]: false,
      [SHOW_SRS_INDICATOR]: true,
      [DEFAULT_VOICE_ACTOR_ID]: 1,
      [LESSONS_BATCH_SIZE]: 5,
    });
  });
});
