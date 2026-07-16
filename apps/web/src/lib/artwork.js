const glyphs = {
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111']
};

function renderWord(word) {
  return Array.from({ length: 7 }, (_, row) => Array.from(word).flatMap((letter, index) => [
    ...(glyphs[letter]?.[row] ?? '00000').split(''),
    ...(index < word.length - 1 ? ['0'] : [])
  ]));
}

const rawArtworkRows = [
  ...renderWord('PLANK'),
  Array.from({ length: 35 }, () => '0'),
  ...renderWord('AS'),
  Array.from({ length: 35 }, () => '0'),
  ...renderWord('ONE')
];

export const ARTWORK_WIDTH = Math.max(...rawArtworkRows.map((row) => row.length));
export const ARTWORK_HEIGHT = rawArtworkRows.length;
export const ARTWORK_ROWS = rawArtworkRows.map((row) => {
  const leftPad = Math.floor((ARTWORK_WIDTH - row.length) / 2);
  return [
    ...Array.from({ length: leftPad }, () => '0'),
    ...row,
    ...Array.from({ length: ARTWORK_WIDTH - leftPad - row.length }, () => '0')
  ];
});
