# Dymaxion Sphere Studio

A mathematically exact, double-layer geodesic sphere in the manner of Buckminster Fuller's Montreal Biosphere (1967), with a browser studio for exploring and exporting it.

**Try it:** [hankwhiteco.github.io/dymaxion-sphere-studio/studio.html](https://hankwhiteco.github.io/dymaxion-sphere-studio/studio.html)

- **Outer layer**: Class I breakdown of an icosahedron in Fuller's Dymaxion orientation, projected radially onto the sphere (2v–16v).
- **Inner layer**: the dual net, one node beneath the centroid of every outer triangle, giving hexagons and the 12 pentagons.
- **Web**: each inner node strutted to its triangle's three corners. At 100% truss depth (`a·√(2/3)`, the octet-truss depth for a flat layer) these form near-regular tetrahedra: at 16v the web struts run 0.91–1.02× the outer strut. Curvature pulls the inner layer together, so its hexagon edges are shorter than a flat octet truss's.

At 16v the strut chord is about 0.075 r, close to the density of the Biosphere photograph that started this project.

## Studio

`studio.html` is a single self-contained page. Open it in a browser, or serve the folder:

```bash
python3 -m http.server 8143
```

then visit `http://localhost:8143/studio.html`.

The control panel has five tabs: **Shape** (frequency, structure, strut types), **Overlays** (net and symmetry, great circles, polyhedra), **Style** (lines, colour, texture), **Motion** (spin, view, animations) and **Export** (image, clip). Every section folds shut; the open tab and the folded sections are remembered. On a phone the sphere stays pinned at the top: scrolling the controls shrinks it to the top third of the screen, and the tabs stick just below it.

- **Frequency** 2v–16v, with an option to keep strut size constant so the sphere scales with frequency.
- **Layers**: outer triangles, inner hexagons, web diagonals, the 20-face icosahedron net, the 12 five-fold nodes, the vector equilibrium's 4 great circles, the icosahedron's 31 great circles (6 / 10 / 15, with the seven axes), the 120 LCD triangles, spherical polyhedra traced in great-circle arcs, and the far side (with opacity). Struts fade smoothly between full strength and the far-side opacity as they turn past the edge, so nothing pops, and with Normal blending a nearer stroke covers a farther one rather than stacking on it, so thick semi-transparent struts don't darken where they cross; SVG exports keep the steps as `back`, `depth-1`…`depth-8` and `front` groups.
- **Strut types**: colour every strut by its length, with a chord-factor legend in metres for any dome radius and a cutting tolerance that merges near-equal lengths.
- **Color**: struts, highlights and background, each White, Black or Custom; the outer, inner and diagonal layers follow the struts or take their own. Custom (or a layer) opens a small editor: Solid, or Gradient from one colour to another, down, across, diagonal, radial or by depth (each strut coloured by its distance from you, so struts change colour as they turn toward or away from you). Struts, each layer and the background can all have their own gradient; highlights stay solid. Every line is drawn at the one Line weight, and line ends can be round, square or flat.
- **Texture**: every canvas blend mode for the lines (Multiply, Screen, Overlay, Difference and the rest; hover a mode to preview it) and a grain layer on top, in black and white or any colour, from fine to coarse and from dense to scattered. Grain scales with the image, so PNG and MP4 exports match the view; GIFs leave it out, SVGs keep the blend but not the grain.
- **Motion**: spin (one slider, both directions), spin axis (polar, or the 5-, 3- or 2-fold symmetry axes), wobble, and orientation by hand: Turn about the spin axis, Tilt toward you and Roll in the screen, each looping all the way round, as sliders, ← → and Q/E, or by dragging (Shift-drag rolls); ↑ ↓ tumble the sphere about a 5-fold axis.
- **Animations**: the jitterbug (VE to sphere), the jitterbug's phases on the seven circles (VE, icosahedron, Jessen, octahedron), great circles sweeping in, unfolding to the icosahedral net, frequency growth by divisors, building from the crown, and a breathing truss; plus five studies (Facet, sphere to icosahedron to dodecahedron; Moiré, two neighbouring grids crossing; Scan; Scatter, cells tumbling off the shell; and Tune, which moves smoothly between any two frequencies) that start and end on the plain sphere, so their clips loop. Run or scrub any of them.
- **Export**: SVG and PNG of the current frame (transparent by default), plus GIF and MP4 clips at 720, 1080 or 1600 square or as a 1080×1920 Reel, with Standard, High or Max video quality. Loops turn by the drawing's own symmetry angle, so they repeat seamlessly, and a loop clip can run 1–10 loops in a row. An animation clip can carry on for 1–10 seamless loops after the animation ends.

### Keyboard and macropad

[shortcuts.html](https://hankwhiteco.github.io/dymaxion-sphere-studio/shortcuts.html) lists every key with its VIA keycode, and a Creator Micro layout to start from.

| Key | Does |
|---|---|
| `Space` | play or pause |
| `[` / `]` | frequency down / up |
| `,` / `.` | spin slower / faster, through stopped into reverse |
| `-` / `=` | truss depth down / up by 5% (turns auto breathing off) |
| `;` / `'` | line weight down / up, about 10% a press (Shift: 2%) |
| `←` / `→` | turn the sphere about the spin axis |
| `↑` / `↓` | tumble the sphere toward / away from you about one of its own 5-fold axes (the one lying most nearly across the screen); every 72° it lands on an identical view. Tilt stays on its slider and on vertical drags |
| `Q` / `E` | roll the picture about the line of sight |
| `Shift+1`–`4` | the four pinned presets |
| `1`–`0` | toggle outer, inner, diagonals, far side, icosahedron net, five-fold nodes, vector equilibrium, great circles, LCD triangles, spherical polyhedron |
| `R` | random colours for the outer, inner and diagonal layers and the highlight (a colour scheme from a random hue, readable on the background, with the highlight on the complementary hue); `Shift+R` gives the layers top-to-bottom gradients instead, each running into the next colour of the scheme. Match struts resets the layers |
| `V` / `B` | blend mode back / forward through the Texture list, wrapping round |
| `F` | full screen (just the sphere); `Esc` leaves |

The orientation keys glide rather than step: a tap eases 5° (1° with Shift), holding ramps up to a steady turn and glides to a stop on release, and keys combine, so → and ↑ together move diagonally. A flicked drag coasts to rest. Keys are matched by position, so they work on any layout, and are ignored while typing in a field or with Cmd, Ctrl or Alt held. Each shows a short readout of what changed.

To put a control on a Work Louder Creator Micro wheel: open [usevia.app](https://usevia.app) in Chrome or Edge, select the Creator Micro, click a wheel's **clockwise** and **counter-clockwise** slots and choose the pair from Basic: `]` and `[` (KC_RBRC, KC_LBRC) for frequency, `.` and `,` (KC_DOT, KC_COMM) for spin, or `=` and `-` (KC_EQL, KC_MINS) for truss depth. Each detent then steps once while the studio's window has focus.

### Presets

**Presets** in the masthead saves the current look and motion by name. A preset travels as a short code (`ds1.` and about 150 characters: only the settings that differ from the defaults, compressed): copy it, paste it into the box, or copy a link that opens the studio with it applied. Pin up to four favourites; `Shift+1`–`4` recall them, so they fit on a macropad. The panel tab, folded sections, export settings and play or pause are left out, and every value in a pasted code is checked before it is used.

GIF and MP4 export load [gifenc](https://github.com/mattdesl/gifenc) and [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) from jsDelivr on first use. MP4 needs WebCodecs (Chrome, Edge, Safari 16.4+).

## Other files

| File | What it does |
|---|---|
| `geodesic.py` | Pure-Python SVG generator (no dependencies). `python3 geodesic.py -f 16 -o geodesic_16v.svg`; see `--help` for view angle, far-side opacity and truncation. |
| `geodesic-sphere.js` | `<geodesic-sphere>` web component: a slowly rotating sphere for embedding in a page. |
| `demo.html` | Demo of the web component: 16v and 8v side by side at the same strut scale. |
| `vercel.json` | Vercel hosting: a static site whose home page is the studio. |
| `export-gif.mjs` | Node script for a seamless looping GIF (`npm install`, then `node export-gif.mjs --freq 8 --size 1200`). |
| `geodesic_16v.svg`, `geodesic_8v_1000.svg` | Example exports. |

## Reference and verification

[reference.html](https://hankwhiteco.github.io/dymaxion-sphere-studio/reference.html) explains the mathematics behind every layer and animation, with sources. `npm test` runs `tools/verify.mjs`, which checks the studio's geometry, pulled straight out of `studio.html`, against the published reference values.

## Geometry notes

- The icosahedron vertices are the Dymaxion map orientation as published by Robert W. Gray. The code checks that they form a regular icosahedron (neighbour dot product 1/√5).
- The node count is checked against 10f² + 2, and Euler's formula V − E + F = 2 holds at every frequency.
- Chord factors match the published Class I values (2v: 0.54653, 0.61803; 3v: 0.34862, 0.40355, 0.41241; 4v: 0.25318 … 0.32492), and the number of distinct strut lengths matches Haghnazar, Nooshin & Golabchi (2014), Table 1, at every frequency from 2v to 16v (72 at 16v).
- The grid is symmetric under 72°, 120° and 180° turns about the 5-, 3- and 2-fold axes (to float precision), which is what makes the studio's loops seamless.
- The vector equilibrium's 4 great circles are 4 of the icosahedron's 10 face-axis (3-fold) great circles.
- The jitterbug is the family of cyclic permutations of (0, ±1, ±t): t = 1 is the cuboctahedron, t = φ the icosahedron. Edge length is held constant throughout, and the end state is rotated to land exactly on the Dymaxion vertices.

## License

MIT. See [LICENSE](LICENSE).
