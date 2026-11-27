import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import Radical from 'src/components/Radical/Radical';
import Subject from 'src/components/Subject/Subject';
import TextWithMarkups from 'src/components/TextWithMarkups/TextWithMarkups';
import Collapsible from 'src/components/Collapsible/Collapsible';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import freeSubjects from 'src/mock/freeSubjects';
import { KANJI, TERMINOLOGY } from 'src/common/constants';

const SubjectSectionAnswers = ({ style, answers = [], renderMain }) => {
  const colors = theme[useColorScheme()];

  return (
    <View style={[style, styles.sectionAnswers]}>
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

const SubjectDetails = ({ subject: propSubject } = {}) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const subject = propSubject || freeSubjects[1];

  const subjectCharacters = _.get(subject, 'data.characters');
  const subjectType = _.get(subject, 'object') || KANJI;
  const subjectTheme = theme.subjectColors[scheme][subjectType];

  const subjectMeanings = _.get(subject, 'data.meanings') || [];
  const subjectMeaningMnemonic = _.get(subject, 'data.meaning_mnemonic');
  const subjectMeaningHint = _.get(subject, 'data.meaning_hint');

  const subjectReadings = _.get(subject, 'data.readings') || [];
  const subjectReadingMnemonic = _.get(subject, 'data.reading_mnemonic');
  const subjectReadingHint = _.get(subject, 'data.reading_hint');

  return (
    <View style={styles.wrapper}>
      {/** subject type */}
      <View style={styles.subjectTypeWrapper}>
        <Text style={[styles.subjectType, { color: colors.onSurfaceVariant }]}>
          {TERMINOLOGY[subjectType] || subjectType}
        </Text>
      </View>

      {/** subject */}
      <View style={styles.subjectWrapper}>
        <View style={[styles.subjectTile, { backgroundColor: subjectTheme?.container ?? colors.primaryContainer }]}>
          <Subject
            subjectCharacters={subjectCharacters || <Radical subject={subject} />}
            subjectType={subjectType}
          />
        </View>
      </View>

      {/** meaning */}
      <View style={styles.section}>
        <Collapsible
          title="Meaning"
          contents={(
            <View>
              <SubjectSectionAnswers
                answers={subjectMeanings}
                renderMain={item => item.meaning}
              />
              {subjectMeaningMnemonic && (
                <>
                  <Text style={[styles.sectionRow, styles.sectionSubTitle, { color: colors.onSurfaceVariant }]}>
                    Mnemonic
                  </Text>
                  <TextWithMarkups
                    text={subjectMeaningMnemonic}
                    style={[styles.sectionRow]}
                  />
                </>
              )}
              {subjectMeaningHint && (
                <>
                  <Text style={[styles.sectionRow, styles.sectionSubTitle, { color: colors.onSurfaceVariant }]}>
                    Hint
                  </Text>
                  <TextWithMarkups
                    text={subjectMeaningHint}
                    style={[styles.sectionRow]}
                  />
                </>
              )}
            </View>
          )}
        />
      </View>

      {/** reading */}
      {subjectReadings.length > 0 && (
        <View style={styles.section}>
          <Collapsible
            title="Reading"
            contents={(
              <View>
                <SubjectSectionAnswers
                  answers={subjectReadings}
                  renderMain={item => item.reading}
                />
                {subjectReadingMnemonic && (
                  <>
                    <Text style={[styles.sectionRow, styles.sectionSubTitle, { color: colors.onSurfaceVariant }]}>
                      Mnemonic
                    </Text>
                    <TextWithMarkups
                      text={subjectReadingMnemonic}
                      style={[styles.sectionRow]}
                    />
                  </>
                )}
                {subjectReadingHint && (
                  <>
                    <Text style={[styles.sectionRow, styles.sectionSubTitle, { color: colors.onSurfaceVariant }]}>
                      Hint
                    </Text>
                    <TextWithMarkups
                      text={subjectReadingHint}
                      style={[styles.sectionRow]}
                    />
                  </>
                )}
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

SubjectDetails.propTypes = {
  subject: PropTypes.object,
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 20,
  },
  subjectTypeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  subjectType: {
    ...theme.type.labelMedium,
    textTransform: 'uppercase',
  },
  subjectWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectTile: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.shape.extraLarge,
  },
  section: {
    marginTop: 12,
  },
  sectionAnswers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionAnswer: {
    ...theme.type.titleMedium,
    marginRight: 8,
    marginBottom: 4,
  },
  sectionAnswerLast: { marginRight: 0 },
  sectionAnswerPrimary: { fontWeight: '700' },
  sectionRow: { marginTop: 6 },
  sectionSubTitle: {
    marginTop: 12,
    ...theme.type.labelMedium,
  },
});

export default SubjectDetails;
