# Photo pipeline

Rebuilds `images/faces/` and `faces.js` from Wikidata and Wikimedia Commons.

```bash
python3 -I query.py   work/candidates.json                 # people born 1950-95, 1-3 sitelinks, with a P18 image
python3 -I meta.py    work/candidates.json work/licensed.json   # single citizenship, free licence, Commons metadata
uv run --python 3.12 --with 'opencv-python-headless<5' python faces.py work/licensed.json work/raw work/faces.json
uv run --with pillow python crop.py work/faces.json work/raw work/crops   # also writes contact sheets
python3 -I build.py   work/faces.json work/crops ..          # copies the hand-picked indexes in PICK
```

`PICK` in `build.py` holds the indexes chosen by eye from the contact sheets. Photos were
rejected if anything in frame gave the answer away: flags, team shirts, national-language text.
The indexes only match the contact sheets of the run they were picked from.
