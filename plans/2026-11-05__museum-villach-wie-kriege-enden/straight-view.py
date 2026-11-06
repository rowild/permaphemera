# Straight (rectilinear) view from an equirectangular 360 photo.
# python3 -I straight-view.py <pano.jpg> <out.jpg> <yaw_deg> <pitch_deg> <hfov_deg> [width] [height]
import sys, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
src, out, yaw, pitch, hfov = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:6])
W = int(sys.argv[6]) if len(sys.argv) > 6 else 2000
H = int(sys.argv[7]) if len(sys.argv) > 7 else 1333
pano = np.asarray(Image.open(src).convert('RGB')); ph, pw = pano.shape[:2]
f = (W / 2) / np.tan(np.radians(hfov) / 2)
x, y = np.meshgrid(np.arange(W) - W / 2 + 0.5, np.arange(H) - H / 2 + 0.5)
d = np.stack([x, -y, np.full_like(x, f)], -1); d /= np.linalg.norm(d, axis=-1, keepdims=True)
p, t = np.radians(pitch), np.radians(yaw)
Rx = np.array([[1, 0, 0], [0, np.cos(p), np.sin(p)], [0, -np.sin(p), np.cos(p)]])
Ry = np.array([[np.cos(t), 0, np.sin(t)], [0, 1, 0], [-np.sin(t), 0, np.cos(t)]])
d = d @ (Ry @ Rx).T
lon = np.arctan2(d[..., 0], d[..., 2]); lat = np.arcsin(np.clip(d[..., 1], -1, 1))
u = (lon / (2 * np.pi) + 0.5) * pw; v = (0.5 - lat / np.pi) * ph
# bilinear sampling
u0 = np.floor(u).astype(int); v0 = np.clip(np.floor(v).astype(int), 0, ph - 2); fu = (u - u0)[..., None]; fv = (v - v0)[..., None]
u0 %= pw; u1 = (u0 + 1) % pw
img = (pano[v0, u0] * (1 - fu) * (1 - fv) + pano[v0, u1] * fu * (1 - fv) + pano[v0 + 1, u0] * (1 - fu) * fv + pano[v0 + 1, u1] * fu * fv)
Image.fromarray(img.astype(np.uint8)).save(out, quality=90)
