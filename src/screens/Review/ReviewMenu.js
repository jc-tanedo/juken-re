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
  WRAP_UP_TEN_ITEMS,
  WRAP_UP_UNFINISHED,
} from 'src/features/reviews/utils/filterWrapUpQueue';
import {
  SPEECH_MODE,
  SKIP_MODE,
  QUICK_MODE,
  DARK_MODE,
  BACK_TO_BACK_MODE,
  MEANING_FIRST,
  AUTOPLAY_AUDIO,
  SHOW_SRS_INDICATOR,
  WRAP_UP_MODE_TYPE,
  REVIEW_ORDER,
  RANDOM_ORDER,
  LOWEST_LEVEL_FIRST,
  CURRENT_LEVEL_FIRST,
  ASCENDING_SRS_STAGE,
  DESCENDING_SRS_STAGE,
  APPRENTICE_FIRST,
  LEECH_FIRST,
  UNFOLDED_CARD_SIDE,
  CARD_SIDE_RIGHT,
  CARD_SIDE_LEFT,
  ANSWER_INPUT_MODE,
  ANSWER_INPUT_SWIPE,
  ANSWER_INPUT_BUTTONS,
  ANSWER_INPUT_BOTH,
} from 'src/common/constants';

const reviewOrderOptions = [
  {
    value: RANDOM_ORDER,
    label: 'Random Order',
    description: 'Shuffle remaining cards unpredictably across the queue.',
  },
  {
    value: APPRENTICE_FIRST,
    label: 'Apprentice First',
    description: 'Prioritize Apprentice items before Guru, Master, and Enlightened.',
  },
  {
    value: LEECH_FIRST,
    label: 'Leech First',
    description: 'Surface items with lower accuracy before easier reviews.',
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
    description: 'Review lower SRS stages before higher ones.',
  },
  {
    value: DESCENDING_SRS_STAGE,
    label: 'Descending SRS Stage',
    description: 'Clear Enlightened and Master items before Apprentice.',
  },
];

const wrapUpStyleOptions = [
  {
    value: WRAP_UP_TEN_ITEMS,
    label: '10 Items',
    description: 'Finish up to 10 reviews plus any half-completed pairs (WaniKani standard).',
  },
  {
    value: WRAP_UP_UNFINISHED,
    label: 'Unfinished Pairs Only',
    description: 'Ask only reviews where either meaning or reading was already answered.',
  },
];

const cardSideOptions = [
  {
    value: CARD_SIDE_RIGHT,
    label: 'Right Side',
    description: 'Show the review card on the right and study companion on the left (default).',
  },
  {
    value: CARD_SIDE_LEFT,
    label: 'Left Side',
    description: 'Show the review card on the left and study companion on the right.',
  },
];

const answerInputOptions = [
  {
    value: ANSWER_INPUT_BOTH,
    label: 'Swipe & Buttons',
    description: 'Swipe left or right, or tap Missed and Correct buttons on the card.',
  },
  {
    value: ANSWER_INPUT_SWIPE,
    label: 'Swipe Only',
    description: 'Swipe cards left for missed and right for correct without answer buttons.',
  },
  {
    value: ANSWER_INPUT_BUTTONS,
    label: 'Buttons Only',
    description: 'Use Missed and Correct buttons on the card and disable swipe gestures.',
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
  const [wrapUpDialogOpen, setWrapUpDialogOpen] = useState(false);
  const [cardSideDialogOpen, setCardSideDialogOpen] = useState(false);
  const [answerInputDialogOpen, setAnswerInputDialogOpen] = useState(false);

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
  const autoplayAudio = _.get(userSettings, AUTOPLAY_AUDIO);
  const showSrsIndicator = _.get(userSettings, SHOW_SRS_INDICATOR) !== false;
  const wrapUpStyle = _.get(userSettings, WRAP_UP_MODE_TYPE, WRAP_UP_TEN_ITEMS);
  const reviewOrder = _.get(userSettings, REVIEW_ORDER, RANDOM_ORDER);
  const unfoldedCardSide = _.get(userSettings, UNFOLDED_CARD_SIDE, CARD_SIDE_RIGHT);
  const answerInputMode = _.get(userSettings, ANSWER_INPUT_MODE, ANSWER_INPUT_BOTH);
  const activeOrder = reviewOrderOptions.find(opt => opt.value === reviewOrder) || reviewOrderOptions[0];
  const activeWrapUpStyle = wrapUpStyleOptions.find(opt => opt.value === wrapUpStyle) || wrapUpStyleOptions[0];
  const activeCardSide = cardSideOptions.find(opt => opt.value === unfoldedCardSide) || cardSideOptions[0];
  const activeAnswerInput = answerInputOptions.find(opt => opt.value === answerInputMode) || answerInputOptions[0];

  useEffect(() => {
    if (menuOpen) {
      setSubpage(initialSubpage);
    } else {
      setSubpage('root');
      setOrderDialogOpen(false);
      setWrapUpDialogOpen(false);
      setCardSideDialogOpen(false);
      setAnswerInputDialogOpen(false);
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
      id: 'ses-answer-input',
      title: 'Answer Controls',
      subtitle: activeAnswerInput.label,
      iconTone: 'secondary',
      leftIcon: <MaterialIcons name="touch-app" size={20} color={colors.onSecondaryContainer} />,
      chevron: true,
      onPress: () => setAnswerInputDialogOpen(true),
    },
    {
      id: 'ses-srs-indicator',
      title: 'SRS Stage Toasts',
      subtitle: 'Show Apprentice, Guru, Master, Enlightened, and Burned banners',
      iconTone: 'secondary',
      leftIcon: <MaterialIcons name="trending-up" size={20} color={colors.onSecondaryContainer} />,
      switch: {
        value: showSrsIndicator,
        onValueChange: () => saveSetting({ key: SHOW_SRS_INDICATOR, value: !showSrsIndicator }),
      },
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
      id: 'ses-autoplay',
      title: 'Autoplay Audio',
      subtitle: 'Play pronunciation when an answer is revealed',
      iconTone: 'secondary',
      leftIcon: <MaterialIcons name="volume-up" size={20} color={colors.onSecondaryContainer} />,
      switch: {
        value: autoplayAudio,
        onValueChange: () => saveSetting({ key: AUTOPLAY_AUDIO, value: !autoplayAudio }),
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
                    subtitle: activeWrapUpStyle.value === WRAP_UP_UNFINISHED
                      ? 'Ask only reviews with unfinished pairs'
                      : 'Finish up to 10 reviews or open pairs',
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
                    id: 'ses-wrap-style',
                    title: 'Wrap-Up Style',
                    subtitle: activeWrapUpStyle.label,
                    iconTone: 'primary',
                    leftIcon: <MaterialIcons name="tune" size={20} color={colors.onPrimaryContainer} />,
                    chevron: true,
                    onPress: () => setWrapUpDialogOpen(true),
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
                  {
                    id: 'ses-unfolded-card-side',
                    title: 'Unfolded Card Side',
                    subtitle: activeCardSide.label,
                    iconTone: 'tertiary',
                    leftIcon: <MaterialIcons name="swap-horiz" size={20} color={colors.onTertiaryContainer} />,
                    chevron: true,
                    onPress: () => setCardSideDialogOpen(true),
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

          <SelectionDialog
            visible={wrapUpDialogOpen}
            title="Wrap-Up Style"
            subtitle="Choose how many reviews stay in the deck when Wrap-Up is enabled."
            icon={<MaterialIcons name="schedule" size={20} color={colors.onPrimaryContainer} />}
            options={wrapUpStyleOptions}
            value={wrapUpStyle}
            onSelect={value => saveSetting({ key: WRAP_UP_MODE_TYPE, value })}
            onClose={() => setWrapUpDialogOpen(false)}
          />

          <SelectionDialog
            visible={cardSideDialogOpen}
            title="Unfolded Card Side"
            subtitle="Choose which side displays the review card when unfolded or wide."
            icon={<MaterialIcons name="swap-horiz" size={20} color={colors.onTertiaryContainer} />}
            options={cardSideOptions}
            value={unfoldedCardSide}
            onSelect={value => saveSetting({ key: UNFOLDED_CARD_SIDE, value })}
            onClose={() => setCardSideDialogOpen(false)}
          />

          <SelectionDialog
            visible={answerInputDialogOpen}
            title="Answer Controls"
            subtitle="Choose how you mark cards as missed or correct."
            icon={<MaterialIcons name="touch-app" size={20} color={colors.onSecondaryContainer} />}
            options={answerInputOptions}
            value={answerInputMode}
            onSelect={value => saveSetting({ key: ANSWER_INPUT_MODE, value })}
            onClose={() => setAnswerInputDialogOpen(false)}
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
