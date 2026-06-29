window.CodeLab = window.CodeLab || {};
(() => {
  const C = window.CodeLab;
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

      if (!drawerOpen && startX <= DRAWER_EDGE_PX && dx >= DRAWER_OPEN_SWIPE_PX) {
        setDrawerOpen(true);
        tracking = false;
        return;
      }

      if (drawerOpen && (startedOnSidebar || startX <= 320) && dx <= -DRAWER_CLOSE_SWIPE_PX) {
        setDrawerOpen(false);
        tracking = false;
      }
    }

    function onEnd() {
      tracking = false;
    }

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
    lessonHints: true,
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: false,
    courseUpdates: true,
    twoFactor: false,
    profileVisibility: "public"
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

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  C.isMobileUserAgent = isMobileUserAgent;
  C.applyAutoLayout = applyAutoLayout;
  C.isMobileLayout = isMobileLayout;
  C.setDrawerOpen = setDrawerOpen;
  C.toggleDrawer = toggleDrawer;
  C.ensureMobileDrawerUI = ensureMobileDrawerUI;
  C.syncDrawerForLayout = syncDrawerForLayout;
  C.setUiMode = setUiMode;
  C.setupDrawerGestures = setupDrawerGestures;
  C.scheduleAutoLayout = scheduleAutoLayout;
  C.appState = appState;
  C.firebaseState = firebaseState;
  C.phoneAuthState = phoneAuthState;
  C.defaultAppState = defaultAppState;
  C.avatarPresets = avatarPresets;
  C.currentQuiz = currentQuiz;
  C.currentLessonGroup = currentLessonGroup;
  C.currentTopic = currentTopic;
  C.cmEditor = cmEditor;
  C.audioContext = audioContext;
  C.sprintState = sprintState;
  C.linkUpState = linkUpState;
  C.bugState = bugState;
  C.buildAvatarDataUri = buildAvatarDataUri;
  C.safeParse = safeParse;
  C.resetAppState = resetAppState;
  C.bootstrapEarlyLayout = bootstrapEarlyLayout;
  C.sanitizeString = sanitizeString;
  C.isFirestoreOfflineError = isFirestoreOfflineError;
  C.normalizePhoneDigits = normalizePhoneDigits;
  C.formatPhoneForDisplay = formatPhoneForDisplay;
  C.normalizeAuthPhone = normalizeAuthPhone;
  C.toE164Phone = toE164Phone;
  C.isValidAuthPhone = isValidAuthPhone;
  C.sanitizePhoneInputValue = sanitizePhoneInputValue;
  C.setupPhoneInputs = setupPhoneInputs;
  C.setPhoneAuthStatus = setPhoneAuthStatus;
  C.escapeHtml = escapeHtml;
})();
