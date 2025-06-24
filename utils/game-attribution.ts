// utils/game-attribution.ts
// Attribution logic for daily games

const CONTRIBUTORS = [
  'Austin Fisher',
  'Allison Brunelle',
  'Jamieson Cronin',
  'Tyler Dale Hamilton Holland',
  'Brian Jacobs',
  'Catman',
  'Topher Kienzle',
  'Colin "The Big Cheater" Patrick Warner',
  'Nick MV',
  'Mike Tatoli',
  'Mitch Long',
];

// Simple seeded pseudo-random generator (deterministic for a given day)
function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Get a numeric seed from a date string (YYYY-MM-DD)
function getSeedForDate(date: string) {
  return parseInt(date.replace(/-/g, ''), 10);
}

export function getAttributionForDate(date: string) {
  const seed = getSeedForDate(date);
  const writerIdx = Math.floor(seededRandom(seed) * CONTRIBUTORS.length);
  let editorIdx = Math.floor(seededRandom(seed + 42) * CONTRIBUTORS.length);
  if (editorIdx === writerIdx) editorIdx = (editorIdx + 1) % CONTRIBUTORS.length;
  return {
    writer: CONTRIBUTORS[writerIdx],
    editor: CONTRIBUTORS[editorIdx],
  };
}

export { CONTRIBUTORS };
