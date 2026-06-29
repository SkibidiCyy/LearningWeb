window.CodeLab = window.CodeLab || {};
(() => {
  const C = window.CodeLab;
  "use strict";

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
    showGameSpinner("sprintArea");
    requestAnimationFrame(() => {
      sprintState = { category: cat, difficulty: diff, lives: 3, score: 0, streak: 0, maxStreak: 0, questionIndex: 0, questions: qs, timer: null, timeLeft: 15, active: true, finished: false, totalCorrect: 0, totalQuestions: qs.length, answered: false };
      sprintState.timeLeft = 15;
      renderSprintGame();
      hideGameSpinner("sprintArea");
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
    });
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
    showGameSpinner("linkUpArea");
    requestAnimationFrame(() => {
      linkUpState = { category: cat, pairs: pairs.slice(0, totalPairs), selectedLeft: null, matchedPairs: [], wrongPairs: [], timer: null, timeLeft: totalPairs * 10, score: 0, active: true, mistakes: 0, finished: false };
      renderLinkUpGame();
      hideGameSpinner("linkUpArea");
      linkUpState.timer = setInterval(() => {
        linkUpState.timeLeft--;
        const hud = document.querySelector(".link-hud span:last-child");
        if (hud) hud.textContent = `⏱ ${linkUpState.timeLeft}s`;
        if (linkUpState.timeLeft <= 0) { clearInterval(linkUpState.timer); linkUpState.active = false; finishLinkUp(); }
      }, 1000);
    });
  }

  function selectLinkLeft(index) {
    if (!linkUpState.active) return;
    linkUpState.selectedLeft = index;
    document.querySelectorAll("#linkLeftCol .linkup-item").forEach((c, i) => c.classList.toggle("selected", i === index));
  }

  function selectLinkRight(index) {
    if (!linkUpState.active || linkUpState.selectedLeft === null) return;
    const leftIdx = linkUpState.selectedLeft;
    const shuffledLeft = document.querySelectorAll("#linkLeftCol .linkup-item");
    const shuffledRight = document.querySelectorAll("#linkRightCol .linkup-item");
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
    document.querySelectorAll("#linkLeftCol .linkup-item").forEach((c) => c.classList.remove("selected"));
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
    showGameSpinner("bugArea");
    requestAnimationFrame(() => {
      bugState = { category: cat, questions: qs, questionIndex: 0, score: 0, active: true, streak: 0, totalCorrect: 0, phase: "line", selectedLine: null, finished: false, lastCorrect: false, totalQuestions: qs.length };
      renderBugQuestion();
      hideGameSpinner("bugArea");
    });
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

  let typingState = { active: false, snippet: "", startTime: 0, correctChars: 0, totalChars: 0, timer: null, timeLeft: 60 };

  function renderTypingSetup() {
    const setup = document.getElementById("typingSetup");
    const game = document.getElementById("typingGame");
    if (setup) setup.style.display = "block";
    if (game) game.style.display = "none";
  }

  function startTyping() {
    const cat = document.getElementById("typingCategory")?.value || "all";
    const duration = parseInt(document.getElementById("typingDuration")?.value || "60", 10);
    const available = getFilteredSnippets(cat);
    const snippet = available.length > 0 ? available[Math.floor(Math.random() * available.length)].text : typingSnippets[0].text;
    if (!snippet) { showNotification("No snippets available for this category.", "warning"); return; }
    showGameSpinner("typingArea");
    requestAnimationFrame(() => {
    typingState = { active: true, snippet, startTime: 0, correctChars: 0, totalChars: 0, timer: null, timeLeft: duration };
    document.getElementById("typingSetup").style.display = "none";
    document.getElementById("typingGame").style.display = "block";
    document.getElementById("typingResult").style.display = "none";
    document.getElementById("typingSnippet").textContent = snippet;
    document.getElementById("typingTime").textContent = duration;
    document.getElementById("typingBest").textContent = appState.typingHighScore || 0;
    const fill = document.getElementById("typingProgressFill");
    if (fill) fill.style.width = "100%";
    const input = document.getElementById("typingInput");
    input.value = "";
    input.disabled = false;
    input.focus();

    typingState.startTime = Date.now();
    typingState.timer = setInterval(() => {
      typingState.timeLeft--;
      document.getElementById("typingTime").textContent = typingState.timeLeft;
      if (fill) fill.style.width = `${(typingState.timeLeft / duration) * 100}%`;
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
    hideGameSpinner("typingArea");
    });
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

  C.showGamesMode = showGamesMode;
  C.playCorrectChime = playCorrectChime;
  C.playWrongBuzz = playWrongBuzz;
  C.renderSprintIntro = renderSprintIntro;
  C.renderSprintGame = renderSprintGame;
  C.renderSprintResult = renderSprintResult;
  C.startSprint = startSprint;
  C.answerSprint = answerSprint;
  C.nextSprintQuestion = nextSprintQuestion;
  C.finishSprint = finishSprint;
  C.renderLinkUpSetup = renderLinkUpSetup;
  C.renderLinkUpGame = renderLinkUpGame;
  C.renderLinkUpResult = renderLinkUpResult;
  C.startLinkUp = startLinkUp;
  C.selectLinkLeft = selectLinkLeft;
  C.selectLinkRight = selectLinkRight;
  C.finishLinkUp = finishLinkUp;
  C.renderBugSetup = renderBugSetup;
  C.renderBugQuestion = renderBugQuestion;
  C.renderBugResult = renderBugResult;
  C.startBugHunt = startBugHunt;
  C.selectBuggyLine = selectBuggyLine;
  C.selectBugFix = selectBugFix;
  C.nextBug = nextBug;
  C.renderTypingSetup = renderTypingSetup;
  C.startTyping = startTyping;
  C.renderTypingSnippet = renderTypingSnippet;
  C.finishTyping = finishTyping;
})();
