// ══════════════════════════════════════════
// LUDO ALA — Board Renderer
// Draws classic Ludo board on HTML5 Canvas
// ══════════════════════════════════════════

const Board = (() => {
  const COLORS = {
    red:    '#FF3B3B', blue:  '#2979FF',
    green:  '#00C853', yellow:'#FFD600',
    white:  '#F0F0FF', dark:  '#0D0D1A',
    safe:   '#FFB300', path:  '#1E1E38'
  };

  let canvas, ctx, size, cell;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx    = canvas.getContext('2d');
    resize();
    draw();
  }

  function resize() {
    const wrapper = canvas.parentElement;
    const s = Math.min(wrapper.clientWidth - 16, wrapper.clientHeight - 16, 360);
    canvas.style.width  = s + 'px';
    canvas.style.height = s + 'px';
    size = canvas.width = canvas.height = 360;
    cell = size / 15;
  }

  function draw() {
    ctx.clearRect(0, 0, size, size);
    drawBackground();
    drawHomeZones();
    drawPaths();
    drawSafeStars();
    drawHomeArrows();
    drawCenterStar();
  }

  function drawBackground() {
    ctx.fillStyle = '#12122A';
    roundRect(ctx, 0, 0, size, size, 12);
    ctx.fill();
  }

  function drawHomeZones() {
    // 4 colored home squares (6x6 cells each)
    const zones = [
      { x:0,   y:0,   color: COLORS.red    },  // top-left
      { x:9,   y:0,   color: COLORS.blue   },  // top-right
      { x:0,   y:9,   color: COLORS.green  },  // bottom-left
      { x:9,   y:9,   color: COLORS.yellow },  // bottom-right
    ];
    zones.forEach(z => {
      ctx.fillStyle = z.color + '33'; // transparent
      ctx.fillRect(z.x*cell, z.y*cell, 6*cell, 6*cell);

      // Inner safe circle area
      ctx.fillStyle = z.color + '22';
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 2;
      const cx = (z.x + 3) * cell;
      const cy = (z.y + 3) * cell;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2*cell, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();

      // Home token slots (4 circles inside)
      const offsets = [[-1,-1],[1,-1],[-1,1],[1,1]];
      offsets.forEach(([ox,oy]) => {
        const tx = cx + ox * cell * 0.9;
        const ty = cy + oy * cell * 0.9;
        ctx.beginPath();
        ctx.arc(tx, ty, cell*0.38, 0, Math.PI*2);
        ctx.fillStyle = z.color + '55';
        ctx.fill();
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });
  }

  function drawPaths() {
    // Draw all walkable cells
    const pathCells = getPathCells();
    pathCells.forEach(([col, row]) => {
      ctx.fillStyle = COLORS.path;
      ctx.fillRect(col*cell+1, row*cell+1, cell-2, cell-2);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.strokeRect(col*cell+1, row*cell+1, cell-2, cell-2);
    });

    // Colored home columns
    const homeColumns = [
      { cells: [[1,7],[2,7],[3,7],[4,7],[5,7]], color: COLORS.red },
      { cells: [[7,1],[7,2],[7,3],[7,4],[7,5]], color: COLORS.blue },
      { cells: [[9,7],[10,7],[11,7],[12,7],[13,7]], color: COLORS.yellow },
      { cells: [[7,9],[7,10],[7,11],[7,12],[7,13]], color: COLORS.green },
    ];
    homeColumns.forEach(({cells, color}) => {
      cells.forEach(([c,r]) => {
        ctx.fillStyle = color + '44';
        ctx.fillRect(c*cell+1, r*cell+1, cell-2, cell-2);
      });
    });
  }

  function drawSafeStars() {
    const stars = [[8,2],[2,6],[6,8],[8,12],[12,8],[6,2],[2,8],[12,6]];
    stars.forEach(([c,r]) => {
      drawStar(ctx, (c+0.5)*cell, (r+0.5)*cell, 5, cell*0.3, cell*0.14);
      ctx.fillStyle = COLORS.safe;
      ctx.fill();
    });
  }

  function drawHomeArrows() {
    // Arrows pointing toward center finish
    const arrows = [
      { x:7, y:6, angle: Math.PI },       // top → down
      { x:8, y:7, angle: Math.PI*1.5 },   // right → left
      { x:7, y:8, angle: 0 },             // bottom → up
      { x:6, y:7, angle: Math.PI*0.5 },   // left → right
    ];
    arrows.forEach(a => {
      ctx.save();
      ctx.translate((a.x+0.5)*cell, (a.y+0.5)*cell);
      ctx.rotate(a.angle);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(0, -cell*0.3);
      ctx.lineTo(cell*0.2, cell*0.1);
      ctx.lineTo(-cell*0.2, cell*0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  function drawCenterStar() {
    const cx = 7.5 * cell;
    const cy = 7.5 * cell;
    const r  = 1.4 * cell;
    // Rainbow quadrants
    const quads = [
      { start: -Math.PI/2,        color: COLORS.blue   },
      { start: 0,                  color: COLORS.yellow },
      { start: Math.PI/2,          color: COLORS.green  },
      { start: Math.PI,            color: COLORS.red    },
    ];
    quads.forEach(q => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, q.start, q.start + Math.PI/2);
      ctx.closePath();
      ctx.fillStyle = q.color + 'CC';
      ctx.fill();
    });
    // Center star
    drawStar(ctx, cx, cy, 6, r*0.7, r*0.3);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ── Path cell coordinates ─────────────────
  function getPathCells() {
    const cells = [];
    // Top arm
    for (let c=6;c<=8;c++) for (let r=0;r<=5;r++) cells.push([c,r]);
    // Bottom arm
    for (let c=6;c<=8;c++) for (let r=9;r<=14;r++) cells.push([c,r]);
    // Left arm
    for (let r=6;r<=8;r++) for (let c=0;c<=5;c++) cells.push([c,r]);
    // Right arm
    for (let r=6;r<=8;r++) for (let c=9;c<=14;c++) cells.push([c,r]);
    // Center
    for (let c=6;c<=8;c++) for (let r=6;r<=8;r++) cells.push([c,r]);
    return cells;
  }

  // ── Token pixel positions ─────────────────
  // Map logical board position (0-55) to canvas x,y
  function posToXY(pos, playerIdx) {
    if (pos < 0) return homePosition(playerIdx); // At home
    if (pos >= 56) return finishPosition(playerIdx);

    // Standard Ludo path — simplified 52-step path
    const path = getLudoPath();
    const relPos = (pos + playerIdx * 13) % 52;
    if (relPos < path.length) {
      const [c, r] = path[relPos];
      return { x: (c + 0.5) * cell, y: (r + 0.5) * cell };
    }
    return { x: 7.5*cell, y: 7.5*cell };
  }

  function homePosition(playerIdx) {
    const homeSlots = [
      [{x:1.6,y:1.6},{x:2.4,y:1.6},{x:1.6,y:2.4},{x:2.4,y:2.4}], // red
      [{x:9.6,y:1.6},{x:10.4,y:1.6},{x:9.6,y:2.4},{x:10.4,y:2.4}], // blue
      [{x:1.6,y:9.6},{x:2.4,y:9.6},{x:1.6,y:10.4},{x:2.4,y:10.4}], // green
      [{x:9.6,y:9.6},{x:10.4,y:9.6},{x:9.6,y:10.4},{x:10.4,y:10.4}], // yellow
    ];
    return homeSlots[playerIdx] || homeSlots[0];
  }

  function finishPosition(playerIdx) {
    const centers = [
      {x:6.5*cell, y:7.5*cell}, {x:7.5*cell, y:6.5*cell},
      {x:8.5*cell, y:7.5*cell}, {x:7.5*cell, y:8.5*cell}
    ];
    return centers[playerIdx] || centers[0];
  }

  function getLudoPath() {
    // Simplified 52-cell outer path (column, row)
    return [
      [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
      [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
      [0,7],[0,8],
      [1,8],[2,8],[3,8],[4,8],[5,8],
      [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
      [7,14],[8,14],
      [8,13],[8,12],[8,11],[8,10],[8,9],
      [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
      [14,7],[14,6],
      [13,6],[12,6],[11,6],[10,6],[9,6],
      [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
      [7,0]
    ];
  }

  function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i=0;i<spikes;i++) {
      ctx.lineTo(cx + Math.cos(rot)*outerR, cy + Math.sin(rot)*outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot)*innerR, cy + Math.sin(rot)*innerR);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
  }

  return { init, resize, draw, posToXY, homePosition, cell: () => cell };
})();
