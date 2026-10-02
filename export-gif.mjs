// Export a seamlessly looping rotation of the geodesic sphere as a GIF.
//
// The sphere spins about a five-fold axis (an icosahedron vertex), so a
// 72° turn maps the Class I net exactly onto itself: the loop is 72°.
//
// GIF has 1-bit transparency. Lines are white; partial coverage (anti-
// aliasing, the faint far hemisphere) is matted against --matte (default
// black, i.e. intended for dark backgrounds) and pixels below --cutoff
// coverage become fully transparent.
//
//   node export-gif.mjs --freq 8 --size 1600 --frames 240 --fps 20 -o out.gif
import { createCanvas } from '@napi-rs/canvas';
import gifenc from 'gifenc';
const { GIFEncoder } = gifenc;
import { readFileSync, writeFileSync } from 'node:fs';

// load the shared geometry from the web component (stub the DOM bits)
globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };
new Function(readFileSync(new URL('./geodesic-sphere.js', import.meta.url), 'utf8'))();
const { build, V } = globalThis.GeodesicGeometry;

const args = Object.fromEntries(process.argv.slice(2).join(' ')
  .split(/\s+(?=-)/).map(a => a.replace(/^-+/, '').split(/\s+/)).map(([k, v]) => [k, v ?? true]));
const freq = +(args.freq ?? 8), size = +(args.size ?? 1600);
const frames = +(args.frames ?? 240), fps = +(args.fps ?? 20);
const lat = +(args.lat ?? 12) * Math.PI / 180, back = +(args.back ?? 0.28);
const stroke = +(args.stroke ?? 1), cutoff = +(args.cutoff ?? 0.18);
const levels = +(args.levels ?? 32), matte = +(args.matte ?? 0);
const out = args.o ?? args.out ?? `geodesic_${freq}v_white.gif`;

const g = build(freq);
const norm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
// spin axis = Dymaxion vertex 0; b, c complete the frame
const A = norm(V[0]), B = norm(cross(A, [1, 0, 0])), C = cross(A, B);

const canvas = createCanvas(size, size), ctx = canvas.getContext('2d');
const R = size / 2 * 0.97, mid = size / 2;
const k = (g.chord * R) / (0.07516 * 970) * stroke;
const W = [[g.webE, 'i', 'o', 0.75], [g.innerE, 'i', 'i', 1.3], [g.outerE, 'o', 'o', 2.4]];

function render(theta) {
  const fw = B.map((_, d) => Math.cos(lat) * (Math.cos(theta)*B[d] + Math.sin(theta)*C[d]) + Math.sin(lat)*A[d]);
  const r = norm(cross(A, fw)), u = cross(fw, r);
  const proj = src => {
    const o = new Float32Array(src.length);
    for (let i = 0; i < src.length; i += 3) {
      const x = src[i], y = src[i+1], z = src[i+2];
      o[i] = mid + (x*r[0] + y*r[1] + z*r[2]) * R;
      o[i+1] = mid - (x*u[0] + y*u[1] + z*u[2]) * R;
      o[i+2] = x*fw[0] + y*fw[1] + z*fw[2];
    }
    return o;
  };
  const P = { o: proj(g.outer), i: proj(g.inner) };
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const front of [false, true]) {
    ctx.globalAlpha = front ? 1 : back;
    for (const [E, pa, pb, w] of W) {
      const Pa = P[pa], Pb = P[pb];
      ctx.lineWidth = w * k;
      ctx.beginPath();
      for (let e = 0; e < E.length; e += 2) {
        const a = E[e] * 3, b = E[e+1] * 3;
        if ((Pa[a+2] + Pb[b+2] >= 0) !== front) continue;
        ctx.moveTo(Pa[a], Pa[a+1]); ctx.lineTo(Pb[b], Pb[b+1]);
      }
      ctx.stroke();
    }
  }
  return ctx.getImageData(0, 0, size, size).data;
}

// palette: index 0 transparent, 1..levels = white matted over `matte`
const palette = [[0, 0, 0]];
for (let l = 1; l <= levels; l++) {
  const v = Math.round(matte + (255 - matte) * l / levels);
  palette.push([v, v, v]);
}
const toIndex = rgba => {
  const idx = new Uint8Array(size * size);
  for (let p = 0, q = 3; p < idx.length; p++, q += 4) {
    const a = rgba[q] / 255;
    idx[p] = a < cutoff ? 0 : Math.max(1, Math.round(a * levels));
  }
  return idx;
};

const gif = GIFEncoder();
const loop = 2 * Math.PI / 5, delay = Math.round(1000 / fps);
let first;
for (let f = 0; f < frames; f++) {
  const idx = toIndex(render(f / frames * loop));
  if (f === 0) first = idx;
  gif.writeFrame(idx, size, size, {
    palette, delay, transparent: true, transparentIndex: 0, dispose: 2,
    ...(f === 0 ? { repeat: 0 } : {}),
  });
  if (f % 40 === 0) process.stdout.write(`frame ${f}/${frames}\n`);
}
gif.finish();
writeFileSync(out, gif.bytes());

// seam check: one full 72° step must reproduce frame 0
const seam = toIndex(render(loop));
let diff = 0; for (let p = 0; p < seam.length; p++) if (seam[p] !== first[p]) diff++;
console.log(`${out}: ${(gif.bytes().length / 1e6).toFixed(1)} MB, ${frames} frames @ ${fps}fps,` +
  ` loop ${(frames / fps).toFixed(1)}s (one turn = ${(frames / fps * 5).toFixed(0)}s), seam diff ${diff} px`);
