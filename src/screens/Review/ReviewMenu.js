import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useStoreState, useStoreActions } from 'easy-peasy';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';
import useSpeechSettings from 'src/features/voice/useSpeechSettings';
import List from 'src/components/List/List';
import Modal, { DURATION_SAFE } from 'src/components/Modal/Modal';
import dialog from 'src/utils/dialog';
import { isWeb } from 'src/utils/device';
import {
  SPEECH_MODE,
  SKIP_MODE,
  QUICK_MODE,
  DARK_MODE,
  BACK_TO_BACK_MODE,
  MEANING_FIRST,
  REVIEW_ORDER,
  RANDOM_ORDER,
  LOWEST_LEVEL_FIRST,
  CURRENT_LEVEL_FIRST,
  ASCENDING_SRS_STAGE,
  DESCENDING_SRS_STAGE,
} from 'src/common/constants';

const ReviewMenu = ({
  demo,
  logout,
  stopDemo,
  loadReviews,
  menuOpen,
  setMenuOpen,
  wrapUpMode,
  setWrapUpMode,
}) => {
  const colors = theme[useColorScheme()];
  const iconColor = colors.onSurfaceVariant;
  const saveSetting = useStoreActions(actions => actions.session.saveSetting);
  const userSettings = useStoreState(state => state.session.userSettings);
  const speechSettings = useSpeechSettings(
    userSettings?.[SPEECH_MODE],
    value => saveSetting({ key: SPEECH_MODE, value }),
    menuOpen,
  );
  const skipMode = _.get(userSettings, SKIP_MODE);
  const quickMode = _.get(userSettings, QUICK_MODE);
  const darkMode = _.get(userSettings, DARK_MODE);
  const backToBackMode = _.get(userSettings, BACK_TO_BACK_MODE);
  const meaningFirst = _.get(userSettings, MEANING_FIRST);
  const reviewOrder = _.get(userSettings, REVIEW_ORDER, RANDOM_ORDER);

  return (
    <Modal
      visible={menuOpen}
      title="Review settings"
      close={() => setMenuOpen(false)}
    >
      <List
        lists={[
          {
            title: 'Review',
            items: [
              {
                id: 'ses-refresh',
                title: 'Refresh',
                leftIcon: <MaterialIcons name="refresh" size={22} color={iconColor} />,
                onPress: () => {
                  dialog({
                    webTitle: 'Half completed reviews will be lost. Are you sure ?',
                    mobileTitle: 'Are you sure ?',
                    mobileMessage: 'Half completed reviews will be lost',
                    onConfirm: () => {
                      setMenuOpen(false);
                      setTimeout(() => {
                        loadReviews();
                      }, DURATION_SAFE);
                    },
                  });
                },
              },
              {
                id: 'ses-wrap',
                title: 'Wrap-Up Mode',
                subtitle: 'Ask only reviews with unfinished pairs',
                leftIcon: <MaterialIcons name="schedule" size={22} color={iconColor} />,
                switch: {
                  value: wrapUpMode,
                  onValueChange: () => {
                    setWrapUpMode(!wrapUpMode);
                    setMenuOpen(false);
                  },
                },
              },
              {
                id: 'ses-quick',
                title: 'Quick Reveal',
                subtitle: 'Reveal by tapping anywhere on the card',
                leftIcon: <MaterialIcons name="bolt" size={22} color={iconColor} />,
                switch: {
                  value: quickMode,
                  onValueChange: () => {
                    saveSetting({ key: QUICK_MODE, value: !quickMode });
                  },
                },
              },
              {
                id: 'ses-skip',
                title: 'Answer Without Revealing',
                subtitle: 'Allows you to answer without revealing. Use wisely!',
                leftIcon: <MaterialIcons name="fast-forward" size={22} color={iconColor} />,
                switch: {
                  value: skipMode,
                  onValueChange: () => {
                    saveSetting({ key: SKIP_MODE, value: !skipMode });
                  },
                },
              },
              {
                id: 'ses-back-to-back',
                title: 'Back To Back',
                subtitle: 'Reorder cards so reading and meaning are back-to-back',
                leftIcon: <MaterialIcons name="layers" size={22} color={iconColor} />,
                switch: {
                  value: backToBackMode,
                  onValueChange: () => {
                    saveSetting({ key: BACK_TO_BACK_MODE, value: !backToBackMode });
                  },
                },
              },
              {
                id: 'ses-meaning-first',
                title: 'Meaning First',
                subtitle: 'Show meaning first when back-to-back is enabled',
                leftIcon: <MaterialIcons name="swap-vert" size={22} color={iconColor} />,
                switch: {
                  value: meaningFirst,
                  onValueChange: () => {
                    saveSetting({ key: MEANING_FIRST, value: !meaningFirst });
                  },
                },
              },
              {
                id: 'ses-review-order',
                title: 'Review Order',
                leftIcon: <MaterialIcons name="shuffle" size={22} color={iconColor} />,
                picker: {
                  onValueChange: value => {
                    saveSetting({ key: REVIEW_ORDER, value });
                  },
                  placeholder: {},
                  value: reviewOrder,
                  items: [
                    { value: RANDOM_ORDER, label: 'Random Order' },
                    { value: LOWEST_LEVEL_FIRST, label: 'Lowest Level First' },
                    { value: CURRENT_LEVEL_FIRST, label: 'Current Level First' },
                    { value: ASCENDING_SRS_STAGE, label: 'Ascending SRS Stage' },
                    { value: DESCENDING_SRS_STAGE, label: 'Descending SRS Stage' },
                  ],
                },
              },
              {
                id: 'ses-dark',
                title: 'Dark Mode',
                subtitle: isWeb() ? null : (darkMode ? 'Disable to use system default' : null),
                leftIcon: <MaterialIcons name="dark-mode" size={22} color={iconColor} />,
                switch: {
                  value: darkMode,
                  onValueChange: () => {
                    saveSetting({ key: DARK_MODE, value: !darkMode });
                  },
                },
              },
            ],
          },
          speechSettings,
          {
            title: 'General',
            items: [
              {
                id: 'gen-fb',
                title: 'Feedback',
                leftIcon: <MaterialIcons name="chat-bubble-outline" size={22} color={iconColor} />,
                onPress: async () => {
                  await WebBrowser.openBrowserAsync('https://github.com/jc-tanedo/juken-re');
                },
              },
              {
                id: 'gen-bugs',
                title: 'Report Issues',
                leftIcon: <MaterialIcons name="bug-report" size={22} color={iconColor} />,
                onPress: async () => {
                  await WebBrowser.openBrowserAsync('https://github.com/jc-tanedo/juken-re');
                },
              },
              {
                id: 'gen-code',
                title: 'Source Code',
                leftIcon: <MaterialIcons name="code" size={22} color={iconColor} />,
                onPress: async () => {
                  await WebBrowser.openBrowserAsync('https://github.com/jc-tanedo/juken-re');
                },
              },
              {
                id: 'gen-logout',
                title: 'Log Out',
                destructive: true,
                leftIcon: <MaterialIcons name="logout" size={22} color={colors.error} />,
                onPress: () => {
                  setMenuOpen(false);
                  if (demo) stopDemo();
                  else logout();
                },
              },
            ],
          },
        ]}
      />
      <View style={{ height: 24 }} />
    </Modal>
  );
};

ReviewMenu.propTypes = {
  demo: PropTypes.bool,
  stopDemo: PropTypes.func,
  logout: PropTypes.func,
  loadReviews: PropTypes.func,
  menuOpen: PropTypes.bool,
  setMenuOpen: PropTypes.func,
  wrapUpMode: PropTypes.bool,
  setWrapUpMode: PropTypes.func,
};

export default ReviewMenu;
