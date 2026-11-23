/**
 * Moderation Helper
 * Provides banned word / profanity filtering for bios, messages, and pseudonyms
 */

export const BANNED_WORDS = [
  'scam',
  'escort service',
  'wire transfer',
  'cashapp me',
  'venmo me',
  'paypal me',
  'crypto transfer',
  'underage',
  'minor',
  'child',
  'kill yourself',
  'hatecrime',
  'nazi',
  'terrorist'
];

/**
 * Checks if a string contains banned words or predatory phrases
 * @param {string} text Input text
 * @returns {boolean} True if text contains prohibited content
 */
export function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

/**
 * Replaces banned words with asterisks
 * @param {string} text Input text
 * @returns {string} Cleaned text
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  let sanitized = text;
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(word, 'gi');
    sanitized = sanitized.replace(regex, '*'.repeat(word.length));
  }
  return sanitized;
}
