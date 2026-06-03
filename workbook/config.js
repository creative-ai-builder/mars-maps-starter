export const WORKBOOK_CONFIG = {
  API_BASE: 'https://mars-proxy.creative-ai-builder.workers.dev',
  API_KEY: 'class2025',
  MODEL: 'claude-sonnet-4-6',
  MAX_TOKENS_COACH: 512,
  MAX_TOKENS_GENERATE: 1024,

  // How many items AI generates for sections 2 and 3 per chapter.
  // Change these to make sections longer or shorter.
  chapters: {
    1: { section2Count: 4, section3Count: 2 },
    2: { section2Count: 4, section3Count: 2 },
    3: { section2Count: 4, section3Count: 3 },
    4: { section2Count: 5, section3Count: 2 },
    5: { section2Count: 3, section3Count: 2 },
  },

  // Badge slug for each chapter (used as localStorage key)
  badges: {
    1: 'talker',
    2: 'decomposer',
    3: 'specifier',
    4: 'lie-spotter',
    5: 'director',
  },

  // Which badge must be earned to unlock each chapter
  chapterGate: {
    1: null,          // always unlocked
    2: 'talker',
    3: 'decomposer',
    4: 'specifier',
    5: 'lie-spotter',
  },
};
