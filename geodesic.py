#!/usr/bin/env python3
"""
Double-layer geodesic sphere (Fuller / Montreal Biosphere type) -> SVG.

Geometry
  * Base solid: the icosahedron, oriented exactly as in Fuller's Dymaxion
    map (vertex set from R. W. Gray's Dymaxion projection), so the 12
    five-fold nodes sit where Fuller placed them.
  * Outer layer: Class I (alternate) breakdown, frequency F. Each face is
    subdivided on its flat plane into F^2 triangles, then every node is
    projected radially onto the sphere (Fuller's chord-factor method).
  * Inner layer: the dual net -- one node beneath the centroid of every
    outer triangle, joined to its neighbours -> hexagons + 12 pentagons.
  * Web: each inner node is strutted to the 3 corners of its outer
    triangle, giving near-regular tetrahedra (octet-truss depth a*sqrt(2/3)).

Rendering: orthographic, both hemispheres drawn (it's a see-through frame),
black strokes, no background (transparent).
"""
import math, sys, argparse

# ---------------------------------------------------------------- vectors
def add(a, b): return (a[0]+b[0], a[1]+b[1], a[2]+b[2])
def sub(a, b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
def mul(a, s): return (a[0]*s, a[1]*s, a[2]*s)
def dot(a, b): return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
def norm(a):
    l = math.sqrt(dot(a, a)); return (a[0]/l, a[1]/l, a[2]/l)

# ------------------------------------------- Dymaxion icosahedron (Gray)
V = [
    ( 0.420152426708710003,  0.078145249402782959,  0.904082550615019298),
    ( 0.995009439436241649, -0.091347795276427931,  0.040147175877166645),
    ( 0.518836730327364437,  0.835420380378235850,  0.181331837557262454),
    (-0.414682225320335218,  0.655962405434800777,  0.630675807891475371),
    (-0.515455959944041808, -0.381716898287133011,  0.767200992517747538),
    ( 0.355781402532944713, -0.843580002466178147,  0.402234226602925571),
    ( 0.414682225320335218, -0.655962405434800777, -0.630675807891475371),
    ( 0.515455959944041808,  0.381716898287133011, -0.767200992517747538),
    (-0.355781402532944713,  0.843580002466178147, -0.402234226602925571),
    (-0.995009439436241649,  0.091347795276427931, -0.040147175877166645),
    (-0.518836730327364437, -0.835420380378235850, -0.181331837557262454),
    (-0.420152426708710003, -0.078145249402782959, -0.904082550615019298),
]

def icosa_faces(V):
    """Derive the 20 faces from adjacency (neighbours: dot = 1/sqrt5)."""
    adj = lambda i, j: abs(dot(V[i], V[j]) - 1/math.sqrt(5)) < 1e-6
    F = []
    for i in range(12):
        for j in range(i+1, 12):
            for k in range(j+1, 12):
                if adj(i, j) and adj(j, k) and adj(i, k):
                    a, b, c = V[i], V[j], V[k]
                    n = (b[1]-a[1])*(c[2]-a[2]) - (b[2]-a[2])*(c[1]-a[1]), \
                        (b[2]-a[2])*(c[0]-a[0]) - (b[0]-a[0])*(c[2]-a[2]), \
                        (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0])
                    F.append((i, j, k) if dot(n, a) > 0 else (i, k, j))
    assert len(F) == 20, len(F)
    return F

# ----------------------------------------------------- Class I breakdown
def build(freq):
    faces = icosa_faces(V)
    key = lambda p: (round(p[0], 9), round(p[1], 9), round(p[2], 9))
    nodes, index = [], {}
    def node(p):
        p = norm(p); k = key(p)
        if k not in index:
            index[k] = len(nodes); nodes.append(p)
        return index[k]

    tris = []
    for (ia, ib, ic) in faces:
        A, B, C = V[ia], V[ib], V[ic]
        grid = {}
        for i in range(freq+1):
            for j in range(freq+1-i):
                k = freq - i - j
                p = add(add(mul(A, k/freq), mul(B, i/freq)), mul(C, j/freq))
                grid[(i, j)] = node(p)
        for i in range(freq):
            for j in range(freq-i):
                tris.append((grid[(i, j)], grid[(i+1, j)], grid[(i, j+1)]))
                if i+j < freq-1:
                    tris.append((grid[(i+1, j)], grid[(i+1, j+1)], grid[(i, j+1)]))

    outer_edges = set()
    edge_tris = {}
    for t, (a, b, c) in enumerate(tris):
        for u, v in ((a, b), (b, c), (c, a)):
            e = (min(u, v), max(u, v))
            outer_edges.add(e)
            edge_tris.setdefault(e, []).append(t)

    # Euler check: V - E + F = 2, and 10f^2+2 nodes
    nV, nE, nF = len(nodes), len(outer_edges), len(tris)
    assert nV == 10*freq*freq + 2 and nV - nE + nF == 2, (nV, nE, nF)

    # mean outer chord -> octet-truss depth
    chord = sum(math.dist(nodes[a], nodes[b]) for a, b in outer_edges) / nE
    depth = chord * math.sqrt(2/3)
    r_in = 1.0 - depth

    inner = [mul(norm(add(add(nodes[a], nodes[b]), nodes[c])), r_in)
             for a, b, c in tris]
    inner_edges = [tuple(ts) for ts in edge_tris.values()]     # dual edges
    web = [(t, v) for t, tri in enumerate(tris) for v in tri]  # diagonals
    stats = dict(freq=freq, nodes=nV, outer_struts=nE, triangles=nF,
                 inner_nodes=len(inner), inner_struts=len(inner_edges),
                 web_struts=len(web), chord=chord, depth=depth, r_in=r_in)
    return nodes, outer_edges, inner, inner_edges, web, stats

# ------------------------------------------------------------- rendering
def view_matrix(lat, lon, roll):
    """Rotation taking the view direction (lat, lon) to +z (toward viewer)."""
    la, lo, ro = map(math.radians, (lat, lon, roll))
    # camera basis: f = toward viewer, r = right, u = up
    f = (math.cos(la)*math.cos(lo), math.cos(la)*math.sin(lo), math.sin(la))
    zup = (0, 0, 1)
    r = norm((f[1]*zup[2]-f[2]*zup[1], f[2]*zup[0]-f[0]*zup[2], f[0]*zup[1]-f[1]*zup[0]))
    u = (r[1]*f[2]-r[2]*f[1], r[2]*f[0]-r[0]*f[2], r[0]*f[1]-r[1]*f[0])
    cr, sr = math.cos(ro), math.sin(ro)
    r, u = add(mul(r, cr), mul(u, sr)), add(mul(u, cr), mul(r, -sr))
    return lambda p: (dot(p, r), dot(p, u), dot(p, f))

def render(freq=12, size=2000, lat=12.0, lon=20.0, roll=0.0,
           w_outer=2.4, w_inner=1.3, w_web=0.75, back_opacity=0.28,
           hemi=1.0):
    nodes, oe, inner, ie, web, st = build(freq)
    P = view_matrix(lat, lon, roll)
    R = size/2 * 0.97
    c = size/2

    def proj(p):
        x, y, z = P(p)
        return (c + x*R, c - y*R, z)

    on = [proj(p) for p in nodes]
    inn = [proj(p) for p in inner]

    # optional truncation (Biosphere is ~3/4 sphere): keep world-z >= cut
    cut = 1 - 2*hemi
    keep_o = [nodes[i][2] >= cut - 1e-9 for i in range(len(nodes))]
    keep_i = [inner[i][2]/st['r_in'] >= cut - 1e-9 for i in range(len(inner))]

    buckets = {}  # (layer, front?) -> list of segments
    def seg(layer, a, b):
        front = (a[2] + b[2]) / 2 >= 0
        buckets.setdefault((layer, front), []).append(
            f"M{a[0]:.1f} {a[1]:.1f}L{b[0]:.1f} {b[1]:.1f}")

    for a, b in oe:
        if keep_o[a] and keep_o[b]: seg('outer', on[a], on[b])
    for a, b in ie:
        if keep_i[a] and keep_i[b]: seg('inner', inn[a], inn[b])
    for t, v in web:
        if keep_i[t] and keep_o[v]: seg('web', inn[t], on[v])

    # widths follow drawn strut length (tuned on 16v @ 2000px), so spheres
    # drawn at the same scale share the same strut thickness
    k = (st['chord'] * R) / (0.07516 * 970)
    width = {'outer': round(w_outer*k, 3), 'inner': round(w_inner*k, 3),
             'web': round(w_web*k, 3)}
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" '
           f'width="{size}" height="{size}">',
           f'<title>Geodesic sphere — Class I, {freq}v, double layer</title>',
           f'<desc>Dymaxion-oriented icosahedron, {st["nodes"]} outer nodes, '
           f'{st["outer_struts"]} outer struts, {st["inner_struts"]} inner struts, '
           f'{st["web_struts"]} web struts. Transparent background.</desc>',
           '<g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">']
    # back hemisphere first, then front (painter's order)
    for front in (False, True):
        op = 1 if front else back_opacity
        g = 'front' if front else 'back'
        out.append(f'<g id="{g}" stroke-opacity="{op}">')
        for layer in ('web', 'inner', 'outer'):
            segs = buckets.get((layer, front))
            if segs:
                out.append(f'<path id="{g}-{layer}" stroke-width="{width[layer]}" '
                           f'd="{"".join(segs)}"/>')
        out.append('</g>')
    out.append('</g></svg>')
    return "\n".join(out), st

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("-f", "--freq", type=int, default=16)
    ap.add_argument("-s", "--size", type=int, default=2000)
    ap.add_argument("--lat", type=float, default=12.0)
    ap.add_argument("--lon", type=float, default=20.0)
    ap.add_argument("--roll", type=float, default=0.0)
    ap.add_argument("--back", type=float, default=0.28, help="back-hemisphere opacity")
    ap.add_argument("--hemi", type=float, default=1.0,
                    help="fraction of sphere height kept (1 = full, 0.75 = Biosphere)")
    ap.add_argument("-o", "--out", default="geodesic.svg")
    a = ap.parse_args()
    svg, st = render(a.freq, a.size, a.lat, a.lon, a.roll,
                     back_opacity=a.back, hemi=a.hemi)
    open(a.out, "w").write(svg)
    print(a.out, {k: round(v, 4) if isinstance(v, float) else v for k, v in st.items()})
