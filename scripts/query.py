import json, sys, urllib.parse, urllib.request
UA = "AllLookDifferentQuizBuilder/1.0 (https://github.com/c2keesey/all-look-different)"
COUNTRIES = {"british": "Q145", "german": "Q183", "french": "Q142"}
def q(country):
    sparql = f"""
SELECT ?p ?pLabel ?img ?born ?links WHERE {{
  ?p wdt:P31 wd:Q5; wdt:P27 wd:{country}; wdt:P18 ?img; wdt:P569 ?born;
     wdt:P19 ?pob; wikibase:sitelinks ?links.
  ?pob wdt:P17 wd:{country}.
  FILTER(YEAR(?born) >= 1950 && YEAR(?born) <= 1995)
  FILTER(?links >= 1 && ?links <= 3)
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}} LIMIT 400"""
    url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": sparql, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return json.load(urllib.request.urlopen(req, timeout=120))["results"]["bindings"]
out = {}
import time
for nat, c in COUNTRIES.items():
    for attempt in range(4):
        try:
            rows = q(c); break
        except Exception as e:
            print(nat, "retry", e, file=sys.stderr); time.sleep(10)
    out[nat] = [{"qid": r["p"]["value"].rsplit("/",1)[1], "name": r["pLabel"]["value"],
                 "img": r["img"]["value"], "born": r["born"]["value"][:4], "links": int(r["links"]["value"])} for r in rows]
    print(nat, len(out[nat]), file=sys.stderr)
json.dump(out, open(sys.argv[1], "w"), indent=1)
