function normalizeAudioEntry(entry) {
  if (!entry?.url) return null;
  const meta = entry.metadata || {};
  return {
    url: entry.url,
    contentType: entry.content_type || '',
    voiceActorId: meta.voice_actor_id ?? null,
    voiceActorName: meta.voice_actor_name || 'Speaker',
    voiceDescription: meta.voice_description || '',
    gender: meta.gender || '',
    pronunciation: meta.pronunciation || '',
  };
}

function isMp3(clip) {
  return clip.contentType === 'audio/mpeg' || /\.mp3(?:$|\?)/i.test(clip.url);
}

/**
 * Returns deduplicated pronunciation clips for a subject, preferring MP3 over OGG/WebM.
 */
export function listPronunciationAudios(subject) {
  const raw = subject?.data?.pronunciation_audios;
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const normalized = raw.map(normalizeAudioEntry).filter(Boolean);
  normalized.sort((a, b) => Number(isMp3(b)) - Number(isMp3(a)));

  const seen = new Set();
  const deduped = [];
  for (const clip of normalized) {
    const key = `${clip.voiceActorId ?? clip.voiceActorName}:${clip.pronunciation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(clip);
  }
  return deduped;
}

/**
 * Picks the best matching audio clip honoring WaniKani's preferred voice actor ID and target reading.
 */
export function selectPronunciationAudio(subject, { preferredVoiceActorId, reading } = {}) {
  const raw = (subject?.data?.pronunciation_audios || []).map(normalizeAudioEntry).filter(Boolean);
  if (raw.length === 0) return null;

  const mp3s = raw.filter(isMp3);
  const pool = mp3s.length > 0 ? mp3s : raw;

  if (preferredVoiceActorId != null && reading) {
    const exact = pool.find(
      c => c.voiceActorId === preferredVoiceActorId && c.pronunciation === reading,
    );
    if (exact) return exact;
  }
  if (preferredVoiceActorId != null) {
    const actorMatch = pool.find(c => c.voiceActorId === preferredVoiceActorId);
    if (actorMatch) return actorMatch;
  }
  if (reading) {
    const readingMatch = pool.find(c => c.pronunciation === reading);
    if (readingMatch) return readingMatch;
  }
  return pool[0];
}
