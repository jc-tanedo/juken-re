import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import ExtraStudyScreen from 'src/screens/ExtraStudy/ExtraStudyScreen';
import { request } from 'src/features/wk/request';

jest.mock('src/hooks/useColorScheme', () => () => 'light');
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: 'heavy' },
}));
jest.mock('src/features/voice/speechService', () => ({
  speechService: { permission: async () => false, listen: jest.fn(), cancel: jest.fn() },
}));
jest.mock('easy-peasy', () => ({
  useStoreState: fn => fn({ session: { token: null, user: null, userSettings: {} } }),
}));
jest.mock('src/features/wk/request', () => ({
  request: jest.fn(),
  collection: jest.fn(async () => []),
}));
jest.mock('src/features/wk/cache', () => ({
  syncSubjects: jest.fn(async () => ({})),
  syncReviewStatistics: jest.fn(async () => ({})),
  syncStudyMaterials: jest.fn(async () => ({})),
  getSubjectsByIds: jest.fn(async () => ({})),
}));
jest.mock('src/features/extraStudy/recentMistakes', () => ({
  MISTAKES_WINDOW_MS: 86_400_000,
  pruneMistakes: entries => entries || [],
  getRecentMistakes: jest.fn(async () => []),
  recordMistake: jest.fn(async () => []),
}));

const nativeTest = Platform.OS !== 'web' ? test : test.skip;

describe('ExtraStudyScreen', () => {
  beforeEach(() => {
    request.mockClear();
  });

  nativeTest('renders 4 practice decks and completes Burned Items without calling POST /v2/reviews', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const root = createRoot();
    try {
      await act(async () => {
        root.render(<ExtraStudyScreen demo />);
      });
      await act(async () => {
        await Promise.resolve();
      });

      const chooserJson = JSON.stringify(root.container.toJSON());
      expect(chooserJson).toContain('Recent Mistakes');
      expect(chooserJson).toContain('Recent Lessons');
      expect(chooserJson).toContain('Critical Condition');
      expect(chooserJson).toContain('Burned Items');
      expect(chooserJson).toContain('Practice · No SRS impact');

      const burnedBtn = root.container.queryAll(
        n => n.props.accessibilityRole === 'button' && String(n.props.accessibilityLabel || '').includes('Burned Items'),
      )[0];
      await act(async () => burnedBtn.props.onClick({ nativeEvent: {} }));

      const activeJson = JSON.stringify(root.container.toJSON());
      expect(activeJson).toContain('Burned Items');
      expect(activeJson).toContain('Practice cards');
      expect(request).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
    }
  });
});
