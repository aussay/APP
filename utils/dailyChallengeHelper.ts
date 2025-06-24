// Helper functions for daily challenges

// Predefined list of words for daily challenges.
// In a real app, this list would be much larger and potentially managed server-side
// or through a more sophisticated generation algorithm.
const dailyWordWiseWords = [
  "APPLE", "BEACH", "BRAIN", "BREAD", "BRUSH", "CHAIR", "CHEST", "CHOIR", "CLOCK", "COACH",
  "COURT", "CRANE", "CYCLE", "DANCE", "DIARY", "DREAM", "DRINK", "EARTH", "FENCE", "FIELD",
  "FIGHT", "FLAME", "FLOOR", "FRUIT", "GHOST", "GRAPE", "GREEN", "GUARD", "GUIDE", "HEART",
  "HORSE", "HOTEL", "HOUSE", "IMAGE", "JUICE", "KNIFE", "LIGHT", "LIMIT", "LUNCH", "MAGIC",
  "MARCH", "METAL", "MODEL", "MONEY", "MONTH", "MOTOR", "MOUSE", "MUSIC", "NIGHT", "NOISE",
  "NORTH", "OCEAN", "OFFER", "ORDER", "PAPER", "PARTY", "PEACE", "PHONE", "PILOT", "PITCH",
  "PLACE", "PLANE", "PLANT", "PLATE", "POINT", "POWER", "PRICE", "PRIDE", "PRIZE", "RADIO",
  "RANGE", "RATIO", "REPLY", "RIGHT", "RIVER", "ROUND", "ROUTE", "SCALE", "SCENE", "SCOPE",
  "SCORE", "SENSE", "SHAPE", "SHARE", "SHEET", "SHIFT", "SHIRT", "SHOCK", "SIGHT", "SKILL",
  "SLEEP", "SMILE", "SMOKE", "SOUND", "SOUTH", "SPACE", "SPEED", "SPORT", "SQUAD", "STAFF",
  "STAGE", "START", "STATE", "STEAM", "STEEL", "STOCK", "STONE", "STORE", "STUDY", "STYLE",
  "SUGAR", "TABLE", "TASTE", "THEME", "THING", "TITLE", "TOTAL", "TOUCH", "TOWER", "TRACK",
  "TRADE", "TRAIN", "TREND", "TRIAL", "TRUCK", "TRUST", "TRUTH", "UNCLE", "UNION", "UNITY",
  "VALUE", "VIDEO", "VOICE", "WASTE", "WATCH", "WATER", "WHILE", "WHITE", "WOMAN", "WORLD",
  "YOUTH" // 120 words, enough for 4 months of unique daily words
];

/**
 * Gets the Word Wise word for the current day.
 * This is a simple implementation that cycles through a predefined list.
 * @returns {string} The daily word.
 */
export const getDailyWordWiseWord = (): string => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const wordIndex = dayOfYear % dailyWordWiseWords.length;
  return dailyWordWiseWords[wordIndex].toUpperCase();
};

/**
 * Gets the unique key for today's Word Wise challenge.
 * Used for storing completion status.
 * @returns {string} e.g., 'wordwise_daily_2023-10-27'
 */
export const getDailyWordWiseChallengeKey = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = today.getDate().toString().padStart(2, '0');
    return `wordwise_daily_${year}-${month}-${day}`;
};
