import React, { useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Radical from 'src/components/Radical/Radical';
import Subject from 'src/components/Subject/Subject';
import TextWithMarkups from 'src/components/TextWithMarkups/TextWithMarkups';
import Collapsible from 'src/components/Collapsible/Collapsible';
import TextInput from 'src/components/Input/TextInput';
import Button from 'src/components/Button/Button';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import wkCache from 'src/features/wk/cache';
import {
  KANJI,
  READING_TYPE_LABELS,
  TERMINOLOGY,
} from 'src/common/constants';

const SubjectSectionAnswers = ({ answers = [], renderMain }) => {
  const colors = theme[useColorScheme()];

  return (
    <View style={styles.sectionAnswers}>
      {answers.map((item, ind) => {
        const last = ind === answers.length - 1;
        const primary = item.primary;
        return (
          <Text
            key={ind}
            style={[
              styles.sectionAnswer,
              { color: primary ? colors.onSurface : colors.onSurfaceVariant },
              last && styles.sectionAnswerLast,
              primary && styles.sectionAnswerPrimary,
            ]}
          >
            {renderMain(item)}{last ? '' : ','}
          </Text>
        );
      })}
    </View>
  );
};

const SubjectChipRow = ({ title, ids, resolvedSubjects, scheme, colors }) => {
  if (!ids?.length) return null;

  return (
    <View style={styles.section}>
      <Collapsible
        title={title}
        contents={(
          <View style={styles.chipWrap}>
            {ids.map(id => {
              const item = resolvedSubjects[id];
              const subType = item?.object || KANJI;
              const subTheme = theme.subjectColors[scheme]?.[subType];
              const char = item?.data?.characters;
              const primaryMeaning = (item?.data?.meanings || []).find(m => m.primary)?.meaning
                || item?.data?.meanings?.[0]?.meaning
                || `#${id}`;

              return (
                <View
                  key={id}
                  style={[
                    styles.relatedChip,
                    { backgroundColor: subTheme?.container ?? colors.secondaryContainer },
                  ]}
                >
                  {char ? (
                    <Text style={[styles.relatedChar, { color: subTheme?.foreground ?? colors.onSecondaryContainer }]}>
                      {char}
                    </Text>
                  ) : item ? (
                    <Radical subject={item} size={18} color={subTheme?.foreground ?? colors.onSecondaryContainer} />
                  ) : null}
                  <Text
                    style={[
                      theme.type.labelMedium,
                      { color: subTheme?.foreground ?? colors.onSecondaryContainer },
                    ]}
                  >
                    {primaryMeaning}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      />
    </View>
  );
};

const SubjectDetails = ({
  subject,
  studyMaterial,
  subjectsById = {},
  token,
  audioClips = [],
  playingAudioUrl = null,
  onPlayAudio,
  onSaveStudyMaterial,
} = {}) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];

  const subjectId = _.get(subject, 'id');
  const subjectCharacters = _.get(subject, 'data.characters');
  const subjectLevel = _.get(subject, 'data.level');
  const subjectType = _.get(subject, 'object') || KANJI;
  const subjectTheme = theme.subjectColors[scheme]?.[subjectType];
  const partsOfSpeech = _.get(subject, 'data.parts_of_speech') || [];
  const contextSentences = _.get(subject, 'data.context_sentences') || [];
  const componentIds = _.get(subject, 'data.component_subject_ids') || [];
  const similarIds = _.get(subject, 'data.visually_similar_subject_ids') || [];

  const subjectMeanings = _.get(subject, 'data.meanings') || [];
  const subjectMeaningMnemonic = _.get(subject, 'data.meaning_mnemonic');
  const subjectMeaningHint = _.get(subject, 'data.meaning_hint');

  const subjectReadings = _.get(subject, 'data.readings') || [];
  const subjectReadingMnemonic = _.get(subject, 'data.reading_mnemonic');
  const subjectReadingHint = _.get(subject, 'data.reading_hint');

  const [synonymsDraft, setSynonymsDraft] = useState(
    () => studyMaterial?.data?.meaning_synonyms || [],
  );
  const [newSynonym, setNewSynonym] = useState('');
  const [meaningNoteDraft, setMeaningNoteDraft] = useState(
    () => studyMaterial?.data?.meaning_note || '',
  );
  const [readingNoteDraft, setReadingNoteDraft] = useState(
    () => studyMaterial?.data?.reading_note || '',
  );
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const [revealedSentences, setRevealedSentences] = useState({});
  const [extraSubjects, setExtraSubjects] = useState({});
  const attemptedIdsRef = useRef(new Set());

  useEffect(() => {
    setSynonymsDraft(studyMaterial?.data?.meaning_synonyms || []);
    setMeaningNoteDraft(studyMaterial?.data?.meaning_note || '');
    setReadingNoteDraft(studyMaterial?.data?.reading_note || '');
    setNewSynonym('');
    setSaveFeedback(null);
    setRevealedSentences({});
  }, [subjectId, studyMaterial]);

  const resolvedSubjects = useMemo(
    () => ({ ...subjectsById, ...extraSubjects }),
    [subjectsById, extraSubjects],
  );

  useEffect(() => {
    const allRelated = [...componentIds, ...similarIds];
    const missing = allRelated.filter(
      id => !resolvedSubjects[id] && !attemptedIdsRef.current.has(id),
    );
    if (!token || missing.length === 0) return undefined;

    for (const id of missing) attemptedIdsRef.current.add(id);
    let active = true;
    wkCache.getSubjectsByIds(token, missing).then(found => {
      if (active && found && Object.keys(found).length > 0) {
        setExtraSubjects(prev => ({ ...prev, ...found }));
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [token, subjectId]);

  if (!subject) return null;

  async function persistMaterial(nextSynonyms, nextMeaningNote, nextReadingNote) {
    if (!onSaveStudyMaterial) return;
    setSaving(true);
    setSaveFeedback(null);
    const result = await onSaveStudyMaterial({
      subjectId,
      meaningSynonyms: nextSynonyms,
      meaningNote: nextMeaningNote,
      readingNote: nextReadingNote,
    });
    setSaving(false);
    if (result?.ok) {
      setSaveFeedback({ tone: 'success', text: 'Saved to WaniKani' });
    } else if (result?.message) {
      setSaveFeedback({
        tone: result.permissionDenied ? 'warning' : 'error',
        text: result.message,
      });
    }
  }

  function handleAddSynonym() {
    const trimmed = newSynonym.trim();
    if (!trimmed) return;
    if (synonymsDraft.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSynonym('');
      return;
    }
    const next = [...synonymsDraft, trimmed].slice(0, 8);
    setSynonymsDraft(next);
    setNewSynonym('');
    persistMaterial(next, meaningNoteDraft, readingNoteDraft);
  }

  function handleRemoveSynonym(target) {
    const next = synonymsDraft.filter(s => s !== target);
    setSynonymsDraft(next);
    persistMaterial(next, meaningNoteDraft, readingNoteDraft);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.metaRow}>
        <View style={[styles.metaChip, { backgroundColor: subjectTheme?.container ?? colors.secondaryContainer }]}>
          <Text style={[theme.type.labelMedium, { color: subjectTheme?.foreground ?? colors.onSecondaryContainer }]}>
            {TERMINOLOGY[subjectType] || subjectType}
          </Text>
        </View>
        {subjectLevel != null && (
          <View style={[styles.metaChip, { backgroundColor: colors.surfaceContainerHighest }]}>
            <Text style={[theme.type.labelMedium, { color: colors.onSurfaceVariant }]}>
              {`Level ${subjectLevel}`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.subjectWrapper}>
        <View style={[styles.subjectTile, { backgroundColor: subjectTheme?.container ?? colors.primaryContainer }]}>
          <Subject
            subjectCharacters={subjectCharacters || <Radical subject={subject} size={56} />}
            subjectType={subjectType}
          />
        </View>
      </View>

      {(partsOfSpeech.length > 0 || audioClips.length > 0) && (
        <View style={styles.pillRow}>
          {partsOfSpeech.map(pos => (
            <View key={pos} style={[styles.smallPill, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={[theme.type.labelSmall, { color: colors.onSurfaceVariant }]}>{pos}</Text>
            </View>
          ))}
          {audioClips.map(clip => {
            const isPlaying = playingAudioUrl === clip.url;
            return (
              <Pressable
                key={clip.url}
                accessibilityRole="button"
                accessibilityLabel={`Play pronunciation by ${clip.voiceActorName}`}
                onPress={() => onPlayAudio?.(clip)}
                style={[
                  styles.audioPill,
                  { backgroundColor: isPlaying ? colors.primary : colors.primaryContainer },
                ]}
              >
                <MaterialIcons
                  name={isPlaying ? 'graphic-eq' : 'volume-up'}
                  size={16}
                  color={isPlaying ? colors.onPrimary : colors.onPrimaryContainer}
                />
                <Text
                  style={[
                    theme.type.labelSmall,
                    { color: isPlaying ? colors.onPrimary : colors.onPrimaryContainer },
                  ]}
                >
                  {clip.voiceActorName}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.section}>
        <Collapsible
          title="Meaning"
          contents={(
            <View style={styles.sectionStack}>
              <SubjectSectionAnswers
                answers={subjectMeanings}
                renderMain={item => item.meaning}
              />

              {synonymsDraft.length > 0 && (
                <View style={styles.synonymChips}>
                  {synonymsDraft.map(syn => (
                    <Pressable
                      key={syn}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove synonym ${syn}`}
                      onPress={() => handleRemoveSynonym(syn)}
                      style={[styles.synonymChip, { backgroundColor: colors.secondaryContainer }]}
                    >
                      <Text style={[theme.type.labelMedium, { color: colors.onSecondaryContainer }]}>
                        {syn}
                      </Text>
                      <MaterialIcons name="close" size={14} color={colors.onSecondaryContainer} />
                    </Pressable>
                  ))}
                </View>
              )}

              {onSaveStudyMaterial && (
                <View style={styles.addRow}>
                  <View style={styles.addInput}>
                    <TextInput
                      label="Add personal synonym"
                      value={newSynonym}
                      onChangeText={setNewSynonym}
                      onSubmitEditing={handleAddSynonym}
                      returnKeyType="done"
                    />
                  </View>
                  <Button
                    variant="tonal"
                    text="Add"
                    disabled={saving || !newSynonym.trim()}
                    style={styles.addBtn}
                    onPress={handleAddSynonym}
                  />
                </View>
              )}

              {subjectMeaningMnemonic && (
                <>
                  <Text style={[styles.sectionSubTitle, { color: colors.onSurfaceVariant }]}>
                    Mnemonic
                  </Text>
                  <TextWithMarkups text={subjectMeaningMnemonic} />
                </>
              )}
              {subjectMeaningHint && (
                <>
                  <Text style={[styles.sectionSubTitle, { color: colors.onSurfaceVariant }]}>
                    Hint
                  </Text>
                  <TextWithMarkups text={subjectMeaningHint} />
                </>
              )}
            </View>
          )}
        />
      </View>

      {subjectReadings.length > 0 && (
        <View style={styles.section}>
          <Collapsible
            title="Reading"
            contents={(
              <View style={styles.sectionStack}>
                <SubjectSectionAnswers
                  answers={subjectReadings}
                  renderMain={item => (
                    item.type && READING_TYPE_LABELS[item.type]
                      ? `${item.reading} (${READING_TYPE_LABELS[item.type]})`
                      : item.reading
                  )}
                />
                {subjectReadingMnemonic && (
                  <>
                    <Text style={[styles.sectionSubTitle, { color: colors.onSurfaceVariant }]}>
                      Mnemonic
                    </Text>
                    <TextWithMarkups text={subjectReadingMnemonic} />
                  </>
                )}
                {subjectReadingHint && (
                  <>
                    <Text style={[styles.sectionSubTitle, { color: colors.onSurfaceVariant }]}>
                      Hint
                    </Text>
                    <TextWithMarkups text={subjectReadingHint} />
                  </>
                )}
              </View>
            )}
          />
        </View>
      )}

      {onSaveStudyMaterial && (
        <View style={styles.section}>
          <Collapsible
            title="Personal Notes"
            contents={(
              <View style={styles.sectionStack}>
                <TextInput
                  label="Meaning note"
                  multiline
                  value={meaningNoteDraft}
                  onChangeText={setMeaningNoteDraft}
                />
                {subjectReadings.length > 0 && (
                  <TextInput
                    label="Reading note"
                    multiline
                    value={readingNoteDraft}
                    onChangeText={setReadingNoteDraft}
                  />
                )}
                <Button
                  variant="tonal"
                  text={saving ? 'Saving…' : 'Save notes'}
                  disabled={saving}
                  onPress={() => persistMaterial(synonymsDraft, meaningNoteDraft, readingNoteDraft)}
                />
                {saveFeedback && (
                  <Text
                    style={[
                      theme.type.bodySmall,
                      {
                        color: saveFeedback.tone === 'success'
                          ? colors.success
                          : saveFeedback.tone === 'warning'
                            ? colors.warning
                            : colors.error,
                      },
                    ]}
                  >
                    {saveFeedback.text}
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      )}

      {contextSentences.length > 0 && (
        <View style={styles.section}>
          <Collapsible
            title="Context Sentences"
            contents={(
              <View style={styles.sectionStack}>
                {contextSentences.map((sentence, idx) => {
                  const translationOpen = Boolean(revealedSentences[idx]);
                  return (
                    <Pressable
                      key={idx}
                      accessibilityRole="button"
                      onPress={() => setRevealedSentences(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      style={[styles.sentenceCard, { backgroundColor: colors.surfaceContainer }]}
                    >
                      <Text style={[theme.type.bodyLarge, { color: colors.onSurface }]}>
                        {sentence.ja}
                      </Text>
                      <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>
                        {translationOpen ? sentence.en : 'Tap to reveal English translation'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </View>
      )}

      <SubjectChipRow
        title="Radical / Kanji Components"
        ids={componentIds}
        resolvedSubjects={resolvedSubjects}
        scheme={scheme}
        colors={colors}
      />

      <SubjectChipRow
        title="Visually Similar"
        ids={similarIds}
        resolvedSubjects={resolvedSubjects}
        scheme={scheme}
        colors={colors}
      />
    </View>
  );
};

SubjectDetails.propTypes = {
  subject: PropTypes.object,
  studyMaterial: PropTypes.object,
  subjectsById: PropTypes.object,
  token: PropTypes.string,
  audioClips: PropTypes.array,
  playingAudioUrl: PropTypes.string,
  onPlayAudio: PropTypes.func,
  onSaveStudyMaterial: PropTypes.func,
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.shape.full,
  },
  subjectWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectTile: {
    minWidth: 104,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.shape.extraLarge,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.shape.full,
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.shape.full,
  },
  section: {
    marginTop: 12,
  },
  sectionStack: {
    gap: 10,
  },
  sectionAnswers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionAnswer: {
    ...theme.type.titleMedium,
    marginRight: 8,
    marginBottom: 2,
  },
  sectionAnswerLast: { marginRight: 0 },
  sectionAnswerPrimary: { fontWeight: '700' },
  sectionSubTitle: {
    marginTop: 4,
    ...theme.type.labelMedium,
  },
  synonymChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synonymChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.shape.full,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addInput: {
    flex: 1,
  },
  addBtn: {
    width: 'auto',
    paddingHorizontal: 18,
  },
  sentenceCard: {
    padding: 12,
    borderRadius: theme.shape.medium,
    gap: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.shape.full,
  },
  relatedChar: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SubjectDetails;
