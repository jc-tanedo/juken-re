import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import Radical from 'src/components/Radical/Radical';
import {
  clearRadicalSvgCache,
  loadRadicalSvg,
  prepareRadicalSvg,
  selectRadicalSvgUrl,
} from 'src/components/Radical/radicalSvg';

jest.mock('src/hooks/useColorScheme', () => () => 'light');

const nativeTest = Platform.OS !== 'web' ? test : test.skip;

describe('radicalSvg utilities and Radical component', () => {
  afterEach(() => {
    clearRadicalSvgCache();
  });

  test('prefers without-css SVG url and normalizes viewBox and stroke color', () => {
    const subject = {
      id: 9999,
      data: {
        character_images: [
          { url: 'https://cdn.example/png.png', content_type: 'image/png', metadata: {} },
          { url: 'https://cdn.example/with.svg', content_type: 'image/svg+xml', metadata: { inline_styles: true } },
          { url: 'https://cdn.example/no-css.svg', content_type: 'image/svg+xml', metadata: { inline_styles: false } },
        ],
      },
    };
    expect(selectRadicalSvgUrl(subject)).toBe('https://cdn.example/no-css.svg');

    const raw = '<svg xmlns="http://www.w3.org/2000/svg"><style>.a{fill:none}</style><path stroke="#000" d="M0 0 L10 10"/></svg>';
    const prepared = prepareRadicalSvg(raw, '#0E3C66');
    expect(prepared).not.toContain('<style>');
    expect(prepared).toContain('viewBox="0 0 1000 1000"');
    expect(prepared).toContain('stroke="#0E3C66"');
  });

  test('loads and caches SVG markup via fetch', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      text: async () => '<svg viewBox="0 0 100 100"><path d="M0 0"/></svg>',
    }));
    const first = await loadRadicalSvg('https://cdn.example/r.svg', fetchMock);
    const second = await loadRadicalSvg('https://cdn.example/r.svg', fetchMock);
    expect(first).toContain('<svg');
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  nativeTest('renders SVG radical when loaded and falls back to PNG otherwise', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => ({
      ok: true,
      text: async () => '<svg viewBox="0 0 100 100"><path stroke="#000" d="M10 10"/></svg>',
    }));

    const subject = {
      id: 8761,
      object: 'radical',
      data: {
        characters: null,
        character_images: [
          { url: 'https://cdn.example/8761.svg', content_type: 'image/svg+xml', metadata: { inline_styles: false } },
        ],
      },
    };
    const root = createRoot();
    try {
      await act(async () => {
        root.render(<Radical subject={subject} size={56} color="#123456" />);
      });
      await act(async () => {
        await Promise.resolve();
      });
      const json = JSON.stringify(root.container.toJSON());
      expect(json).toContain('123456');
    } finally {
      await act(async () => root.unmount());
      global.fetch = originalFetch;
    }
  });
});
