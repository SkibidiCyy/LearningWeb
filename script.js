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

  function syncDrawerForLayout() {
    if (!isMobileLayout()) {
      setDrawerOpen(false);
      return;
    }

    ensureMobileDrawerUI();
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
    completedPuzzles: [],
    darkMode: true,
    typingBestWpm: 0,
    sessionLock: false,
    loginAlerts: true,
    lessonHints: true,
    soundEffects: false
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
  applyAutoLayout();
  setUiMode("auth");
  syncDrawerForLayout();
  setupDrawerGestures();
  window.addEventListener("resize", scheduleAutoLayout, { passive: true });
  window.addEventListener("orientationchange", scheduleAutoLayout, { passive: true });

  const basePuzzleData = [
    {
      title: "Starter Semantics",
      difficulty: "Beginner",
      description: "Match the most common HTML tags to what they do on a page.",
      hint: "Pair each element name with the job it does in a basic layout.",
      xp: 10,
      pairs: [
        { label: "<h1>", match: "Main page heading" },
        { label: "<p>", match: "Paragraph text" },
        { label: "<img>", match: "Displays an image" },
        { label: "<a>", match: "Creates a link" }
      ]
    },
    {
      title: "Page Structure",
      difficulty: "Beginner",
      description: "Learn the semantic tags that shape the main parts of a website.",
      hint: "Think about where navigation, main content, and side notes belong.",
      xp: 12,
      pairs: [
        { label: "<nav>", match: "Navigation menu area" },
        { label: "<main>", match: "Primary page content" },
        { label: "<footer>", match: "Bottom section of a page" },
        { label: "<aside>", match: "Secondary side content" }
      ]
    },
    {
      title: "Media and Tables",
      difficulty: "Intermediate",
      description: "Connect media and table tags with their specific jobs.",
      hint: "Some tags hold media players, while others build table structure.",
      xp: 14,
      pairs: [
        { label: "<audio>", match: "Embeds sound playback" },
        { label: "<video>", match: "Embeds video playback" },
        { label: "<th>", match: "Table header cell" },
        { label: "<td>", match: "Table data cell" }
      ]
    },
    {
      title: "Form Builder",
      difficulty: "Intermediate",
      description: "Match the form tags that make input experiences accessible and useful.",
      hint: "Labels explain inputs, forms wrap the whole submission area.",
      xp: 16,
      pairs: [
        { label: "<form>", match: "Wraps user input fields" },
        { label: "<label>", match: "Names an input for users" },
        { label: "<button>", match: "Triggers an action" },
        { label: "<input>", match: "Collects user data" }
      ]
    },
    {
      title: "Document Basics",
      difficulty: "Intermediate",
      description: "Match core document tags that define the structure of an HTML file.",
      hint: "Think: page language, head metadata, and visible body content.",
      xp: 18,
      pairs: [
        { label: "<!DOCTYPE html>", match: "Declares HTML5 document type" },
        { label: "<html>", match: "Root element of the page" },
        { label: "<head>", match: "Metadata and links to resources" },
        { label: "<body>", match: "Visible content of the page" }
      ]
    },
    {
      title: "Text and Emphasis",
      difficulty: "Intermediate",
      description: "Match text tags that affect meaning and readability.",
      hint: "Some tags stress meaning, others represent strong importance.",
      xp: 20,
      pairs: [
        { label: "<h2>", match: "Section heading" },
        { label: "<strong>", match: "Strong importance" },
        { label: "<em>", match: "Emphasis / stress" },
        { label: "<small>", match: "Fine print / side notes" }
      ]
    },
    {
      title: "Lists and Items",
      difficulty: "Advanced",
      description: "Match list tags to their roles in structured content.",
      hint: "Ordered lists are numbered, unordered lists are bulleted.",
      xp: 22,
      pairs: [
        { label: "<ul>", match: "Unordered list" },
        { label: "<ol>", match: "Ordered list" },
        { label: "<li>", match: "List item" },
        { label: "<dl>", match: "Description list" }
      ]
    },
    {
      title: "Tables Deep Dive",
      difficulty: "Advanced",
      description: "Match table container tags and their responsibilities.",
      hint: "Some tags group rows, others define the table caption.",
      xp: 24,
      pairs: [
        { label: "<table>", match: "Table container" },
        { label: "<tr>", match: "Table row" },
        { label: "<thead>", match: "Header row group" },
        { label: "<caption>", match: "Table title/caption" }
      ]
    },
    {
      title: "Forms and Input Types",
      difficulty: "Advanced",
      description: "Match common input types and helpers used in forms.",
      hint: "Placeholders hint, required enforces, and types validate.",
      xp: 26,
      pairs: [
        { label: 'type="email"', match: "Validates email format" },
        { label: 'type="password"', match: "Hides typed characters" },
        { label: "required", match: "Prevents empty submission" },
        { label: "placeholder", match: "Shows example input text" }
      ]
    },
    {
      title: "Accessibility Essentials",
      difficulty: "Advanced",
      description: "Match attributes and tags that improve accessibility.",
      hint: "Alt text describes images; labels and ARIA aid navigation.",
      xp: 28,
      pairs: [
        { label: "alt", match: "Image alternative text" },
        { label: "aria-label", match: "Accessible label for controls" },
        { label: "<label>", match: "Accessible name for inputs" },
        { label: "<button>", match: "Keyboard-focusable action" }
      ]
    }
  ];

  function createSeededRng(seed) {
    let state = (seed >>> 0) || 1;
    return () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 0xffffffff;
    };
  }

  function buildGeneratedPuzzleLevels(totalLevels) {
    const pool = [
      { label: "<header>", match: "Intro section of a page" },
      { label: "<section>", match: "Thematic grouping of content" },
      { label: "<article>", match: "Self-contained content unit" },
      { label: "<figure>", match: "Groups media with caption" },
      { label: "<figcaption>", match: "Caption for a figure" },
      { label: "<span>", match: "Inline generic container" },
      { label: "<div>", match: "Block-level generic container" },
      { label: "<br>", match: "Line break" },
      { label: "<hr>", match: "Thematic break" },
      { label: "<code>", match: "Inline code snippet" },
      { label: "<pre>", match: "Preformatted text block" },
      { label: "<blockquote>", match: "Quoted section" },
      { label: "<time>", match: "Machine-readable date/time" },
      { label: "<mark>", match: "Highlighted text" },
      { label: "<sup>", match: "Superscript text" },
      { label: "<sub>", match: "Subscript text" },
      { label: "<meta>", match: "Metadata tag in head" },
      { label: "<link>", match: "Links external resources" },
      { label: "<script>", match: "Runs JavaScript" },
      { label: "<style>", match: "Inline CSS styles" },
      { label: "<source>", match: "Media source definition" },
      { label: "<track>", match: "Subtitles/captions track" },
      { label: "<thead>", match: "Header row group" },
      { label: "<tbody>", match: "Body row group" },
      { label: "<tfoot>", match: "Footer row group" },
      { label: "<caption>", match: "Table title/caption" },
      { label: "<textarea>", match: "Multiline text input" },
      { label: "<select>", match: "Dropdown input" },
      { label: "<option>", match: "Select choice item" },
      { label: "<fieldset>", match: "Groups form controls" },
      { label: "<legend>", match: "Title for a fieldset" },
      { label: "<datalist>", match: "Autocomplete options list" },
      { label: "<summary>", match: "Clickable details summary" },
      { label: "<details>", match: "Disclosure widget" },
      { label: "<progress>", match: "Progress indicator" },
      { label: "<meter>", match: "Scalar measurement gauge" },
      { label: "<canvas>", match: "Draw graphics via JS" },
      { label: "<svg>", match: "Vector graphics container" },
      { label: "lang", match: "Document language code" },
      { label: "charset", match: "Character encoding declaration" },
      { label: "viewport", match: "Mobile viewport settings" },
      { label: "rel", match: "Relationship for link tag" },
      { label: "href", match: "Hyperlink reference URL" },
      { label: "src", match: "Media/source URL" },
      { label: "id", match: "Unique element identifier" },
      { label: "class", match: "Reusable CSS class name" },
      { label: "tabindex", match: "Keyboard focus order" },
      { label: "aria-hidden", match: "Hide from assistive tech" },
      { label: "role", match: "Explicit accessibility role" },
      { label: "autocomplete", match: "Input autofill behavior" }
    ];

    const generated = [];
    const levelsToGenerate = Math.max(0, totalLevels - basePuzzleData.length);

    for (let i = 0; i < levelsToGenerate; i += 1) {
      const levelIndex = basePuzzleData.length + i;
      const rng = createSeededRng(0xC0DE1234 ^ levelIndex);
      const pick = shufflePuzzleDeck(pool.map((item) => item), rng);
      const pairs = pick.slice(0, 4);

      const difficulty =
        levelIndex < 15 ? "Beginner" :
        levelIndex < 35 ? "Intermediate" :
        "Advanced";
      const xp = Math.min(40, 10 + Math.floor(levelIndex / 2));

      generated.push({
        title: `Semantic Match ${levelIndex + 1}`,
        difficulty,
        description: "Match tags and attributes to their meanings as fast as you can.",
        hint: "Look for semantic clues in the wording and pick the most precise match.",
        xp,
        pairs: pairs.map((pair) => ({ label: pair.label, match: pair.match }))
      });
    }

    return generated;
  }

  function shufflePuzzleDeck(items, rng = Math.random) {
    const deck = [...items];
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  const puzzleData = [...basePuzzleData, ...buildGeneratedPuzzleLevels(60)];

  const typingWords = [
    "html", "element", "attribute", "heading", "section", "article",
    "header", "footer", "button", "semantic", "accessibility", "layout"
  ];

  const rushQuestions = [
    { title: "Main page title", prompt: "Which tag should hold the most important page heading?", options: ["<h1>", "<p>", "<small>", "<span>"], answer: "<h1>" },
    { title: "Navigation links", prompt: "Which semantic tag is best for a group of navigation links?", options: ["<nav>", "<aside>", "<footer>", "<main>"], answer: "<nav>" },
    { title: "Clickable action", prompt: "Which tag is best for a form action like Submit?", options: ["<button>", "<div>", "<label>", "<strong>"], answer: "<button>" },
    { title: "Image accessibility", prompt: "Which tag displays an image on a page?", options: ["<img>", "<picture-text>", "<media>", "<figureimg>"], answer: "<img>" },
    { title: "Standalone article", prompt: "Which tag fits a blog post or news card?", options: ["<article>", "<section>", "<span>", "<em>"], answer: "<article>" },
    { title: "Grouped content", prompt: "Which tag is ideal for a thematic section of a page?", options: ["<section>", "<mark>", "<b>", "<legend>"], answer: "<section>" },
    { title: "Form field caption", prompt: "Which tag labels an input for accessibility?", options: ["<label>", "<caption>", "<legend>", "<tag>"], answer: "<label>" },
    { title: "Table row data", prompt: "Which tag represents one data cell inside a table row?", options: ["<td>", "<tr>", "<th>", "<cell>"], answer: "<td>" },
    { title: "Audio player", prompt: "Which tag embeds audio with controls?", options: ["<audio>", "<sound>", "<media>", "<voice>"], answer: "<audio>" },
    { title: "External page embed", prompt: "Which tag embeds another page inside your page?", options: ["<iframe>", "<embedpage>", "<portal>", "<window>"], answer: "<iframe>" }
  ];

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

  let currentPuzzleIndex = 0;
  let puzzleDeck = [];
  let puzzleFlippedCards = [];
  let puzzleMoves = 0;
  let puzzleMatchedPairs = 0;
  let puzzleLocked = false;
  let puzzleStartedAt = 0;
  let puzzleTimer = null;
  let typingTimer = null;
  let typingStartedAt = 0;
  let typingDuration = 60;
  let typingTargetText = "";
  let typingPaused = false;
  let remainingTypingSeconds = typingDuration;
  let typingGameInitialized = false;
  let typingTestActive = false;

  let audioContext = null;
  let rushTimer = null;
  let rushRoundDuration = 45;
  let rushTimeLeft = 45;
  let rushScore = 0;
  let rushStreak = 0;
  let currentRushQuestion = null;
  let rushRoundActive = false;
  let rushPaused = false;

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

    // Lessons/Quizzes removed: keep only games/typing progress.
    appState.typingBestWpm = Number.isFinite(progress.typingBestWpm) ? progress.typingBestWpm : defaultAppState.typingBestWpm;
    appState.completedPuzzles = Array.isArray(progress.completedPuzzles) ? progress.completedPuzzles : [];

    appState.darkMode = typeof preferences.darkMode === "boolean" ? preferences.darkMode : defaultAppState.darkMode;
    appState.sessionLock = typeof preferences.sessionLock === "boolean" ? preferences.sessionLock : defaultAppState.sessionLock;
    appState.loginAlerts = typeof preferences.loginAlerts === "boolean" ? preferences.loginAlerts : defaultAppState.loginAlerts;
    appState.lessonHints = typeof preferences.lessonHints === "boolean" ? preferences.lessonHints : defaultAppState.lessonHints;
    appState.soundEffects = typeof preferences.soundEffects === "boolean" ? preferences.soundEffects : defaultAppState.soundEffects;

    // Neutralize removed progress so analytics/achievements don’t count it.
    appState.lessonsDone = 0;
    appState.quizzesTaken = 0;
    appState.completedLessons = [];
    appState.completedQuizzes = [];
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
    lessonsDone: 0,
    quizzesTaken: 0,

        typingBestWpm: appState.typingBestWpm,
        completedLessons: appState.completedLessons,
        completedQuizzes: appState.completedQuizzes,
        completedPuzzles: appState.completedPuzzles
      },
      preferences: {
        darkMode: appState.darkMode,
        sessionLock: appState.sessionLock,
        loginAlerts: appState.loginAlerts,
        lessonHints: appState.lessonHints,
        soundEffects: appState.soundEffects
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
      }
    ];

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
            validateActivity: (code) => code.includes("<!DOCTYPE html>") && code.includes("<body>") && code.includes("<h1>")
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
            validateActivity: (code) => code.includes("<h1") && code.includes("<p")
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
            validateActivity: (code) => code.includes("class=")
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
            validateActivity: (code) => code.includes("<a") && code.includes('href="https://example.com"')
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
            validateActivity: (code) => code.includes("<img") && code.includes("alt=")
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

    return baseLessons.concat(extraLessons);
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
          const xpOptions = Array.from(new Set([correctXp, correctXp - 10, correctXp + 10, correctXp + 20])).filter((value) => value > 0);
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

  function renderAnalytics() {
    // Dashboard analytics currently reflect only what we track:
    // - XP/Level
    // - Typing best WPM
    // - Puzzle completion
    // Lessons & quizzes are intentionally neutralized in applyCloudState().

    const nextLevelXp = appState.level * 200;
    const xpToNext = Math.max(0, nextLevelXp - appState.xp);

    const puzzleTotal = puzzleData.length;
    const puzzleDone = appState.completedPuzzles.length;

    const puzzlePercent = Math.max(0, Math.min(100, puzzleTotal ? Math.round((puzzleDone / puzzleTotal) * 100) : 0));
    const typingPercent = Math.max(0, Math.min(100, Math.round((appState.typingBestWpm / 100) * 100)));

    // Completion rate = weighted blend of puzzles + typing progress.
    const completionRate = Math.max(0, Math.min(100, Math.round((puzzlePercent * 0.6) + (typingPercent * 0.4))));

    const activityScore = Math.round(
      (appState.xp * 0.35) +
      (puzzleDone * 20) +
      (appState.typingBestWpm * 3)
    );

    // Derived streak from activity, capped for UI.
    const streak = Math.max(1, Math.min(14, Math.round((puzzleDone * 0.75) + (appState.typingBestWpm / 12))));

    const accountStatus =
      appState.level >= 5 ? "Elite" :
      appState.level >= 3 ? "Advanced" :
      "Standard";

    // Since lessons/quizzes are not tracked, map the remaining bars to available metrics
    // so the UI does not show permanent zeros.
    // - “Lessons” bar shows puzzle progress (closest available learning proxy)
    // - “Quizzes” bar shows typing progress
    const lessonPercent = puzzlePercent;
    const quizPercent = typingPercent;

    const weeklySeries = [
      Math.max(8, Math.round(puzzlePercent * 0.50 + typingPercent * 0.30)),
      Math.max(10, Math.round(puzzlePercent * 0.55 + typingPercent * 0.35)),
      Math.max(12, Math.round(puzzlePercent * 0.60 + typingPercent * 0.20)),
      Math.max(18, Math.round(puzzlePercent * 0.70 + typingPercent * 0.15)),
      Math.max(22, Math.round(puzzlePercent * 0.65 + typingPercent * 0.35)),
      Math.max(26, Math.round(puzzlePercent * 0.60 + typingPercent * 0.40)),
      Math.max(30, Math.round((puzzlePercent + typingPercent) / 2))
    ];

    const lastPoint = weeklySeries[weeklySeries.length - 1];
    const previousPoint = weeklySeries[weeklySeries.length - 2] || lastPoint;
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
    setText("analyticsTypingPeak", `${appState.typingBestWpm} WPM`);
    setText("analyticsPuzzleProgress", `${puzzleDone}/${puzzleTotal}`);
    setText("analyticsStudyStreak", `${streak} day${streak === 1 ? "" : "s"}`);
    setText("analyticsActivityScore", activityScore);
    setText("analyticsAccountStatus", accountStatus);
    setText("analyticsChartDelta", `${chartDelta >= 0 ? "+" : ""}${chartDelta}%`);

    setBar("analyticsBarLessons", "analyticsBarLessonsValue", lessonPercent);
    setBar("analyticsBarPuzzles", "analyticsBarPuzzlesValue", puzzlePercent);
    setBar("analyticsBarTyping", "analyticsBarTypingValue", typingPercent);
    setBar("analyticsBarQuizzes", "analyticsBarQuizzesValue", quizPercent);

    const linePoints = weeklySeries.map((value, index) => {
      const x = (index / (weeklySeries.length - 1)) * 320;
      const y = 150 - (value / 100) * 120;
      return `${x},${y}`;
    }).join(" ");

    const lineGlow = document.getElementById("analyticsLineGlow");
    const linePath = document.getElementById("analyticsLinePath");
    const dots = document.getElementById("analyticsLineDots");
    if (lineGlow) lineGlow.setAttribute("points", linePoints);
    if (linePath) linePath.setAttribute("points", linePoints);
    if (dots) {
      dots.innerHTML = weeklySeries.map(() => '<span class="line-dot"></span>').join("");
    }
  }

  function updateDashboard() {
    appState.level = calculateLevel();

    const nextLevelXp = appState.level * 200;
    const previousLevelXp = (appState.level - 1) * 200;
    const progressWithinLevel = ((appState.xp - previousLevelXp) / (nextLevelXp - previousLevelXp)) * 100;

    // Dashboard “progress overview” (motivational, not tied to lessons since lessons are neutralized).
    const completionPercent = Math.max(0, Math.min(100, Math.round(progressWithinLevel)));

    // Derived streak (since there is no real study streak tracking in the current data model).
    const derivedStreakDays = Math.max(
      1,
      Math.min(
        30,
        Math.floor((appState.typingBestWpm / 12) + (appState.completedPuzzles?.length || 0) * 0.6 + (appState.xp / 500))
      )
    );

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

    setText("welcomeBack", `Welcome back, ${appState.nickname || appState.user || "Learner"}`);
    setText("progressPercent", `${completionPercent}%`);
    setText("streakDays", `${derivedStreakDays} day${derivedStreakDays === 1 ? "" : "s"}`);

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

  function renderBadges() {
    const badges = document.getElementById("badges");
    if (!badges) {
      return;
    }

    const items = [
      { label: "Fast Learner", value: `${appState.xp} XP` },
      { label: "Typing Best", value: `${appState.typingBestWpm} WPM` }
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

    // Lessons/Quizzes were removed from the app UI. Keep analytics/achievements stable.
    const completedLessons = 0;
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
    pushGenerated("Typing Pace", ["⌨️", "🔥", "💨", "⚙️", "🚄", "🎯", "🧿", "📈", "🏎️", "🪄"], [10,15,20,25,30,35,40,45,50,55,60,70,80,90,100], appState.typingBestWpm, "WPM", "Reach");
    pushGenerated("Puzzle Path", ["🧩", "🏆", "🗝️", "🧪", "🛡️", "🔮", "🎲", "🧱", "🕹️", "🎮"], [1,2,3,4,5,6,7,8,9,10], appState.completedPuzzles.length, "puzzles", "Finish");


    achievements.push(
      { emoji: "🔐", name: "Secure Setup", unlocked: appState.sessionLock, description: "Turn on session lock in settings." },
      { emoji: "🔔", name: "Alert Ready", unlocked: appState.loginAlerts, description: "Keep login alerts enabled." },
      { emoji: "💡", name: "Guided Learner", unlocked: appState.lessonHints, description: "Use lesson hints while learning." },
      { emoji: "🔊", name: "Sound Check", unlocked: appState.soundEffects, description: "Turn on sound effects in settings." },
      { emoji: "👤", name: "Profile Keeper", unlocked: Boolean(appState.nickname && appState.email), description: "Add a nickname and email to your profile." },
      { emoji: "🪪", name: "Bio Writer", unlocked: Boolean(appState.bio && appState.bio.trim().length >= 20), description: "Write a bio with at least 20 characters." },
      { emoji: "📡", name: "Live Analyst", unlocked: appState.xp >= 150 && completedLessons >= 3, description: "Build momentum in both XP and lessons." },
      { emoji: "🧬", name: "All Rounder", unlocked: appState.xp >= 500 && appState.typingBestWpm >= 30 && appState.completedPuzzles.length >= 3, description: "Balance XP, typing, and puzzle progress." },
      { emoji: "🏁", name: "Momentum Maker", unlocked: appState.xp >= 250 && appState.completedPuzzles.length >= 1, description: "Keep building momentum across learning activities." },

      { emoji: "💯", name: "Century Board", unlocked: achievements.filter((item) => item.unlocked).length >= 50, description: "Unlock 50 achievements on your way to the top." },
      { emoji: "📈", name: "Progress Watcher", unlocked: appState.xp >= 250 && appState.level >= 2, description: "Reach solid progress across XP and level." },
      { emoji: "🧱", name: "Foundation Strong", unlocked: completedLessons >= 10 && appState.xp >= 400, description: "Pair lesson depth with XP growth." },
      { emoji: "🎯", name: "Precision Path", unlocked: appState.quizzesTaken >= 3 && appState.typingBestWpm >= 25, description: "Build quiz and typing momentum together." },
      { emoji: "🧭", name: "Navigator", unlocked: completedLessons >= 12, description: "Keep moving deeper into the lesson path." },
      { emoji: "🪙", name: "Reward Seeker", unlocked: appState.xp >= 750, description: "Push your XP total into the high range." },
      { emoji: "🕹️", name: "Game Ready", unlocked: appState.completedPuzzles.length >= 2 && appState.typingBestWpm >= 15, description: "Make progress in both games areas." },
      { emoji: "🧠", name: "Knowledge Stack", unlocked: completedLessons >= 15 && appState.quizzesTaken >= 5, description: "Strengthen both study and quiz habits." },
      { emoji: "🌠", name: "Sky Climber", unlocked: appState.level >= 6, description: "Rise to level 6." },
      { emoji: "🏹", name: "Target Locked", unlocked: appState.typingBestWpm >= 50 && appState.quizzesTaken >= 5, description: "Combine speed with steady quiz practice." },
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
      lessonHintsToggle: appState.lessonHints,
      soundEffectsToggle: appState.soundEffects
    };

    Object.entries(ids).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.checked = value;
      }
    });
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
    if (main) main.style.display = "flex";
    setUiMode("main");
  }

  function showPage(pageId) {
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
      page.classList.add("active");
      page.style.display = "block";
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

    if (isMobileLayout()) {
      setDrawerOpen(false);
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
      lessons: [".page-header", ".lessons-tabs", ".topic-grid > .topic-card", "#lessonDetail", "#lessonDetailTitle", "#lessonDetailIntro", "#lessonTopicsGrid .topic-card", "#lessonContent", "#lessonContent .lesson-header", "#lessonContent .lesson-body", "#lessonContent .activity-section"],
      quizzes: [".page-header", "#quizGrid > .quiz-card", "#quizContent", "#quizContent .quiz-header-row", "#quizContent .quiz-intro", "#quizQuestions .quiz-question", "#quizResult"],
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

    grid.innerHTML = quizzes.map((quiz) => `
      <article class="topic-card quiz-card ${quiz.unlocked ? "" : "locked"}" data-quiz-id="${quiz.id}">
        <div>
          <div class="topic-icon">${quiz.completed ? "✓" : quiz.unlocked ? "Q" : "🔒"}</div>
          <h4>${quiz.title}</h4>
          <p>${quiz.unlocked ? quiz.intro : `Complete all topics in ${quiz.lessonTitle} to unlock this quiz.`}</p>
        </div>
        <span class="topic-xp">${quiz.completed ? "Completed" : quiz.unlocked ? `${quiz.questionCount} Questions` : "Locked"}</span>
      </article>
    `).join("");

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
    document.getElementById("quizContent").style.display = "block";
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
              <span>${option}</span>
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
    document.getElementById("quizGrid").style.display = "grid";
    renderQuizzes();
  }

  function renderLessons() {
    const lessons = getLessonData();
    const grid = document.getElementById("topicGrid");
    if (!grid) {
      return;
    }

    grid.innerHTML = lessons.map((lesson) => `
      <article class="topic-card lesson-card" data-lesson-id="${lesson.id}">
        <div class="topic-icon">${lesson.difficulty === "Intermediate" ? "I" : "B"}</div>
        <h4>${lesson.title}</h4>
        <p>${lesson.intro}</p>
        <span class="topic-xp">${lesson.topics.length} topics</span>
      </article>
    `).join("");

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
  }

  function renderJSLessons() {
    const jsLessons = getJSLessonData();
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

  function loadLessonDetail(lesson) {
    currentLessonGroup = lesson;
    document.querySelector(".lessons-tabs").style.display = "none";
    document.getElementById("topicGrid").style.display = "none";
    document.getElementById("topicGridJS").style.display = "none";
    document.getElementById("lessonContent").style.display = "none";
    document.getElementById("lessonDetail").style.display = "block";
    document.getElementById("lessonDetailTitle").textContent = lesson.title;
    document.getElementById("lessonDetailBadge").textContent = lesson.difficulty;
    document.getElementById("lessonDetailIntro").textContent = lesson.intro;

    const grid = document.getElementById("lessonTopicsGrid");

    const completedCount = lesson.topics.filter((t) => appState.completedLessons.includes(t.id)).length;
    document.getElementById("lessonDetailBadge").textContent = `${completedCount}/${lesson.topics.length} Topics Completed`;

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
    document.getElementById("lessonContent").style.display = "block";

    document.getElementById("lessonTitle").textContent = topic.title;
    document.getElementById("lessonBadge").textContent = topic.difficulty;
    document.getElementById("lessonDescription").textContent = topic.description;

    const steps = document.getElementById("lessonSteps");
    steps.innerHTML = topic.steps.map((step) => `<li>${step}</li>`).join("");

    document.getElementById("lessonCode").innerHTML = `<pre class="code-block"><code>${escapeHtml(topic.code)}</code></pre>`;
    document.getElementById("activityPrompt").textContent = topic.activityPrompt;
    document.getElementById("activityCode").value = topic.activityStarter;
    document.getElementById("activityOutput").srcdoc = topic.activityStarter;
    document.getElementById("activityHint").textContent = topic.activityHint;
    document.getElementById("activityHint").style.display = "none";
    document.getElementById("activityResult").textContent = "";
    document.getElementById("activityResult").className = "activity-result";
    document.getElementById("completeLessonBtn").style.display = "none";
    document.getElementById("checkActivityBtn").style.display = "inline-flex";
  }

  function runActivity() {
    document.getElementById("activityOutput").srcdoc = document.getElementById("activityCode").value;
  }

  function checkActivity() {
    if (!currentTopic) {
      return;
    }

    const code = document.getElementById("activityCode").value;
    const result = document.getElementById("activityResult");
    const isCorrect = typeof currentTopic.validateActivity === "function" && currentTopic.validateActivity(code);

    if (isCorrect) {
      result.textContent = "Correct answer. You can now complete the lesson.";
      result.className = "activity-result success";
      document.getElementById("completeLessonBtn").style.display = "inline-flex";
      document.getElementById("checkActivityBtn").style.display = "none";
    } else {
      result.textContent = "That still needs a small fix. Check the hint and try again.";
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


    const code = document.getElementById("activityCode")?.value ?? "";
    const requiresValidation = typeof currentTopic.validateActivity === "function";
    const isCorrect = !requiresValidation || currentTopic.validateActivity(code);

    if (!isCorrect) {
      const result = document.getElementById("activityResult");
      if (result) {
        result.textContent = "Finish the activity first (click Check Answer) before completing the lesson.";
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
      appState.xp += currentTopic.xp;
    }

    // Lessons/Quizzes removed; keep progress stable.
    appState.lessonsDone = 0;
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
    syncSettingsUI();
    saveState();
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
      lessonHints: "Lesson hints",
      soundEffects: "Sound effects"
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
    document.querySelectorAll(".games-tabs .editor-tab").forEach((button) => button.classList.remove("active"));
    document.querySelectorAll(".game-section").forEach((section) => section.classList.remove("active"));
    document.querySelector(`.games-tabs .editor-tab[onclick="showGamesMode('${mode}')"]`)?.classList.add("active");
    document.getElementById(`games${mode.charAt(0).toUpperCase()}${mode.slice(1)}`)?.classList.add("active");
  }

  function playCorrectChime() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    if (!audioContext) {
      audioContext = new AudioCtx();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const now = audioContext.currentTime;
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    masterGain.connect(audioContext.destination);

    const lead = audioContext.createOscillator();
    lead.type = "sine";
    lead.frequency.setValueAtTime(880, now);
    lead.frequency.exponentialRampToValueAtTime(1320, now + 0.16);
    lead.connect(masterGain);
    lead.start(now);
    lead.stop(now + 0.22);

    const sparkle = audioContext.createOscillator();
    sparkle.type = "triangle";
    sparkle.frequency.setValueAtTime(1760, now + 0.06);
    sparkle.frequency.exponentialRampToValueAtTime(2200, now + 0.24);
    sparkle.connect(masterGain);
    sparkle.start(now + 0.06);
    sparkle.stop(now + 0.28);
  }

  function playWrongBuzz() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    if (!audioContext) {
      audioContext = new AudioCtx();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const now = audioContext.currentTime;
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    masterGain.connect(audioContext.destination);

    const osc = audioContext.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
    osc.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  function updateRushStats() {
    const level = Math.max(1, Math.floor(rushScore / 120) + 1);
    document.getElementById("rushScore").textContent = rushScore;
    document.getElementById("rushStreak").textContent = rushStreak;
    document.getElementById("rushLevel").textContent = level;
    document.getElementById("rushTime").textContent = `${rushTimeLeft}s`;
  }

  function formatRushDurationLabel(seconds) {
    return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
  }

  function refreshRushStartButtonLabel() {
    const startButton = document.getElementById("rushStartBtn");
    if (!startButton) {
      return;
    }

    startButton.textContent = rushRoundActive ? "↻ Restart Round" : `▶ Start Round (${formatRushDurationLabel(rushRoundDuration)})`;
  }

  function updateRushPauseButton() {
    const pauseButton = document.getElementById("rushPauseBtn");
    if (!pauseButton) {
      return;
    }

    pauseButton.style.display = rushRoundActive || rushPaused ? "inline-flex" : "none";
    pauseButton.textContent = rushPaused ? "▶ Resume" : "⏸️ Pause";
  }

  function setRushDuration(value) {
    const duration = Number(value);
    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    rushRoundDuration = duration;
    if (!rushRoundActive) {
      rushTimeLeft = duration;
      updateRushStats();
    }

    const select = document.getElementById("rushDurationSelect");
    if (select) {
      select.value = String(duration);
    }

    refreshRushStartButtonLabel();
  }

  function setRushResult(message, type = "", visible = true) {
    const result = document.getElementById("rushResult");
    if (!result) {
      return;
    }

    result.textContent = message;
    result.className = `activity-result${type ? ` ${type}` : ""}`;
    result.style.display = visible ? "block" : "none";
  }

  function getRandomRushQuestion() {
    return rushQuestions[Math.floor(Math.random() * rushQuestions.length)];
  }

  function renderRushQuestion() {
    if (!currentRushQuestion) {
      return;
    }

    document.getElementById("rushPromptTitle").textContent = currentRushQuestion.title;
    document.getElementById("rushPromptText").textContent = currentRushQuestion.prompt;
    const options = document.getElementById("rushOptions");
    options.innerHTML = "";
    currentRushQuestion.options.forEach((option) => {
      const button = document.createElement("button");
      button.className = "rush-option";
      button.type = "button";
      button.textContent = option;
      button.addEventListener("click", () => answerRushQuestion(option));
      options.appendChild(button);
    });
  }

  function nextRushQuestion() {
    currentRushQuestion = getRandomRushQuestion();
    renderRushQuestion();
  }

  function finishRushGame() {
    clearInterval(rushTimer);
    rushTimer = null;
    rushRoundActive = false;
    rushPaused = false;
    const xpReward = Math.max(10, Math.round(rushScore / 8));
    appState.xp += xpReward;
    setRushResult(`Round complete. Score ${rushScore}, best streak ${rushStreak}, reward +${xpReward} XP.`, "success");
    updateDashboard();
    Array.from(document.querySelectorAll(".rush-option")).forEach((button) => {
      button.disabled = true;
    });
    refreshRushStartButtonLabel();
    updateRushPauseButton();
  }

  function startRushGame() {
    clearInterval(rushTimer);
    rushTimeLeft = rushRoundDuration;
    rushScore = 0;
    rushStreak = 0;
    rushRoundActive = true;
    rushPaused = false;
    setRushResult("", "", false);
    nextRushQuestion();
    updateRushStats();
    refreshRushStartButtonLabel();
    updateRushPauseButton();

    rushTimer = setInterval(() => {
      rushTimeLeft = Math.max(0, rushTimeLeft - 1);
      updateRushStats();
      if (rushTimeLeft <= 0) {
        finishRushGame();
      }
    }, 1000);
  }

  function pauseRushGame() {
    if (!rushRoundActive && !rushPaused) {
      return;
    }

    const optionButtons = Array.from(document.querySelectorAll(".rush-option"));

    if (!rushPaused) {
      clearInterval(rushTimer);
      rushTimer = null;
      rushRoundActive = false;
      rushPaused = true;
      optionButtons.forEach((button) => {
        button.disabled = true;
      });
      setRushResult("Tag Rush paused.", "info");
      updateRushPauseButton();
      return;
    }

    rushPaused = false;
    rushRoundActive = true;
    optionButtons.forEach((button) => {
      button.disabled = false;
    });
    setRushResult("", "", false);
    updateRushPauseButton();

    rushTimer = setInterval(() => {
      rushTimeLeft = Math.max(0, rushTimeLeft - 1);
      updateRushStats();
      if (rushTimeLeft <= 0) {
        finishRushGame();
      }
    }, 1000);
  }

  function answerRushQuestion(choice) {
    if (!rushRoundActive || !currentRushQuestion) {
      return;
    }

    const buttons = Array.from(document.querySelectorAll(".rush-option"));
    const isCorrect = choice === currentRushQuestion.answer;

    buttons.forEach((button) => {
      button.disabled = true;
      if (button.textContent === currentRushQuestion.answer) {
        button.classList.add("correct");
      } else if (button.textContent === choice && !isCorrect) {
        button.classList.add("wrong");
      }
    });

    if (isCorrect) {
      rushStreak += 1;
      rushScore += 20 + (rushStreak - 1) * 5;
      playCorrectChime();
      setRushResult(`Correct. ${currentRushQuestion.answer} is the best answer.`, "success");
    } else {
      rushStreak = 0;
      playWrongBuzz();
      setRushResult(`Not quite. The best answer was ${currentRushQuestion.answer}.`, "error");
    }

    updateRushStats();
    setTimeout(() => {
      if (!rushRoundActive) {
        return;
      }
      setRushResult("", "", false);
      nextRushQuestion();
    }, 850);
  }

  function skipRushQuestion() {
    if (!rushRoundActive) {
      startRushGame();
      return;
    }

    rushStreak = 0;
    setRushResult(`Skipped. The best answer was ${currentRushQuestion.answer}.`, "info");
    updateRushStats();
    setTimeout(() => {
      if (!rushRoundActive) {
        return;
      }
      setRushResult("", "", false);
      nextRushQuestion();
    }, 700);
  }

  function escapeTypingHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[char]));
  }

  function buildTypingText() {
    const words = [];
    for (let i = 0; i < 28; i += 1) {
      words.push(typingWords[Math.floor(Math.random() * typingWords.length)]);
    }
    typingTargetText = words.join(" ");
  }

  function getTypingInputElement() {
    return document.getElementById("typingInput");
  }

  function getTypingMetrics(inputValue = "") {
    const targetWords = typingTargetText ? typingTargetText.split(" ") : [];
    const typedWords = inputValue.trim().split(/\s+/).filter(Boolean);
    const typedChars = inputValue.length;
    const correctChars = [...inputValue].filter((char, index) => char === typingTargetText[index]).length;
    const elapsedSeconds = Math.max(1, typingDuration - remainingTypingSeconds);
    const elapsedMinutes = elapsedSeconds / 60;
    const netWpm = Math.max(0, Math.round((correctChars / 5) / elapsedMinutes));
    const wps = Number((typedWords.length / elapsedSeconds).toFixed(1));
    const accuracy = typedChars ? Math.round((correctChars / typedChars) * 100) : 100;
    const completedWords = typedWords.filter((word, index) => word === targetWords[index]).length;

    return {
      typedChars,
      correctChars,
      accuracy,
      netWpm,
      wps,
      elapsedSeconds,
      completedWords
    };
  }

  function renderTypingText(inputValue = "") {
    const display = document.getElementById("typingDisplay");
    if (!display) {
      return;
    }

    if (!typingTargetText) {
      display.textContent = 'Click "Start Test" to begin →';
      return;
    }

    const typedMarkup = [...typingTargetText.slice(0, inputValue.length)].map((char, index) => {
      const typed = inputValue[index];
      const className = typed === char ? "typing-char-correct" : "typing-char-wrong";
      const shownChar = typed === char ? char : typed;
      return `<span class="${className}">${escapeTypingHtml(shownChar)}</span>`;
    }).join("");

    if (inputValue.length >= typingTargetText.length) {
      display.innerHTML = typedMarkup;
      return;
    }

    const currentChar = escapeTypingHtml(typingTargetText[inputValue.length]);
    const pendingText = escapeTypingHtml(typingTargetText.slice(inputValue.length + 1));
    display.innerHTML = `${typedMarkup}<span class="typing-char-current">${currentChar}</span><span class="typing-char-pending">${pendingText}</span>`;
  }

  function updateTypingDashboard(metrics) {
    document.getElementById("typingWPM").textContent = metrics.netWpm;
    document.getElementById("typingAccuracy").textContent = metrics.accuracy;
    document.getElementById("typingLevel").textContent = Math.max(1, Math.ceil(metrics.netWpm / 15));
    document.getElementById("typingTimeLeft").textContent = `${remainingTypingSeconds}s`;
    document.getElementById("typingChars").textContent = metrics.typedChars;
    document.getElementById("typingWordsDone").textContent = metrics.completedWords;
  }

  function setTypingResult(message, type = "", visible = true) {
    const result = document.getElementById("typingResult");
    if (!result) {
      return;
    }

    result.textContent = message;
    result.className = `activity-result${type ? ` ${type}` : ""}`;
    result.style.display = visible ? "block" : "none";
  }

  function updateTypingResultCards(metrics) {
    document.getElementById("typingResultWpm").textContent = metrics.netWpm;
    document.getElementById("typingResultWps").textContent = metrics.wps.toFixed(1);
    document.getElementById("typingResultAccuracy").textContent = `${metrics.accuracy}%`;
    document.getElementById("typingResultCorrectChars").textContent = metrics.correctChars;
    document.getElementById("typingResultTotalChars").textContent = metrics.typedChars;
    document.getElementById("typingResultTimeUsed").textContent = `${metrics.elapsedSeconds}s`;
  }

  function setTypingResultsVisibility(visible) {
    const resultsGrid = document.getElementById("typingResultsGrid");
    if (resultsGrid) {
      resultsGrid.style.display = visible ? "grid" : "none";
    }
  }

  function formatTypingDurationLabel(seconds) {
    return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
  }

  function refreshTypingStartButtonLabel() {
    const startButton = document.getElementById("typingStartBtn");
    if (!startButton) {
      return;
    }

    startButton.textContent = typingTestActive ? "↻ Restart Test" : `▶ Start Test (${formatTypingDurationLabel(typingDuration)})`;
  }

  function setTypingDuration(value) {
    const duration = Number(value);
    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    typingDuration = duration;
    remainingTypingSeconds = duration;
    const select = document.getElementById("typingDurationSelect");
    if (select) {
      select.value = String(duration);
    }
    document.getElementById("typingTimeLeft").textContent = `${duration}s`;
    refreshTypingStartButtonLabel();

    if (!typingTestActive && !typingPaused) {
      document.getElementById("typingProgressBar").style.width = "0%";
    }
  }

  function stopTypingTimer() {
    clearInterval(typingTimer);
    typingTimer = null;
  }

  function syncTypingProgress() {
    const elapsed = typingDuration - remainingTypingSeconds;
    const progress = Math.min(100, (elapsed / typingDuration) * 100);
    document.getElementById("typingProgressBar").style.width = `${progress}%`;
  }

  function tickTypingTimer() {
    const input = getTypingInputElement();
    const elapsedMs = Date.now() - typingStartedAt;
    remainingTypingSeconds = Math.max(0, typingDuration - Math.floor(elapsedMs / 1000));
    syncTypingProgress();
    updateTypingDashboard(getTypingMetrics(input.value));

    if (elapsedMs >= typingDuration * 1000) {
      finishTypingTest();
    }
  }

  function setupTypingGame() {
    if (typingGameInitialized) {
      return;
    }

    const input = getTypingInputElement();
    if (!input) {
      return;
    }

    input.addEventListener("input", () => {
      const limitedValue = input.value.slice(0, typingTargetText.length || input.value.length);
      if (input.value !== limitedValue) {
        input.value = limitedValue;
      }

      const metrics = getTypingMetrics(input.value);
      renderTypingText(input.value);
      updateTypingDashboard(metrics);

      if (typingTestActive && input.value === typingTargetText) {
        finishTypingTest();
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
      }
    });

    typingGameInitialized = true;
    setRushDuration(rushRoundDuration);
    setTypingDuration(typingDuration);
    renderTypingText("");
    const initialMetrics = {
      typedChars: 0,
      correctChars: 0,
      accuracy: 100,
      netWpm: 0,
      wps: 0,
      elapsedSeconds: 0,
      completedWords: 0
    };
    updateTypingDashboard(initialMetrics);
    updateTypingResultCards(initialMetrics);
    setTypingResultsVisibility(false);
    refreshTypingStartButtonLabel();
  }

  function finishTypingTest() {
    if (!typingTestActive && !typingPaused) {
      return;
    }

    stopTypingTimer();
    typingPaused = false;
    typingTestActive = false;

    const input = getTypingInputElement();
    const metrics = getTypingMetrics(input.value);
    const xpReward = Math.max(5, Math.min(35, Math.round(metrics.netWpm / 2)));

    appState.typingBestWpm = Math.max(appState.typingBestWpm, metrics.netWpm);
    appState.xp += xpReward;
    remainingTypingSeconds = 0;
    syncTypingProgress();
    updateTypingDashboard(metrics);
    renderTypingText(input.value);
    input.disabled = true;
    document.getElementById("typingPauseBtn").style.display = "none";
    document.getElementById("typingPauseBtn").textContent = "⏸️ Pause";
    refreshTypingStartButtonLabel();
    updateTypingResultCards(metrics);
    setTypingResultsVisibility(true);
    setTypingResult(`Finished at ${metrics.netWpm} WPM with ${metrics.accuracy}% accuracy. You earned +${xpReward} XP.`, "success");
    showNotification(`Typing test complete: ${metrics.netWpm} WPM`, "xp");
    updateDashboard();
  }

  function startTypingTest() {
    stopTypingTimer();
    typingPaused = false;
    typingTestActive = true;
    remainingTypingSeconds = typingDuration;
    typingStartedAt = Date.now();
    buildTypingText();

    const input = getTypingInputElement();
    input.disabled = false;
    input.value = "";
    input.focus();

    renderTypingText("");
    updateTypingDashboard(getTypingMetrics(""));
    document.getElementById("typingPauseBtn").style.display = "inline-flex";
    document.getElementById("typingPauseBtn").textContent = "⏸️ Pause";
    refreshTypingStartButtonLabel();
    document.getElementById("typingProgressBar").style.width = "0%";
    setTypingResultsVisibility(false);
    setTypingResult("", "", false);
    typingTimer = setInterval(tickTypingTimer, 100);
  }

  function pauseTypingTest() {
    if (!typingTestActive && !typingPaused) {
      return;
    }

    if (!typingPaused) {
      stopTypingTimer();
      typingPaused = true;
      typingTestActive = false;
      getTypingInputElement().disabled = true;
      document.getElementById("typingPauseBtn").textContent = "▶ Resume";
      setTypingResult("", "", false);
      setTypingResultsVisibility(false);
      return;
    }

    typingPaused = false;
    typingTestActive = true;
    getTypingInputElement().disabled = false;
    getTypingInputElement().focus();
    document.getElementById("typingPauseBtn").textContent = "⏸️ Pause";
    typingStartedAt = Date.now() - ((typingDuration - remainingTypingSeconds) * 1000);
    setTypingResult("", "", false);
    typingTimer = setInterval(tickTypingTimer, 100);
  }

  function stopPuzzleTimer() {
    clearInterval(puzzleTimer);
    puzzleTimer = null;
  }

  function updatePuzzleStats() {
    const elapsedSeconds = puzzleStartedAt ? Math.floor((Date.now() - puzzleStartedAt) / 1000) : 0;
    document.getElementById("puzzleMoves").textContent = puzzleMoves;
    document.getElementById("puzzleMatches").textContent = `${puzzleMatchedPairs}/${puzzleData[currentPuzzleIndex].pairs.length}`;
    document.getElementById("puzzleTimer").textContent = `${elapsedSeconds}s`;
  }

  function createPuzzleDeck() {
    const puzzle = puzzleData[currentPuzzleIndex];
    const cards = puzzle.pairs.flatMap((pair, index) => ([
      { id: `${index}-tag`, pairId: index, type: "Tag", value: pair.label, revealed: false, matched: false },
      { id: `${index}-meaning`, pairId: index, type: "Meaning", value: pair.match, revealed: false, matched: false }
    ]));
    puzzleDeck = shufflePuzzleDeck(cards);
  }

  function isPuzzleUnlocked(index) {
    if (index < 0 || index >= puzzleData.length) {
      return false;
    }

    return index === 0 || appState.completedPuzzles.includes(index) || appState.completedPuzzles.includes(index - 1);
  }

  function renderPuzzleBoard() {
    const board = document.getElementById("puzzleBoard");
    board.innerHTML = "";

    puzzleDeck.forEach((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `puzzle-memory-card${card.revealed ? " revealed" : ""}${card.matched ? " matched" : ""}`;
      button.disabled = card.matched || puzzleLocked;
      button.addEventListener("click", () => flipPuzzleCard(index));

      if (card.revealed || card.matched) {
        button.innerHTML = `<span class="puzzle-card-type">${card.type}</span><span class="puzzle-card-value">${escapeHtml(card.value)}</span>`;
      } else {
        button.innerHTML = '<span class="puzzle-card-type">Hidden</span><span class="puzzle-card-value">?</span>';
      }

      board.appendChild(button);
    });
  }

  function renderPuzzle() {
    const puzzle = puzzleData[currentPuzzleIndex];
    document.getElementById("puzzleLevelNum").textContent = currentPuzzleIndex + 1;
    document.getElementById("puzzleLevelTotal").textContent = puzzleData.length;
    document.getElementById("puzzleXp").textContent = `+${puzzle.xp} XP`;
    document.getElementById("puzzleTitle").textContent = puzzle.title;
    document.getElementById("puzzleDifficulty").textContent = puzzle.difficulty;
    document.getElementById("puzzleDescription").textContent = puzzle.description;
    document.getElementById("puzzleHint").textContent = puzzle.hint;
    document.getElementById("puzzleHint").style.display = "none";
    document.getElementById("puzzleResult").textContent = "";
    document.getElementById("puzzleResult").className = "activity-result";
    document.getElementById("puzzleCompletedBadge").style.display = appState.completedPuzzles.includes(currentPuzzleIndex) ? "inline-flex" : "none";

    const levelButtons = document.getElementById("puzzleLevelButtons");
    levelButtons.innerHTML = puzzleData.map((_, index) => `
      <button
        class="puzzle-level-btn ${isPuzzleUnlocked(index) ? "unlocked" : "locked"} ${index === currentPuzzleIndex ? "active" : ""} ${appState.completedPuzzles.includes(index) ? "completed" : ""}"
        onclick="setPuzzleLevel(${index})"
        ${isPuzzleUnlocked(index) ? "" : "disabled"}
        aria-label="Level ${index + 1} ${isPuzzleUnlocked(index) ? (appState.completedPuzzles.includes(index) ? "completed" : "unlocked") : "locked"}"
      >
        <span class="puzzle-level-num">${index + 1}</span>
        <span class="puzzle-level-state">${appState.completedPuzzles.includes(index) ? "Done" : isPuzzleUnlocked(index) ? "Open" : "Locked"}</span>
      </button>
    `).join("");

    puzzleMoves = 0;
    puzzleMatchedPairs = 0;
    puzzleFlippedCards = [];
    puzzleLocked = false;
    stopPuzzleTimer();
    puzzleStartedAt = Date.now();
    createPuzzleDeck();
    renderPuzzleBoard();
    updatePuzzleStats();
    puzzleTimer = setInterval(updatePuzzleStats, 1000);
  }

  function setPuzzleLevel(index) {
    if (!isPuzzleUnlocked(index)) {
      showNotification("Finish the previous level to unlock this one.", "info");
      return;
    }

    currentPuzzleIndex = index;
    renderPuzzle();
  }

  // Level navigation happens via the level map buttons.

  function togglePuzzleHint() {
    const hint = document.getElementById("puzzleHint");
    hint.style.display = hint.style.display === "block" ? "none" : "block";
  }

  function resetPuzzleLevel() {
    renderPuzzle();
  }

  function completePuzzleLevel() {
    stopPuzzleTimer();
    const puzzle = puzzleData[currentPuzzleIndex];
    const result = document.getElementById("puzzleResult");
    result.textContent = `Board cleared in ${puzzleMoves} moves. You earned +${puzzle.xp} XP.`;
    result.className = "activity-result success";

    if (!appState.completedPuzzles.includes(currentPuzzleIndex)) {
      appState.completedPuzzles.push(currentPuzzleIndex);
      appState.xp += puzzle.xp;
    }

    document.getElementById("puzzleCompletedBadge").style.display = "inline-flex";
    updateDashboard();
    renderPuzzleBoard();
  }

  function flipPuzzleCard(index) {
    const card = puzzleDeck[index];
    if (!card || card.matched || card.revealed || puzzleLocked) {
      return;
    }

    card.revealed = true;
    puzzleFlippedCards.push(index);
    renderPuzzleBoard();

    if (puzzleFlippedCards.length < 2) {
      return;
    }

    puzzleMoves += 1;
    updatePuzzleStats();
    const [firstIndex, secondIndex] = puzzleFlippedCards;
    const firstCard = puzzleDeck[firstIndex];
    const secondCard = puzzleDeck[secondIndex];

    if (firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
      firstCard.matched = true;
      secondCard.matched = true;
      puzzleMatchedPairs += 1;
      puzzleFlippedCards = [];
      renderPuzzleBoard();
      updatePuzzleStats();

      if (puzzleMatchedPairs === puzzleData[currentPuzzleIndex].pairs.length) {
        completePuzzleLevel();
      }
      return;
    }

    puzzleLocked = true;
    setTimeout(() => {
      firstCard.revealed = false;
      secondCard.revealed = false;
      puzzleFlippedCards = [];
      puzzleLocked = false;
      renderPuzzleBoard();
    }, 800);
  }

  async function initApp() {
    updateSecureSyncLabel(true);
    let secretBuffer = "";
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
    setupPhoneInputs();
    updateDashboard();
    syncSettingsUI();
    setupNavigationClicks();

    renderPuzzle();
    setupTypingGame();
    updateRushStats();
    showGamesMode("rush");
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
          syncSettingsUI();
          updateDashboard();
          renderPuzzle();
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
    return [...getHTMLQuizData(), ...getJSQuizData()];
  };
  window.showNotification = showNotification;
  window.showGamesMode = showGamesMode;
  window.startRushGame = startRushGame;
  window.pauseRushGame = pauseRushGame;
  window.skipRushQuestion = skipRushQuestion;
  window.setRushDuration = setRushDuration;
  window.startTypingTest = startTypingTest;
  window.pauseTypingTest = pauseTypingTest;
  window.setTypingDuration = setTypingDuration;
  window.sendEmailVerificationCode = sendEmailVerificationCode;
  window.verifyEmailCode = verifyEmailCode;
  window.sendPhoneVerificationCode = sendPhoneVerificationCode;
  window.verifyPhoneCode = verifyPhoneCode;
  window.changePassword = changePassword;
  window.exportAccountData = exportAccountData;
  window.clearLocalData = clearLocalData;
  window.togglePuzzleHint = togglePuzzleHint;
  window.resetPuzzleLevel = resetPuzzleLevel;
  function filterHtmlLessons(level) {
    const list = document.getElementById("lessonHtmlList");
    if (!list) return;

    const cards = Array.from(list.querySelectorAll(".topic-card[data-html-level]"));
    cards.forEach((card) => {
      const cardLevel = card.getAttribute("data-html-level");
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

  window.setPuzzleLevel = setPuzzleLevel;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
