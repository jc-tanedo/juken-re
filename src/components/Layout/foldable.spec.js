import React, { act } from 'react';
import { Platform, Text } from 'react-native';
import { createRoot } from 'test-renderer';
import ModeBar from 'src/components/ModeBar/ModeBar';
import AdaptivePaneLayout from 'src/components/Layout/AdaptivePaneLayout';
import StudyCompanionPane from 'src/components/Deck/StudyCompanionPane';
import StudyDeck from 'src/components/Deck/StudyDeck';
import { computeLayoutMode } from 'src/hooks/useLayoutMode';
import {
  ANSWER_INPUT_BOTH,
  ANSWER_INPUT_BUTTONS,
  ANSWER_INPUT_SWIPE,
  CARD_SIDE_LEFT,
  KANJI,
  MEANING,
} from 'src/common/constants';

let mockScheme = 'light';
jest.mock('src/hooks/useColorScheme', () => () => mockScheme);
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: 'heavy' },
}));
jest.mock('src/features/wk/cache', () => ({
  getSubjectsByIds: jest.fn(async () => ({})),
}));

const nativeTest = Platform.OS !== 'web' ? test : test.skip;

const sampleSubject = {
  id: 42,
  object: KANJI,
  data: {
    level: 2,
    characters: '山',
    meanings: [{ meaning: 'Mountain', primary: true, accepted_answer: true }],
    readings: [{ reading: 'さん', type: 'onyomi', primary: true, accepted_answer: true }],
    meaning_mnemonic: 'Look at this <kanji>mountain</kanji> peak.',
    meaning_hint: 'Three peaks rising.',
    component_subject_ids: [],
    visually_similar_subject_ids: [],
  },
};

const sampleAudio = {
  clips: [{ url: 'https://cdn.example/yama.mp3', voiceActorName: 'Kyoko' }],
  playingUrl: null,
  playing: false,
  play: jest.fn(),
  stop: jest.fn(),
};

const sampleVoice = {
  state: { phase: 'off', message: '', detail: '' },
  session: { start: jest.fn(), stop: jest.fn(), pass: jest.fn(), retry: jest.fn() },
};

function findButton(root, label) {
  return root.container.queryAll(
    n => n.props.accessibilityRole === 'button' && (
      n.props.accessibilityLabel === label || JSON.stringify(n.toJSON()).includes(label)
    ),
  )[0];
}

describe('Foldable adaptive layout components', () => {
  nativeTest('ModeBar variant="rail" renders cleanly in light/dark mode and handles tab switches without warnings', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onChange = jest.fn();
    const root = createRoot();

    try {
      for (const scheme of ['light', 'dark']) {
        mockScheme = scheme;
        await act(async () => {
          root.render(<ModeBar variant="rail" value="reviews" onChange={onChange} />);
        });
      }

      const tabs = root.container.queryAll(n => n.props.accessibilityRole === 'tab');
      expect(tabs).toHaveLength(3);
      await act(async () => tabs[1].props.onClick({ nativeEvent: {} }));
      expect(onChange).toHaveBeenCalledWith('lessons');

      await act(async () => {
        root.render(<ModeBar variant="rail" value="lessons" onChange={onChange} />);
      });
      const updated = root.container.queryAll(n => n.props.accessibilityRole === 'tab');
      expect(updated.find(t => t.props.accessibilityLabel === 'Lessons').props.accessibilityState).toEqual({ selected: true });
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      errorSpy.mockRestore();
      warnSpy.mockRestore();
      mockScheme = 'light';
    }
  });

  nativeTest('AdaptivePaneLayout renders side-by-side in wide mode and vertical in tabletop mode', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const root = createRoot();
    const wideLayout = computeLayoutMode({
      width: 840,
      height: 810,
      foldState: {
        hasFold: true,
        state: 'flat',
        orientation: 'vertical',
        isSeparating: true,
        occlusionType: 'none',
        hingeBounds: { left: 418, top: 0, right: 422, bottom: 810, width: 4, height: 810 },
      },
    });
    const tabletopLayout = computeLayoutMode({
      width: 674,
      height: 841,
      foldState: {
        hasFold: true,
        state: 'half_opened',
        orientation: 'horizontal',
        isSeparating: true,
        occlusionType: 'none',
        hingeBounds: { left: 0, top: 418, right: 674, bottom: 422, width: 674, height: 4 },
      },
    });

    try {
      await act(async () => {
        root.render(
          <AdaptivePaneLayout
            layout={wideLayout}
            primary={<Text>Primary Pane</Text>}
            secondary={<Text>Secondary Pane</Text>}
          />,
        );
      });
      const wideTree = root.container.toJSON();
      expect(JSON.stringify(wideTree)).toContain('Primary Pane');
      expect(JSON.stringify(wideTree)).toContain('Secondary Pane');
      expect(JSON.stringify(wideTree.children[0].props.style)).toContain('"flexDirection":"row"');

      await act(async () => {
        root.render(
          <AdaptivePaneLayout
            layout={wideLayout}
            reverseWide
            primary={<Text>Primary Pane</Text>}
            secondary={<Text>Secondary Pane</Text>}
          />,
        );
      });
      const reversedTree = root.container.toJSON();
      const reversedContainer = reversedTree.children[0];
      expect(JSON.stringify(reversedContainer.props.style)).toContain('"flexDirection":"row-reverse"');
      expect(JSON.stringify(reversedContainer.children[0].props.style)).toContain('"flex":410');
      expect(JSON.stringify(reversedContainer.children[2].props.style)).toContain('"flex":330');

      await act(async () => {
        root.render(
          <AdaptivePaneLayout
            layout={tabletopLayout}
            primary={<Text>Top Pane</Text>}
            secondary={<Text>Bottom Pane</Text>}
          />,
        );
      });
      const tabletopTree = root.container.toJSON();
      expect(JSON.stringify(tabletopTree.children[0].props.style)).toContain('"flexDirection":"column"');
      expect(JSON.stringify(tabletopTree)).toContain('Bottom Pane');
    } finally {
      await act(async () => root.unmount());
    }
  });

  nativeTest('StudyDeck caps unfolded card height to 420 and defaults cardSide to right with left override', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const root = createRoot();
    const wideLayout = computeLayoutMode({ width: 840, height: 810 });
    const mockStudyDeck = {
      voice: sampleVoice,
      cards: [{ id: 'card-1', review: { id: 1, data: { subject_id: 42 } }, reviewType: MEANING }],
      topCard: { id: 'card-1', reviewType: MEANING },
      topSubject: sampleSubject,
      isTopRevealed: false,
      setTopCardRevealed: jest.fn(),
      expandedDetails: false,
      setExpandedDetails: jest.fn(),
      deckActionsRef: { current: null },
      voiceControlsCard: false,
      audio: sampleAudio,
      detailsSubject: null,
      openDetails: jest.fn(),
      closeDetails: jest.fn(),
      onRevealCard: jest.fn(),
    };

    try {
      await act(async () => {
        root.render(
          <StudyDeck
            studyDeck={mockStudyDeck}
            subjectsDict={{ 42: sampleSubject }}
            layout={wideLayout}
          />,
        );
      });
      const defaultJson = JSON.stringify(root.container.toJSON());
      expect(defaultJson).toContain('"flexDirection":"row-reverse"');
      expect(defaultJson).toContain('"maxHeight":420');

      await act(async () => {
        root.render(
          <StudyDeck
            studyDeck={mockStudyDeck}
            subjectsDict={{ 42: sampleSubject }}
            layout={wideLayout}
            cardSide={CARD_SIDE_LEFT}
          />,
        );
      });
      const leftJson = JSON.stringify(root.container.toJSON());
      expect(leftJson).toContain('"flexDirection":"row"');
      expect(leftJson).toContain('"maxHeight":420');

      const compactLayout = computeLayoutMode({ width: 390, height: 844 });
      await act(async () => {
        root.render(
          <StudyDeck
            studyDeck={mockStudyDeck}
            subjectsDict={{ 42: sampleSubject }}
            layout={compactLayout}
            progressSlot={<Text>Compact Progress</Text>}
          />,
        );
      });
      const compactJson = JSON.stringify(root.container.toJSON());
      expect(compactJson).toContain('"justifyContent":"center"');
      expect(compactJson).toContain('Compact Progress');
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  nativeTest('StudyCompanionPane protects answers before reveal, auto-shows mnemonic after reveal, and supports tabletop controls', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onToggleExpandedDetails = jest.fn();
    const deckActions = { reveal: jest.fn(), swipeLeft: jest.fn(), swipeRight: jest.fn() };
    const deckActionsRef = { current: deckActions };
    const root = createRoot();

    const baseProps = {
      topCard: { id: 'card-1', reviewType: MEANING },
      subject: sampleSubject,
      synonyms: ['Peak'],
      subjectsById: { 42: sampleSubject },
      audio: sampleAudio,
      voice: sampleVoice,
      speechModeLabel: 'Parakeet',
      deckActionsRef,
      onToggleExpandedDetails,
      progressSlot: <Text>Progress 1/10</Text>,
    };

    try {
      await act(async () => {
        root.render(<StudyCompanionPane {...baseProps} isRevealed={false} />);
      });
      const hiddenJson = JSON.stringify(root.container.toJSON());
      expect(hiddenJson).toContain('Study companion');
      expect(hiddenJson).toContain('"justifyContent":"center"');
      expect(hiddenJson).toContain('"minHeight":240');
      expect(hiddenJson).not.toContain('Mountain');
      expect(hiddenJson).not.toContain('Three peaks rising.');

      await act(async () => {
        root.render(<StudyCompanionPane {...baseProps} isRevealed />);
      });
      const revealedJson = JSON.stringify(root.container.toJSON());
      expect(revealedJson).toContain('"minHeight":240');
      expect(revealedJson).toContain('Mountain');
      expect(revealedJson).toContain('Synonyms: Peak');
      expect(revealedJson).toContain('Three peaks rising.');
      expect(revealedJson).toContain('Kyoko');
      expect(revealedJson).toContain('Progress 1/10');

      await act(async () => findButton(root, 'Full item info').props.onClick({ nativeEvent: {} }));
      expect(onToggleExpandedDetails).toHaveBeenCalledWith(true);

      await act(async () => {
        root.render(<StudyCompanionPane {...baseProps} isRevealed expandedDetails />);
      });
      expect(JSON.stringify(root.container.toJSON())).toContain('Compact view');

      await act(async () => {
        root.render(<StudyCompanionPane {...baseProps} isTabletop isRevealed={false} />);
      });
      await act(async () => findButton(root, 'Reveal Answer').props.onClick({ nativeEvent: {} }));
      expect(deckActions.reveal).toHaveBeenCalledTimes(1);

      await act(async () => {
        root.render(<StudyCompanionPane {...baseProps} isTabletop isRevealed />);
      });
      await act(async () => findButton(root, 'Missed').props.onClick({ nativeEvent: {} }));
      await act(async () => findButton(root, 'Correct').props.onClick({ nativeEvent: {} }));
      expect(deckActions.swipeLeft).toHaveBeenCalledTimes(1);
      expect(deckActions.swipeRight).toHaveBeenCalledTimes(1);

      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  nativeTest('StudyDeck renders external Reveal before reveal and replaces it with Missed/Correct buttons', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const root = createRoot();
    const deckActionsRef = { current: null };
    const onRevealCard = jest.fn();
    const setTopCardRevealed = jest.fn();
    const compactLayout = computeLayoutMode({ width: 390, height: 844 });

    const makeStudyDeck = isTopRevealed => ({
      voice: sampleVoice,
      cards: [{ id: 'card-1', review: { id: 1, data: { subject_id: 42 } }, reviewType: MEANING }],
      topCard: { id: 'card-1', reviewType: MEANING },
      topSubject: sampleSubject,
      isTopRevealed,
      setTopCardRevealed,
      expandedDetails: false,
      setExpandedDetails: jest.fn(),
      deckActionsRef,
      voiceControlsCard: false,
      audio: sampleAudio,
      detailsSubject: null,
      openDetails: jest.fn(),
      closeDetails: jest.fn(),
      onRevealCard,
    });

    try {
      await act(async () => {
        root.render(
          <StudyDeck
            studyDeck={makeStudyDeck(false)}
            subjectsDict={{ 42: sampleSubject }}
            layout={compactLayout}
            answerInputMode={ANSWER_INPUT_BOTH}
          />,
        );
      });
      expect(findButton(root, 'Reveal')).toBeDefined();
      expect(findButton(root, 'Missed')).toBeUndefined();
      expect(findButton(root, 'Correct')).toBeUndefined();

      await act(async () => {
        root.render(
          <StudyDeck
            studyDeck={makeStudyDeck(false)}
            subjectsDict={{ 42: sampleSubject }}
            layout={compactLayout}
            quickMode
            answerInputMode={ANSWER_INPUT_BUTTONS}
          />,
        );
      });
      await act(async () => findButton(root, 'Reveal').props.onClick({ nativeEvent: {} }));
      expect(onRevealCard).toHaveBeenCalledTimes(1);

      await act(async () => {
        root.render(
          <StudyDeck
            studyDeck={makeStudyDeck(true)}
            subjectsDict={{ 42: sampleSubject }}
            layout={compactLayout}
            answerInputMode={ANSWER_INPUT_BOTH}
          />,
        );
      });
      expect(findButton(root, 'Reveal')).toBeUndefined();
      const swipeLeftSpy = jest.spyOn(deckActionsRef.current, 'swipeLeft').mockImplementation(() => {});
      const swipeRightSpy = jest.spyOn(deckActionsRef.current, 'swipeRight').mockImplementation(() => {});
      await act(async () => findButton(root, 'Missed').props.onClick({ nativeEvent: {} }));
      await act(async () => findButton(root, 'Correct').props.onClick({ nativeEvent: {} }));
      expect(swipeLeftSpy).toHaveBeenCalledTimes(1);
      expect(swipeRightSpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        root.render(
          <StudyDeck
            studyDeck={makeStudyDeck(true)}
            subjectsDict={{ 42: sampleSubject }}
            layout={compactLayout}
            answerInputMode={ANSWER_INPUT_BUTTONS}
          />,
        );
      });
      const buttonsOnlyJson = JSON.stringify(root.container.toJSON());
      expect(buttonsOnlyJson).not.toContain('Swipe');
      expect(findButton(root, 'Missed')).toBeDefined();
      expect(findButton(root, 'Correct')).toBeDefined();

      await act(async () => {
        root.render(
          <StudyDeck
            studyDeck={makeStudyDeck(true)}
            subjectsDict={{ 42: sampleSubject }}
            layout={compactLayout}
            answerInputMode={ANSWER_INPUT_SWIPE}
          />,
        );
      });
      expect(findButton(root, 'Reveal')).toBeUndefined();
      expect(findButton(root, 'Missed')).toBeUndefined();
      expect(findButton(root, 'Correct')).toBeUndefined();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });
});
