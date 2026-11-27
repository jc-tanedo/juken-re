import React, { act } from 'react';
import { createRoot } from 'test-renderer';
import useUndoQueue from 'src/features/reviews/useUndoQueue';

describe('useUndoQueue', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('buffers swipe for 3 seconds, rolls back cleanly on undo, and flushes on next swipe or expiry', async () => {
    jest.useFakeTimers();
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const onCommit = jest.fn();
    const onUndoSession = jest.fn();

    let api;
    function Harness() {
      api = useUndoQueue({ onCommit, onUndoSession, delayMs: 3000 });
      return null;
    }

    const root = createRoot();
    try {
      await act(async () => root.render(<Harness />));

      await act(async () => api.enqueue({ reviewId: 10 }, '大 (Correct)'));
      expect(api.hasPending).toBe(true);
      expect(onCommit).not.toHaveBeenCalled();

      // Undoing cancels timer and calls session rollback
      let didUndo;
      await act(async () => { didUndo = api.undo(); });
      expect(didUndo).toBe(true);
      expect(onUndoSession).toHaveBeenCalledTimes(1);
      await act(async () => jest.advanceTimersByTime(3500));
      expect(onCommit).not.toHaveBeenCalled();

      // Enqueueing a second card flushes the prior card immediately
      await act(async () => api.enqueue({ reviewId: 11 }, '一'));
      await act(async () => api.enqueue({ reviewId: 12 }, '二'));
      expect(onCommit).toHaveBeenCalledTimes(1);
      expect(onCommit).toHaveBeenCalledWith({ reviewId: 11 });

      // Expiry commits the active item
      await act(async () => jest.advanceTimersByTime(3000));
      expect(onCommit).toHaveBeenCalledTimes(2);
      expect(onCommit).toHaveBeenLastCalledWith({ reviewId: 12 });
    } finally {
      await act(async () => root.unmount());
    }
  });
});
