/**
 * Fuzzy Search & Spelling Suggestion Utilities for SparkConnect / LoveBook
 * Enables flexible matching on user's name, username, pseudonym, and interests.
 * Automatically handles typos, phonetic similarities, and alternative spellings.
 */

// 1. Damerau-Levenshtein distance (handles insertions, deletions, substitutions, and transpositions)
export const damerauLevenshteinDistance = (source, target) => {
  const s = (source || '').toLowerCase().trim();
  const t = (target || '').toLowerCase().trim();

  if (!s) return t.length;
  if (!t) return s.length;
  if (s === t) return 0;

  const sLen = s.length;
  const tLen = t.length;

  // Initialize matrix
  const matrix = Array.from({ length: sLen + 1 }, () => new Array(tLen + 1).fill(0));

  for (let i = 0; i <= sLen; i++) matrix[i][0] = i;
  for (let j = 0; j <= tLen; j++) matrix[0][j] = j;

  for (let i = 1; i <= sLen; i++) {
    for (let j = 1; j <= tLen; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (
        i > 1 &&
        j > 1 &&
        s[i - 1] === t[j - 2] &&
        s[i - 2] === t[j - 1]
      ) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost);
      }
    }
  }

  return matrix[sLen][tLen];
};

// 2. Consonant skeleton (strips vowels and non-alpha to match phonetic roots: e.g. 'sita' -> 'st', 'seeta' -> 'st')
export const getConsonantSkeleton = (str) => {
  if (!str) return '';
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleaned) return '';
  // Keep first letter even if vowel, then drop vowels
  const first = cleaned[0];
  const rest = cleaned.slice(1).replace(/[aeiouy]/g, '');
  return (first + rest).replace(/(.)\1+/g, '$1'); // Collapse consecutive duplicates
};

// 3. Normalized similarity score between two strings (0.0 to 1.0)
export const calculateStringSimilarity = (str1, str2) => {
  const s1 = (str1 || '').toLowerCase().trim();
  const s2 = (str2 || '').toLowerCase().trim();

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  const minLen = Math.min(s1.length, s2.length);
  const maxLen = Math.max(s1.length, s2.length);

  // Exact prefix match (require at least 2 chars if maxLen > 3 to avoid single-letter collisions)
  if ((s2.startsWith(s1) || s1.startsWith(s2)) && (minLen >= 2 || maxLen <= 3)) {
    return 0.85 + 0.15 * (minLen / maxLen);
  }

  // Meaningful substring match (require at least 3 chars or at least 50% length match)
  if ((s2.includes(s1) || s1.includes(s2)) && minLen >= 3 && minLen / maxLen >= 0.4) {
    return 0.75 + 0.20 * (minLen / maxLen);
  }

  const dist = damerauLevenshteinDistance(s1, s2);
  const levRatio = Math.max(0, 1 - dist / maxLen);

  // Consonant skeleton similarity (only if both strings have meaningful length >= 3)
  let skBonus = 0;
  if (minLen >= 3) {
    const sk1 = getConsonantSkeleton(s1);
    const sk2 = getConsonantSkeleton(s2);
    if (sk1 && sk2 && sk1.length >= 2 && sk2.length >= 2) {
      if (sk1 === sk2) {
        skBonus = 0.25;
      } else if (sk1.startsWith(sk2) || sk2.startsWith(sk1)) {
        skBonus = 0.15;
      }
    }
  }

  return Math.min(1.0, levRatio + skBonus);
};

// 4. Test a candidate token against query
export const evaluateFieldMatch = (fieldValue, query) => {
  if (!fieldValue || !query) return { isExact: false, isFuzzy: false, score: 0 };

  const q = query.toLowerCase().trim();
  const val = String(fieldValue).toLowerCase().trim();

  if (val === q) {
    return { isExact: true, isFuzzy: false, score: 100 };
  }

  if (val.startsWith(q)) {
    return { isExact: true, isFuzzy: false, score: 95 };
  }

  if (val.includes(q)) {
    return { isExact: true, isFuzzy: false, score: 90 };
  }

  // Split into words (tokens) to match individual words like "Elena" or "Rostova"
  const tokens = val.split(/[\s_\-.]+/).filter(Boolean);
  for (const token of tokens) {
    if (token === q) {
      return { isExact: true, isFuzzy: false, score: 92 };
    }
    if (token.startsWith(q)) {
      return { isExact: true, isFuzzy: false, score: 88 };
    }
    if (token.includes(q) && q.length >= 3) {
      return { isExact: true, isFuzzy: false, score: 85 };
    }
  }

  // Calculate best fuzzy score across whole value and individual tokens
  let bestSim = calculateStringSimilarity(q, val);
  for (const token of tokens) {
    const sim = calculateStringSimilarity(q, token);
    if (sim > bestSim) bestSim = sim;
  }

  // Check acceptable fuzzy thresholds
  // For queries of length 3-4, allow distance <= 1 or similarity >= 0.7
  // For queries of length >= 5, allow distance <= 2 or similarity >= 0.65
  const minThreshold = q.length <= 4 ? 0.70 : 0.62;

  if (bestSim >= minThreshold) {
    return {
      isExact: false,
      isFuzzy: true,
      score: Math.round(bestSim * 80), // 50 to 80
    };
  }

  return { isExact: false, isFuzzy: false, score: 0 };
};

// 5. Calculate overall match score for a user
export const calculateUserSearchScore = (user, query) => {
  if (!query || !query.trim()) {
    return { isExact: true, isFuzzy: false, score: 100, matchedReason: '' };
  }

  const q = query.toLowerCase().trim();
  let highestScore = 0;
  let isExact = false;
  let isFuzzy = false;
  let matchedReason = '';
  let suggestedName = user.name || user.username || user.pseudonym || '';

  // Priority 1: User's Username
  if (user.username) {
    const m = evaluateFieldMatch(user.username, q);
    if (m.score > highestScore) {
      highestScore = m.score;
      isExact = m.isExact;
      isFuzzy = m.isFuzzy;
      matchedReason = m.isExact ? `@${user.username}` : `Similar to @${user.username}`;
      suggestedName = user.username;
    }
  }

  // Priority 2: User's Full Name / Display Name
  const fullName = user.name || user.displayName;
  if (fullName) {
    const m = evaluateFieldMatch(fullName, q);
    if (m.score > highestScore) {
      highestScore = m.score;
      isExact = m.isExact;
      isFuzzy = m.isFuzzy;
      matchedReason = m.isExact ? fullName : `Similar to ${fullName}`;
      suggestedName = fullName;
    }
  }

  // Priority 3: User's Pseudonym (for Stranger Mode / Mystery Member)
  if (user.pseudonym) {
    const m = evaluateFieldMatch(user.pseudonym, q);
    if (m.score > highestScore) {
      highestScore = m.score;
      isExact = m.isExact;
      isFuzzy = m.isFuzzy;
      matchedReason = m.isExact ? user.pseudonym : `Similar to ${user.pseudonym}`;
      suggestedName = user.pseudonym;
    }
  }

  // Priority 4: City / Location
  if (user.location || user.city) {
    const loc = user.location || user.city;
    if (loc.toLowerCase().includes(q)) {
      const locScore = 40;
      if (locScore > highestScore) {
        highestScore = locScore;
        isExact = true;
        matchedReason = `Located in ${loc}`;
      }
    }
  }

  // Priority 5: Interests & Passions
  if (Array.isArray(user.interests)) {
    const matchedInterest = user.interests.find((i) =>
      i.toLowerCase().includes(q)
    );
    if (matchedInterest) {
      const interestScore = 35;
      if (interestScore > highestScore) {
        highestScore = interestScore;
        isExact = true;
        matchedReason = `Passionate about ${matchedInterest}`;
      }
    }
  }

  // Priority 6: Bio
  if (user.bio && user.bio.toLowerCase().includes(q)) {
    const bioScore = 30;
    if (bioScore > highestScore) {
      highestScore = bioScore;
      isExact = true;
      matchedReason = 'Mentioned in bio';
    }
  }

  return {
    isExact,
    isFuzzy,
    score: highestScore,
    matchedReason,
    suggestedName,
  };
};

/**
 * 6. Main flexible search function:
 * Takes full list of users and search query string.
 * Returns:
 * {
 *   results: Array of matching users,
 *   isFuzzyFallback: boolean (true if showing related name spellings because exact matches = 0),
 *   suggestions: Array of suggested name/spelling strings,
 *   totalMatches: number
 * }
 */
export const searchAndRankUsers = (users = [], query = '') => {
  if (!query || !query.trim()) {
    return {
      results: users,
      isFuzzyFallback: false,
      suggestions: [],
      totalMatches: users.length,
    };
  }

  const q = query.trim();
  const scoredUsers = users
    .map((user) => {
      const match = calculateUserSearchScore(user, q);
      return {
        ...user,
        _searchMatch: match,
      };
    })
    .filter((u) => u._searchMatch.score > 0);

  const exactMatches = scoredUsers.filter((u) => u._searchMatch.isExact);
  const fuzzyMatches = scoredUsers.filter((u) => u._searchMatch.isFuzzy && !u._searchMatch.isExact);

  // Sort by highest matching score first
  exactMatches.sort((a, b) => b._searchMatch.score - a._searchMatch.score);
  fuzzyMatches.sort((a, b) => b._searchMatch.score - a._searchMatch.score);

  // Generate unique spelling suggestions
  const suggestionSet = new Set();
  [...fuzzyMatches, ...exactMatches].forEach((u) => {
    if (u.name && u.name.toLowerCase() !== q.toLowerCase()) {
      suggestionSet.add(u.name);
    }
    if (u.username && u.username.toLowerCase() !== q.toLowerCase()) {
      suggestionSet.add(`@${u.username}`);
    }
  });

  const suggestions = Array.from(suggestionSet).slice(0, 5);

  // Scenario A: Exact matches exist
  if (exactMatches.length > 0) {
    return {
      results: exactMatches,
      isFuzzyFallback: false,
      suggestions,
      totalMatches: exactMatches.length,
    };
  }

  // Scenario B: No exact matches, but related name spellings / fuzzy matches exist!
  if (fuzzyMatches.length > 0) {
    return {
      results: fuzzyMatches,
      isFuzzyFallback: true,
      suggestions,
      totalMatches: fuzzyMatches.length,
    };
  }

  // Scenario C: No matches at all
  return {
    results: [],
    isFuzzyFallback: false,
    suggestions: [],
    totalMatches: 0,
  };
};

export default searchAndRankUsers;
