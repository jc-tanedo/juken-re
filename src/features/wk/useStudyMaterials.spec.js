import React, { act } from 'react';
import { createRoot } from 'test-renderer';
import useStudyMaterials from 'src/features/wk/useStudyMaterials';
import { request } from 'src/features/wk/request';
import wkCache from 'src/features/wk/cache';
import { POST, PUT } from 'src/common/constants';

jest.mock('src/features/wk/request', () => ({ request: jest.fn() }));
jest.mock('src/features/wk/cache', () => ({
  syncStudyMaterials: jest.fn(),
  upsertStudyMaterial: jest.fn(),
}));

describe('useStudyMaterials', () => {
  beforeEach(() => {
    request.mockReset();
    wkCache.syncStudyMaterials.mockReset();
    wkCache.upsertStudyMaterial.mockReset();
  });

  test('saves POST -> PUT updates and reports clear permission error on HTTP 403', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    wkCache.syncStudyMaterials.mockResolvedValueOnce({});

    let api;
    function Harness() {
      api = useStudyMaterials({ token: 'tok', demo: false, enabled: true });
      return null;
    }

    const root = createRoot();
    try {
      await act(async () => {
        root.render(<Harness />);
      });
      await act(async () => {
        await Promise.resolve();
      });

      request.mockResolvedValueOnce({
        id: 77,
        data_updated_at: '2026-03-01T00:00:00Z',
        data: { subject_id: 444, meaning_synonyms: ['Individual'], meaning_note: 'My note', reading_note: null },
      });

      let firstRes;
      await act(async () => {
        firstRes = await api.saveStudyMaterial({
          subjectId: 444,
          meaningSynonyms: ['Individual', 'individual'],
          meaningNote: 'My note',
        });
      });
      expect(firstRes.ok).toBe(true);
      expect(request).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: 'study_materials',
        method: POST,
      }));
      expect(api.synonymsBySubjectId[444]).toEqual(['Individual']);

      const forbiddenErr = new Error('Forbidden');
      forbiddenErr.status = 403;
      request.mockRejectedValueOnce(forbiddenErr);

      let deniedRes;
      await act(async () => {
        deniedRes = await api.saveStudyMaterial({
          subjectId: 444,
          meaningSynonyms: ['Individual', 'Folk'],
        });
      });
      expect(request).toHaveBeenLastCalledWith(expect.objectContaining({
        endpoint: 'study_materials/77',
        method: PUT,
      }));
      expect(deniedRes).toMatchObject({ ok: false, permissionDenied: true });
    } finally {
      await act(async () => root.unmount());
    }
  });
});
