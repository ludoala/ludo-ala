// ══════════════════════════════════════════
// LUDO ALA — Room Manager
// Create/Join rooms, reconnect (1-min window)
// ══════════════════════════════════════════

const Room = (() => {
  let currentRoomId   = null;
  let currentRoomRef  = null;
  let reconnectTimer  = null;
  const RECONNECT_MS  = 60000; // 1 minute

  const COLORS = ['red','blue','green','yellow'];
  const COLOR_EMOJI = { red:'🔴', blue:'🔵', green:'🟢', yellow:'🟡' };

  // ── Generate Room Code ───────────────────
  function genCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  }

  // ── Create Room ──────────────────────────
  async function createRoom() {
    const user   = Auth.getUser();
    const roomId = genCode();
    const slot   = {
      uid: user.uid, name: user.name,
      color: 'red', connected: true, ready: false
    };
    const roomData = {
      roomId, host: user.uid,
      status: 'waiting',
      created: Date.now(),
      players: { [user.uid]: slot }
    };
    await db.ref(`rooms/${roomId}`).set(roomData);
    currentRoomId = roomId;
    listenRoom(roomId);
    UI.showRoom(roomId, roomData, true);
    UI.showToast("Room created! Share the code 🎉");
    return roomId;
  }

  // ── Join Room ────────────────────────────
  async function joinRoom(roomId) {
    roomId = roomId.toUpperCase().trim();
    const snap = await db.ref(`rooms/${roomId}`).once('value');
    if (!snap.exists()) { UI.showToast("❌ Room not found!"); return false; }

    const room = snap.val();
    if (room.status !== 'waiting') { UI.showToast("❌ Game already started!"); return false; }

    const players = room.players || {};
    const count   = Object.keys(players).length;
    if (count >= 4) { UI.showToast("❌ Room is full!"); return false; }

    const user  = Auth.getUser();
    // Check if already in room (reconnect)
    if (players[user.uid]) {
      await db.ref(`rooms/${roomId}/players/${user.uid}/connected`).set(true);
      currentRoomId = roomId;
      listenRoom(roomId);
      UI.showRoom(roomId, room, false);
      return true;
    }

    const color = COLORS[count];
    const slot  = { uid: user.uid, name: user.name, color, connected: true, ready: false };
    await db.ref(`rooms/${roomId}/players/${user.uid}`).set(slot);
    currentRoomId = roomId;
    listenRoom(roomId);

    const updatedSnap = await db.ref(`rooms/${roomId}`).once('value');
    UI.showRoom(roomId, updatedSnap.val(), false);
    UI.showToast("Joined room! ✅");
    return true;
  }

  // ── Quick Match ──────────────────────────
  async function quickMatch() {
    UI.showToast("🔍 Finding opponent...");
    const snap = await db.ref('rooms')
      .orderByChild('status').equalTo('waiting')
      .limitToFirst(5).once('value');

    if (snap.exists()) {
      for (const child of Object.values(snap.val())) {
        const count = Object.keys(child.players || {}).length;
        const user  = Auth.getUser();
        if (count < 4 && !child.players?.[user.uid]) {
          const ok = await joinRoom(child.roomId);
          if (ok) return;
        }
      }
    }
    // No open rooms — create one
    await createRoom();
    UI.showToast("No rooms found — created new room! 🏠");
  }

  // ── Room Listener ────────────────────────
  function listenRoom(roomId) {
    if (currentRoomRef) currentRoomRef.off();
    currentRoomRef = db.ref(`rooms/${roomId}`);
    currentRoomRef.on('value', snap => {
      if (!snap.exists()) return;
      const room = snap.val();
      UI.updateRoomPlayers(room.players || {});
      if (room.status === 'playing') {
        Game.startGame(room);
      }
    });
  }

  // ── Start Game (host only) ───────────────
  async function startGame() {
    if (!currentRoomId) return;
    const snap = await db.ref(`rooms/${currentRoomId}/players`).once('value');
    const count = snap.numChildren();
    if (count < 2) { UI.showToast("Need at least 2 players!"); return; }
    await db.ref(`rooms/${currentRoomId}/status`).set('playing');
  }

  // ── Disconnect Handling ──────────────────
  async function onDisconnect() {
    if (!currentRoomId) return;
    const user = Auth.getUser();
    await db.ref(`rooms/${currentRoomId}/players/${user.uid}/connected`).set(false);
    // Set presence for reconnect window
    db.ref(`rooms/${currentRoomId}/players/${user.uid}/disconnectedAt`).set(Date.now());
  }

  async function tryReconnect(roomId) {
    const user = Auth.getUser();
    const snap = await db.ref(`rooms/${roomId}/players/${user.uid}`).once('value');
    if (!snap.exists()) return false;

    const slot = snap.val();
    const disconnectedAt = slot.disconnectedAt || 0;
    if (Date.now() - disconnectedAt > RECONNECT_MS) {
      UI.showToast("Reconnect window expired 😢");
      return false;
    }
    await db.ref(`rooms/${roomId}/players/${user.uid}/connected`).set(true);
    await db.ref(`rooms/${roomId}/players/${user.uid}/disconnectedAt`).remove();
    currentRoomId = roomId;
    listenRoom(roomId);
    UI.showToast("Reconnected! ✅");
    return true;
  }

  // ── Leave Room ───────────────────────────
  async function leaveRoom() {
    if (!currentRoomId) return;
    const user = Auth.getUser();
    if (currentRoomRef) { currentRoomRef.off(); currentRoomRef = null; }
    await db.ref(`rooms/${currentRoomId}/players/${user.uid}`).remove();
    // If host left — mark room ended
    const snap = await db.ref(`rooms/${currentRoomId}/host`).once('value');
    if (snap.val() === user.uid) {
      await db.ref(`rooms/${currentRoomId}/status`).set('ended');
    }
    currentRoomId = null;
    UI.showScreen('lobby');
  }

  return {
    createRoom, joinRoom, quickMatch, startGame,
    leaveRoom, onDisconnect, tryReconnect,
    getRoomId: () => currentRoomId,
    getColorEmoji: c => COLOR_EMOJI[c] || '⚫'
  };
})();
