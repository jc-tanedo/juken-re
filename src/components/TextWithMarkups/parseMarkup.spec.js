import { parseMarkup } from 'src/components/TextWithMarkups/parseMarkup';

describe('parseMarkup', () => {
  test('tokenizes subject tags, answer tags, and nested <ja> tags without losing text', () => {
    const input = 'Remember <radical>stick</radical> and <reading>Nintendo (<ja>にん</ja>)</reading>!';
    expect(parseMarkup(input)).toEqual([
      { text: 'Remember ', tags: [] },
      { text: 'stick', tags: ['radical'] },
      { text: ' and ', tags: [] },
      { text: 'Nintendo (', tags: ['reading'] },
      { text: 'にん', tags: ['reading', 'ja'] },
      { text: ')', tags: ['reading'] },
      { text: '!', tags: [] },
    ]);
  });

  test('handles unclosed or mismatched tags gracefully', () => {
    expect(parseMarkup('<kanji>broken</reading> text')).toEqual([
      { text: 'broken', tags: ['kanji'] },
      { text: ' text', tags: ['kanji'] },
    ]);
    expect(parseMarkup('')).toEqual([]);
  });
});
