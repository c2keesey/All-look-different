import json, sys, time, urllib.parse, urllib.request
UA = "AllLookDifferentQuizBuilder/1.0 (https://github.com/c2keesey/all-look-different)"
COUNTRY = {"british": "Q145", "german": "Q183", "french": "Q142"}
def get(url, params):
    req = urllib.request.Request(url + "?" + urllib.parse.urlencode(params), headers={"User-Agent": UA})
    for a in range(4):
        try: return json.load(urllib.request.urlopen(req, timeout=60))
        except Exception as e: print("retry", e, file=sys.stderr); time.sleep(5)
    raise SystemExit("failed")
cands = json.load(open(sys.argv[1]))
OK = ("cc0", "public domain", "pd", "cc by", "cc-by", "cc by-sa", "cc-by-sa")
out = {}
for nat, rows in cands.items():
    # dedupe by person
    seen = {}
    for r in rows: seen.setdefault(r["qid"], r)
    rows = list(seen.values())
    keep = []
    for i in range(0, len(rows), 50):
        batch = rows[i:i+50]
        ents = get("https://www.wikidata.org/w/api.php", {"action": "wbgetentities", "ids": "|".join(r["qid"] for r in batch), "props": "claims", "format": "json"})["entities"]
        for r in batch:
            cl = ents[r["qid"]]["claims"].get("P27", [])
            cits = {c["mainsnak"].get("datavalue", {}).get("value", {}).get("id") for c in cl}
            if cits == {COUNTRY[nat]}: keep.append(r)
    for i in range(0, len(keep), 40):
        batch = keep[i:i+40]
        titles = {"File:" + urllib.parse.unquote(r["img"].rsplit("/", 1)[1]): r for r in batch}
        res = get("https://commons.wikimedia.org/w/api.php", {"action": "query", "titles": "|".join(titles), "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": 640, "format": "json"})
        norm = {n["to"]: n["from"] for n in res["query"].get("normalized", [])}
        for p in res["query"]["pages"].values():
            if "imageinfo" not in p: continue
            r = titles.get(norm.get(p["title"], p["title"]))
            if not r: continue
            ii = p["imageinfo"][0]; md = ii.get("extmetadata", {})
            lic = md.get("LicenseShortName", {}).get("value", "")
            if not lic.lower().startswith(OK): continue
            r.update(file=p["title"], thumb=ii.get("thumburl"), page=ii["descriptionurl"], license=lic,
                     license_url=md.get("LicenseUrl", {}).get("value", ""), artist=md.get("Artist", {}).get("value", ""),
                     w=ii["width"], h=ii["height"])
            if r["thumb"] and r["file"].lower().endswith((".jpg", ".jpeg", ".png")): out.setdefault(nat, []).append(r)
    print(nat, len(rows), "->", len(keep), "->", len(out.get(nat, [])), file=sys.stderr)
json.dump(out, open(sys.argv[2], "w"), indent=1)
