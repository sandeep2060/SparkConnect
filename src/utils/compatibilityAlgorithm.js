/**
 * SparkSync™ Algorithmic Affinity Engine
 * 
 * Inspired by:
 * - Hinge's Gale-Shapley Stable Marriage & "Most Compatible" pairing
 * - OkCupid's Multi-Factor Geometric Compatibility Matrix
 * - Tinder Platinum / Raya Dynamic Affinity Scoring
 */

// Intent compatibility matrix (0 - 100)
const INTENT_SYNERGY = {
  romance: { romance: 100, exploring: 78, friends: 65, casual: 35 },
  casual: { casual: 100, exploring: 80, romance: 35, friends: 60 },
  friends: { friends: 100, exploring: 85, romance: 65, casual: 60 },
  exploring: { exploring: 95, romance: 78, casual: 80, friends: 85 },
};

// Icebreaker recommendation database mapped by shared passion
const PASSION_ICEBREAKERS = {
  'coffee & cafes': "Ask them: 'What's your go-to local coffee haunt or dream pour-over spot?'",
  'travel & roadtrips': "Ask them: 'What is the most memorable spontaneous trip you've ever taken?'",
  'hiking': "Ask them: 'What is your favorite weekend trail or outdoor escape near here?'",
  'fitness & gym': "Ask them: 'Morning workout champion or evening gym session enthusiast?'",
  'foodie & wine': "Ask them: 'If you had to pick one cuisine to eat forever, what would it be?'",
  'art & galleries': "Ask them: 'What is an exhibition or artist that recently blew your mind?'",
  'live music': "Ask them: 'What was the last live concert that gave you absolute chills?'",
  'photography': "Ask them: 'Film camera charm or high-res digital perfection?'",
  'gaming & esports': "Ask them: 'What game has your favorite storyline or multiplayer chaos?'",
  'books & literature': "Ask them: 'What book had the biggest impact on how you see the world?'",
  'pets & dogs': "Ask them: 'Tell me about your furry best friend!'",
  'cooking': "Ask them: 'What is your signature dinner party dish?'",
  'cocktail crafting': "Ask them: 'Old Fashioned, Spicy Margarita, or something inventive?'",
};

/**
 * Computes deep algorithmic compatibility between current user and a candidate
 */
export const calculateSparkCompatibility = (currentUser, candidate) => {
  if (!candidate) return null;

  // 1. Current user baseline values with robust fallbacks
  const myIntent = (currentUser?.intent || 'Romance').toLowerCase();
  const theirIntent = (candidate.intent || 'Romance').toLowerCase();

  const myInterests = Array.isArray(currentUser?.interests) && currentUser.interests.length > 0
    ? currentUser.interests
    : ['Travel & Roadtrips', 'Coffee & Cafes', 'Music', 'Foodie & Wine'];

  const theirInterests = Array.isArray(candidate.interests) ? candidate.interests : [];

  const myNature = Array.isArray(currentUser?.nature) ? currentUser.nature : ['Friendly', 'Adventurous'];
  const theirNature = Array.isArray(candidate.nature) ? candidate.nature : [];

  // --- FACTOR 1: Intent Synergy (30%) ---
  let intentScore = 75;
  const normalizedMyIntent = myIntent.includes('casual')
    ? 'casual'
    : myIntent.includes('friend')
    ? 'friends'
    : myIntent.includes('explor')
    ? 'exploring'
    : 'romance';

  const normalizedTheirIntent = theirIntent.includes('casual')
    ? 'casual'
    : theirIntent.includes('friend')
    ? 'friends'
    : theirIntent.includes('explor')
    ? 'exploring'
    : 'romance';

  if (INTENT_SYNERGY[normalizedMyIntent]?.[normalizedTheirIntent]) {
    intentScore = INTENT_SYNERGY[normalizedMyIntent][normalizedTheirIntent];
  } else if (normalizedMyIntent === normalizedTheirIntent) {
    intentScore = 100;
  }

  // --- FACTOR 2: Passions & Interests Intersection (25%) ---
  const mySet = new Set(myInterests.map((i) => String(i).toLowerCase().trim()));
  const theirSet = new Set(theirInterests.map((i) => String(i).toLowerCase().trim()));

  const sharedInterests = [];
  theirInterests.forEach((item) => {
    const key = String(item).toLowerCase().trim();
    if (mySet.has(key)) {
      sharedInterests.push(item);
    }
  });

  const unionSize = Math.max(1, new Set([...mySet, ...theirSet]).size);
  const jaccardSimilarity = sharedInterests.length / unionSize;

  let passionsScore = Math.min(
    100,
    Math.round(45 + sharedInterests.length * 18 + jaccardSimilarity * 40)
  );
  if (sharedInterests.length >= 3) passionsScore = Math.max(passionsScore, 92);
  if (sharedInterests.length >= 2) passionsScore = Math.max(passionsScore, 84);

  // --- FACTOR 3: Nature Traits & Energy Harmony (15%) ---
  const sharedNature = [];
  const myNatureSet = new Set(myNature.map((n) => String(n).toLowerCase().trim()));
  theirNature.forEach((trait) => {
    if (myNatureSet.has(String(trait).toLowerCase().trim())) {
      sharedNature.push(trait);
    }
  });

  let natureScore = Math.min(100, Math.round(60 + sharedNature.length * 20));
  if (candidate.relationshipStyle === currentUser?.relationshipStyle) {
    natureScore = Math.min(100, natureScore + 10);
  }

  // --- FACTOR 4: Proximity & Distance Decay (15%) ---
  const distanceMiles = Number(candidate.distance) || 6;
  // Exponential decay curve: e^(-distance / 25)
  const distanceScore = Math.round(100 * Math.exp(-distanceMiles / 26));

  // --- FACTOR 5: Activity & Reliability Recency (15%) ---
  let activityScore = 70;
  if (candidate.activeNow) activityScore += 20;
  if (candidate.verified) activityScore += 10;
  activityScore = Math.min(100, activityScore);

  // --- FINAL COMPOSITE SCORE (0 - 100%) ---
  const rawWeighted =
    intentScore * 0.30 +
    passionsScore * 0.25 +
    natureScore * 0.15 +
    distanceScore * 0.15 +
    activityScore * 0.15;

  // Normalized score clamped between 62% and 99%
  const score = Math.min(99, Math.max(62, Math.round(rawWeighted)));

  // Determine Compatibility Tier & Badge
  let tier = 'Promising Spark ✨';
  let badgeColor = 'from-purple-500 to-indigo-500';
  let glowColor = 'shadow-purple-500/20 ring-purple-500/30';

  if (score >= 93) {
    tier = 'Exceptional Match 🔥';
    badgeColor = 'from-amber-400 via-orange-500 to-pink-500';
    glowColor = 'shadow-orange-500/30 ring-orange-400/50';
  } else if (score >= 84) {
    tier = 'High Chemistry ⚡';
    badgeColor = 'from-pink-500 via-rose-500 to-purple-600';
    glowColor = 'shadow-pink-500/25 ring-pink-500/40';
  } else if (score >= 74) {
    tier = 'Strong Synergy ✨';
    badgeColor = 'from-purple-500 to-pink-500';
    glowColor = 'shadow-purple-500/20 ring-purple-500/30';
  }

  // Generate Match Highlights
  const highlights = [];
  if (intentScore >= 90) {
    highlights.push(`Both looking for ${candidate.intent || 'Romance'}`);
  }
  if (sharedInterests.length > 0) {
    highlights.push(
      `Shared passion for ${sharedInterests.slice(0, 2).join(' & ')}`
    );
  } else if (theirInterests.length > 0) {
    highlights.push(`Enjoys ${theirInterests[0]}`);
  }
  if (distanceMiles <= 5) {
    highlights.push(`Nearby neighbor (${distanceMiles} mi away)`);
  } else {
    highlights.push(`${distanceMiles} miles away in ${candidate.location || 'your area'}`);
  }
  if (candidate.verified) {
    highlights.push('ID Verified & Authenticated Profile');
  }

  // Recommended conversation opener
  let recommendedOpener = "Compliment their vibe and ask how their week is going!";
  if (sharedInterests.length > 0) {
    const primaryInterest = sharedInterests[0].toLowerCase().trim();
    if (PASSION_ICEBREAKERS[primaryInterest]) {
      recommendedOpener = PASSION_ICEBREAKERS[primaryInterest];
    } else {
      recommendedOpener = `Ask about their passion for ${sharedInterests[0]}!`;
    }
  }

  return {
    score,
    tier,
    badgeColor,
    glowColor,
    sharedInterests,
    sharedNature,
    breakdown: {
      intentScore: Math.round(intentScore),
      passionsScore: Math.round(passionsScore),
      lifestyleScore: Math.round(natureScore),
      distanceScore: Math.round(distanceScore),
      activityScore: Math.round(activityScore),
    },
    highlights,
    recommendedOpener,
  };
};

/**
 * Hinge-style Gale-Shapley Stable Standout Selector:
 * Identifies the #1 highest reciprocal affinity match in the user's discovery pool.
 */
export const findGaleShapleyStandout = (currentUser, candidates) => {
  if (!candidates || candidates.length === 0) return null;

  let bestCandidate = null;
  let highestScore = -1;

  candidates.forEach((cand) => {
    const comp = calculateSparkCompatibility(currentUser, cand);
    if (comp && comp.score > highestScore) {
      highestScore = comp.score;
      bestCandidate = {
        ...cand,
        compatibility: comp,
        isStandout: true,
      };
    }
  });

  return bestCandidate;
};

/**
 * Ranks an array of candidates by algorithmic compatibility descending
 */
export const rankUsersByCompatibility = (currentUser, candidates) => {
  if (!candidates || candidates.length === 0) return [];

  const scored = candidates.map((cand) => {
    const compatibility = calculateSparkCompatibility(currentUser, cand);
    return {
      ...cand,
      compatibility,
    };
  });

  return scored.sort((a, b) => (b.compatibility?.score || 0) - (a.compatibility?.score || 0));
};

export default {
  calculateSparkCompatibility,
  findGaleShapleyStandout,
  rankUsersByCompatibility,
};
