// ══════════════════════════════════════════
// LUDO ALA — Authentication
// Google Login + Guest mode + Profile
// ══════════════════════════════════════════

const Auth = (() => {
  let currentUser = null;

  // ── Login with Google ────────────────────
  async function loginGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      const result = await auth.signInWithPopup(provider);
      const user   = result.user;
      await createOrLoadProfile({
        uid:    user.uid,
        name:   user.displayName || 'Player',
        avatar: user.photoURL || '',
        isGuest: false
      });
      return true;
    } catch (e) {
      console.error("Google login failed:", e);
      UI.showToast("Google login failed. Try guest mode!");
      return false;
    }
  }

  // ── Guest Login ──────────────────────────
  async function loginGuest(name) {
    if (!name || name.trim().length < 2) {
      UI.showToast("Name must be at least 2 characters!");
      return false;
    }
    try {
      const result = await auth.signInAnonymously();
      await createOrLoadProfile({
        uid:     result.user.uid,
        name:    name.trim(),
        avatar:  '',
        isGuest: true
      });
      return true;
    } catch (e) {
      console.error("Guest login failed:", e);
      UI.showToast("Login failed. Check internet!");
      return false;
    }
  }

  // ── Create or Load Profile ───────────────
  async function createOrLoadProfile(data) {
    const snap = await db.ref(`users/${data.uid}`).once('value');
    if (snap.exists()) {
      currentUser = snap.val();
    } else {
      currentUser = {
        uid:        data.uid,
        name:       data.name,
        avatar:     data.avatar,
        coins:      100,
        rank:       0,
        gamesPlayed: 0,
        gamesWon:   0,
        isGuest:    data.isGuest,
        createdAt:  Date.now()
      };
      await db.ref(`users/${data.uid}`).set(currentUser);
    }
    console.log("✅ Profile loaded:", currentUser.name);
  }

  // ── Logout ───────────────────────────────
  async function logout() {
    await auth.signOut();
    currentUser = null;
    UI.showScreen('login');
  }

  // ── Coins ────────────────────────────────
  async function addCoins(amount) {
    if (!currentUser) return;
    currentUser.coins += amount;
    await db.ref(`users/${currentUser.uid}/coins`).set(currentUser.coins);
    UI.updateCoinsDisplay(currentUser.coins);
  }

  async function spendCoins(amount) {
    if (!currentUser || currentUser.coins < amount) return false;
    currentUser.coins -= amount;
    await db.ref(`users/${currentUser.uid}/coins`).set(currentUser.coins);
    UI.updateCoinsDisplay(currentUser.coins);
    return true;
  }

  // ── Daily Reward ─────────────────────────
  async function claimDailyReward() {
    if (!currentUser) return;
    const today    = new Date().toISOString().split('T')[0];
    const lastSnap = await db.ref(`users/${currentUser.uid}/lastReward`).once('value');
    const lastDate = lastSnap.val();
    if (lastDate === today) {
      UI.showToast("Already claimed today! Come back tomorrow 🌙");
      return;
    }
    await addCoins(50);
    await db.ref(`users/${currentUser.uid}/lastReward`).set(today);
    UI.showToast("🎁 +50 coins claimed!");
    document.getElementById('dailyReward').style.display = 'none';
  }

  // ── Auth State Listener ──────────────────
  function init() {
    auth.onAuthStateChanged(async user => {
      if (user && !currentUser) {
        const snap = await db.ref(`users/${user.uid}`).once('value');
        if (snap.exists()) {
          currentUser = snap.val();
          UI.onLoginSuccess(currentUser);
        }
      }
    });
  }

  return {
    init, loginGoogle, loginGuest, logout,
    addCoins, spendCoins, claimDailyReward,
    getUser: () => currentUser,
    isLoggedIn: () => !!currentUser
  };
})();
