// Main Application Logic
let currentSession = null;
let currentView = 'dashboard';
let sessionStartTime = null;
let sessionBestStreak = 0;
let sessionCorrectCount = 0;
let sessionTotalCount = 0;
let sessionStreak = 0;
let sessionXP = 0;

// ============ VIEW MANAGEMENT ============
function switchView(view) {
  currentView = view;
  
  // Hide all views, shared session, shared end
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  hideSessionUI();
  
  // Show target view
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.add('active');
  
  // Update nav
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  
  // Render view content
  if (view === 'dashboard') renderDashboard();
  if (view === 'practice') resetPractice();
  if (view === 'review') renderReviewSetup();
  if (view === 'stats') renderStats();
  if (view === 'reference') renderReference();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// Show shared session UI, hide views
function showSessionUI() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('shared-session').style.display = '';
  document.getElementById('shared-session-end').style.display = 'none';
}

function showSessionEnd() {
  document.getElementById('shared-session').style.display = 'none';
  document.getElementById('shared-session-end').style.display = '';
}

function hideSessionUI() {
  document.getElementById('shared-session').style.display = 'none';
  document.getElementById('shared-session-end').style.display = 'none';
}

// ============ DASHBOARD ============
function renderDashboard() {
  const today = SR.getTodayStats();
  const dist = SR.getMasteryDistribution();
  const weakest = SR.getWeakestKeys(5);
  
  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dashboard-greeting').innerHTML = `<p>${greeting}! You have <strong>${SR.getDueKeys().length}</strong> keys due for review.</p>`;
  
  // Today's summary
  document.getElementById('today-time').textContent = getTodayTime();
  document.getElementById('today-cards').textContent = today.reviews;
  document.getElementById('today-accuracy').textContent = today.reviews > 0 
    ? `${Math.round((today.correct / today.reviews) * 100)}%` : '—';
  document.getElementById('today-xp').textContent = today.xp;
  
  // Stats bar
  document.getElementById('xp-display').textContent = SR.data.xp;
  document.getElementById('level-display').textContent = SR.data.level;
  document.getElementById('streak-display').textContent = SR.data.currentStreak;
  document.getElementById('learned-display').textContent = SR.getKeysLearned();
  document.getElementById('total-display').textContent = KEYBINDS.length;
  
  // XP progress bar
  const currentThreshold = LEVEL_THRESHOLDS[SR.data.level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[SR.data.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 10000;
  const xpInLevel = SR.data.xp;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = Math.min(100, (xpInLevel / xpNeeded) * 100);
  document.getElementById('xp-progress').style.width = `${progress}%`;
  document.getElementById('xp-progress-label').textContent = `${xpInLevel} / ${xpNeeded} XP to level ${SR.data.level + 1}`;
  
  // Mastery chart
  const labels = ['New', 'Learning', 'Familiar', 'Known', 'Proficient', 'Mastered'];
  const colors = ['#9e9e9e', '#f44336', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'];
  let chartHTML = '<div class="mastery-bars">';
  for (let i = 0; i < 6; i++) {
    const pct = (dist[i] / KEYBINDS.length) * 100;
    chartHTML += `
      <div class="mastery-bar-row">
        <span class="mastery-label">${labels[i]}</span>
        <div class="mastery-bar-track">
          <div class="mastery-bar-fill" style="width:${pct}%;background:${colors[i]}"></div>
        </div>
        <span class="mastery-count">${dist[i]}</span>
      </div>`;
  }
  chartHTML += '</div>';
  document.getElementById('mastery-chart').innerHTML = chartHTML;
  
  // Achievements
  const recentAch = SR.data.achievements.slice(-3).reverse();
  if (recentAch.length === 0) {
    document.getElementById('achievements-list').innerHTML = '<p class="muted">No achievements yet. Start practicing!</p>';
  } else {
    document.getElementById('achievements-list').innerHTML = recentAch
      .map(id => {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        return `<div class="achievement-badge">${ach.name}<br><small>${ach.desc}</small></div>`;
      }).join('');
  }
  
  // Weakest keys
  if (weakest.length === 0) {
    document.getElementById('weakest-keys').innerHTML = '<p class="muted">No data yet. Start practicing!</p>';
  } else {
    document.getElementById('weakest-keys').innerHTML = weakest.map(k => 
      `<div class="weak-key">
        <span class="weak-key-action">${k.action}</span>
        <span class="weak-key-key">${k.keybind}</span>
        <span class="weak-key-accuracy">${Math.round(k.accuracy * 100)}%</span>
      </div>`
    ).join('');
  }
}

function getTodayTime() {
  const sessions = SR.data.sessionHistory;
  if (sessions.length === 0) return '0m';
  
  let totalSec = 0;
  const today = SR.getTodayKey();
  for (const s of sessions) {
    if (s.date && s.date.startsWith(today)) {
      totalSec += s.duration || 0;
    }
  }
  return totalSec < 60 ? '0m' : `${Math.round(totalSec / 60)}m`;
}

// ============ PRACTICE ============
function resetPractice() {
  document.getElementById('practice-setup').style.display = '';
  hideSessionUI();
  
  // Build category buttons
  const catContainer = document.getElementById('category-buttons');
  catContainer.innerHTML = '';
  let html = `<button class="btn btn-primary cat-btn" data-category="all">🎯 All (${KEYBINDS.length})</button>`;
  html += `<button class="btn btn-secondary cat-btn" data-category="due">⚡ Due (${SR.getDueKeys().length})</button>`;
  for (const cat of CATEGORIES) {
    const count = KEYBINDS.filter(k => k.category === cat).length;
    const icon = CATEGORY_ICONS[cat] || '📝';
    html += `<button class="btn btn-secondary cat-btn" data-category="${cat}">${icon} ${cat} (${count})</button>`;
  }
  catContainer.innerHTML = html;
  
  // Category click handlers
  catContainer.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => startPractice(btn.dataset.category));
  });
  
  // Style button handlers
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = document.querySelector('.cat-btn.active')?.dataset.category || 'all';
      startPractice(cat, btn.dataset.style);
    });
  });
}

function startPractice(category, style = 'flashcard') {
  let keys;
  if (category === 'all') {
    keys = [...KEYBINDS].sort(() => Math.random() - 0.5);
  } else if (category === 'due') {
    keys = SR.getDueKeys(30);
    if (keys.length === 0) {
      keys = [...KEYBINDS].sort(() => Math.random() - 0.5).slice(0, 15);
    }
  } else {
    keys = KEYBINDS.filter(k => k.category === category).sort(() => Math.random() - 0.5);
  }
  
  if (keys.length === 0) {
    alert('No keys available for this category!');
    return;
  }
  
  currentSession = {
    keys,
    currentIndex: 0,
    style,
    category,
    mode: 'practice',
  };
  
  sessionStartTime = Date.now();
  sessionBestStreak = 0;
  sessionCorrectCount = 0;
  sessionTotalCount = 0;
  sessionStreak = 0;
  sessionXP = 0;
  
  showSessionUI();
  document.getElementById('total-cards').textContent = keys.length;
  showCurrentCard();
}

function showCurrentCard() {
  if (!currentSession || currentSession.currentIndex >= currentSession.keys.length) {
    endSession();
    return;
  }
  
  const key = currentSession.keys[currentSession.currentIndex];
  const total = currentSession.keys.length;
  
  document.getElementById('current-card-num').textContent = currentSession.currentIndex + 1;
  document.getElementById('session-correct').textContent = sessionCorrectCount;
  document.getElementById('session-total').textContent = sessionTotalCount;
  document.getElementById('session-streak').textContent = sessionStreak;
  document.getElementById('session-progress').style.width = `${((currentSession.currentIndex) / total) * 100}%`;
  
  document.getElementById('card-category').textContent = `${CATEGORY_ICONS[key.category] || '📝'} ${key.category}`;
  document.getElementById('card-question').textContent = '';
  document.getElementById('card-hint').textContent = '';
  document.getElementById('answer-reveal').style.display = 'none';
  document.getElementById('reverse-reveal').style.display = 'none';
  
  // Reset all input modes
  document.getElementById('type-input').style.display = 'none';
  document.getElementById('flashcard-answer').style.display = 'none';
  document.getElementById('reverse-input').style.display = 'none';
  
  if (currentSession.style === 'flashcard') {
    document.getElementById('card-question').textContent = key.action;
    document.getElementById('flashcard-answer').style.display = '';
    document.getElementById('reveal-answer').style.display = '';
  } else if (currentSession.style === 'reverse') {
    document.getElementById('card-question').textContent = `What does "${key.keybind}" do?`;
    document.getElementById('reverse-input').style.display = '';
    document.getElementById('reverse-answer').value = '';
    setTimeout(() => document.getElementById('reverse-answer').focus(), 50);
  } else if (currentSession.style === 'type') {
    document.getElementById('card-question').textContent = key.action;
    document.getElementById('type-input').style.display = '';
    document.getElementById('type-answer').value = '';
    setTimeout(() => document.getElementById('type-answer').focus(), 50);
  }
}

// Flashcard: reveal answer
document.getElementById('reveal-answer').addEventListener('click', () => {
  const key = currentSession.keys[currentSession.currentIndex];
  document.getElementById('correct-answer').textContent = key.keybind;
  document.getElementById('answer-reveal').style.display = '';
  document.getElementById('reveal-answer').style.display = 'none';
});

// Grade buttons (event delegation on document)
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('grade-btn')) {
    handleGrade(e.target.dataset.grade);
  }
});

function handleGrade(grade) {
  if (!currentSession) return;
  const key = currentSession.keys[currentSession.currentIndex];
  SR.initKey(key.id);
  
  sessionTotalCount++;
  const isCorrect = grade === 'good' || grade === 'easy';
  if (isCorrect) {
    sessionCorrectCount++;
    sessionStreak++;
    if (sessionStreak > sessionBestStreak) sessionBestStreak = sessionStreak;
    
    // XP calculation
    let xp = grade === 'easy' ? 15 : 10;
    if (sessionStreak >= 10) xp += 5;
    else if (sessionStreak >= 5) xp += 3;
    sessionXP += xp;
    SR.addXP(xp);
  } else {
    sessionStreak = 0;
  }
  
  SR.review(key.id, grade);
  SR.data.bestStreak = Math.max(SR.data.bestStreak, sessionBestStreak);
  
  currentSession.currentIndex++;
  showCurrentCard();
}

// Type mode: submit
document.getElementById('submit-answer').addEventListener('click', submitTypeAnswer);
document.getElementById('type-answer').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitTypeAnswer();
});

function submitTypeAnswer() {
  const key = currentSession.keys[currentSession.currentIndex];
  const userAnswer = document.getElementById('type-answer').value.trim().toLowerCase().replace(/\s/g, '');
  const correctAnswer = key.keybind.toLowerCase().replace(/\s/g, '');
  
  // Handle / alternatives
  const alternatives = correctAnswer.split('/').map(s => s.trim());
  const userParts = userAnswer.split('/').map(s => s.trim());
  
  let isCorrect = false;
  
  // Direct match
  if (userAnswer === correctAnswer || userParts[0] === alternatives[0]) {
    isCorrect = true;
  }
  
  // Partial match: user typed one of the alternatives correctly
  if (!isCorrect && userParts.length === 1 && alternatives.some(a => a === userParts[0])) {
    isCorrect = true;
  }
  
  // Fuzzy: at least 80% Levenshtein similarity
  if (!isCorrect && levenshteinSimilarity(userAnswer, correctAnswer) > 0.8) {
    isCorrect = true;
  }
  
  // Check if user input is a significant portion
  if (!isCorrect) {
    if (correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer)) {
      isCorrect = true;
    }
  }
  
  handleGrade(isCorrect ? 'good' : 'again');
}

// Reverse mode: submit
document.getElementById('submit-reverse').addEventListener('click', submitReverseAnswer);
document.getElementById('reverse-answer').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitReverseAnswer();
});

function submitReverseAnswer() {
  const key = currentSession.keys[currentSession.currentIndex];
  const userAnswer = document.getElementById('reverse-answer').value.trim().toLowerCase();
  const correctAction = key.action.toLowerCase().replace(/[…\.?]/g, '').trim();
  
  // Check keyword overlap
  const actionWords = correctAction.split(/\s+/).filter(w => w.length > 2);
  const userWords = userAnswer.split(/\s+/);
  
  let matchCount = 0;
  for (const w of actionWords) {
    if (userWords.some(uw => uw.includes(w) || w.includes(uw))) {
      matchCount++;
    }
  }
  
  const matchRatio = actionWords.length > 0 ? matchCount / actionWords.length : 0;
  const isCorrect = matchRatio >= 0.5;
  
  document.getElementById('correct-action').textContent = key.action;
  document.getElementById('reverse-reveal').style.display = '';
  document.getElementById('submit-reverse').style.display = 'none';
  
  // Grade after brief delay so user sees the answer
  setTimeout(() => {
    document.getElementById('submit-reverse').style.display = '';
    handleGrade(isCorrect ? 'good' : 'again');
  }, 800);
}

// ============ SESSION END ============
function endSession() {
  if (!currentSession) return;
  
  const duration = Date.now() - sessionStartTime;
  const accuracy = sessionTotalCount > 0 ? Math.round((sessionCorrectCount / sessionTotalCount) * 100) : 0;
  
  // Record session
  SR.recordSession(currentSession.style, currentSession.category, sessionTotalCount, sessionCorrectCount, sessionXP, duration);
  
  // Check achievements
  const newAch = SR.checkAchievements();
  
  // Show results
  showSessionEnd();
  
  document.getElementById('end-accuracy').textContent = `${accuracy}%`;
  document.getElementById('end-xp').textContent = sessionXP;
  document.getElementById('end-streak').textContent = sessionBestStreak;
  document.getElementById('end-learned').textContent = SR.getKeysLearned();
  
  // Update end buttons based on mode
  const practiceMoreBtn = document.getElementById('end-practice-more');
  if (currentSession.mode === 'review') {
    practiceMoreBtn.textContent = '🔄 Review Again';
    practiceMoreBtn.onclick = () => startSpacedReview();
  } else {
    practiceMoreBtn.textContent = '🎮 Practice More';
    practiceMoreBtn.onclick = () => switchView('practice');
  }
  
  document.getElementById('end-back-dashboard').onclick = () => switchView('dashboard');
  
  if (newAch.length > 0) {
    document.getElementById('end-achievements').innerHTML = 
      `<div class="new-achievements"><h3>🏅 New Achievements!</h3>${
        newAch.map(a => `<div class="achievement-badge">${a.name}<br><small>${ach.desc}</small></div>`).join('')
      }</div>`;
  } else {
    document.getElementById('end-achievements').innerHTML = '';
  }
  
  currentSession = null;
}

// ============ SPACED REVIEW ============
function renderReviewSetup() {
  const due = SR.getDueKeys();
  const dueSoon = SR.getDueSoonKeys();
  
  document.getElementById('due-count').textContent = due.length;
  document.getElementById('due-soon-count').textContent = dueSoon.length;
  document.getElementById('review-setup').style.display = '';
  hideSessionUI();
}

function startSpacedReview() {
  const due = SR.getDueKeys(25);
  
  if (due.length === 0) {
    if (confirm('No keys are due for review. Start a general practice session instead?')) {
      switchView('practice');
      setTimeout(() => startPractice('all', 'flashcard'), 100);
      return;
    }
    return;
  }
  
  currentSession = {
    keys: due,
    currentIndex: 0,
    style: 'flashcard',
    category: 'spaced-review',
    mode: 'review',
  };
  
  sessionStartTime = Date.now();
  sessionBestStreak = 0;
  sessionCorrectCount = 0;
  sessionTotalCount = 0;
  sessionStreak = 0;
  sessionXP = 0;
  
  showSessionUI();
  document.getElementById('total-cards').textContent = due.length;
  showCurrentCard();
}

// ============ STATS ============
function renderStats() {
  document.getElementById('stat-total-xp').textContent = SR.data.totalXP;
  document.getElementById('stat-level').textContent = SR.data.level;
  document.getElementById('stat-best-streak').textContent = SR.data.bestStreak;
  document.getElementById('stat-sessions').textContent = SR.data.totalSessions;
  document.getElementById('stat-reviews').textContent = SR.data.totalReviews;
  document.getElementById('stat-accuracy').textContent = SR.data.totalReviews > 0 
    ? `${Math.round((SR.data.totalCorrect / SR.data.totalReviews) * 100)}%` : '0%';
  document.getElementById('stat-streak').textContent = `${SR.data.currentStreak} days`;
  
  // Category stats
  const catStats = SR.getCategoryStats();
  let html = '';
  for (const cat of CATEGORIES) {
    const s = catStats[cat];
    const pct = s.totalKeys > 0 ? Math.round((s.mastered / s.totalKeys) * 100) : 0;
    const icon = CATEGORY_ICONS[cat] || '📝';
    html += `
      <div class="cat-stat">
        <div class="cat-stat-header">${icon} ${cat}</div>
        <div class="cat-stat-bar">
          <div class="cat-stat-fill" style="width:${pct}%"></div>
        </div>
        <div class="cat-stat-info">${s.mastered}/${s.totalKeys} mastered · ${s.correct}/${s.total} correct</div>
      </div>`;
  }
  document.getElementById('category-stats').innerHTML = html;
  
  // Weekly chart
  const weekly = SR.getWeeklyActivity();
  let chartHTML = '<div class="weekly-bars">';
  const maxXp = Math.max(...weekly.map(d => d.xp), 1);
  const maxReviews = Math.max(...weekly.map(d => d.reviews), 1);
  for (const day of weekly) {
    const xpH = Math.max(4, (day.xp / maxXp) * 80);
    const revH = Math.max(4, (day.reviews / maxReviews) * 80);
    chartHTML += `
      <div class="weekly-bar-group">
        <div class="weekly-bar xp-bar" style="height:${xpH}px" title="${day.xp} XP"></div>
        <div class="weekly-bar rev-bar" style="height:${revH}px" title="${day.reviews} reviews"></div>
        <div class="weekly-day">${day.dayName}</div>
      </div>`;
  }
  chartHTML += '</div>';
  chartHTML += '<div class="weekly-legend"><span class="legend-xp">■ XP</span><span class="legend-rev">■ Reviews</span></div>';
  document.getElementById('weekly-chart').innerHTML = chartHTML;
  
  // All achievements
  let achHTML = '';
  for (const ach of ACHIEVEMENTS) {
    const unlocked = SR.data.achievements.includes(ach.id);
    achHTML += `<div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
      <div class="ach-icon">${unlocked ? ach.name.split(' ')[0] : '🔒'}</div>
      <div class="ach-name">${ach.name.split(' ').slice(1).join(' ')}</div>
      <div class="ach-desc">${ach.desc}</div>
    </div>`;
  }
  document.getElementById('all-achievements').innerHTML = achHTML;
}

// ============ REFERENCE ============
function renderReference(filter = '') {
  const filtered = filter 
    ? KEYBINDS.filter(k => 
        k.action.toLowerCase().includes(filter.toLowerCase()) || 
        k.keybind.toLowerCase().includes(filter.toLowerCase()) ||
        k.category.toLowerCase().includes(filter.toLowerCase())
      )
    : KEYBINDS;
  
  let html = '';
  let lastCat = '';
  for (const k of filtered) {
    if (k.category !== lastCat) {
      lastCat = k.category;
      const icon = CATEGORY_ICONS[k.category] || '📝';
      html += `<h3 class="ref-category">${icon} ${k.category}</h3>`;
    }
    const masteryLevel = SR.getMastery(k.id);
    const masteryStars = '★'.repeat(masteryLevel) + '☆'.repeat(5 - masteryLevel);
    html += `
      <div class="ref-item">
        <div class="ref-action">${k.action}</div>
        <div class="ref-keybind">${k.keybind}</div>
        <div class="ref-mastery" title="Mastery: ${masteryLevel}/5">${masteryStars}</div>
      </div>`;
  }
  
  if (filtered.length === 0) {
    html = '<p class="muted">No keybinds match your search.</p>';
  }
  
  document.getElementById('reference-list').innerHTML = html;
}

document.getElementById('ref-search').addEventListener('input', e => {
  renderReference(e.target.value);
});

// ============ UTILITY ============
function levenshteinSimilarity(a, b) {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => 
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(a.length, b.length);
  return 1 - matrix[a.length][b.length] / maxLen;
}

// ============ INIT ============
function init() {
  SR.updateStreak();
  SR.save();
  renderDashboard();
}

init();
