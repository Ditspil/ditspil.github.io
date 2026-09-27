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
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (grid[r][c])
          renderTile(r, c, grid[r][c]);
  }

  /* ── move logic ── */
  // Rotate grid 90° clockwise so we only need one "slide left" implementation.
  // Applying the same rotation to a coordinate grid lets us map any cell in the
  // rotated line back to its real board position, so movement/merge sources are
  // known exactly instead of being reverse-engineered from a before/after diff.
  function rotateGrid(g) {
    const n = [];
    for (let c = 0; c < SIZE; c++) {
      n[c] = [];
      for (let r = SIZE - 1; r >= 0; r--) n[c][SIZE - 1 - r] = g[r][c];
    }
    return n;
  }

  function identityCoordGrid() {
    const cg = [];
    for (let r = 0; r < SIZE; r++) {
      cg[r] = [];
      for (let c = 0; c < SIZE; c++) cg[r][c] = [r, c];
    }
    return cg;
  }

  // Slides one line (row in the rotated grid) to the left, returning the
  // resulting values plus an event per surviving tile describing where it
  // came from (as index positions within this line).
  function slideLine(line) {
    const tiles = [];
    for (let i = 0; i < line.length; i++)
      if (line[i]) tiles.push({ value: line[i], fromIndex: i });

    const result = Array(SIZE).fill(0);
    const events = [];
    let gained = 0, toIndex = 0;

    for (let i = 0; i < tiles.length; i++) {
      const cur = tiles[i], next = tiles[i + 1];
      if (next && next.value === cur.value) {
        const newValue = cur.value * 2;
        events.push({ type: 'merge', value: cur.value, newValue, fromIndexes: [cur.fromIndex, next.fromIndex], toIndex });
        result[toIndex] = newValue;
        gained += newValue;
        toIndex++;
        i++;
      } else {
        events.push({ type: 'move', value: cur.value, fromIndex: cur.fromIndex, toIndex });
        result[toIndex] = cur.value;
        toIndex++;
      }
    }
    return { result, events, gained };
  }

  function move(direction) {
    // 0=left, 1=up, 2=right, 3=down
    let g = grid, cg = identityCoordGrid();
    for (let i = 0; i < direction; i++) { g = rotateGrid(g); cg = rotateGrid(cg); }

    let changed = false, gained = 0;
    const newGrid = emptyGrid();
    const animEvents = [];

    for (let line = 0; line < SIZE; line++) {
      const { result, events, gained: g2 } = slideLine(g[line]);
      gained += g2;

      for (let pos = 0; pos < SIZE; pos++) {
        const [r, c] = cg[line][pos];
        newGrid[r][c] = result[pos];
      }

      for (const ev of events) {
        if (ev.type === 'move') {
          const [fr, fc] = cg[line][ev.fromIndex];
          const [tr, tc] = cg[line][ev.toIndex];
          if (fr !== tr || fc !== tc) changed = true;
          animEvents.push({ type: 'move', value: ev.value, fromR: fr, fromC: fc, toR: tr, toC: tc });
        } else {
          changed = true;
          const [fr1, fc1] = cg[line][ev.fromIndexes[0]];
          const [fr2, fc2] = cg[line][ev.fromIndexes[1]];
          const [tr, tc]   = cg[line][ev.toIndex];
          animEvents.push({ type: 'merge', value: ev.value, newValue: ev.newValue, from: [[fr1, fc1], [fr2, fc2]], toR: tr, toC: tc });
        }
      }
    }

    if (!changed) return { moved: false };

    grid = newGrid;
    score += gained;
    if (score > best) { best = score; localStorage.setItem('2048-best', best); }
    updateScoreUI();
    return { moved: true, events: animEvents };
  }

  /* ── animated move ── */
  const SLIDE_MS = 180; // must match .tile transition duration in 2048.css

  function animatedMove(direction) {
    if (over || won) return;

    const result = move(direction);
    if (!result.moved) return;

    renderMoveAnimation(result.events);

    setTimeout(() => {
      spawnTile();
      checkState();
    }, 200);
  }

  // Creates a tile at the source cell, then forces a layout flush before
  // moving it to the destination so the browser reliably picks up the
  // left/top transition instead of occasionally snapping straight there.
  function slideTileEl(fromR, fromC, toR, toC, value) {
    const el = renderTile(fromR, fromC, value);
    void el.offsetWidth;
    el.style.top  = tilePos(toR) + 'px';
    el.style.left = tilePos(toC) + 'px';
    return el;
  }

  function renderMoveAnimation(events) {
    container.innerHTML = '';

    for (const ev of events) {
      if (ev.type === 'move') {
        slideTileEl(ev.fromR, ev.fromC, ev.toR, ev.toC, ev.value);
      } else {
        const els = ev.from.map(([fr, fc]) => slideTileEl(fr, fc, ev.toR, ev.toC, ev.value));
        setTimeout(() => {
          els.forEach(el => el.remove());
          renderTile(ev.toR, ev.toC, ev.newValue, false, true);
        }, SLIDE_MS);
      }
    }
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
