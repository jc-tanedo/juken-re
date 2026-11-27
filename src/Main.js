import React, { useEffect, useState } from 'react';
import { useStoreState, useStoreRehydrated } from 'easy-peasy';
import * as SystemUI from 'expo-system-ui';
import Review from 'src/screens/Review/Review';
import Login from 'src/screens/Login/Login';
import Message from 'src/screens/Message/Message';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

export default () => {
  const rehydrated = useStoreRehydrated();
  const token = useStoreState(state => state.session.token);
  const colorScheme = useColorScheme();
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync?.(theme[colorScheme].surface).catch(() => {});
  }, [colorScheme]);

  // store being rehydrated
  if (!rehydrated) {
    return <Message loading />;
  }

  // demo mode
  if (demo) {
    return (
      <Review
        demo
        stopDemo={() => {
          setDemo(false);
        }}
      />
    );
  }

  // not logged in
  if (!token) {
    return (
      <Login
        startDemo={() => {
          setDemo(true);
        }}
      />
    );
  }

  // logged in
  return <Review />;
};
