import { AIUserProfile, AIGlobalFeedback, UserActivity } from '../db.js';

// Decay factor applied to learned preferences on each update
const DECAY_MULTIPLIER = 0.95;

// Weight mapping for user actions
const ACTION_WEIGHTS = {
  view: 1.0,
  like: 5.0,
  save: 8.0,
  share: 6.0,
  comment: 7.0,
  dismiss: -4.0,
};

// Safely parse JSON strings
function parseJson(str, fallback = {}) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

// Ensure global feedback parameters exist in the database
async function getGlobalParam(key, defaultValue) {
  try {
    let param = await AIGlobalFeedback.findOne({ param_key: key });
    if (!param) {
      param = await AIGlobalFeedback.create({
        param_key: key,
        param_value: defaultValue,
        feedback_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    return param ? param.param_value : defaultValue;
  } catch (err) {
    console.warn(`[AI Engine] Error fetching global param ${key}:`, err.message);
    return defaultValue;
  }
}

// Update a global parameter in the DB
async function updateGlobalParam(key, nextValue) {
  try {
    const param = await AIGlobalFeedback.findOne({ param_key: key });
    if (param) {
      await AIGlobalFeedback.findByIdAndUpdate(param.$id, {
        param_value: nextValue,
        feedback_count: (param.feedback_count || 0) + 1,
        updated_at: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn(`[AI Engine] Error updating global param ${key}:`, err.message);
  }
}

/**
 * Update the user's preference profile based on a new interaction
 */
export async function updateUserProfileInterest(userId, { action, targetId, targetType, category = '', duration = 0 }) {
  if (!userId) return;

  try {
    // 1. Log raw activity
    await UserActivity.create({
      user_id: userId,
      action,
      target_id: targetId,
      target_type: targetType,
      category: category || '',
      duration: duration || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 2. Fetch or create AI profile
    let profile = await AIUserProfile.findOne({ user_id: userId });
    if (!profile) {
      profile = await AIUserProfile.create({
        user_id: userId,
        category_scores: '{}',
        creator_scores: '{}',
        exploration_epsilon: 0.2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    if (!profile) return;

    // Parse scores
    const categoryScores = parseJson(profile.category_scores, {});
    const creatorScores = parseJson(profile.creator_scores, {});

    // Apply exponential decay to all existing scores (fade old preferences)
    Object.keys(categoryScores).forEach(cat => {
      categoryScores[cat] = Number((categoryScores[cat] * DECAY_MULTIPLIER).toFixed(4));
    });
    Object.keys(creatorScores).forEach(cr => {
      creatorScores[cr] = Number((creatorScores[cr] * DECAY_MULTIPLIER).toFixed(4));
    });

    // Calculate action weight
    let weight = ACTION_WEIGHTS[action] || 1.0;
    if (action === 'view' && duration > 12) {
      weight += 2.0; // High retention bonus
    }

    // Apply new weights for categories/tags
    if (category) {
      const tags = category.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      tags.forEach(tag => {
        categoryScores[tag] = Number(((categoryScores[tag] || 0) + weight).toFixed(4));
      });
    }

    // Apply creator weight (if targetType is reel, targetId or custom creator is logged)
    if (targetType === 'reel') {
      creatorScores[targetId] = Number(((creatorScores[targetId] || 0) + weight).toFixed(4));
    }

    // Save updated scores
    await AIUserProfile.findByIdAndUpdate(profile.$id, {
      category_scores: JSON.stringify(categoryScores),
      creator_scores: JSON.stringify(creatorScores),
      updated_at: new Date().toISOString()
    });

    console.log(`[AI Engine] Learnt preferences for User ${userId}:`, {
      action,
      category,
      weight
    });
  } catch (err) {
    console.error('[AI Engine] Error updating profile interests:', err);
  }
}

/**
 * Score content items (Reels/Clips) for a specific user dynamically
 */
export async function scoreContentForUser(userId, items = [], itemScoresMap = {}) {
  if (items.length === 0) return items;

  try {
    const explorationEpsilon = await getGlobalParam('exploration_epsilon', 0.2);
    
    // If anonymous, sort by default scoring (viral score/GVCA)
    if (!userId) {
      return items.sort((a, b) => {
        const scoreA = itemScoresMap[a.id || a._id] || 0;
        const scoreB = itemScoresMap[b.id || b._id] || 0;
        return scoreB - scoreA;
      });
    }

    // Fetch user AI profile
    const profile = await AIUserProfile.findOne({ user_id: userId });
    if (!profile) {
      // Revert to standard viral sort if no profile exists yet
      return items.sort((a, b) => {
        const scoreA = itemScoresMap[a.id || a._id] || 0;
        const scoreB = itemScoresMap[b.id || b._id] || 0;
        return scoreB - scoreA;
      });
    }

    const categoryScores = parseJson(profile.category_scores, {});
    const creatorScores = parseJson(profile.creator_scores, {});

    // Personalize scores
    const scored = items.map(item => {
      const itemId = item.id || item._id;
      const baseScore = itemScoresMap[itemId] || 1.0;
      
      // Calculate category preference matching
      let categoryMatch = 0.0;
      const tags = Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []);
      tags.forEach(tag => {
        const cleanTag = String(tag).trim().toLowerCase();
        if (categoryScores[cleanTag]) {
          categoryMatch += categoryScores[cleanTag];
        }
      });

      // Creator preference matching
      const creatorMatch = creatorScores[item.creator_id] || 0.0;

      // Personalized recommendation formula
      const personalizedScore = baseScore * (1.0 + Math.max(-0.9, categoryMatch + creatorMatch));

      return {
        item,
        baseScore,
        personalizedScore,
        isExploratory: false
      };
    });

    // Implement Epsilon-Greedy exploration/exploitation loop
    const exploitationCount = Math.floor(scored.length * (1.0 - explorationEpsilon));
    
    // Sort by personalized score
    scored.sort((a, b) => b.personalizedScore - a.personalizedScore);

    // Epsilon portion: Inject fresh or high baseScore items the user hasn't fully matches yet to keep feed alive
    const exploitationSet = scored.slice(0, exploitationCount);
    const explorationCandidates = scored.slice(exploitationCount);

    // Shuffle exploration candidates to allow discovery
    for (let i = explorationCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [explorationCandidates[i], explorationCandidates[j]] = [explorationCandidates[j], explorationCandidates[i]];
      explorationCandidates[i].isExploratory = true;
    }

    const merged = [...exploitationSet, ...explorationCandidates];

    // Return the sorted reels
    return merged.map(entry => ({
      ...entry.item,
      ai_score: Number(entry.personalizedScore.toFixed(3)),
      ai_exploratory: entry.isExploratory
    }));

  } catch (err) {
    console.error('[AI Engine] Content scoring failed:', err);
    return items;
  }
}

/**
 * Self-learning global feedback loop to adjust recommendation epsilon
 */
export async function processGlobalLearning(action, recommendedReelId, isPersonalizedClick = false) {
  try {
    const explorationEpsilon = await getGlobalParam('exploration_epsilon', 0.2);

    if (action === 'click_recommendation') {
      if (isPersonalizedClick) {
        // AI recommended successfully! Reduce exploration, focus on personalization
        const nextEpsilon = Math.max(0.05, Number((explorationEpsilon - 0.005).toFixed(4)));
        await updateGlobalParam('exploration_epsilon', nextEpsilon);
        console.log(`[AI Server learning] Personalization successful. Reduced epsilon to ${nextEpsilon}`);
      } else {
        // User clicked something else, increase exploration to find new trends
        const nextEpsilon = Math.min(0.50, Number((explorationEpsilon + 0.008).toFixed(4)));
        await updateGlobalParam('exploration_epsilon', nextEpsilon);
        console.log(`[AI Server learning] Explorer clicked. Increased epsilon to ${nextEpsilon}`);
      }
    }
  } catch (err) {
    console.warn('[AI Engine] Global feedback learning failed:', err.message);
  }
}
