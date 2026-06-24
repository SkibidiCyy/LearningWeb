import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  RecaptchaVerifier,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  updatePassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  initializeFirestore,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const config = window.FIREBASE_CONFIG || {};
const configured = Boolean(
  config.apiKey &&
  config.projectId &&
  !String(config.apiKey).includes("YOUR_") &&
  !String(config.projectId).includes("YOUR_")
);

let services;

if (!configured) {
  services = {
    configured: false,
    error: "Firebase is not configured yet. Update firebase-config.js with your project credentials."
  };
} else {
  try {
    const app = getApps().length ? getApp() : initializeApp(config);
    const auth = getAuth(app);
    const db = getApps().length
      ? getFirestore(app)
      : initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true
        });

    // Set persistence WITHOUT await - it returns a promise but we don't block on it
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Persistence setup skipped:", err.message);
    });

    services = {
      configured: true,
      app,
      auth,
      db,
      helpers: {
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        signInWithPhoneNumber,
        signOut,
        sendPasswordResetEmail,
        sendEmailVerification,
        updatePassword,
        reauthenticateWithCredential,
        EmailAuthProvider,
        RecaptchaVerifier,
        onAuthStateChanged,
        doc,
        getDoc,
        setDoc,
        serverTimestamp
      }
    };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    services = {
      configured: false,
      error: error.message || "Firebase initialization failed"
    };
  }
}

window.firebaseServices = services;
window.dispatchEvent(new CustomEvent("firebase-ready", { detail: services }));
