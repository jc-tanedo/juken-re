import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const Subject = ({ style, subjectCharacters, subjectType }) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const subjectTheme = theme.subjectColors[scheme][subjectType];
  const foreground = subjectTheme?.foreground ?? colors.onPrimaryContainer;

  if (typeof subjectCharacters === 'string' && subjectCharacters.length > 0) {
    return (
      <Text
        style={[
          styles.subject,
          { color: foreground },
          style,
        ]}
      >
        {subjectCharacters}
      </Text>
    );
  }

  if (React.isValidElement(subjectCharacters)) {
    return React.cloneElement(subjectCharacters, {
      color: foreground,
      ...(subjectCharacters.props?.size ? {} : { size: 52 }),
    });
  }

  return subjectCharacters || null;
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
