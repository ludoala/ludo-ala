// ══════════════════════════════════════════
// LUDO ALA — Core Game Logic
// Turn management, dice, token movement
// ══════════════════════════════════════════

const Game = (() => {
  let roomData      = null;
  let gameStateRef  = null;
  let state         = null;
  let turnOrder     = [];
  let myUid         = null;
  let isAIGame      = false;

  const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  const SAFE_POS   = new Set([0,8,13,21,26,34,39,47]);
  const FINISH     = 56;

  // ── Start Game ───────────────────────────
  function startGame(room) {
    roomData  = room;
    isAIGame  = false;
    myUid     = Auth.getUser()?.uid;
    turnOrder = Object.keys(room.players);

    state = {
      currentTurn: 0,
      currentPlayer: turnOrder[0],
      diceValue: 0,
      tokenPositions: new Array(turnOrder.length * 4).fill(-1),
      finished: []
    };

    // Firebase game state ref
    gameStateRef = db.ref(`rooms/${room.roomId}/gameState`);
    gameStateRef.on('value', onRemoteState);

    // Host initializes state
    if (room.host === myUid) pushState();

    UI.showScreen('game');
    UI.setupGamePlayers(room.players, turnOrder);
    Board.init(document.getElementById('ludoBoard'));
    renderTokens();
    updateTurnUI();
  }

  // ── Start vs AI ──────────────────────────
  function startAIGame() {
    isAIGame = true;
    myUid    = Auth.getUser()?.uid || 'local';
    const aiId = 'ai_opponent';

    roomData = {
      roomId:  'ai_game',
      host:    myUid,
      players: {
        [myUid]: { uid:myUid, name: Auth.getUser()?.name||'You', color:'red',   connected:true },
        [aiId]:  { uid:aiId,  name: 'CPU',                       color:'blue',  connected:true }
      }
    };
    turnOrder = [myUid, aiId];
    state = {
      currentTurn: 0, currentPlayer: myUid, diceValue: 0,
      tokenPositions: new Array(8).fill(-1), finished: []
    };

    UI.showScreen('game');
    UI.setupGamePlayers(roomData.players, turnOrder);
    Board.init(document.getElementById('ludoBoard'));
    renderTokens();
    updateTurnUI();
  }

  // ── Roll Dice ────────────────────────────
  function rollDice() {
    if (!isMyTurn()) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    state.diceValue = roll;
    animateDice(roll);

    const movable = getMovable(myUid, roll);
    if (movable.length === 0) {
      UI.showToast(roll === 6 ? "No moves! Extra turn lost." : "No moves! Passing turn.");
      if (roll !== 6) nextTurn();
      else updateTurnUI();
    } else if (movable.length === 1) {
      setTimeout(() => moveToken(myUid, movable[0], roll), 600);
    } else {
      UI.highlightTokens(movable, tokenIndex => moveToken(myUid, tokenIndex, roll));
    }

    if (!isAIGame) pushState();
  }

  // ── Move Token ───────────────────────────
  function moveToken(uid, tokenIdx, steps) {
    const pidx    = turnOrder.indexOf(uid);
    const absIdx  = pidx * 4 + tokenIdx;
    let pos       = state.tokenPositions[absIdx];

    if (pos === -1 && steps !== 6) return;
    if (pos === -1 && steps === 6) pos = 0;
    else pos += steps;

    if (pos > FINISH) return; // Can't overshoot finish
    if (pos === FINISH) pos = FINISH;

    const wasCapture = checkCapture(pos, uid);
    state.tokenPositions[absIdx] = pos;
    renderTokens();

    if (wasCapture) {
      Auth.addCoins(5);
      UI.showToast("💥 Captured! +5 🪙");
    }

    if (pos === FINISH) checkWin(uid);

    const extraTurn = steps === 6 || wasCapture;
    if (!extraTurn) nextTurn();
    else {
      UI.showToast(steps === 6 ? "🎲 6! Roll again!" : "💥 Extra turn!");
      updateTurnUI();
    }

    if (!isAIGame) pushState();

    // AI turn
    if (isAIGame && !isMyTurn()) setTimeout(AI.takeTurn, 1000);
  }

  // ── Capture ──────────────────────────────
  function checkCapture(pos, attackerUid) {
    if (SAFE_POS.has(pos % 52)) return false;
    let captured = false;
    const attIdx = turnOrder.indexOf(attackerUid);
    for (let p=0; p<turnOrder.length; p++) {
      if (p === attIdx) continue;
      for (let t=0; t<4; t++) {
        const absIdx = p*4+t;
        if (state.tokenPositions[absIdx] === pos &&
            state.tokenPositions[absIdx] !== FINISH) {
          state.tokenPositions[absIdx] = -1;
          captured = true;
        }
      }
    }
    return captured;
  }

  // ── Win Check ────────────────────────────
  function checkWin(uid) {
    const pidx  = turnOrder.indexOf(uid);
    const won   = [0,1,2,3].every(t => state.tokenPositions[pidx*4+t] === FINISH);
    if (!won) return;

    if (gameStateRef) gameStateRef.off();
    const isMe = uid === myUid;
    Auth.addCoins(isMe ? 50 : 10);

    const name = roomData.players[uid]?.name || 'Player';
    UI.showGameOver(isMe, name, isMe ? 50 : 10);

    if (!isAIGame) {
      db.ref(`rooms/${roomData.roomId}/status`).set('ended');
    }
  }

  // ── Next Turn ────────────────────────────
  function nextTurn() {
    state.currentTurn = (state.currentTurn + 1) % turnOrder.length;
    state.currentPlayer = turnOrder[state.currentTurn];
    updateTurnUI();
  }

  // ── Movable Tokens ───────────────────────
  function getMovable(uid, roll) {
    const pidx = turnOrder.indexOf(uid);
    if (pidx < 0) return [];
    const movable = [];
    for (let t=0; t<4; t++) {
      const pos = state.tokenPositions[pidx*4+t];
      if (pos === FINISH) continue;
      if (pos === -1 && roll !== 6) continue;
      const next = pos === -1 ? 0 : pos + roll;
      if (next > FINISH) continue;
      movable.push(t);
    }
    return movable;
  }

  // ── Dice Animation ───────────────────────
  function animateDice(val) {
    const el = document.getElementById('diceDisplay');
    el.classList.add('rolling');
    let i = 0;
    const interval = setInterval(() => {
      el.textContent = DICE_FACES[Math.floor(Math.random()*6)];
      if (++i >= 8) {
        clearInterval(interval);
        el.textContent = DICE_FACES[val-1];
        el.classList.remove('rolling');
      }
    }, 60);
  }

  // ── Render Tokens ────────────────────────
  function renderTokens() {
    const overlay = document.getElementById('boardOverlay');
    overlay.innerHTML = '';
    const colors = ['red','blue','green','yellow'];

    for (let p=0; p<turnOrder.length; p++) {
      const color = roomData.players[turnOrder[p]]?.color || colors[p];
      for (let t=0; t<4; t++) {
        const pos    = state.tokenPositions[p*4+t];
        const posXY  = Board.posToXY(pos, p);
        const isHome = pos < 0;

        // Home tokens: get slot position
        let x, y;
        if (isHome) {
          const slots = Board.homePosition(p);
          const slot  = Array.isArray(slots) ? slots[t] : slots;
          x = slot.x * Board.cell();
          y = slot.y * Board.cell();
        } else {
          x = posXY.x; y = posXY.y;
        }

        // Scale to actual canvas CSS size
        const canvas = document.getElementById('ludoBoard');
        const scale  = canvas.getBoundingClientRect().width / 360;
        const px     = x * scale;
        const py     = y * scale;

        const div = document.createElement('div');
        div.className = `token ${color}${isHome?' home':''}`;
        div.style.left = px + 'px';
        div.style.top  = py + 'px';
        div.textContent = t+1;
        div.dataset.tokenIdx = t;
        div.dataset.playerIdx = p;
        overlay.appendChild(div);
      }
    }
  }

  // ── Firebase Sync ────────────────────────
  function onRemoteState(snap) {
    if (!snap.exists() || !state) return;
    const remote = snap.val();
    if (!remote || remote.currentPlayer === myUid) return; // our own push
    state = remote;
    state.tokenPositions = Object.values(remote.tokenPositions || {});
    renderTokens();
    updateTurnUI();
  }

  function pushState() {
    if (!gameStateRef) return;
    gameStateRef.set({
      ...state,
      tokenPositions: [...state.tokenPositions]
    });
  }

  // ── UI Updates ────────────────────────────
  function updateTurnUI() {
    const isMe = isMyTurn();
    document.getElementById('btnRoll').disabled = !isMe;
    const currentName = roomData?.players[state.currentPlayer]?.name || 'Player';
    document.getElementById('turnText').textContent = isMe ? 'Your Turn!' : `${currentName}'s Turn`;
    const color = roomData?.players[state.currentPlayer]?.color || 'red';
    document.getElementById('turnDot').style.background =
      {red:'#FF3B3B',blue:'#2979FF',green:'#00C853',yellow:'#FFD600'}[color];
    document.getElementById('diceHint').textContent =
      isMe ? 'Tap Roll Dice!' : `Waiting for ${currentName}...`;
  }

  function isMyTurn() {
    return state?.currentPlayer === myUid;
  }

  function cleanup() {
    if (gameStateRef) { gameStateRef.off(); gameStateRef = null; }
    state = null; turnOrder = []; roomData = null;
  }

  return {
    startGame, startAIGame, rollDice, moveToken,
    getMovable, isMyTurn, cleanup,
    getState: () => state,
    getTurnOrder: () => turnOrder
  };
})();
