import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  listPronunciationAudios,
  selectPronunciationAudio,
} from 'src/features/audio/audioSelector';

function loadExpoAudio() {
  try {
    return require('expo-audio');
  } catch {
    return null;
  }
}

export default function usePronunciationAudio({
  subject,
  preferredVoiceActorId,
  reading,
  suppressPlayback = false,
} = {}) {
  const clips = useMemo(() => listPronunciationAudios(subject), [subject]);
  const activeClip = useMemo(
    () => selectPronunciationAudio(subject, { preferredVoiceActorId, reading }),
    [subject, preferredVoiceActorId, reading],
  );

  const [playingUrl, setPlayingUrl] = useState(null);
  const playerRef = useRef(null);

  const cleanupPlayer = useCallback(() => {
    const current = playerRef.current;
    playerRef.current = null;
    setPlayingUrl(null);
    if (!current) return;
    try {
      current.sub?.remove?.();
    } catch {}
    try {
      current.player?.pause?.();
      current.player?.remove?.();
    } catch {}
  }, []);

  const stop = useCallback(() => {
    cleanupPlayer();
  }, [cleanupPlayer]);

  const play = useCallback(clipOverride => {
    const target = clipOverride || activeClip;
    if (!target?.url || suppressPlayback) return false;

    const expoAudio = loadExpoAudio();
    if (!expoAudio?.createAudioPlayer) return false;

    cleanupPlayer();

    try {
      const player = expoAudio.createAudioPlayer(target.url);
      let sub = null;
      if (typeof player.addListener === 'function') {
        sub = player.addListener('playbackStatusUpdate', status => {
          if (status?.didJustFinish || (status?.isLoaded && status?.playing === false)) {
            setPlayingUrl(prev => (prev === target.url ? null : prev));
          }
        });
      }
      playerRef.current = { url: target.url, player, sub };
      setPlayingUrl(target.url);
      player.play?.();
      return true;
    } catch {
      cleanupPlayer();
      return false;
    }
  }, [activeClip, cleanupPlayer, suppressPlayback]);

  useEffect(() => {
    if (suppressPlayback) cleanupPlayer();
  }, [suppressPlayback, cleanupPlayer]);

  useEffect(() => {
    cleanupPlayer();
    return cleanupPlayer;
  }, [subject?.id, cleanupPlayer]);

  return {
    clips,
    activeClip,
    playing: Boolean(playingUrl),
    playingUrl,
    play,
    stop,
  };
}
