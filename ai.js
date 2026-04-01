// ══════════════════════════════════════════
// LUDO ALA — AI Opponent
// Smart CPU player for offline mode
// ══════════════════════════════════════════

const AI = (() => {
  const FINISH = 56;

  function takeTurn() {
    const state     = Game.getState();
    const turnOrder = Game.getTurnOrder();
    if (!state) return;

    const aiUid  = turnOrder[state.currentTurn];
    if (aiUid === Auth.getUser()?.uid) return; // Not AI's turn

    const roll = Math.floor(Math.random() * 6) + 1;
    state.diceValue = roll;

    // Animate dice
    const el = document.getElementById('diceDisplay');
    el.textContent = ['⚀','⚁','⚂','⚃','⚄','⚅'][roll-1];

    const movable = Game.getMovable(aiUid, roll);
    if (movable.length === 0) {
      if (roll !== 6) {
        setTimeout(() => { /* next turn handled by game */ }, 400);
        Game.moveToken(aiUid, -1, roll); // trigger next turn
      }
      return;
    }

    const best = chooseBestMove(movable, aiUid, roll, state, turnOrder);
    setTimeout(() => Game.moveToken(aiUid, best, roll), 800);
  }

  function chooseBestMove(movable, aiUid, roll, state, turnOrder) {
    const pidx = turnOrder.indexOf(aiUid);
    let bestToken = movable[0];
    let bestScore = -Infinity;

    movable.forEach(t => {
      const absIdx = pidx*4+t;
      const curPos = state.tokenPositions[absIdx];
      const nextPos = curPos === -1 ? 0 : curPos + roll;
      const score   = scoreMove(nextPos, state, pidx, turnOrder);
      if (score > bestScore) { bestScore = score; bestToken = t; }
    });
    return bestToken;
  }

  function scoreMove(pos, state, myPidx, turnOrder) {
    if (pos >= FINISH) return 10000;
    let score = pos; // prefer forward progress
    if ([0,8,13,21,26,34,39,47].includes(pos % 52)) score += 25;

    // Bonus: can we capture?
    for (let p=0; p<turnOrder.length; p++) {
      if (p === myPidx) continue;
      for (let t=0; t<4; t++) {
        if (state.tokenPositions[p*4+t] === pos) score += 40;
      }
    }
    // Penalty: are we vulnerable?
    for (let p=0; p<turnOrder.length; p++) {
      if (p === myPidx) continue;
      for (let t=0; t<4; t++) {
        const op = state.tokenPositions[p*4+t];
        if (op >= 0 && pos - op >= 1 && pos - op <= 6) score -= 15;
      }
    }
    return score;
  }

  return { takeTurn };
})();
