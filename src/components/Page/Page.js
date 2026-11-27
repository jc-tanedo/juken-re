import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View } from 'react-native';
import useSafeInsets from 'src/hooks/useSafeInsets';
import useLayoutMode from 'src/hooks/useLayoutMode';
import { isWeb, media } from 'src/utils/device';
import theme from 'src/common/theme';

const Page = ({
  center,
  wide,
  children,
  style,
}) => {
  const insets = useSafeInsets();
  const layout = useLayoutMode();

  // general padding around container
  let pTop = theme.padding.body + insets.top;
  let pBottom = theme.padding.body + insets.bottom;
  let pLeft = theme.padding.body + insets.left;
  let pRight = theme.padding.body + insets.right;

  if (!isWeb() && layout.showRail) {
    // The leading navigation rail already absorbs the left inset and reclaims vertical space.
    pTop = 16 + insets.top;
    pBottom = 16 + insets.bottom;
    pLeft = 16;
    pRight = 16 + insets.right;
  }

  // responsive paddings
  const {
    desktop,
    tablet,
    mobile,
  } = media();
  
  if (isWeb() && desktop) {
    pTop = wide ? 24 : '4%';
    pBottom = wide ? 20 : (center ? '4%' : '2.5%');
    pLeft = wide ? '6%' : '32%';
    pRight = wide ? '6%' : '32%';
  }
  if (isWeb() && tablet) {
    pTop = wide ? 20 : '6%';
    pBottom = wide ? 16 : (center ? '6%' : '4%');
    pLeft = wide ? '4%' : '22%';
    pRight = wide ? '4%' : '22%';
  }
  if (isWeb() && mobile) {
    pTop = '8%';
    pBottom = center ? '8%' : '6%';
    pLeft = '8%';
    pRight = '8%';
  }

  return (
    <View
      style={[
        {
          paddingTop: pTop,
          paddingLeft: pLeft,
          paddingBottom: pBottom,
          paddingRight: pRight,
        },
        styles.wrapper,
        style,
      ]}
    >
      {children}
    </View>
  )
};

Page.propTypes = {
  center: PropTypes.bool, // center content: top and bottom padding equal
  wide: PropTypes.bool, // relax desktop web horizontal padding for multi-pane layouts
  children: PropTypes.any,
  style: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]),
};

const styles = StyleSheet.create({
  wrapper: {},
})

export default Page;
