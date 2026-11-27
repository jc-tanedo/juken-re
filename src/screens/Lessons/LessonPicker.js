import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import useLayoutMode from 'src/hooks/useLayoutMode';
import AdaptivePaneLayout from 'src/components/Layout/AdaptivePaneLayout';
import Button from 'src/components/Button/Button';
import M3Switch from 'src/components/Switch/Switch';
import SubjectChip from 'src/components/Subject/SubjectChip';
import { primaryMeaningFor } from 'src/utils/extractSubject';
import {
  buildTodayBatch,
  groupLessonsByLevelAndType,
} from 'src/features/lessons/lessonPlanner';

const BATCH_OPTIONS = [3, 5, 10, 15];

const LessonPicker = ({
  assignments = [],
  subjectsById = {},
  batchSize = 5,
  onBatchSizeChange,
  onStartBatch,
}) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const layout = useLayoutMode();
  const [interleave, setInterleave] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const advancedOpen = layout.isWide || showAdvanced;

  const todayBatch = useMemo(
    () => buildTodayBatch(assignments, subjectsById, { batchSize, interleave }),
    [assignments, subjectsById, batchSize, interleave],
  );

  const levelGroups = useMemo(
    () => groupLessonsByLevelAndType(assignments, subjectsById),
    [assignments, subjectsById],
  );

  const selectedAssignments = useMemo(
    () => assignments.filter(a => selectedIds.has(a.id)),
    [assignments, selectedIds],
  );

  function toggleItem(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (assignments.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.successContainer }, theme.elevation.level1]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerLowest }]}>
          <MaterialIcons name="school" size={28} color={colors.success} />
        </View>
        <Text accessibilityRole="header" style={[theme.type.headlineSmall, { color: colors.onSuccessContainer }]}>
          No lessons waiting
        </Text>
        <Text style={[theme.type.bodyMedium, { color: colors.onSuccessContainer }]}>
          Unlock more subjects by reviewing your active radicals and kanji.
        </Text>
      </View>
    );
  }

  const todayCard = (
    <View
      style={[
        styles.heroCard,
        { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
      ]}
    >
      <View style={styles.heroHeader}>
        <Text accessibilityRole="header" style={[theme.type.titleLarge, { color: colors.onSurface }]}>
          {"Today's Lessons"}
        </Text>
        <View style={[styles.availChip, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[theme.type.labelMedium, { color: colors.onPrimaryContainer }]}>
            {`${assignments.length} available`}
          </Text>
        </View>
      </View>

      <View style={styles.previewRow}>
        {todayBatch.map(assignment => (
          <SubjectChip
            key={assignment.id}
            subject={subjectsById[assignment.data?.subject_id]}
          />
        ))}
      </View>

      <View style={styles.optionRow}>
        <Text style={[theme.type.labelMedium, { color: colors.onSurfaceVariant }]}>
          Batch size
        </Text>
        <View style={styles.sizeChips}>
          {BATCH_OPTIONS.map(size => {
            const selected = batchSize === size;
            return (
              <Pressable
                key={size}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Batch size ${size}`}
                onPress={() => onBatchSizeChange?.(size)}
                style={[
                  styles.sizeChip,
                  {
                    backgroundColor: selected ? colors.secondaryContainer : colors.surfaceContainerHigh,
                    borderColor: selected ? colors.secondary : colors.outlineVariant,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.type.labelMedium,
                    { color: selected ? colors.onSecondaryContainer : colors.onSurfaceVariant },
                  ]}
                >
                  {String(size)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.interleaveRow}>
        <View style={styles.interleaveCopy}>
          <Text style={[theme.type.titleSmall, { color: colors.onSurface }]}>
            Interleave types
          </Text>
          <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>
            Mix radicals, kanji, and vocabulary inside each batch
          </Text>
        </View>
        <M3Switch value={interleave} onValueChange={setInterleave} />
      </View>

      <Button
        variant="filled"
        text={`Start Batch (${todayBatch.length})`}
        iconLeft={<MaterialIcons name="play-arrow" size={20} color={colors.onPrimary} />}
        onPress={() => onStartBatch?.(todayBatch)}
      />
    </View>
  );

  const advancedCard = (
    <View
      style={[
        styles.heroCard,
        { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: advancedOpen }}
        onPress={() => {
          if (!layout.isWide) setShowAdvanced(prev => !prev);
        }}
        style={styles.advancedHeader}
      >
        <View style={styles.interleaveCopy}>
          <Text style={[theme.type.titleMedium, { color: colors.onSurface }]}>
            Advanced Lesson Picker
          </Text>
          <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>
            Choose specific items grouped by level and subject type
          </Text>
        </View>
        {!layout.isWide && (
          <MaterialIcons
            name={advancedOpen ? 'expand-less' : 'expand-more'}
            size={22}
            color={colors.onSurfaceVariant}
          />
        )}
      </Pressable>

      {advancedOpen && (
        <View style={styles.groupsStack}>
          {levelGroups.map(({ level, groups }) => (
            <View key={level} style={styles.levelBlock}>
              <Text style={[theme.type.labelMedium, { color: colors.primary }]}>
                {`Level ${level}`}
              </Text>
              {groups.map(({ type, label, assignments: items }) => (
                <View key={type} style={styles.typeBlock}>
                  <Text style={[theme.type.labelSmall, { color: colors.onSurfaceVariant }]}>
                    {label}
                  </Text>
                  <View style={styles.previewRow}>
                    {items.map(assignment => {
                      const subject = subjectsById[assignment.data?.subject_id];
                      return (
                        <SubjectChip
                          key={assignment.id}
                          subject={subject}
                          selected={selectedIds.has(assignment.id)}
                          accessibilityLabel={`Select ${primaryMeaningFor(subject)}`}
                          onPress={() => toggleItem(assignment.id)}
                        />
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ))}

          <Button
            variant="tonal"
            disabled={selectedAssignments.length === 0}
            text={selectedAssignments.length > 0
              ? `Start ${selectedAssignments.length} Selected`
              : 'Select items above'}
            onPress={() => onStartBatch?.(selectedAssignments)}
          />
        </View>
      )}
    </View>
  );

  if (layout.isWide) {
    return (
      <AdaptivePaneLayout
        layout={layout}
        allowTabletop={false}
        primary={(
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {todayCard}
          </ScrollView>
        )}
        secondary={(
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {advancedCard}
          </ScrollView>
        )}
      />
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {todayCard}
      {advancedCard}
    </ScrollView>
  );
};

LessonPicker.propTypes = {
  assignments: PropTypes.array,
  subjectsById: PropTypes.object,
  batchSize: PropTypes.number,
  onBatchSizeChange: PropTypes.func,
  onStartBatch: PropTypes.func,
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  content: {
    gap: 12,
    paddingBottom: 16,
  },
  emptyCard: {
    width: '100%',
    padding: 24,
    borderRadius: theme.shape.extraLarge,
    gap: 8,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.shape.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    width: '100%',
    padding: 18,
    borderRadius: theme.shape.extraLarge,
    borderWidth: 1,
    gap: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  availChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.shape.full,
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sizeChips: {
    flexDirection: 'row',
    gap: 6,
  },
  sizeChip: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.shape.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  interleaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  interleaveCopy: {
    flex: 1,
    gap: 2,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  groupsStack: {
    gap: 14,
  },
  levelBlock: {
    gap: 8,
  },
  typeBlock: {
    gap: 6,
  },
});

export default LessonPicker;
