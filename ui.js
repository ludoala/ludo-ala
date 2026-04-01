// ══════════════════════════════════════════
// LUDO ALA — UI Manager
// Screen switching, toasts, modals
// ══════════════════════════════════════════

const UI = (() => {
  let toastTimer = null;

  // ── Screens ──────────────────────────────
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`screen-${name}`);
    if (el) el.classList.add('active');
  }

  // ── Toast ────────────────────────────────
  function showToast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
  }

  // ── Modal ────────────────────────────────
  function showModal(id) {
    document.getElementById(id)?.classList.remove('hidden');
  }
  function hideModal(id) {
    document.getElementById(id)?.classList.add('hidden');
  }

  // ── Login Success ────────────────────────
  function onLoginSuccess(user) {
    document.getElementById('lobbyName').textContent   = user.name;
    document.getElementById('lobbyCoins').textContent  = `🪙 ${user.coins}`;
    document.getElementById('lobbyAvatar').textContent = user.name[0].toUpperCase();
    document.getElementById('gameCoins').textContent   = `🪙 ${user.coins}`;
    showScreen('lobby');
    checkDailyReward(user);
  }

  function checkDailyReward(user) {
    const today = new Date().toISOString().split('T')[0];
    const shown = user.lastReward !== today;
    document.getElementById('dailyReward').style.display = shown ? 'flex' : 'none';
  }

  function updateCoinsDisplay(coins) {
    document.getElementById('lobbyCoins').textContent = `🪙 ${coins}`;
    document.getElementById('gameCoins').textContent  = `🪙 ${coins}`;
  }

  // ── Room UI ──────────────────────────────
  function showRoom(roomId, room, isHost) {
    document.getElementById('roomCodeDisplay').textContent = roomId;
    document.getElementById('hostControls').style.display = isHost ? 'block' : 'none';
    document.getElementById('guestWaiting').style.display = isHost ? 'none' : 'block';
    updateRoomPlayers(room.players || {});
    showScreen('room');
  }

  function updateRoomPlayers(players) {
    const grid = document.getElementById('playersGrid');
    const slots = Array(4).fill(null);
    const colors = ['red','blue','green','yellow'];
    const colorEmoji = {red:'🔴',blue:'🔵',green:'🟢',yellow:'🟡'};

    Object.values(players).forEach((p, i) => { if (i < 4) slots[i] = p; });

    grid.innerHTML = slots.map((p, i) => {
      if (p) return `
        <div class="player-slot filled">
          <div class="slot-icon">${colorEmoji[p.color] || '🎮'}</div>
          <div class="slot-name">${p.name}</div>
          ${p.uid === Auth.getUser()?.uid ? '<div class="slot-badge">You</div>' : ''}
          ${!p.connected ? '<div class="slot-badge" style="color:#ff6b6b">Disconnected</div>' : ''}
        </div>`;
      return `
        <div class="player-slot empty">
          <div class="slot-icon">👤</div>
          <div class="slot-name">Waiting...</div>
        </div>`;
    }).join('');
  }

  // ── Game UI ──────────────────────────────
  function setupGamePlayers(players, turnOrder) {
    const colorEmoji = {red:'🔴',blue:'🔵',green:'🟢',yellow:'🟡'};
    const panelIds   = ['red','blue','green','yellow'];

    Object.values(players).forEach((p, i) => {
      const color = panelIds[i];
      const nameEl  = document.getElementById(`name-${color}`);
      const coinsEl = document.getElementById(`coins-${color}`);
      if (nameEl)  nameEl.textContent  = p.name;
      if (coinsEl) coinsEl.textContent = `🪙0`;
    });
  }

  function highlightTokens(tokenIndices, onSelect) {
    const tokens = document.querySelectorAll('.token');
    tokens.forEach(t => {
      const idx = parseInt(t.dataset.tokenIdx);
      const pidx = parseInt(t.dataset.playerIdx);
      // Highlight own movable tokens
      if (tokenIndices.includes(idx) && pidx === 0) {
        t.classList.add('movable');
        t.style.pointerEvents = 'all';
        t.onclick = () => {
          clearHighlights();
          onSelect(idx);
        };
      }
    });
  }

  function clearHighlights() {
    document.querySelectorAll('.token').forEach(t => {
      t.classList.remove('movable');
      t.onclick = null;
    });
  }

  // ── Game Over ────────────────────────────
  function showGameOver(isWinner, winnerName, coinsEarned) {
    document.getElementById('goEmoji').textContent    = isWinner ? '🏆' : '😢';
    document.getElementById('goTitle').textContent    = isWinner ? 'You Win! 🎉' : `${winnerName} Won!`;
    document.getElementById('goSubtitle').textContent = isWinner ? 'Amazing game!' : 'Better luck next time!';
    document.getElementById('goCoinsEarned').textContent = `+${coinsEarned}`;
    showScreen('gameover');
  }

  // ── Leaderboard ──────────────────────────
  async function showLeaderboard() {
    showModal('modal-leaderboard');
    const el = document.getElementById('leaderboardList');
    el.innerHTML = '<div class="lb-loading">Loading...</div>';
    try {
      const snap = await db.ref('leaderboard').orderByChild('gamesWon')
        .limitToLast(10).once('value');
      const entries = [];
      snap.forEach(child => entries.unshift({name:child.val().name, coins:child.val().coins, wins:child.val().gamesWon||0}));
      if (!entries.length) { el.innerHTML = '<div class="lb-loading">No data yet!</div>'; return; }
      el.innerHTML = entries.map((e,i) => `
        <div class="lb-item">
          <div class="lb-rank">${['🥇','🥈','🥉'][i]||i+1}</div>
          <div class="lb-name">${e.name}</div>
          <div class="lb-coins">🪙 ${e.coins}</div>
        </div>`).join('');
    } catch(err) {
      el.innerHTML = '<div class="lb-loading">Could not load. Check internet.</div>';
    }
  }

  return {
    showScreen, showToast, showModal, hideModal,
    onLoginSuccess, updateCoinsDisplay, checkDailyReward,
    showRoom, updateRoomPlayers,
    setupGamePlayers, highlightTokens, clearHighlights,
    showGameOver, showLeaderboard
  };
})();
