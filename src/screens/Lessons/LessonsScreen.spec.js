import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import LessonsScreen from 'src/screens/Lessons/LessonsScreen';

jest.mock('src/hooks/useColorScheme', () => () => 'light');
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: 'heavy' },
}));
jest.mock('src/features/voice/speechService', () => ({
  speechService: { permission: async () => false, listen: jest.fn(), cancel: jest.fn() },
}));
jest.mock('easy-peasy', () => ({
  useStoreActions: () => jest.fn(),
  useStoreState: fn => fn({ session: { token: null, user: null, userSettings: {} } }),
}));
jest.mock('src/features/wk/request', () => ({
  request: jest.fn(),
  collection: jest.fn(async () => []),
}));
jest.mock('src/features/wk/cache', () => ({
  syncSubjects: jest.fn(async () => ({})),
  syncStudyMaterials: jest.fn(async () => ({})),
  getSubjectsByIds: jest.fn(async () => ({})),
}));

const nativeTest = Platform.OS !== 'web' ? test : test.skip;

describe('LessonsScreen', () => {
  nativeTest('renders Today batch, expands Advanced Picker, and enters Study + Quiz steps in demo mode', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const root = createRoot();
    try {
      await act(async () => {
        root.render(<LessonsScreen demo />);
      });

      const pickerJson = JSON.stringify(root.container.toJSON());
      expect(pickerJson).toContain("Today's Lessons");
      expect(pickerJson).toContain('6 available');
      expect(pickerJson).toContain('Start Batch (5)');

      const advBtn = root.container.queryAll(
        n => n.props.accessibilityRole === 'button' && JSON.stringify(n.toJSON()).includes('Advanced Lesson Picker'),
      )[0];
      await act(async () => advBtn.props.onClick({ nativeEvent: {} }));
      expect(JSON.stringify(root.container.toJSON())).toContain('Level 4');

      const startBtn = root.container.queryAll(
        n => n.props.accessibilityRole === 'button' && JSON.stringify(n.toJSON()).includes('Start Batch (5)'),
      )[0];
      await act(async () => startBtn.props.onClick({ nativeEvent: {} }));

      const studyJson = JSON.stringify(root.container.toJSON());
      expect(studyJson).toContain('Study 1 of 5');
      expect(studyJson).toContain('Ground');

      for (let i = 0; i < 4; i++) {
        const nextBtn = root.container.queryAll(
          n => n.props.accessibilityRole === 'button' && JSON.stringify(n.toJSON()).includes('Next'),
        )[0];
        await act(async () => nextBtn.props.onClick({ nativeEvent: {} }));
      }

      const startQuizBtn = root.container.queryAll(
        n => n.props.accessibilityRole === 'button' && JSON.stringify(n.toJSON()).includes('Start Quiz'),
      )[0];
      expect(startQuizBtn).toBeDefined();
      await act(async () => startQuizBtn.props.onClick({ nativeEvent: {} }));

      expect(JSON.stringify(root.container.toJSON())).toContain('Lesson quiz');
    } finally {
      await act(async () => root.unmount());
    }
  });
});
