"""Flatten OE monogram SVG: apply group transform, convert circle+rects to a single compound path."""
import math

sqrt2_inv = 1.0 / math.sqrt(2)

# Group transform: translate(170.02,170.02) rotate(-45) scale(-1,1) translate(-140.45,-100)
# M = T1 * R(-45) * S(-1,1) * T2
a, b = -sqrt2_inv, sqrt2_inv
c, d = sqrt2_inv, sqrt2_inv

T2_tx, T2_ty = -140.45084971874738, -100.0
T1_tx, T1_ty = 170.0244263781937, 170.0244263781937

e = a * T2_tx + b * T2_ty
f = c * T2_tx + d * T2_ty
tx = e + T1_tx
ty = f + T1_ty


def xf(px, py):
    return a * px + b * py + tx, c * px + d * py + ty


# Circle params
CX, CY = 100.0, 100.0
R = 80.90169943749474
SW = 38.19660112501052
R_OUT = R + SW / 2   # 100.0
R_IN = R - SW / 2    # ~61.803

# Kappa for cubic bezier circle approximation (4 arcs)
K = 4.0 * (math.sqrt(2) - 1) / 3.0


def circle_beziers(cx, cy, r, cw=True):
    k = K * r
    if cw:
        return [
            ((cx+r, cy), (cx+r, cy+k), (cx+k, cy+r), (cx, cy+r)),
            ((cx, cy+r), (cx-k, cy+r), (cx-r, cy+k), (cx-r, cy)),
            ((cx-r, cy), (cx-r, cy-k), (cx-k, cy-r), (cx, cy-r)),
            ((cx, cy-r), (cx+k, cy-r), (cx+r, cy-k), (cx+r, cy)),
        ]
    else:
        return [
            ((cx+r, cy), (cx+r, cy-k), (cx+k, cy-r), (cx, cy-r)),
            ((cx, cy-r), (cx-k, cy-r), (cx-r, cy-k), (cx-r, cy)),
            ((cx-r, cy), (cx-r, cy+k), (cx-k, cy+r), (cx, cy+r)),
            ((cx, cy+r), (cx+k, cy+r), (cx+r, cy+k), (cx+r, cy)),
        ]


def pt(x, y):
    nx, ny = xf(x, y)
    return f"{nx:.6f} {ny:.6f}"


parts = []
all_points = []

# --- Outer circle (CW before transform → CCW after reflection) ---
outer = circle_beziers(CX, CY, R_OUT, cw=True)
parts.append(f"M {pt(*outer[0][0])}")
for seg in outer:
    parts.append(f"C {pt(*seg[1])} {pt(*seg[2])} {pt(*seg[3])}")
    for p in seg:
        all_points.append(xf(*p))
parts.append("Z")

# --- Inner circle (CCW before → CW after = hole) ---
inner = circle_beziers(CX, CY, R_IN, cw=False)
parts.append(f"M {pt(*inner[0][0])}")
for seg in inner:
    parts.append(f"C {pt(*seg[1])} {pt(*seg[2])} {pt(*seg[3])}")
    for p in seg:
        all_points.append(xf(*p))
parts.append("Z")

# --- 4 Rectangles (CW before → CCW after = filled) ---
rects = [
    (80.90169943749474, 0.0, 38.19660112501052, 200.0),
    (119.09830056250526, 161.80339887498948, 161.80339887498948, 38.19660112501052),
    (117.66627, 80.750519, 163.08426, 38.49897),
    (119.09830056250526, 0.0, 161.80339887498948, 38.19660112501052),
]

for rx, ry, rw, rh in rects:
    corners = [(rx, ry), (rx + rw, ry), (rx + rw, ry + rh), (rx, ry + rh)]
    parts.append(f"M {pt(*corners[0])}")
    for corner in corners[1:]:
        parts.append(f"L {pt(*corner)}")
    parts.append("Z")
    for corner in corners:
        all_points.append(xf(*corner))

d_attr = " ".join(parts)

# Bounding box with padding
min_x = min(p[0] for p in all_points)
max_x = max(p[0] for p in all_points)
min_y = min(p[1] for p in all_points)
max_y = max(p[1] for p in all_points)
pad = 5
vb_x = min_x - pad
vb_y = min_y - pad
vb_w = (max_x - min_x) + 2 * pad
vb_h = (max_y - min_y) + 2 * pad

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="{vb_x:.4f} {vb_y:.4f} {vb_w:.4f} {vb_h:.4f}"
     width="{vb_w:.4f}" height="{vb_h:.4f}"
     xmlns="http://www.w3.org/2000/svg">
  <path d="{d_attr}" fill="black" fill-rule="nonzero"/>
</svg>'''

out_path = "design-assets/oddessentials-logo-generator/img/oddessentials-logo-flattened.svg"
with open(out_path, "w") as f:
    f.write(svg)

print(f"Written to {out_path}")
print(f"Bounds: ({min_x:.2f}, {min_y:.2f}) to ({max_x:.2f}, {max_y:.2f})")
print(f"Size: {max_x - min_x:.2f} x {max_y - min_y:.2f}")
