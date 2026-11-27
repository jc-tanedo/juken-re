import React from 'react';
import { SvgXml } from 'react-native-svg';
import RadicalBase from 'src/components/Radical/RadicalBase';

const Radical = props => (
  <RadicalBase
    {...props}
    renderSvg={({ xml, size, style }) => (
      <SvgXml xml={xml} width={size} height={size} style={style} />
    )}
  />
);

export default Radical;
