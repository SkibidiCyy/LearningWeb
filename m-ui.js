window.CodeLab = window.CodeLab || {};
(() => {
  const C = window.CodeLab;
  "use strict";

  function getCurrentAvatarSrc() {
    if (appState.avatarChoice === "custom" && appState.customAvatar) {
      return appState.customAvatar;
    }

    return avatarPresets[appState.avatarChoice] || avatarPresets.wave;
  }

  function renderAvatar() {
    const avatarSrc = getCurrentAvatarSrc();
    const label = `${appState.nickname || appState.user || "User"} profile picture`;
    const avatarElements = ["sidebarAvatar", "settingsAvatarPreview"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    avatarElements.forEach((element) => {
      element.textContent = "";
      element.style.backgroundImage = `url("${avatarSrc}")`;
      element.setAttribute("aria-label", label);
    });
  }

  function syncAvatarPickerUI() {
    document.querySelectorAll(".avatar-option").forEach((button) => {
      const choice = button.dataset.avatarChoice;
      const src = avatarPresets[choice] || avatarPresets.wave;
      button.style.backgroundImage = `url("${src}")`;
      button.classList.toggle("active", appState.avatarChoice !== "custom" && appState.avatarChoice === choice);
    });
  }

  function setProfileStatus(message) {
    const profileStatus = document.getElementById("profileStatus");
    if (profileStatus) {
      profileStatus.textContent = message;
    }
  }

  function selectAvatarPreset(choice) {
    if (!avatarPresets[choice]) {
      return;
    }

    appState.avatarChoice = choice;
    renderAvatar();
    syncAvatarPickerUI();
    setProfileStatus("Avatar selected. Save profile to keep it.");
  }

  function clearCustomAvatar() {
    if (appState.avatarChoice === "custom") {
      appState.avatarChoice = "wave";
      appState.customAvatar = "";
    }

    const uploadInput = document.getElementById("avatarUpload");
    if (uploadInput) {
      uploadInput.value = "";
    }

    renderAvatar();
    syncAvatarPickerUI();
    setProfileStatus("Using a built-in avatar. Save profile to keep it.");
  }

  function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileStatus("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setProfileStatus("That image could not be loaded.");
        return;
      }

      appState.customAvatar = reader.result;
      appState.avatarChoice = "custom";
      renderAvatar();
      syncAvatarPickerUI();
      setProfileStatus("Custom picture loaded. Save profile to keep it.");
    };
    reader.readAsDataURL(file);
  }

  function updateDailyStreak() {
    const today = new Date().toISOString().split("T")[0];
    if (!appState.lastActiveDate) {
      appState.studyStreak = 1;
    } else if (appState.lastActiveDate === today) {
      // already active today, streak unchanged
    } else {
      const lastDate = new Date(appState.lastActiveDate);
      const diffDays = Math.round((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));
      appState.studyStreak = diffDays === 1 ? appState.studyStreak + 1 : 1;
    }
    appState.lastActiveDate = today;
  }

  function logXpEarned(amount) {
    if (amount <= 0) return;
    const today = new Date().toISOString().split("T")[0];
    let entry = appState.xpHistory.find(e => e.date === today);
    if (entry) {
      entry.xp += amount;
    } else {
      appState.xpHistory.push({ date: today, xp: amount });
    }
    if (appState.xpHistory.length > 14) {
      appState.xpHistory = appState.xpHistory.slice(-14);
    }
  }

  function renderAnalytics() {
    const nextLevelXp = appState.level * 200;
    const xpToNext = Math.max(0, nextLevelXp - appState.xp);

    const gamePercent = Math.max(0, Math.min(100, Math.round((appState.sprintHighScore || 0) / 5)));

    // Actual lesson (topic) completion
    const htmlLessons = getLessonData();
    const jsLessons = getJSLessonData();
    const cssLessons = getCSSLessonData();
    const totalTopics = htmlLessons.reduce((sum, l) => sum + l.topics.length, 0) +
                        jsLessons.reduce((sum, l) => sum + l.topics.length, 0) +
                        cssLessons.reduce((sum, l) => sum + l.topics.length, 0);
    const completedTopics = appState.completedLessons.length;
    const lessonPercent = Math.max(0, Math.min(100, totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0));

    // Actual quiz completion
    const htmlQuizzes = getHTMLQuizData();
    const jsQuizzes = getJSQuizData();
    const cssQuizzes = getCSSQuizData();
    const totalQuizzes = htmlQuizzes.length + jsQuizzes.length + cssQuizzes.length;
    const completedQuizzes = appState.completedQuizzes.length;
    const quizPercent = Math.max(0, Math.min(100, totalQuizzes ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0));

    // Completion rate = weighted blend of all activities.
    const completionRate = Math.max(0, Math.min(100, Math.round(
      (lessonPercent * 0.45) + (quizPercent * 0.30) + (gamePercent * 0.25)
    )));

    const activityScore = Math.round(
      (appState.xp * 0.30) +
      (completedTopics * 25) +
      (completedQuizzes * 40) +
      ((appState.sprintHighScore || 0) * 5)
    );

    const accountStatus =
      appState.level >= 5 ? "Elite" :
      appState.level >= 3 ? "Advanced" :
      "Standard";

    const today = new Date();
    const weeklySeries = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const entry = appState.xpHistory.find(e => e.date === dateStr);
      weeklySeries.push(entry ? entry.xp : 0);
    }
    const maxXp = Math.max(...weeklySeries, 1);
    const chartValues = weeklySeries.map(v => Math.round((v / maxXp) * 100));

    const lastPoint = chartValues[chartValues.length - 1];
    const previousPoint = chartValues[chartValues.length - 2] || lastPoint;
    const chartDelta = previousPoint ? Math.round(((lastPoint - previousPoint) / previousPoint) * 100) : 0;

    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    };

    const setBar = (id, valueId, percent) => {
      const fill = document.getElementById(id);
      const text = document.getElementById(valueId);
      if (fill) {
        fill.style.width = `${percent}%`;
      }
      if (text) {
        text.textContent = `${percent}%`;
      }
    };

    setText("analyticsCompletionRate", `${completionRate}%`);
    setText("analyticsXpToNext", `${xpToNext} XP`);
    setText("analyticsGameScore", `${appState.sprintHighScore || 0} pts`);
    setText("analyticsStudyStreak", `${appState.studyStreak} day${appState.studyStreak === 1 ? "" : "s"}`);
    setText("analyticsActivityScore", activityScore);
    setText("analyticsAccountStatus", accountStatus);
    setText("analyticsTopicsCompleted", `${completedTopics}/${totalTopics}`);
    setText("analyticsChartDelta", `${chartDelta >= 0 ? "+" : ""}${chartDelta}%`);

    setBar("analyticsBarLessons", "analyticsBarLessonsValue", lessonPercent);
    setBar("analyticsBarGames", "analyticsBarGamesValue", gamePercent);
    const typingWpmPct = Math.min(100, Math.round((appState.typingHighScore || 0) / 100 * 100));
    setBar("analyticsBarTyping", "analyticsBarTypingValue", typingWpmPct);
    setBar("analyticsBarQuizzes", "analyticsBarQuizzesValue", quizPercent);

    const linePoints = chartValues.map((value, index) => {
      const x = (index / (chartValues.length - 1)) * 320;
      const y = 150 - (value / 100) * 120;
      return `${x},${y}`;
    }).join(" ");

    const lineGlow = document.getElementById("analyticsLineGlow");
    const linePath = document.getElementById("analyticsLinePath");
    const dots = document.getElementById("analyticsLineDots");
    if (lineGlow) lineGlow.setAttribute("points", linePoints);
    if (linePath) linePath.setAttribute("points", linePoints);
    if (dots) {
      dots.innerHTML = chartValues.map(() => '<span class="line-dot"></span>').join("");
    }
  }

  function updateDashboard() {
    updateDailyStreak();
    appState.level = calculateLevel();

    const nextLevelXp = appState.level * 200;
    const previousLevelXp = (appState.level - 1) * 200;
    const totalXpTarget = nextLevelXp;
    const progressWithinLevel = Math.min(100, ((appState.xp - previousLevelXp) / (totalXpTarget - previousLevelXp)) * 100);

    // Completion = equal blend of lessons, quizzes, and games
    const htmlLessons = getLessonData();
    const jsLessons = getJSLessonData();
    const cssLessons = getCSSLessonData();
    const totalTopics = htmlLessons.reduce((s, l) => s + l.topics.length, 0) +
                        jsLessons.reduce((s, l) => s + l.topics.length, 0) +
                        cssLessons.reduce((s, l) => s + l.topics.length, 0);
    const lessonPercent = totalTopics ? Math.round((appState.completedLessons.length / totalTopics) * 100) : 0;

    const htmlQuizzes = getHTMLQuizData();
    const jsQuizzes = getJSQuizData();
    const cssQuizzes = getCSSQuizData();
    const totalQuizzes = htmlQuizzes.length + jsQuizzes.length + cssQuizzes.length;
    const quizPercent = totalQuizzes ? Math.round((appState.completedQuizzes.length / totalQuizzes) * 100) : 0;

    const gamePercent = Math.min(100, Math.round((appState.sprintHighScore || 0) / 5));
    const completionPercent = Math.max(0, Math.min(100, Math.round((lessonPercent + quizPercent + gamePercent) / 3)));

    // Next level computations for XP/Level indicators.
    const xpToNext = Math.max(0, nextLevelXp - appState.xp);

    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    };

    setText("sidebarUsername", appState.nickname || appState.user);
    setText("sidebarLevel", appState.level);
    setText("level", appState.level);
    setText("xp", appState.xp);

    const isNewUser = appState.completedLessons.length === 0 && appState.completedQuizzes.length === 0;
    setText("welcomeBack", isNewUser ? "Welcome to CodeLab" : `Welcome back, ${appState.nickname || appState.user || "Learner"}`);
    setText("progressPercent", `${completionPercent}%`);
    setText("streakDays", `${appState.studyStreak} day${appState.studyStreak === 1 ? "" : "s"}`);

    const blurbEl = document.getElementById("progressBlurb");
    if (blurbEl) {
      const streak = appState.studyStreak;
      const topicsDone = appState.completedLessons.length;
      const quizzesDone = appState.completedQuizzes.length;
      const totalDone = topicsDone + quizzesDone;
      blurbEl.textContent =
        streak > 5 ? `${streak}-day streak on fire! Keep the momentum going.` :
        totalDone > 0 ? `You've completed ${totalDone} activities so far. Keep it up!` :
        `Start with a lesson or quiz to begin your learning journey.`;
    }

    const xpLevelLine = `${appState.xp} XP • Level ${appState.level}`;
    setText("xpLevelDisplay", xpLevelLine);
    setText("heroXP", appState.xp);
    setText("heroLevel", appState.level);
    setText("heroXpToNext", `${xpToNext} XP`);

    setText("nextLevelDisplay", appState.level + 1);
    setText("xpProgressLabel", `${appState.xp}/${nextLevelXp} XP`);

    const ring = document.getElementById("heroProgressRing");
    if (ring) {
      // SVG circle progress rendering
      const r = Number(ring.getAttribute("r") || 46);
      const circumference = 2 * Math.PI * r;
      const clamped = Math.max(0, Math.min(100, completionPercent));
      const dashOffset = circumference * (1 - clamped / 100);
      ring.style.strokeDasharray = `${circumference} ${circumference}`;
      ring.style.strokeDashoffset = `${dashOffset}`;

      // Ensure it animates smoothly between updates
      ring.style.transition = "stroke-dashoffset 650ms ease";
    }

    renderAvatar();

    const progress = document.getElementById("progress");
    if (progress) {
      progress.style.width = `${Math.max(8, Math.min(100, progressWithinLevel))}%`;
    }

    renderCategoryProgress();
    renderBadges();
    renderAchievements();
    renderAnalytics();
    updateProfileFields();
    saveState();

    // Helpful first-touch motivation on dashboard refresh
    const heroMotivation = document.getElementById("heroMotivation");
    if (heroMotivation) {
      const message =
        completionPercent >= 75 ? "Almost there—finish your next stretch to level up." :
        completionPercent >= 40 ? "Great momentum. One more session will boost your progress." :
        "Start small. A quick lesson or puzzle today keeps the streak strong.";
      heroMotivation.textContent = message;
    }
  }

  function renderCategoryProgress() {
    const htmlLessons = getLessonData();
    const jsLessons = getJSLessonData();
    const cssLessons = getCSSLessonData();

    function calcCat(lessons) {
      const topics = lessons.flatMap(l => l.topics);
      const done = topics.filter(t => appState.completedLessons.includes(t.id)).length;
      return topics.length ? Math.round((done / topics.length) * 100) : 0;
    }

    const htmlPct = calcCat(htmlLessons);
    const jsPct = calcCat(jsLessons);
    const cssPct = calcCat(cssLessons);

    const setCat = (barId, labelId, pct) => {
      const bar = document.getElementById(barId);
      const label = document.getElementById(labelId);
      if (bar) bar.style.width = `${pct}%`;
      if (label) label.textContent = `${pct}%`;
    };

    setCat("catProgHtml", "catProgHtmlLabel", htmlPct);
    setCat("catProgJs", "catProgJsLabel", jsPct);
    setCat("catProgCss", "catProgCssLabel", cssPct);
  }

  function renderBadges() {
    const badges = document.getElementById("badges");
    if (!badges) {
      return;
    }

    const items = [
      { label: "Fast Learner", value: `${appState.xp} XP` },
      { label: "Sprint High", value: `${appState.sprintHighScore || 0} pts` }
    ];

    badges.innerHTML = items.map((item) => `
      <div class="badge-item">
        <strong>${item.label}</strong>
        <span>${item.value}</span>
      </div>
    `).join("");
  }

  function renderAchievements() {
    const grid = document.querySelector(".achievements-grid");
    const count = document.getElementById("achievementsCount");
    if (!grid || !count) {
      return;
    }

    const completedLessons = appState.completedLessons.length;
    const completedQuizzes = appState.completedQuizzes.length;
    const achievements = [];


    const pushGenerated = (prefix, emojiSet, thresholds, currentValue, suffix, descriptionPrefix) => {
      thresholds.forEach((threshold, index) => {
        achievements.push({
          emoji: emojiSet[index % emojiSet.length],
          name: `${prefix} ${index + 1}`,
          unlocked: currentValue >= threshold,
          description: `${descriptionPrefix} ${threshold} ${suffix}.`
        });
      });
    };


    pushGenerated("XP Milestone", ["⚡", "💠", "💎", "🏦", "🌟", "🏵️", "🔷", "🪙", "✨", "🌠"], [100,200,300,400,500,600,700,800,900,1000,1200,1400,1600,1800,2000], appState.xp, "XP", "Reach");
    pushGenerated("Level Climb", ["🚀", "👑", "🏅", "🌌", "🪐", "🌠", "🎖️", "🏔️", "☄️", "🦅"], [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], appState.level, "levels", "Reach");
    pushGenerated("Sprint Sprint", ["🏃", "🔥", "💨", "⚡", "🚀", "🎯", "💠", "📈", "🏆", "🌟"], [5,10,15,20,25,30,35,40,45,50], appState.sprintHighScore || 0, "pts", "Score");


    achievements.push(
      { emoji: "🔐", name: "Secure Setup", unlocked: appState.sessionLock, description: "Turn on session lock in settings." },
      { emoji: "🔔", name: "Alert Ready", unlocked: appState.loginAlerts, description: "Keep login alerts enabled." },
      { emoji: "💡", name: "Guided Learner", unlocked: appState.lessonHints, description: "Use lesson hints while learning." },

      { emoji: "👤", name: "Profile Keeper", unlocked: Boolean(appState.nickname && appState.email), description: "Add a nickname and email to your profile." },
      { emoji: "🪪", name: "Bio Writer", unlocked: Boolean(appState.bio && appState.bio.trim().length >= 20), description: "Write a bio with at least 20 characters." },
      { emoji: "📡", name: "Live Analyst", unlocked: appState.xp >= 150 && completedLessons >= 3, description: "Build momentum in both XP and lessons." },
      { emoji: "🧬", name: "All Rounder", unlocked: appState.xp >= 500 && (appState.sprintHighScore || 0) >= 20, description: "Balance XP and game score." },

      { emoji: "💯", name: "Century Board", unlocked: achievements.filter((item) => item.unlocked).length >= 50, description: "Unlock 50 achievements on your way to the top." },
      { emoji: "📈", name: "Progress Watcher", unlocked: appState.xp >= 250 && appState.level >= 2, description: "Reach solid progress across XP and level." },
      { emoji: "🧱", name: "Foundation Strong", unlocked: completedLessons >= 10 && appState.xp >= 400, description: "Pair lesson depth with XP growth." },
      { emoji: "🎯", name: "Target Locked", unlocked: (appState.sprintHighScore || 0) >= 15 && appState.quizzesTaken >= 3, description: "Combine game score with quiz practice." },
      { emoji: "🧭", name: "Navigator", unlocked: completedLessons >= 12, description: "Keep moving deeper into the lesson path." },
      { emoji: "🪙", name: "Reward Seeker", unlocked: appState.xp >= 750, description: "Push your XP total into the high range." },
      { emoji: "🕹️", name: "Game Ready", unlocked: (appState.sprintHighScore || 0) >= 10, description: "Score 10 points in any game." },
      { emoji: "🧠", name: "Knowledge Stack", unlocked: completedLessons >= 15 && appState.quizzesTaken >= 5, description: "Strengthen both study and quiz habits." },
      { emoji: "🌠", name: "Sky Climber", unlocked: appState.level >= 6, description: "Rise to level 6." },
      { emoji: "🏹", name: "Precision Path", unlocked: (appState.sprintHighScore || 0) >= 30 && appState.level >= 3, description: "Reach high game scores at a solid level." },
      { emoji: "🔷", name: "Polished Profile", unlocked: Boolean(appState.nickname && appState.email && appState.bio && appState.bio.trim().length >= 30), description: "Complete a fuller profile setup." }
    );

    count.textContent = `${achievements.filter((item) => item.unlocked).length}/${achievements.length}`;
    grid.innerHTML = achievements.map((item) => `
      <div class="achievement-card ${item.unlocked ? "unlocked" : "locked"}">
        <div class="achievement-icon">${item.emoji}</div>
        <h5>${item.name}</h5>
        <p>${item.description}</p>
      </div>
    `).join("");
  }

  function updateProfileFields() {
    const nickname = document.getElementById("nickname");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const bio = document.getElementById("bio");
    if (nickname) nickname.value = appState.nickname;
    if (email) email.value = appState.email;
    if (phone) phone.value = appState.phone;
    if (bio) bio.value = appState.bio;
    renderAvatar();
    syncAvatarPickerUI();
    renderVerificationUI();
  }

  function syncSettingsUI() {
    const ids = {
      darkModeToggle: appState.darkMode,
      sessionLockToggle: appState.sessionLock,
      loginAlertsToggle: appState.loginAlerts,
      lessonHintsToggle: appState.lessonHints
    };

    Object.entries(ids).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.checked = value;
      }
    });
    syncThemeButton();
  }

  function showNotification(message, type = "info") {
    const container = document.getElementById("popupContainer");
    if (!container) {
      return;
    }

    const popup = document.createElement("div");
    popup.className = `popup ${type}`;
    popup.textContent = message;
    container.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
  }

  function showXpPopup(amount) {
    const xpDisplay = document.querySelector(".stat-box p") || document.getElementById("xpDisplay");
    if (!xpDisplay) return;
    const rect = xpDisplay.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "xp-popup";
    el.textContent = `+${amount} XP`;
    el.style.left = (rect.left + rect.width / 2 - 40) + "px";
    el.style.top = (rect.top - 10) + "px";
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("active"));
    setTimeout(() => el.remove(), 1200);
  }

  function playSuccessAnimation(message, callback) {
    const overlay = document.getElementById("successOverlay");
    const text = document.getElementById("successOverlayText");

    if (!overlay || !text) {
      if (typeof callback === "function") {
        callback();
      }
      return;
    }

    text.textContent = message;
    overlay.classList.add("active");

    setTimeout(() => {
      overlay.classList.remove("active");
      if (typeof callback === "function") {
        callback();
      }
    }, 1050);
  }

  function showAuthTab(tabName) {
    const loginTab = document.getElementById("loginTabContent");
    const signupTab = document.getElementById("signupTabContent");
    if (!loginTab || !signupTab) {
      return;
    }

    loginTab.classList.toggle("active", tabName === "login");
    signupTab.classList.toggle("active", tabName === "signup");
    setPhoneAuthStatus("login", "");
    setPhoneAuthStatus("signup", "");
  }

  function showAuthInterface() {
    const auth = document.getElementById("authContainer");
    const main = document.getElementById("mainInterface");
    if (auth) auth.style.display = "flex";
    if (main) main.style.display = "none";
    setUiMode("auth");
    showAuthTab("login");
  }

  function showMainInterface() {
    const auth = document.getElementById("authContainer");
    const main = document.getElementById("mainInterface");
    if (auth) auth.style.display = "none";
    if (main) {
      main.style.display = "flex";
      triggerEntrance(main, "nav-entrance-up");
    }
    setUiMode("main");
  }

  function triggerEntrance(el, className) {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  function toggleShortcuts() {
    const overlay = document.getElementById("shortcutsOverlay");
    const modal = document.getElementById("shortcutsModal");
    if (!overlay || !modal) return;
    const open = overlay.classList.toggle("open");
    modal.classList.toggle("open", open);
    document.body.classList.toggle("no-scroll", open);
    overlay.setAttribute("aria-hidden", !open);
    modal.setAttribute("aria-hidden", !open);
  }

  function hideAllModals() {
    const settings = document.getElementById("settings");
    const shortcutsOverlay = document.getElementById("shortcutsOverlay");
    const shortcutsModal = document.getElementById("shortcutsModal");
    if (settings?.classList.contains("open")) toggleSettings();
    if (shortcutsOverlay?.classList.contains("open")) toggleShortcuts();
  }

  function clearGameTimers() {
    if (sprintState.timer) {
      clearInterval(sprintState.timer);
      sprintState.timer = null;
    }
    if (linkUpState.timer) {
      clearInterval(linkUpState.timer);
      linkUpState.timer = null;
    }
  }

  function showGameSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.style.position = "relative";
    let overlay = container.querySelector(".game-spinner-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "game-spinner-overlay";
      overlay.innerHTML = '<div class="game-spinner"></div>';
      container.appendChild(overlay);
    }
    overlay.classList.remove("hidden");
  }

  function hideGameSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const overlay = container.querySelector(".game-spinner-overlay");
    if (overlay) overlay.classList.add("hidden");
  }

  function showPage(pageId) {
    clearGameTimers();
    const settings = document.getElementById("settings");
    const settingsOverlay = document.getElementById("settingsOverlay");
    if (settings?.classList.contains("open")) {
      settings.classList.remove("open");
      settings.setAttribute("aria-hidden", "true");
    }
    if (settingsOverlay?.classList.contains("open")) {
      settingsOverlay.classList.remove("open");
      settingsOverlay.setAttribute("aria-hidden", "true");
    }

    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active");
      page.style.display = "none";
    });

    document.querySelectorAll(".nav-btn").forEach((button) => {
      button.classList.remove("active");
    });

    const page = document.getElementById(pageId);
    if (page) {
      page.style.display = "block";
      page.classList.add("active");
      triggerEntrance(page, "nav-entrance-up");
    }

    const activeButton = document.querySelector(`.nav-btn[onclick="showPage('${pageId}')"]`);

    if (activeButton) {
      activeButton.classList.add("active");
    }

    if (pageId === "lessons") {
      goBackToLessons();
    }
    if (pageId === "quizzes") {
      goBackToQuizzes();
    }
    if (["dashboard", "lesson", "quizzes", "achievements"].includes(pageId)) {
      triggerPageMasonry(pageId);
    }

    setDrawerOpen(false);
    if (isMobileLayout()) {
      const main = document.querySelector(".main");
      if (main) {
        try {
          main.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
          main.scrollTop = 0;
        }
      }
      if (page) {
        try {
          page.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
          page.scrollTop = 0;
        }
      }
    }
  }

  function setupNavigationClicks() {
    const nav = document.querySelector(".nav-links");
    if (!nav) {
      return;
    }

    // Use event delegation so taps work reliably on mobile (even if inline onclick is blocked/quirky).
    nav.addEventListener("click", (event) => {
      const button = event.target?.closest?.(".nav-btn");
      const pageId = button?.dataset?.page;
      if (!button || !pageId) {
        return;
      }
      event.preventDefault();
      showPage(pageId);
    });
  }

  function triggerPageMasonry(pageId) {
    const page = document.getElementById(pageId);
    if (!page) {
      return;
    }

    const selectorsByPage = {
      dashboard: [".page-header", ".hero-card", ".hero-progress-ring", ".hero-progress-meta", ".progress-container", ".analytics-panel", ".analytics-card", ".analytics-mini", ".chart-card"],
      lessons: [".page-header", ".lessons-tabs", ".topic-grid > .topic-card", "#lessonDetail", "#lessonDetailTitle", "#lessonDetailIntro", "#lessonTopicsGrid .topic-card", "#lessonContent", "#lessonContent .lesson-detail-header", "#lessonContent .lesson-body", "#lessonContent .activity-section"],
      quizzes: [".page-header", "#quizGrid > .quiz-card", "#quizContent", "#quizContent .lesson-detail-header", "#quizIntro", "#quizQuestions .quiz-question", "#quizResult"],
      achievements: [".page-header", ".achievement-card"]
    };

    const elements = [];
    const seen = new Set();
    (selectorsByPage[pageId] || [".page-header"]).forEach((selector) => {
      page.querySelectorAll(selector).forEach((element) => {
        const isVisible = element.offsetParent !== null || getComputedStyle(element).display !== "none";
        if (!seen.has(element) && isVisible) {
          seen.add(element);
          elements.push(element);
        }
      });
    });

    elements.forEach((element, index) => {
      const delay = Math.min(0.92, 0.04 + index * 0.08);
      element.style.setProperty("--masonry-delay", `${delay}s`);
    });

    page.classList.remove("masonry-animate");
    void page.offsetWidth;
    page.classList.add("masonry-animate");
  }

  async function renderQuizzes() {
    const grid = document.getElementById("quizGrid");
    const badge = document.getElementById("quizzesCountBadge");
    if (!grid || !badge) {
      return;
    }

    let quizzes = [];
    try {
      if (typeof window.getQuizData !== "function") {
        throw new Error("getQuizData is not available. Ensure getQuizData.js is loaded before script.js.");
      }
      quizzes = await window.getQuizData();
    } catch (error) {
      console.error("Failed to load quiz data:", error);
      grid.innerHTML = "";
      badge.textContent = "0/0 Unlocked";
      return;
    }

    const unlockedCount = quizzes.filter((quiz) => quiz.unlocked).length;
    badge.textContent = `${unlockedCount}/${quizzes.length} Unlocked`;

    const groupOrder = ["html", "js", "css"];
    const groupLabels = { html: "HTML", js: "JavaScript", css: "CSS" };
    const groupClasses = { html: "quiz-cat-html", js: "quiz-cat-js", css: "quiz-cat-css" };
    const grouped = {};
    quizzes.forEach((quiz) => {
      const g = quiz.group || "html";
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(quiz);
    });

    let html = "";
    groupOrder.forEach((g) => {
      if (!grouped[g] || grouped[g].length === 0) return;
      const groupUnlocked = grouped[g].filter((q) => q.unlocked).length;
      const lessonTitles = [...new Set(grouped[g].map((q) => q.lessonTitle))];
      html += `
        <div class="quiz-category">
          <div class="quiz-category-header">
            <div class="quiz-category-top">
              <h3 class="quiz-category-name ${groupClasses[g]}">${groupLabels[g]} Quizzes</h3>
              <span class="quiz-category-badge">${groupUnlocked}/${grouped[g].length} unlocked</span>
            </div>
            <p class="quiz-category-lessons">Related lessons: ${lessonTitles.join(", ")}</p>
          </div>
          <div class="quiz-category-grid">
            ${grouped[g].map((quiz) => `
              <article class="topic-card quiz-card ${quiz.unlocked ? "" : "locked"}" data-quiz-id="${quiz.id}">
                <div>
                  <div class="topic-icon">${quiz.completed ? "✓" : quiz.unlocked ? "Q" : "🔒"}</div>
                  <h4>${quiz.title}</h4>
                  <p>${quiz.unlocked ? quiz.intro : `Complete all topics in ${quiz.lessonTitle} to unlock this quiz.`}</p>
                </div>
                <span class="topic-xp">${quiz.completed ? "Completed" : quiz.unlocked ? `${quiz.questionCount} Questions` : "Locked"}</span>
              </article>
            `).join("")}
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;

    grid.querySelectorAll(".quiz-card").forEach((card) => {
      card.addEventListener("click", () => {
        const quizId = Number(card.dataset.quizId);
        const quiz = quizzes.find((item) => item.id === quizId);
        if (quiz) {
          loadQuizContent(quiz);
        }
      });
    });
  }

  function loadQuizContent(quiz) {
    if (!quiz.unlocked) {
      showNotification("Finish the related lesson topics first to unlock this quiz.", "error");
      return;
    }

    currentQuiz = quiz;
    document.getElementById("quizGrid").style.display = "none";
    const quizContent = document.getElementById("quizContent");
    quizContent.style.display = "block";
    triggerEntrance(quizContent, "nav-entrance-up");
    document.getElementById("quizTitle").textContent = quiz.title;
    document.getElementById("quizBadge").textContent = quiz.completed ? "Completed" : quiz.difficulty;
    document.getElementById("quizIntro").textContent = quiz.intro;
    document.getElementById("quizResult").textContent = "";
    document.getElementById("quizResult").className = "activity-result";

    const questionsEl = document.getElementById("quizQuestions");
    questionsEl.innerHTML = quiz.questions.map((question, index) => `
      <div class="quiz-question">
        <h5>${index + 1}. ${question.question}</h5>
        <div class="quiz-options">
          ${question.options.map((option, optionIndex) => `
            <label class="quiz-option">
              <input type="radio" name="quiz-question-${index}" value="${escapeHtml(option)}">
              <span>${escapeHtml(option)}</span>
            </label>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  function submitQuiz() {
    if (!currentQuiz) {
      return;
    }

    let score = 0;
    let answered = 0;

    currentQuiz.questions.forEach((question, index) => {
      const selected = document.querySelector(`input[name="quiz-question-${index}"]:checked`);
      if (selected) {
        answered += 1;
        if (selected.value === question.answer) {
          score += 1;
        }
      }
    });

    const result = document.getElementById("quizResult");
    if (answered !== currentQuiz.questions.length) {
      result.textContent = "Answer every question before submitting the quiz.";
      result.className = "activity-result error";
      return;
    }

    const passed = score >= Math.ceil(currentQuiz.questions.length * 0.67);
    if (passed) {
      if (!appState.completedQuizzes.includes(currentQuiz.id)) {
        appState.completedQuizzes.push(currentQuiz.id);
        appState.quizzesTaken += 1;
        appState.xp += 40;
        logXpEarned(40);
        showXpPopup(40);
      }
      updateDashboard();
      result.textContent = `Quiz passed. Score: ${score}/${currentQuiz.questions.length}. You earned +40 XP.`;
      result.className = "activity-result success";
      showNotification(`Quiz complete: ${currentQuiz.title}`, "xp");
      renderQuizzes();
    } else {
      result.textContent = `Score: ${score}/${currentQuiz.questions.length}. Review the lesson and try again.`;
      result.className = "activity-result error";
    }
  }

  function goBackToQuizzes() {
    currentQuiz = null;
    document.getElementById("quizContent").style.display = "none";
    const grid = document.getElementById("quizGrid");
    grid.style.display = "grid";
    renderQuizzes();
    if (grid && grid.children.length) {
      triggerEntrance(grid, "nav-stagger");
    }
  }

  let currentDifficultyFilter = "all";
  let currentLessonSearch = "";

  function setDifficultyFilter(filter) {
    currentDifficultyFilter = filter;
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    renderLessons();
  }

  function setLessonSearch(value) {
    currentLessonSearch = value.toLowerCase().trim();
    renderLessons();
  }

  function filterLessonsByDifficulty(lessons) {
    let filtered = lessons;
    if (currentDifficultyFilter !== "all") {
      filtered = filtered.filter(l => l.difficulty === currentDifficultyFilter);
    }
    if (currentLessonSearch) {
      filtered = filtered.filter(l => l.title.toLowerCase().includes(currentLessonSearch));
    }
    return filtered;
  }

  function renderLessons() {
    const lessons = filterLessonsByDifficulty(getLessonData());
    const grid = document.getElementById("topicGrid");
    if (!grid) {
      return;
    }

    grid.innerHTML = lessons.map((lesson) => `
      <article class="topic-card lesson-card" data-lesson-id="${lesson.id}">
        <div class="topic-icon">${lesson.difficulty === "Advanced" ? "A" : lesson.difficulty === "Intermediate" ? "I" : "B"}</div>
        <h4>${lesson.title}</h4>
        <p>${lesson.intro}</p>
        <span class="topic-xp">${lesson.topics.length} topics</span>
      </article>
    `).join("");

    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
      emptyState.style.display = lessons.length === 0 ? "block" : "none";
    }

    grid.querySelectorAll(".lesson-card").forEach((card) => {
      card.addEventListener("click", () => {
        const lessonId = Number(card.dataset.lessonId);
        const lesson = lessons.find((item) => item.id === lessonId);
        if (lesson) {
          loadLessonDetail(lesson);
        }
      });
    });

    renderJSLessons();
    renderCSSLessons();
  }

  function renderJSLessons() {
    const jsLessons = filterLessonsByDifficulty(getJSLessonData());
    const grid = document.getElementById("topicGridJS");
    if (!grid) {
      return;
    }

    grid.innerHTML = jsLessons.map((lesson) => `
      <article class="topic-card lesson-card" data-lesson-id="${lesson.id}" data-is-js="true">
        <div class="topic-icon">${lesson.difficulty === "Advanced" ? "A" : lesson.difficulty === "Intermediate" ? "I" : "B"}</div>
        <h4>${lesson.title}</h4>
        <p>${lesson.intro}</p>
        <span class="topic-xp">${lesson.topics.length} topics</span>
      </article>
    `).join("");

    grid.querySelectorAll(".lesson-card").forEach((card) => {
      card.addEventListener("click", () => {
        const lessonId = Number(card.dataset.lessonId);
        const lesson = jsLessons.find((item) => item.id === lessonId);
        if (lesson) {
          loadLessonDetail(lesson);
        }
      });
    });
  }

  function renderCSSLessons() {
    const cssLessons = filterLessonsByDifficulty(getCSSLessonData());
    const grid = document.getElementById("topicGridCSS");
    if (!grid) {
      return;
    }

    grid.innerHTML = cssLessons.map((lesson) => `
      <article class="topic-card lesson-card" data-lesson-id="${lesson.id}" data-is-css="true">
        <div class="topic-icon">${lesson.difficulty === "Advanced" ? "A" : lesson.difficulty === "Intermediate" ? "I" : "B"}</div>
        <h4>${lesson.title}</h4>
        <p>${lesson.intro}</p>
        <span class="topic-xp">${lesson.topics.length} topics</span>
      </article>
    `).join("");

    grid.querySelectorAll(".lesson-card").forEach((card) => {
      card.addEventListener("click", () => {
        const lessonId = Number(card.dataset.lessonId);
        const lesson = cssLessons.find((item) => item.id === lessonId);
        if (lesson) {
          loadLessonDetail(lesson);
        }
      });
    });
  }

  function loadLessonDetail(lesson) {
    currentLessonGroup = lesson;
    document.querySelector(".lessons-tabs").style.display = "none";
    document.getElementById("topicGrid").style.display = "none";
    document.getElementById("topicGridJS").style.display = "none";
    document.getElementById("topicGridCSS").style.display = "none";
    document.getElementById("lessonContent").style.display = "none";
    const detailView = document.getElementById("lessonDetail");
    detailView.style.display = "block";
    triggerEntrance(detailView, "nav-entrance-up");
    document.getElementById("lessonDetailTitle").textContent = lesson.title;
    document.getElementById("lessonDetailIntro").textContent = lesson.intro;

    const grid = document.getElementById("lessonTopicsGrid");

    const completedCount = lesson.topics.filter((t) => appState.completedLessons.includes(t.id)).length;
    document.getElementById("lessonDetailBadge").textContent = `${lesson.difficulty} · ${completedCount}/${lesson.topics.length} Topics`;

    grid.innerHTML = lesson.topics.map((topic) => {
      const done = appState.completedLessons.includes(topic.id);
      return `
        <article class="topic-card ${done ? "completed" : ""}" data-topic-id="${topic.id}">
          <div>
            <div class="topic-icon">${done ? "✓" : topic.difficulty === "Advanced" ? "A" : topic.difficulty === "Intermediate" ? "I" : "B"}</div>
            <h4>${topic.title}</h4>
            <p>${topic.description}</p>
          </div>
          <span class="topic-xp">${done ? "Completed" : `${topic.xp} XP`}</span>
        </article>
      `;
    }).join("");

    triggerEntrance(grid, "nav-stagger");

    grid.querySelectorAll(".topic-card").forEach((card) => {
      card.addEventListener("click", () => {
        const topicId = Number(card.dataset.topicId);
        const topic = lesson.topics.find((t) => t.id === topicId);
        if (topic) {
          loadLessonContent(topic);
        }
      });
    });
  }

  function loadLessonContent(topic) {
    currentTopic = topic;
    document.getElementById("lessonDetail").style.display = "none";
    const contentView = document.getElementById("lessonContent");
    contentView.style.display = "block";
    triggerEntrance(contentView, "nav-entrance-up");

    document.getElementById("lessonTitle").textContent = topic.title;
    document.getElementById("lessonBadge").textContent = topic.difficulty;
    document.getElementById("lessonDescription").textContent = topic.description;

    const steps = document.getElementById("lessonSteps");
    steps.innerHTML = topic.steps.map((step) => `<li>${step}</li>`).join("");

    document.getElementById("lessonCode").innerHTML = `<pre class="code-block"><code>${escapeHtml(topic.code)}</code></pre>`;
    document.getElementById("activityPrompt").textContent = topic.activityPrompt;
    const savedCode = localStorage.getItem(`codelab_code_${topic.id}`);

    const textarea = document.getElementById("activityCode");
    textarea.style.display = "none";

    if (cmEditor) {
      cmEditor.toTextArea();
      cmEditor = null;
    }

    const mode = topic.id < 100 ? "xml" : topic.id >= 200 ? "css" : "javascript";
    cmEditor = CodeMirror.fromTextArea(textarea, {
      mode: mode,
      theme: "material-darker",
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      lineWrapping: true,
      value: savedCode || ""
    });
    cmEditor.setValue(savedCode || "");
    cmEditor.on("change", () => {
      localStorage.setItem(`codelab_code_${topic.id}`, cmEditor.getValue());
    });

    document.getElementById("activityOutput").srcdoc = savedCode || "";
    document.getElementById("activityHint").textContent = topic.activityHint;
    document.getElementById("activityHint").style.display = "none";
    document.getElementById("activityResult").textContent = "";
    document.getElementById("activityResult").className = "activity-result";
    document.getElementById("completeLessonBtn").style.display = "none";
    document.getElementById("checkActivityBtn").style.display = "inline-flex";
  }

  function runActivity() {
    const code = cmEditor ? cmEditor.getValue() : document.getElementById("activityCode").value;
    const consoleEl = document.getElementById("activityConsole");
    const consoleBody = consoleEl?.querySelector(".console-body");
    if (consoleBody) {
      consoleBody.innerHTML = "";
    }
    if (consoleEl) {
      consoleEl.style.display = "block";
    }

    const wrapped = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><script>
(function() {
  const origLog = console.log;
  const origError = console.error;
  const origWarn = console.warn;
  const logs = [];
  console.log = function(...args) {
    logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
    parent.postMessage({ type: "console", data: logs[logs.length - 1] }, "*");
  };
  console.error = function(...args) {
    logs.push("Error: " + args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
    parent.postMessage({ type: "console", data: logs[logs.length - 1] }, "*");
  };
  console.warn = function(...args) {
    logs.push("Warn: " + args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
    parent.postMessage({ type: "console", data: logs[logs.length - 1] }, "*");
  };
  window.onerror = function(msg) {
    parent.postMessage({ type: "console", data: "Error: " + msg }, "*");
  };
})();
<\/script>
</head>
<body>${code}</body>
</html>`;

    document.getElementById("activityOutput").srcdoc = wrapped;
  }

  function checkActivity() {
    if (!currentTopic) {
      return;
    }

    const code = cmEditor ? cmEditor.getValue() : document.getElementById("activityCode").value;
    const result = document.getElementById("activityResult");
    const validation = typeof currentTopic.validateActivity === "function" ? currentTopic.validateActivity(code) : true;
    const isCorrect = validation === true;

    if (isCorrect) {
      result.textContent = "Correct answer. You can now complete the lesson.";
      result.className = "activity-result success";
      document.getElementById("completeLessonBtn").style.display = "inline-flex";
      document.getElementById("checkActivityBtn").style.display = "none";
    } else {
      if (typeof validation === "string") {
        result.textContent = validation;
      } else if (!code.trim()) {
        result.textContent = "Your code is empty. Try writing the answer based on the steps and example above.";
      } else {
        result.textContent = "Almost there! Check the code example and steps — something is missing or needs fixing.";
      }
      result.className = "activity-result error";
      if (appState.lessonHints) {
        document.getElementById("activityHint").style.display = "block";
      }
    }
  }

  function completeLesson() {
    // Prevent navigation collisions: completing a lesson must never switch to the standalone quizzes page.
    // It should always return to the lesson topics/quizzes list (lessonDetail).
    if (!currentTopic) {
      return;
    }


    const code = cmEditor ? cmEditor.getValue() : document.getElementById("activityCode")?.value ?? "";
    const requiresValidation = typeof currentTopic.validateActivity === "function";
    const validation = requiresValidation ? currentTopic.validateActivity(code) : true;
    const isCorrect = validation === true;

    if (!isCorrect) {
      const result = document.getElementById("activityResult");
      if (result) {
        result.textContent = typeof validation === "string" ? validation : "Finish the activity first (click Check Answer) before completing the lesson.";
        result.className = "activity-result error";
      }
      if (appState.lessonHints) {
        document.getElementById("activityHint").style.display = "block";
      }
      document.getElementById("completeLessonBtn").style.display = "none";
      document.getElementById("checkActivityBtn").style.display = "inline-flex";
      return;
    }

    const alreadyCompleted = appState.completedLessons.includes(currentTopic.id);
    if (!alreadyCompleted) {
      appState.completedLessons.push(currentTopic.id);
      appState.lessonsDone += 1;
      appState.xp += currentTopic.xp;
      logXpEarned(currentTopic.xp);
      showXpPopup(currentTopic.xp);
    }
    localStorage.removeItem(`codelab_code_${currentTopic.id}`);
    updateDashboard();
    renderQuizzes();

    showNotification(alreadyCompleted ? "Lesson already completed." : `Lesson complete: +${currentTopic.xp} XP`, alreadyCompleted ? "info" : "xp");
    // Always go back to the lesson topics view.
    goBackToTopics();
  }


  function goBackToLessons() {
    currentLessonGroup = null;
    document.querySelector(".lessons-tabs").style.display = "";
    document.getElementById("lessonContent").style.display = "none";
    document.getElementById("lessonDetail").style.display = "none";
    const activeTab = document.querySelector("[data-lesson-tab].active")?.dataset?.lessonTab || "html";
    switchLessonTab(activeTab);
    renderLessons();
  }

  function goBackToTopics() {
    if (cmEditor) {
      cmEditor.toTextArea();
      cmEditor = null;
      document.getElementById("activityCode").style.display = "none";
    }
    // Return from a topic (lessonContent) back to the list of topics/quizzes for that lesson group.
    document.getElementById("lessonContent").style.display = "none";
    if (currentLessonGroup) {
      loadLessonDetail(currentLessonGroup);
    } else {
      goBackToLessons();
    }
  }

  function switchLessonTab(tab) {
    document.querySelectorAll("[data-lesson-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lessonTab === tab);
    });
    document.getElementById("topicGrid").style.display = tab === "html" ? "grid" : "none";
    document.getElementById("topicGridJS").style.display = tab === "js" ? "grid" : "none";
    document.getElementById("topicGridCSS").style.display = tab === "css" ? "grid" : "none";
    const gridId = tab === "html" ? "topicGrid" : tab === "js" ? "topicGridJS" : "topicGridCSS";
    const grid = document.getElementById(gridId);
    if (grid && grid.children.length) {
      triggerEntrance(grid, "nav-stagger");
    }
  }

  function toggleSettings() {
    const settings = document.getElementById("settings");
    const overlay = document.getElementById("settingsOverlay");
    if (!settings || !overlay) {
      return;
    }

    const willOpen = !settings.classList.contains("open");
    syncSettingsUI();
    if (willOpen && isMobileLayout()) {
      setDrawerOpen(false);
    }
    settings.classList.toggle("open", willOpen);
    overlay.classList.toggle("open", willOpen);
    settings.setAttribute("aria-hidden", willOpen ? "false" : "true");
    overlay.setAttribute("aria-hidden", willOpen ? "false" : "true");

    if (willOpen) {
      // Small delay so the opening transition feels intentional.
      setTimeout(() => {
        const focusTarget = settings.querySelector("button, input, textarea, select");
        focusTarget?.focus?.();
      }, 60);
    }
  }

  function toggleDark() {
    appState.darkMode = !appState.darkMode;
    document.body.classList.toggle("dark", appState.darkMode);
    document.body.classList.toggle("light", !appState.darkMode);
    syncThemeButton();
    syncSettingsUI();
    saveState();
  }

  function syncThemeButton() {
    const icon = document.getElementById("themeIcon");
    const label = document.getElementById("themeLabel");
    if (icon && label) {
      icon.textContent = appState.darkMode ? "🌙" : "☀️";
      label.textContent = appState.darkMode ? "Dark" : "Light";
    }
  }

  function toggleSetting(settingName) {
    if (!(settingName in appState)) {
      return;
    }

    appState[settingName] = !appState[settingName];
    syncSettingsUI();
    saveState();

    const labels = {
      sessionLock: "Session lock",
      loginAlerts: "Login alerts",
      lessonHints: "Lesson hints"
    };

    showNotification(`${labels[settingName] || "Setting"} ${appState[settingName] ? "enabled" : "disabled"}`, "info");
  }

  async function saveProfile() {
    const nextNickname = document.getElementById("nickname")?.value.trim() || "Demo User";
    const nextEmail = sanitizeString(firebaseState.user?.email, appState.email);
    const nextPhone = normalizePhone(document.getElementById("phone")?.value.trim() || "");
    const nextBio = document.getElementById("bio")?.value.trim();

    if (nextPhone && !isValidPhone(nextPhone)) {
      setProfileStatus("Phone number must be 11 digits and start with 09.");
      return;
    }

    const emailChanged = nextEmail !== appState.email;
    const phoneChanged = nextPhone !== appState.phone;

    appState.nickname = nextNickname;
    appState.email = nextEmail;
    appState.phone = nextPhone;
    appState.bio = nextBio;

    if (emailChanged) {
      appState.emailVerified = false;
      clearPendingEmailVerification();
    }
    if (phoneChanged) {
      appState.phoneVerified = false;
      clearPendingPhoneVerification();
    }
    saveCurrentAccount();
    try {
      await persistStateNow();
      document.body.dataset.sync = "synced";
    } catch (error) {
      setProfileStatus(error.message || "Unable to save your profile right now.");
      return;
    }
    updateDashboard();
    setProfileStatus("Profile saved successfully.");
    showNotification("Profile updated", "info");
  }

  function filterHtmlLessons(level) {
    const list = document.getElementById("lessonHtmlList");
    if (!list) return;

    const cards = Array.from(list.querySelectorAll(".topic-card"));
    cards.forEach((card) => {
      const cardLevel = card.getAttribute("data-difficulty");
      const show = level === "all" || cardLevel === level;
      card.style.display = show ? "" : "none";
    });
  }

  function openHtmlLesson(lessonKey) {
    const titleEl = document.getElementById("htmlLessonDetailTitle");
    const subEl = document.getElementById("htmlLessonDetailSubtitle");
    const cardsEl = document.getElementById("htmlLessonDetailCards");
    if (!cardsEl) return;

    const htmlLessons = getLessonData();
    const normalized = String(lessonKey || "").toLowerCase();

    const mapping = {
      "foundations": 1,
      "links-media": 2,
      "forms-inputs": 3,
      "tables-data": 5,
      "semantic-html": 6,
      "media-embeds": 8,
      "metadata-a11y": 9,
      // additional keys for completeness if you add cards later
      "lists-navigation": 4
    };

    const targetLessonId = mapping[normalized] || null;
    const lesson = targetLessonId ? htmlLessons.find((l) => l.id === targetLessonId) : null;

    if (!lesson) {
      titleEl && (titleEl.textContent = "Lesson not found");
      subEl && (subEl.textContent = "Try selecting another HTML lesson card.");
      cardsEl.innerHTML = `<div class="topic-card" style="cursor:default; padding:16px;">
        <h4 style="margin:0 0 6px 0; font-size:1rem;">No lesson available</h4>
        <p style="margin:0; color: var(--muted); line-height:1.6;">Could not match the selected card to a lesson.</p>
      </div>`;
      return;
    }

    titleEl && (titleEl.textContent = lesson.title);
    subEl && (subEl.textContent = `${lesson.topics.length} Topics • ${lesson.difficulty} • Lecture + Activity`);

    const topicCards = lesson.topics.slice(0, 3).map((topic) => `
      <div class="topic-card" style="cursor:default; padding:16px;">
        <h4 style="margin:0 0 6px 0; font-size:1rem;">${topic.title}</h4>
        <p style="margin:0 0 10px; color: var(--muted); line-height:1.6;">${topic.description}</p>

        <div style="display:grid; gap:10px;">
          <div class="activity-editor" style="padding:14px; border-radius:18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
            <strong style="display:block; margin-bottom:6px;">Lecture</strong>
            <p style="margin:0; color: var(--muted); line-height:1.6;">${escapeHtml(topic.steps[0] || "Read the steps in the lesson overview.")}</p>
          </div>

          <div class="activity-editor" style="padding:14px; border-radius:18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
            <strong style="display:block; margin-bottom:6px;">Activity</strong>
            <p style="margin:0; color: var(--muted); line-height:1.6;">${escapeHtml(topic.activityPrompt || "Complete this topic activity.")}</p>
            <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
              <button type="button" class="btn-secondary" onclick="openHtmlTopicActivity(${topic.id})">Open Editor</button>
              <button type="button" class="btn-secondary" onclick="runHtmlTopicPreview(${topic.id})">Preview</button>
            </div>
          </div>
        </div>
      </div>
    `).join("");

    cardsEl.innerHTML = topicCards;
  }

  function getTopicById(topicId) {
    const lessons = getLessonData();
    for (const lesson of lessons) {
      for (const topic of lesson.topics) {
        if (topic.id === topicId) return topic;
      }
    }
    return null;
  }

  function runHtmlTopicPreview(topicId) {
    const topic = getTopicById(topicId);
    if (!topic) return;

    // Reuse the existing lesson activity iframe if present (it exists for the full lessons flow).
    const output = document.getElementById("activityOutput");
    if (output && topic.activityStarter) {
      output.srcdoc = topic.activityStarter;
    }
  }

  function openHtmlTopicActivity(topicId) {
    const topic = getTopicById(topicId);
    if (!topic) return;

    // Load topic into existing lesson editor so the lecture+activity feels real.
    const lessonContent = document.getElementById("lessonContent");
    const lessonDetail = document.getElementById("lessonDetail");

    // If the lesson editor blocks exist, show the lesson UI.
    if (lessonContent && lessonDetail) {
      currentTopic = topic;
      document.getElementById("lessonDetail").style.display = "none";
      lessonContent.style.display = "block";

      document.getElementById("lessonTitle").textContent = topic.title;
      document.getElementById("lessonBadge").textContent = topic.difficulty;
      document.getElementById("lessonDescription").textContent = topic.description;

      const steps = document.getElementById("lessonSteps");
      if (steps) {
        steps.innerHTML = (topic.steps || []).map((step) => `<li>${step}</li>`).join("");
      }

      const codeEl = document.getElementById("lessonCode");
      if (codeEl) {
        codeEl.innerHTML = `<pre class="code-block"><code>${escapeHtml(topic.code || "")}</code></pre>`;
      }

      const promptEl = document.getElementById("activityPrompt");
      if (promptEl) promptEl.textContent = topic.activityPrompt;

      const codeInputEl = document.getElementById("activityCode");
      if (codeInputEl) codeInputEl.value = topic.activityStarter;

      const outputEl = document.getElementById("activityOutput");
      if (outputEl && topic.activityStarter) outputEl.srcdoc = topic.activityStarter;

      const hintEl = document.getElementById("activityHint");
      if (hintEl) {
        hintEl.textContent = topic.activityHint;
        hintEl.style.display = "none";
      }

      const resultEl = document.getElementById("activityResult");
      if (resultEl) {
        resultEl.textContent = "";
        resultEl.className = "activity-result";
      }

      const completeBtn = document.getElementById("completeLessonBtn");
      const checkBtn = document.getElementById("checkActivityBtn");
      if (completeBtn) completeBtn.style.display = "none";
      if (checkBtn) checkBtn.style.display = "inline-flex";

      // Navigate to lessons page if it exists.
      const lessonsPage = document.getElementById("lesson");
      if (lessonsPage) showPage("lessons");

      return;
    }

    // Fallback: if full editor blocks are missing, at least preview.
    runHtmlTopicPreview(topicId);
  }

  // Exports
  C.getCurrentAvatarSrc = getCurrentAvatarSrc;
  C.renderAvatar = renderAvatar;
  C.syncAvatarPickerUI = syncAvatarPickerUI;
  C.setProfileStatus = setProfileStatus;
  C.selectAvatarPreset = selectAvatarPreset;
  C.clearCustomAvatar = clearCustomAvatar;
  C.handleAvatarUpload = handleAvatarUpload;
  C.updateDailyStreak = updateDailyStreak;
  C.logXpEarned = logXpEarned;
  C.renderAnalytics = renderAnalytics;
  C.updateDashboard = updateDashboard;
  C.renderCategoryProgress = renderCategoryProgress;
  C.renderBadges = renderBadges;
  C.renderAchievements = renderAchievements;
  C.updateProfileFields = updateProfileFields;
  C.syncSettingsUI = syncSettingsUI;
  C.showNotification = showNotification;
  C.showXpPopup = showXpPopup;
  C.playSuccessAnimation = playSuccessAnimation;
  C.showAuthTab = showAuthTab;
  C.showAuthInterface = showAuthInterface;
  C.showMainInterface = showMainInterface;
  C.triggerEntrance = triggerEntrance;
  C.clearGameTimers = clearGameTimers;
  C.showGameSpinner = showGameSpinner;
  C.hideGameSpinner = hideGameSpinner;
  C.showPage = showPage;
  C.setupNavigationClicks = setupNavigationClicks;
  C.triggerPageMasonry = triggerPageMasonry;
  C.renderQuizzes = renderQuizzes;
  C.loadQuizContent = loadQuizContent;
  C.submitQuiz = submitQuiz;
  C.goBackToQuizzes = goBackToQuizzes;
  C.renderLessons = renderLessons;
  C.renderJSLessons = renderJSLessons;
  C.renderCSSLessons = renderCSSLessons;
  C.loadLessonDetail = loadLessonDetail;
  C.loadLessonContent = loadLessonContent;
  C.runActivity = runActivity;
  C.checkActivity = checkActivity;
  C.completeLesson = completeLesson;
  C.goBackToLessons = goBackToLessons;
  C.goBackToTopics = goBackToTopics;
  C.switchLessonTab = switchLessonTab;
  C.toggleSettings = toggleSettings;
  C.toggleDark = toggleDark;
  C.syncThemeButton = syncThemeButton;
  C.toggleSetting = toggleSetting;
  C.saveProfile = saveProfile;
  C.filterHtmlLessons = filterHtmlLessons;
  C.openHtmlLesson = openHtmlLesson;
  C.getTopicById = getTopicById;
  C.runHtmlTopicPreview = runHtmlTopicPreview;
  C.openHtmlTopicActivity = openHtmlTopicActivity;
  C.hideAllModals = hideAllModals;
  C.toggleShortcuts = toggleShortcuts;
  C.setDifficultyFilter = setDifficultyFilter;
  C.setLessonSearch = setLessonSearch;
  C.filterLessonsByDifficulty = filterLessonsByDifficulty;
})();
