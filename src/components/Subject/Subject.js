import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const Subject = ({ style, subjectCharacters, subjectType }) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const subjectTheme = theme.subjectColors[scheme][subjectType];

  return (
    <Text
      style={[
        styles.subject,
        { color: subjectTheme?.foreground ?? colors.onPrimaryContainer },
        style,
      ]}
    >
      {subjectCharacters}
    </Text>
  );
};

Subject.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  subjectCharacters: PropTypes.any,
  subjectType: PropTypes.string,
};

const styles = StyleSheet.create({
  subject: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 52,
  },
});

export default Subject;
