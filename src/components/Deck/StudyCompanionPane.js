import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import Button from 'src/components/Button/Button';
import TextWithMarkups from 'src/components/TextWithMarkups/TextWithMarkups';
import SubjectDetails from 'src/components/SubjectDetails/SubjectDetails';
import VoicePanel from 'src/features/voice/VoicePanel';
import extractSubject from 'src/utils/extractSubject';
import { READING, TERMINOLOGY } from 'src/common/constants';

/**
 * Companion study pane for unfolded wide screens (live mnemonics, audio, and item details
 * beside the flashcard deck) and bottom-half controls for half-folded Tabletop Mode.
 */
const StudyCompanionPane = ({
  topCard,
  subject,
  studyMaterial,
  subjectsById = {},
  synonyms = [],
  token,
  isRevealed = false,
  expandedDetails = false,
  onToggleExpandedDetails,
  onOpenDetailsModal,
  audio,
  voice,
  voiceControlsCard = false,
  speechModeLabel,
  onOpenVoiceSettings,
  deckActionsRef,
  progressSlot,
  isTabletop = false,
  onSaveStudyMaterial,
}) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];

  const reviewType = topCard?.reviewType;
  const subjectType = _.get(subject, 'object');
  const subjectLevel = _.get(subject, 'data.level');
  const subjectTheme = theme.subjectColors[scheme]?.[subjectType];
  const isReading = reviewType === READING;
  const extracted = subject && reviewType ? extractSubject(subject, reviewType) : null;
  const mnemonic = isReading
    ? _.get(subject, 'data.reading_mnemonic')
    : _.get(subject, 'data.meaning_mnemonic');
  const hint = isReading
    ? _.get(subject, 'data.reading_hint')
    : _.get(subject, 'data.meaning_hint');

  const voicePanel = Platform.OS === 'android' ? (
    <VoicePanel
      state={voice.state}
      session={voice.session}
      colors={colors}
      engineLabel={speechModeLabel}
      onOpenVoiceSettings={onOpenVoiceSettings}
    />
  ) : null;

  if (isTabletop) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.tabletopContent}
        showsVerticalScrollIndicator={false}
      >
        {voicePanel}

        {!voiceControlsCard && (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            {!isRevealed ? (
              <Button
                variant="filled"
                text="Reveal Answer"
                iconLeft={<MaterialIcons name="visibility" size={18} color={colors.onPrimary} />}
                onPress={() => deckActionsRef?.current?.reveal?.()}
              />
            ) : (
              <>
                <View style={styles.tabletopActions}>
                  <Button
                    variant="outlined"
                    text="Missed"
                    style={[styles.splitBtn, { borderColor: colors.error }]}
                    textStyle={{ color: colors.error }}
                    iconLeft={<MaterialIcons name="close" size={18} color={colors.error} />}
                    onPress={() => deckActionsRef?.current?.swipeLeft?.()}
                  />
                  <Button
                    variant="filled"
                    text="Correct"
                    style={styles.splitBtn}
                    iconLeft={<MaterialIcons name="check" size={18} color={colors.onPrimary} />}
                    onPress={() => deckActionsRef?.current?.swipeRight?.()}
                  />
                </View>

                {(audio?.clips?.length > 0 || subject) && (
                  <View style={styles.chipRow}>
                    {audio?.clips?.length > 0 && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Play pronunciation"
                        onPress={() => audio.play?.()}
                        style={[
                          styles.assistChip,
                          {
                            backgroundColor: audio.playing ? colors.primary : colors.surfaceContainerHigh,
                            borderColor: colors.outlineVariant,
                          },
                        ]}
                      >
                        <MaterialIcons
                          name={audio.playing ? 'graphic-eq' : 'volume-up'}
                          size={16}
                          color={audio.playing ? colors.onPrimary : colors.primary}
                        />
                        <Text
                          style={[
                            theme.type.labelMedium,
                            { color: audio.playing ? colors.onPrimary : colors.onSurface },
                          ]}
                        >
                          Listen
                        </Text>
                      </Pressable>
                    )}
                    {subject && onOpenDetailsModal && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Item info"
                        onPress={() => onOpenDetailsModal(subject)}
                        style={[
                          styles.assistChip,
                          { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
                        ]}
                      >
                        <MaterialIcons name="info-outline" size={16} color={colors.primary} />
                        <Text style={[theme.type.labelMedium, { color: colors.onSurface }]}>
                          Item info
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {progressSlot}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.wideContent}
      showsVerticalScrollIndicator={false}
    >
      {!isRevealed ? (
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
          <View style={styles.headerRow}>
            {subjectType && (
              <View style={[styles.badge, { backgroundColor: subjectTheme?.container ?? colors.secondaryContainer }]}>
                <Text style={[theme.type.labelMedium, { color: subjectTheme?.foreground ?? colors.onSecondaryContainer }]}>
                  {TERMINOLOGY[subjectType] || subjectType}
                </Text>
              </View>
            )}
            {reviewType && (
              <View style={[styles.badge, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={[theme.type.labelMedium, { color: colors.onSurfaceVariant }]}>
                  {extracted?.readingTypeLabel
                    ? `${TERMINOLOGY[reviewType]} · ${extracted.readingTypeLabel}`
                    : TERMINOLOGY[reviewType] || reviewType}
                </Text>
              </View>
            )}
          </View>
          <Text style={[theme.type.titleSmall, { color: colors.onSurface }]}>
            Study companion
          </Text>
          <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>
            Reveal the card to view its mnemonic, pronunciation audio, and item info right alongside your deck.
          </Text>
        </View>
      ) : expandedDetails && subject ? (
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
          <View style={styles.headerRowBetween}>
            <Text accessibilityRole="header" style={[theme.type.titleMedium, { color: colors.onSurface }]}>
              Item info
            </Text>
            <Button
              variant="tonal"
              text="Compact view"
              style={styles.compactBtn}
              onPress={() => onToggleExpandedDetails?.(false)}
            />
          </View>
          <SubjectDetails
            subject={subject}
            studyMaterial={studyMaterial}
            subjectsById={subjectsById}
            token={token}
            audioClips={audio?.clips || []}
            playingAudioUrl={audio?.playingUrl || null}
            onPlayAudio={clip => audio?.play?.(clip)}
            onSaveStudyMaterial={onSaveStudyMaterial}
            style={styles.embeddedDetails}
          />
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
          <View style={styles.headerRowBetween}>
            <View style={styles.headerRow}>
              {subjectType && (
                <View style={[styles.badge, { backgroundColor: subjectTheme?.container ?? colors.secondaryContainer }]}>
                  <Text style={[theme.type.labelMedium, { color: subjectTheme?.foreground ?? colors.onSecondaryContainer }]}>
                    {TERMINOLOGY[subjectType] || subjectType}
                  </Text>
                </View>
              )}
              {subjectLevel != null && (
                <View style={[styles.badge, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <Text style={[theme.type.labelMedium, { color: colors.onSurfaceVariant }]}>
                    {`Level ${subjectLevel}`}
                  </Text>
                </View>
              )}
            </View>
            {subject && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Full item info"
                onPress={() => onToggleExpandedDetails?.(true)}
                style={[
                  styles.assistChip,
                  { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
                ]}
              >
                <MaterialIcons name="info-outline" size={16} color={colors.primary} />
                <Text style={[theme.type.labelMedium, { color: colors.onSurface }]}>
                  Item info
                </Text>
              </Pressable>
            )}
          </View>

          {!!extracted?.answer && (
            <View style={styles.answerBlock}>
              <Text style={[theme.type.headlineSmall, { color: colors.onSurface }]}>
                {extracted.answer}
              </Text>
              {!isReading && synonyms.length > 0 && (
                <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>
                  {`Synonyms: ${synonyms.join(', ')}`}
                </Text>
              )}
            </View>
          )}

          {audio?.clips?.length > 0 && (
            <View style={styles.chipRow}>
              {audio.clips.map(clip => {
                const active = audio.playingUrl === clip.url;
                return (
                  <Pressable
                    key={clip.url}
                    accessibilityRole="button"
                    accessibilityLabel={`Play pronunciation by ${clip.voiceActorName}`}
                    onPress={() => audio.play?.(clip)}
                    style={[
                      styles.assistChip,
                      {
                        backgroundColor: active ? colors.primary : colors.primaryContainer,
                        borderColor: active ? colors.primary : colors.outlineVariant,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={active ? 'graphic-eq' : 'volume-up'}
                      size={16}
                      color={active ? colors.onPrimary : colors.onPrimaryContainer}
                    />
                    <Text
                      style={[
                        theme.type.labelMedium,
                        { color: active ? colors.onPrimary : colors.onPrimaryContainer },
                      ]}
                    >
                      {clip.voiceActorName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {(!!mnemonic || !!hint) && (
            <View style={[styles.mnemonicBox, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={[theme.type.labelMedium, { color: colors.onSurfaceVariant }]}>
                {isReading ? 'Reading mnemonic' : 'Meaning mnemonic'}
              </Text>
              {!!mnemonic && <TextWithMarkups text={mnemonic} />}
              {!!hint && <TextWithMarkups text={hint} />}
            </View>
          )}
        </View>
      )}

      {voicePanel}
      {progressSlot}
    </ScrollView>
  );
};

StudyCompanionPane.propTypes = {
  topCard: PropTypes.object,
  subject: PropTypes.object,
  studyMaterial: PropTypes.object,
  subjectsById: PropTypes.object,
  synonyms: PropTypes.array,
  token: PropTypes.string,
  isRevealed: PropTypes.bool,
  expandedDetails: PropTypes.bool,
  onToggleExpandedDetails: PropTypes.func,
  onOpenDetailsModal: PropTypes.func,
  audio: PropTypes.object,
  voice: PropTypes.object.isRequired,
  voiceControlsCard: PropTypes.bool,
  speechModeLabel: PropTypes.string,
  onOpenVoiceSettings: PropTypes.func,
  deckActionsRef: PropTypes.object,
  progressSlot: PropTypes.node,
  isTabletop: PropTypes.bool,
  onSaveStudyMaterial: PropTypes.func,
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  wideContent: {
    gap: 12,
    paddingBottom: 12,
  },
  tabletopContent: {
    gap: 10,
    paddingBottom: 8,
  },
  card: {
    width: '100%',
    padding: 16,
    borderRadius: theme.shape.extraLarge,
    borderWidth: 1,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  headerRowBetween: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.shape.full,
  },
  answerBlock: {
    gap: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.shape.full,
    borderWidth: 1,
  },
  mnemonicBox: {
    padding: 12,
    borderRadius: theme.shape.large,
    gap: 6,
  },
  compactBtn: {
    width: 'auto',
    minHeight: 36,
    paddingHorizontal: 14,
  },
  embeddedDetails: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  tabletopActions: {
    flexDirection: 'row',
    gap: 10,
  },
  splitBtn: {
    flex: 1,
  },
});

export default StudyCompanionPane;
