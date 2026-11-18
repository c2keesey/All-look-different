import json, sys, os
from PIL import Image, ImageDraw
data = json.load(open(sys.argv[1])); raw, outd = sys.argv[2], sys.argv[3]
os.makedirs(outd, exist_ok=True)
for nat, rows in data.items():
    tiles = []
    for i, r in enumerate(rows):
        x, y, fw, fh = r["face"]; w, h = r["src"]
        side = int(fw * 2.3)
        cx = x + fw / 2
        left = int(min(max(cx - side / 2, 0), w - side))
        top = int(min(max(y - fw * 0.6, 0), h - side))
        im = Image.open(os.path.join(raw, r["qid"] + ".jpg")).convert("RGB").crop((left, top, left + side, top + side)).resize((480, 480), Image.LANCZOS)
        im.save(os.path.join(outd, r["qid"] + ".jpg"), quality=82)
        tiles.append(im.resize((150, 150)))
    cols = 10; rowsn = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 150, rowsn * 150), "white"); d = ImageDraw.Draw(sheet)
    for i, t in enumerate(tiles):
        px, py = (i % cols) * 150, (i // cols) * 150
        sheet.paste(t, (px, py)); d.rectangle((px, py, px + 26, py + 14), fill="black"); d.text((px + 2, py + 1), str(i), fill="yellow")
    sheet.save(os.path.join(outd, f"_sheet_{nat}.jpg"), quality=85)
    print(nat, len(tiles))
