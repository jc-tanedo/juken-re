import {
  APPRENTICE_FIRST,
  AUTOPLAY_AUDIO,
  DEFAULT_VOICE_ACTOR_ID,
  LESSONS_BATCH_SIZE,
  LOWEST_LEVEL_FIRST,
  RANDOM_ORDER,
  REVIEW_ORDER,
  SHOW_SRS_INDICATOR,
} from 'src/common/constants';

export function mapWaniKaniPreferences(wkPrefs) {
  if (!wkPrefs || typeof wkPrefs !== 'object') return {};
  const mapped = {};

  if (wkPrefs.reviews_presentation_order === 'lower_levels_first') {
    mapped[REVIEW_ORDER] = LOWEST_LEVEL_FIRST;
  } else if (wkPrefs.reviews_presentation_order === 'lower_srs_stage_first') {
    mapped[REVIEW_ORDER] = APPRENTICE_FIRST;
  } else if (wkPrefs.reviews_presentation_order === 'shuffled') {
    mapped[REVIEW_ORDER] = RANDOM_ORDER;
  }

  if (typeof wkPrefs.reviews_autoplay_audio === 'boolean') {
    mapped[AUTOPLAY_AUDIO] = wkPrefs.reviews_autoplay_audio;
  }

  if (typeof wkPrefs.reviews_display_srs_indicator === 'boolean') {
    mapped[SHOW_SRS_INDICATOR] = wkPrefs.reviews_display_srs_indicator;
  }

  if (typeof wkPrefs.default_voice_actor_id === 'number') {
    mapped[DEFAULT_VOICE_ACTOR_ID] = wkPrefs.default_voice_actor_id;
  }

  if (typeof wkPrefs.lessons_batch_size === 'number' && wkPrefs.lessons_batch_size > 0) {
    mapped[LESSONS_BATCH_SIZE] = wkPrefs.lessons_batch_size;
  }

  return mapped;
}

/**
 * Populates initial local settings from WaniKani account preferences without
 * overwriting any preference the user explicitly customized in Juken.
 */
export function mergeDefaultSettings(existingSettings, wkPrefs) {
  const next = { ...(existingSettings || {}) };
  const defaults = mapWaniKaniPreferences(wkPrefs);
  for (const [key, value] of Object.entries(defaults)) {
    if (next[key] === undefined) {
      next[key] = value;
    }
  }
  return next;
}
