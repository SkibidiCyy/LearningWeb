window.CodeLab = window.CodeLab || {};
(() => {
  const C = window.CodeLab;
  "use strict";

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

  C.ensurePhoneRecaptcha = ensurePhoneRecaptcha;
  C.sendPhoneAuthCode = sendPhoneAuthCode;
  C.confirmPhoneAuthCode = confirmPhoneAuthCode;
  C.getFirebaseConfigError = getFirebaseConfigError;
  C.updateSecureSyncLabel = updateSecureSyncLabel;
  C.setAppLoading = setAppLoading;
  C.setAuthBusy = setAuthBusy;
  C.waitForFirebaseServices = waitForFirebaseServices;
  C.isAuthenticated = isAuthenticated;
  C.getSessionUser = getSessionUser;
  C.applyAccountToState = applyAccountToState;
  C.applyCloudState = applyCloudState;
  C.serializeStateForCloud = serializeStateForCloud;
  C.persistStateNow = persistStateNow;
  C.queueStateSave = queueStateSave;
  C.saveState = saveState;
  C.saveCurrentAccount = saveCurrentAccount;
  C.hydrateStateForUser = hydrateStateForUser;
  C.setAccountStatus = setAccountStatus;
  C.setVerifyHelp = setVerifyHelp;
  C.setVerifyBadge = setVerifyBadge;
  C.renderVerificationUI = renderVerificationUI;
  C.clearPendingEmailVerification = clearPendingEmailVerification;
  C.clearPendingPhoneVerification = clearPendingPhoneVerification;
  C.generateSixDigitCode = generateSixDigitCode;
  C.isValidEmail = isValidEmail;
  C.normalizePhone = normalizePhone;
  C.isValidPhone = isValidPhone;
  C.sendEmailVerificationCode = sendEmailVerificationCode;
  C.verifyEmailCode = verifyEmailCode;
  C.sendPhoneVerificationCode = sendPhoneVerificationCode;
  C.verifyPhoneCode = verifyPhoneCode;
  C.changePassword = changePassword;
  C.exportAccountData = exportAccountData;
  C.clearLocalData = clearLocalData;
  C.login = login;
  C.register = register;
  C.logout = logout;
  C.forgotPassword = forgotPassword;
  C.closeForgotPasswordModal = closeForgotPasswordModal;
  C.sendResetCode = sendResetCode;
})();
