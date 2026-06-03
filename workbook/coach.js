import { WORKBOOK_CONFIG } from './config.js';

const { API_BASE, API_KEY, MODEL, MAX_TOKENS_COACH, MAX_TOKENS_GENERATE, badges, chapterGate } = WORKBOOK_CONFIG;

// ── Storage keys ────────────────────────────────────────────────────────────
const keys = {
  done:    (ch, s)  => `wb_ch${ch}_s${s}_done`,
  badge:   (slug)   => `wb_badge_${slug}`,
  badges:            'wb_badges',
  cache:   (ch, s)  => `wb_questions_ch${ch}_s${s}`,
};

// ── Progress tracking ───────────────────────────────────────────────────────
export function markDone(chapter, section) {
  localStorage.setItem(keys.done(chapter, section), '1');
}

export function isDone(chapter, section) {
  return localStorage.getItem(keys.done(chapter, section)) === '1';
}

export function getProgress(chapter) {
  let completed = 0;
  const total = 4;
  for (let s = 1; s <= total; s++) if (isDone(chapter, s)) completed++;
  return { completed, total };
}

// ── Section locking ─────────────────────────────────────────────────────────
export function isUnlocked(chapter, section) {
  if (section === 1) return true;
  for (let s = 1; s < section; s++) {
    if (!isDone(chapter, s)) return false;
  }
  return true;
}

// ── Chapter locking ─────────────────────────────────────────────────────────
export function isChapterUnlocked(chapter) {
  const requiredBadge = chapterGate[chapter];
  if (!requiredBadge) return true;
  return hasBadge(requiredBadge);
}

// ── Badge system ────────────────────────────────────────────────────────────
export function earnBadge(slug) {
  const current = getAllBadges();
  if (!current.includes(slug)) {
    current.push(slug);
    localStorage.setItem(keys.badges, JSON.stringify(current));
  }
  localStorage.setItem(keys.badge(slug), '1');
}

export function hasBadge(slug) {
  return localStorage.getItem(keys.badge(slug)) === '1';
}

export function getAllBadges() {
  try {
    return JSON.parse(localStorage.getItem(keys.badges) || '[]');
  } catch {
    return [];
  }
}

// ── Question caching ─────────────────────────────────────────────────────────
export function getCachedQuestions(chapter, section) {
  const raw = localStorage.getItem(keys.cache(chapter, section));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setCachedQuestions(chapter, section, questions) {
  localStorage.setItem(keys.cache(chapter, section), JSON.stringify(questions));
}

export function clearCache(chapter, section) {
  localStorage.removeItem(keys.cache(chapter, section));
}

// ── API call ─────────────────────────────────────────────────────────────────
export async function callCoach(systemPrompt, userContent, maxTokens = MAX_TOKENS_COACH) {
  const res = await fetch(`${API_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '(no body)');
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();

  const textBlock = Array.isArray(data.content)
    ? data.content.find(b => b.type === 'text')
    : null;

  if (!textBlock) {
    throw new Error(`Unexpected response shape: ${JSON.stringify(data)}`);
  }

  return textBlock.text;
}

// ── Fallback questions (used when AI returns unparseable JSON) ───────────────
const FALLBACKS = {
  // chapter → section → fallback array
  '1_2': [
    { vague: 'Make it better', specific: 'Change the button background to #ff6b6b and make it 48px tall', why: 'Specific = measurable result' },
    { vague: 'Fix the layout', specific: 'Move the title to the top-left with 16px padding', why: 'Exact position and spacing' },
    { vague: 'Add something cool', specific: 'Add a blinking cursor animation after the last word', why: 'Describes the behavior, not a feeling' },
    { vague: 'Make the text nicer', specific: 'Change the font to Georgia, size 18px, line-height 1.6', why: 'Every visual attribute named' },
  ],
  '1_3': [
    { bad_prompt: 'Make the card look professional', hint: 'What does professional look like? Pick one visual property to specify.' },
    { bad_prompt: 'Add some color', hint: 'Which element? What color exactly (name or hex)?' },
  ],
  '2_2': [
    { prompt: 'Add a button that rolls the dice, shows the result, and plays a sound', classification: 'many-asks', why: 'Three separate actions in one prompt' },
    { prompt: 'Show one random number between 1 and 6', classification: 'one-ask', why: 'Single, clear output' },
    { prompt: 'Build the whole dice game', classification: 'many-asks', why: '"Whole game" is undefined scope' },
    { prompt: 'Make the number text bold and 64px', classification: 'one-ask', why: 'Two style properties = still one visual ask' },
  ],
  '2_3': [
    { big_prompt: 'Add a timer that counts down from 60, turns red at 10 seconds, and plays a sound when done', hint: 'Break this into 4+ steps. What must exist before the next thing can work?' },
    { big_prompt: 'Build a form that validates email, checks password length, and shows a success screen', hint: 'Each validation rule is its own ask. What order makes sense?' },
  ],
  '3_2': [
    { vague: 'Show the answer rounded off', specific: 'Show the answer rounded to 2 decimal places', why: 'How many decimal places is specified' },
    { vague: 'Make the input accept only numbers', specific: 'Restrict the input to digits 0-9 and one decimal point; reject letters and symbols', why: 'Edge cases (decimal point, minus sign) are spelled out' },
    { vague: 'Put the result somewhere visible', specific: 'Display the result in a bold span directly below the input, with 12px top margin', why: 'Position, weight, and spacing are all named' },
    { vague: 'Handle wrong input', specific: 'If the input is empty or non-numeric, show the text "Please enter a number" in red below the field', why: 'Error state, message text, and color are all specified' },
  ],
  '3_3': [
    { bad_prompt: 'Add a label', what_went_wrong: 'No position, no text content, no font style — AI guessed all three wrong' },
    { bad_prompt: 'Make it update', what_went_wrong: 'Update on what trigger? Keypress, blur, button click? All different behaviors.' },
    { bad_prompt: 'Show the total', what_went_wrong: 'Total of what? In what unit? To how many decimal places?' },
  ],
  '4_2': [
    { ai_response: 'To use CesiumJS without an API key, set Cesium.Ion.defaultAccessToken to an empty string ""', classification: 'hallucination', why: 'Correct approach is undefined, not empty string' },
    { ai_response: 'The CSS property for rounded corners is border-curve', classification: 'hallucination', why: 'Correct property is border-radius' },
    { ai_response: 'localStorage.getItem returns null if the key doesn\'t exist', classification: 'correct', why: 'This is accurate MDN behavior' },
    { ai_response: 'You can use fetch() in any browser without polyfills as of 2024', classification: 'correct', why: 'All modern browsers support fetch natively' },
    { ai_response: 'To center a div with flexbox, use display:flex; align-items:center; justify-content:center on the parent', classification: 'correct', why: 'Standard flexbox centering' },
  ],
  '4_3': [
    { scenario: 'AI keeps adding a Mars tile layer but the globe still shows Earth. You\'ve asked three times.', hint: 'Stop repeating the same prompt. What specific thing can you verify (check in browser console, check URL it\'s requesting)?' },
    { scenario: 'AI says a CSS property doesn\'t exist but you saw it in a tutorial.', hint: 'Don\'t argue — verify. How? (MDN, browser devtools, a tiny test snippet)' },
  ],
  '5_2': [
    { decision: 'App has a minor alignment bug. 45 min to demo. Fix the bug.', classification: 'good', why: 'Polish is worth it when it\'s quick and visible' },
    { decision: 'App works. Add an animated loading screen before demo.', classification: 'scope-creep', why: 'New feature with no time to test = risk with no reward' },
    { decision: 'Write your demo script before adding the last feature.', classification: 'good', why: 'Demo prep is directorial work; the feature might not matter' },
  ],
  '5_3': [
    { scenario: 'Your app has 2 bugs, 1 half-done feature, and 40 minutes left. Parents arrive in 45 min.', hint: 'Prioritize by what parents will see. What can you hide vs fix vs cut?' },
    { scenario: 'AI is proposing a great new feature you hadn\'t thought of. It would take 30 min. You have 35 min left.', hint: 'Is 5 minutes enough buffer to test and explain? What\'s the cost if it breaks?' },
  ],
};

function getFallback(chapter, section) {
  return FALLBACKS[`${chapter}_${section}`] || [
    { question: 'Fallback question — describe one thing you want to improve about your current work.', hint: 'Be specific.' },
  ];
}

// ── Question generation ──────────────────────────────────────────────────────
const GENERATION_PROMPTS = {
  '1_2': (count) => `Generate ${count} pairs of prompts for a coding task. Each pair has one vague version and one specific version of the same request. Context: a kid building a simple personal profile card webpage. Return a JSON array only, no other text. Format: [{"vague":"...","specific":"...","why":"one sentence explaining what makes the specific version better"}]`,
  '1_3': (count) => `Generate ${count} bad, vague prompts someone might give an AI when building a simple webpage. Each should be fixable by adding one or two specific details. Return a JSON array only. Format: [{"bad_prompt":"...","hint":"one sentence nudging toward what detail is missing"}]`,
  '2_2': (count) => `Generate ${count} prompts for building a dice roller web app. Mix of "one-ask" (a single clear request) and "many-asks" (multiple things bundled together). Return a JSON array only. Format: [{"prompt":"...","classification":"one-ask|many-asks","why":"one sentence explanation"}]`,
  '2_3': (count) => `Generate ${count} "big prompt" examples for building simple web apps — prompts that bundle too many things together and should be broken into smaller steps. Return a JSON array only. Format: [{"big_prompt":"...","hint":"one sentence about how to start breaking it down"}]`,
  '3_2': (count) => `Generate ${count} pairs of requirements for a unit converter web app (km/miles, celsius/fahrenheit, etc). Each pair: one vague version and one specific version. Return a JSON array only. Format: [{"vague":"...","specific":"...","why":"one sentence on what the specific version adds"}]`,
  '3_3': (count) => `Generate ${count} scenarios where a student wrote a vague prompt, the AI built something that was technically correct but wrong in 2-3 ways. Keep scenarios short and concrete. Return a JSON array only. Format: [{"bad_prompt":"...","what_went_wrong":"what the AI built that surprised the student"}]`,
  '4_2': (count) => `Generate ${count} AI responses to beginner web dev questions. Mix of: correct, hallucination (confidently wrong), and half-right. Topics: HTML/CSS/JavaScript/browser APIs. Return a JSON array only. Format: [{"ai_response":"...","classification":"correct|hallucination|half-right","why":"one sentence explanation"}]`,
  '4_3': (count) => `Generate ${count} "stuck AI" scenarios — the AI gave a wrong or unhelpful answer and the student doesn't know what to do next. Return a JSON array only. Format: [{"scenario":"2-3 sentence description of what happened","hint":"one sentence nudge toward verification or a new approach"}]`,
  '5_2': (count) => `Generate ${count} "director decisions" for a student demoing a web app to parents in 45 minutes. Mix of good calls (stopped, scoped down, shipped) and scope creep (added features last minute, over-polished). Return a JSON array only. Format: [{"decision":"1-2 sentence description","classification":"good|scope-creep","why":"one sentence explanation"}]`,
  '5_3': (count) => `Generate ${count} "45 minutes left" scenarios for a student finishing a web app before a parent demo. Each scenario has competing priorities. Return a JSON array only. Format: [{"scenario":"2-3 sentence description","hint":"one sentence about how a director would think about this"}]`,
};

export async function generateQuestions(chapter, section) {
  const cached = getCachedQuestions(chapter, section);
  if (cached) return cached;

  const count = WORKBOOK_CONFIG.chapters[chapter]?.[section === 2 ? 'section2Count' : 'section3Count'] ?? 3;
  const promptFn = GENERATION_PROMPTS[`${chapter}_${section}`];
  if (!promptFn) return getFallback(chapter, section);

  const systemPrompt = 'You generate educational exercises for a workbook. Return only valid JSON arrays. No markdown, no explanation, no code fences.';
  try {
    const raw = await callCoach(systemPrompt, promptFn(count), MAX_TOKENS_GENERATE);
    const questions = JSON.parse(raw);
    if (!Array.isArray(questions) || questions.length === 0) throw new Error('empty');
    setCachedQuestions(chapter, section, questions);
    return questions;
  } catch {
    const fallback = getFallback(chapter, section);
    setCachedQuestions(chapter, section, fallback);
    return fallback;
  }
}

// ── Coach system prompts ─────────────────────────────────────────────────────
export const COACH_PROMPTS = {
  global: `You are an AI coach helping a 12-year-old learn to work with AI.
Your role is ONLY to give feedback on what they wrote.
NEVER write a prompt for them. NEVER complete their exercise.
NEVER say "Great job!" or "Awesome!" — respond directly to the work.
Be brief: 2-4 sentences max.
End with ✅ (ready) or ⚠️ (one more try suggested).`,

  spot: (chapter) => ({
    1: 'Rubric: specific prompts name at least one concrete detail (color, size, position, exact wording). Vague prompts use feelings or general direction.',
    2: 'Rubric: one-ask prompts have a single action or output. Many-asks have AND or multiple verbs implying multiple results.',
    3: 'Rubric: specific requirements name units, positions, exact values, and edge cases. Vague requirements use words like "nice", "somewhere", "kind of".',
    4: 'Rubric: hallucinations state false facts confidently. Correct answers can be verified against MDN/spec. Half-right answers mix true and false.',
    5: 'Rubric: good director calls reduce scope or ship what works. Scope creep adds unplanned features with no time to test.',
  })[chapter] || '',

  tryIt: (chapter) => ({
    1: 'Rubric: the rewritten prompt must name at least one specific visual property (color, size, position, font). If it still says "better" or "nicer" with no detail, it needs work.',
    2: 'Rubric: each step in the breakdown must be a single action. Steps must be in a logical order where no step depends on a later one.',
    3: 'Rubric: the rewritten prompt must prevent the specific mismatches described. Check: are units named? Is position named? Is behavior (on keypress? on click?) named?',
    4: 'Rubric: verification method must be concrete (check the console, look at the network tab, try a test snippet). "Just ask AI again" is not verification.',
    5: 'Rubric: the student must name what they WILL NOT do, not just what they will do. The constraint is the skill.',
  })[chapter] || '',

  boss: (chapter) => ({
    1: 'Rubric — score 1-3 stars:\n1★: prompts are vague ("make it look good") or missing key visual details\n2★: prompts are specific but miss 1-2 important attributes\n3★: every prompt names exact visual properties; a stranger could build it from the prompts alone',
    2: 'Rubric — score 1-3 stars:\n1★: any step is still a "many-asks" or the order is wrong\n2★: steps are single asks but order has gaps or redundancy\n3★: all steps single asks, logical order, complete sequence — stranger could follow it',
    3: 'Rubric — score 1-3 stars:\n1★: spec is missing units, precision, or behavior triggers\n2★: mostly complete but missing 1-2 edge cases\n3★: spec is complete — units named, precision stated, error behavior described, triggers named',
    4: 'Rubric — score 1-3 stars:\n1★: verification method is vague or "ask AI again"\n2★: has a verification method and one recovery step\n3★: anticipates specific failure modes, has concrete verification, and has a clear recovery plan',
    5: 'Rubric — score 1-3 stars:\n1★: demo script is generic ("I built a website")\n2★: has a mission hook but payoff is weak\n3★: clear mission hook, shows director skill ("I told AI to..."), payoff would land with a parent in 90 seconds',
  })[chapter] || '',
};

// Default export for test runner import
export default {
  markDone, isDone, getProgress,
  isUnlocked, isChapterUnlocked,
  earnBadge, hasBadge, getAllBadges,
  getCachedQuestions, setCachedQuestions, clearCache,
  callCoach, generateQuestions,
  COACH_PROMPTS,
};
