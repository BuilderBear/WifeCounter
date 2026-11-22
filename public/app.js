import { firebaseConfig } from "./firebase-config.js";

// ✏️ Put your brother's name here (shows up in the subtitle)
const BROTHER_NAME = "Danny";

const SDK = "https://www.gstatic.com/firebasejs/11.0.2";

const $ = (id) => document.getElementById(id);
const els = {
  loading: $("loading"),
  loginView: $("login-view"),
  counterView: $("counter-view"),
  loginBtn: $("login-btn"),
  loginError: $("login-error"),
  logoutBtn: $("logout-btn"),
  plusBtn: $("plus-btn"),
  minusBtn: $("minus-btn"),
  count: $("count"),
  milestone: $("milestone"),
  lastBy: $("last-by"),
  who: $("who"),
  error: $("error"),
  fx: $("fx-layer"),
};

els.loginError.textContent = "";
$("brother-name").textContent = BROTHER_NAME;

let currentCount = null;

// ---------------------------------------------------------------------------
// Rendering + fun bits
// ---------------------------------------------------------------------------

const PLUS_WORDS = ["WIFE!", "MY WIFE!", "POW!", "KA-WIFE!", "BAM!", "AGAIN?!", "WIFEY!", "HUBBY ALERT!"];
const MINUS_WORDS = ["oops", "nvm", "false alarm", "*rewinds*"];

function milestoneText(n) {
  if (n == null) return "Warming up the wife detector…";
  if (n === 0) return "Suspiciously quiet. Is he okay?";
  if (n === 1) return "And so it begins…";
  if (n === 69) return "Nice.";
  if (n === 100) return "💯 ONE HUNDRED WIVES (it's the same wife)";
  if (n === 500) return "Half a thousand. Somebody stage an intervention.";
  if (n === 1000) return "🏆 1,000! Legendary husband status unlocked.";
  if (n < 5) return "Just a little warm-up wife.";
  if (n < 10) return "He's getting comfortable with the word.";
  if (n < 25) return "Okay, he's definitely doing this on purpose.";
  if (n < 50) return "The word has lost all meaning.";
  if (n < 100) return "Professional wife-sayer.";
  if (n < 250) return "Elite. Unmatched. Married.";
  if (n < 500) return "This is now his entire personality.";
  if (n < 1000) return "Scientists are studying him.";
  return "He has transcended. He is the wife now.";
}

function render(count, lastBy, lastAction) {
  const prev = currentCount;
  currentCount = count;

  const text = count.toLocaleString();
  els.count.textContent = text;
  els.count.classList.toggle("digits-3", text.length === 3);
  els.count.classList.toggle("digits-4", text.length >= 4);
  els.milestone.textContent = milestoneText(count);
  els.minusBtn.disabled = count <= 0;
  els.plusBtn.disabled = false;

  if (lastBy) {
    els.lastBy.textContent = `Last tap: ${lastBy} (${lastAction === "minus" ? "−1, mistake" : "+1"})`;
  }

  if (prev != null && count !== prev) {
    const up = count > prev;
    els.count.classList.remove("pop", "shrink");
    void els.count.offsetWidth; // restart animation
    els.count.classList.add(up ? "pop" : "shrink");
    spawnWord(up);
    if (up) spawnHearts();
    if (navigator.vibrate) navigator.vibrate(up ? 30 : [15, 40, 15]);
  }
}

function burstCenter() {
  const r = els.count.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function spawnWord(up) {
  const list = up ? PLUS_WORDS : MINUS_WORDS;
  const { x, y } = burstCenter();
  const el = document.createElement("div");
  el.className = "fx-word" + (up ? "" : " sad");
  el.textContent = list[Math.floor(Math.random() * list.length)];
  el.style.left = `${x + (Math.random() * 120 - 60)}px`;
  el.style.top = `${y - 60}px`;
  el.style.setProperty("--rot", `${Math.random() * 24 - 12}deg`);
  els.fx.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function spawnHearts() {
  const { x, y } = burstCenter();
  const icons = ["❤️", "💍", "💕", "💒"];
  for (let i = 0; i < 7; i++) {
    const el = document.createElement("div");
    el.className = "fx-heart";
    el.textContent = icons[Math.floor(Math.random() * icons.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 80;
    el.style.left = `${x - 13}px`;
    el.style.top = `${y - 13}px`;
    el.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    el.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    els.fx.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.toggle("hidden", !msg);
}

function showView(view) {
  els.loading.classList.toggle("hidden", view !== "loading");
  els.loginView.classList.toggle("hidden", view !== "login");
  els.counterView.classList.toggle("hidden", view !== "counter");
}

// ---------------------------------------------------------------------------
// Demo mode (used until firebase-config.js is filled in, so you can preview)
// ---------------------------------------------------------------------------

function startDemo() {
  console.warn("firebase-config.js not filled in — running in local demo mode.");
  showView("counter");
  els.who.textContent = "DEMO MODE (not saved)";
  els.logoutBtn.classList.add("hidden");
  let n = 0;
  render(n);
  els.plusBtn.onclick = () => render(++n, "you", "plus");
  els.minusBtn.onclick = () => n > 0 && render(--n, "you", "minus");
}

// ---------------------------------------------------------------------------
// Firebase mode
// ---------------------------------------------------------------------------

async function startFirebase() {
  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } = authMod;
  const { getFirestore, doc, onSnapshot, setDoc, increment, serverTimestamp } = fsMod;

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const counterRef = doc(db, "counters", "wife");
  const provider = new GoogleAuthProvider();

  let unsubscribe = null;
  let myName = "someone";

  els.loginBtn.onclick = async () => {
    showError(els.loginError, "");
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, provider);
      } else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
        showError(els.loginError, `Couldn't sign in: ${e.message}`);
      }
    }
  };

  els.logoutBtn.onclick = () => signOut(auth);

  async function bump(delta) {
    showError(els.error, "");
    if (delta < 0 && (currentCount ?? 0) <= 0) return;
    try {
      await setDoc(
        counterRef,
        {
          count: increment(delta),
          lastBy: myName.slice(0, 60),
          lastAction: delta > 0 ? "plus" : "minus",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      showError(els.error, `That didn't save: ${e.message}`);
    }
  }

  els.plusBtn.onclick = () => bump(1);
  els.minusBtn.onclick = () => bump(-1);

  onAuthStateChanged(auth, (user) => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    currentCount = null;

    if (!user) {
      showView("login");
      return;
    }

    myName = (user.displayName || user.email || "someone").split(" ")[0];
    els.who.textContent = `Counting as ${user.displayName || user.email}`;
    els.count.textContent = "–";
    els.plusBtn.disabled = true;
    els.minusBtn.disabled = true;
    showView("counter");

    unsubscribe = onSnapshot(
      counterRef,
      (snap) => {
        const d = snap.data() || {};
        render(d.count ?? 0, d.lastBy, d.lastAction);
      },
      (e) => showError(els.error, `Can't read the counter: ${e.message}`)
    );
  });
}

const configured = !Object.values(firebaseConfig).some((v) => String(v).includes("REPLACE_ME"));
if (configured) {
  startFirebase().catch((e) => {
    showView("login");
    showError(els.loginError, `Failed to load Firebase: ${e.message}`);
  });
} else {
  startDemo();
}
