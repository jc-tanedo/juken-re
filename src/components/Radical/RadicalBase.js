import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import _ from 'lodash';
import theme from 'src/common/theme';
import { RADICAL } from 'src/common/constants';
import useColorScheme from 'src/hooks/useColorScheme';
import {
  getCachedRadicalSvg,
  loadRadicalSvg,
  prepareRadicalSvg,
  selectRadicalSvgUrl,
} from 'src/components/Radical/radicalSvg';

const IMGS = {
  8761: require('./imgs/8761.png'),
  8762: require('./imgs/8762.png'),
  8763: require('./imgs/8763.png'),
  8764: require('./imgs/8764.png'),
  8765: require('./imgs/8765.png'),
  8766: require('./imgs/8766.png'),
  8767: require('./imgs/8767.png'),
  8768: require('./imgs/8768.png'),
  8769: require('./imgs/8769.png'),
  8770: require('./imgs/8770.png'),
  8771: require('./imgs/8771.png'),
  8772: require('./imgs/8772.png'),
  8773: require('./imgs/8773.png'),
  8774: require('./imgs/8774.png'),
  8775: require('./imgs/8775.png'),
  8776: require('./imgs/8776.png'),
  8777: require('./imgs/8777.png'),
  8778: require('./imgs/8778.png'),
  8779: require('./imgs/8779.png'),
  8780: require('./imgs/8780.png'),
  8781: require('./imgs/8781.png'),
  8782: require('./imgs/8782.png'),
  8783: require('./imgs/8783.png'),
  8784: require('./imgs/8784.png'),
  8785: require('./imgs/8785.png'),
  8786: require('./imgs/8786.png'),
  8787: require('./imgs/8787.png'),
  8788: require('./imgs/8788.png'),
  8789: require('./imgs/8789.png'),
  8790: require('./imgs/8790.png'),
  8791: require('./imgs/8791.png'),
  8792: require('./imgs/8792.png'),
  8793: require('./imgs/8793.png'),
  8794: require('./imgs/8794.png'),
  8795: require('./imgs/8795.png'),
  8796: require('./imgs/8796.png'),
  8797: require('./imgs/8797.png'),
  8798: require('./imgs/8798.png'),
  8799: require('./imgs/8799.png'),
  8819: require('./imgs/8819.png'),
};

const RadicalBase = ({ style, subject, size = 52, color, renderSvg } = {}) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const tintColor = color || theme.subjectColors[scheme]?.[RADICAL]?.foreground || colors.onSurface;
  const subjectId = _.get(subject, 'id');
  const svgUrl = selectRadicalSvgUrl(subject);
  const [rawSvg, setRawSvg] = useState(() => getCachedRadicalSvg(svgUrl));

  useEffect(() => {
    const cached = getCachedRadicalSvg(svgUrl);
    setRawSvg(cached);
    if (!svgUrl || cached) return undefined;

    let active = true;
    loadRadicalSvg(svgUrl).then(loaded => {
      if (active && loaded) setRawSvg(loaded);
    });
    return () => { active = false; };
  }, [svgUrl]);

  const preparedXml = prepareRadicalSvg(rawSvg, tintColor);
  if (preparedXml && typeof renderSvg === 'function') {
    return renderSvg({ xml: preparedXml, size, style: [styles.image, { width: size, height: size }, style] });
  }

  const fallbackSource = IMGS[subjectId];
  if (fallbackSource) {
    return (
      <Image
        source={fallbackSource}
        style={[styles.image, { width: size, height: size, tintColor }, style]}
      />
    );
  }

  return (
    <MaterialIcons
      name="category"
      size={Math.round(size * 0.72)}
      color={tintColor}
    />
  );
};

RadicalBase.propTypes = {
  style: PropTypes.any,
  subject: PropTypes.object,
  size: PropTypes.number,
  color: PropTypes.string,
  renderSvg: PropTypes.func,
};

const styles = StyleSheet.create({
  image: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
});

export default RadicalBase;
