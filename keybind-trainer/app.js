// Main Application Logic
let currentSession = null;
let currentView = 'dashboard';
let sessionStartTime = null;
let sessionBestStreak = 0;
let sessionCorrectCount = 0;
let sessionTotalCount = 0;
let sessionStreak = 0;
let sessionXP = 0;

// ============ SETTINGS ============
const SETTINGS_KEY = 'keybind_settings';
let settings = {
  hideNumpad: false,
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) settings = { ...settings, ...JSON.parse(saved) };
  } catch {}
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getActiveKeys() {
  if (!settings.hideNumpad) return KEYBINDS;
  return KEYBINDS.filter(k => !k.keybind.toLowerCase().includes('numpad'));
}

loadSettings();

// ============ KEY CAPTURE (Press It mode) ============
let activeModifiers = { ctrl: false, alt: false, shift: false };
let pressedKeys = [];
let keyCaptureActive = false;

function normalizeKey(e) {
  // Convert event to a key name matching our keybind format
  if (e.key === 'Control') return null; // skip modifier-only
  if (e.key === 'Alt') return null;
  if (e.key === 'Shift') return null;
  if (e.key === 'Meta') return null;
  
  let key = e.key;
  if (key.length === 1) key = key.toUpperCase();
  
  // Map common keys
  const map = {
    ' ': 'Space', 'Escape': 'Esc', 'Delete': 'Delete', 'Backspace': 'Backspace',
    'Enter': 'Enter', 'Tab': 'Tab', 'ArrowUp': 'Up', 'ArrowDown': 'Down',
    'ArrowLeft': 'Left', 'ArrowRight': 'Right', 'Home': 'Home', 'End': 'End',
    'PageUp': 'PageUp', 'PageDown': 'PageDown', 'Insert': 'Insert',
    '`': '`', '~': '`',
  };
  if (map[key]) key = map[key];
  
  // NumPad keys
  if (e.code && e.code.startsWith('Numpad')) {
    const numpadMap = {
      'Numpad0': 'NumPad0', 'Numpad1': 'NumPad1', 'Numpad2': 'NumPad2',
      'Numpad3': 'NumPad3', 'Numpad4': 'NumPad4', 'Numpad5': 'NumPad5',
      'Numpad6': 'NumPad6', 'Numpad7': 'NumPad7', 'Numpad8': 'NumPad8',
      'Numpad9': 'NumPad9', 'NumpadAdd': 'NumPad+', 'NumpadSubtract': 'NumPad-',
      'NumpadMultiply': 'NumPad*', 'NumpadDivide': 'NumPad/',
      'NumpadEnter': 'NumPadEnter',
    };
    key = numpadMap[e.code] || key;
  }
  
  return key;
}

function buildKeybindString() {
  let parts = [];
  if (activeModifiers.ctrl) parts.push('Ctrl');
  if (activeModifiers.alt) parts.push('Alt');
  if (activeModifiers.shift) parts.push('Shift');
  if (pressedKeys.length > 0) parts.push(pressedKeys[pressedKeys.length - 1]);
  return parts.join('+');
}

function onKeydown(e) {
  if (!keyCaptureActive || !currentSession || currentSession.style !== 'press') return;
  
  // Track modifiers
  if (e.key === 'Control' || e.key === 'Meta') { activeModifiers.ctrl = true; e.preventDefault(); return; }
  if (e.key === 'Alt') { activeModifiers.alt = true; e.preventDefault(); return; }
  if (e.key === 'Shift') { activeModifiers.shift = true; e.preventDefault(); return; }
  
  e.preventDefault();
  
  const key = normalizeKey(e);
  if (key) {
    pressedKeys.push(key);
    updatePressDisplay();
  }
}

function onKeyup(e) {
  if (e.key === 'Control' || e.key === 'Meta') activeModifiers.ctrl = false;
  if (e.key === 'Alt') activeModifiers.alt = false;
  if (e.key === 'Shift') activeModifiers.shift = false;
}

function updatePressDisplay() {
  const display = buildKeybindString();
  document.getElementById('keys-pressed').textContent = display || '...';
}

document.addEventListener('keydown', onKeydown);
document.addEventListener('keyup', onKeyup);

// ============ VIEW MANAGEMENT ============
function switchView(view) {
  currentView = view;
  hideSessionUI();
  
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.add('active');
  
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  
  if (view === 'dashboard') renderDashboard();
  if (view === 'practice') resetPractice();
  if (view === 'review') renderReviewSetup();
  if (view === 'stats') renderStats();
  if (view === 'reference') renderReference();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

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
  keyCaptureActive = false;
  document.getElementById('shared-session').style.display = 'none';
  document.getElementById('shared-session-end').style.display = 'none';
}

// ============ ONBOARDING ============
function checkOnboarding() {
  const hasProgress = SR.data.totalReviews > 0;
  if (hasProgress) {
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('dashboard-content').style.display = '';
  } else {
    document.getElementById('onboarding').style.display = '';
    document.getElementById('dashboard-content').style.display = 'none';
  }
}

document.getElementById('onboarding-start').addEventListener('click', () => {
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('dashboard-content').style.display = '';
  startPractice('all', 'press');
});

// ============ DASHBOARD ============
function renderDashboard() {
  checkOnboarding();
  if (SR.data.totalReviews === 0) return;
  
  const today = SR.getTodayStats();
  const dist = SR.getMasteryDistribution();
  const weakest = SR.getWeakestKeys(5);
  const dueCount = SR.getDueKeys(Infinity, getActiveKeys()).length;
  const totalKeys = getActiveKeys().length;
  
  // Greeting with context
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingMsg = dueCount > 0 
    ? `${greeting}! You have <strong>${dueCount}</strong> key${dueCount === 1 ? '' : 's'} due for review.`
    : `${greeting}! ${SR.getKeysLearned()} of ${totalKeys} keys learned. All caught up! 🎉`;
  document.getElementById('dashboard-greeting').innerHTML = `<p>${greetingMsg}</p>`;
  
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
    const pct = (dist[i] / totalKeys) * 100;
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
    document.getElementById('achievements-list').innerHTML = '<p class="muted">Start practicing to earn achievements!</p>';
  } else {
    document.getElementById('achievements-list').innerHTML = recentAch
      .map(id => {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        return `<div class="achievement-badge">${ach.name}<br><small>${ach.desc}</small></div>`;
      }).join('');
  }
  
  // Weakest keys
  if (weakest.length === 0) {
    document.getElementById('weakest-keys').innerHTML = '<p class="muted">No data yet.</p>';
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
    if (s.date && s.date.startsWith(today)) totalSec += s.duration || 0;
  }
  return totalSec < 60 ? '0m' : `${Math.round(totalSec / 60)}m`;
}

// ============ PRACTICE SETUP ============
function resetPractice() {
  document.getElementById('practice-setup').style.display = '';
  hideSessionUI();
  
  const activeKeys = getActiveKeys();
  
  const catContainer = document.getElementById('category-buttons');
  catContainer.innerHTML = '';
  let html = `<button class="btn btn-primary cat-btn" data-category="all">🎯 All (${activeKeys.length})</button>`;
  html += `<button class="btn btn-secondary cat-btn" data-category="due">⚡ Due (${SR.getDueKeys(30, getActiveKeys).length})</button>`;
  for (const cat of CATEGORIES) {
    const count = activeKeys.filter(k => k.category === cat).length;
    const icon = CATEGORY_ICONS[cat] || '📝';
    html += `<button class="btn btn-secondary cat-btn" data-category="${cat}">${icon} ${cat} (${count})</button>`;
  }
  catContainer.innerHTML = html;
  
  catContainer.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => startPractice(btn.dataset.category));
  });
  
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.style-btn').forEach(b => {
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary', 'active');
    });
  });
  
  // Settings toggle
  const settingsContainer = document.getElementById('practice-settings');
  if (settingsContainer) {
    settingsContainer.innerHTML = `
      <label class="setting-toggle">
        <input type="checkbox" id="hide-numpad-toggle" ${settings.hideNumpad ? 'checked' : ''}>
        <span class="toggle-switch"></span>
        <span class="toggle-label">Hide numpad shortcuts</span>
      </label>
    `;
    document.getElementById('hide-numpad-toggle').addEventListener('change', (e) => {
      settings.hideNumpad = e.target.checked;
      saveSettings();
      resetPractice();
    });
  }
}

function startPractice(category, style = null) {
  // Determine style: use pressed style button, or parameter, or default 'press'
  if (!style) {
    const activeStyleBtn = document.querySelector('.style-btn.active');
    style = activeStyleBtn ? activeStyleBtn.dataset.style : 'press';
  }
  
  let keys;
  const activeKeys = getActiveKeys();
  if (category === 'all') {
    keys = [...activeKeys].sort(() => Math.random() - 0.5);
  } else if (category === 'due') {
    keys = SR.getDueKeys(30, activeKeys);
    if (keys.length === 0) {
      keys = [...activeKeys].sort(() => Math.random() - 0.5).slice(0, 15);
    }
  } else {
    keys = activeKeys.filter(k => k.category === category).sort(() => Math.random() - 0.5);
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
  
  // Setup end button
  document.getElementById('end-session-btn').onclick = () => endSession();
  
  showCurrentCard();
}

function showCurrentCard() {
  if (!currentSession || currentSession.currentIndex >= currentSession.keys.length) {
    endSession();
    return;
  }
  
  const key = currentSession.keys[currentSession.currentIndex];
  const total = currentSession.keys.length;
  const phase = SR.getPhase(key.id);
  
  document.getElementById('current-card-num').textContent = currentSession.currentIndex + 1;
  document.getElementById('session-correct').textContent = sessionCorrectCount;
  document.getElementById('session-total').textContent = sessionTotalCount;
  document.getElementById('session-streak').textContent = sessionStreak;
  document.getElementById('session-progress').style.width = `${((currentSession.currentIndex) / total) * 100}%`;
  
  document.getElementById('card-category').textContent = `${CATEGORY_ICONS[key.category] || '📝'} ${key.category}`;
  document.getElementById('card-question').textContent = '';
  document.getElementById('card-hint').textContent = '';
  document.getElementById('answer-reveal').style.display = 'none';
  
  // Reset all modes
  document.getElementById('press-zone').style.display = 'none';
  document.getElementById('press-learn').style.display = 'none';
  document.getElementById('press-scaffold').style.display = 'none';
  document.getElementById('press-recall').style.display = 'none';
  document.getElementById('flashcard-answer').style.display = 'none';
  document.getElementById('press-browser-note').style.display = 'none';
  document.getElementById('press-reveal-hint').style.display = 'none';
  pressedKeys = [];
  activeModifiers = { ctrl: false, alt: false, shift: false };
  cardRevealed = false;
  
  if (currentSession.style === 'press') {
    document.getElementById('card-question').textContent = key.action;
    document.getElementById('press-zone').style.display = '';
    
    // Show phase badge
    const phaseLabels = { learn: '📖 Learn', scaffold: '✏️ Practice', recall: '🎯 Test' };
    document.getElementById('card-hint').textContent = phaseLabels[phase] || '';
    
    if (phase === 'learn') {
      // Show the answer — user just needs to press it
      document.getElementById('press-learn').style.display = '';
      document.getElementById('press-learn-answer').textContent = key.keybind;
      keyCaptureActive = true;
    } else if (phase === 'scaffold') {
      // Hidden, but can reveal
      document.getElementById('press-scaffold').style.display = '';
      document.getElementById('keys-pressed').textContent = '';
      document.getElementById('press-reveal-hint').textContent = key.keybind;
      document.getElementById('press-reveal-hint').style.display = 'none';
      document.getElementById('press-reveal-btn').style.display = '';
      keyCaptureActive = true;
    } else {
      // Full recall
      document.getElementById('press-recall').style.display = '';
      document.getElementById('keys-pressed').textContent = '';
      keyCaptureActive = true;
    }
  } else if (currentSession.style === 'flashcard') {
    document.getElementById('card-question').textContent = key.action;
    document.getElementById('flashcard-answer').style.display = '';
    document.getElementById('reveal-answer').style.display = '';
    keyCaptureActive = false;
  }
}

// ============ PRESS IT MODE ============

// Check if pressed keybind matches the target
function checkKeyPress(key, pressed) {
  if (!pressed) return false;
  const normalize = (s) => s.toLowerCase().replace(/\s/g, '').replace(/\+/g, '');
  const alternatives = key.keybind.split('/').map(s => s.trim());
  for (const alt of alternatives) {
    if (normalize(pressed) === normalize(alt)) return true;
    const altParts = alt.split('/').map(s => s.trim());
    if (altParts.some(p => normalize(pressed) === normalize(p))) return true;
  }
  const target = normalize(key.keybind.split('/')[0].trim());
  const userInput = normalize(pressed);
  if (levenshteinSimilarity(target, userInput) > 0.85) return true;
  return false;
}

// Track if user revealed the answer this card
let cardRevealed = false;

// Learn phase: "Done" button
document.getElementById('press-done').addEventListener('click', () => {
  if (!currentSession) return;
  const key = currentSession.keys[currentSession.currentIndex];
  const pressed = buildKeybindString();
  const isCorrect = checkKeyPress(key, pressed);
  // In learn phase, just pressing anything = learning (generous)
  handleGrade(isCorrect ? 'good' : 'again', false);
});

// Scaffold phase: "Reveal" button
document.getElementById('press-reveal-btn').addEventListener('click', () => {
  cardRevealed = true;
  document.getElementById('press-reveal-hint').style.display = '';
  document.getElementById('press-reveal-btn').style.display = 'none';
});

// Scaffold/Recall: "Got it" button (multiple instances across phases)
document.querySelectorAll('#press-correct').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!currentSession) return;
    const key = currentSession.keys[currentSession.currentIndex];
    const pressed = buildKeybindString();
    const isCorrect = checkKeyPress(key, pressed);
    handleGrade(isCorrect ? 'good' : 'again', cardRevealed);
  });
});

// Wrong button (multiple instances across phases)
document.querySelectorAll('#press-wrong').forEach(btn => {
  btn.addEventListener('click', () => {
    handleGrade('again', cardRevealed);
  });
});

// Skip button (multiple instances across phases)
document.querySelectorAll('#press-skip').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!currentSession) return;
    const key = currentSession.keys[currentSession.currentIndex];
    SR.initKey(key.id);
    sessionTotalCount++;
    SR.review(key.id, 'hard', cardRevealed);
    cardRevealed = false;
    currentSession.currentIndex++;
    showCurrentCard();
  });
});

// ============ FLASHCARD MODE ============
document.getElementById('reveal-answer').addEventListener('click', () => {
  const key = currentSession.keys[currentSession.currentIndex];
  document.getElementById('correct-answer').textContent = key.keybind;
  document.getElementById('answer-reveal').style.display = '';
  document.getElementById('reveal-answer').style.display = 'none';
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('grade-btn')) {
    handleGrade(e.target.dataset.grade);
  }
});

function handleGrade(grade, wasRevealed = false) {
  if (!currentSession) return;
  const key = currentSession.keys[currentSession.currentIndex];
  SR.initKey(key.id);
  
  sessionTotalCount++;
  const isCorrect = grade === 'good' || grade === 'easy';
  if (isCorrect) {
    sessionCorrectCount++;
    sessionStreak++;
    if (sessionStreak > sessionBestStreak) sessionBestStreak = sessionStreak;
    
    // Less XP for revealed answers (you needed the hint)
    let xp = wasRevealed ? 5 : (grade === 'easy' ? 15 : 10);
    if (sessionStreak >= 10) xp += 5;
    else if (sessionStreak >= 5) xp += 3;
    sessionXP += xp;
    SR.addXP(xp);
  } else {
    sessionStreak = 0;
  }
  
  SR.review(key.id, grade, wasRevealed);
  SR.data.bestStreak = Math.max(SR.data.bestStreak, sessionBestStreak);
  
  cardRevealed = false;
  currentSession.currentIndex++;
  showCurrentCard();
}

// ============ SESSION END ============
function endSession() {
  if (!currentSession) return;
  
  keyCaptureActive = false;
  const duration = Date.now() - sessionStartTime;
  const accuracy = sessionTotalCount > 0 ? Math.round((sessionCorrectCount / sessionTotalCount) * 100) : 0;
  
  SR.recordSession(currentSession.style, currentSession.category, sessionTotalCount, sessionCorrectCount, sessionXP, duration);
  const newAch = SR.checkAchievements();
  
  showSessionEnd();
  
  document.getElementById('end-accuracy').textContent = `${accuracy}%`;
  document.getElementById('end-xp').textContent = sessionXP;
  document.getElementById('end-streak').textContent = sessionBestStreak;
  document.getElementById('end-learned').textContent = SR.getKeysLearned();
  
  const practiceMoreBtn = document.getElementById('end-practice-more');
  if (currentSession.mode === 'review') {
    practiceMoreBtn.textContent = '🔄 Review Again';
    practiceMoreBtn.onclick = () => startSpacedReview();
  } else {
    practiceMoreBtn.textContent = '🎯 Practice More';
    practiceMoreBtn.onclick = () => switchView('practice');
  }
  
  document.getElementById('end-back-dashboard').onclick = () => switchView('dashboard');
  
  if (newAch.length > 0) {
    document.getElementById('end-achievements').innerHTML = 
      `<div class="new-achievements"><h3>🏅 New Achievements!</h3>${
        newAch.map(a => `<div class="achievement-badge">${a.name}<br><small>${a.desc}</small></div>`).join('')
      }</div>`;
  } else {
    document.getElementById('end-achievements').innerHTML = '';
  }
  
  currentSession = null;
}

// ============ SPACED REVIEW ============
function renderReviewSetup() {
  const activeKeys = getActiveKeys();
  const due = SR.getDueKeys(Infinity, activeKeys);
  const dueSoon = SR.getDueSoonKeys(activeKeys);
  const learned = SR.getKeysLearned();
  
  document.getElementById('due-count').textContent = due.length;
  document.getElementById('due-soon-count').textContent = dueSoon.length;
  document.getElementById('review-total-learned').textContent = learned;
  document.getElementById('review-setup').style.display = '';
  hideSessionUI();
}

document.getElementById('start-review-btn').addEventListener('click', () => startSpacedReview());

function startSpacedReview() {
  const activeKeys = getActiveKeys();
  const due = SR.getDueKeys(25, activeKeys);
  
  if (due.length === 0) {
    // No keys due — suggest learning new ones
    if (SR.getKeysLearned() < activeKeys.length) {
      if (confirm('No keys are due for review yet. Practice new keys instead?')) {
        switchView('practice');
        setTimeout(() => startPractice('all', 'press'), 100);
      }
    } else {
      alert('You\'re all caught up! Great job! 🎉');
    }
    return;
  }
  
  currentSession = {
    keys: due,
    currentIndex: 0,
    style: 'press',
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
  document.getElementById('end-session-btn').onclick = () => endSession();
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
  const activeKeys = getActiveKeys();
  const filtered = filter 
    ? activeKeys.filter(k => 
        k.action.toLowerCase().includes(filter.toLowerCase()) || 
        k.keybind.toLowerCase().includes(filter.toLowerCase()) ||
        k.category.toLowerCase().includes(filter.toLowerCase())
      )
    : activeKeys;
  
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
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
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
