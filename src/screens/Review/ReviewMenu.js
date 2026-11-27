import React, { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { View } from 'react-native';
import { useStoreState, useStoreActions } from 'easy-peasy';
import { MaterialIcons } from '@expo/vector-icons';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';
import useSpeechSettings from 'src/features/voice/useSpeechSettings';
import List from 'src/components/List/List';
import Modal, { DURATION_SAFE } from 'src/components/Modal/Modal';
import SelectionDialog from 'src/components/SelectionDialog/SelectionDialog';
import VoiceSettingsView from 'src/screens/Review/VoiceSettingsView';
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

const reviewOrderOptions = [
  {
    value: RANDOM_ORDER,
    label: 'Random Order',
    description: 'Shuffle remaining cards unpredictably across the queue.',
  },
  {
    value: LOWEST_LEVEL_FIRST,
    label: 'Lowest Level First',
    description: 'Prioritize items from lower WaniKani levels first.',
  },
  {
    value: CURRENT_LEVEL_FIRST,
    label: 'Current Level First',
    description: 'Focus on your highest active level before older items.',
  },
  {
    value: ASCENDING_SRS_STAGE,
    label: 'Ascending SRS Stage',
    description: 'Review Apprentice items first, then higher SRS stages.',
  },
  {
    value: DESCENDING_SRS_STAGE,
    label: 'Descending SRS Stage',
    description: 'Clear Enlightened and Master items before Apprentice.',
  },
];

const ReviewMenu = ({
  demo,
  logout,
  stopDemo,
  loadReviews,
  menuOpen,
  setMenuOpen,
  initialSubpage = 'root',
  wrapUpMode,
  setWrapUpMode,
}) => {
  const [subpage, setSubpage] = useState(initialSubpage);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const colors = theme[useColorScheme()];
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
  const activeOrder = reviewOrderOptions.find(opt => opt.value === reviewOrder) || reviewOrderOptions[0];

  useEffect(() => {
    if (menuOpen) {
      setSubpage(initialSubpage);
    } else {
      setSubpage('root');
      setOrderDialogOpen(false);
    }
  }, [menuOpen, initialSubpage]);

  const inVoice = subpage === 'voice';
  const handleBack = () => {
    if (inVoice) setSubpage('root');
    else setMenuOpen(false);
  };

  const cardItems = [
    {
      id: 'ses-review-order',
      title: 'Review Order',
      subtitle: activeOrder.label,
      iconTone: 'secondary',
      leftIcon: <MaterialIcons name="shuffle" size={20} color={colors.onSecondaryContainer} />,
      chevron: true,
      onPress: () => setOrderDialogOpen(true),
    },
    {
      id: 'ses-quick',
      title: 'Quick Reveal',
      subtitle: 'Reveal by tapping anywhere on the card',
      iconTone: 'secondary',
      leftIcon: <MaterialIcons name="bolt" size={20} color={colors.onSecondaryContainer} />,
      switch: {
        value: quickMode,
        onValueChange: () => saveSetting({ key: QUICK_MODE, value: !quickMode }),
      },
    },
    {
      id: 'ses-skip',
      title: 'Answer Without Revealing',
      subtitle: 'Allows you to answer without revealing. Use wisely!',
      iconTone: 'secondary',
      leftIcon: <MaterialIcons name="fast-forward" size={20} color={colors.onSecondaryContainer} />,
      switch: {
        value: skipMode,
        onValueChange: () => saveSetting({ key: SKIP_MODE, value: !skipMode }),
      },
    },
    {
      id: 'ses-back-to-back',
      title: 'Back To Back',
      subtitle: 'Reorder cards so reading and meaning are back-to-back',
      iconTone: 'secondary',
      leftIcon: <MaterialIcons name="layers" size={20} color={colors.onSecondaryContainer} />,
      switch: {
        value: backToBackMode,
        onValueChange: () => saveSetting({ key: BACK_TO_BACK_MODE, value: !backToBackMode }),
      },
    },
    backToBackMode && {
      id: 'ses-meaning-first',
      title: 'Meaning First',
      subtitle: 'Show meaning before reading',
      indented: true,
      iconTone: 'secondary',
      leftIcon: <MaterialIcons name="subdirectory-arrow-right" size={20} color={colors.onSecondaryContainer} />,
      switch: {
        value: meaningFirst,
        onValueChange: () => saveSetting({ key: MEANING_FIRST, value: !meaningFirst }),
      },
    },
  ].filter(Boolean);

  return (
    <Modal
      presentation="page"
      visible={menuOpen}
      title={inVoice ? 'Voice recognition' : 'Review settings'}
      subtitle={inVoice
        ? 'Choose how spoken answers are recognized and manage offline language packs.'
        : undefined}
      navigationIcon={inVoice ? 'back' : 'close'}
      onBack={handleBack}
      close={handleBack}
    >
      {inVoice && speechSettings.available ? (
        <VoiceSettingsView speechSettings={speechSettings} />
      ) : (
        <>
          <List
            lists={[
              {
                title: 'Session',
                items: [
                  {
                    id: 'ses-wrap',
                    title: 'Wrap-Up Mode',
                    subtitle: 'Ask only reviews with unfinished pairs',
                    iconTone: 'primary',
                    leftIcon: <MaterialIcons name="schedule" size={20} color={colors.onPrimaryContainer} />,
                    switch: {
                      value: wrapUpMode,
                      onValueChange: () => {
                        setWrapUpMode(!wrapUpMode);
                        setMenuOpen(false);
                      },
                    },
                  },
                  {
                    id: 'ses-refresh',
                    title: 'Refresh',
                    subtitle: 'Reload queue and discard unfinished pairs',
                    iconTone: 'primary',
                    leftIcon: <MaterialIcons name="refresh" size={20} color={colors.onPrimaryContainer} />,
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
                ],
              },
              {
                title: 'Card behavior',
                items: cardItems,
              },
              speechSettings.available && {
                title: 'Voice mode',
                items: [
                  {
                    id: 'voice-settings',
                    title: 'Speech recognition',
                    subtitle: speechSettings.summary,
                    iconTone: 'primary',
                    leftIcon: <MaterialIcons name="record-voice-over" size={20} color={colors.onPrimaryContainer} />,
                    badge: speechSettings.needsDownload ? { label: 'Setup', tone: 'warning' } : null,
                    chevron: true,
                    onPress: () => setSubpage('voice'),
                  },
                ],
              },
              {
                title: 'Appearance',
                items: [
                  {
                    id: 'ses-dark',
                    title: 'Dark Mode',
                    subtitle: isWeb()
                      ? null
                      : darkMode ? 'Using dark theme' : 'Follows system default',
                    iconTone: 'tertiary',
                    leftIcon: <MaterialIcons name="dark-mode" size={20} color={colors.onTertiaryContainer} />,
                    switch: {
                      value: darkMode,
                      onValueChange: () => saveSetting({ key: DARK_MODE, value: !darkMode }),
                    },
                  },
                ],
              },
              {
                title: 'About',
                items: [
                  {
                    id: 'gen-fb',
                    title: 'Feedback',
                    iconTone: 'neutral',
                    leftIcon: <MaterialIcons name="chat-bubble-outline" size={20} color={colors.onSurfaceVariant} />,
                    external: true,
                    onPress: async () => {
                      await WebBrowser.openBrowserAsync('https://github.com/jc-tanedo/juken-re');
                    },
                  },
                  {
                    id: 'gen-bugs',
                    title: 'Report Issues',
                    iconTone: 'neutral',
                    leftIcon: <MaterialIcons name="bug-report" size={20} color={colors.onSurfaceVariant} />,
                    external: true,
                    onPress: async () => {
                      await WebBrowser.openBrowserAsync('https://github.com/jc-tanedo/juken-re');
                    },
                  },
                  {
                    id: 'gen-code',
                    title: 'Source Code',
                    iconTone: 'neutral',
                    leftIcon: <MaterialIcons name="code" size={20} color={colors.onSurfaceVariant} />,
                    external: true,
                    onPress: async () => {
                      await WebBrowser.openBrowserAsync('https://github.com/jc-tanedo/juken-re');
                    },
                  },
                ],
              },
              {
                title: 'Account',
                items: [
                  {
                    id: 'gen-logout',
                    title: 'Log Out',
                    destructive: true,
                    iconTone: 'error',
                    leftIcon: <MaterialIcons name="logout" size={20} color={colors.onErrorContainer} />,
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

          <SelectionDialog
            visible={orderDialogOpen}
            title="Review Order"
            subtitle="Choose how upcoming cards are ordered during a session."
            icon={<MaterialIcons name="shuffle" size={20} color={colors.onSecondaryContainer} />}
            options={reviewOrderOptions}
            value={reviewOrder}
            onSelect={value => saveSetting({ key: REVIEW_ORDER, value })}
            onClose={() => setOrderDialogOpen(false)}
          />
        </>
      )}
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
  initialSubpage: PropTypes.oneOf(['root', 'voice']),
  wrapUpMode: PropTypes.bool,
  setWrapUpMode: PropTypes.func,
};

export default ReviewMenu;
