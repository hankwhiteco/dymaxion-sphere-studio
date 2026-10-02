/*
 * <geodesic-sphere> — slowly rotating double-layer geodesic sphere
 * (Fuller / Montreal Biosphere type). Same geometry as geodesic.py:
 * Dymaxion-oriented icosahedron, Class I breakdown, hexagonal inner net,
 * octet-depth web struts. No dependencies; transparent background.
 *
 * Attributes (all optional)
 *   freq      breakdown frequency                 (default 16)
 *   period    seconds per full revolution          (default 120, 0 = still)
 *   lat       viewing latitude in degrees          (default 12)
 *   lon       starting longitude in degrees        (default 20)
 *   back      opacity of the far hemisphere        (default 0.28)
 *   color     stroke color                         (default currentColor)
 *   scale     sphere diameter as fraction of box   (default 0.97)
 *   stroke    line weight multiplier               (default 1)
 *
 * Strut thickness follows drawn strut length, exactly as in the SVG
 * exports, so a 16v sphere and an 8v sphere at half the size match.
 *
 * Honors prefers-reduced-motion (renders still) and pauses off-screen.
 */
(() => {
  const V = [
    [ 0.420152426708710003,  0.078145249402782959,  0.904082550615019298],
    [ 0.995009439436241649, -0.091347795276427931,  0.040147175877166645],
    [ 0.518836730327364437,  0.835420380378235850,  0.181331837557262454],
    [-0.414682225320335218,  0.655962405434800777,  0.630675807891475371],
    [-0.515455959944041808, -0.381716898287133011,  0.767200992517747538],
    [ 0.355781402532944713, -0.843580002466178147,  0.402234226602925571],
    [ 0.414682225320335218, -0.655962405434800777, -0.630675807891475371],
    [ 0.515455959944041808,  0.381716898287133011, -0.767200992517747538],
    [-0.355781402532944713,  0.843580002466178147, -0.402234226602925571],
    [-0.995009439436241649,  0.091347795276427931, -0.040147175877166645],
    [-0.518836730327364437, -0.835420380378235850, -0.181331837557262454],
    [-0.420152426708710003, -0.078145249402782959, -0.904082550615019298],
  ];
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0]/l, a[1]/l, a[2]/l]; };

  function faces() {
    const adj = (i, j) => Math.abs(dot(V[i], V[j]) - 1/Math.sqrt(5)) < 1e-6;
    const F = [];
    for (let i = 0; i < 12; i++) for (let j = i+1; j < 12; j++) for (let k = j+1; k < 12; k++) {
      if (!(adj(i, j) && adj(j, k) && adj(i, k))) continue;
      const a = V[i], b = V[j], c = V[k];
      const n = [(b[1]-a[1])*(c[2]-a[2]) - (b[2]-a[2])*(c[1]-a[1]),
                 (b[2]-a[2])*(c[0]-a[0]) - (b[0]-a[0])*(c[2]-a[2]),
                 (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0])];
      F.push(dot(n, a) > 0 ? [i, j, k] : [i, k, j]);
    }
    return F;
  }

  const cache = new Map();
  function build(freq) {
    if (cache.has(freq)) return cache.get(freq);
    const nodes = [], index = new Map();
    const node = p => {
      p = norm(p);
      const key = p.map(v => v.toFixed(9)).join(',');
      let i = index.get(key);
      if (i === undefined) { i = nodes.length; index.set(key, i); nodes.push(p); }
      return i;
    };
    const tris = [];
    for (const [ia, ib, ic] of faces()) {
      const A = V[ia], B = V[ib], C = V[ic], g = {};
      for (let i = 0; i <= freq; i++) for (let j = 0; j <= freq - i; j++) {
        const k = freq - i - j;
        g[i + ',' + j] = node([0, 1, 2].map(d => (A[d]*k + B[d]*i + C[d]*j) / freq));
      }
      for (let i = 0; i < freq; i++) for (let j = 0; j < freq - i; j++) {
        tris.push([g[i+','+j], g[(i+1)+','+j], g[i+','+(j+1)]]);
        if (i + j < freq - 1) tris.push([g[(i+1)+','+j], g[(i+1)+','+(j+1)], g[i+','+(j+1)]]);
      }
    }
    const edgeTris = new Map();
    tris.forEach((t, ti) => {
      for (const [u, v] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) {
        const key = Math.min(u, v) * 1e6 + Math.max(u, v);
        (edgeTris.get(key) || edgeTris.set(key, []).get(key)).push(ti);
      }
    });
    let chord = 0;
    const outerE = [], innerE = [];
    for (const [key, ts] of edgeTris) {
      const a = Math.floor(key / 1e6), b = key % 1e6;
      outerE.push(a, b); innerE.push(ts[0], ts[1]);
      const p = nodes[a], q = nodes[b];
      chord += Math.hypot(p[0]-q[0], p[1]-q[1], p[2]-q[2]);
    }
    chord /= edgeTris.size;
    const rIn = 1 - chord * Math.sqrt(2/3);
    const webE = [];
    tris.forEach((t, ti) => webE.push(ti, t[0], ti, t[1], ti, t[2]));

    const outer = new Float32Array(nodes.length * 3);
    nodes.forEach((p, i) => outer.set(p, i * 3));
    const inner = new Float32Array(tris.length * 3);
    tris.forEach(([a, b, c], i) => {
      const p = norm([0, 1, 2].map(d => nodes[a][d] + nodes[b][d] + nodes[c][d]));
      inner.set([p[0]*rIn, p[1]*rIn, p[2]*rIn], i * 3);
    });
    const geo = { outer, inner, chord,
      outerE: Uint32Array.from(outerE), innerE: Uint32Array.from(innerE), webE: Uint32Array.from(webE) };
    cache.set(freq, geo);
    return geo;
  }

  const W_OUTER = 2.4, W_INNER = 1.3, W_WEB = 0.75, REF_CHORD = 0.07516, REF_R = 970;

  class GeodesicSphere extends HTMLElement {
    static get observedAttributes() { return ['freq', 'lat', 'lon', 'back', 'color', 'scale', 'stroke', 'period']; }

    connectedCallback() {
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = '<style>:host{display:block;position:relative;aspect-ratio:1}' +
          'canvas{position:absolute;inset:0;width:100%;height:100%}</style><canvas part="canvas"></canvas>';
        this.canvas = root.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
      }
      this.t0 = performance.now();
      this.visible = true;
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this);
      this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.loop(); });
      this.io.observe(this);
      this.resize();
    }
    disconnectedCallback() { this.ro?.disconnect(); this.io?.disconnect(); cancelAnimationFrame(this.raf); }
    attributeChangedCallback() { if (this.ctx) this.draw(performance.now()); }

    num(name, def) { const v = parseFloat(this.getAttribute(name)); return Number.isFinite(v) ? v : def; }

    resize() {
      const r = this.getBoundingClientRect(), dpr = devicePixelRatio || 1;
      this.size = Math.max(1, r.width);
      this.canvas.width = Math.round(this.size * dpr);
      this.canvas.height = Math.round(this.size * dpr);
      this.dpr = dpr;
      this.draw(performance.now());
      this.loop();
    }

    loop() {
      cancelAnimationFrame(this.raf);
      if (!this.visible || this.motion.matches || this.num('period', 120) === 0) return;
      const tick = now => { this.draw(now); this.raf = requestAnimationFrame(tick); };
      this.raf = requestAnimationFrame(tick);
    }

    draw(now) {
      const ctx = this.ctx; if (!ctx) return;
      const freq = Math.max(1, Math.round(this.num('freq', 16)));
      const g = build(freq);
      const period = this.num('period', 120);
      const spin = period && !this.motion.matches ? ((now - this.t0) / 1000) / period * 360 : 0;
      const la = this.num('lat', 12) * Math.PI / 180;
      const lo = (this.num('lon', 20) + spin) * Math.PI / 180;

      // camera basis: f toward viewer, r right, u up (world z is the spin axis)
      const f = [Math.cos(la)*Math.cos(lo), Math.cos(la)*Math.sin(lo), Math.sin(la)];
      const r = norm([-f[1], f[0], 0]);
      const u = [r[1]*f[2] - r[2]*f[1], r[2]*f[0] - r[0]*f[2], r[0]*f[1] - r[1]*f[0]];

      const S = this.size, c = S / 2, R = c * this.num('scale', 0.97);
      const proj = (src) => {
        const n = src.length / 3, out = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const x = src[i*3], y = src[i*3+1], z = src[i*3+2];
          out[i*3]   = c + (x*r[0] + y*r[1] + z*r[2]) * R;
          out[i*3+1] = c - (x*u[0] + y*u[1] + z*u[2]) * R;
          out[i*3+2] =      x*f[0] + y*f[1] + z*f[2];
        }
        return out;
      };
      const po = proj(g.outer), pi = proj(g.inner);

      // strut thickness follows drawn strut length (matches the SVG exports)
      const k = (g.chord * R) / (REF_CHORD * REF_R) * this.num('stroke', 1);
      const back = this.num('back', 0.28);

      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      ctx.strokeStyle = this.getAttribute('color') || getComputedStyle(this).color;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      const layers = [[g.webE, pi, po, W_WEB], [g.innerE, pi, pi, W_INNER], [g.outerE, po, po, W_OUTER]];
      for (const front of [false, true]) {
        ctx.globalAlpha = front ? 1 : back;
        for (const [E, A, B, w] of layers) {
          ctx.lineWidth = w * k;
          ctx.beginPath();
          for (let e = 0; e < E.length; e += 2) {
            const a = E[e] * 3, b = E[e+1] * 3;
            if ((A[a+2] + B[b+2] >= 0) !== front) continue;
            ctx.moveTo(A[a], A[a+1]); ctx.lineTo(B[b], B[b+1]);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
  }
  customElements.define('geodesic-sphere', GeodesicSphere);
  globalThis.GeodesicGeometry = { build, V };  // shared with export-gif.mjs
})();
