# Dymaxion Sphere Studio

A mathematically exact, double-layer geodesic sphere in the manner of Buckminster Fuller's Montreal Biosphere (1967), with a browser studio for exploring and exporting it.

**Try it:** [hankwhiteco.github.io/dymaxion-sphere-studio/studio.html](https://hankwhiteco.github.io/dymaxion-sphere-studio/studio.html)

- **Outer layer**: Class I breakdown of an icosahedron in Fuller's Dymaxion orientation, projected radially onto the sphere (2v–16v).
- **Inner layer**: the dual net, one node beneath the centroid of every outer triangle, giving hexagons and the 12 pentagons.
- **Web**: each inner node strutted to its triangle's three corners. At 100% truss depth (`a·√(2/3)`), these form regular tetrahedra: an octet truss.

At 16v the strut chord is about 0.075 r, close to the density of the Biosphere photograph that started this project.

## Studio

`studio.html` is a single self-contained page. Open it in a browser, or serve the folder:

```bash
python3 -m http.server 8143
```

then visit `http://localhost:8143/studio.html`.

- **Frequency** 2v–16v, with an option to keep strut size constant so the sphere scales with frequency.
- **Layers**: outer triangles, inner hexagons, web diagonals, the 20-face icosahedron net, the 12 five-fold nodes, the vector equilibrium's 4 great circles, and the far side (with opacity).
- **Color**: strut and highlight colors; Paper, Ink or Clear artboard.
- **Motion**: speed, direction, spin axis (polar, or the 5-, 3- or 2-fold symmetry axes), tilt, wobble, and drag to orbit.
- **Jitterbug**: Fuller's transformation of the vector equilibrium (cuboctahedron) into the icosahedron, then subdivision and inflation to the sphere. Run it or scrub it.
- **Export**: SVG and PNG of the current frame (transparent by default), plus GIF and MP4 clips. Loops turn by the drawing's own symmetry angle, so they repeat seamlessly.

GIF and MP4 export load [gifenc](https://github.com/mattdesl/gifenc) and [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) from jsDelivr on first use. MP4 needs WebCodecs (Chrome, Edge, Safari 16.4+).

## Other files

| File | What it does |
|---|---|
| `geodesic.py` | Pure-Python SVG generator (no dependencies). `python3 geodesic.py -f 16 -o geodesic_16v.svg`; see `--help` for view angle, far-side opacity and truncation. |
| `geodesic-sphere.js` | `<geodesic-sphere>` web component: a slowly rotating sphere for embedding in a page. |
| `index.html` | Demo of the web component: 16v and 8v side by side at the same strut scale. |
| `export-gif.mjs` | Node script for a seamless looping GIF (`npm install`, then `node export-gif.mjs --freq 8 --size 1200`). |
| `geodesic_16v.svg`, `geodesic_8v_1000.svg` | Example exports. |

## Geometry notes

- The icosahedron vertices are the Dymaxion map orientation as published by Robert W. Gray. The code checks that they form a regular icosahedron (neighbour dot product 1/√5).
- The node count is checked against 10f² + 2, and Euler's formula V − E + F = 2 holds at every frequency.
- Distinct outer strut lengths match the standard Class I counts (2 at 2v, 3 at 3v, 6 at 4v).
- The jitterbug is the family of cyclic permutations of (0, ±1, ±t): t = 1 is the cuboctahedron, t = φ the icosahedron. Edge length is held constant throughout, and the end state is rotated to land exactly on the Dymaxion vertices.

## License

MIT. See [LICENSE](LICENSE).
