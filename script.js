(() => {
  "use strict";

  const LAYOUT_BREAKPOINT_PX = 820;
  const DRAWER_EDGE_PX = 24;
  const DRAWER_OPEN_SWIPE_PX = 70;
  const DRAWER_CLOSE_SWIPE_PX = 70;

  function isMobileUserAgent() {
    const uaData = navigator.userAgentData;
    if (uaData && typeof uaData.mobile === "boolean") {
      return uaData.mobile;
    }

    const ua = navigator.userAgent || "";
    return /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  }

  function applyAutoLayout() {
    const root = document.documentElement;
    const smallScreen = window.matchMedia(`(max-width: ${LAYOUT_BREAKPOINT_PX}px)`).matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const uaMobile = isMobileUserAgent();

    // Phone-first: use the responsive breakpoint; also allow mobile UA + coarse pointer
    // to force the mobile-friendly nav in some embedded webviews / unusual viewport setups.
    const isMobile = smallScreen || (uaMobile && coarsePointer);

    root.dataset.device = isMobile ? "mobile" : "desktop";
    root.dataset.layout = isMobile ? "mobile" : "desktop";
  }

  function isMobileLayout() {
    return document.documentElement.dataset.layout === "mobile";
  }

  function setDrawerOpen(open) {
    const root = document.documentElement;
    root.dataset.drawer = open ? "open" : "closed";

    const overlay = document.getElementById("drawerOverlay");
    if (overlay) {
      overlay.setAttribute("aria-hidden", open ? "false" : "true");
    }

    const toggle = document.getElementById("drawerToggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
  }

  function toggleDrawer() {
    const root = document.documentElement;
    const currentlyOpen = root.dataset.drawer === "open";
    setDrawerOpen(!currentlyOpen);
  }

  function ensureMobileDrawerUI() {
    if (document.getElementById("drawerToggle")) {
      return;
    }

    const toggle = document.createElement("button");
    toggle.id = "drawerToggle";
    toggle.type = "button";
    toggle.className = "drawer-toggle";
    toggle.setAttribute("aria-label", "Open navigation");
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      toggleDrawer();
    });

    const overlay = document.createElement("div");
    overlay.id = "drawerOverlay";
    overlay.className = "drawer-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.addEventListener("click", () => {
      setDrawerOpen(false);
    });

    document.body.appendChild(toggle);
    document.body.appendChild(overlay);
    setDrawerOpen(false);
  }

  function setupDesktopEdgeHover() {
  }

  function syncDrawerForLayout() {
    ensureMobileDrawerUI();
    if (isMobileLayout()) {
    } else {
      setDrawerOpen(false);
    }
  }

  function setUiMode(mode) {
    document.documentElement.dataset.ui = mode;
  }

  function setupDrawerGestures() {
    let tracking = false;
    let startX = 0;
    let startY = 0;
    let startedOnSidebar = false;

    function onStart(clientX, clientY, target) {
      if (!isMobileLayout()) {
        return;
      }

      tracking = true;
      startX = clientX;
      startY = clientY;
      startedOnSidebar = Boolean(target && target.closest && target.closest(".sidebar"));
    }

    function onMove(clientX, clientY) {
      if (!tracking || !isMobileLayout()) {
        return;
      }

      const dx = clientX - startX;
      const dy = clientY - startY;
      if (Math.abs(dy) > 60) {
        return;
      }

      const drawerOpen = document.documentElement.dataset.drawer === "open";

      // Open: swipe right starting from the left edge.
      if (!drawerOpen && startX <= DRAWER_EDGE_PX && dx >= DRAWER_OPEN_SWIPE_PX) {
        setDrawerOpen(true);
        tracking = false;
        return;
      }

      // Close: swipe left while drawer is open (preferably started on sidebar).
      if (drawerOpen && (startedOnSidebar || startX <= 320) && dx <= -DRAWER_CLOSE_SWIPE_PX) {
        setDrawerOpen(false);
        tracking = false;
      }
    }

    function onEnd() {
      tracking = false;
    }

    // Pointer Events (preferred)
    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch") {
        return;
      }
      onStart(event.clientX, event.clientY, event.target);
    }, { passive: true });

    document.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "touch") {
        return;
      }
      onMove(event.clientX, event.clientY);
    }, { passive: true });

    document.addEventListener("pointerup", onEnd, { passive: true });
    document.addEventListener("pointercancel", onEnd, { passive: true });

    // Touch Events fallback
    document.addEventListener("touchstart", (event) => {
      const touch = event.touches && event.touches[0];
      if (!touch) return;
      onStart(touch.clientX, touch.clientY, event.target);
    }, { passive: true });

    document.addEventListener("touchmove", (event) => {
      const touch = event.touches && event.touches[0];
      if (!touch) return;
      onMove(touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onEnd, { passive: true });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    });
  }

  let layoutFrame = 0;
  function scheduleAutoLayout() {
    if (layoutFrame) {
      return;
    }

    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = 0;
      applyAutoLayout();
      syncDrawerForLayout();
    });
  }

  const defaultAppState = {
    user: "Demo User",
    nickname: "Demo User",
    email: "",
    emailVerified: false,
    phone: "",
    phoneVerified: false,
    bio: "Learning HTML and building projects.",
    avatarChoice: "wave",
    customAvatar: "",
    xp: 150,
    level: 1,
    lessonsDone: 0,
    quizzesTaken: 0,

    completedLessons: [],
    completedQuizzes: [],
    darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
    sprintHighScore: 0,
    typingHighScore: 0,
    studyStreak: 0,
    lastActiveDate: "",
    xpHistory: [],
    sessionLock: false,
    loginAlerts: true,
    lessonHints: true
  };
  const appState = { ...defaultAppState };
  const firebaseState = {
    services: null,
    user: null,
    ready: false,
    hydrated: false,
    authResolvedOnce: false,
    saveTimer: 0,
    savePending: false,
    authUnsubscribe: null
  };
  const phoneAuthState = {
    login: {
      verifier: null,
      widgetId: null,
      confirmationResult: null
    },
    signup: {
      verifier: null,
      widgetId: null,
      confirmationResult: null
    },
    pendingProfile: null
  };

  // Apply as early as possible to reduce layout "jump" on load.
  function bootstrapEarlyLayout() {
    if (!document.body) {
      requestAnimationFrame(bootstrapEarlyLayout);
      return;
    }
    applyAutoLayout();
    setUiMode("auth");
    syncDrawerForLayout();
    setupDrawerGestures();
  }
  bootstrapEarlyLayout();
  window.addEventListener("resize", scheduleAutoLayout, { passive: true });
  window.addEventListener("orientationchange", scheduleAutoLayout, { passive: true });

  const avatarPresets = {
    wave: buildAvatarDataUri({
      backgroundStart: "#34c3ff",
      backgroundEnd: "#7ef2c2",
      hair: "#122033",
      shirt: "#ffffff",
      skin: "#ffd7b8"
    }),
    sunset: buildAvatarDataUri({
      backgroundStart: "#ff9a62",
      backgroundEnd: "#ffd166",
      hair: "#5d2e46",
      shirt: "#fff7ed",
      skin: "#f7c59f"
    }),
    forest: buildAvatarDataUri({
      backgroundStart: "#44b78b",
      backgroundEnd: "#b8f28d",
      hair: "#214d3a",
      shirt: "#f5fff8",
      skin: "#f1c7a3"
    })
  };

  let currentQuiz = null;
  let currentLessonGroup = null;
  let currentTopic = null;
  let cmEditor = null;

  let audioContext = null;
  let sprintState = { category: "all", difficulty: "all", lives: 3, score: 0, streak: 0, maxStreak: 0, questionIndex: 0, questions: [], timer: null, timeLeft: 15, active: false, finished: false, totalCorrect: 0, totalQuestions: 0, answered: false };
  let linkUpState = { category: "all", pairs: [], selectedLeft: null, matchedPairs: [], wrongPairs: [], timer: null, timeLeft: 30, score: 0, active: false, mistakes: 0, finished: false };
  let bugState = { category: "all", questions: [], questionIndex: 0, score: 0, active: false, streak: 0, totalCorrect: 0, phase: "line", selectedLine: null, finished: false, totalQuestions: 0 };

  function buildAvatarDataUri(palette) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="avatarBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${palette.backgroundStart}" />
            <stop offset="100%" stop-color="${palette.backgroundEnd}" />
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="40" fill="url(#avatarBg)" />
        <circle cx="80" cy="63" r="30" fill="${palette.skin}" />
        <path d="M51 60c4-23 19-34 42-34 16 0 28 7 36 23-3 5-8 9-15 11-7-8-17-12-29-12-13 0-23 4-34 12-5 0-10-1-15 0z" fill="${palette.hair}" />
        <path d="M46 137c8-26 29-39 62-39s54 13 62 39v23H46z" fill="${palette.shirt}" fill-opacity=".92" />
        <circle cx="68" cy="66" r="4" fill="${palette.hair}" />
        <circle cx="92" cy="66" r="4" fill="${palette.hair}" />
        <path d="M69 81c7 6 15 6 22 0" stroke="#d07a5c" stroke-width="4" stroke-linecap="round" fill="none" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function resetAppState() {
    Object.keys(appState).forEach((key) => {
      delete appState[key];
    });
    Object.assign(appState, defaultAppState);
  }

  function sanitizeString(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
  }

  function isFirestoreOfflineError(error) {
    const code = String(error?.code || "");
    const message = String(error?.message || "").toLowerCase();
    return code.includes("unavailable") || code.includes("failed-precondition") || message.includes("client is offline");
  }

  function normalizePhoneDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatPhoneForDisplay(value) {
    const digits = normalizePhoneDigits(value);
    if (/^09\d{9}$/.test(digits)) {
      return digits;
    }
    if (/^639\d{9}$/.test(digits)) {
      return `0${digits.slice(2)}`;
    }
    return digits;
  }

  function normalizeAuthPhone(value) {
    return formatPhoneForDisplay(value);
  }

  function toE164Phone(value) {
    const localNumber = formatPhoneForDisplay(value);
    if (!/^09\d{9}$/.test(localNumber)) {
      return "";
    }
    return `+63${localNumber.slice(1)}`;
  }

  function isValidAuthPhone(value) {
    return /^09\d{9}$/.test(String(value || "").trim());
  }

  function sanitizePhoneInputValue(value) {
    const rawDigits = normalizePhoneDigits(value);
    const digits = rawDigits.slice(0, 12);
    if (!digits) {
      return "";
    }
    if (digits.startsWith("63") && digits.length >= 12) {
      return `0${digits.slice(2, 12)}`;
    }
    if (digits.startsWith("9")) {
      return `0${digits.slice(0, 10)}`;
    }
    if (digits.startsWith("0")) {
      return digits;
    }
    return digits.slice(0, 11);
  }

  function setupPhoneInputs() {
    [
      "loginPhoneNumber",
      "signupPhoneNumber",
      "phone"
    ].forEach((id) => {
      const input = document.getElementById(id);
      if (!input) {
        return;
      }

      const applySanitizedValue = () => {
        input.value = sanitizePhoneInputValue(input.value);
      };

      input.addEventListener("input", applySanitizedValue);
      input.addEventListener("blur", applySanitizedValue);
      applySanitizedValue();
    });
  }

  function setPhoneAuthStatus(mode, message) {
    const element = document.getElementById(mode === "login" ? "loginPhoneStatus" : "signupPhoneStatus");
    if (element) {
      element.textContent = message;
    }
  }

  async function ensurePhoneRecaptcha(mode) {
    const current = phoneAuthState[mode];
    if (current.verifier) {
      return current.verifier;
    }

    const { auth, helpers } = firebaseState.services;
    const containerId = mode === "login" ? "loginPhoneRecaptcha" : "signupPhoneRecaptcha";
    auth.languageCode = navigator.language || "en";
    current.verifier = new helpers.RecaptchaVerifier(auth, containerId, {
      size: "normal",
      callback: () => {},
      "expired-callback": () => {
        setPhoneAuthStatus(mode, "Verification expired. Please request a new code.");
      }
    });
    current.widgetId = await current.verifier.render();
    return current.verifier;
  }

  async function sendPhoneAuthCode(mode) {
    if (!firebaseState.services?.configured) {
      setPhoneAuthStatus(mode, getFirebaseConfigError());
      return;
    }

    const phoneInput = document.getElementById(mode === "login" ? "loginPhoneNumber" : "signupPhoneNumber");
    const nicknameInput = document.getElementById("signupNickname");
    const phoneNumber = normalizeAuthPhone(phoneInput?.value || "");
    const e164PhoneNumber = toE164Phone(phoneNumber);

    if (!isValidAuthPhone(phoneNumber)) {
      setPhoneAuthStatus(mode, "Enter an 11-digit mobile number that starts with 09.");
      return;
    }

    if (mode === "signup" && !(nicknameInput?.value || "").trim()) {
      setPhoneAuthStatus(mode, "Enter a display name before signing up with phone.");
      return;
    }

    try {
      const verifier = await ensurePhoneRecaptcha(mode);
      phoneAuthState.pendingProfile = mode === "signup"
        ? {
            nickname: nicknameInput.value.trim(),
            phone: phoneNumber
          }
        : null;
      phoneAuthState[mode].confirmationResult = await firebaseState.services.helpers.signInWithPhoneNumber(
        firebaseState.services.auth,
        e164PhoneNumber,
        verifier
      );
      if (phoneInput) {
        phoneInput.value = phoneNumber;
      }
      setPhoneAuthStatus(mode, `We sent a verification code to ${phoneNumber}. Enter the 6-digit code to continue.`);
    } catch (error) {
      console.error("Phone auth send code error:", error);
      setPhoneAuthStatus(mode, error.message || "Unable to send the verification code.");
    }
  }

  async function confirmPhoneAuthCode(mode) {
    const codeInput = document.getElementById(mode === "login" ? "loginPhoneCode" : "signupPhoneCode");
    const code = (codeInput?.value || "").trim();
    const confirmationResult = phoneAuthState[mode].confirmationResult;

    if (!confirmationResult) {
      setPhoneAuthStatus(mode, "Send a verification code first.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setPhoneAuthStatus(mode, "Enter the 6-digit verification code.");
      return;
    }

    try {
      await confirmationResult.confirm(code);
      phoneAuthState[mode].confirmationResult = null;
      setPhoneAuthStatus(mode, "");
      if (codeInput) {
        codeInput.value = "";
      }
    } catch (error) {
      console.error("Phone auth confirm error:", error);
      setPhoneAuthStatus(mode, error.message || "That verification code is invalid.");
    }
  }

  function getFirebaseConfigError() {
    return "Firebase is not configured yet. Update firebase-config.js with your project credentials.";
  }

  function updateSecureSyncLabel(enabled) {
    const loaderChip = document.getElementById("loaderChip");
    if (!loaderChip) {
      return;
    }
    if (enabled) {
      loaderChip.textContent = "Secure Sync";
      loaderChip.style.opacity = "1";
      loaderChip.style.height = "auto";
      loaderChip.style.visibility = "visible";
    } else {
      loaderChip.textContent = "";
      loaderChip.style.opacity = "0";
      loaderChip.style.height = "0";
      loaderChip.style.visibility = "hidden";
    }
  }

  function setAppLoading(loading, message = "") {
    const loader = document.getElementById("appLoader");
    const loaderMessage = document.getElementById("appLoaderMessage");
    document.body.classList.toggle("app-loading", loading);
    if (loader) {
      loader.classList.toggle("hidden", !loading);
      loader.style.display = loading ? "grid" : "none";
    }
    if (loaderMessage && message) {
      loaderMessage.textContent = message;
    }
  }

  function setAuthBusy(form, busy) {
    const button = document.getElementById(form === "login" ? "loginButton" : "signupButton");
    const status = document.getElementById(form === "login" ? "loginStatus" : "signupStatus");
    if (button) {
      button.disabled = busy;
      button.classList.toggle("is-loading", busy);
    }
    if (status) {
      status.classList.toggle("pending", busy);
    }
  }

  async function waitForFirebaseServices() {
    if (window.firebaseServices) {
      firebaseState.services = window.firebaseServices;
      return firebaseState.services;
    }

    return new Promise((resolve) => {
      window.addEventListener("firebase-ready", (event) => {
        firebaseState.services = event.detail;
        resolve(event.detail);
      }, { once: true });
    });
  }

  function isAuthenticated() {
    return Boolean(firebaseState.user);
  }

  function getSessionUser() {
    return firebaseState.user?.uid || "";
  }

  function applyAccountToState(account = {}, authUser = firebaseState.user) {
    const email = sanitizeString(account.email, authUser?.email || "");
    const phone = formatPhoneForDisplay(sanitizeString(account.phone, authUser?.phoneNumber || ""));
    const fallbackName = email.includes("@") ? email.split("@")[0] : phone || "Learner";
    appState.user = sanitizeString(account.username, email || phone || fallbackName || "Learner");
    appState.nickname = sanitizeString(account.nickname, authUser?.displayName || appState.user || "Learner");
    appState.email = email;
    appState.emailVerified = Boolean(authUser?.emailVerified || account.emailVerified);
    appState.phone = phone;
    appState.phoneVerified = Boolean(account.phoneVerified);
    appState.bio = sanitizeString(account.bio, defaultAppState.bio);
    appState.avatarChoice = sanitizeString(account.avatarChoice, "wave");
    appState.customAvatar = sanitizeString(account.customAvatar);
  }

  function applyCloudState(data = {}) {
    applyAccountToState(data.profile || {}, firebaseState.user);

    const progress = data.progress || {};
    const preferences = data.preferences || {};

    appState.xp = Number.isFinite(progress.xp) ? progress.xp : defaultAppState.xp;
    appState.level = Number.isFinite(progress.level) ? progress.level : defaultAppState.level;

    appState.sprintHighScore = Number.isFinite(progress.sprintHighScore) ? progress.sprintHighScore : defaultAppState.sprintHighScore;
    appState.typingHighScore = Number.isFinite(progress.typingHighScore) ? progress.typingHighScore : defaultAppState.typingHighScore;

    appState.lessonsDone = Number.isFinite(progress.lessonsDone) ? progress.lessonsDone : defaultAppState.lessonsDone;
    appState.quizzesTaken = Number.isFinite(progress.quizzesTaken) ? progress.quizzesTaken : defaultAppState.quizzesTaken;
    appState.completedLessons = Array.isArray(progress.completedLessons) ? progress.completedLessons : defaultAppState.completedLessons;
    appState.completedQuizzes = Array.isArray(progress.completedQuizzes) ? progress.completedQuizzes : defaultAppState.completedQuizzes;

    appState.studyStreak = Number.isFinite(progress.studyStreak) ? progress.studyStreak : defaultAppState.studyStreak;
    appState.lastActiveDate = typeof progress.lastActiveDate === "string" ? progress.lastActiveDate : defaultAppState.lastActiveDate;
    appState.xpHistory = Array.isArray(progress.xpHistory) ? progress.xpHistory : defaultAppState.xpHistory;

    appState.darkMode = typeof preferences.darkMode === "boolean" ? preferences.darkMode : defaultAppState.darkMode;
    appState.sessionLock = typeof preferences.sessionLock === "boolean" ? preferences.sessionLock : defaultAppState.sessionLock;
    appState.loginAlerts = typeof preferences.loginAlerts === "boolean" ? preferences.loginAlerts : defaultAppState.loginAlerts;
    appState.lessonHints = typeof preferences.lessonHints === "boolean" ? preferences.lessonHints : defaultAppState.lessonHints;
  }


  function serializeStateForCloud() {
    return {
      profile: {
        username: appState.user,
        nickname: appState.nickname,
        email: appState.email,
        emailVerified: appState.emailVerified,
        phone: appState.phone,
        phoneVerified: appState.phoneVerified,
        bio: appState.bio,
        avatarChoice: appState.avatarChoice,
        customAvatar: appState.customAvatar
      },
      progress: {
        xp: appState.xp,
        level: appState.level,
        lessonsDone: appState.lessonsDone,
        quizzesTaken: appState.quizzesTaken,
        sprintHighScore: appState.sprintHighScore,
        typingHighScore: appState.typingHighScore,
        studyStreak: appState.studyStreak,
        lastActiveDate: appState.lastActiveDate,
        xpHistory: appState.xpHistory,
        completedLessons: appState.completedLessons,
        completedQuizzes: appState.completedQuizzes
      },
      preferences: {
        darkMode: appState.darkMode,
        sessionLock: appState.sessionLock,
        loginAlerts: appState.loginAlerts,
        lessonHints: appState.lessonHints
      }
    };
  }

  async function persistStateNow() {
    if (!firebaseState.ready || !firebaseState.hydrated || !firebaseState.user || !firebaseState.services?.configured) {
      return;
    }

    const { db, helpers } = firebaseState.services;
    const payload = serializeStateForCloud();
    await helpers.setDoc(
      helpers.doc(db, "users", firebaseState.user.uid),
      {
        ...payload,
        meta: {
          lastSyncedAt: helpers.serverTimestamp()
        }
      },
      { merge: true }
    );
  }

  function queueStateSave() {
    if (!firebaseState.ready || !firebaseState.hydrated || !firebaseState.user || !firebaseState.services?.configured) {
      return;
    }

    window.clearTimeout(firebaseState.saveTimer);
    document.body.dataset.sync = "pending";
    firebaseState.savePending = true;
    firebaseState.saveTimer = window.setTimeout(async () => {
      try {
        await persistStateNow();
        document.body.dataset.sync = "synced";
      } catch (error) {
        document.body.dataset.sync = "error";
        console.error(error);
      } finally {
        firebaseState.savePending = false;
      }
    }, 280);
  }

  function saveState() {
    queueStateSave();
  }

  function saveCurrentAccount() {
    queueStateSave();
  }

  async function hydrateStateForUser(user) {
    resetAppState();
    firebaseState.user = user;
    firebaseState.hydrated = false;
    applyAccountToState({}, user);

    if (!firebaseState.services?.configured) {
      firebaseState.hydrated = true;
      return;
    }

    const { db, helpers } = firebaseState.services;
    const userRef = helpers.doc(db, "users", user.uid);
    try {
      const snapshot = await helpers.getDoc(userRef);

      if (snapshot.exists()) {
        applyCloudState(snapshot.data());
      } else {
        const pendingPhoneProfile = phoneAuthState.pendingProfile;
        applyAccountToState({
          username: user.email || user.phoneNumber || "Learner",
          nickname: pendingPhoneProfile?.nickname || user.displayName || (user.email ? user.email.split("@")[0] : "Learner"),
          email: user.email || "",
          phone: pendingPhoneProfile?.phone || user.phoneNumber || ""
        }, user);
        await helpers.setDoc(userRef, {
          ...serializeStateForCloud(),
          meta: {
            createdAt: helpers.serverTimestamp(),
            lastSyncedAt: helpers.serverTimestamp()
          }
        }, { merge: true });
      }
    } catch (error) {
      console.error("Cloud profile sync fallback:", error);
      applyAccountToState({
        username: user.email || user.phoneNumber || "Learner",
        nickname: phoneAuthState.pendingProfile?.nickname || user.displayName || (user.email ? user.email.split("@")[0] : "Learner"),
        email: user.email || "",
        phone: phoneAuthState.pendingProfile?.phone || user.phoneNumber || ""
      }, user);

      if (isFirestoreOfflineError(error)) {
        const loginStatus = document.getElementById("loginStatus");
        if (loginStatus) {
          loginStatus.textContent = "Logged in, but cloud sync is temporarily unavailable. You can keep using the app and try refreshing later.";
        }
      } else {
        throw error;
      }
    }

    phoneAuthState.pendingProfile = null;
    firebaseState.hydrated = true;
  }

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

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function validateWithChecks(code, checks) {
    for (const [condition, message] of checks) {
      if (!condition(code)) {
        return message;
      }
    }
    return true;
  }

  function getJSLessonData() {
    if (Array.isArray(window.jsLessons) && window.jsLessons.length) {
      return window.jsLessons;
    }

    const jsLessons = [
      {
        id: 101,
        title: "JavaScript Fundamentals",
        difficulty: "Beginner",
        intro: "Learn the core concepts of JavaScript including variables, data types, and basic operations.",
        topics: [
          {
            id: 101,
            title: "Variables and Data Types",
            difficulty: "Beginner",
            xp: 50,
            description: "Store and work with different kinds of data using variables.",
            steps: [
              "Use let or const to declare variables.",
              "Store strings, numbers, and booleans.",
              "Use console.log() to see your values."
            ],
            code: "let name = \"John\";\nlet age = 25;\nlet isStudent = true;\nconsole.log(name);\nconsole.log(age);",
            activityPrompt: "Create variables for name, age, and isStudent. Log them to console.",
            activityStarter: "let name = \"Your Name\";\nlet age = 20;\nlet isStudent = true;\n\nconsole.log(name);\nconsole.log(age);\nconsole.log(isStudent);",
            activityHint: "Use let to create variables and console.log() to display them.",
            validateActivity: (code) => code.includes("let") && code.includes("console.log")
          },
          {
            id: 102,
            title: "Numbers and Math",
            difficulty: "Beginner",
            xp: 50,
            description: "Perform calculations using JavaScript operators.",
            steps: [
              "Use +, -, *, / for basic math.",
              "Use % for remainder.",
              "Combine operations in expressions."
            ],
            code: "let x = 10;\nlet y = 3;\nconsole.log(x + y);\nconsole.log(x * y);\nconsole.log(x % y);",
            activityPrompt: "Create two numbers and show their sum, product, and remainder.",
            activityStarter: "let num1 = 15;\nlet num2 = 4;\n\nconsole.log(num1 + num2);\nconsole.log(num1 * num2);\nconsole.log(num1 % num2);",
            activityHint: "Use arithmetic operators: +, -, *, /, %",
            validateActivity: (code) => code.includes("let") && (code.includes("+") || code.includes("*"))
          },
          {
            id: 103,
            title: "Strings and Text",
            difficulty: "Beginner",
            xp: 55,
            description: "Work with text using string methods and concatenation.",
            steps: [
              "Create strings with quotes.",
              "Use + to combine strings.",
              "Try string methods like .toUpperCase()."
            ],
            code: "let greeting = \"Hello\";\nlet name = \"World\";\nlet message = greeting + \" \" + name;\nconsole.log(message.toUpperCase());",
            activityPrompt: "Create a greeting string and use .toUpperCase().",
            activityStarter: "let greeting = \"hello\";\nconsole.log(greeting.toUpperCase());",
            activityHint: "Strings need quotes and methods use dot notation.",
            validateActivity: (code) => code.includes("\"") && code.includes("toUpperCase")
          }
        ]
      },
      {
        id: 102,
        title: "Functions and Control Flow",
        difficulty: "Beginner",
        intro: "Write functions and use if/else statements to control program logic.",
        topics: [
          {
            id: 104,
            title: "If Statements",
            difficulty: "Beginner",
            xp: 60,
            description: "Make decisions based on conditions using if/else.",
            steps: [
              "Write if (condition) { }",
              "Use else for alternative code.",
              "Use comparison operators like ==, <, >"
            ],
            code: "let age = 18;\nif (age >= 18) {\n  console.log(\"Adult\");\n} else {\n  console.log(\"Minor\");\n}",
            activityPrompt: "Create an if/else statement checking if a number is positive or negative.",
            activityStarter: "let num = 5;\nif (num > 0) {\n  console.log(\"Positive\");\n} else {\n  console.log(\"Negative\");\n}",
            activityHint: "Use if followed by a condition in parentheses and code in braces.",
            validateActivity: (code) => code.includes("if") && code.includes("else")
          },
          {
            id: 105,
            title: "Functions",
            difficulty: "Beginner",
            xp: 65,
            description: "Create reusable code blocks using functions.",
            steps: [
              "Use function keyword to define a function.",
              "Add parameters in parentheses.",
              "Use return to send back a value."
            ],
            code: "function greet(name) {\n  return \"Hello, \" + name + \"!\";\n}\n\nconsole.log(greet(\"Alice\"));",
            activityPrompt: "Create a function that takes a number and returns it doubled.",
            activityStarter: "function double(x) {\n  return x * 2;\n}\n\nconsole.log(double(5));",
            activityHint: "Functions use the function keyword and can have parameters.",
            validateActivity: (code) => code.includes("function") && code.includes("return")
          },
          {
            id: 106,
            title: "Loops",
            difficulty: "Intermediate",
            xp: 70,
            description: "Repeat code using for and while loops.",
            steps: [
              "Use for (let i = 0; i < 5; i++) for a for loop.",
              "Use while (condition) for a while loop.",
              "Update variables in each loop."
            ],
            code: "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
            activityPrompt: "Create a for loop that logs numbers from 1 to 5.",
            activityStarter: "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}",
            activityHint: "For loops need initialization, condition, and increment.",
            validateActivity: (code) => code.includes("for") && code.includes("++")
          }
        ]
      },
      {
        id: 103,
        title: "Arrays and Objects",
        difficulty: "Intermediate",
        intro: "Store multiple values in arrays and organize data with objects.",
        topics: [
          {
            id: 107,
            title: "Arrays",
            difficulty: "Intermediate",
            xp: 70,
            description: "Create and use arrays to store lists of values.",
            steps: [
              "Create arrays with [ ] brackets.",
              "Access items using index numbers starting at 0.",
              "Use .length to find the array size."
            ],
            code: "let fruits = [\"apple\", \"banana\", \"cherry\"];\nconsole.log(fruits[0]);\nconsole.log(fruits.length);",
            activityPrompt: "Create an array with 3 colors and log the first one.",
            activityStarter: "let colors = [\"red\", \"green\", \"blue\"];\nconsole.log(colors[0]);",
            activityHint: "Arrays use square brackets and index numbers start at 0.",
            validateActivity: (code) => code.includes("[") && code.includes("]")
          },
          {
            id: 108,
            title: "Array Methods",
            difficulty: "Intermediate",
            xp: 75,
            description: "Use built-in array methods like push, pop, and map.",
            steps: [
              "Use .push() to add items.",
              "Use .pop() to remove the last item.",
              "Use .forEach() to loop through items."
            ],
            code: "let nums = [1, 2, 3];\nnums.push(4);\nconsole.log(nums);\nnums.forEach(n => console.log(n));",
            activityPrompt: "Create an array and use .push() to add an item.",
            activityStarter: "let items = [\"a\", \"b\"];\nitems.push(\"c\");\nconsole.log(items);",
            activityHint: "Array methods like push() and forEach() are called with dot notation.",
            validateActivity: (code) => code.includes("push") || code.includes("forEach")
          },
          {
            id: 109,
            title: "Objects",
            difficulty: "Intermediate",
            xp: 75,
            description: "Organize related data using objects with key-value pairs.",
            steps: [
              "Create objects using { } braces.",
              "Add key-value pairs separated by colons.",
              "Access properties using dot notation or bracket notation."
            ],
            code: "let person = {\n  name: \"Alice\",\n  age: 25,\n  city: \"NYC\"\n};\nconsole.log(person.name);",
            activityPrompt: "Create a person object with name, age, and email properties.",
            activityStarter: "let person = {\n  name: \"John\",\n  age: 30,\n  email: \"john@example.com\"\n};\nconsole.log(person.name);",
            activityHint: "Objects use curly braces and property:value syntax.",
            validateActivity: (code) => code.includes("{") && code.includes(":")
          }
        ]
      },
      {
        id: 104,
        title: "DOM Manipulation",
        difficulty: "Intermediate",
        intro: "Interact with HTML elements using JavaScript.",
        topics: [
          {
            id: 110,
            title: "Selecting Elements",
            difficulty: "Intermediate",
            xp: 70,
            description: "Find and access HTML elements from JavaScript.",
            steps: [
              "Use getElementById() for elements with an id.",
              "Use querySelector() for CSS selectors.",
              "Store elements in variables for reuse."
            ],
            code: "let heading = document.getElementById(\"title\");\nlet button = document.querySelector(\".btn\");\nconsole.log(heading);",
            activityPrompt: "Use getElementById to select an element with id 'demo'.",
            activityStarter: "let element = document.getElementById(\"demo\");\nconsole.log(element);",
            activityHint: "getElementById takes an id string without the # symbol.",
            validateActivity: (code) => code.includes("document.getElementById") || code.includes("querySelector")
          },
          {
            id: 111,
            title: "Changing Content",
            difficulty: "Intermediate",
            xp: 75,
            description: "Update text and HTML content of elements.",
            steps: [
              "Use .textContent to change text.",
              "Use .innerHTML to change HTML.",
              "Update content after selecting an element."
            ],
            code: "let heading = document.getElementById(\"title\");\nheading.textContent = \"New Title\";",
            activityPrompt: "Change the textContent of an element.",
            activityStarter: "let element = document.getElementById(\"demo\");\nelement.textContent = \"Hello World\";",
            activityHint: "Use .textContent to change text safely.",
            validateActivity: (code) => code.includes("textContent") || code.includes("innerHTML")
          },
          {
            id: 112,
            title: "Event Listeners",
            difficulty: "Intermediate",
            xp: 80,
            description: "Respond to user interactions like clicks and input.",
            steps: [
              "Select an element.",
              "Use .addEventListener() to listen for events.",
              "Provide an event name and callback function."
            ],
            code: "let button = document.getElementById(\"btn\");\nbutton.addEventListener(\"click\", function() {\n  console.log(\"Button clicked!\");\n});",
            activityPrompt: "Add a click event listener to a button.",
            activityStarter: "let button = document.getElementById(\"btn\");\nbutton.addEventListener(\"click\", function() {\n  console.log(\"Clicked!\");\n});",
            activityHint: "addEventListener takes an event name and a function.",
            validateActivity: (code) => code.includes("addEventListener") && code.includes("click")
          }
        ]
      },
      {
        id: 105,
        title: "Arrow Functions and Modern Syntax",
        difficulty: "Intermediate",
        intro: "Write cleaner functions using arrow syntax and modern JavaScript features.",
        topics: [
          {
            id: 113,
            title: "Arrow Functions",
            difficulty: "Intermediate",
            xp: 70,
            description: "Use arrow functions for shorter, cleaner code.",
            steps: [
              "Use => instead of function keyword.",
              "Arrow functions have implicit returns for single expressions.",
              "Use parentheses for multiple parameters."
            ],
            code: "const add = (a, b) => a + b;\nconsole.log(add(5, 3));\n\nconst greet = name => `Hello, ${name}`;\nconsole.log(greet(\"Alice\"));",
            activityPrompt: "Create an arrow function that multiplies two numbers.",
            activityStarter: "const multiply = (a, b) => a * b;\nconsole.log(multiply(4, 5));",
            activityHint: "Arrow functions use => and can be stored in variables.",
            validateActivity: (code) => code.includes("=>")
          },
          {
            id: 114,
            title: "Template Literals",
            difficulty: "Intermediate",
            xp: 65,
            description: "Create strings with embedded expressions using backticks.",
            steps: [
              "Use backticks (`) instead of quotes.",
              "Use ${expression} to embed variables.",
              "Template literals support multi-line strings."
            ],
            code: "let name = \"Alice\";\nlet age = 25;\nlet message = `${name} is ${age} years old`;\nconsole.log(message);",
            activityPrompt: "Create a template literal with embedded variables.",
            activityStarter: "let product = \"Laptop\";\nlet price = 999;\nconsole.log(`The ${product} costs $${price}`);",
            activityHint: "Template literals use backticks and ${} for variables.",
            validateActivity: (code) => code.includes("`") && code.includes("${")
          },
          {
            id: 115,
            title: "Destructuring",
            difficulty: "Intermediate",
            xp: 75,
            description: "Extract values from arrays and objects with destructuring.",
            steps: [
              "Use [a, b] to destructure arrays.",
              "Use {key} to destructure objects.",
              "Assign to new variable names with colon."
            ],
            code: "let [a, b] = [1, 2];\nconsole.log(a, b);\n\nlet {name, age} = {name: \"John\", age: 30};\nconsole.log(name);",
            activityPrompt: "Destructure an array and log its values.",
            activityStarter: "let [x, y, z] = [10, 20, 30];\nconsole.log(x, y, z);",
            activityHint: "Destructuring uses square brackets for arrays and curly braces for objects.",
            validateActivity: (code) => code.includes("[") && code.includes("]") && code.includes("=")
          }
        ]
      },
      {
        id: 106,
        title: "Error Handling and Debugging",
        difficulty: "Intermediate",
        intro: "Handle errors gracefully and debug your JavaScript code.",
        topics: [
          {
            id: 116,
            title: "Try and Catch",
            difficulty: "Intermediate",
            xp: 75,
            description: "Handle errors using try/catch blocks.",
            steps: [
              "Wrap risky code in try block.",
              "Catch errors with catch block.",
              "Use the error object to get details."
            ],
            code: "try {\n  let result = riskyFunction();\n  console.log(result);\n} catch (error) {\n  console.log(\"Error:\", error.message);\n}",
            activityPrompt: "Create a try/catch block.",
            activityStarter: "try {\n  console.log(undefinedVariable);\n} catch (error) {\n  console.log(\"Caught error:\", error.message);\n}",
            activityHint: "Try/catch blocks handle errors without crashing.",
            validateActivity: (code) => code.includes("try") && code.includes("catch")
          },
          {
            id: 117,
            title: "Console Methods",
            difficulty: "Intermediate",
            xp: 70,
            description: "Use various console methods for debugging.",
            steps: [
              "Use console.log() for general output.",
              "Use console.warn() for warnings.",
              "Use console.error() for errors.",
              "Use console.table() to display data as a table."
            ],
            code: "console.log(\"Normal message\");\nconsole.warn(\"Warning message\");\nconsole.error(\"Error message\");\nconsole.table([{name: \"Alice\", age: 25}]);",
            activityPrompt: "Use different console methods to output messages.",
            activityStarter: "console.log(\"This is a log\");\nconsole.warn(\"This is a warning\");\nconsole.error(\"This is an error\");",
            activityHint: "Console has different methods for different message types.",
            validateActivity: (code) => code.includes("console.log") && (code.includes("console.warn") || code.includes("console.error"))
          },
          {
            id: 118,
            title: "Throwing Errors",
            difficulty: "Intermediate",
            xp: 75,
            description: "Create and throw custom errors.",
            steps: [
              "Use throw new Error() to create errors.",
              "Provide a meaningful error message.",
              "Catch thrown errors in try/catch."
            ],
            code: "function divide(a, b) {\n  if (b === 0) throw new Error(\"Cannot divide by zero\");\n  return a / b;\n}\n\ntry {\n  console.log(divide(10, 0));\n} catch (error) {\n  console.log(error.message);\n}",
            activityPrompt: "Create a function that throws an error.",
            activityStarter: "function validate(age) {\n  if (age < 0) throw new Error(\"Age cannot be negative\");\n  return age;\n}\n\ntry {\n  validate(-5);\n} catch (error) {\n  console.log(error.message);\n}",
            activityHint: "Use throw new Error() with a descriptive message.",
            validateActivity: (code) => code.includes("throw") && code.includes("Error")
          }
        ]
      },
      {
        id: 107,
        title: "Promises and Async Programming",
        difficulty: "Advanced",
        intro: "Handle asynchronous operations using Promises and async/await.",
        topics: [
          {
            id: 119,
            title: "Understanding Promises",
            difficulty: "Advanced",
            xp: 80,
            description: "Learn how Promises work for handling async operations.",
            steps: [
              "Create a Promise with new Promise((resolve, reject) => {}).",
              "Use .then() to handle successful results.",
              "Use .catch() to handle errors."
            ],
            code: "const myPromise = new Promise((resolve, reject) => {\n  setTimeout(() => resolve(\"Done!\"), 1000);\n});\n\nmyPromise.then(result => console.log(result));",
            activityPrompt: "Create a Promise that resolves after 1 second.",
            activityStarter: "const myPromise = new Promise((resolve) => {\n  setTimeout(() => resolve(\"Success!\"), 1000);\n});\nmyPromise.then(result => console.log(result));",
            activityHint: "Promises take a function with resolve and reject parameters.",
            validateActivity: (code) => code.includes("Promise") && code.includes("resolve")
          },
          {
            id: 120,
            title: "Async and Await",
            difficulty: "Advanced",
            xp: 85,
            description: "Use async/await for cleaner asynchronous code.",
            steps: [
              "Mark functions as async.",
              "Use await before Promise calls.",
              "Wrap in try/catch for error handling."
            ],
            code: "async function getData() {\n  try {\n    const response = await fetch('/api/data');\n    const data = await response.json();\n    console.log(data);\n  } catch (error) {\n    console.log(error);\n  }\n}",
            activityPrompt: "Create an async function with await.",
            activityStarter: "async function greet() {\n  const result = await new Promise(resolve => {\n    setTimeout(() => resolve(\"Hello!\"), 1000);\n  });\n  console.log(result);\n}\n\ngreet();",
            activityHint: "Async functions let you use await with Promises.",
            validateActivity: (code) => code.includes("async") && code.includes("await")
          },
          {
            id: 121,
            title: "Fetch API",
            difficulty: "Advanced",
            xp: 80,
            description: "Fetch data from servers using the Fetch API.",
            steps: [
              "Use fetch(url) to request data.",
              "Convert response to JSON with .json().",
              "Handle errors with .catch()."
            ],
            code: "fetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.log(error));",
            activityPrompt: "Use fetch to get data from an API.",
            activityStarter: "fetch('https://jsonplaceholder.typicode.com/users/1')\n  .then(response => response.json())\n  .then(data => console.log(data));",
            activityHint: "fetch returns a Promise with a response object.",
            validateActivity: (code) => code.includes("fetch") && code.includes(".then")
          }
        ]
      },
      {
        id: 108,
        title: "Advanced Data Structures",
        difficulty: "Advanced",
        intro: "Work with Sets, Maps, and other advanced JavaScript data structures.",
        topics: [
          {
            id: 122,
            title: "Sets",
            difficulty: "Advanced",
            xp: 75,
            description: "Use Sets to store unique values.",
            steps: [
              "Create Sets with new Set().",
              "Add items with .add().",
              "Check size with .size property.",
              "Remove duplicates automatically."
            ],
            code: "let mySet = new Set([1, 2, 2, 3]);\nconsole.log(mySet);\nconsole.log(mySet.size);\nmySet.add(4);\nconsole.log(mySet);",
            activityPrompt: "Create a Set and add values to it.",
            activityStarter: "let colors = new Set();\ncolors.add(\"red\");\ncolors.add(\"blue\");\ncolors.add(\"red\");\nconsole.log(colors.size);",
            activityHint: "Sets automatically remove duplicate values.",
            validateActivity: (code) => code.includes("new Set") && code.includes(".add")
          },
          {
            id: 123,
            title: "Maps",
            difficulty: "Advanced",
            xp: 80,
            description: "Use Maps to store key-value pairs with any key type.",
            steps: [
              "Create Maps with new Map().",
              "Set values with .set(key, value).",
              "Get values with .get(key).",
              "Check existence with .has(key)."
            ],
            code: "let myMap = new Map();\nmyMap.set(\"name\", \"Alice\");\nmyMap.set(\"age\", 25);\nconsole.log(myMap.get(\"name\"));\nconsole.log(myMap.has(\"email\"));",
            activityPrompt: "Create a Map and set key-value pairs.",
            activityStarter: "let userMap = new Map();\nuserMap.set(\"username\", \"john\");\nuserMap.set(\"email\", \"john@example.com\");\nconsole.log(userMap.get(\"username\"));",
            activityHint: "Maps use .set() and .get() methods.",
            validateActivity: (code) => code.includes("new Map") && code.includes(".set")
          },
          {
            id: 124,
            title: "WeakMap and WeakSet",
            difficulty: "Advanced",
            xp: 85,
            description: "Use WeakMap and WeakSet for memory-efficient collections.",
            steps: [
              "WeakMaps hold only objects as keys.",
              "WeakSets hold only objects as values.",
              "Garbage collection automatically removes unused references.",
              "Use for private data storage."
            ],
            code: "const wm = new WeakMap();\nconst obj = {};\nwm.set(obj, \"private data\");\nconsole.log(wm.get(obj));",
            activityPrompt: "Create a WeakMap and store data.",
            activityStarter: "const weakMap = new WeakMap();\nconst key = {};\nweakMap.set(key, \"value\");\nconsole.log(weakMap.get(key));",
            activityHint: "WeakMaps and WeakSets only accept objects.",
            validateActivity: (code) => code.includes("WeakMap") || code.includes("WeakSet")
          }
        ]
      },
      {
        id: 109,
        title: "Regular Expressions and String Patterns",
        difficulty: "Advanced",
        intro: "Use Regular Expressions to find patterns and manipulate strings.",
        topics: [
          {
            id: 125,
            title: "Regex Basics",
            difficulty: "Advanced",
            xp: 80,
            description: "Learn the basics of Regular Expression patterns.",
            steps: [
              "Create regex with /pattern/ or new RegExp().",
              "Use .test() to check if pattern matches.",
              "Use .match() to find matches in strings."
            ],
            code: "let regex = /hello/i;\nconsole.log(regex.test(\"Hello World\"));\nconsole.log(\"Hello World\".match(/hello/i));",
            activityPrompt: "Create a regex pattern and test it.",
            activityStarter: "let pattern = /javascript/i;\nconsole.log(pattern.test(\"I love JavaScript\"));",
            activityHint: "Regex patterns go between forward slashes /pattern/.",
            validateActivity: (code) => code.includes("/") && (code.includes(".test") || code.includes(".match"))
          },
          {
            id: 126,
            title: "Pattern Matching",
            difficulty: "Advanced",
            xp: 85,
            description: "Use character classes and quantifiers in patterns.",
            steps: [
              "[a-z] matches lowercase letters.",
              "[0-9] matches digits.",
              "* means 0 or more, + means 1 or more.",
              "? makes a pattern optional."
            ],
            code: "let email = /[a-z0-9]+@[a-z]+\\.[a-z]+/;\nconsole.log(email.test(\"user@example.com\"));\nconsole.log(email.test(\"invalid.email\"));",
            activityPrompt: "Create a regex pattern for email validation.",
            activityStarter: "let emailPattern = /[a-z]+@[a-z]+\\.[a-z]+/;\nconsole.log(emailPattern.test(\"test@email.com\"));",
            activityHint: "Use character classes like [a-z] and quantifiers like +.",
            validateActivity: (code) => code.includes("[") && (code.includes("+") || code.includes("*"))
          },
          {
            id: 127,
            title: "String Methods with Regex",
            difficulty: "Advanced",
            xp: 80,
            description: "Use regex with string methods like replace and split.",
            steps: [
              ".replace() replaces pattern matches.",
              ".split() splits string on pattern.",
              ".search() finds index of first match.",
              "Use global flag g for all matches."
            ],
            code: "let text = \"apple apple banana\";\nconsole.log(text.replace(/apple/g, \"orange\"));\nconsole.log(text.split(/ /));",
            activityPrompt: "Use regex to replace text in a string.",
            activityStarter: "let sentence = \"hello world\";\nconsole.log(sentence.replace(/hello/, \"hi\"));",
            activityHint: "The g flag replaces all matches, not just the first.",
            validateActivity: (code) => code.includes(".replace") || code.includes(".split")
          }
        ]
      },
      {
        id: 110,
        title: "Classes and Object-Oriented Programming",
        difficulty: "Advanced",
        intro: "Write object-oriented code using JavaScript classes.",
        topics: [
          {
            id: 128,
            title: "Class Basics",
            difficulty: "Advanced",
            xp: 80,
            description: "Create and instantiate classes.",
            steps: [
              "Use class keyword to define a class.",
              "Use constructor() for initialization.",
              "Use new to create instances.",
              "Add methods directly to the class."
            ],
            code: "class Person {\n  constructor(name, age) {\n    this.name = name;\n    this.age = age;\n  }\n  greet() {\n    return `Hello, I'm ${this.name}`;\n  }\n}\n\nlet alice = new Person(\"Alice\", 25);\nconsole.log(alice.greet());",
            activityPrompt: "Create a class with a constructor and method.",
            activityStarter: "class Car {\n  constructor(brand) {\n    this.brand = brand;\n  }\n  start() {\n    return `${this.brand} is starting`;\n  }\n}\n\nlet car = new Car(\"Toyota\");\nconsole.log(car.start());",
            activityHint: "Classes use constructor() and methods use regular function syntax.",
            validateActivity: (code) => code.includes("class") && code.includes("constructor")
          },
          {
            id: 129,
            title: "Inheritance",
            difficulty: "Advanced",
            xp: 85,
            description: "Create class hierarchies using extends and super.",
            steps: [
              "Use extends to inherit from another class.",
              "Use super() to call parent constructor.",
              "Override parent methods in child class."
            ],
            code: "class Animal {\n  constructor(name) { this.name = name; }\n  speak() { return `${this.name} makes a sound`; }\n}\n\nclass Dog extends Animal {\n  speak() { return `${this.name} barks`; }\n}\n\nlet dog = new Dog(\"Rex\");\nconsole.log(dog.speak());",
            activityPrompt: "Create a child class that extends a parent class.",
            activityStarter: "class Vehicle {\n  constructor(type) { this.type = type; }\n}\n\nclass Bike extends Vehicle {\n  constructor(type, wheels) {\n    super(type);\n    this.wheels = wheels;\n  }\n}\n\nlet bike = new Bike(\"bicycle\", 2);",
            activityHint: "Use extends to inherit and super() to call parent methods.",
            validateActivity: (code) => code.includes("extends") && code.includes("super")
          },
          {
            id: 130,
            title: "Static Methods",
            difficulty: "Advanced",
            xp: 75,
            description: "Use static methods that belong to the class, not instances.",
            steps: [
              "Use static keyword before method name.",
              "Static methods are called on the class, not instances.",
              "Useful for utility functions."
            ],
            code: "class Math {\n  static add(a, b) { return a + b; }\n  static multiply(a, b) { return a * b; }\n}\n\nconsole.log(Math.add(5, 3));\nconsole.log(Math.multiply(4, 2));",
            activityPrompt: "Create a class with static methods.",
            activityStarter: "class Utils {\n  static capitalize(str) {\n    return str.charAt(0).toUpperCase() + str.slice(1);\n  }\n}\n\nconsole.log(Utils.capitalize(\"hello\"));",
            activityHint: "Static methods are called on the class name, not instances.",
            validateActivity: (code) => code.includes("static")
          }
        ]
      },
      {
        id: 111,
        title: "Storage and Local Data",
        difficulty: "Intermediate",
        intro: "Store data in the browser using localStorage and sessionStorage.",
        topics: [
          {
            id: 131,
            title: "LocalStorage",
            difficulty: "Intermediate",
            xp: 70,
            description: "Persist data using localStorage.",
            steps: [
              "Use localStorage.setItem(key, value) to save.",
              "Use localStorage.getItem(key) to retrieve.",
              "Use localStorage.removeItem(key) to delete.",
              "Data persists after browser closes."
            ],
            code: "localStorage.setItem(\"name\", \"Alice\");\nconsole.log(localStorage.getItem(\"name\"));\nlocalStorage.removeItem(\"name\");",
            activityPrompt: "Save and retrieve data from localStorage.",
            activityStarter: "localStorage.setItem(\"username\", \"john\");\nconsole.log(localStorage.getItem(\"username\"));",
            activityHint: "localStorage persists data across browser sessions.",
            validateActivity: (code) => code.includes("localStorage.setItem") && code.includes("localStorage.getItem")
          },
          {
            id: 132,
            title: "SessionStorage",
            difficulty: "Intermediate",
            xp: 70,
            description: "Use sessionStorage for temporary session data.",
            steps: [
              "Similar to localStorage but only for current session.",
              "Data is cleared when tab/browser is closed.",
              "Useful for temporary app state."
            ],
            code: "sessionStorage.setItem(\"temp\", \"value\");\nconsole.log(sessionStorage.getItem(\"temp\"));\nsessionStorage.clear();",
            activityPrompt: "Use sessionStorage to store temporary data.",
            activityStarter: "sessionStorage.setItem(\"tempId\", \"12345\");\nconsole.log(sessionStorage.getItem(\"tempId\"));",
            activityHint: "SessionStorage is cleared when the session ends.",
            validateActivity: (code) => code.includes("sessionStorage")
          },
          {
            id: 133,
            title: "JSON Serialization",
            difficulty: "Intermediate",
            xp: 75,
            description: "Convert objects to JSON for storage.",
            steps: [
              "Use JSON.stringify() to convert objects to strings.",
              "Use JSON.parse() to convert strings back to objects.",
              "Needed for storing complex data types."
            ],
            code: "let user = {name: \"Alice\", age: 25};\nlet jsonString = JSON.stringify(user);\nlocalStorage.setItem(\"user\", jsonString);\n\nlet stored = JSON.parse(localStorage.getItem(\"user\"));\nconsole.log(stored.name);",
            activityPrompt: "Store an object in localStorage using JSON.",
            activityStarter: "let data = {id: 1, title: \"Task\"};\nlocalStorage.setItem(\"data\", JSON.stringify(data));\nlet retrieved = JSON.parse(localStorage.getItem(\"data\"));\nconsole.log(retrieved.title);",
            activityHint: "Use JSON.stringify() to save and JSON.parse() to load.",
            validateActivity: (code) => code.includes("JSON.stringify") && code.includes("JSON.parse")
          }
        ]
      },
      {
        id: 112,
        title: "Advanced Array Methods",
        difficulty: "Advanced",
        intro: "Master powerful array methods like map, filter, reduce, and more.",
        topics: [
          {
            id: 134,
            title: "Map and Filter",
            difficulty: "Advanced",
            xp: 75,
            description: "Transform and filter arrays functionally.",
            steps: [
              ".map() transforms each element.",
              ".filter() keeps elements matching a condition.",
              "Both return new arrays without modifying original."
            ],
            code: "let nums = [1, 2, 3, 4, 5];\nlet doubled = nums.map(n => n * 2);\nconsole.log(doubled);\n\nlet evens = nums.filter(n => n % 2 === 0);\nconsole.log(evens);",
            activityPrompt: "Use map() to transform array elements.",
            activityStarter: "let numbers = [1, 2, 3];\nlet squared = numbers.map(n => n * n);\nconsole.log(squared);",
            activityHint: "map() creates a new array with transformed values.",
            validateActivity: (code) => code.includes(".map") || code.includes(".filter")
          },
          {
            id: 135,
            title: "Reduce",
            difficulty: "Advanced",
            xp: 80,
            description: "Reduce arrays to a single value using reduce().",
            steps: [
              ".reduce() takes a callback with accumulator.",
              "Accumulator carries value through each iteration.",
              "Returns a single final value."
            ],
            code: "let nums = [1, 2, 3, 4, 5];\nlet sum = nums.reduce((acc, n) => acc + n, 0);\nconsole.log(sum);\n\nlet product = nums.reduce((acc, n) => acc * n, 1);\nconsole.log(product);",
            activityPrompt: "Use reduce() to sum all numbers in an array.",
            activityStarter: "let values = [10, 20, 30];\nlet total = values.reduce((sum, val) => sum + val, 0);\nconsole.log(total);",
            activityHint: "reduce() takes initial value as second parameter.",
            validateActivity: (code) => code.includes(".reduce")
          },
          {
            id: 136,
            title: "Find and FindIndex",
            difficulty: "Advanced",
            xp: 75,
            description: "Search arrays with find() and findIndex().",
            steps: [
              ".find() returns first element matching condition.",
              ".findIndex() returns index of first match.",
              ".some() checks if any element matches.",
              ".every() checks if all elements match."
            ],
            code: "let users = [{id: 1, name: \"Alice\"}, {id: 2, name: \"Bob\"}];\nlet user = users.find(u => u.id === 1);\nconsole.log(user);\n\nlet index = users.findIndex(u => u.id === 1);\nconsole.log(index);",
            activityPrompt: "Use find() to search in an array of objects.",
            activityStarter: "let items = [{id: 1, name: \"a\"}, {id: 2, name: \"b\"}];\nlet item = items.find(i => i.id === 2);\nconsole.log(item.name);",
            activityHint: "find() returns the element, findIndex() returns the index.",
            validateActivity: (code) => code.includes(".find") || code.includes(".findIndex")
          }
        ]
      },
      {
        id: 113,
        title: "Timing and Events",
        difficulty: "Intermediate",
        intro: "Use timers and understand event handling in JavaScript.",
        topics: [
          {
            id: 137,
            title: "setTimeout and setInterval",
            difficulty: "Intermediate",
            xp: 70,
            description: "Execute code after a delay or repeatedly.",
            steps: [
              "setTimeout() runs code once after delay.",
              "setInterval() runs code repeatedly at intervals.",
              "Use clearTimeout() and clearInterval() to stop."
            ],
            code: "setTimeout(() => console.log(\"After 1 second\"), 1000);\n\nlet count = 0;\nlet interval = setInterval(() => {\n  console.log(count++);\n  if (count > 3) clearInterval(interval);\n}, 1000);",
            activityPrompt: "Use setTimeout to run code after 2 seconds.",
            activityStarter: "setTimeout(() => console.log(\"Hello!\"), 2000);",
            activityHint: "setTimeout takes a callback and delay in milliseconds.",
            validateActivity: (code) => code.includes("setTimeout") || code.includes("setInterval")
          },
          {
            id: 138,
            title: "Keyboard Events",
            difficulty: "Intermediate",
            xp: 75,
            description: "Respond to keyboard input.",
            steps: [
              "keydown fires when key is pressed.",
              "keyup fires when key is released.",
              "Use event.key to get the pressed key.",
              "Use event.code for physical location."
            ],
            code: "document.addEventListener(\"keydown\", (event) => {\n  console.log(\"Key pressed:\", event.key);\n});\n\ndocument.addEventListener(\"keyup\", (event) => {\n  console.log(\"Key released:\", event.key);\n});",
            activityPrompt: "Add a keydown event listener.",
            activityStarter: "document.addEventListener(\"keydown\", (e) => {\n  console.log(\"You pressed:\", e.key);\n});",
            activityHint: "keydown fires when key is pressed, keyup when released.",
            validateActivity: (code) => code.includes("keydown") || code.includes("keyup") && code.includes("addEventListener")
          },
          {
            id: 139,
            title: "Mouse Events",
            difficulty: "Intermediate",
            xp: 75,
            description: "Handle mouse interactions.",
            steps: [
              "click fires on mouse click.",
              "mouseover fires when mouse enters.",
              "mouseout fires when mouse leaves.",
              "mousemove fires as mouse moves."
            ],
            code: "let btn = document.getElementById(\"btn\");\nbtn.addEventListener(\"click\", () => console.log(\"Clicked\"));\nbtn.addEventListener(\"mouseover\", () => console.log(\"Hovered\"));\nbtn.addEventListener(\"mouseout\", () => console.log(\"Left\"));",
            activityPrompt: "Add mouse event listeners to an element.",
            activityStarter: "let element = document.getElementById(\"demo\");\nelement.addEventListener(\"click\", () => console.log(\"Clicked!\"));\nelement.addEventListener(\"mouseover\", () => console.log(\"Hovering\"));",
            activityHint: "Use addEventListener to attach mouse event handlers.",
            validateActivity: (code) => (code.includes("click") || code.includes("mouseover")) && code.includes("addEventListener")
          }
        ]
      },
      {
        id: 114,
        title: "Closures and Scope",
        difficulty: "Advanced",
        intro: "Understand JavaScript scope and closures.",
        topics: [
          {
            id: 140,
            title: "Function Scope",
            difficulty: "Advanced",
            xp: 75,
            description: "Understand variable scope in functions.",
            steps: [
              "Global scope: accessible everywhere.",
              "Function scope: accessible inside function only.",
              "Block scope: accessible inside block only (let/const).",
              "Inner functions can access outer variables."
            ],
            code: "let global = \"Global\";\n\nfunction outer() {\n  let local = \"Local\";\n  console.log(global);\n  console.log(local);\n  \n  function inner() {\n    console.log(local);\n  }\n  inner();\n}\n\nouter();",
            activityPrompt: "Create nested functions to demonstrate scope.",
            activityStarter: "let x = 10;\nfunction outer() {\n  let y = 20;\n  function inner() {\n    console.log(x + y);\n  }\n  inner();\n}\nouter();",
            activityHint: "Inner functions can access outer function variables.",
            validateActivity: (code) => code.includes("function") && code.includes("let")
          },
          {
            id: 141,
            title: "Closures",
            difficulty: "Advanced",
            xp: 85,
            description: "Use closures to create private data.",
            steps: [
              "Closures are functions that access outer scope.",
              "Returned functions remember outer variables.",
              "Useful for data privacy and factories."
            ],
            code: "function counter() {\n  let count = 0;\n  return {\n    increment: () => ++count,\n    decrement: () => --count,\n    get: () => count\n  };\n}\n\nlet c = counter();\nconsole.log(c.increment());\nconsole.log(c.increment());\nconsole.log(c.get());",
            activityPrompt: "Create a counter function using closures.",
            activityStarter: "function makeCounter() {\n  let n = 0;\n  return () => ++n;\n}\nlet counter = makeCounter();\nconsole.log(counter());\nconsole.log(counter());",
            activityHint: "Closures capture variables from outer functions.",
            validateActivity: (code) => code.includes("return") && code.includes("function")
          },
          {
            id: 142,
            title: "Let vs Const vs Var",
            difficulty: "Advanced",
            xp: 70,
            description: "Understand differences between variable declarations.",
            steps: [
              "var: function-scoped, can be redeclared.",
              "let: block-scoped, can be reassigned.",
              "const: block-scoped, cannot be reassigned.",
              "Use const by default, let when needed."
            ],
            code: "// var\nvar x = 1;\nvar x = 2; // OK\n\n// let\nlet y = 1;\ny = 2; // OK\n// let y = 3; // Error\n\n// const\nconst z = 1;\n// z = 2; // Error\n// const z = 3; // Error",
            activityPrompt: "Demonstrate const, let, and var behavior.",
            activityStarter: "const name = \"Alice\";\nlet age = 25;\nvar status = \"active\";\n\nconsole.log(name, age, status);",
            activityHint: "const prevents reassignment, let allows it.",
            validateActivity: (code) => code.includes("const") || code.includes("let")
          }
        ]
      },
      {
        id: 115,
        title: "The DOM in Depth",
        difficulty: "Intermediate",
        intro: "Explore advanced DOM manipulation — traversing, creating, cloning, and removing elements dynamically.",
        topics: [
          {
            id: 143,
            title: "Create & Append Elements",
            difficulty: "Intermediate",
            xp: 60,
            description: "Create new DOM nodes with document.createElement and attach them with appendChild.",
            steps: [
              "Use document.createElement to make any HTML element.",
              "Set attributes and content on the new element.",
              "Attach it to the DOM with appendChild or insertBefore."
            ],
            code: "const div = document.createElement('div');\ndiv.textContent = 'Hello';\ndocument.body.appendChild(div);",
            activityPrompt: "Create a paragraph element and append it to the body.",
            activityStarter: "const p = document.createElement('p');\np.textContent = 'Hi there!';\n\n// Your code here",
            activityHint: "Use document.body.appendChild(p) to add it.",
            validateActivity: (code) => code.includes("appendChild")
          },
          {
            id: 144,
            title: "Traversal & Cloning",
            difficulty: "Intermediate",
            xp: 60,
            description: "Navigate the DOM tree using parentNode, children, nextSibling, and clone nodes with cloneNode.",
            steps: [
              "Use parentNode and children to traverse up/down the tree.",
              "Use nextSibling and previousSibling to move sideways.",
              "Clone elements with cloneNode(true) for deep copies."
            ],
            code: "const parent = document.querySelector('.list');\nconst first = parent.children[0];\nconst clone = first.cloneNode(true);\nparent.appendChild(clone);",
            activityPrompt: "Select the first child of #container and clone it.",
            activityStarter: "const container = document.querySelector('#container');\nconst first = container.children[0];\n// Your code here",
            activityHint: "Call first.cloneNode(true) then container.appendChild().",
            validateActivity: (code) => code.includes("cloneNode")
          },
          {
            id: 145,
            title: "Removing Elements",
            difficulty: "Intermediate",
            xp: 60,
            description: "Remove DOM elements cleanly using removeChild or the modern remove() method.",
            steps: [
              "Target an element with querySelector or getElementById.",
              "Call element.remove() to delete it directly.",
              "Or use parent.removeChild(child) for older browser support."
            ],
            code: "const el = document.querySelector('.old-item');\nel.remove();",
            activityPrompt: "Remove the element with class 'obsolete' from the page.",
            activityStarter: "const obsolete = document.querySelector('.obsolete');\n// Your code here",
            activityHint: "Call obsolete.remove() to delete it.",
            validateActivity: (code) => code.includes(".remove(")
          }
        ]
      },
      {
        id: 116,
        title: "Generators & Iterators",
        difficulty: "Advanced",
        intro: "Master generator functions, the yield keyword, and custom iterables for lazy evaluation.",
        topics: [
          {
            id: 146,
            title: "Generator Functions",
            difficulty: "Advanced",
            xp: 85,
            description: "Generator functions can pause execution with yield and resume later, producing sequences on demand.",
            steps: [
              "Declare a generator with function* syntax.",
              "Use yield to produce values one at a time.",
              "Call .next() on the generator object to iterate."
            ],
            code: "function* countUp() {\n  let i = 0;\n  while (i < 3) yield i++;\n}\nconst gen = countUp();\nconsole.log(gen.next().value); // 0",
            activityPrompt: "Write a generator that yields 'a', 'b', 'c'.",
            activityStarter: "function* letters() {\n  // Your code here\n}\n\nconst gen = letters();\nconsole.log(gen.next().value);",
            activityHint: "Use yield 'a'; yield 'b'; yield 'c';",
            validateActivity: (code) => code.includes("yield ")
          },
          {
            id: 147,
            title: "Custom Iterables",
            difficulty: "Advanced",
            xp: 85,
            description: "Make any object iterable by implementing the Symbol.iterator protocol.",
            steps: [
              "Define a [Symbol.iterator] method on an object.",
              "Return an object with a next() method.",
              "The next() method must return { value, done } objects."
            ],
            code: "const range = {\n  from: 1, to: 3,\n  [Symbol.iterator]() {\n    let i = this.from;\n    return { next: () => ({ value: i++, done: i > this.to + 1 }) };\n  }\n};\nconsole.log([...range]); // [1, 2, 3]",
            activityPrompt: "Create an iterable that counts from 1 to 5.",
            activityStarter: "const counter = {\n  from: 1, to: 5,\n  // Your code here\n};\nconsole.log([...counter]);",
            activityHint: "Implement [Symbol.iterator] returning { next }.",
            validateActivity: (code) => code.includes("Symbol.iterator")
          },
          {
            id: 148,
            title: "Yield Delegation",
            difficulty: "Advanced",
            xp: 85,
            description: "Delegate generator execution to another generator using yield*.",
            steps: [
              "Use yield* inside a generator to delegate to another iterable.",
              "All values from the delegated generator are yielded in order.",
              "This composes generator logic without nesting."
            ],
            code: "function* a() { yield 1; yield 2; }\nfunction* b() { yield* a(); yield 3; }\nconsole.log([...b()]); // [1, 2, 3]",
            activityPrompt: "Use yield* to combine two generators.",
            activityStarter: "function* first() { yield 'x'; yield 'y'; }\nfunction* combined() {\n  // Your code here\n}\nconsole.log([...combined()]);",
            activityHint: "Add yield* first(); then yield 'z';",
            validateActivity: (code) => code.includes("yield*")
          }
        ]
      },
      {
        id: 117,
        title: "Web APIs",
        difficulty: "Intermediate",
        intro: "Work with browser APIs — localStorage, geolocation, fetch, and notifications — to build richer web apps.",
        topics: [
          {
            id: 149,
            title: "localStorage API",
            difficulty: "Intermediate",
            xp: 70,
            description: "Store key-value data persistently in the browser using localStorage.",
            steps: [
              "Use localStorage.setItem(key, value) to store strings.",
              "Use localStorage.getItem(key) to retrieve them.",
              "Values are always strings — use JSON.stringify/parse for objects."
            ],
            code: "localStorage.setItem('theme', 'dark');\nconst theme = localStorage.getItem('theme');\nconsole.log(theme); // 'dark'",
            activityPrompt: "Save a user object to localStorage as JSON.",
            activityStarter: "const user = { name: 'Alice', score: 100 };\n// Your code here",
            activityHint: "Use localStorage.setItem('user', JSON.stringify(user)).",
            validateActivity: (code) => code.includes("setItem") && code.includes("JSON.stringify")
          },
          {
            id: 150,
            title: "Geolocation API",
            difficulty: "Intermediate",
            xp: 70,
            description: "Access the user's geographic location with the navigator.geolocation API.",
            steps: [
              "Call navigator.geolocation.getCurrentPosition(success, error).",
              "The success callback receives a position object with coords.",
              "Always handle errors — users can deny permission."
            ],
            code: "navigator.geolocation.getCurrentPosition(\n  (pos) => console.log(pos.coords.latitude),\n  (err) => console.error(err.message)\n);",
            activityPrompt: "Request the user's current position and log the latitude.",
            activityStarter: "navigator.geolocation.getCurrentPosition(\n  // Your code here\n);",
            activityHint: "Use (pos) => console.log(pos.coords.latitude) as the success callback.",
            validateActivity: (code) => code.includes("getCurrentPosition")
          },
          {
            id: 151,
            title: "Fetch API",
            difficulty: "Intermediate",
            xp: 70,
            description: "Make HTTP requests with the modern fetch() API and handle responses with promises.",
            steps: [
              "Call fetch(url) to make a GET request.",
              "The response object has .ok, .status, and .json() methods.",
              "Chain .then() or use await to process the result."
            ],
            code: "fetch('https://api.example.com/data')\n  .then(res => res.json())\n  .then(data => console.log(data));",
            activityPrompt: "Make a fetch call and log the JSON response.",
            activityStarter: "fetch('https://jsonplaceholder.typicode.com/todos/1')\n  // Your code here",
            activityHint: "Chain .then(res => res.json()).then(data => console.log(data)).",
            validateActivity: (code) => code.includes("fetch(") && code.includes(".json(")
          }
        ]
      }
    ];
    window.jsLessons = jsLessons;

    return jsLessons;
  }

  function getLessonData() {
    if (Array.isArray(window.htmlLessons) && window.htmlLessons.length) {
      return window.htmlLessons;
    }

    // HTML lessons are used to render the Lessons (HTML Lesson / JS Lesson) grids.
    // They also drive the HTML quiz generation via getHTMLQuizData().
    // Ensure we always have meaningful HTML lessons (so the Lessons page is not empty).
    const baseLessons = [
      {
        id: 1,
        title: "HTML Foundations",

        difficulty: "Beginner",
        intro: "Learn how a strong HTML page is structured from the first line to the visible content.",
        topics: [
          {
            id: 1,
            title: "Page Structure",
            difficulty: "Beginner",
            xp: 50,
            description: "Every HTML document needs a doctype, html root, head, and body.",
            steps: [
              "Start with <!DOCTYPE html>.",
              "Add the html element with lang=\"en\".",
              "Create a head with a title.",
              "Place visible content inside body."
            ],
            code: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>",
            activityPrompt: "Build a complete HTML skeleton with an h1 inside the body.",
            activityStarter: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <title>Practice</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>",
            activityHint: "Make sure you include both the head and body sections.",
            validateActivity: (code) => validateWithChecks(code, [
              [c => c.includes("<!DOCTYPE html>"), "Add the DOCTYPE declaration at the top."],
              [c => c.includes("<body>"), "You need a <body> section."],
              [c => c.includes("<h1>"), "Include an <h1> heading inside the body."]
            ])
          },
          {
            id: 2,
            title: "Text Elements",
            difficulty: "Beginner",
            xp: 50,
            description: "Headings and paragraphs create readable content hierarchy.",
            steps: [
              "Use one main h1 for the page.",
              "Add supporting paragraphs with p tags.",
              "Keep the content short and clear."
            ],
            code: "<h1>About Me</h1>\n<p>I am learning HTML.</p>",
            activityPrompt: "Create one heading and one paragraph.",
            activityStarter: "<h1>My Topic</h1>\n<p>Write a short description here.</p>",
            activityHint: "Use both an h1 and a p tag.",
            validateActivity: (code) => validateWithChecks(code, [
              [c => c.includes("<h1"), "Add an <h1> heading."],
              [c => c.includes("<p"), "Add a <p> paragraph."]
            ])
          },
          {
            id: 24,
            title: "Attributes and Classes",
            difficulty: "Beginner",
            xp: 60,
            description: "Add attributes like class, id, and style to HTML elements for identification and styling.",
            steps: [
              "Use class=\"name\" to add a CSS class.",
              "Use id=\"unique\" for unique identification.",
              "Attributes go inside the opening tag."
            ],
            code: "<div class=\"container\" id=\"main\">\n  <h1 class=\"title\">Hello</h1>\n</div>",
            activityPrompt: "Create a div with a class attribute.",
            activityStarter: "<div class=\"box\">Content</div>",
            activityHint: "Use class=\"name\" to add a class attribute.",
            validateActivity: (code) => validateWithChecks(code, [
              [c => c.includes("class="), "Add a class attribute like class=\"name\"."]
            ])
          }
        ]
      },
      {
        id: 2,
        title: "Links and Media",
        difficulty: "Beginner",
        intro: "Add navigation and visual content that makes pages feel complete.",
        topics: [
          {
            id: 3,
            title: "Links",
            difficulty: "Beginner",
            xp: 60,
            description: "Links connect pages and external resources.",
            steps: [
              "Use the a element.",
              "Add an href value.",
              "Write clear link text."
            ],
            code: '<a href="https://example.com">Visit Example</a>',
            activityPrompt: "Create a link to https://example.com.",
            activityStarter: '<a href="https://example.com">Visit Example</a>',
            activityHint: "The href should point to https://example.com.",
            validateActivity: (code) => validateWithChecks(code, [
              [c => c.includes("<a"), "Add an <a> anchor tag."],
              [c => c.includes('href="https://example.com"'), 'Set href to "https://example.com".']
            ])
          },
          {
            id: 4,
            title: "Images",
            difficulty: "Beginner",
            xp: 60,
            description: "Images should always include helpful alt text.",
            steps: [
              "Use the img element.",
              "Set src and alt attributes.",
              "Keep alt text descriptive."
            ],
            code: '<img src="photo.jpg" alt="A sample landscape">',
            activityPrompt: "Create an image tag with any src and alt text.",
            activityStarter: '<img src="photo.jpg" alt="Describe the image">',
            activityHint: "Include both src and alt attributes.",
            validateActivity: (code) => validateWithChecks(code, [
              [c => c.includes("<img"), "Add an <img> tag."],
              [c => c.includes("alt="), "Add an alt attribute with descriptive text."]
            ])
          },
          {
            id: 25,
            title: "Link Targets",
            difficulty: "Beginner",
            xp: 65,
            description: "Control where a link opens using the target attribute.",
            steps: [
              "Use target=\"_blank\" to open in a new tab.",
              "Use target=\"_self\" to open in the same tab (default).",
              "External links often use _blank for better UX."
            ],
            code: "<a href=\"https://example.com\" target=\"_blank\">Open in new tab</a>",
            activityPrompt: "Create a link that opens in a new tab.",
            activityStarter: "<a href=\"https://example.com\" target=\"_blank\">Visit Example</a>",
            activityHint: "Use target=\"_blank\" to open in a new tab.",
            validateActivity: (code) => code.includes("target=")
          }
        ]
      },
      {
        id: 3,
        title: "Forms and Inputs",
        difficulty: "Intermediate",
        intro: "Forms let users send information and interact with the page.",
        topics: [
          {
            id: 5,
            title: "Basic Inputs",
            difficulty: "Intermediate",
            xp: 75,
            description: "Inputs collect text, email, passwords, and more.",
            steps: [
              "Wrap fields in a form.",
              "Use labels for accessibility.",
              "Choose the correct input type."
            ],
            code: '<label for="email">Email</label>\n<input id="email" type="email">',
            activityPrompt: "Create a labeled email input.",
            activityStarter: '<label for="email">Email</label>\n<input id="email" type="email">',
            activityHint: "Match the label for value with the input id.",
            validateActivity: (code) => code.includes("<label") && code.includes('type="email"')
          },
          {
            id: 26,
            title: "Form Actions",
            difficulty: "Intermediate",
            xp: 75,
            description: "Forms use action and method attributes to control where and how data is sent.",
            steps: [
              "Use action to set the submission URL.",
              "Use method=\"get\" or method=\"post\".",
              "GET appends data to URL, POST sends in body."
            ],
            code: "<form action=\"/submit\" method=\"post\">\n  <input type=\"text\" name=\"username\">\n  <button type=\"submit\">Submit</button>\n</form>",
            activityPrompt: "Create a form with action and method attributes.",
            activityStarter: "<form action=\"/submit\" method=\"post\">\n  <input type=\"text\" name=\"username\">\n  <button type=\"submit\">Submit</button>\n</form>",
            activityHint: "Forms need action and method attributes to work correctly.",
            validateActivity: (code) => code.includes("<form") && code.includes("action=") && code.includes("method=")
          },
          {
            id: 27,
            title: "Placeholder Text",
            difficulty: "Intermediate",
            xp: 70,
            description: "Placeholder text gives users a hint about what to type in an input.",
            steps: [
              "Use the placeholder attribute on inputs.",
              "Placeholder disappears when user starts typing.",
              "Keep placeholder text short and helpful."
            ],
            code: "<input type=\"text\" placeholder=\"Enter your name\">",
            activityPrompt: "Create an input with placeholder text.",
            activityStarter: "<input type=\"text\" placeholder=\"Enter your name\">",
            activityHint: "Use placeholder=\"...\" inside the input tag.",
            validateActivity: (code) => code.includes("placeholder=")
          }
        ]
      },
      {
        id: 4,
        title: "Lists and Navigation",
        difficulty: "Beginner",
        intro: "Organize content and build simple navigation using HTML lists and menu links.",
        topics: [
          {
            id: 6,
            title: "Unordered Lists",
            difficulty: "Beginner",
            xp: 55,
            description: "Unordered lists group related items with bullet points.",
            steps: [
              "Create a ul container.",
              "Add list items using li tags.",
              "Keep list text short and clear."
            ],
            code: "<ul>\n  <li>HTML</li>\n  <li>CSS</li>\n  <li>JavaScript</li>\n</ul>",
            activityPrompt: "Create an unordered list with at least 3 list items.",
            activityStarter: "<ul>\n  <li>Item One</li>\n  <li>Item Two</li>\n  <li>Item Three</li>\n</ul>",
            activityHint: "Use one ul tag and multiple li tags inside it.",
            validateActivity: (code) => code.includes("<ul") && (code.match(/<li/g) || []).length >= 3
          },
          {
            id: 7,
            title: "Ordered Lists",
            difficulty: "Beginner",
            xp: 55,
            description: "Ordered lists are useful for steps, instructions, and rankings.",
            steps: [
              "Start with an ol element.",
              "Place each step in an li element.",
              "Use ordered lists for sequences."
            ],
            code: "<ol>\n  <li>Open the file</li>\n  <li>Edit the code</li>\n  <li>Save the page</li>\n</ol>",
            activityPrompt: "Create an ordered list with 3 steps.",
            activityStarter: "<ol>\n  <li>Step One</li>\n  <li>Step Two</li>\n  <li>Step Three</li>\n</ol>",
            activityHint: "Use ol if the order matters.",
            validateActivity: (code) => code.includes("<ol") && (code.match(/<li/g) || []).length >= 3
          },
          {
            id: 8,
            title: "Navigation Menus",
            difficulty: "Beginner",
            xp: 65,
            description: "Simple HTML navigation menus combine nav, ul, li, and a elements.",
            steps: [
              "Wrap the menu inside a nav element.",
              "Use a list to group links.",
              "Add anchor tags for each destination."
            ],
            code: "<nav>\n  <ul>\n    <li><a href=\"#home\">Home</a></li>\n    <li><a href=\"#about\">About</a></li>\n  </ul>\n</nav>",
            activityPrompt: "Create a nav element with 2 links inside a list.",
            activityStarter: "<nav>\n  <ul>\n    <li><a href=\"#home\">Home</a></li>\n    <li><a href=\"#contact\">Contact</a></li>\n  </ul>\n</nav>",
            activityHint: "Use nav, ul, li, and a together.",
            validateActivity: (code) => code.includes("<nav") && code.includes("<a") && code.includes("<ul")
          }
        ]
      },
      {
        id: 5,
        title: "Tables and Data",
        difficulty: "Intermediate",
        intro: "Present structured data cleanly with tables, headings, and readable rows.",
        topics: [
          {
            id: 9,
            title: "Basic Tables",
            difficulty: "Intermediate",
            xp: 70,
            description: "Tables display information in rows and columns.",
            steps: [
              "Create the table element.",
              "Add rows with tr.",
              "Use td for standard cells."
            ],
            code: "<table>\n  <tr><td>Name</td><td>Score</td></tr>\n  <tr><td>Ana</td><td>95</td></tr>\n</table>",
            activityPrompt: "Create a table with 2 rows and 2 columns.",
            activityStarter: "<table>\n  <tr><td>Row 1 A</td><td>Row 1 B</td></tr>\n  <tr><td>Row 2 A</td><td>Row 2 B</td></tr>\n</table>",
            activityHint: "Use table, tr, and td.",
            validateActivity: (code) => code.includes("<table") && (code.match(/<tr/g) || []).length >= 2 && (code.match(/<td/g) || []).length >= 4
          },
          {
            id: 10,
            title: "Table Headings",
            difficulty: "Intermediate",
            xp: 75,
            description: "Table headings label columns so data is easier to understand.",
            steps: [
              "Add a first row for headers.",
              "Use th instead of td for labels.",
              "Keep header labels short."
            ],
            code: "<table>\n  <tr><th>Name</th><th>Grade</th></tr>\n  <tr><td>Lia</td><td>A</td></tr>\n</table>",
            activityPrompt: "Create a table with a heading row using th.",
            activityStarter: "<table>\n  <tr><th>Name</th><th>Grade</th></tr>\n  <tr><td>Sam</td><td>A</td></tr>\n</table>",
            activityHint: "Use th in the first row.",
            validateActivity: (code) => code.includes("<table") && code.includes("<th")
          },
          {
            id: 11,
            title: "Captions",
            difficulty: "Intermediate",
            xp: 75,
            description: "Captions give tables a short title or description.",
            steps: [
              "Place a caption inside the table.",
              "Write a short helpful label.",
              "Keep the data below the caption."
            ],
            code: "<table>\n  <caption>Monthly Sales</caption>\n  <tr><th>Month</th><th>Total</th></tr>\n</table>",
            activityPrompt: "Create a table that includes a caption.",
            activityStarter: "<table>\n  <caption>Student Scores</caption>\n  <tr><th>Name</th><th>Score</th></tr>\n</table>",
            activityHint: "Use a caption tag right after the opening table tag.",
            validateActivity: (code) => code.includes("<table") && code.includes("<caption")
          }
        ]
      },
      {
        id: 6,
        title: "Semantic HTML",
        difficulty: "Intermediate",
        intro: "Semantic elements describe meaning and help browsers, developers, and screen readers.",
        topics: [
          {
            id: 12,
            title: "Header and Footer",
            difficulty: "Intermediate",
            xp: 70,
            description: "Header and footer define the top and bottom areas of a page or section.",
            steps: [
              "Use header for the top intro area.",
              "Use footer for closing information.",
              "Keep content relevant to the section."
            ],
            code: "<header><h1>My Blog</h1></header>\n<footer><p>Copyright 2026</p></footer>",
            activityPrompt: "Create a page header and footer.",
            activityStarter: "<header>\n  <h1>Site Title</h1>\n</header>\n<footer>\n  <p>Footer text</p>\n</footer>",
            activityHint: "Use both header and footer tags.",
            validateActivity: (code) => code.includes("<header") && code.includes("<footer")
          },
          {
            id: 13,
            title: "Main and Section",
            difficulty: "Intermediate",
            xp: 75,
            description: "Main holds the primary content while section groups related content blocks.",
            steps: [
              "Wrap the core content in main.",
              "Use section to divide ideas.",
              "Include a heading inside each section."
            ],
            code: "<main>\n  <section>\n    <h2>Features</h2>\n    <p>Simple and clean.</p>\n  </section>\n</main>",
            activityPrompt: "Create a main area with one section and a heading.",
            activityStarter: "<main>\n  <section>\n    <h2>My Section</h2>\n    <p>Section text.</p>\n  </section>\n</main>",
            activityHint: "Use main outside section.",
            validateActivity: (code) => code.includes("<main") && code.includes("<section") && code.includes("<h2")
          },
          {
            id: 14,
            title: "Article and Aside",
            difficulty: "Intermediate",
            xp: 80,
            description: "Article is for self-contained content while aside is for supporting information.",
            steps: [
              "Use article for the main story or post.",
              "Use aside for notes or related links.",
              "Keep each block meaningful on its own."
            ],
            code: "<article>\n  <h2>News Update</h2>\n  <p>New lesson released.</p>\n</article>\n<aside>\n  <p>Related: HTML Forms</p>\n</aside>",
            activityPrompt: "Create an article and an aside.",
            activityStarter: "<article>\n  <h2>Article Title</h2>\n  <p>Main content.</p>\n</article>\n<aside>\n  <p>Extra note.</p>\n</aside>",
            activityHint: "Use article for main content and aside for supporting content.",
            validateActivity: (code) => code.includes("<article") && code.includes("<aside")
          }
        ]
      },
      {
        id: 7,
        title: "Forms Deep Dive",
        difficulty: "Intermediate",
        intro: "Go beyond simple inputs with grouped controls, choices, and validation-friendly HTML.",
        topics: [
          {
            id: 15,
            title: "Textarea and Button",
            difficulty: "Intermediate",
            xp: 70,
            description: "Textarea handles longer text and buttons submit or trigger actions.",
            steps: [
              "Add a textarea for multi-line content.",
              "Use a button for form actions.",
              "Keep labels clear."
            ],
            code: "<label for=\"message\">Message</label>\n<textarea id=\"message\"></textarea>\n<button>Send</button>",
            activityPrompt: "Create a labeled textarea and a button.",
            activityStarter: "<label for=\"message\">Message</label>\n<textarea id=\"message\"></textarea>\n<button>Send</button>",
            activityHint: "Use both textarea and button elements.",
            validateActivity: (code) => code.includes("<textarea") && code.includes("<button")
          },
          {
            id: 16,
            title: "Checkboxes",
            difficulty: "Intermediate",
            xp: 75,
            description: "Checkboxes let users choose one or more options.",
            steps: [
              "Use input type checkbox.",
              "Pair each box with a label.",
              "Group related choices together."
            ],
            code: "<label><input type=\"checkbox\"> HTML</label>\n<label><input type=\"checkbox\"> CSS</label>",
            activityPrompt: "Create 2 checkboxes with labels.",
            activityStarter: "<label><input type=\"checkbox\"> Option 1</label>\n<label><input type=\"checkbox\"> Option 2</label>",
            activityHint: "Use type=\"checkbox\" twice.",
            validateActivity: (code) => (code.match(/type="checkbox"/g) || []).length >= 2
          },
          {
            id: 17,
            title: "Radio Buttons",
            difficulty: "Intermediate",
            xp: 75,
            description: "Radio buttons let the user choose only one option from a group.",
            steps: [
              "Use input type radio.",
              "Give grouped radios the same name.",
              "Label each choice clearly."
            ],
            code: "<label><input type=\"radio\" name=\"level\"> Beginner</label>\n<label><input type=\"radio\" name=\"level\"> Advanced</label>",
            activityPrompt: "Create 2 radio buttons that share the same name.",
            activityStarter: "<label><input type=\"radio\" name=\"choice\"> A</label>\n<label><input type=\"radio\" name=\"choice\"> B</label>",
            activityHint: "Radio buttons in one set should use the same name value.",
            validateActivity: (code) => (code.match(/type="radio"/g) || []).length >= 2 && code.includes('name=')
          }
        ]
      },
      {
        id: 8,
        title: "Media and Embeds",
        difficulty: "Intermediate",
        intro: "Add audio, video, and embedded content using HTML media elements.",
        topics: [
          {
            id: 18,
            title: "Audio",
            difficulty: "Intermediate",
            xp: 80,
            description: "The audio element embeds sound directly on the page.",
            steps: [
              "Add the audio element.",
              "Use the controls attribute.",
              "Point to a source file."
            ],
            code: "<audio controls>\n  <source src=\"song.mp3\" type=\"audio/mpeg\">\n</audio>",
            activityPrompt: "Create an audio element with controls.",
            activityStarter: "<audio controls>\n  <source src=\"sound.mp3\" type=\"audio/mpeg\">\n</audio>",
            activityHint: "Use audio and source together.",
            validateActivity: (code) => code.includes("<audio") && code.includes("controls")
          },
          {
            id: 19,
            title: "Video",
            difficulty: "Intermediate",
            xp: 80,
            description: "Video lets users watch media directly on your page.",
            steps: [
              "Add a video element.",
              "Use controls to make it interactive.",
              "Add a source element inside."
            ],
            code: "<video controls width=\"320\">\n  <source src=\"movie.mp4\" type=\"video/mp4\">\n</video>",
            activityPrompt: "Create a video element with controls.",
            activityStarter: "<video controls width=\"320\">\n  <source src=\"clip.mp4\" type=\"video/mp4\">\n</video>",
            activityHint: "Use video with a source tag.",
            validateActivity: (code) => code.includes("<video") && code.includes("<source")
          },
          {
            id: 20,
            title: "Iframes",
            difficulty: "Intermediate",
            xp: 85,
            description: "Iframes embed another page or resource inside your layout.",
            steps: [
              "Use an iframe element.",
              "Provide a src attribute.",
              "Set width and height for clarity."
            ],
            code: "<iframe src=\"https://example.com\" width=\"300\" height=\"200\"></iframe>",
            activityPrompt: "Create an iframe with a src, width, and height.",
            activityStarter: "<iframe src=\"https://example.com\" width=\"300\" height=\"200\"></iframe>",
            activityHint: "Use iframe and include src.",
            validateActivity: (code) => code.includes("<iframe") && code.includes("src=") && code.includes("width=")
          }
        ]
      },
      {
        id: 9,
        title: "HTML Metadata and Accessibility",
        difficulty: "Advanced",
        intro: "Improve page meaning and usability with strong metadata and accessible markup choices.",
        topics: [
          {
            id: 21,
            title: "Meta Tags",
            difficulty: "Advanced",
            xp: 85,
            description: "Meta tags provide browser and search engines with useful information about the page.",
            steps: [
              "Place meta tags in the head.",
              "Add charset and viewport.",
              "Use description for page context."
            ],
            code: "<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <meta name=\"description\" content=\"My page description\">\n</head>",
            activityPrompt: "Add charset, viewport, and description meta tags.",
            activityStarter: "<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <meta name=\"description\" content=\"Describe your page\">\n</head>",
            activityHint: "Put all meta tags inside head.",
            validateActivity: (code) => code.includes("charset") && code.includes("viewport") && code.includes("description")
          },
          {
            id: 22,
            title: "Alt Text",
            difficulty: "Advanced",
            xp: 85,
            description: "Alternative text helps screen readers describe image meaning.",
            steps: [
              "Use the alt attribute on every meaningful image.",
              "Describe the image purpose, not every tiny detail.",
              "Keep it short and useful."
            ],
            code: "<img src=\"team.jpg\" alt=\"A web design team at work\">",
            activityPrompt: "Create an image with useful alt text.",
            activityStarter: "<img src=\"photo.jpg\" alt=\"Describe the image meaning\">",
            activityHint: "Use an img tag with a descriptive alt attribute.",
            validateActivity: (code) => code.includes("<img") && code.includes("alt=")
          },
          {
            id: 23,
            title: "Labels and Accessibility",
            difficulty: "Advanced",
            xp: 90,
            description: "Labels make forms easier to use for everyone, especially keyboard and screen reader users.",
            steps: [
              "Pair labels with inputs.",
              "Use for and id to connect them.",
              "Write clear visible text."
            ],
            code: "<label for=\"name\">Full Name</label>\n<input id=\"name\" type=\"text\">",
            activityPrompt: "Create a properly labeled text input.",
            activityStarter: "<label for=\"username\">Username</label>\n<input id=\"username\" type=\"text\">",
            activityHint: "Match the label for value to the input id.",
            validateActivity: (code) => code.includes("<label") && code.includes("for=") && code.includes("id=")
          }
        ]
      }
    ];

    const extraLessonTemplates = [

      // Each template becomes a lesson with 3 topics.
      // Existing baseLessons already include 9 lessons; with these templates we reach >= 20.
      // NOTE: templates are appended as-is; keep them valid JS arrays.

      {
        title: "Inline Text and Formatting",


        difficulty: "Beginner",
        intro: "Use inline HTML tags to add emphasis, importance, and small semantic meaning.",
        topics: [
          ["Bold and Strong", "Use strong to mark important text.", "<p>This is <strong>important</strong>.</p>", (code) => code.includes("<strong")],
          ["Italic and Emphasis", "Use em to add emphasis within a sentence.", "<p>I <em>really</em> like HTML.</p>", (code) => code.includes("<em")],
          ["Line Breaks", "Use br to force a line break inside text.", "<p>Hello<br>World</p>", (code) => code.includes("<br")]
        ]
      },
      {
        title: "HTML Containers",
        difficulty: "Beginner",
        intro: "Group content using general HTML containers before moving into CSS layout.",
        topics: [
          ["Div Containers", "Use div to group related content blocks.", "<div><h2>Card Title</h2><p>Card text.</p></div>", (code) => code.includes("<div")],
          ["Span Elements", "Use span for small inline pieces of text.", "<p>Save <span>20%</span> today.</p>", (code) => code.includes("<span")],
          ["Nested Structure", "Build one container inside another container.", "<div><section><p>Nested content</p></section></div>", (code) => code.includes("<div") && code.includes("<section")]
        ]
      },
      {
        title: "HTML Head Essentials",
        difficulty: "Intermediate",
        intro: "Strengthen the document head with titles, icons, and useful page metadata.",
        topics: [
          ["Page Titles", "Every HTML page should have a clear title element.", "<head><title>My Portfolio</title></head>", (code) => code.includes("<title>")],
          ["Favicons", "Use a link element to connect a favicon.", "<link rel=\"icon\" href=\"favicon.ico\">", (code) => code.includes("rel=\"icon\"")],
          ["Theme Color", "Use meta theme-color to style the browser UI on supported devices.", "<meta name=\"theme-color\" content=\"#111111\">", (code) => code.includes("theme-color")]
        ]
      },
      {
        title: "Buttons and Actions",
        difficulty: "Beginner",
        intro: "Create clear interactive controls with native HTML buttons and input actions.",
        topics: [
          ["Button Types", "Buttons can be used for submit, reset, and generic actions.", "<button type=\"button\">Click Me</button>", (code) => code.includes("<button")],
          ["Submit Buttons", "Use a submit button inside a form.", "<form><button type=\"submit\">Send</button></form>", (code) => code.includes("type=\"submit\"")],
          ["Reset Buttons", "A reset button returns form fields to their initial state.", "<form><button type=\"reset\">Reset</button></form>", (code) => code.includes("type=\"reset\"")]
        ]
      },
      {
        title: "Input Types",
        difficulty: "Intermediate",
        intro: "Learn more useful HTML input types for common forms.",
        topics: [
          ["Password Inputs", "Password fields hide characters as users type.", "<input type=\"password\" placeholder=\"Password\">", (code) => code.includes("type=\"password\"")],
          ["Number Inputs", "Number fields are useful for ages, quantities, and totals.", "<input type=\"number\" min=\"1\" max=\"10\">", (code) => code.includes("type=\"number\"")],
          ["Date Inputs", "Date inputs give users a calendar picker in modern browsers.", "<input type=\"date\">", (code) => code.includes("type=\"date\"")]
        ]
      },
      {
        title: "Selection Controls",
        difficulty: "Intermediate",
        intro: "Offer users choices with select menus and grouped fields.",
        topics: [
          ["Select Menus", "Use select and option to build dropdown choices.", "<select><option>HTML</option><option>CSS</option></select>", (code) => code.includes("<select") && code.includes("<option")],
          ["Fieldsets", "Fieldsets group related form inputs together.", "<fieldset><legend>Account</legend><input type=\"text\"></fieldset>", (code) => code.includes("<fieldset") && code.includes("<legend")],
          ["Option Groups", "Use optgroup to organize dropdown options.", "<select><optgroup label=\"Frontend\"><option>HTML</option></optgroup></select>", (code) => code.includes("<optgroup")]
        ]
      },
      {
        title: "Advanced Semantics",
        difficulty: "Advanced",
        intro: "Use more descriptive HTML to make content easier to understand and maintain.",
        topics: [
          ["Figure and Figcaption", "Pair media with a caption using figure and figcaption.", "<figure><img src=\"cat.jpg\" alt=\"Cat\"><figcaption>Office cat</figcaption></figure>", (code) => code.includes("<figure") && code.includes("<figcaption")],
          ["Time Element", "Use time to represent dates and times in semantic HTML.", "<time datetime=\"2026-04-04\">April 4, 2026</time>", (code) => code.includes("<time")],
          ["Address Element", "Use address for contact information.", "<address>Email: hello@example.com</address>", (code) => code.includes("<address")]
        ]
      },
      {
        title: "Interactive HTML",
        difficulty: "Advanced",
        intro: "Add built-in interaction using native HTML elements before reaching for JavaScript.",
        topics: [
          ["Details and Summary", "Use details and summary to create collapsible content.", "<details><summary>More Info</summary><p>Hidden text</p></details>", (code) => code.includes("<details") && code.includes("<summary")],
          ["Progress Element", "Show task progress with the progress element.", "<progress value=\"60\" max=\"100\"></progress>", (code) => code.includes("<progress")],
          ["Meter Element", "Use meter for scalar measurements like scores or ranges.", "<meter value=\"0.7\">70%</meter>", (code) => code.includes("<meter")]
        ]
      },
      {
        title: "HTML Utilities",
        difficulty: "Advanced",
        intro: "Use smaller HTML tools like comments, entities, and code elements for cleaner documents.",
        topics: [
          ["Comments", "Comments let you annotate HTML without affecting the page output.", "<!-- Main hero section -->", (code) => code.includes("<!--")],
          ["HTML Entities", "Entities render reserved characters like < and > safely.", "<p>&lt;h1&gt;Hello&lt;/h1&gt;</p>", (code) => code.includes("&lt;")],
          ["Code and Pre", "Use code and pre to show code samples clearly.", "<pre><code>&lt;h1&gt;Hello&lt;/h1&gt;</code></pre>", (code) => code.includes("<pre") && code.includes("<code")]
        ]
      },
      {
        title: "Links Deep Dive",
        difficulty: "Intermediate",
        intro: "Master every way to create links: anchor tags, mailto, tel, download, and opening in new tabs.",
        topics: [
          ["Mailto Links", "Create clickable email addresses with the mailto: scheme.", '<a href="mailto:hello@example.com">Email us</a>', (code) => code.includes("mailto:")],
          ["Tel Links", "Phone numbers can be links too using tel: scheme.", '<a href="tel:+1234567890">Call Now</a>', (code) => code.includes("tel:")],
          ["Download Links", "The download attribute prompts file download instead of navigation.", '<a href="resume.pdf" download>Download Resume</a>', (code) => code.includes("download")]
        ]
      },
      {
        title: "HTML Best Practices",
        difficulty: "Intermediate",
        intro: "Write clean, semantic, and accessible HTML that every developer should know.",
        topics: [
          ["DOCTYPE Declaration", "Always start with the correct DOCTYPE to trigger standards mode.", '<!DOCTYPE html>\n<html lang="en"></html>', (code) => code.includes("DOCTYPE")],
          ["Lang Attribute", "The lang attribute helps screen readers and search engines.", '<html lang="en">', (code) => code.includes("lang=")],
          ["Meta Viewport", "The viewport meta ensures proper mobile rendering.", '<meta name="viewport" content="width=device-width, initial-scale=1.0">', (code) => code.includes("viewport")]
        ]
      },
      {
        title: "Embedded Content",
        difficulty: "Intermediate",
        intro: "Embed images, videos, iframes, and audio into your pages with proper attributes.",
        topics: [
          ["Iframe Embeds", "Embed external pages using the iframe element with security attributes.", '<iframe src="https://example.com" loading="lazy" title="Example"></iframe>', (code) => code.includes("<iframe")],
          ["Video Element", "Native video playback with controls, sources, and fallback text.", '<video controls width="320"><source src="video.mp4" type="video/mp4">Your browser does not support video.</video>', (code) => code.includes("<video") && code.includes("controls")],
          ["Audio Element", "Native audio playback with controls and source fallback.", '<audio controls><source src="audio.mp3" type="audio/mpeg">Your browser does not support audio.</audio>', (code) => code.includes("<audio") && code.includes("controls")]
        ]
      }
    ];

    let nextLessonId = baseLessons.length + 1;
    let nextTopicId = baseLessons.reduce((maxId, lesson) => {
      const lessonMax = Math.max(...lesson.topics.map((topic) => topic.id));
      return Math.max(maxId, lessonMax);
    }, 0) + 1;

    const extraLessons = extraLessonTemplates.map((template) => ({
      id: nextLessonId++,
      title: template.title,
      difficulty: template.difficulty,
      intro: template.intro,
      topics: template.topics.map(([title, description, starter, validator], index) => {
        const topicId = nextTopicId++;
        return {
          id: topicId,
          title,
          difficulty: template.difficulty,
          xp: template.difficulty === "Advanced" ? 95 : template.difficulty === "Intermediate" ? 80 : 60,
          description,
          steps: [
            "Read the example structure carefully.",
            "Type the matching HTML elements in the editor.",
            "Run and check the result before completing the topic."
          ],
          code: starter,
          activityPrompt: `Create a working example for ${title.toLowerCase()}.`,
          activityStarter: starter,
          activityHint: `Use the correct HTML tags for ${title.toLowerCase()}.`,
          validateActivity: validator
        };
      })
    }));

    const allLessons = baseLessons.concat(extraLessons);
    window.htmlLessons = allLessons;
    return allLessons;
  }



  function calculateLevel() {
    return Math.max(1, Math.floor(appState.xp / 200) + 1);
  }



  function getHTMLQuizData() {
    const lessons = getLessonData();
    const allTopics = lessons.flatMap((lesson) => lesson.topics.map((topic) => topic.title));
    const fallbackTags = ["div", "section", "article", "nav", "form", "table", "img", "audio", "video", "label"];

    return lessons.map((lesson) => {
      const unlocked = lesson.topics.every((topic) => appState.completedLessons.includes(topic.id));
      const completed = appState.completedQuizzes.includes(lesson.id);
      const questions = lesson.topics.slice(0, 3).map((topic, index) => {
        const tagMatch = (topic.code || "").match(/<\s*([a-z0-9]+)/i);
        const correctTag = tagMatch ? tagMatch[1].toLowerCase() : fallbackTags[index % fallbackTags.length];
        const tagOptions = Array.from(new Set([correctTag, ...fallbackTags.filter((tag) => tag !== correctTag).slice(0, 3)]));
        const topicOptions = Array.from(new Set([
          topic.title,
          ...allTopics.filter((title) => title !== topic.title).slice(index * 2, index * 2 + 3)
        ])).slice(0, 4);

        if (index === 0) {
          return {
            question: `Which HTML tag is most closely connected to "${topic.title}"?`,
            options: tagOptions.map((tag) => `<${tag}>`),
            answer: `<${correctTag}>`
          };
        }

        if (index === 1) {
          const correctXp = topic.xp;
          const xpOptions = Array.from(new Set([correctXp, correctXp - 10, correctXp + 10, correctXp + 20])).filter((value) => value > 0).slice(0, 4);
          return {
            question: `How much XP does "${topic.title}" reward when completed?`,
            options: xpOptions.map((value) => `${value} XP`),
            answer: `${correctXp} XP`
          };
        }

        return {
          question: `Which topic belongs to the "${lesson.title}" lesson group?`,
          options: topicOptions,
          answer: topic.title
        };
      });

      return {
        id: lesson.id,
        title: `${lesson.title} Quiz`,
        group: "html",
        difficulty: lesson.difficulty,
        intro: `Answer these questions to prove you understood the ${lesson.title.toLowerCase()} lesson topics.`,
        unlocked,
        completed,
        lessonTitle: lesson.title,
        questionCount: questions.length,
        questions
      };
    });
  }

  function getJSQuizData() {
    const lessons = getJSLessonData();
    const allTopics = lessons.flatMap((lesson) => lesson.topics.map((topic) => topic.title));
    const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];

    return lessons.map((lesson) => {
      const unlocked = lesson.topics.every((topic) => appState.completedLessons.includes(topic.id));
      const completed = appState.completedQuizzes.includes(lesson.id);
      const questions = lesson.topics.slice(0, 3).map((topic, index) => {
        const correctXp = topic.xp;
        const xpOptions = Array.from(new Set([correctXp, correctXp - 10, correctXp + 10, correctXp + 20])).filter((value) => value > 0).slice(0, 4);
        const topicOptions = Array.from(new Set([
          topic.title,
          ...allTopics.filter((title) => title !== topic.title).slice(index * 2, index * 2 + 3)
        ])).slice(0, 4);

        if (index === 0) {
          return {
            question: `Which topic belongs to the "${lesson.title}" lesson group?`,
            options: topicOptions,
            answer: topic.title
          };
        }

        if (index === 1) {
          return {
            question: `How much XP does "${topic.title}" reward when completed?`,
            options: xpOptions.map((value) => `${value} XP`),
            answer: `${correctXp} XP`
          };
        }

        return {
          question: `What difficulty level is "${topic.title}"?`,
          options: difficultyOptions,
          answer: topic.difficulty
        };
      });

      return {
        id: lesson.id,
        title: `${lesson.title} Quiz`,
        group: "js",
        difficulty: lesson.difficulty,
        intro: `Answer these JavaScript questions to prove you understood the ${lesson.title.toLowerCase()} lesson topics.`,
        unlocked,
        completed,
        lessonTitle: lesson.title,
        questionCount: questions.length,
        questions
      };
    });
  }

  function getCSSLessonData() {
    return [
      {
        id: 201,
        title: "CSS Selectors",
        difficulty: "Beginner",
        intro: "Learn how to target HTML elements with CSS selectors — from simple element selectors to combinators.",
        topics: [
          {
            id: 201, title: "Element & Class Selectors", difficulty: "Beginner", xp: 50,
            description: "Target elements by tag name or class attribute.",
            steps: ["Use tag names like div { } to style all elements of that type.", "Use .classname { } to style elements with that class.", "Classes can be reused on multiple elements."],
            code: "div { color: blue; }\n.highlight { background: yellow; }",
            activityPrompt: "Write a rule that targets all p elements and gives them red text.",
            activityStarter: "/* Write a selector for all paragraphs then make text red */\n\n",
            activityHint: "Use p as the selector and set color: red;",
            validateActivity: (code) => code.includes("p {") && code.includes("color")
          },
          {
            id: 202, title: "ID Selectors & Specificity", difficulty: "Beginner", xp: 50,
            description: "IDs are unique per page and have higher specificity than classes.",
            steps: ["Use #idname { } to target a single element by ID.", "IDs override classes when both apply.", "Avoid overusing IDs — they break reusability."],
            code: "#header { font-size: 2rem; }\n.intro { font-size: 1rem; }",
            activityPrompt: "Write a rule that targets the element with id 'hero' and gives it a large font size.",
            activityStarter: "/* Target the element with id 'hero' */\n\n",
            activityHint: "Use #hero { } as the selector.",
            validateActivity: (code) => code.includes("#hero") && code.includes("font-size")
          },
          {
            id: 203, title: "Combinators", difficulty: "Beginner", xp: 50,
            description: "Combine selectors to target elements based on their relationship in the DOM.",
            steps: ["Child selector: parent > child", "Descendant selector: ancestor descendant", "Adjacent sibling: element + sibling"],
            code: "ul > li { list-style: none; }\narticle p { line-height: 1.6; }\nh2 + p { margin-top: 0; }",
            activityPrompt: "Write a child combinator that selects all li inside a ul and removes bullet points.",
            activityStarter: "/* Style li elements inside ul */\n\n",
            activityHint: "Use ul > li and set list-style: none;",
            validateActivity: (code) => code.includes(">") && code.includes("list-style")
          }
        ]
      },
      {
        id: 202,
        title: "Box Model",
        difficulty: "Beginner",
        intro: "Understand the CSS box model — content, padding, border, and margin — and how they affect element sizing.",
        topics: [
          {
            id: 204, title: "Content & Padding", difficulty: "Beginner", xp: 55,
            description: "Padding creates space inside the element between content and border.",
            steps: ["Content is the inner area holding text or child elements.", "Padding adds space around the content.", "Use padding shorthand: padding: top right bottom left;"],
            code: ".card { padding: 20px; }\n.card-title { padding: 0 10px; }",
            activityPrompt: "Add 16px of padding to a button class.",
            activityStarter: ".btn {\n  /* your code */\n}",
            activityHint: "Add padding: 16px; inside .btn { }",
            validateActivity: (code) => code.includes("padding")
          },
          {
            id: 205, title: "Border", difficulty: "Beginner", xp: 55,
            description: "Borders surround the padding and come in many styles, widths, and colors.",
            steps: ["Use border: width style color; shorthand.", "Common styles: solid, dashed, dotted.", "Border-radius rounds the corners."],
            code: ".box { border: 2px solid #333; border-radius: 8px; }",
            activityPrompt: "Give a class 'card' a 1px solid gray border with rounded corners.",
            activityStarter: ".card {\n  /* your code */\n}",
            activityHint: "Use border: 1px solid gray; border-radius: 4px;",
            validateActivity: (code) => code.includes("border")
          },
          {
            id: 206, title: "Margin & Auto", difficulty: "Beginner", xp: 55,
            description: "Margin creates space outside the element; margin: auto centers block elements horizontally.",
            steps: ["Margin pushes other elements away.", "margin: auto with a set width centers horizontally.", "Negative margins pull elements closer."],
            code: ".container { margin: 0 auto; width: 80%; }\n.spacer { margin-top: 20px; }",
            activityPrompt: "Center a div with class 'wrapper' using margin auto and give it width 600px.",
            activityStarter: ".wrapper {\n  /* your code */\n}",
            activityHint: "Set margin: 0 auto; and width: 600px;",
            validateActivity: (code) => code.includes("margin") && code.includes("auto")
          }
        ]
      },
      {
        id: 203,
        title: "Flexbox",
        difficulty: "Intermediate",
        intro: "Master CSS Flexbox for one-dimensional layouts — aligning, distributing, and reordering items.",
        topics: [
          {
            id: 207, title: "Flex Container", difficulty: "Intermediate", xp: 65,
            description: "Turn any element into a flex container to control child layout.",
            steps: ["Set display: flex on the parent.", "Flex items align in a row by default.", "Use flex-direction to switch to column."],
            code: ".row { display: flex; gap: 10px; }\n.column { display: flex; flex-direction: column; }",
            activityPrompt: "Create a flex container with class 'nav' that displays items in a row.",
            activityStarter: ".nav {\n  /* your code */\n}",
            activityHint: "Set display: flex; on .nav",
            validateActivity: (code) => code.includes("display: flex")
          },
          {
            id: 208, title: "Alignment & Justification", difficulty: "Intermediate", xp: 65,
            description: "Align items along the cross axis and justify them along the main axis.",
            steps: ["align-items: center centers vertically (in a row).", "justify-content: space-between spreads items evenly.", "gap adds consistent spacing between items."],
            code: ".center { display: flex; align-items: center; justify-content: center; gap: 12px; }",
            activityPrompt: "Style a toolbar class that centers items horizontally with 8px gaps.",
            activityStarter: ".toolbar {\n  display: flex;\n  /* your code */\n}",
            activityHint: "Use align-items: center and gap: 8px",
            validateActivity: (code) => code.includes("align-items") && code.includes("gap")
          },
          {
            id: 209, title: "Flex Items", difficulty: "Intermediate", xp: 65,
            description: "Control individual flex items with flex-grow, flex-shrink, and order.",
            steps: ["flex-grow: 1 makes an item fill available space.", "flex-shrink: 0 prevents an item from shrinking.", "order changes visual order without changing HTML."],
            code: ".item { flex: 1; }\n.sidebar { flex: 0 0 250px; }\n.last { order: 1; }",
            activityPrompt: "Give the class 'main' a flex-grow of 2 so it takes up twice the space.",
            activityStarter: ".main {\n  /* your code */\n}",
            activityHint: "Set flex: 2 or flex-grow: 2",
            validateActivity: (code) => code.includes("flex:")
          }
        ]
      },
      {
        id: 204,
        title: "CSS Grid",
        difficulty: "Intermediate",
        intro: "Build two-dimensional layouts with CSS Grid — rows, columns, areas, and responsive sizing.",
        topics: [
          {
            id: 210, title: "Grid Container & Tracks", difficulty: "Intermediate", xp: 70,
            description: "Define a grid container with rows and columns using grid-template.",
            steps: ["Set display: grid on the parent.", "Use grid-template-columns to define column widths.", "Use grid-template-rows for row heights."],
            code: ".grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }",
            activityPrompt: "Create a 2-column grid with equal-width columns.",
            activityStarter: ".two-col {\n  display: grid;\n  /* your code */\n}",
            activityHint: "Use grid-template-columns: 1fr 1fr;",
            validateActivity: (code) => code.includes("grid-template-columns")
          },
          {
            id: 211, title: "Grid Placement", difficulty: "Intermediate", xp: 70,
            description: "Place items anywhere in the grid using line numbers or named areas.",
            steps: ["grid-column: 1 / 3 spans from line 1 to line 3.", "grid-area places an item into a named region.", "Grid lines start at 1, not 0."],
            code: ".header { grid-column: 1 / -1; }\n.sidebar { grid-row: 2 / 4; }",
            activityPrompt: "Make a class 'banner' span all columns using grid-column.",
            activityStarter: ".banner {\n  /* your code */\n}",
            activityHint: "Use grid-column: 1 / -1;",
            validateActivity: (code) => code.includes("grid-column")
          },
          {
            id: 212, title: "Auto-fit & Minmax", difficulty: "Intermediate", xp: 70,
            description: "Create responsive grids that auto-adjust column count with auto-fit and minmax.",
            steps: ["auto-fit fills the row with as many columns as fit.", "minmax(min, max) sets a flexible size range.", "Combine: repeat(auto-fit, minmax(250px, 1fr))"],
            code: ".responsive { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }",
            activityPrompt: "Create a responsive grid where each column is at least 200px wide.",
            activityStarter: ".responsive-grid {\n  display: grid;\n  /* your code */\n}",
            activityHint: "Use repeat(auto-fit, minmax(200px, 1fr))",
            validateActivity: (code) => code.includes("auto-fit") || code.includes("auto-fill")
          }
        ]
      },
      {
        id: 205,
        title: "Typography & Colors",
        difficulty: "Beginner",
        intro: "Style text with fonts, sizes, weights, line-heights, and color systems including hex, rgb, and hsl.",
        topics: [
          {
            id: 213, title: "Font Properties", difficulty: "Beginner", xp: 50,
            description: "Control font family, size, weight, and style of text.",
            steps: ["font-family sets the typeface.", "font-size uses px, rem, or em units.", "font-weight controls boldness (400=normal, 700=bold)."],
            code: "body { font-family: 'Segoe UI', sans-serif; font-size: 16px; }\nh1 { font-weight: 700; }",
            activityPrompt: "Set the body font to Arial, size 18px, normal weight.",
            activityStarter: "body {\n  /* your code */\n}",
            activityHint: "Use font-family: Arial; font-size: 18px; font-weight: 400;",
            validateActivity: (code) => code.includes("font-family") && code.includes("font-size")
          },
          {
            id: 214, title: "Color Values", difficulty: "Beginner", xp: 50,
            description: "Use hex, rgb, rgba, and hsl to add color to text and backgrounds.",
            steps: ["Hex: #ff6600 — 6-digit shorthand for RGB.", "rgb(255, 0, 0) — red, green, blue channels.", "rgba adds alpha transparency (0-1)."],
            code: ".text { color: #333; }\n.bg { background: rgba(0, 0, 0, 0.5); }",
            activityPrompt: "Give a class 'overlay' a semi-transparent black background using rgba.",
            activityStarter: ".overlay {\n  /* your code */\n}",
            activityHint: "Use background: rgba(0, 0, 0, 0.6);",
            validateActivity: (code) => code.includes("rgba")
          },
          {
            id: 215, title: "Line Height & Spacing", difficulty: "Beginner", xp: 50,
            description: "Improve readability with line-height, letter-spacing, and text-align.",
            steps: ["line-height: 1.6 creates comfortable reading spacing.", "letter-spacing adds space between characters.", "text-align: center/left/right/justify aligns text."],
            code: "p { line-height: 1.6; letter-spacing: 0.02em; text-align: justify; }",
            activityPrompt: "Style article text with 1.8 line-height and justified alignment.",
            activityStarter: "article {\n  /* your code */\n}",
            activityHint: "Set line-height: 1.8; text-align: justify;",
            validateActivity: (code) => code.includes("line-height") && code.includes("text-align")
          }
        ]
      },
      {
        id: 206,
        title: "Backgrounds & Gradients",
        difficulty: "Beginner",
        intro: "Add visual flair with background images, colors, gradients, and advanced background properties.",
        topics: [
          {
            id: 216, title: "Background Basics", difficulty: "Beginner", xp: 55,
            description: "Set background colors, images, and control repeating and positioning.",
            steps: ["background-color fills the element with a solid color.", "background-image: url() loads an image.", "background-repeat and background-position control placement."],
            code: ".hero { background-color: #1a1a2e; background-image: url('bg.png'); background-size: cover; }",
            activityPrompt: "Create a hero section with a dark background color and a background image.",
            activityStarter: ".hero {\n  /* your code */\n}",
            activityHint: "Use background-color and background-image with url().",
            validateActivity: (code) => code.includes("background-color") && code.includes("background-image")
          },
          {
            id: 217, title: "Linear Gradients", difficulty: "Beginner", xp: 55,
            description: "Create smooth color transitions with linear-gradient() backgrounds.",
            steps: ["linear-gradient(direction, color1, color2)", "Direction can be to right, to bottom, 45deg.", "Multiple color stops create complex gradients."],
            code: ".gradient { background: linear-gradient(135deg, #667eea, #764ba2); }",
            activityPrompt: "Create a button with a left-to-right blue-to-purple gradient.",
            activityStarter: ".btn-gradient {\n  /* your code */\n}",
            activityHint: "Use background: linear-gradient(to right, blue, purple);",
            validateActivity: (code) => code.includes("linear-gradient")
          },
          {
            id: 218, title: "Multiple Backgrounds", difficulty: "Beginner", xp: 55,
            description: "Layer multiple background images and gradients on a single element.",
            steps: ["Separate backgrounds with commas.", "The first background appears on top.", "Combine gradients and images for rich effects."],
            code: ".card { background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('photo.jpg') center/cover; }",
            activityPrompt: "Layer a semi-transparent overlay gradient on top of a background image.",
            activityStarter: ".overlay-card {\n  /* your code */\n}",
            activityHint: "Use background: linear-gradient(...), url(...) center/cover;",
            validateActivity: (code) => code.includes("background:")
          }
        ]
      },
      {
        id: 207,
        title: "Transitions & Animations",
        difficulty: "Intermediate",
        intro: "Bring your UI to life with CSS transitions, transforms, and keyframe animations.",
        topics: [
          {
            id: 219, title: "CSS Transitions", difficulty: "Intermediate", xp: 70,
            description: "Smoothly transition between property values over a duration.",
            steps: ["transition-property: the property to animate.", "transition-duration: how long it takes.", "Shorthand: transition: property duration easing;"],
            code: ".btn { transition: background 0.3s ease, transform 0.2s; }\n.btn:hover { background: blue; transform: scale(1.05); }",
            activityPrompt: "Add a 0.3s transition on opacity for a fade-in effect on hover.",
            activityStarter: ".fade {\n  opacity: 0.5;\n  transition: /* your code */;\n}\n.fade:hover { opacity: 1; }",
            activityHint: "Use transition: opacity 0.3s ease;",
            validateActivity: (code) => code.includes("transition:")
          },
          {
            id: 220, title: "CSS Transforms", difficulty: "Intermediate", xp: 70,
            description: "Scale, rotate, translate, and skew elements in 2D space.",
            steps: ["transform: scale(1.2) grows an element.", "transform: rotate(45deg) spins it.", "transform: translate(x, y) moves it."],
            code: ".card:hover { transform: translateY(-4px) scale(1.02); }",
            activityPrompt: "Make a button grow slightly on hover using transform.",
            activityStarter: ".btn:hover {\n  /* your code */\n}",
            activityHint: "Use transform: scale(1.1);",
            validateActivity: (code) => code.includes("transform:")
          },
          {
            id: 221, title: "Keyframe Animations", difficulty: "Intermediate", xp: 70,
            description: "Create multi-step animations with @keyframes and the animation property.",
            steps: ["Define @keyframes with named stages (0%, 100%).", "Use animation-name, animation-duration, and animation-iteration-count.", "animation shorthand combines all properties."],
            code: "@keyframes pulse {\n  0% { transform: scale(1); }\n  50% { transform: scale(1.05); }\n  100% { transform: scale(1); }\n}\n.pulse { animation: pulse 2s infinite; }",
            activityPrompt: "Create a 'fadeIn' keyframe animation that goes from opacity 0 to 1.",
            activityStarter: "@keyframes fadeIn {\n  /* your code */\n}\n\n.fade-in {\n  animation: fadeIn 1s ease;\n}",
            activityHint: "Use 0% { opacity: 0; } and 100% { opacity: 1; }",
            validateActivity: (code) => code.includes("@keyframes") && code.includes("opacity")
          }
        ]
      },
      {
        id: 208,
        title: "Responsive Design",
        difficulty: "Advanced",
        intro: "Make layouts adapt to any screen size with media queries, relative units, and mobile-first techniques.",
        topics: [
          {
            id: 222, title: "Media Queries", difficulty: "Advanced", xp: 80,
            description: "Apply CSS rules conditionally based on viewport width, device type, and more.",
            steps: ["Use @media (max-width: 768px) for mobile breakpoints.", "Place queries at the end of your stylesheet.", "Mobile-first uses min-width queries."],
            code: "@media (max-width: 768px) {\n  .grid { grid-template-columns: 1fr; }\n  .nav { flex-direction: column; }\n}",
            activityPrompt: "Write a media query that hides a sidebar class below 600px.",
            activityStarter: "@media (max-width: 600px) {\n  /* your code */\n}",
            activityHint: "Use .sidebar { display: none; } inside the query.",
            validateActivity: (code) => code.includes("@media") && code.includes("display: none")
          },
          {
            id: 223, title: "Relative Units", difficulty: "Advanced", xp: 80,
            description: "Use rem, em, vw, vh, and % for flexible, scalable designs.",
            steps: ["rem is relative to root font-size (usually 16px).", "em is relative to the parent's font-size.", "vw/vh are percentages of the viewport."],
            code: "html { font-size: 16px; }\nh1 { font-size: 2rem; }\n.hero { height: 100vh; }",
            activityPrompt: "Set a full-viewport-height hero section using vh units.",
            activityStarter: ".hero {\n  /* your code */\n}",
            activityHint: "Use height: 100vh;",
            validateActivity: (code) => code.includes("vh") || code.includes("vw")
          },
          {
            id: 224, title: "Mobile-First Patterns", difficulty: "Advanced", xp: 80,
            description: "Start with a single-column mobile layout and progressively enhance for larger screens.",
            steps: ["Default styles target mobile screens.", "Use min-width media queries to add complexity.", "This approach is simpler and more robust."],
            code: ".grid { display: flex; flex-direction: column; gap: 12px; }\n@media (min-width: 768px) {\n  .grid { display: grid; grid-template-columns: 1fr 1fr; }\n}",
            activityPrompt: "Create a mobile-first layout: single column by default, two columns above 768px.",
            activityStarter: ".layout {\n  /* default: single column */\n}\n\n@media (min-width: 768px) {\n  .layout {\n    /* two columns */\n  }\n}",
            activityHint: "Default: display: flex; flex-direction: column; Above 768px: display: grid; grid-template-columns: 1fr 1fr;",
            validateActivity: (code) => code.includes("@media") && code.includes("grid-template-columns")
          }
        ]
      }
    ];
  }

  function getCSSQuizData() {
    const lessons = getCSSLessonData();
    const allTopics = lessons.flatMap((lesson) => lesson.topics.map((topic) => topic.title));
    const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];

    return lessons.map((lesson) => {
      const unlocked = lesson.topics.every((topic) => appState.completedLessons.includes(topic.id));
      const completed = appState.completedQuizzes.includes(lesson.id);
      const questions = lesson.topics.slice(0, 3).map((topic, index) => {
        const correctXp = topic.xp;
        const xpOptions = Array.from(new Set([correctXp, correctXp - 10, correctXp + 10, correctXp + 20])).filter((value) => value > 0).slice(0, 4);
        const topicOptions = Array.from(new Set([
          topic.title,
          ...allTopics.filter((title) => title !== topic.title).slice(index * 2, index * 2 + 3)
        ])).slice(0, 4);

        if (index === 0) {
          return {
            question: `Which topic belongs to the "${lesson.title}" lesson group?`,
            options: topicOptions,
            answer: topic.title
          };
        }

        if (index === 1) {
          return {
            question: `How much XP does "${topic.title}" reward when completed?`,
            options: xpOptions.map((value) => `${value} XP`),
            answer: `${correctXp} XP`
          };
        }

        return {
          question: `What difficulty level is "${topic.title}"?`,
          options: difficultyOptions,
          answer: topic.difficulty
        };
      });

      return {
        id: lesson.id,
        title: `${lesson.title} Quiz`,
        group: "css",
        difficulty: lesson.difficulty,
        intro: `Answer these CSS questions to prove you understood the ${lesson.title.toLowerCase()} lesson topics.`,
        unlocked,
        completed,
        lessonTitle: lesson.title,
        questionCount: questions.length,
        questions
      };
    });
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

  let pendingEmailCode = "";
  let pendingEmailExpiresAt = 0;
  let pendingPhoneCode = "";
  let pendingPhoneExpiresAt = 0;

  function setAccountStatus(message) {
    const element = document.getElementById("accountStatus");
    if (element) {
      element.textContent = message;
    }
  }

  function setVerifyHelp(id, message) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = message;
    }
  }

  function setVerifyBadge(id, verified) {
    const badge = document.getElementById(id);
    if (!badge) {
      return;
    }
    badge.textContent = verified ? "Verified" : "Unverified";
    badge.classList.toggle("verified", verified);
  }

  function renderVerificationUI() {
    setVerifyBadge("emailVerifyBadge", appState.emailVerified);
    setVerifyBadge("phoneVerifyBadge", appState.phoneVerified);

    const emailActions = document.getElementById("emailVerifyActions");
    if (emailActions) {
      emailActions.style.display = appState.emailVerified ? "none" : "";
    }
  }

  function clearPendingEmailVerification() {
    pendingEmailCode = "";
    pendingEmailExpiresAt = 0;
    const input = document.getElementById("emailVerifyCode");
    if (input) input.value = "";
    setVerifyHelp("emailVerifyHelp", "");
  }

  function clearPendingPhoneVerification() {
    pendingPhoneCode = "";
    pendingPhoneExpiresAt = 0;
    const input = document.getElementById("phoneVerifyCode");
    if (input) input.value = "";
    setVerifyHelp("phoneVerifyHelp", "");
  }

  function generateSixDigitCode() {
    const digits = new Uint32Array(1);
    crypto.getRandomValues(digits);
    return String(digits[0] % 1000000).padStart(6, "0");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  }

  function normalizePhone(value) {
    return formatPhoneForDisplay(value);
  }

  function isValidPhone(value) {
    const normalized = normalizePhone(value);
    return /^09\d{9}$/.test(normalized);
  }

  function sendEmailVerificationCode() {
    if (!firebaseState.services?.configured) {
      setVerifyHelp("emailVerifyHelp", getFirebaseConfigError());
      return;
    }

    const authUser = firebaseState.user;
    const email = authUser?.email || appState.email;
    if (!authUser || !email || !isValidEmail(email)) {
      setVerifyHelp("emailVerifyHelp", "Sign in with a valid email first.");
      return;
    }

    firebaseState.services.helpers.sendEmailVerification(authUser)
      .then(() => {
        setVerifyHelp("emailVerifyHelp", "Verification email sent. Refresh after confirming it from your inbox.");
        showNotification("Verification email sent", "info");
      })
      .catch((error) => {
        setVerifyHelp("emailVerifyHelp", error.message || "Unable to send verification email right now.");
      });
  }

  function verifyEmailCode() {
    setVerifyHelp("emailVerifyHelp", "Use the link in your verification email, then sign out and back in to refresh your status.");
  }

  function sendPhoneVerificationCode() {
    const phone = appState.phone || document.getElementById("phone")?.value.trim();
    if (!phone || !isValidPhone(phone)) {
      setVerifyHelp("phoneVerifyHelp", "Enter an 11-digit mobile number that starts with 09, then press Send Code.");
      return;
    }

    pendingPhoneCode = generateSixDigitCode();
    pendingPhoneExpiresAt = Date.now() + 5 * 60 * 1000;
    setVerifyHelp("phoneVerifyHelp", `Code generated for ${normalizePhone(phone)}. Enter the 6-digit code to verify.`);
    showNotification(`Phone code sent (demo): ${pendingPhoneCode}`, "info");
  }

  function verifyPhoneCode() {
    if (!pendingPhoneCode || Date.now() > pendingPhoneExpiresAt) {
      clearPendingPhoneVerification();
      setVerifyHelp("phoneVerifyHelp", "Code expired. Send a new code.");
      return;
    }

    const input = document.getElementById("phoneVerifyCode")?.value.trim() || "";
    if (input !== pendingPhoneCode) {
      setVerifyHelp("phoneVerifyHelp", "Incorrect code. Try again.");
      return;
    }

    appState.phoneVerified = true;
    clearPendingPhoneVerification();
    saveCurrentAccount();
    saveState();
    renderVerificationUI();
    setVerifyHelp("phoneVerifyHelp", "Phone verified.");
    showNotification("Phone verified", "info");
  }

  async function changePassword() {
    setAccountStatus("");
    if (!isAuthenticated() || !firebaseState.services?.configured || !firebaseState.user?.email) {
      setAccountStatus("Login first to change password.");
      return;
    }

    const current = document.getElementById("currentPassword")?.value || "";
    const next = document.getElementById("newPassword")?.value || "";
    const confirm = document.getElementById("confirmNewPassword")?.value || "";

    if (!current || next.length < 6 || next !== confirm) {
      setAccountStatus("Fill the form and make sure passwords match (6+ chars).");
      return;
    }

    try {
      const { helpers } = firebaseState.services;
      const credential = helpers.EmailAuthProvider.credential(firebaseState.user.email, current);
      await helpers.reauthenticateWithCredential(firebaseState.user, credential);
      await helpers.updatePassword(firebaseState.user, next);
      setAccountStatus("Password updated.");
      showNotification("Password changed", "info");
    } catch (error) {
      setAccountStatus(error.message || "Unable to change your password right now.");
      return;
    }

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmNewPassword").value = "";
  }

  function exportAccountData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: appState.user,
      state: serializeStateForCloud()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codelab-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setAccountStatus("Exported account data.");
  }

  function clearLocalData() {
    setAccountStatus("");
    const ok = confirm("This will clear local browser cache for CodeLab on this device. Your synced Firebase data will remain in Firestore. Continue?");
    if (!ok) {
      return;
    }
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (error) {
      console.error(error);
    }
    location.reload();
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

  async function login() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const status = document.getElementById("loginStatus");

    if (!username || !password) {
      status.textContent = "Enter your email and password.";
      return;
    }

    if (!firebaseState.services?.configured) {
      status.textContent = getFirebaseConfigError();
      return;
    }

    setAuthBusy("login", true);
    try {
      const { helpers } = firebaseState.services;
      await helpers.signInWithEmailAndPassword(firebaseState.services.auth, username, password);
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message || "Invalid email or password.";
    } finally {
      setAuthBusy("login", false);
    }
  }

  async function register() {
    const username = document.getElementById("signupUsername").value.trim();
    const nickname = document.getElementById("signupNickname").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const confirm = document.getElementById("signupConfirm").value.trim();
    const status = document.getElementById("signupStatus");

    if (!isValidEmail(username) || !nickname || password.length < 6 || password !== confirm) {
      status.textContent = "Please complete the form with a valid email and matching passwords.";
      return;
    }

    if (!firebaseState.services?.configured) {
      status.textContent = getFirebaseConfigError();
      return;
    }

    setAuthBusy("signup", true);
    try {
      const { auth, helpers } = firebaseState.services;
      const credential = await helpers.createUserWithEmailAndPassword(auth, username, password);
      firebaseState.user = credential.user;
      resetAppState();
      applyAccountToState({
        username,
        nickname,
        email: username,
        bio: defaultAppState.bio,
        avatarChoice: "wave",
        customAvatar: ""
      }, credential.user);
      await helpers.setDoc(
        helpers.doc(firebaseState.services.db, "users", credential.user.uid),
        {
          ...serializeStateForCloud(),
          meta: {
            createdAt: helpers.serverTimestamp(),
            lastSyncedAt: helpers.serverTimestamp()
          }
        },
        { merge: true }
      );
      status.textContent = "";
      document.getElementById("signupUsername").value = "";
      document.getElementById("signupNickname").value = "";
      document.getElementById("signupPassword").value = "";
      document.getElementById("signupConfirm").value = "";
      showNotification("Account created successfully", "info");
    } catch (error) {
      status.textContent = error.message || "Unable to create the account right now.";
    } finally {
      setAuthBusy("signup", false);
    }
  }

  async function logout() {
    const settings = document.getElementById("settings");
    const overlay = document.getElementById("settingsOverlay");
    settings?.classList.remove("open");
    overlay?.classList.remove("open");
    settings?.setAttribute("aria-hidden", "true");
    overlay?.setAttribute("aria-hidden", "true");
    if (firebaseState.services?.configured) {
      await firebaseState.services.helpers.signOut(firebaseState.services.auth);
    } else {
      resetAppState();
      firebaseState.user = null;
      showAuthInterface();
    }
    showNotification("Signed out successfully", "info");
  }

  function forgotPassword() {
    document.getElementById("forgotPasswordModal").style.display = "flex";
  }

  function closeForgotPasswordModal() {
    document.getElementById("forgotPasswordModal").style.display = "none";
  }

  async function sendResetCode() {
    const value = document.getElementById("forgotEmailLRN").value.trim();
    const status = document.getElementById("forgotStatus");
    const button = document.getElementById("resetPasswordButton");
    if (!value) {
      status.textContent = "Enter your account email first.";
      return;
    }
    if (!isValidEmail(value)) {
      status.textContent = "Enter a valid email address.";
      return;
    }
    if (!firebaseState.services?.configured) {
      status.textContent = getFirebaseConfigError();
      return;
    }

    status.textContent = "Sending reset link...";
    if (button) {
      button.disabled = true;
      button.classList.add("is-loading");
    }

    try {
      const auth = firebaseState.services.auth;
      auth.languageCode = navigator.language || "en";
      await firebaseState.services.helpers.sendPasswordResetEmail(auth, value);
      status.textContent = "If that email is registered, we sent a password reset link. Check your inbox and spam/junk folder.";
      showNotification("Password reset request sent", "info");
    } catch (error) {
      console.error("Password reset error:", error);
      status.textContent = error.message || "Unable to send reset email.";
    } finally {
      if (button) {
        button.disabled = false;
        button.classList.remove("is-loading");
      }
    }
  }

  function showGamesMode(mode) {
    document.querySelectorAll(".games-tabs .editor-tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".game-section").forEach((s) => s.classList.remove("active"));
    document.querySelector(`.games-tabs .editor-tab[onclick*="'${mode}'"]`)?.classList.add("active");
    const el = document.getElementById(`games${mode.charAt(0).toUpperCase()}${mode.slice(1)}`);
    if (el) el.classList.add("active");
  }

  function playCorrectChime() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    const now = audioContext.currentTime;
    const mg = audioContext.createGain();
    mg.gain.setValueAtTime(0.0001, now);
    mg.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    mg.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    mg.connect(audioContext.destination);
    const lead = audioContext.createOscillator();
    lead.type = "sine";
    lead.frequency.setValueAtTime(880, now);
    lead.frequency.exponentialRampToValueAtTime(1320, now + 0.16);
    lead.connect(mg);
    lead.start(now);
    lead.stop(now + 0.22);
    const sparkle = audioContext.createOscillator();
    sparkle.type = "triangle";
    sparkle.frequency.setValueAtTime(1760, now + 0.06);
    sparkle.frequency.exponentialRampToValueAtTime(2200, now + 0.24);
    sparkle.connect(mg);
    sparkle.start(now + 0.06);
    sparkle.stop(now + 0.28);
  }

  function playWrongBuzz() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    const now = audioContext.currentTime;
    const mg = audioContext.createGain();
    mg.gain.setValueAtTime(0.0001, now);
    mg.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    mg.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    mg.connect(audioContext.destination);
    const osc = audioContext.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
    osc.connect(mg);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function makeQuestion(cat, diff, text, correct, wrong, code = "") {
    const opts = shuffleArray([correct, ...wrong]);
    return { category: cat, difficulty: diff, question: text, code, options: opts, answer: opts.indexOf(correct) };
  }

  function makeBugQuestion(cat, diff, code, buggyLine, fixLabel, correctFix, wrongFixes, explanation) {
    const opts = shuffleArray([correctFix, ...wrongFixes]);
    return { category: cat, difficulty: diff, code, buggyLine, fixLabel, options: opts, answer: opts.indexOf(correctFix), explanation };
  }

  const sprintTemplates = [
    // HTML - Beginner
    { cat: "html", diff: "beginner", q: "Which tag creates the largest heading?", c: "&lt;h1&gt;", w: ["&lt;h6&gt;", "&lt;heading&gt;", "&lt;head&gt;"] },
    { cat: "html", diff: "beginner", q: "Which tag creates a paragraph?", c: "&lt;p&gt;", w: ["&lt;para&gt;", "&lt;text&gt;", "&lt;div&gt;"] },
    { cat: "html", diff: "beginner", q: "Which tag creates a hyperlink?", c: "&lt;a&gt;", w: ["&lt;link&gt;", "&lt;href&gt;", "&lt;nav&gt;"] },
    { cat: "html", diff: "beginner", q: "Which tag displays an image?", c: "&lt;img&gt;", w: ["&lt;image&gt;", "&lt;pic&gt;", "&lt;src&gt;"] },
    { cat: "html", diff: "beginner", q: "Which tag is the root element of an HTML document?", c: "&lt;html&gt;", w: ["&lt;body&gt;", "&lt;head&gt;", "&lt;root&gt;"] },
    { cat: "html", diff: "beginner", q: "Which tag defines a line break?", c: "&lt;br&gt;", w: ["&lt;hr&gt;", "&lt;lb&gt;", "&lt;break&gt;"] },
    { cat: "html", diff: "beginner", q: "Which tag creates a horizontal rule?", c: "&lt;hr&gt;", w: ["&lt;br&gt;", "&lt;line&gt;", "&lt;rule&gt;"] },
    { cat: "html", diff: "beginner", q: "Which tag is used for bold text?", c: "&lt;strong&gt;", w: ["&lt;bold&gt;", "&lt;b&gt;", "&lt;em&gt;"] },
    { cat: "html", diff: "beginner", q: "Which tag creates an unordered list?", c: "&lt;ul&gt;", w: ["&lt;ol&gt;", "&lt;li&gt;", "&lt;list&gt;"] },
    { cat: "html", diff: "beginner", q: "Which tag creates a list item?", c: "&lt;li&gt;", w: ["&lt;ul&gt;", "&lt;ol&gt;", "&lt;item&gt;"] },
    // HTML - Intermediate
    { cat: "html", diff: "intermediate", q: "Which semantic tag represents navigation links?", c: "&lt;nav&gt;", w: ["&lt;menu&gt;", "&lt;links&gt;", "&lt;aside&gt;"] },
    { cat: "html", diff: "intermediate", q: "Which tag is used for an unordered list?", c: "&lt;ul&gt;", w: ["&lt;ol&gt;", "&lt;li&gt;", "&lt;list&gt;"] },
    { cat: "html", diff: "intermediate", q: "Which attribute specifies the URL for a link?", c: "href", w: ["src", "link", "url"], code: "&lt;a ________=\"https://...\"&gt;click&lt;/a&gt;" },
    { cat: "html", diff: "intermediate", q: "Which element creates a drop-down list?", c: "&lt;select&gt;", w: ["&lt;dropdown&gt;", "&lt;list&gt;", "&lt;input&gt;"] },
    { cat: "html", diff: "intermediate", q: "Which tag adds a line break?", c: "&lt;br&gt;", w: ["&lt;hr&gt;", "&lt;lb&gt;", "&lt;break&gt;"] },
    { cat: "html", diff: "intermediate", q: "Which attribute links a label to an input?", c: "for", w: ["id", "name", "target"] },
    { cat: "html", diff: "intermediate", q: "Which element is used for a checkbox?", c: "&lt;input type=\"checkbox\"&gt;", w: ["&lt;checkbox&gt;", "&lt;input type=\"radio\"&gt;", "&lt;check&gt;"] },
    { cat: "html", diff: "intermediate", q: "Which tag defines a table row?", c: "&lt;tr&gt;", w: ["&lt;td&gt;", "&lt;th&gt;", "&lt;row&gt;"] },
    { cat: "html", diff: "intermediate", q: "Which tag defines a table header cell?", c: "&lt;th&gt;", w: ["&lt;td&gt;", "&lt;tr&gt;", "&lt;thead&gt;"] },
    { cat: "html", diff: "intermediate", q: "Which attribute sets the image source?", c: "src", w: ["href", "alt", "link"] },
    // HTML - Advanced
    { cat: "html", diff: "advanced", q: "Which ARIA attribute hides an element from screen readers?", c: "aria-hidden", w: ["aria-label", "role", "tabindex"] },
    { cat: "html", diff: "advanced", q: "Which element embeds external content like a page?", c: "&lt;iframe&gt;", w: ["&lt;embed&gt;", "&lt;object&gt;", "&lt;portal&gt;"] },
    { cat: "html", diff: "advanced", q: "Which tag represents self-contained content like a blog post?", c: "&lt;article&gt;", w: ["&lt;section&gt;", "&lt;div&gt;", "&lt;main&gt;"] },
    { cat: "html", diff: "advanced", q: "Which input type shows a calendar picker?", c: "date", w: ["calendar", "time", "datetime"] },
    { cat: "html", diff: "advanced", q: "Which tag defines a caption for a figure?", c: "&lt;figcaption&gt;", w: ["&lt;caption&gt;", "&lt;legend&gt;", "&lt;label&gt;"] },
    { cat: "html", diff: "advanced", q: "Which attribute enables drag-and-drop?", c: "draggable", w: ["drag", "drop", "movable"] },
    { cat: "html", diff: "advanced", q: "Which element represents a progress bar?", c: "&lt;progress&gt;", w: ["&lt;meter&gt;", "&lt;bar&gt;", "&lt;status&gt;"] },
    { cat: "html", diff: "advanced", q: "Which attribute makes an input required?", c: "required", w: ["mandatory", "must", "validate"] },
    { cat: "html", diff: "advanced", q: "Which element specifies a media source for video/audio?", c: "&lt;source&gt;", w: ["&lt;src&gt;", "&lt;media&gt;", "&lt;track&gt;"] },
    { cat: "html", diff: "advanced", q: "Which attribute opens a link in a new tab?", c: "target=\"_blank\"", w: ["target=\"_new\"", "href=\"_blank\"", "rel=\"external\""] },
    // CSS - Beginner
    { cat: "css", diff: "beginner", q: "Which property changes text color?", c: "color", w: ["font-color", "text-color", "foreground"] },
    { cat: "css", diff: "beginner", q: "Which property sets text size?", c: "font-size", w: ["text-size", "size", "font-height"] },
    { cat: "css", diff: "beginner", q: "Which value makes text bold?", c: "bold", w: ["strong", "bolder", "heavy"] },
    { cat: "css", diff: "beginner", q: "Which property adds space inside an element?", c: "padding", w: ["margin", "gap", "spacing"] },
    { cat: "css", diff: "beginner", q: "Which property adds space outside an element?", c: "margin", w: ["padding", "border", "gap"] },
    { cat: "css", diff: "beginner", q: "Which property sets background color?", c: "background-color", w: ["color", "bg-color", "fill"] },
    { cat: "css", diff: "beginner", q: "Which property sets element width?", c: "width", w: ["size", "max-width", "span"] },
    { cat: "css", diff: "beginner", q: "Which property sets element height?", c: "height", w: ["size", "min-height", "length"] },
    { cat: "css", diff: "beginner", q: "Which unit is relative to the parent font-size?", c: "em", w: ["px", "rem", "%"] },
    { cat: "css", diff: "beginner", q: "Which property hides an element but keeps its space?", c: "visibility: hidden", w: ["display: none", "opacity: 0", "hidden"] },
    // CSS - Intermediate
    { cat: "css", diff: "intermediate", q: "Which display value creates a flex container?", c: "flex", w: ["block", "inline", "grid"] },
    { cat: "css", diff: "intermediate", q: "Which property centers a flex child vertically?", c: "align-items", w: ["justify-content", "text-align", "vertical-align"] },
    { cat: "css", diff: "intermediate", q: "Which property makes corners round?", c: "border-radius", w: ["corner-radius", "round", "border-style"] },
    { cat: "css", diff: "intermediate", q: "Which position value removes element from normal flow?", c: "absolute", w: ["relative", "fixed", "static"] },
    { cat: "css", diff: "intermediate", q: "Which layout mode is best for a two-dimensional grid?", c: "grid", w: ["flexbox", "table", "inline-block"] },
    { cat: "css", diff: "intermediate", q: "Which property centers a flex child horizontally?", c: "justify-content", w: ["align-items", "text-align", "margin"] },
    { cat: "css", diff: "intermediate", q: "Which property adds space between flex/grid items?", c: "gap", w: ["spacing", "margin", "padding"] },
    { cat: "css", diff: "intermediate", q: "Which property sets the font?", c: "font-family", w: ["font-style", "font-face", "typeface"] },
    { cat: "css", diff: "intermediate", q: "Which property underlines text?", c: "text-decoration: underline", w: ["font-style: underline", "border-bottom", "underline"] },
    { cat: "css", diff: "intermediate", q: "Which pseudo-class targets a hovered element?", c: ":hover", w: [":active", ":focus", ":target"] },
    // CSS - Advanced
    { cat: "css", diff: "advanced", q: "Which at-rule creates responsive breakpoints?", c: "@media", w: ["@import", "@font-face", "@keyframes"] },
    { cat: "css", diff: "advanced", q: "Which function creates animations?", c: "@keyframes", w: ["@animate", "animation()", "transition()"] },
    { cat: "css", diff: "advanced", q: "Which property stacks elements on the z-axis?", c: "z-index", w: ["stack-order", "z-order", "layer"] },
    { cat: "css", diff: "advanced", q: "Which pseudo-class targets the first child?", c: ":first-child", w: [":first", ":nth(1)", ":first-of-type"] },
    { cat: "css", diff: "advanced", q: "Which function calculates a value dynamically?", c: "calc()", w: ["compute()", "math()", "eval()"] },
    { cat: "css", diff: "advanced", q: "Which property creates a CSS animation?", c: "animation", w: ["transition", "transform", "move"] },
    { cat: "css", diff: "advanced", q: "Which value of position sticks on scroll?", c: "sticky", w: ["fixed", "absolute", "relative"] },
    { cat: "css", diff: "advanced", q: "Which filter property blurs an element?", c: "blur()", w: ["opacity()", "saturate()", "brightness()"] },
    { cat: "css", diff: "advanced", q: "Which pseudo-element selects the first line?", c: "::first-line", w: [":first-line", "::first-letter", ":before"] },
    { cat: "css", diff: "advanced", q: "Which function repeats grid tracks?", c: "repeat()", w: ["auto-fill", "minmax()", "grid-track()"] },
    // JS - Beginner
    { cat: "js", diff: "beginner", q: "Which keyword declares a block-scoped variable?", c: "let", w: ["var", "const", "int"] },
    { cat: "js", diff: "beginner", q: "Which method prints to the console?", c: "console.log()", w: ["print()", "log()", "echo()"] },
    { cat: "js", diff: "beginner", q: "Which data type is true or false?", c: "boolean", w: ["string", "number", "null"] },
    { cat: "js", diff: "beginner", q: "Which operator checks strict equality?", c: "===", w: ["==", "=", "!="] },
    { cat: "js", diff: "beginner", q: "Which keyword defines a function?", c: "function", w: ["def", "fn", "func"] },
    { cat: "js", diff: "beginner", q: "Which symbol creates a single-line comment?", c: "//", w: ["/*", "#", "--"] },
    { cat: "js", diff: "beginner", q: "Which data type represents a whole number?", c: "number", w: ["int", "integer", "float"] },
    { cat: "js", diff: "beginner", q: "Which keyword declares a constant?", c: "const", w: ["let", "var", "final"] },
    { cat: "js", diff: "beginner", q: "Which value represents nothing?", c: "null", w: ["undefined", "NaN", "0"] },
    { cat: "js", diff: "beginner", q: "Which operator adds two numbers?", c: "+", w: ["&", "++", "="] },
    // JS - Intermediate
    { cat: "js", diff: "intermediate", q: "Which method adds an element to the end of an array?", c: "push()", w: ["pop()", "shift()", "unshift()"] },
    { cat: "js", diff: "intermediate", q: "Which loop runs at least once?", c: "do...while", w: ["while", "for", "for...in"] },
    { cat: "js", diff: "intermediate", q: "Which method transforms every element in an array?", c: "map()", w: ["filter()", "reduce()", "forEach()"] },
    { cat: "js", diff: "intermediate", q: "Which object holds URL query parameters?", c: "URLSearchParams", w: ["URL", "QueryString", "Location"] },
    { cat: "js", diff: "intermediate", q: "Which syntax creates an arrow function?", c: "() =>", w: ["function()", "=>()", "def() =>"] },
    { cat: "js", diff: "intermediate", q: "Which method removes the last element from an array?", c: "pop()", w: ["push()", "shift()", "slice()"] },
    { cat: "js", diff: "intermediate", q: "Which method checks if an array includes a value?", c: "includes()", w: ["contains()", "has()", "indexOf()"] },
    { cat: "js", diff: "intermediate", q: "Which statement handles errors?", c: "try...catch", w: ["if...else", "error()", "throw...catch"] },
    { cat: "js", diff: "intermediate", q: "Which method creates a new array with filtered elements?", c: "filter()", w: ["map()", "reduce()", "find()"] },
    { cat: "js", diff: "intermediate", q: "Which operator spreads an array?", c: "...", w: ["..", "**", "&"] },
    // JS - Advanced
    { cat: "js", diff: "advanced", q: "Which API handles HTTP requests natively?", c: "fetch()", w: ["XMLHttpRequest", "http.get()", "request()"] },
    { cat: "js", diff: "advanced", q: "Which keyword handles asynchronous operations?", c: "async", w: ["await", "promise", "yield"] },
    { cat: "js", diff: "advanced", q: "Which method creates a new Promise?", c: "new Promise()", w: ["Promise.create()", "Promise.new()", "new Async()"] },
    { cat: "js", diff: "advanced", q: "Which object provides browser storage?", c: "localStorage", w: ["cookieStore", "cache", "storage"] },
    { cat: "js", diff: "advanced", q: "Which method parses a JSON string?", c: "JSON.parse()", w: ["JSON.stringify()", "JSON.decode()", "parseJSON()"] },
    { cat: "js", diff: "advanced", q: "Which method converts an object to JSON?", c: "JSON.stringify()", w: ["JSON.parse()", "JSON.encode()", "toJSON()"] },
    { cat: "js", diff: "advanced", q: "Which pattern handles async code without callbacks?", c: "Promise", w: ["async", "callback", "observer"] },
    { cat: "js", diff: "advanced", q: "Which method stops event propagation?", c: "stopPropagation()", w: ["preventDefault()", "stop()", "cancelBubble"] },
    { cat: "js", diff: "advanced", q: "Which object represents the browser window?", c: "window", w: ["document", "global", "self"] },
    { cat: "js", diff: "advanced", q: "Which method runs a function after a delay?", c: "setTimeout()", w: ["setInterval()", "delay()", "wait()"] },
  ];

  function generateSprintQuestions(category, difficulty, count = 30) {
    let pool = [...sprintTemplates];
    if (category !== "all") pool = pool.filter((t) => t.cat === category);
    if (difficulty !== "all") pool = pool.filter((t) => t.diff === difficulty);
    shuffleArray(pool);
    const selected = pool.slice(0, Math.min(count, pool.length));
    return selected.map((t) => makeQuestion(t.cat, t.diff, t.q, t.c, t.w, t.code || ""));
  }

  function renderSprintIntro() {
    const area = document.getElementById("sprintArea");
    area.innerHTML = `\
<div class="sprint-setup">
  <h5>Code Sprint</h5>
  <p>Answer as many HTML, CSS, and JS questions as you can before losing all 3 lives. Build streaks for bonus points!</p>
  <div class="game-config">
    <label>Category
      <select id="sprintCategory">
        <option value="all">All Categories</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="js">JavaScript</option>
      </select>
    </label>
    <label>Difficulty
      <select id="sprintDifficulty">
        <option value="all">All Levels</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </label>
  </div>
  <button class="btn-primary" onclick="startSprint()">▶ Start Sprint</button>
</div>`;
  }

  function renderSprintGame() {
    const q = sprintState.questions[sprintState.questionIndex];
    if (!q) { finishSprint(); return; }
    const area = document.getElementById("sprintArea");
    const hearts = "❤️".repeat(sprintState.lives) + "🖤".repeat(Math.max(0, 3 - sprintState.lives));
    const pct = sprintState.timeLeft / 15 * 100;
    area.innerHTML = `\
<div class="sprint-hud">
  <span>${hearts}</span>
  <span>Score: ${sprintState.score}</span>
  <span>Streak: ${sprintState.streak}🔥</span>
  <span>Q ${sprintState.questionIndex + 1}/${sprintState.totalQuestions}</span>
</div>
<div class="sprint-timer-bar">
  <div id="sprintTimerFill" style="width: ${pct}%"></div>
</div>
<div class="sprint-question">
  <div class="sprint-q-badge">${q.category.toUpperCase()} · ${q.difficulty}</div>
  <p class="sprint-q-text">${q.question}</p>
  ${q.code ? `<pre class="code-block sprint-code"><code>${q.code}</code></pre>` : ""}
  <div class="sprint-options" id="sprintOptions">
    ${q.options.map((opt, i) => `<button class="sprint-opt" onclick="answerSprint(${i})">${opt}</button>`).join("")}
  </div>
</div>`;
  }

  function renderSprintResult() {
    const pct = sprintState.totalQuestions ? Math.round((sprintState.totalCorrect / sprintState.totalQuestions) * 100) : 0;
    document.getElementById("sprintArea").innerHTML = `\
<div class="sprint-result">
  <h5>${sprintState.lives > 0 ? "🎉 Sprint Complete!" : "💀 Game Over"}</h5>
  <div class="sprint-result-stats">
    <div class="stat-card"><span>Score</span><strong>${sprintState.score}</strong></div>
    <div class="stat-card"><span>Correct</span><strong>${sprintState.totalCorrect}/${sprintState.totalQuestions}</strong></div>
    <div class="stat-card"><span>Accuracy</span><strong>${pct}%</strong></div>
    <div class="stat-card"><span>Best Streak</span><strong>${sprintState.maxStreak}</strong></div>
  </div>
  <p>${sprintState.score > 0 ? `Earned +${sprintState.score} XP!` : "Try again to earn XP."}</p>
  <button class="btn-primary" onclick="startSprint()">▶ Play Again</button>
  <button class="btn-secondary" onclick="renderSprintIntro()">← Change Settings</button>
</div>`;
  }

  function startSprint() {
    const cat = document.getElementById("sprintCategory")?.value || "all";
    const diff = document.getElementById("sprintDifficulty")?.value || "all";
    const qs = generateSprintQuestions(cat, diff, 30);
    if (qs.length < 3) {
      showNotification("Not enough questions for this filter. Try a broader selection.", "warning");
      return;
    }
    sprintState = { category: cat, difficulty: diff, lives: 3, score: 0, streak: 0, maxStreak: 0, questionIndex: 0, questions: qs, timer: null, timeLeft: 15, active: true, finished: false, totalCorrect: 0, totalQuestions: qs.length, answered: false };
    sprintState.timeLeft = 15;
    renderSprintGame();
    sprintState.timer = setInterval(() => {
      if (!sprintState.active) return;
      sprintState.timeLeft--;
      const fill = document.getElementById("sprintTimerFill");
      if (fill) fill.style.width = `${sprintState.timeLeft / 15 * 100}%`;
      if (sprintState.timeLeft <= 0) {
        sprintState.lives--;
        sprintState.streak = 0;
        sprintState.answered = true;
        playWrongBuzz();
        const opts = document.querySelectorAll(".sprint-opt");
        opts.forEach((b, i) => { b.disabled = true; if (i === sprintState.questions[sprintState.questionIndex].answer) b.classList.add("correct"); });
        setTimeout(() => nextSprintQuestion(), 1200);
      }
    }, 1000);
  }

  function answerSprint(choice) {
    if (!sprintState.active || sprintState.answered) return;
    sprintState.answered = true;
    const q = sprintState.questions[sprintState.questionIndex];
    const correct = choice === q.answer;
    const opts = document.querySelectorAll(".sprint-opt");
    opts.forEach((b, i) => { b.disabled = true; if (i === q.answer) b.classList.add("correct"); if (i === choice && !correct) b.classList.add("wrong"); });
    if (correct) {
      sprintState.streak++;
      sprintState.maxStreak = Math.max(sprintState.maxStreak, sprintState.streak);
      sprintState.score += 10 + (sprintState.streak - 1) * 2;
      sprintState.totalCorrect++;
      playCorrectChime();
    } else {
      sprintState.lives--;
      sprintState.streak = 0;
      playWrongBuzz();
    }
    clearInterval(sprintState.timer);
    if (sprintState.lives <= 0) {
      setTimeout(() => finishSprint(), 800);
    } else {
      setTimeout(() => nextSprintQuestion(), 1000);
    }
  }

  function nextSprintQuestion() {
    sprintState.questionIndex++;
    if (sprintState.questionIndex >= sprintState.totalQuestions) { finishSprint(); return; }
    sprintState.answered = false;
    sprintState.timeLeft = 15;
    renderSprintGame();
    clearInterval(sprintState.timer);
    sprintState.timer = setInterval(() => {
      if (!sprintState.active) return;
      sprintState.timeLeft--;
      const fill = document.getElementById("sprintTimerFill");
      if (fill) fill.style.width = `${sprintState.timeLeft / 15 * 100}%`;
      if (sprintState.timeLeft <= 0) {
        sprintState.lives--;
        sprintState.streak = 0;
        sprintState.answered = true;
        playWrongBuzz();
        const opts = document.querySelectorAll(".sprint-opt");
        opts.forEach((b, i) => { b.disabled = true; if (i === sprintState.questions[sprintState.questionIndex].answer) b.classList.add("correct"); });
        if (sprintState.lives <= 0) { setTimeout(() => finishSprint(), 800); } else { setTimeout(() => nextSprintQuestion(), 1200); }
      }
    }, 1000);
  }

  function finishSprint() {
    clearInterval(sprintState.timer);
    sprintState.active = false;
    sprintState.finished = true;
    const xpGain = sprintState.score;
    if (xpGain > 0) {
      appState.xp += xpGain;
      logXpEarned(xpGain);
      showXpPopup(xpGain);
    }
    appState.sprintHighScore = Math.max(appState.sprintHighScore || 0, sprintState.score);
    renderSprintResult();
    updateDashboard();
  }

  const linkUpData = [
    { category: "html", left: "&lt;h1&gt;", right: "Main page heading" },
    { category: "html", left: "&lt;p&gt;", right: "Paragraph of text" },
    { category: "html", left: "&lt;a&gt;", right: "Hyperlink to another page" },
    { category: "html", left: "&lt;img&gt;", right: "Displays an image" },
    { category: "html", left: "&lt;nav&gt;", right: "Navigation links area" },
    { category: "html", left: "&lt;main&gt;", right: "Primary page content" },
    { category: "html", left: "&lt;footer&gt;", right: "Bottom section of page" },
    { category: "html", left: "&lt;form&gt;", right: "Collects user input" },
    { category: "html", left: "&lt;table&gt;", right: "Tabular data container" },
    { category: "html", left: "&lt;button&gt;", right: "Clickable action element" },
    { category: "html", left: "&lt;br&gt;", right: "Inserts a line break" },
    { category: "html", left: "&lt;hr&gt;", right: "Horizontal separator line" },
    { category: "html", left: "&lt;strong&gt;", right: "Bold / important text" },
    { category: "html", left: "&lt;em&gt;", right: "Emphasized / italic text" },
    { category: "html", left: "&lt;ul&gt;", right: "Unordered bullet list" },
    { category: "html", left: "&lt;ol&gt;", right: "Ordered numbered list" },
    { category: "html", left: "&lt;li&gt;", right: "Individual list item" },
    { category: "html", left: "&lt;div&gt;", right: "Generic block container" },
    { category: "html", left: "&lt;span&gt;", right: "Generic inline container" },
    { category: "html", left: "&lt;section&gt;", right: "Thematic content group" },
    { category: "css", left: "color: red", right: "Sets text color" },
    { category: "css", left: "display: flex", right: "Flexbox layout mode" },
    { category: "css", left: "margin: auto", right: "Centers block elements" },
    { category: "css", left: "font-size: 16px", right: "Sets text size" },
    { category: "css", left: "background-color", right: "Element background color" },
    { category: "css", left: "border-radius", right: "Rounds element corners" },
    { category: "css", left: "padding: 10px", right: "Space inside element" },
    { category: "css", left: "position: absolute", right: "Removes from document flow" },
    { category: "css", left: "z-index: 100", right: "Stacking order control" },
    { category: "css", left: "@media", right: "Responsive breakpoint rule" },
    { category: "css", left: "font-weight: bold", right: "Makes text thicker" },
    { category: "css", left: "text-align: center", right: "Centers inline content" },
    { category: "css", left: "box-shadow", right: "Adds drop shadow to element" },
    { category: "css", left: "display: grid", right: "Two-dimensional grid layout" },
    { category: "css", left: "overflow: hidden", right: "Clips overflowing content" },
    { category: "css", left: "cursor: pointer", right: "Hand cursor on hover" },
    { category: "css", left: "opacity: 0.5", right: "Sets element transparency" },
    { category: "css", left: "border: 1px solid", right: "Adds a visible border" },
    { category: "css", left: "flex-wrap: wrap", right: "Allows flex items to wrap" },
    { category: "css", left: "transition: 0.3s", right: "Smooth property animation" },
    { category: "js", left: "let x = 5", right: "Declares a variable" },
    { category: "js", left: "function hello() {}", right: "Defines a reusable block" },
    { category: "js", left: "if (x > 0) {}", right: "Conditional execution" },
    { category: "js", left: "array.map(fn)", right: "Transforms each array element" },
    { category: "js", left: "console.log()", right: "Prints to dev console" },
    { category: "js", left: "addEventListener", right: "Attaches event handler" },
    { category: "js", left: "JSON.parse()", right: "Converts JSON string to object" },
    { category: "js", left: "Promise", right: "Handles async operations" },
    { category: "js", left: "const", right: "Block-scoped constant" },
    { category: "js", left: "=== strict", right: "Equality without type coercion" },
    { category: "js", left: "array.filter(fn)", right: "Filters array by condition" },
    { category: "js", left: "array.reduce(fn)", right: "Reduces array to single value" },
    { category: "js", left: "document.querySelector", right: "Selects first matching DOM element" },
    { category: "js", left: "try { } catch { }", right: "Error handling block" },
    { category: "js", left: "async function", right: "Declares an async function" },
    { category: "js", left: "await promise", right: "Waits for promise resolution" },
    { category: "js", left: "setTimeout(fn, ms)", right: "Runs function after delay" },
    { category: "js", left: "class MyClass {}", right: "Defines a class blueprint" },
    { category: "js", left: "import ... from ...", right: "Imports from a module" },
    { category: "js", left: "export default", right: "Exports module default value" },
  ];

  function getFilteredLinkUpPairs(category) {
    let pairs = [...linkUpData];
    if (category !== "all") pairs = pairs.filter((p) => p.category === category);
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    return pairs;
  }

  function renderLinkUpSetup() {
    document.getElementById("linkUpArea").innerHTML = `\
<div class="link-setup">
  <h5>Link Up</h5>
  <p>Match each code concept on the left with its correct description on the right. Click a left item, then click its match.</p>
  <div class="game-config">
    <label>Category
      <select id="linkCategory">
        <option value="all">All Categories</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="js">JavaScript</option>
      </select>
    </label>
  </div>
  <button class="btn-primary" onclick="startLinkUp()">▶ Start Matching</button>
</div>`;
  }

  function renderLinkUpGame() {
    const area = document.getElementById("linkUpArea");
    const shuffledLeft = [...linkUpState.pairs].sort(() => Math.random() - 0.5);
    const shuffledRight = [...linkUpState.pairs].sort(() => Math.random() - 0.5);
    area.innerHTML = `\
<div class="link-hud">
  <span>Score: ${linkUpState.score}</span>
  <span>Mistakes: ${linkUpState.mistakes}</span>
  <span>Matched: ${linkUpState.matchedPairs.length}/${linkUpState.pairs.length}</span>
  <span>⏱ ${linkUpState.timeLeft}s</span>
</div>
<div class="linkup-columns">
  <div class="linkup-col" id="linkLeftCol">
    ${shuffledLeft.map((p, i) => {
      const m = linkUpState.matchedPairs.some((mp) => mp.left === p.left && mp.right === p.right);
      return `<button class="linkup-item ${m ? "matched" : linkUpState.selectedLeft === i ? "selected" : ""}" data-link-left="${i}" ${m ? "disabled" : ""}>${p.left}</button>`;
    }).join("")}
  </div>
  <div class="linkup-col" id="linkRightCol">
    ${shuffledRight.map((p, i) => {
      const m = linkUpState.matchedPairs.some((mp) => mp.left === p.left && mp.right === p.right);
      return `<button class="linkup-item ${m ? "matched" : ""}" data-link-right="${i}" ${m ? "disabled" : ""}>${p.right}</button>`;
    }).join("")}
  </div>
</div>`;
    document.getElementById("linkLeftCol").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-link-left]");
      if (btn && !btn.disabled) selectLinkLeft(Number(btn.dataset.linkLeft));
    });
    document.getElementById("linkRightCol").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-link-right]");
      if (btn && !btn.disabled) selectLinkRight(Number(btn.dataset.linkRight));
    });
  }

  function renderLinkUpResult() {
    document.getElementById("linkUpArea").innerHTML = `\
<div class="link-result">
  <h5>${linkUpState.mistakes === 0 ? "🎉 Perfect Match!" : "✅ All Matched!"}</h5>
  <div class="sprint-result-stats">
    <div class="stat-card"><span>Score</span><strong>${linkUpState.score}</strong></div>
    <div class="stat-card"><span>Mistakes</span><strong>${linkUpState.mistakes}</strong></div>
    <div class="stat-card"><span>Accuracy</span><strong>${linkUpState.pairs.length ? Math.round((linkUpState.pairs.length / (linkUpState.pairs.length + linkUpState.mistakes)) * 100) : 0}%</strong></div>
  </div>
  <p>${linkUpState.score > 0 ? `Earned +${linkUpState.score} XP!` : ""}</p>
  <button class="btn-primary" onclick="startLinkUp()">▶ Play Again</button>
  <button class="btn-secondary" onclick="renderLinkUpSetup()">← Change Settings</button>
</div>`;
  }

  function startLinkUp() {
    const cat = document.getElementById("linkCategory")?.value || "all";
    const pairs = getFilteredLinkUpPairs(cat);
    if (pairs.length < 3) { showNotification("Not enough pairs. Try a broader category.", "warning"); return; }
    const totalPairs = Math.min(pairs.length, 10);
    linkUpState = { category: cat, pairs: pairs.slice(0, totalPairs), selectedLeft: null, matchedPairs: [], wrongPairs: [], timer: null, timeLeft: totalPairs * 10, score: 0, active: true, mistakes: 0, finished: false };
    renderLinkUpGame();
    linkUpState.timer = setInterval(() => {
      linkUpState.timeLeft--;
      const hud = document.querySelector(".link-hud span:last-child");
      if (hud) hud.textContent = `⏱ ${linkUpState.timeLeft}s`;
      if (linkUpState.timeLeft <= 0) { clearInterval(linkUpState.timer); linkUpState.active = false; finishLinkUp(); }
    }, 1000);
  }

  function selectLinkLeft(index) {
    if (!linkUpState.active) return;
    linkUpState.selectedLeft = index;
    document.querySelectorAll("#linkLeftCol .link-card").forEach((c, i) => c.classList.toggle("selected", i === index));
  }

  function selectLinkRight(index) {
    if (!linkUpState.active || linkUpState.selectedLeft === null) return;
    const leftIdx = linkUpState.selectedLeft;
    const shuffledLeft = document.querySelectorAll("#linkLeftCol .link-card");
    const shuffledRight = document.querySelectorAll("#linkRightCol .link-card");
    const leftText = shuffledLeft[leftIdx]?.textContent?.trim() || "";
    const rightText = shuffledRight[index]?.textContent?.trim() || "";
    const match = linkUpState.pairs.find((p) => p.left === leftText && p.right === rightText);
    if (match && !linkUpState.matchedPairs.some((mp) => mp.left === match.left)) {
      linkUpState.matchedPairs.push(match);
      linkUpState.score += 10;
      shuffledLeft[leftIdx].classList.add("matched");
      shuffledLeft[leftIdx].disabled = true;
      shuffledRight[index].classList.add("matched");
      shuffledRight[index].disabled = true;
      playCorrectChime();
      if (linkUpState.matchedPairs.length === linkUpState.pairs.length) { clearInterval(linkUpState.timer); linkUpState.active = false; finishLinkUp(); }
    } else {
      linkUpState.mistakes++;
      playWrongBuzz();
      shuffledLeft[leftIdx].classList.add("wrong");
      setTimeout(() => shuffledLeft[leftIdx]?.classList.remove("wrong"), 500);
    }
    linkUpState.selectedLeft = null;
    document.querySelectorAll("#linkLeftCol .link-card").forEach((c) => c.classList.remove("selected"));
  }

  function finishLinkUp() {
    linkUpState.active = false;
    linkUpState.finished = true;
    const xpGain = linkUpState.score;
    if (xpGain > 0) {
      appState.xp += xpGain;
      logXpEarned(xpGain);
      showXpPopup(xpGain);
    }
    renderLinkUpResult();
    updateDashboard();
  }

  const bugTemplateData = [
    { cat: "html", diff: "beginner", code: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<boy>\n  <h1>Hello</h1>\n</boy>\n</html>", line: 5, label: "Replace &lt;boy&gt; with &lt;body&gt;", c: "&lt;body&gt;", w: ["&lt;main&gt;", "&lt;section&gt;", "&lt;div&gt;"], exp: "&lt;boy&gt; is not a valid HTML tag. The visible content goes inside &lt;body&gt;." },
    { cat: "html", diff: "beginner", code: "<html>\n<head>\n  <title>Hello</title>\n</head>\n<body>\n  <h1>Welcome</h1>\n  <img src=\"photo.jpg\" alt=\"A photo\" />\n  <a href=\"page.html\"Click here</a>\n</body>\n</html>", line: 7, label: "Close the &lt;a&gt; tag properly", c: "&lt;a href=\"page.html\"&gt;Click here&lt;/a&gt;", w: ["&lt;a href=\"page.html\"Click here&lt;/a&gt;", "&lt;a href=\"page.html\"&gt;Click here", "Click here&lt;/a&gt;"], exp: "The anchor tag is missing its closing &gt; after href." },
    { cat: "html", diff: "beginner", code: "<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n<a href=\"#\">Link</a>\n<br>\n<h1>Title<h1>", line: 6, label: "Use &lt;/h1&gt; to close the heading", c: "&lt;/h1&gt;", w: ["&lt;h1&gt;&lt;/h1&gt;", "&lt;\\h1&gt;", "&lt;h1 /&gt;"], exp: "The heading closes with &lt;h1&gt; instead of &lt;/h1&gt;. Closing tags need a forward slash." },
    { cat: "html", diff: "intermediate", code: "<form>\n  <label for=\"email\">Email</label>\n  <input type=\"emal\" id=\"email\" name=\"email\">\n  <button type=\"submit\">Send</button>\n</form>", line: 2, label: "Change type to email", c: "type=\"email\"", w: ["type=\"text\"", "type=\"emal\"", "type=\"mail\""], exp: "The input type is misspelled as 'emal'. Correct is 'email'." },
    { cat: "html", diff: "intermediate", code: "<table>\n  <tr>\n    <td>Cell 1</td>\n    <td>Cell 2</td>\n  </tr>\n  <tr>\n    <td>Cell 3</td>\n    <td>Cell 4</td\n  </tr>\n</table>", line: 7, label: "Close &lt;td&gt; properly", c: "&lt;td&gt;Cell 4&lt;/td&gt;", w: ["&lt;td&gt;Cell 4&lt;td&gt;", "&lt;td&gt;Cell 4", "Cell 4&lt;/td&gt;"], exp: "The &lt;td&gt; tag is missing its closing &gt;." },
    { cat: "html", diff: "advanced", code: "<section aria-label=\"Main\">\n  <h2>Content</h2>\n  <p>Some text here.</p>\n</sektion>", line: 3, label: "Close with &lt;/section&gt;", c: "&lt;/section&gt;", w: ["&lt;/sektion&gt;", "&lt;/sect&gt;", "&lt;section&gt;"], exp: "Closing tag is misspelled as 'sektion'. Should be 'section'." },
    { cat: "html", diff: "advanced", code: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Test</title>\n</head>\n<body>\n  <header>\n    <nav>\n      <a href=\"#\">Home</a>\n    </nav>\n  </header>\n  <main>\n    <article>\n      <h2>Article Title</h3>\n      <p>Content</p>\n    </article>\n  </main>\n</body>\n</html>", line: 14, label: "Use &lt;/h2&gt; to close", c: "&lt;/h2&gt;", w: ["&lt;/h3&gt;", "&lt;h3&gt;", "&lt;/h2&gt;&lt;/h3&gt;"], exp: "Opens with &lt;h2&gt; but closes with &lt;/h3&gt;. Must match." },
    { cat: "css", diff: "beginner", code: "p {\n  colour: red;\n  font-size: 16px;\n}", line: 1, label: "Use 'color'", c: "color", w: ["text-color", "font-color", "colour"], exp: "CSS uses American English. The property is 'color'." },
    { cat: "css", diff: "beginner", code: ".box {\n  background-color: blue;\n  padding: 10px;\n  boarder: 1px solid black;\n}", line: 3, label: "Use 'border'", c: "border", w: ["boarder", "boder", "border-style"], exp: "'boarder' is misspelled. The correct property is 'border'." },
    { cat: "css", diff: "intermediate", code: ".flex-container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 10px;\n  flex-direcion: column;\n}", line: 5, label: "Use 'flex-direction'", c: "flex-direction", w: ["flex-drection", "flex-direction", "flex-direcion"], exp: "'flex-direcion' is misspelled. Correct is 'flex-direction'." },
    { cat: "css", diff: "intermediate", code: ".card {\n  margin: 0 auto;\n  width: 80%;\n  border-radius: 8px;\n  shadow: 0 2px 4px rgba(0,0,0,0.1);\n}", line: 4, label: "Use 'box-shadow'", c: "box-shadow", w: ["shadow", "drop-shadow", "element-shadow"], exp: "There is no 'shadow' property. Use 'box-shadow'." },
    { cat: "css", diff: "advanced", code: ".animated {\n  transition: all 0.3s ease;\n}\n.animated:hover {\n  transition: scale(1.1);\n}", line: 4, label: "Use 'transform'", c: "transform", w: ["transition", "scale", "animate"], exp: "'transition' cannot apply scale. Use 'transform: scale(1.1)'." },
    { cat: "css", diff: "advanced", code: "button {\n  background: blue;\n  color: white;\n  padding: 10px 20px;\n  border-radius: 50%;\n  coursor: pointer;\n}", line: 5, label: "Use 'cursor'", c: "cursor", w: ["coursor", "curzor", "mouse"], exp: "'coursor' is misspelled. Correct is 'cursor'." },
    { cat: "html", diff: "beginner", code: "<div class=\"container\">\n  <h1>Hello World</h1>\n  <p>This is a paragraph</p>\n</div>\n<footer>\n  &copy; 2025 My Site\n</foter>", line: 5, label: "Close with &lt;/footer&gt;", c: "&lt;/footer&gt;", w: ["&lt;/foter&gt;", "&lt;footer&gt;", "&lt;/foot&gt;"], exp: "The closing tag is misspelled as 'foter'. Should be 'footer'." },
    { cat: "css", diff: "beginner", code: "h1 {\n  font-size: 24px;\n  font-weight: bold;\n  collor: navy;\n}", line: 3, label: "Use 'color'", c: "color", w: ["collor", "colour", "text-color"], exp: "'collor' is misspelled. The correct property is 'color'." },
    { cat: "js", diff: "beginner", code: "function greet() {\n  console.log(\"Hello!\")\n}", line: -1, label: "No bug here", c: "No bug here", w: ["Missing semicolon", "Wrong quotes", "Missing parentheses"], exp: "This code is correct. Semicolons are optional." },
    { cat: "js", diff: "beginner", code: "const name = \"Alice\"\nname = \"Bob\"\nconsole.log(name)", line: 1, label: "Use 'let' instead", c: "Use 'let'", w: ["Use 'var'", "Remove second line", "Use 'const' again"], exp: "Cannot reassign a 'const'. Use 'let' if the value changes." },
    { cat: "js", diff: "intermediate", code: "const nums = [1, 2, 3, 4, 5]\nconst doubled = nums.mape(x => x * 2)\nconsole.log(doubled)", line: 1, label: "Use 'map'", c: "map", w: ["mape", "forEach", "filter"], exp: "'mape' is not a valid method. Use 'map'." },
    { cat: "js", diff: "intermediate", code: "function sum(a, b) {\n  return a + b\n}\nconsole.log(suum(2, 3))", line: 2, label: "Use 'sum'", c: "sum", w: ["suum", "Sum", "add"], exp: "Function is 'sum' but called as 'suum'. Name must match." },
    { cat: "js", diff: "advanced", code: "fetch(\"https://api.example.com/data\")\n  .then(res => res.json())\n  .then(data => consoel.log(data))\n  .catch(err => console.error(err))", line: 2, label: "Use 'console'", c: "console", w: ["consoel", "Console", "log"], exp: "'consoel' is misspelled. Correct is 'console'." },
    { cat: "js", diff: "advanced", code: "const btn = document.querySelector(\"button\")\nbtn.addEventListener(\"click\", () => {\n  aleert(\"Clicked!\")\n})", line: 2, label: "Use 'alert'", c: "alert", w: ["aleert", "Alert", "confirm"], exp: "'aleert' is misspelled. Correct is 'alert'." },
    { cat: "js", diff: "advanced", code: "const delay = ms => new Promise(resolve => {\n  setTimeout(resolve, ms)\n})\nasync function run() {\n  await delay(1000)\n  console.log(\"Done\")\n}\nrun()", line: -1, label: "Code is correct", c: "Code is correct", w: ["Missing return", "Wrong Promise", "async not needed"], exp: "This code is correct! Uses async/await properly." },
  ];

  function generateBugQuestions(category, count = 15) {
    let pool = [...bugTemplateData];
    if (category !== "all") pool = pool.filter((t) => t.cat === category);
    shuffleArray(pool);
    const selected = pool.slice(0, Math.min(count, pool.length));
    return selected.map((t) => makeBugQuestion(t.cat, t.diff, t.code, t.line, t.label, t.c, t.w, t.exp));
  }

  function renderBugSetup() {
    document.getElementById("bugArea").innerHTML = `\
<div class="bug-setup">
  <h5>Spot the Bug</h5>
  <p>Read each code snippet carefully. First, find which line contains the bug. Then pick the correct fix!</p>
  <div class="game-config">
    <label>Category
      <select id="bugCategory">
        <option value="all">All Categories</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="js">JavaScript</option>
      </select>
    </label>
  </div>
  <button class="btn-primary" onclick="startBugHunt()">▶ Start Hunting</button>
</div>`;
  }

  function renderBugQuestion() {
    const q = bugState.questions[bugState.questionIndex];
    const lines = q.code.split("\n");
    const area = document.getElementById("bugArea");
    const phase = bugState.phase;
    area.innerHTML = `\
<div class="bug-hud">
  <span>Score: ${bugState.score}</span>
  <span>Streak: ${bugState.streak}🔥</span>
  <span>Q ${bugState.questionIndex + 1}/${bugState.totalQuestions}</span>
  <span>${q.category.toUpperCase()} · ${q.difficulty}</span>
</div>
<div class="bug-code-display">
  <div class="bug-code-label">${phase === "line" ? "Step 1: Click the buggy line" : "Step 2: Pick the fix"}</div>
  <pre class="code-block">${lines.map((line, i) => `<div class="bug-line-btn${bugState.selectedLine === i ? " selected" : ""}" data-line="${i}">${String(i + 1).padStart(3, " ")}  ${escapeHtml(line)}</div>`).join("")}</pre>
</div>
${phase === "fix" ? `\
<div class="bug-line-btns">
  ${q.options.map((opt, i) => `<button class="sprint-opt" onclick="selectBugFix(${i})">${opt}</button>`).join("")}
</div>` : ""}
${phase === "result" ? `\
<div class="bug-result-info">
  <p>${bugState.lastCorrect ? "✅ " : "❌ "} ${q.explanation}</p>
  <button class="btn-primary" onclick="nextBug()">${bugState.questionIndex + 1 >= bugState.totalQuestions ? "See Results" : "Next →"}</button>
</div>` : ""}`;
    if (phase === "line") {
      area.querySelectorAll(".bug-line-btn").forEach((el) => {
        el.addEventListener("click", () => selectBuggyLine(Number(el.dataset.line)));
      });
    }
  }

  function renderBugResult() {
    const pct = bugState.totalQuestions ? Math.round((bugState.totalCorrect / bugState.totalQuestions) * 100) : 0;
    document.getElementById("bugArea").innerHTML = `\
<div class="bug-result">
  <h5>🐛 Bug Hunt Complete!</h5>
  <div class="sprint-result-stats">
    <div class="stat-card"><span>Score</span><strong>${bugState.score}</strong></div>
    <div class="stat-card"><span>Found</span><strong>${bugState.totalCorrect}/${bugState.totalQuestions}</strong></div>
    <div class="stat-card"><span>Accuracy</span><strong>${pct}%</strong></div>
    <div class="stat-card"><span>Best Streak</span><strong>${bugState.streak}</strong></div>
  </div>
  <p>${bugState.score > 0 ? `Earned +${bugState.score} XP!` : "Try again!"}</p>
  <button class="btn-primary" onclick="startBugHunt()">▶ Hunt Again</button>
  <button class="btn-secondary" onclick="renderBugSetup()">← Change Settings</button>
</div>`;
  }

  function startBugHunt() {
    const cat = document.getElementById("bugCategory")?.value || "all";
    const qs = generateBugQuestions(cat, 15);
    if (qs.length < 3) { showNotification("Not enough questions.", "warning"); return; }
    bugState = { category: cat, questions: qs, questionIndex: 0, score: 0, active: true, streak: 0, totalCorrect: 0, phase: "line", selectedLine: null, finished: false, lastCorrect: false, totalQuestions: qs.length };
    renderBugQuestion();
  }

  function selectBuggyLine(index) {
    if (bugState.phase !== "line") return;
    bugState.selectedLine = index;
    const q = bugState.questions[bugState.questionIndex];
    if (q.buggyLine === -1) {
      bugState.phase = "result";
      bugState.lastCorrect = true;
      bugState.streak++;
      bugState.totalCorrect++;
      bugState.score += 10;
      playCorrectChime();
    } else if (index === q.buggyLine) {
      bugState.phase = "fix";
      bugState.lastCorrect = true;
      bugState.score += 5;
      playCorrectChime();
    } else {
      bugState.phase = "fix";
      bugState.lastCorrect = false;
      playWrongBuzz();
    }
    renderBugQuestion();
  }

  function selectBugFix(choice) {
    if (bugState.phase !== "fix") return;
    const q = bugState.questions[bugState.questionIndex];
    if (q.buggyLine === -1) { bugState.phase = "result"; renderBugQuestion(); return; }
    if (choice === q.answer) {
      bugState.streak++;
      bugState.totalCorrect++;
      bugState.score += 10 + (bugState.streak - 1) * 2;
      bugState.lastCorrect = true;
      playCorrectChime();
    } else {
      bugState.streak = 0;
      bugState.lastCorrect = false;
      playWrongBuzz();
    }
    bugState.phase = "result";
    renderBugQuestion();
  }

  function nextBug() {
    bugState.questionIndex++;
    if (bugState.questionIndex >= bugState.totalQuestions) {
      const xpGain = bugState.score;
      if (xpGain > 0) {
        appState.xp += xpGain;
        logXpEarned(xpGain);
        showXpPopup(xpGain);
      }
      bugState.active = false;
      bugState.finished = true;
      renderBugResult();
      updateDashboard();
      return;
    }
    bugState.phase = "line";
    bugState.selectedLine = null;
    renderBugQuestion();
  }

  const typingSnippets = [
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>',
    'const greet = (name) => {\n  return `Hello, ${name}!`;\n};\nconsole.log(greet("World"));',
    '.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 16px;\n  padding: 24px;\n}',
    '<nav>\n  <ul>\n    <li><a href="#home">Home</a></li>\n    <li><a href="#about">About</a></li>\n  </ul>\n</nav>',
    'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}',
    '.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n  max-width: 960px;\n  margin: 0 auto;\n}',
    '<form action="/submit" method="POST">\n  <label for="name">Name</label>\n  <input id="name" type="text" required>\n  <button type="submit">Send</button>\n</form>',
    'const items = ["HTML", "CSS", "JS"];\nitems.forEach((item, i) => {\n  console.log(`${i + 1}. ${item}`);\n});'
  ];

  let typingState = { active: false, snippet: "", startTime: 0, correctChars: 0, totalChars: 0, timer: null, timeLeft: 60 };

  function renderTypingSetup() {
    const setup = document.getElementById("typingSetup");
    const game = document.getElementById("typingGame");
    if (setup) setup.style.display = "block";
    if (game) game.style.display = "none";
  }

  function startTyping() {
    const snippet = typingSnippets[Math.floor(Math.random() * typingSnippets.length)];
    typingState = { active: true, snippet, startTime: 0, correctChars: 0, totalChars: 0, timer: null, timeLeft: 60 };
    document.getElementById("typingSetup").style.display = "none";
    document.getElementById("typingGame").style.display = "block";
    document.getElementById("typingResult").style.display = "none";
    document.getElementById("typingSnippet").textContent = snippet;
    const input = document.getElementById("typingInput");
    input.value = "";
    input.disabled = false;
    input.focus();
    document.getElementById("typingTime").textContent = "60";

    typingState.startTime = Date.now();
    typingState.timer = setInterval(() => {
      typingState.timeLeft--;
      document.getElementById("typingTime").textContent = typingState.timeLeft;
      if (typingState.timeLeft <= 0) {
        finishTyping();
      }
    }, 1000);

    input.oninput = () => {
      const typed = input.value;
      let correct = 0;
      for (let i = 0; i < typed.length && i < snippet.length; i++) {
        if (typed[i] === snippet[i]) correct++;
      }
      typingState.correctChars = correct;
      typingState.totalChars = typed.length;

      renderTypingSnippet(snippet, typed);

      const elapsed = (Date.now() - typingState.startTime) / 1000 / 60;
      const wpm = elapsed > 0 ? Math.round((correct / 5) / elapsed) : 0;
      const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
      document.getElementById("typingWpm").textContent = wpm;
      document.getElementById("typingAccuracy").textContent = `${accuracy}%`;
    };
  }

  function renderTypingSnippet(snippet, typed) {
    const container = document.getElementById("typingSnippet");
    let html = "";
    for (let i = 0; i < snippet.length; i++) {
      const c = snippet[i] === "\n" ? "↵\n" : snippet[i];
      let cls;
      if (i < typed.length) {
        cls = typed[i] === snippet[i] ? "char-correct" : "char-wrong";
      } else if (i === typed.length) {
        cls = "char-current";
      } else {
        cls = "char-pending";
      }
      html += `<span class="${cls}">${c}</span>`;
    }
    container.innerHTML = html;
  }

  function finishTyping() {
    clearInterval(typingState.timer);
    typingState.active = false;
    document.getElementById("typingInput").disabled = true;

    const elapsed = (Date.now() - typingState.startTime) / 1000 / 60;
    const wpm = elapsed > 0 ? Math.round((typingState.correctChars / 5) / elapsed) : 0;
    const accuracy = typingState.totalChars > 0 ? Math.round((typingState.correctChars / typingState.totalChars) * 100) : 0;
    const xpGain = Math.round(wpm * 2);

    if (wpm > appState.typingHighScore) {
      appState.typingHighScore = wpm;
    }
    if (xpGain > 0) {
      appState.xp += xpGain;
      logXpEarned(xpGain);
      showXpPopup(xpGain);
    }
    updateDashboard();

    const result = document.getElementById("typingResult");
    result.style.display = "block";
    const textEl = document.getElementById("typingResultText");
    if (textEl) textEl.innerHTML = `<strong>Finished!</strong> WPM: ${wpm} | Accuracy: ${accuracy}% | XP Earned: +${xpGain}`;
    result.className = "typing-result success";
  }

  async function initApp() {
    updateSecureSyncLabel(true);
    let secretBuffer = "";
    window.addEventListener("message", (event) => {
      if (event.data?.type === "console") {
        const body = document.querySelector("#activityConsole .console-body");
        if (body) {
          const line = document.createElement("div");
          line.textContent = event.data.data;
          body.appendChild(line);
          body.scrollTop = body.scrollHeight;
        }
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const settings = document.getElementById("settings");
        if (settings?.classList.contains("open")) {
          toggleSettings();
        }
        return;
      }
      secretBuffer += event.key;
      if (secretBuffer.length > 3) {
        secretBuffer = secretBuffer.slice(-3);
      }
      if (secretBuffer === "Cyy") {
        updateSecureSyncLabel(true);
        secretBuffer = "";
      }
    });

    setAppLoading(true, "Connecting Firebase authentication and cloud progress.");
    document.body.classList.toggle("dark", appState.darkMode);
    document.body.classList.toggle("light", !appState.darkMode);
    syncThemeButton();
    setupPhoneInputs();
    updateDashboard();
    syncSettingsUI();
    setupNavigationClicks();

    renderSprintIntro();
    renderLinkUpSetup();
    renderBugSetup();
    renderTypingSetup();
    showGamesMode("sprint");
    renderAvatar();
    syncAvatarPickerUI();

    // Wait for firebase services but don't hang forever — fallback after 4s
    try {
      const services = await Promise.race([
        waitForFirebaseServices(),
        new Promise((resolve) => setTimeout(() => resolve({ configured: false, error: 'firebase-init-timeout' }), 4000))
      ]);
      firebaseState.services = services;
      firebaseState.ready = true;

      // If firebase-init failed to initialize (e.g., missing config), stop the loader.
      if (!services?.configured) {
        setAppLoading(false);
      }
    } catch (err) {
      console.error('Firebase init failed:', err);
      firebaseState.services = { configured: false, error: String(err) };
      firebaseState.ready = false;
      setAppLoading(false);
    }


    if (!firebaseState.services.configured) {
      showAuthInterface();
      setAppLoading(false);
      const loginStatus = document.getElementById("loginStatus");
      if (loginStatus) {
        loginStatus.textContent = getFirebaseConfigError();
      }
      return;
    }

    const authInitTimeout = window.setTimeout(() => {
      console.warn("Auth init timeout: showing login form.");
      setAppLoading(false);
      showAuthInterface();
      if (typeof showNotification === "function") {
        showNotification("Authentication initialization timed out. Please reload if the login form does not respond.", "warning");
      }
    }, 6000);

    // Watchdog: guarantee loader never stays infinite if onAuthStateChanged doesn't resolve.
    const loaderWatchdog = window.setTimeout(() => {
      try {
        console.warn("Loader watchdog: forcing login UI.");
        setAppLoading(false);
        showAuthInterface();
        const loginStatus = document.getElementById("loginStatus");
        if (loginStatus && !loginStatus.textContent) {
          loginStatus.textContent = "Still loading? Showing login screen. If this keeps happening, check browser console and Firebase config.";
        }
      } catch (e) {
        console.error("Loader watchdog failed:", e);
      }
    }, 10000);

    firebaseState.services.helpers.onAuthStateChanged(firebaseState.services.auth, async (user) => {
      window.clearTimeout(authInitTimeout);
      window.clearTimeout(loaderWatchdog);
      setAppLoading(true, user ? "Syncing your profile, progress, and preferences." : "Preparing secure sign-in.");
      const shouldCelebrate = firebaseState.authResolvedOnce;

      try {
        if (user) {
          firebaseState.user = user;
          await hydrateStateForUser(user);
          document.body.classList.toggle("dark", appState.darkMode);
          document.body.classList.toggle("light", !appState.darkMode);
          syncThemeButton();
          syncSettingsUI();
          updateDashboard();
          showMainInterface();
          showPage("dashboard");
          if (shouldCelebrate) {
            playSuccessAnimation("Login successful");
            showNotification("Welcome back to CodeLab", "info");
          }
        } else {
          firebaseState.user = null;
          firebaseState.hydrated = false;
          resetAppState();
          document.body.classList.toggle("dark", appState.darkMode);
          document.body.classList.toggle("light", !appState.darkMode);
          syncThemeButton();
          syncSettingsUI();
          updateDashboard();
          showAuthInterface();
        }
      } catch (error) {
        console.error("Auth bootstrap failed:", error);
        firebaseState.hydrated = false;
        showAuthInterface();
        const loginStatus = document.getElementById("loginStatus");
        if (loginStatus) {
          loginStatus.textContent = error?.message || "Firebase connected, but profile sync failed. Check Firestore setup and browser console.";
        }
      } finally {
        firebaseState.authResolvedOnce = true;
        setAppLoading(false);
      }
    });
  }

  window.initApp = initApp;
  window.showPage = showPage;
  window.showAuthTab = showAuthTab;
  window.toggleSettings = toggleSettings;
  window.toggleDark = toggleDark;
  window.toggleSetting = toggleSetting;
  window.saveProfile = saveProfile;
  window.selectAvatarPreset = selectAvatarPreset;
  window.handleAvatarUpload = handleAvatarUpload;
  window.clearCustomAvatar = clearCustomAvatar;
  window.login = login;
  window.register = register;
  window.sendPhoneAuthCode = sendPhoneAuthCode;
  window.confirmPhoneAuthCode = confirmPhoneAuthCode;
  window.logout = logout;
  window.forgotPassword = forgotPassword;
  window.closeForgotPasswordModal = closeForgotPasswordModal;
  window.sendResetCode = sendResetCode;

  window.runActivity = runActivity;
  window.checkActivity = checkActivity;
  window.completeLesson = completeLesson;
  window.goBackToLessons = goBackToLessons;
  window.goBackToTopics = goBackToTopics;
  window.goBackToQuizzes = goBackToQuizzes;
  window.submitQuiz = submitQuiz;
  window.switchLessonTab = switchLessonTab;
  window.getQuizData = async function() {
    return [...getHTMLQuizData(), ...getJSQuizData(), ...getCSSQuizData()];
  };
  window.showNotification = showNotification;
  window.showGamesMode = showGamesMode;
  window.renderSprintIntro = renderSprintIntro;
  window.startSprint = startSprint;
  window.answerSprint = answerSprint;
  window.renderLinkUpSetup = renderLinkUpSetup;
  window.startLinkUp = startLinkUp;
  window.selectLinkLeft = selectLinkLeft;
  window.selectLinkRight = selectLinkRight;
  window.renderBugSetup = renderBugSetup;
  window.startBugHunt = startBugHunt;
  window.selectBugFix = selectBugFix;
  window.nextBug = nextBug;
  window.renderTypingSetup = renderTypingSetup;
  window.startTyping = startTyping;
  window.sendEmailVerificationCode = sendEmailVerificationCode;
  window.verifyEmailCode = verifyEmailCode;
  window.sendPhoneVerificationCode = sendPhoneVerificationCode;
  window.verifyPhoneCode = verifyPhoneCode;
  window.changePassword = changePassword;
  window.exportAccountData = exportAccountData;
  window.clearLocalData = clearLocalData;

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
      if (lessonsPage) showPage("lesson");

      return;
    }

    // Fallback: if full editor blocks are missing, at least preview.
    runHtmlTopicPreview(topicId);
  }

  window.filterHtmlLessons = filterHtmlLessons;
  window.openHtmlLesson = openHtmlLesson;
  window.openHtmlTopicActivity = openHtmlTopicActivity;
  window.runHtmlTopicPreview = runHtmlTopicPreview;



  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
