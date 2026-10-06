#!/usr/bin/env python3
# QA T2: gabungkan screenshot jadi lembar kontak berlabel. python3 qa/t2-montage.py <dir> [cols] [thumbW] [perSheet]
import sys, os, glob
from PIL import Image, ImageDraw
d = sys.argv[1]; cols = int(sys.argv[2]) if len(sys.argv) > 2 else 2; tw = int(sys.argv[3]) if len(sys.argv) > 3 else 640
per = int(sys.argv[4]) if len(sys.argv) > 4 else 8
order = ['beranda','apresiasi','tentang','filosofi','milestones','visi-misi','kepemimpinan','bisnis','angka','kemitraan','karir','berita','keterbukaan','kontak']
files = [f for f in glob.glob(os.path.join(d, '*.png')) if not os.path.basename(f).startswith('sheet')]
def key(f):
    b = os.path.basename(f); sid = b.rsplit('-', 1)[0]
    return (order.index(sid) if sid in order else 99, b)
files.sort(key=key)
for s in range(0, len(files), per):
    chunk = files[s:s+per]; ims = []
    for f in chunk:
        im = Image.open(f).convert('RGB'); h = int(im.height * tw / im.width); ims.append((os.path.basename(f), im.resize((tw, h), Image.LANCZOS)))
    rows = (len(ims) + cols - 1) // cols; rh = max(i.height for _, i in ims) + 22
    sheet = Image.new('RGB', (cols * (tw + 8), rows * rh), (255, 0, 255))
    dr = ImageDraw.Draw(sheet)
    for k, (n, im) in enumerate(ims):
        x = (k % cols) * (tw + 8); y = (k // cols) * rh
        sheet.paste(im, (x, y + 22)); dr.rectangle([x, y, x + tw, y + 21], fill=(0, 0, 0)); dr.text((x + 4, y + 4), n, fill=(255, 255, 0))
    out = os.path.join(d, f'sheet{s // per + 1:02d}.png'); sheet.save(out); print(out, sheet.size)
