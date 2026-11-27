import React from 'react';
import { Image } from 'react-native';
import RadicalBase from 'src/components/Radical/RadicalBase';

const Radical = props => (
  <RadicalBase
    {...props}
    renderSvg={({ xml, style }) => (
      <Image
        source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(xml)}` }}
        style={style}
      />
    )}
  />
);

export default Radical;
