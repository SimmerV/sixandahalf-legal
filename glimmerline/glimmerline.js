/* Glimmerline web demo.
   The four boards are real Journey levels from the shipped game (levels 1, 6, 11 and 28),
   and the rules below mirror the game's: start on bead 1, step through open edges into
   unvisited cells, pass the beads in order, fill every cell, finish on the last bead.
   Nothing is stored and nothing is sent anywhere. */
(() => {
  "use strict";

  const LEVELS = [
    { level: 1, cols: 5, rows: 5,
      beads: [12, 13, 6, 2, 22, 21, 10, 18],
      walls: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      solution: [12, 13, 8, 7, 6, 5, 0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 10, 11, 16, 17, 18] },
    { level: 6, cols: 5, rows: 5,
      beads: [2, 7, 13, 22, 17, 12, 16],
      walls: [0, 2, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      solution: [2, 7, 8, 3, 4, 9, 14, 13, 18, 19, 24, 23, 22, 17, 12, 11, 6, 1, 0, 5, 10, 15, 20, 21, 16] },
    { level: 11, cols: 6, rows: 6,
      beads: [3, 21, 8, 13, 29, 12],
      walls: [0, 0, 0, 4, 0, 0, 0, 0, 0, 1, 2, 8, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      solution: [3, 4, 5, 11, 17, 16, 10, 9, 15, 21, 20, 14, 8, 2, 1, 0, 6, 7, 13, 19, 25, 26, 27, 28, 22, 23, 29, 35, 34, 33, 32, 31, 30, 24, 18, 12] },
    { level: 28, cols: 7, rows: 7,
      beads: [34, 18, 26, 30, 43, 9, 8, 24],
      walls: [0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 1, 0, 4, 0, 0, 0, 0, 2, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 8, 2, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      solution: [34, 27, 20, 13, 6, 5, 4, 11, 12, 19, 18, 25, 26, 33, 40, 41, 48, 47, 46, 39, 32, 31, 38, 45, 44, 37, 30, 29, 36, 43, 42, 35, 28, 21, 22, 23, 16, 9, 8, 15, 14, 7, 0, 1, 2, 3, 10, 17, 24] },
  ];

  /* Swatch colours repeat the palette in glimmerline.css (background top and bottom, thread, bead). */
  const THEMES = [
    { id: "luminous_glass", name: "Luminous Glass", s: ["#0e1430", "#1b2150", "#3fd3ff", "#ffd166"] },
    { id: "obsidian", name: "Obsidian", s: ["#070912", "#131726", "#fad16b", "#edf2ff"] },
    { id: "aurora", name: "Aurora", s: ["#051c2b", "#2b0f40", "#2ef2c7", "#ffe38a"] },
    { id: "neon", name: "Neon", s: ["#0a0514", "#1a0a30", "#ff2bd6", "#d8ff2e"] },
    { id: "prism", name: "Prism", s: ["#1c2130", "#2b3345", "#7091ff", "#f8f9ff"], note: "the colour turns along the thread" },
    { id: "pastel", name: "Pastel", s: ["#fff6e6", "#e4daf6", "#9e2b1a", "#3c475a"], note: "the light one" },
    { id: "ember", name: "Ember", s: ["#1a1416", "#3b1018", "#ff781f", "#fff1d6"], note: "animated: drifting embers" },
    { id: "tide", name: "Tide", s: ["#063842", "#1a1c5c", "#8ce672", "#f2dda6"], note: "animated: a slow tide of light" },
    { id: "pulse", name: "Pulse", s: ["#0a0612", "#1d0f36", "#c799ff", "#f7f2ff"], note: "animated: a breathing glow" },
  ];

  const DR = [-1, 0, 1, 0];
  const DC = [0, 1, 0, -1];
  const P = 100; // one cell, in board units
  const NS = "http://www.w3.org/2000/svg";

  const $ = (sel) => document.querySelector(sel);
  const root = document.documentElement;
  const svg = $("#board");
  const statusEl = $("#status");
  const countEl = $("#count");
  const undoBtn = $("#undo");
  const clearBtn = $("#clear");
  const hintBtn = $("#hint");
  const nextBtn = $("#next");
  const levelsEl = $("#levels");
  const swatchesEl = $("#swatches");
  const themeNameEl = $("#theme-name");
  const themeNoteEl = $("#theme-note");
  if (!svg) return;

  let index = 0;
  let pz = null; // the level plus derived fields
  let path = [];
  let solved = false;
  let dragging = false;
  let theme = THEMES[0];
  let layers = {}; // SVG groups, rebuilt per level

  const el = (name, attrs = {}, parent) => {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.append(node);
    return node;
  };
  const xy = (cell) => [(cell % pz.cols) * P + P / 2, Math.floor(cell / pz.cols) * P + P / 2];

  /* ---------- rules ---------- */

  const nextBead = () => {
    let passed = 0;
    for (const cell of path) if (pz.beadAt[cell] === passed + 1) passed += 1;
    return passed + 1;
  };
  const direction = (a, b) => {
    const ra = Math.floor(a / pz.cols), ca = a % pz.cols;
    const rb = Math.floor(b / pz.cols), cb = b % pz.cols;
    if (ra === rb) return cb === ca + 1 ? 1 : cb === ca - 1 ? 3 : -1;
    if (ca === cb) return rb === ra + 1 ? 2 : rb === ra - 1 ? 0 : -1;
    return -1;
  };
  /* Why stepping onto `cell` is refused; "" when the step is legal. */
  const refusal = (cell) => {
    if (cell < 0 || cell >= pz.n) return "far";
    if (path.length === 0) return cell === pz.start ? "" : "start";
    const head = path[path.length - 1];
    const dir = direction(head, cell);
    if (dir === -1) return "far";
    if (pz.walls[head] & (1 << dir)) return "wall";
    if (path.includes(cell)) return "revisit";
    const bead = pz.beadAt[cell];
    if (bead && bead !== nextBead()) return "order";
    if (cell === pz.end && path.length + 1 < pz.n) return "early";
    return "";
  };
  const isSolved = () => path.length === pz.n && path[pz.n - 1] === pz.end;
  const isDeadEnd = () => {
    if (path.length === 0 || isSolved()) return false;
    const head = path[path.length - 1];
    const r = Math.floor(head / pz.cols), c = head % pz.cols;
    for (let d = 0; d < 4; d++) {
      const rr = r + DR[d], cc = c + DC[d];
      if (rr < 0 || cc < 0 || rr >= pz.rows || cc >= pz.cols) continue;
      if (refusal(rr * pz.cols + cc) === "") return false;
    }
    return true;
  };
  const explain = (why) => {
    if (why === "order") return `Pass bead ${nextBead()} first.`;
    if (why === "wall") return "A wall blocks that edge.";
    if (why === "early") return `Bead ${pz.beads.length} ends the thread. Fill every cell first.`;
    if (why === "start") return "Start on bead 1.";
    return "";
  };

  /* ---------- moves ---------- */

  const extend = (cell, quiet) => {
    const why = refusal(cell);
    if (why) {
      const text = quiet && why !== "order" && why !== "early" ? "" : explain(why);
      if (text) say(text);
      return false;
    }
    path.push(cell);
    render();
    return true;
  };
  const undo = () => { if (path.length && !solved) { path.pop(); render(); } };
  const truncateTo = (cell) => {
    const at = path.indexOf(cell);
    if (at !== -1 && at < path.length - 1) { path.length = at + 1; render(); }
  };
  const clear = () => { path = []; solved = false; render(); };
  const hint = () => {
    if (solved) return;
    const sol = pz.solution;
    let ok = 0;
    while (ok < path.length && path[ok] === sol[ok]) ok += 1;
    if (ok < path.length) {
      path.length = ok;
      render();
      say("Stepped back to where the thread was still on course. Ask again for the next stretch.");
      return;
    }
    let added = 0;
    for (let i = path.length; i < pz.n; i++) {
      path.push(sol[i]);
      added += 1;
      const bead = pz.beadAt[sol[i]];
      if (bead && !(added === 1 && bead === 1)) break;
    }
    render();
  };

  /* Step toward `cell` from the head: one step back, a straight run, or around a corner. */
  const dragTo = (cell, fx, fy) => {
    if (cell < 0 || solved) return;
    if (path.length === 0) { if (cell === pz.start) extend(cell); return; }
    const head = path[path.length - 1];
    if (cell === head) return;
    if (path.length > 1 && cell === path[path.length - 2]) { undo(); return; }
    if (path.includes(cell)) return;
    const hr = Math.floor(head / pz.cols), hc = head % pz.cols;
    const r = Math.floor(cell / pz.cols), c = cell % pz.cols;
    if (hr === r || hc === c) {
      const dr = Math.sign(r - hr), dc = Math.sign(c - hc);
      let rr = hr, cc = hc;
      while (rr !== r || cc !== c) {
        rr += dr; cc += dc;
        if (!extend(rr * pz.cols + cc, true)) break;
      }
      return;
    }
    if (Math.abs(r - hr) === 1 && Math.abs(c - hc) === 1) {
      // A cut corner. How far the finger is into the new cell along each axis says which
      // neighbour it crossed; take that one if it is open, else the other.
      const u = c > hc ? fx : 1 - fx;
      const v = r > hr ? fy : 1 - fy;
      const viaRow = hr * pz.cols + c; // the neighbour in the head's row
      const viaCol = r * pz.cols + hc; // the neighbour in the head's column
      for (const via of u >= v ? [viaRow, viaCol] : [viaCol, viaRow]) {
        if (refusal(via) !== "") continue;
        path.push(via);
        if (refusal(cell) === "") { path.push(cell); render(); return; }
        path.pop();
      }
    }
  };

  /* ---------- drawing ---------- */

  const build = () => {
    const { cols, rows } = pz;
    svg.replaceChildren();
    svg.setAttribute("viewBox", `-6 -6 ${cols * P + 12} ${rows * P + 12}`);
    const defs = el("defs", {}, svg);
    const blur = el("filter", { id: "thread-blur", filterUnits: "userSpaceOnUse", x: -80, y: -80, width: cols * P + 160, height: rows * P + 160 }, defs);
    el("feGaussianBlur", { stdDeviation: 11 }, blur);

    const cells = el("g", {}, svg);
    pz.cellEls = [];
    for (let i = 0; i < pz.n; i++) {
      const [x, y] = xy(i);
      pz.cellEls.push(el("rect", { class: "cell", x: x - 46, y: y - 46, width: 92, height: 92, rx: 17 }, cells));
    }
    layers = {
      glow: el("g", { class: "t-glow", filter: "url(#thread-blur)" }, svg),
      body: el("g", { class: "t-body" }, svg),
      core: el("g", { class: "t-core" }, svg),
    };
    layers.comet = el("path", { class: "comet", pathLength: 100, d: "" }, svg);

    const walls = el("g", {}, svg);
    for (let i = 0; i < pz.n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      if (pz.walls[i] & 2) el("line", { class: "wall", x1: (c + 1) * P, y1: r * P + 16, x2: (c + 1) * P, y2: (r + 1) * P - 16 }, walls);
      if (pz.walls[i] & 4) el("line", { class: "wall", x1: c * P + 16, y1: (r + 1) * P, x2: (c + 1) * P - 16, y2: (r + 1) * P }, walls);
    }

    // Under the beads, so a bead the thread rests on keeps its number.
    layers.head = el("circle", { class: "head", r: 9, cx: 0, cy: 0, style: "display:none" }, svg);

    const beads = el("g", {}, svg);
    pz.beadEls = pz.beads.map((cell, i) => {
      const [x, y] = xy(cell);
      const g = el("g", { class: "bead" + (i === 0 ? " first" : "") + (i === pz.beads.length - 1 ? " end" : "") }, beads);
      el("circle", { class: "cue", cx: x, cy: y, r: 32 }, g);
      el("circle", { class: "ring", cx: x, cy: y, r: 37 }, g);
      el("circle", { class: "disc", cx: x, cy: y, r: 28 }, g);
      el("text", { x, y, dy: "0.36em" }, g).textContent = String(i + 1);
      return g;
    });
  };

  const drawThread = () => {
    if (!layers.glow) return;
    const groups = [layers.glow, layers.body, layers.core];
    for (const g of groups) g.replaceChildren();
    const prism = theme.id === "prism";
    const pts = path.map(xy);
    const from = pts.length === 1 ? 0 : 1;
    for (let i = from; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[i];
      groups.forEach((g, k) => {
        const ln = el("line", { x1: a[0], y1: a[1], x2: b[0] + (i === 0 ? 0.01 : 0), y2: b[1] }, g);
        if (prism) ln.style.stroke = `hsl(${(226 + 16 * i) % 360} 100% ${k === 2 ? 88 : 72}%)`;
      });
    }
    layers.comet.setAttribute("d", pts.length > 1 ? "M" + pts.map((p) => p.join(" ")).join("L") : "");
  };

  const say = (text, strong) => {
    statusEl.replaceChildren();
    if (strong) { const b = document.createElement("strong"); b.textContent = strong; statusEl.append(b, " "); }
    statusEl.append(text);
  };

  const render = () => {
    const was = solved;
    solved = isSolved();
    const on = new Set(path);
    pz.cellEls.forEach((rect, i) => rect.classList.toggle("on", on.has(i)));
    const passed = nextBead() - 1;
    pz.beadEls.forEach((g, i) => g.classList.toggle("passed", i < passed));
    drawThread();
    const showHead = path.length > 0 && !solved;
    layers.head.style.display = showHead ? "" : "none";
    if (showHead) {
      const [hx, hy] = xy(path[path.length - 1]);
      layers.head.setAttribute("cx", hx); layers.head.setAttribute("cy", hy);
    }
    svg.classList.toggle("idle", path.length === 0);
    svg.classList.toggle("solved", solved);
    if (solved && !was) svg.style.setProperty("--run", Math.min(2.2, 0.5 + pz.n * 0.03) + "s");

    countEl.textContent = `${path.length} / ${pz.n}`;
    undoBtn.disabled = clearBtn.disabled = path.length === 0;
    undoBtn.disabled = undoBtn.disabled || solved;
    hintBtn.disabled = solved;
    nextBtn.hidden = !solved;
    if (solved) {
      const last = index === LEVELS.length - 1;
      nextBtn.textContent = last ? "Back to level 1" : `Play level ${LEVELS[index + 1].level}`;
      say(last ? "That was Journey level 28. The game has 500 of them." : `Journey level ${pz.level}, done.`, "Threaded!");
    } else if (path.length === 0) {
      say("Start on bead 1 and drag the thread through every cell.");
    } else if (isDeadEnd()) {
      say("Dead end. Slide back along the thread, or undo.");
    } else {
      const nb = nextBead();
      say(nb < pz.beads.length ? `Next bead: ${nb}.` : `Fill every cell, then finish on bead ${pz.beads.length}.`);
    }
  };

  const load = (i) => {
    index = i;
    const lv = LEVELS[i];
    const n = lv.cols * lv.rows;
    const beadAt = new Array(n).fill(0);
    lv.beads.forEach((cell, k) => { beadAt[cell] = k + 1; });
    pz = { ...lv, n, beadAt, start: lv.beads[0], end: lv.beads[lv.beads.length - 1] };
    path = [];
    solved = false;
    build();
    render();
    for (const b of levelsEl.querySelectorAll("button")) b.setAttribute("aria-pressed", String(Number(b.dataset.i) === i));
    svg.setAttribute("aria-label", `Puzzle board, Journey level ${lv.level}, ${lv.cols} by ${lv.rows}.`);
  };

  /* ---------- input ---------- */

  let last = null; // the previous pointer position, in board units
  const point = (ev) => {
    const ctm = svg.getScreenCTM();
    return ctm ? new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse()) : null;
  };
  const cellOf = (x, y) => {
    const c = Math.floor(x / P), r = Math.floor(y / P);
    if (c < 0 || r < 0 || c >= pz.cols || r >= pz.rows) return { cell: -1, fx: 0.5, fy: 0.5 };
    return { cell: r * pz.cols + c, fx: x / P - c, fy: y / P - r };
  };
  const locate = (ev) => {
    const pt = point(ev);
    return pt ? cellOf(pt.x, pt.y) : { cell: -1, fx: 0.5, fy: 0.5 };
  };

  svg.addEventListener("pointerdown", (ev) => {
    if (ev.button > 0 || solved) return;
    const { cell, fx, fy } = locate(ev);
    if (cell < 0) return;
    ev.preventDefault();
    dragging = true;
    last = point(ev);
    try { svg.setPointerCapture(ev.pointerId); } catch (_) { /* older browsers */ }
    if (path.length === 0) {
      if (!extend(cell)) say("Start on bead 1.");
    } else if (cell === path[path.length - 1]) {
      /* picking the thread back up */
    } else if (path.includes(cell)) {
      truncateTo(cell);
    } else {
      const before = path.length;
      dragTo(cell, fx, fy);
      if (path.length === before) { const why = refusal(cell); if (why && why !== "far") say(explain(why) || statusEl.textContent); }
    }
  });
  svg.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    const events = typeof ev.getCoalescedEvents === "function" ? ev.getCoalescedEvents() : [];
    for (const e of events.length ? events : [ev]) {
      const to = point(e);
      if (!to) continue;
      const from = last || to;
      const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 12));
      for (let k = 1; k <= steps; k++) {
        const at = cellOf(from.x + ((to.x - from.x) * k) / steps, from.y + ((to.y - from.y) * k) / steps);
        dragTo(at.cell, at.fx, at.fy);
      }
      last = to;
    }
  });
  const drop = () => { dragging = false; last = null; };
  // Belt and braces for browsers that ignore touch-action on SVG: a finger on the board never scrolls the page.
  for (const type of ["touchstart", "touchmove"]) svg.addEventListener(type, (ev) => ev.preventDefault(), { passive: false });
  svg.addEventListener("pointerup", drop);
  svg.addEventListener("pointercancel", drop);
  svg.addEventListener("lostpointercapture", drop);

  svg.addEventListener("keydown", (ev) => {
    const dir = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }[ev.key];
    if (dir !== undefined) {
      ev.preventDefault();
      if (solved) return;
      if (path.length === 0) { extend(pz.start); return; }
      const head = path[path.length - 1];
      const r = Math.floor(head / pz.cols) + DR[dir], c = (head % pz.cols) + DC[dir];
      if (r < 0 || c < 0 || r >= pz.rows || c >= pz.cols) return;
      const cell = r * pz.cols + c;
      if (path.length > 1 && cell === path[path.length - 2]) undo(); else extend(cell);
    } else if (ev.key === "Backspace" || ev.key === "Delete") {
      ev.preventDefault(); undo();
    } else if (ev.key === "Escape") {
      clear();
    } else if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      if (path.length === 0) extend(pz.start);
    }
  });

  undoBtn.addEventListener("click", undo);
  clearBtn.addEventListener("click", clear);
  hintBtn.addEventListener("click", hint);
  nextBtn.addEventListener("click", () => { load((index + 1) % LEVELS.length); svg.focus({ preventScroll: true }); });

  LEVELS.forEach((lv, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.i = String(i);
    b.textContent = String(lv.level);
    b.setAttribute("aria-label", `Journey level ${lv.level}, ${lv.cols} by ${lv.rows}`);
    b.addEventListener("click", () => load(i));
    levelsEl.append(b);
  });

  /* ---------- themes ---------- */

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const setTheme = (t, focus) => {
    theme = t;
    if (t.id === "luminous_glass") delete root.dataset.theme; else root.dataset.theme = t.id;
    if (themeMeta) themeMeta.setAttribute("content", t.s[0]);
    themeNameEl.textContent = t.name;
    themeNoteEl.textContent = t.note ? `, ${t.note}` : "";
    for (const b of swatchesEl.children) {
      const sel = b.dataset.id === t.id;
      b.setAttribute("aria-checked", String(sel));
      b.tabIndex = sel ? 0 : -1;
      if (sel && focus) b.focus();
    }
    drawThread();
  };
  THEMES.forEach((t) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.dataset.id = t.id;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", t.name);
    b.title = t.name;
    b.style.setProperty("--s-top", t.s[0]);
    b.style.setProperty("--s-bottom", t.s[1]);
    b.style.setProperty("--s-thread", t.s[2]);
    b.style.setProperty("--s-bead", t.s[3]);
    b.addEventListener("click", () => setTheme(t));
    swatchesEl.append(b);
  });
  swatchesEl.addEventListener("keydown", (ev) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
    if (!step) return;
    ev.preventDefault();
    const at = THEMES.indexOf(theme);
    setTheme(THEMES[(at + step + THEMES.length) % THEMES.length], true);
  });

  /* ---------- the rest of the page ---------- */

  // "Coming soon": a store link with data-soon is not a link yet.
  for (const a of document.querySelectorAll("a[data-soon]")) {
    a.removeAttribute("href");
    a.setAttribute("aria-disabled", "true");
    a.setAttribute("role", "link");
  }

  const strip = $("#strip");
  const nav = $("#strip-nav");
  if (strip && nav) {
    const sync = () => { nav.hidden = strip.scrollWidth <= strip.clientWidth + 4; };
    const by = (dir) => strip.scrollBy({ left: dir * Math.max(260, strip.clientWidth * 0.6), behavior: "smooth" });
    nav.querySelector("[data-dir='-1']").addEventListener("click", () => by(-1));
    nav.querySelector("[data-dir='1']").addEventListener("click", () => by(1));
    window.addEventListener("resize", sync);
    sync();
  }

  $("#play").hidden = false;
  load(0);
  setTheme(THEMES[0]);
})();
