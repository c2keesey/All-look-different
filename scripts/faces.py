# usage: faces.py licensed.json rawdir out.json
import json, sys, os, time, urllib.request, urllib.error
import cv2
UA = "AllLookDifferentQuizBuilder/1.0 (https://github.com/c2keesey/all-look-different)"
data = json.load(open(sys.argv[1])); raw = sys.argv[2]
casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
out = {}
for nat, rows in data.items():
    good = []
    for r in rows:
        fn = os.path.join(raw, r["qid"] + ".jpg")
        if not os.path.exists(fn):
            try:
                req = urllib.request.Request(r["thumb"], headers={"User-Agent": UA})
                for a in range(5):
                    try: body = urllib.request.urlopen(req, timeout=30).read(); break
                    except urllib.error.HTTPError as e:
                        if e.code != 429: raise
                        time.sleep(10 * (a + 1))
                else: raise RuntimeError("429 persisted")
                open(fn, "wb").write(body); time.sleep(1.0)
            except Exception as e: print("dl fail", r["qid"], e, file=sys.stderr); continue
        img = cv2.imread(fn)
        if img is None: continue
        h, w = img.shape[:2]
        if min(h, w) < 300: continue
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        f = casc.detectMultiScale(g, 1.1, 6, minSize=(int(w*0.12), int(w*0.12)))
        if len(f) != 1: continue
        x, y, fw, fh = map(int, f[0])
        side = int(fw * 2.3)
        if side > min(w, h): continue  # need room for a head-and-shoulders square
        # colour check: skip greyscale photos
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        if hsv[..., 1].mean() < 25: continue
        r["face"] = [x, y, fw, fh]; r["src"] = [w, h]
        good.append(r)
    out[nat] = good
    print(nat, len(rows), "->", len(good), file=sys.stderr)
json.dump(out, open(sys.argv[3], "w"), indent=1)
