const TAG_PATTERN = /<\/?([a-zA-Z0-9_-]+)>/g;
const KNOWN_TAGS = new Set([
  'radical',
  'kanji',
  'vocabulary',
  'kana_vocabulary',
  'meaning',
  'reading',
  'ja',
]);

/**
 * Stack-based tokenizer for WaniKani mnemonic markup. Supports nested tags like
 * `<reading>Nintendo (<ja>にん</ja>)</reading>` without losing text on malformed tags.
 */
export function parseMarkup(input) {
  const text = typeof input === 'string' ? input : '';
  if (!text) return [];

  const segments = [];
  const stack = [];
  let cursor = 0;

  for (const match of text.matchAll(TAG_PATTERN)) {
    const index = match.index;
    const rawTag = match[0];
    const tagName = match[1].toLowerCase();
    const isClosing = rawTag.startsWith('</');

    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), tags: stack.slice() });
    }
    cursor = index + rawTag.length;

    if (!KNOWN_TAGS.has(tagName)) {
      segments.push({ text: rawTag, tags: stack.slice() });
      continue;
    }

    if (!isClosing) {
      stack.push(tagName);
    } else {
      const matchIndex = stack.lastIndexOf(tagName);
      if (matchIndex !== -1) {
        stack.splice(matchIndex);
      }
    }
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), tags: stack.slice() });
  }

  return segments.filter(seg => seg.text.length > 0);
}
