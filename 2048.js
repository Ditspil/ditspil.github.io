(() => {
  const SIZE   = 4;
  const TILE_GAP = 12;   // matches CSS gap & padding

  /* ── state ── */
  let grid, score, best, won, over;

  /* ── DOM refs ── */
  const boardEl     = document.getElementById('board');
  const container   = document.getElementById('tile-container');
  const scoreEl     = document.getElementById('score');
  const bestEl      = document.getElementById('best');
  const overlayWin  = document.getElementById('overlay-win');
  const overlayLose = document.getElementById('overlay-lose');

  document.getElementById('btn-new').onclick  = startGame;
  document.getElementById('btn-new2').onclick = startGame;
  document.getElementById('btn-new3').onclick = startGame;
  document.getElementById('btn-keep').onclick = () => {
    won = false;
    overlayWin.classList.remove('visible');
  };

  /* ── tile size (responsive) ── */
  function tileSize() {
    const boardSize = boardEl.clientWidth;
    return (boardSize - TILE_GAP * (SIZE + 1)) / SIZE;
  }

  function tilePos(idx) {
    const ts = tileSize();
    return idx * (ts + TILE_GAP);
  }

  /* ── grid helpers ── */
  function emptyGrid() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function emptyCells() {
    const cells = [];
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (grid[r][c] === 0) cells.push([r, c]);
    return cells;
  }

  function spawnTile() {
    const cells = emptyCells();
    if (!cells.length) return;
    const [r, c] = cells[Math.floor(Math.random() * cells.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    renderTile(r, c, grid[r][c], true);
  }

  /* ── rendering ── */
  let tileEls = [];   // parallel structure to grid: tileEls[r][c] = DOM element | null

  function initTileEls() {
    tileEls = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  }

  function renderTile(r, c, val, isNew = false, isMerged = false) {
    const ts  = tileSize();
    const el  = document.createElement('div');
    el.className = 'tile' + (isNew ? ' new' : '') + (isMerged ? ' merged' : '');
    el.dataset.val = val <= 2048 ? val : 'super';
    el.style.width  = ts + 'px';
    el.style.height = ts + 'px';
    el.style.top    = tilePos(r) + 'px';
    el.style.left   = tilePos(c) + 'px';
    el.style.fontSize = val < 100  ? ts * 0.42 + 'px'
                      : val < 1000 ? ts * 0.34 + 'px'
                      :              ts * 0.27 + 'px';
    el.textContent = val;
    container.appendChild(el);
    return el;
  }

  function fullRender() {
    container.innerHTML = '';
    initTileEls();
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (grid[r][c])
          tileEls[r][c] = renderTile(r, c, grid[r][c]);
  }

  /* ── move logic ── */
  // Rotate grid 90° clockwise so we only need one "slide left" implementation
  function rotateGrid(g) {
    const n = [];
    for (let c = 0; c < SIZE; c++) {
      n[c] = [];
      for (let r = SIZE - 1; r >= 0; r--) n[c][SIZE - 1 - r] = g[r][c];
    }
    return n;
  }

  function slideRow(row) {
    let vals = row.filter(v => v);
    let merged = [];
    let gained = 0;
    for (let i = 0; i < vals.length; i++) {
      if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
        const m = vals[i] * 2;
        merged.push(m);
        gained += m;
        i++;
      } else {
        merged.push(vals[i]);
      }
    }
    while (merged.length < SIZE) merged.push(0);
    return { merged, gained };
  }

  function slideLeft(g) {
    let changed = false, gained = 0;
    const newG = emptyGrid();
    for (let r = 0; r < SIZE; r++) {
      const { merged, gained: g2 } = slideRow(g[r]);
      newG[r] = merged;
      gained += g2;
      if (merged.some((v, i) => v !== g[r][i])) changed = true;
    }
    return { newG, changed, gained };
  }

  function move(direction) {
    // 0=left, 1=up, 2=right, 3=down
    let g = grid;
    const applyRots = (n) => { for (let i = 0; i < n; i++) g = rotateGrid(g); };

    applyRots(direction);
    const { newG, changed, gained } = slideLeft(g);
    if (!changed) {
      applyRots((4 - direction) % 4);
      return false;
    }
    g = newG;
    applyRots((4 - direction) % 4);
    grid = g;
    score += gained;
    if (score > best) { best = score; localStorage.setItem('2048-best', best); }
    updateScoreUI();
    return true;
  }

  /* ── animated move ── */
  function animatedMove(direction) {
    if (over || won) return;

    const before = grid.map(r => [...r]);
    const moved = move(direction);
    if (!moved) return;

    container.innerHTML = '';
    initTileEls();

    renderMoveAnimation(before, grid);

    setTimeout(() => {
      spawnTile();
      checkState();
    }, 200);
  }

  function renderMoveAnimation(before, after) {
    const used = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!after[r][c]) continue;
        const val = after[r][c];
        let src1 = null, src2 = null;

        outer:
        for (let br = 0; br < SIZE; br++) {
          for (let bc = 0; bc < SIZE; bc++) {
            if (!used[br][bc] && before[br][bc] === val / 2) {
              for (let br2 = 0; br2 < SIZE; br2++) {
                for (let bc2 = 0; bc2 < SIZE; bc2++) {
                  if ((br2 !== br || bc2 !== bc) && !used[br2][bc2] && before[br2][bc2] === val / 2) {
                    if (!beforeHas(before, val) && val > 2) {
                      src1 = [br, bc]; src2 = [br2, bc2];
                      used[br][bc] = true; used[br2][bc2] = true;
                      break outer;
                    }
                  }
                }
              }
            }
          }
        }

        if (!src1) {
          outer2:
          for (let br = 0; br < SIZE; br++) {
            for (let bc = 0; bc < SIZE; bc++) {
              if (!used[br][bc] && before[br][bc] === val) {
                src1 = [br, bc];
                used[br][bc] = true;
                break outer2;
              }
            }
          }
        }

        if (src1) {
          const el = renderTile(src1[0], src1[1], val, false, !!src2);
          requestAnimationFrame(() => {
            el.style.top  = tilePos(r) + 'px';
            el.style.left = tilePos(c) + 'px';
          });
        } else {
          renderTile(r, c, val);
        }
      }
    }
  }

  function beforeHas(b, v) {
    return b.some(row => row.includes(v));
  }

  /* ── state checks ── */
  function checkState() {
    if (!won && grid.some(row => row.includes(2048))) {
      won = true;
      overlayWin.classList.add('visible');
      return;
    }
    if (emptyCells().length) return;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return;
        if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return;
      }
    }
    over = true;
    overlayLose.classList.add('visible');
  }

  /* ── score UI ── */
  function updateScoreUI() {
    scoreEl.textContent = score;
    bestEl.textContent  = best;
  }

  /* ── new game ── */
  function startGame() {
    grid  = emptyGrid();
    score = 0;
    won   = false;
    over  = false;
    overlayWin.classList.remove('visible');
    overlayLose.classList.remove('visible');
    updateScoreUI();
    container.innerHTML = '';
    initTileEls();
    spawnTile();
    spawnTile();
    checkState();
  }

  /* ── keyboard ── */
  const DIR_MAP = {
    ArrowLeft: 0, KeyA: 0, a: 0,
    ArrowUp:   1, KeyW: 1, w: 1,
    ArrowRight:2, KeyD: 2, d: 2,
    ArrowDown: 3, KeyS: 3, s: 3,
  };

  document.addEventListener('keydown', e => {
    const dir = DIR_MAP[e.code] ?? DIR_MAP[e.key];
    if (dir === undefined) return;
    e.preventDefault();
    animatedMove(dir);
  });

  /* ── touch / swipe ── */
  let touchStartX = 0, touchStartY = 0;

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy))
      animatedMove(dx < 0 ? 0 : 2);
    else
      animatedMove(dy < 0 ? 1 : 3);
  }, { passive: true });

  /* ── resize ── */
  window.addEventListener('resize', () => fullRender());

  /* ── boot ── */
  best = parseInt(localStorage.getItem('2048-best') || '0', 10);
  updateScoreUI();
  startGame();
})();
