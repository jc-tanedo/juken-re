import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useStoreState, useStoreRehydrated } from 'easy-peasy';
import * as SystemUI from 'expo-system-ui';
import Review from 'src/screens/Review/Review';
import LessonsScreen from 'src/screens/Lessons/LessonsScreen';
import ExtraStudyScreen from 'src/screens/ExtraStudy/ExtraStudyScreen';
import Login from 'src/screens/Login/Login';
import Message from 'src/screens/Message/Message';
import ModeBar from 'src/components/ModeBar/ModeBar';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import useLayoutMode from 'src/hooks/useLayoutMode';

export default () => {
  const rehydrated = useStoreRehydrated();
  const token = useStoreState(state => state.session.token);
  const colorScheme = useColorScheme();
  const layout = useLayoutMode();
  const [demo, setDemo] = useState(false);
  const [activeTab, setActiveTab] = useState('reviews');

  useEffect(() => {
    SystemUI.setBackgroundColorAsync?.(theme[colorScheme].surface).catch(() => {});
  }, [colorScheme]);

  // store being rehydrated
  if (!rehydrated) {
    return <Message loading />;
  }

  // not logged in and not in demo mode
  if (!demo && !token) {
    return (
      <Login
        startDemo={() => {
          setActiveTab('reviews');
          setDemo(true);
        }}
      />
    );
  }

  const stopDemo = () => {
    setDemo(false);
    setActiveTab('reviews');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme[colorScheme].surface,
          flexDirection: layout.showRail ? 'row-reverse' : 'column',
        },
      ]}
    >
      <View key="main-content" style={styles.content}>
        {activeTab === 'lessons' ? (
          <LessonsScreen demo={demo} />
        ) : activeTab === 'extraStudy' ? (
          <ExtraStudyScreen demo={demo} />
        ) : (
          <Review demo={demo} stopDemo={demo ? stopDemo : undefined} />
        )}
      </View>
      <ModeBar
        key="mode-nav"
        value={activeTab}
        onChange={setActiveTab}
        variant={layout.showRail ? 'rail' : 'bar'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
