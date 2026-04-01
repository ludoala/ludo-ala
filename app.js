// ══════════════════════════════════════════
// LUDO ALA — App Entry Point
// Wires all buttons, events, splash screen
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Splash screen + loader ───────────────
  let loadProgress = 0;
  const fill   = document.getElementById('loaderFill');
  const ltxt   = document.getElementById('loaderText');
  const msgs   = ['Loading game...','Connecting Firebase...','Setting up board...','Ready!'];
  const timer  = setInterval(() => {
    loadProgress += 25;
    fill.style.width = loadProgress + '%';
    ltxt.textContent = msgs[loadProgress/25 - 1] || 'Ready!';
    if (loadProgress >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        UI.showScreen('login');
        Auth.init();
      }, 400);
    }
  }, 400);

  // ══════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════
  document.getElementById('btnGoogleLogin').addEventListener('click', async () => {
    document.getElementById('btnGoogleLogin').textContent = '⏳ Signing in...';
    const ok = await Auth.loginGoogle();
    if (!ok) document.getElementById('btnGoogleLogin').innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24">...</svg>Continue with Google`;
  });

  document.getElementById('btnGuestLogin').addEventListener('click', async () => {
    const name = document.getElementById('guestName').value.trim();
    if (!name) { UI.showToast("Please enter your name!"); return; }
    document.getElementById('btnGuestLogin').textContent = '⏳ Joining...';
    const ok = await Auth.loginGuest(name);
    if (!ok) document.getElementById('btnGuestLogin').textContent = 'Play as Guest 🎮';
  });

  document.getElementById('guestName').addEventListener('keypress', e => {
    if (e.key === 'Enter') document.getElementById('btnGuestLogin').click();
  });

  // ══════════════════════════════
  // LOBBY SCREEN
  // ══════════════════════════════
  document.getElementById('btnQuickPlay').addEventListener('click', () => Room.quickMatch());
  document.getElementById('btnCreateRoom').addEventListener('click', () => Room.createRoom());
  document.getElementById('btnJoinRoom').addEventListener('click', () => UI.showModal('modal-joinroom'));
  document.getElementById('btnVsAI').addEventListener('click', () => {
    if (!Auth.isLoggedIn()) { UI.showToast("Please login first!"); return; }
    Game.startAIGame();
  });

  document.getElementById('btnClaim').addEventListener('click', () => Auth.claimDailyReward());
  document.getElementById('btnLogout').addEventListener('click', () => Auth.logout());
  document.getElementById('btnLeaderboard').addEventListener('click', () => UI.showLeaderboard());
  document.getElementById('btnShop').addEventListener('click', () => UI.showToast("Shop coming soon! 🛍️"));

  // Bottom nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      if (tab === 'wallet') UI.showToast("Wallet & Withdrawal coming soon! 💰");
      if (tab === 'friends') UI.showToast("Friends feature coming soon! 👥");
      if (tab === 'profile') showProfileToast();
    });
  });

  function showProfileToast() {
    const user = Auth.getUser();
    if (user) UI.showToast(`${user.name} | 🪙${user.coins} | Games: ${user.gamesPlayed}`);
  }

  // ══════════════════════════════
  // ROOM SCREEN
  // ══════════════════════════════
  document.getElementById('btnCopyCode').addEventListener('click', () => {
    const code = document.getElementById('roomCodeDisplay').textContent;
    if (navigator.share) {
      navigator.share({ title: 'Join my Ludo Ala room!', text: `Room code: ${code}\nJoin at: ${location.href}` });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      UI.showToast("Room code copied! 📋");
    } else {
      UI.showToast(`Code: ${code}`);
    }
  });

  document.getElementById('btnStartGame').addEventListener('click', () => Room.startGame());
  document.getElementById('btnLeaveRoom').addEventListener('click', () => {
    if (confirm('Leave the room?')) Room.leaveRoom();
  });

  // ══════════════════════════════
  // GAME SCREEN
  // ══════════════════════════════
  document.getElementById('btnRoll').addEventListener('click', () => Game.rollDice());

  document.getElementById('btnQuitGame').addEventListener('click', () => {
    if (confirm('Quit the game?')) {
      Game.cleanup();
      Room.leaveRoom();
      UI.showScreen('lobby');
    }
  });

  // ══════════════════════════════
  // GAME OVER SCREEN
  // ══════════════════════════════
  document.getElementById('btnPlayAgain').addEventListener('click', () => {
    Game.cleanup();
    UI.showScreen('lobby');
  });
  document.getElementById('btnGoHome').addEventListener('click', () => {
    Game.cleanup();
    UI.showScreen('lobby');
  });
  document.getElementById('btnWatchAd').addEventListener('click', () => {
    // Simulated rewarded ad
    UI.showToast("📺 Watching ad...");
    setTimeout(() => {
      Auth.addCoins(30);
      UI.showToast("🎉 +30 coins earned!");
      document.getElementById('btnWatchAd').disabled = true;
      document.getElementById('btnWatchAd').textContent = '✅ Reward claimed!';
    }, 2000);
  });

  // ══════════════════════════════
  // JOIN ROOM MODAL
  // ══════════════════════════════
  document.getElementById('btnConfirmJoin').addEventListener('click', async () => {
    const code = document.getElementById('joinRoomInput').value.trim().toUpperCase();
    if (code.length !== 6) { UI.showToast("Enter 6-digit room code!"); return; }
    UI.hideModal('modal-joinroom');
    await Room.joinRoom(code);
  });

  document.getElementById('joinRoomInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') document.getElementById('btnConfirmJoin').click();
  });

  // Close modals
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => UI.hideModal(btn.dataset.modal));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) UI.hideModal(overlay.id);
    });
  });

  // ══════════════════════════════
  // RESIZE HANDLER
  // ══════════════════════════════
  window.addEventListener('resize', () => {
    const canvas = document.getElementById('ludoBoard');
    if (canvas && canvas.isConnected) Board.resize();
  });

  // ══════════════════════════════
  // ONLINE / OFFLINE DETECTION
  // ══════════════════════════════
  window.addEventListener('offline', () => UI.showToast("⚠️ No internet!"));
  window.addEventListener('online',  () => UI.showToast("✅ Back online!"));

  console.log("🎲 Ludo Ala loaded!");
});
