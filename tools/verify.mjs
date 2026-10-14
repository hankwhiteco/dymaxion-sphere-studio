// Verifies the studio's geometry against published reference values.
// Runs the geometry code straight out of studio.html, so it checks what the page draws.
//   npm test
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../studio.html', import.meta.url), 'utf8');
const js = html.slice(html.indexOf('<script>') + 8);
const body = js.slice(js.indexOf('(() => {') + 8, js.indexOf('// ───────────────────────── state'));
const G = new Function(body + `; return { build, V, PHI, FACES, ICO_EDGES, FACE_CEN, MIDS, GC, LCD, POLY, NET,
  FOLD_DEG, faceTransforms, jbVerts, edgeLen, jbScale, twistDeg, VE_NORMALS };`)();

const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const len = a => Math.hypot(...a), norm = a => a.map(v => v / len(a));
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const deg = x => x * 180 / Math.PI;
const arc = (a, b) => deg(Math.acos(Math.max(-1, Math.min(1, dot(norm(a), norm(b))))));
const rotAbout = (axis, ang) => p => { const k = norm(axis), c = Math.cos(ang), s = Math.sin(ang), kd = dot(k, p), kx = cross(k, p);
  return [0, 1, 2].map(d => p[d]*c + kx[d]*s + k[d]*kd*(1-c)); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

let failed = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); if (!ok) failed++; };

// 1. Dymaxion orientation (R. W. Gray): vertex 0 at 64.7°N, 10.536°E; a regular icosahedron
const V0 = G.V[0];
check('Dymaxion vertex at 64.7°N 10.536°E', near(deg(Math.asin(V0[2])), 64.7, 1e-4) && near(deg(Math.atan2(V0[1], V0[0])), 10.5362, 1e-4));
check('regular icosahedron: every vertex has 5 neighbours at dot 1/√5', G.V.every(a => G.V.filter(b => near(dot(a, b), 1 / Math.sqrt(5), 1e-9)).length === 5));

// 2. counts: V = 10f² + 2, E = 30f², F = 20f², Euler V − E + F = 2
let countsOK = true;
for (let f = 1; f <= 16; f++) {
  const g = G.build(f), nV = g.outer.length / 3, nE = g.outerE.length / 2, nF = g.nTris;
  if (nV !== 10*f*f + 2 || nE !== 30*f*f || nF !== 20*f*f || nV - nE + nF !== 2) countsOK = false;
}
check('node, strut and face counts and Euler’s formula, 1v–16v', countsOK);

// 3. chord factors, Class I method 1 (standard tables)
const CF = { 2: [0.54653, 0.61803], 3: [0.34862, 0.40355, 0.41241], 4: [0.25318, 0.29453, 0.29524, 0.29859, 0.31287, 0.32492] };
for (const [f, ref] of Object.entries(CF)) {
  const L = [...G.build(+f).elen].sort((a, b) => a - b), got = [];
  for (const x of L) if (!got.length || x - got[got.length - 1] > 1e-9) got.push(x);
  check(`${f}v chord factors`, got.length === ref.length && got.every((x, i) => near(x, ref[i], 5e-6)), got.map(x => x.toFixed(5)).join(' '));
}

// 4. distinct strut lengths: Haghnazar, Nooshin & Golabchi (2014), Table 1 / p. 91 formula
const paper = f => f % 3 === 0 ? f * (f + 3) / 6 : Math.round(f * (f + 2) / 4);
const counts = [];
for (let f = 2; f <= 16; f++) counts.push([f, G.build(f).strutTypes, paper(f)]);
check('distinct strut lengths match Haghnazar et al. (2014), 2v–16v', counts.every(([, a, b]) => a === b),
  counts.map(([f, a]) => `${f}v:${a}`).join(' '));

// 5. symmetry: 72°, 120°, 180° turns about the 5-, 3-, 2-fold axes map the grid onto itself
for (const f of [5, 8]) {
  const g = G.build(f), pts = []; for (let i = 0; i < g.outer.length / 3; i++) pts.push([g.outer[i*3], g.outer[i*3+1], g.outer[i*3+2]]);
  const F0 = G.FACES[0], axes = [[G.V[0], 72], [G.FACE_CEN[0], 120], [G.V[F0[0]].map((v, d) => v + G.V[F0[1]][d]), 180]];
  let worst = 0;
  for (const [ax, a] of axes) { const R = rotAbout(ax, a * Math.PI / 180);
    for (const p of pts) { const q = R(p); let best = 9; for (const r of pts) best = Math.min(best, Math.hypot(q[0]-r[0], q[1]-r[1], q[2]-r[2])); worst = Math.max(worst, best); } }
  check(`${f}v grid symmetric under 72° / 120° / 180° turns`, worst < 1e-6, `worst ${worst.toExponential(1)}`);
}

// 6. the 31 great circles and the seven axes
check('31 great circles: 15 + 10 + 6', G.GC[15].length === 15 && G.GC[10].length === 10 && G.GC[6].length === 6);
check('seven axes: 3 of the 15 and 4 of the 10 are shared with the vector equilibrium',
  G.GC[15].filter(c => c.seven).length === 3 && G.GC[10].filter(c => c.seven).length === 4);
check('the 15 circles contain every icosahedron edge (mirror planes)',
  G.ICO_EDGES.every(([i, j]) => G.GC[15].some(c => near(dot(c.N, G.V[i]), 0, 1e-9) && near(dot(c.N, G.V[j]), 0, 1e-9))));

// 7. LCD triangles (Synergetics 901.18): 120, half each hand; corner angles 90/60/36; arcs
const corner = (A, B, C) => { const t1 = norm(cross(cross(A, B), A)), t2 = norm(cross(cross(A, C), A)); return arc(t1, t2); };
const [a, b, c] = G.FACES[0].map(i => G.V[i]), m = norm(a.map((v, d) => v + b[d])), cen = G.FACE_CEN[0];
check('120 LCD triangles, 60 of each hand', G.LCD.length === 120 && G.LCD.filter(t => t.chir > 0).length === 60);
check('LCD corner angles 36° / 90° / 60°', near(corner(a, m, cen), 36, 1e-6) && near(corner(m, cen, a), 90, 1e-6) && near(corner(cen, a, m), 60, 1e-6));
check('LCD arcs 31.717474° / 20.905157° / 37.377368°',
  near(arc(a, m), 31.717474, 1e-6) && near(arc(m, cen), 20.905157, 1e-6) && near(arc(cen, a), 37.377368, 1e-6));

// 8. jitterbug
const P = G.jbVerts(G.PHI);
check('jitterbug at t = φ lands on the Dymaxion vertices', P.every(p => G.V.some(v => len(p.map((x, d) => x - v[d])) < 1e-9)));
const edge = t => { const Q = G.jbVerts(t); return len(Q[0].map((x, d) => x - Q[5][d])); };
check('jitterbug edge length constant from t = 1 to t = 50', [1, 1.3, G.PHI, 2, 5, 50].every(t => near(edge(t), edge(1), 1e-9)));
check('twist: icosahedron 22.239°, Jessen 30°, octahedron 60°',
  near(G.twistDeg(G.PHI), 22.2388, 1e-3) && near(G.twistDeg(2), 30, 1e-9) && near(G.twistDeg(1e9), 60, 1e-6));

// 9. spherical polyhedra
const want = { icosa: [12, 30], dodeca: [20, 30], triaconta: [32, 60], icosidodeca: [30, 60], octa: [6, 12], ve: [12, 24] };
check('spherical polyhedra vertex and edge counts', Object.entries(want).every(([k, [v, e]]) => G.POLY[k].verts.length === v && G.POLY[k].edges.length === e));

// 10. unfolding: hinge = 180° − dihedral; all 20 faces coplanar when unfolded
check('hinge angle 41.810° (dihedral 138.190°)', near(G.FOLD_DEG, 180 - deg(Math.acos(-Math.sqrt(5) / 3)), 1e-9));
const T = G.faceTransforms(1), n0 = G.FACE_CEN[G.NET.root];
const planar = G.FACES.every((f, i) => f.every(v => { const p = T[i].R.map(r => dot(r, G.V[v])).map((x, d) => x + T[i].t[d]); return near(dot(p, n0), dot(G.V[G.FACES[G.NET.root][0]], n0), 1e-9); }));
check('unfolded net: all 20 faces in one plane', planar);

// 11. truss, for information
const g16 = G.build(16), rIn = 1 - g16.chord * Math.sqrt(2 / 3);
let wMin = 9, wMax = 0;
for (let e = 0; e < g16.webE.length; e += 2) {
  const t = g16.webE[e], v = g16.webE[e+1];
  const w = Math.hypot(...[0, 1, 2].map(d => g16.innerDir[t*3+d] * rIn - g16.outer[v*3+d])) / g16.chord;
  wMin = Math.min(wMin, w); wMax = Math.max(wMax, w);
}
console.log(`info  16v web struts are ${wMin.toFixed(3)}–${wMax.toFixed(3)}× the mean outer strut (regular tetrahedra would be 1)`);

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
