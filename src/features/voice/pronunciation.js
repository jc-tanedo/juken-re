// Long vowel marks in dictated kana can stand for the spelled-out second mora.
const longVowels = [
  ['あかがさざただなはばぱまやゃらわぁ', 'あ'],
  ['いきぎしじちぢにひびぴみりぃ', 'い'],
  ['うくぐすずつづぬふぶぷむゆゅるゔぅ', 'う'],
  ['えけげせぜてでねへべぺめれぇ', 'えい'],
  ['おこごそぞとどのほぼぽもよょろをぉ', 'おう'],
];

export function normalizeReading(text) {
  return text.normalize('NFKC').replace(/[\s。、！？!?.,]/g, '')
    .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export function pronunciationOf(text) {
  const normalized = normalizeReading(text);
  if (/^[ぁ-ゖー]+$/.test(normalized)) return normalized;
  if (!/[一-龯々]/.test(normalized)) return null;
  const spelling = text.normalize('NFKC').replace(/[\s。、！？!?.,]/g, '');
  const reading = require('./data/commonReadings.json')[spelling];
  return reading ? normalizeReading(reading) : null;
}

export function sameReading(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (i === 0 || (a[i] !== 'ー' && b[i] !== 'ー')) return false;
    const spelled = a[i] === 'ー' ? b : a;
    if (!longVowels.some(([kana, vowels]) => kana.includes(spelled[i - 1]) && vowels.includes(spelled[i]))) return false;
  }
  return true;
}
