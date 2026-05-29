// SM-2 Spaced Repetition Algorithm
class SpacedRepetition {
  constructor(storageKey = 'keybind_progress') {
    this.storageKey = storageKey;
    this.data = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : this.defaultData();
    } catch {
      return this.defaultData();
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  defaultData() {
    return {
      xp: 0,
      level: 1,
      totalXP: 0,
      bestStreak: 0,
      currentStreak: 0,
      totalSessions: 0,
      totalReviews: 0,
      totalCorrect: 0,
      perfectSessions: 0,
      lastActiveDate: null,
      streakStartDate: null,
      keys: {},      // { [id]: { interval, repetition, easeFactor, dueDate, lastResult, timesReviewed, timesCorrect } }
      dailyHistory: {}, // { "YYYY-MM-DD": { reviews, correct, xp } }
      sessionHistory: [], // [{ date, mode, category, total, correct, xp, duration }]
      achievements: [],
      sessionStart: null,
      todayXP: 0,
    };
  }

  // Initialize a key if not tracked
  initKey(id) {
    if (!this.data.keys[id]) {
      this.data.keys[id] = {
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        dueDate: Date.now(), // due now
        lastResult: null,
        timesReviewed: 0,
        timesCorrect: 0,
        timesSeen: 0,       // how many times answer was shown
        timesRevealed: 0,    // how many times user needed to reveal
      };
    }
  }

  // Learning phase for a key:
  // "learn" (show answer) → "scaffold" (show with reveal button) → "recall" (no hint)
  getPhase(id) {
    const state = this.data.keys[id];
    if (!state) return 'learn';     // never seen — show answer
    if (state.timesSeen < 2) return 'learn';
    if (state.timesReviewed < 4) return 'scaffold';
    return 'recall';
  }

  // SM-2 algorithm: update after a review
  // grade: "again" (0), "hard" (1), "good" (2), "easy" (3)
  review(id, grade, wasRevealed = false) {
    this.initKey(id);
    const k = this.data.keys[id];
    k.timesReviewed++;
    if (wasRevealed) k.timesRevealed++;
    else k.timesSeen++;

    const qualityMap = { again: 0, hard: 1, good: 2, easy: 3 };
    const quality = qualityMap[grade] ?? 2;
    k.lastResult = grade;

    if (grade === "again") {
      k.repetition = 0;
      k.interval = 1; // 1 day (review again soon)
      k.easeFactor = Math.max(1.3, k.easeFactor - 0.2);
    } else {
      if (k.repetition === 0) {
        k.interval = 1; // 1 day
      } else if (k.repetition === 1) {
        k.interval = 6; // 6 days
      } else {
        k.interval = Math.round(k.interval * k.easeFactor);
      }
      k.repetition++;
      
      // Adjust ease factor
      const gradeBonus = { hard: -0.15, good: 0, easy: 0.15 };
      k.easeFactor = Math.max(1.3, k.easeFactor + (gradeBonus[grade] || 0));
    }

    // Set due date
    const intervalMs = k.interval * 24 * 60 * 60 * 1000; // days
    k.dueDate = Date.now() + intervalMs;

    if (quality >= 2) {
      k.timesCorrect++;
    }

    this.save();
  }

  // Get keys that are due for review
  // Includes: never-reviewed keys (always due) + reviewed keys past their due date
  getDueKeys(limit = 20) {
    const now = Date.now();
    const due = KEYBINDS
      .filter(k => {
        const state = this.data.keys[k.id];
        // Never reviewed = always due
        if (!state) return true;
        return state.dueDate <= now;
      })
      .sort((a, b) => {
        const aState = this.data.keys[a.id];
        const bState = this.data.keys[b.id];
        // Never-reviewed keys sort first (dueDate = 0), then by earliest due
        const aDue = aState ? aState.dueDate : 0;
        const bDue = bState ? bState.dueDate : 0;
        return aDue - bDue;
      });
    
    return due.slice(0, limit);
  }

  // Get keys due soon (within next 24h)
  getDueSoonKeys() {
    const now = Date.now();
    const tomorrow = now + 24 * 60 * 60 * 1000;
    return KEYBINDS.filter(k => {
      const state = this.data.keys[k.id];
      return state && state.dueDate > now && state.dueDate <= tomorrow;
    });
  }

  // Get mastery level for a key (0-5)
  getMastery(id) {
    const state = this.data.keys[id];
    if (!state) return 0;
    if (state.timesReviewed === 0) return 0;
    
    const ratio = state.timesCorrect / state.timesReviewed;
    const reps = state.repetition;
    
    if (ratio >= 0.9 && reps >= 5) return 5; // Mastered
    if (ratio >= 0.8 && reps >= 3) return 4;
    if (ratio >= 0.7 && reps >= 2) return 3;
    if (ratio >= 0.5) return 2;
    if (state.timesReviewed > 0) return 1;
    return 0;
  }

  // Get keys learned (mastery >= 3)
  getKeysLearned() {
    return KEYBINDS.filter(k => this.getMastery(k.id) >= 3).length;
  }

  // Get category stats
  getCategoryStats() {
    const stats = {};
    for (const cat of CATEGORIES) {
      const keys = KEYBINDS.filter(k => k.category === cat);
      let total = 0, correct = 0, mastered = 0;
      for (const k of keys) {
        const state = this.data.keys[k.id];
        if (state) {
          total += state.timesReviewed;
          correct += state.timesCorrect;
          if (this.getMastery(k.id) >= 3) mastered++;
        }
      }
      stats[cat] = { total, correct, mastered, totalKeys: keys.length };
    }
    return stats;
  }

  // XP and level management
  addXP(amount) {
    this.data.xp += amount;
    this.data.totalXP += amount;
    
    // Check level up
    const nextThreshold = LEVEL_THRESHOLDS[this.data.level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 10000;
    while (this.data.xp >= nextThreshold && this.data.level < LEVEL_THRESHOLDS.length) {
      this.data.xp -= LEVEL_THRESHOLDS[this.data.level];
      this.data.level++;
    }
    
    // Track daily XP
    const today = this.getTodayKey();
    if (!this.data.dailyHistory[today]) {
      this.data.dailyHistory[today] = { reviews: 0, correct: 0, xp: 0 };
    }
    this.data.dailyHistory[today].xp += amount;
    this.data.todayXP += amount;
    
    this.save();
  }

  // Record a session
  recordSession(mode, category, total, correct, xp, durationMs) {
    this.data.totalSessions++;
    this.data.totalReviews += total;
    this.data.totalCorrect += correct;
    
    if (correct === total && total >= 5) {
      this.data.perfectSessions++;
    }
    
    this.data.sessionHistory.push({
      date: new Date().toISOString(),
      mode, category, total, correct, xp,
      duration: Math.round(durationMs / 1000),
    });
    
    const today = this.getTodayKey();
    if (!this.data.dailyHistory[today]) {
      this.data.dailyHistory[today] = { reviews: 0, correct: 0, xp: 0 };
    }
    this.data.dailyHistory[today].reviews += total;
    this.data.dailyHistory[today].correct += correct;
    
    // Update daily streak
    this.updateStreak();
    this.data.lastActiveDate = today;
    
    this.save();
  }

  updateStreak() {
    const today = this.getTodayKey();
    const yesterday = this.getYesterdayKey();
    
    if (this.data.lastActiveDate === today) return; // already counted today
    
    if (this.data.lastActiveDate === yesterday || !this.data.lastActiveDate) {
      this.data.currentStreak++;
    } else {
      this.data.currentStreak = 1;
    }
    
    if (!this.data.streakStartDate) {
      this.data.streakStartDate = today;
    }
  }

  // Check achievements
  checkAchievements() {
    const newAchievements = [];
    const state = {
      totalSessions: this.data.totalSessions,
      bestStreak: this.data.bestStreak,
      keysLearned: this.getKeysLearned(),
      level: this.data.level,
      totalXP: this.data.totalXP,
      currentStreak: this.data.currentStreak,
      perfectSessions: this.data.perfectSessions,
    };
    
    for (const ach of ACHIEVEMENTS) {
      if (!this.data.achievements.includes(ach.id) && ach.check(state)) {
        this.data.achievements.push(ach.id);
        newAchievements.push(ach);
      }
    }
    
    if (newAchievements.length > 0) this.save();
    return newAchievements;
  }

  // Get next review estimate
  getNextReviewDate() {
    const due = this.getDueKeys(1);
    if (due.length > 0) return "Now!";
    
    const allDue = KEYBINDS
      .filter(k => this.data.keys[k.id])
      .map(k => this.data.keys[k.id].dueDate)
      .sort((a, b) => a - b);
    
    if (allDue.length === 0) return "Start practicing!";
    
    const soonest = allDue[0];
    const diff = soonest - Date.now();
    if (diff <= 0) return "Now!";
    if (diff < 60 * 60 * 1000) return `${Math.round(diff / 60000)}m`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / 3600000)}h`;
    return `${Math.round(diff / 86400000)}d`;
  }

  getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  getYesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  // Get today's stats
  getTodayStats() {
    const today = this.getTodayKey();
    return this.data.dailyHistory[today] || { reviews: 0, correct: 0, xp: 0 };
  }

  // Get 7-day activity
  getWeeklyActivity() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const data = this.data.dailyHistory[key] || { reviews: 0, correct: 0, xp: 0 };
      days.push({
        date: key,
        dayName: d.toLocaleDateString('en', { weekday: 'short' }),
        ...data,
      });
    }
    return days;
  }

  // Get weakest keys
  getWeakestKeys(limit = 5) {
    const reviewed = KEYBINDS
      .filter(k => {
        const state = this.data.keys[k.id];
        return state && state.timesReviewed > 0;
      })
      .map(k => {
        const state = this.data.keys[k.id];
        return {
          ...k,
          accuracy: state.timesReviewed > 0 ? (state.timesCorrect / state.timesReviewed) : 0,
          timesReviewed: state.timesReviewed,
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy);
    
    return reviewed.slice(0, limit);
  }

  // Mastery distribution
  getMasteryDistribution() {
    const dist = [0, 0, 0, 0, 0, 0]; // 0-5
    for (const k of KEYBINDS) {
      dist[this.getMastery(k.id)]++;
    }
    return dist;
  }

  // Reset progress (for testing)
  reset() {
    this.data = this.defaultData();
    this.save();
  }
}

const SR = new SpacedRepetition();
