"""Tiny SDF ray-marcher for brand-lit 3D illustrations (transparent PNG output)."""
import sys, math
import numpy as np
from PIL import Image

def lin(h):
    c = np.array([int(h[i:i+2], 16) / 255 for i in (0, 2, 4)])
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


TURQ = lin("0CCCCC")
TEAL = lin("01A3A3")
CORAL = lin("FF4D4D")


def norm(v):
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


# ---------- SDF primitives (p: (N,3)) ----------
def sd_round_box(p, b, r):
    q = np.abs(p) - (np.array(b) - r)
    return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(q.max(axis=1), 0) - r


def sd_sphere(p, r):
    return np.linalg.norm(p, axis=1) - r


def sd_torus(p, R, r):
    q = np.stack([np.hypot(p[:, 0], p[:, 2]) - R, p[:, 1]], axis=1)
    return np.linalg.norm(q, axis=1) - r


def sd_capsule(p, a, b, r):
    a, b = np.array(a), np.array(b)
    pa, ba = p - a, b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[:, None] * ba, axis=1) - r


def sd_cyl(p, r, h, rr=0.0):
    d = np.stack([np.hypot(p[:, 0], p[:, 2]) - r + rr, np.abs(p[:, 1]) - h + rr], axis=1)
    return np.minimum(d.max(axis=1), 0) + np.linalg.norm(np.maximum(d, 0), axis=1) - rr


def xf(p, R=None, t=(0, 0, 0)):
    """world -> local: p_local = R^T (p - t)"""
    q = p - np.array(t)
    return q @ R if R is not None else q


class Scene:
    def __init__(self):
        self.items = []  # (fn(p)->d, material dict)

    def add(self, fn, mat):
        self.items.append((fn, mat))

    def dist(self, p):
        ds = np.stack([fn(p) for fn, _ in self.items], axis=1)
        return ds.min(axis=1), ds.argmin(axis=1)


def env(r):
    """Fake studio environment: top softbox, turquoise side strip, dark floor."""
    top = np.clip((r[:, 1] - 0.35) / 0.4, 0, 1) ** 2 * 2.2
    side = np.exp(-((r[:, 0] - 0.85) ** 2) / 0.02) * np.clip(r[:, 1] + 0.6, 0, 1)
    left = np.exp(-((r[:, 0] + 0.9) ** 2) / 0.03) * 0.35
    c = top[:, None] * np.array([1.0, 1.0, 1.0]) + side[:, None] * TURQ * 2.4 + left[:, None] * np.array([0.6, 0.7, 0.75])
    return c + 0.015


def render(scene, out, size=1600, cam=(0, 1, 4), look=(0, 0, 0), fov=32, out_size=1000,
           key=(-0.5, 0.85, 0.6), rim=(0.9, 0.2, -0.6), exposure=1.0):
    W = H = size
    cam, look = np.array(cam, float), np.array(look, float)
    fwd = norm(look - cam)
    right = norm(np.cross(fwd, [0, 1, 0]))
    up = np.cross(right, fwd)
    f = 1 / math.tan(math.radians(fov) / 2)
    ys, xs = np.mgrid[0:H, 0:W]
    u = (xs + 0.5) / W * 2 - 1
    v = 1 - (ys + 0.5) / H * 2
    dirs = norm(u.reshape(-1, 1) * right + v.reshape(-1, 1) * up + f * fwd)
    N = dirs.shape[0]
    t = np.zeros(N)
    hit = np.zeros(N, bool)
    active = np.arange(N)
    for _ in range(160):
        if active.size == 0:
            break
        p = cam + dirs[active] * t[active, None]
        d, _ = scene.dist(p)
        t[active] += d * 0.9
        done = d < 0.0008
        hit[active[done]] = True
        far = t[active] > 12
        active = active[~done & ~far]
    idx = np.where(hit)[0]
    rgb = np.zeros((N, 3))
    alpha = hit.astype(float)
    p = cam + dirs[idx] * t[idx, None]
    _, mid = scene.dist(p)
    e = 0.0015
    n = np.zeros_like(p)
    for k in range(3):
        o = np.zeros(3); o[k] = e
        n[:, k] = scene.dist(p + o)[0] - scene.dist(p - o)[0]
    n = norm(n)
    vdir = -dirs[idx]
    # ambient occlusion
    ao = np.ones(len(idx))
    for i in range(1, 6):
        h = 0.03 * i
        ao -= (h - scene.dist(p + n * h)[0]) * (0.5 ** i) * 6
    ao = np.clip(ao, 0.25, 1)
    L = norm(np.array(key, float))
    Rl = norm(np.array(rim, float))
    ndl = np.clip(n @ L, 0, 1)
    ndv = np.clip((n * vdir).sum(1), 0, 1)
    refl = dirs[idx] - 2 * (dirs[idx] * n).sum(1, keepdims=True) * n
    envc = env(refl)
    for mi, (_, m) in enumerate(scene.items):
        sel = mid == mi
        if not sel.any():
            continue
        base = np.array(m["color"])
        F0 = m.get("f0", 0.04)
        fres = F0 + (1 - F0) * (1 - ndv[sel]) ** 5
        hv = norm(L + vdir[sel])
        spec = np.clip((n[sel] * hv).sum(1), 0, 1) ** m.get("shine", 60) * m.get("spec", 1.0)
        diff = base * (0.10 + 0.95 * ndl[sel, None]) * ao[sel, None]
        rimv = np.clip(1 - ndv[sel], 0, 1) ** 2.5 * np.clip(n[sel] @ Rl * 0.7 + 0.5, 0, 1)
        col = diff + spec[:, None] * 1.2
        col += envc[sel] * (fres[:, None] * m.get("refl", 0.6))
        col += rimv[:, None] * np.array(m.get("rimc", TURQ)) * m.get("rim", 1.2)
        if "emit" in m:
            col += np.array(m["emit"]) * (ndv[sel, None] ** m.get("emit_pow", 2.0))
        rgb[idx[sel]] = col
    rgb = rgb * exposure
    rgb = rgb / (1 + rgb * 0.55)  # soft tonemap
    rgb = np.clip(rgb, 0, 1) ** (1 / 2.2)
    img = np.concatenate([rgb, alpha[:, None]], 1).reshape(H, W, 4)
    # premultiply for clean downsample, then unpremultiply
    pm = img.copy(); pm[..., :3] *= pm[..., 3:]
    im = Image.fromarray((pm * 255).astype(np.uint8), "RGBA").resize((out_size, out_size), Image.LANCZOS)
    a = np.asarray(im).astype(float) / 255
    c = a[..., :3] / np.maximum(a[..., 3:], 1e-4)
    a[..., :3] = np.clip(c, 0, 1)
    Image.fromarray((a * 255).astype(np.uint8), "RGBA").save(out)
    print("saved", out)


# ---------------- scenes ----------------
BLACK_GLOSS = dict(color=[0.025, 0.035, 0.04], spec=1.2, shine=90, refl=0.9, rim=1.6)


def scene_cap():
    s = Scene()
    R = rot_z(math.radians(9)) @ rot_x(math.radians(-14))
    Rb = R @ rot_y(math.radians(45))
    s.add(lambda p: sd_round_box(xf(p, Rb, (0, 0.18, 0)), (1.0, 0.05, 1.0), 0.03), BLACK_GLOSS)
    s.add(lambda p: sd_cyl(xf(p, R, (0, -0.12, 0)), 0.6, 0.28, 0.06),
          dict(color=[0.03, 0.045, 0.05], spec=0.9, shine=50, refl=0.7, rim=1.8))
    s.add(lambda p: sd_cyl(xf(p, R, (0, -0.4, 0)), 0.615, 0.03, 0.02),
          dict(color=TURQ * 0.9, spec=1, shine=80, refl=0.5, rim=0.6, rimc=[1, 1, 1]))
    corner = R @ np.array([1.32, 0.24, 0.0])
    top = R @ np.array([0, 0.27, 0])
    hang = corner + np.array([0.02, -0.75, 0.0])
    coral = dict(color=CORAL, spec=0.8, shine=40, refl=0.3, rim=0.5, rimc=[1, 0.7, 0.7])
    s.add(lambda p: sd_sphere(p - top, 0.075), coral)
    s.add(lambda p: sd_capsule(p, top, corner, 0.022), coral)
    s.add(lambda p: sd_capsule(p, corner, hang, 0.022), coral)
    s.add(lambda p: sd_cyl(p - (hang + np.array([0, -0.12, 0])), 0.07, 0.14, 0.04), coral)
    return s


def scene_orb():
    s = Scene()
    s.add(lambda p: sd_sphere(p, 0.78),
          dict(color=[0.004, 0.02, 0.024], spec=1.4, shine=140, refl=1.0, rim=2.6, f0=0.08,
               emit=TURQ * 0.55, emit_pow=6.0))
    R1 = rot_x(math.radians(72)) @ rot_z(math.radians(18))
    R2 = rot_x(math.radians(-60)) @ rot_z(math.radians(-30))
    ring = dict(color=TURQ, spec=1.4, shine=100, refl=0.6, rim=0.8, rimc=[1, 1, 1])
    s.add(lambda p: sd_torus(xf(p, R1), 1.22, 0.028), ring)
    s.add(lambda p: sd_torus(xf(p, R2), 1.48, 0.02), dict(ring, color=TEAL))
    a1 = R1 @ np.array([1.22 * math.cos(0.7), 0, 1.22 * math.sin(0.7)])
    a2 = R2 @ np.array([1.48 * math.cos(3.6), 0, 1.48 * math.sin(3.6)])
    s.add(lambda p: sd_sphere(p - a1, 0.09), dict(color=CORAL, spec=1, shine=60, refl=0.4, rim=0.6))
    s.add(lambda p: sd_sphere(p - a2, 0.07), dict(color=[0.95, 0.97, 0.97], spec=1, shine=60, refl=0.4, rim=0.6))
    return s


def scene_blocks():
    s = Scene()
    h = 0.27
    mats = {
        "t": dict(color=TURQ, spec=0.9, shine=70, refl=0.5, rim=0.9, rimc=[1, 1, 1]),
        "d": dict(color=TEAL * 0.75, spec=0.9, shine=70, refl=0.5, rim=1.0),
        "k": BLACK_GLOSS,
        "w": dict(color=[0.92, 0.95, 0.95], spec=0.8, shine=60, refl=0.4, rim=1.2),
    }
    blocks = [((-0.6, -0.6, 0), "k"), ((0.0, -0.6, 0), "d"), ((0.6, -0.6, 0), "t"),
              ((-0.3, -0.0, 0.0), "t"), ((0.3, -0.0, 0.0), "k"),
              ((0.02, 0.6, 0.0), "d")]
    for c, m in blocks:
        s.add(lambda p, c=c: sd_round_box(p - np.array(c), (h, h, h), 0.045), mats[m])
    Rf = rot_y(math.radians(28)) @ rot_x(math.radians(18)) @ rot_z(math.radians(-12))
    s.add(lambda p: sd_round_box(xf(p, Rf, (0.55, 1.35, 0.05)), (h, h, h), 0.045),
          dict(mats["t"], emit=TURQ * 0.35, emit_pow=1.0))
    return s


def scene_certs():
    s = Scene()
    paper = dict(color=[0.90, 0.93, 0.93], spec=0.5, shine=30, refl=0.25, rim=0.9)
    for i, (dy, ang, dx, dz) in enumerate([(-0.3, -8, -0.05, 0.05), (-0.18, 6, 0.06, -0.02),
                                            (-0.06, -3, -0.02, 0.04), (0.06, 12, 0.04, 0.0)]):
        R = rot_y(math.radians(ang))
        s.add(lambda p, R=R, t=(dx, dy, dz): sd_round_box(xf(p, R, t), (0.95, 0.018, 0.68), 0.012),
              dict(paper, color=[0.9 - i * 0.03, 0.93 - i * 0.02, 0.93 - i * 0.02]))
    R = rot_y(math.radians(12))
    seal_c = R @ np.array([0.55, 0.1, 0.35]) + np.array([0.04, 0, 0])
    coral = dict(color=CORAL, spec=0.9, shine=50, refl=0.3, rim=0.5, rimc=[1, 0.7, 0.7])
    s.add(lambda p: sd_cyl(p - seal_c, 0.2, 0.03, 0.02), coral)
    s.add(lambda p: sd_torus(p - seal_c - np.array([0, 0.04, 0]), 0.14, 0.012), dict(coral, color=CORAL * 0.8))
    for ang in (-25, 20):
        Rr = rot_y(math.radians(ang))
        s.add(lambda p, Rr=Rr: sd_round_box(xf(p, Rr, seal_c + Rr @ np.array([0, -0.02, 0.32])), (0.06, 0.008, 0.2), 0.006), coral)
    # faint text lines on the top sheet (dark grooves)
    for k, (w, z) in enumerate([(0.55, -0.35), (0.7, -0.15), (0.45, 0.02)]):
        s.add(lambda p, w=w, z=z: sd_round_box(xf(p, R, (-0.15 + 0.04, 0.082, z)), (w, 0.004, 0.025), 0.003),
              dict(color=[0.55, 0.62, 0.62], spec=0.2, shine=10, refl=0.1, rim=0.2))
    return s


def scene_logo(mask_path):
    from scipy import ndimage
    m = np.asarray(Image.open(mask_path).getchannel("A")).astype(float) / 255
    m = np.pad(m, 40)
    inside = m > 0.5
    px = 2.0 / max(m.shape)  # logo spans 2 units
    d_out = ndimage.distance_transform_edt(~inside)
    d_in = ndimage.distance_transform_edt(inside)
    sdf2 = (d_out - d_in) * px
    Hh, Ww = sdf2.shape
    sdf2 = ndimage.gaussian_filter(sdf2, 1.0)
    depth = 0.11
    Rl = rot_y(math.radians(-24)) @ rot_x(math.radians(10))

    def f(p):
        q = xf(p, Rl)
        col = (q[:, 0] / px) + Ww / 2
        row = (-q[:, 1] / px) + Hh / 2
        inb = (col >= 0) & (col < Ww - 1) & (row >= 0) & (row < Hh - 1)
        d2 = np.full(len(q), 0.5)
        d2[inb] = ndimage.map_coordinates(sdf2, [row[inb], col[inb]], order=1)
        dz = np.abs(q[:, 2]) - depth
        w = np.stack([d2 + 0.012, dz + 0.012], 1)
        return np.minimum(w.max(1), 0) + np.linalg.norm(np.maximum(w, 0), axis=1) - 0.012

    s = Scene()
    s.add(f, dict(color=TURQ, spec=1.1, shine=80, refl=0.6, rim=1.0, rimc=[1, 1, 1]))
    return s


if __name__ == "__main__":
    out = sys.argv[1]
    which = sys.argv[2:]
    if "cap" in which:
        render(scene_cap(), f"{out}/r_cap.png", cam=(0, 2.5, 4.3), look=(0.15, -0.1, 0), fov=42)
    if "orb" in which:
        render(scene_orb(), f"{out}/r_orb.png", cam=(0, 0.4, 4.6), look=(0, 0, 0), fov=40)
    if "blocks" in which:
        render(scene_blocks(), f"{out}/r_blocks.png", cam=(2.2, 1.6, 4.4), look=(0.05, 0.3, 0), fov=40)
    if "certs" in which:
        render(scene_certs(), f"{out}/r_certs.png", cam=(0.4, 2.6, 2.9), look=(0, -0.1, 0), fov=40)
    if "logo" in which:
        render(scene_logo(sys.argv[1] + "/../assets/logo_white.png"), f"{out}/r_logo.png",
               cam=(0, 0, 4.2), look=(0, 0, 0), fov=34, size=1400)
