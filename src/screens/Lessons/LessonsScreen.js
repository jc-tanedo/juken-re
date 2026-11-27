import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { StyleSheet, Text, View } from 'react-native';
import { useStoreActions, useStoreState } from 'easy-peasy';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import Page from 'src/components/Page/Page';
import TopBar from 'src/components/TopBar/TopBar';
import Message from 'src/screens/Message/Message';
import LessonPicker from 'src/screens/Lessons/LessonPicker';
import LessonSession from 'src/screens/Lessons/LessonSession';
import useLessons from 'src/features/lessons/useLessons';
import { LESSONS_BATCH_SIZE } from 'src/common/constants';

const LessonsScreen = ({ demo = false } = {}) => {
  const token = useStoreState(state => state?.session?.token);
  const userSettings = useStoreState(state => state?.session?.userSettings);
  const saveSetting = useStoreActions(actions => actions?.session?.saveSetting);

  const colors = theme[useColorScheme()];
  const batchSize = _.get(userSettings, LESSONS_BATCH_SIZE, 5);
  const [activeBatch, setActiveBatch] = useState(null);

  const {
    assignments,
    subjectsById,
    loading,
    reload,
    unlockAssignment,
  } = useLessons({ token, demo });

  return (
    <Page style={[styles.page, { backgroundColor: colors.surface }]}>
      <View style={styles.column}>
        <TopBar
          style={styles.topBar}
          left={activeBatch ? (
            <View style={[styles.iconCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
            </View>
          ) : null}
          leftLabel={activeBatch ? 'Back to Lesson Picker' : undefined}
          leftOnPress={activeBatch ? () => setActiveBatch(null) : null}
          center={(
            <View style={styles.centerTitle}>
              <Text accessibilityRole="header" style={[theme.type.titleLarge, { color: colors.onSurface }]}>
                Lessons
              </Text>
              {demo && (
                <View style={[styles.modeChip, { backgroundColor: colors.secondaryContainer }]}>
                  <Text style={[theme.type.labelSmall, { color: colors.onSecondaryContainer }]}>
                    Demo
                  </Text>
                </View>
              )}
            </View>
          )}
          right={!activeBatch ? (
            <View style={[styles.iconCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialIcons name="refresh" size={20} color={colors.onSurface} />
            </View>
          ) : null}
          rightLabel={!activeBatch ? 'Reload lessons' : undefined}
          rightOnPress={!activeBatch ? reload : null}
        />

        {!activeBatch && loading && <Message loading />}

        {!activeBatch && !loading && (
          <LessonPicker
            assignments={assignments}
            subjectsById={subjectsById}
            batchSize={batchSize}
            onBatchSizeChange={size => saveSetting?.({ key: LESSONS_BATCH_SIZE, value: size })}
            onStartBatch={batch => setActiveBatch(batch)}
          />
        )}

        {Boolean(activeBatch) && (
          <LessonSession
            assignments={activeBatch}
            subjectsById={subjectsById}
            demo={demo}
            token={token}
            onUnlockAssignment={unlockAssignment}
            onBackToPicker={() => setActiveBatch(null)}
          />
        )}
      </View>
    </Page>
  );
};

LessonsScreen.propTypes = {
  demo: PropTypes.bool,
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
  },
  topBar: {
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.shape.full,
  },
});

export default LessonsScreen;
