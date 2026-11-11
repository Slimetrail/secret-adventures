#!/usr/bin/env python3
"""t2667u/t2668u: convert /workspace/dialogue-team/voice-zone4-banter.md (Z4B01-Z4B28) into batch14-talks.js TALKS.
Each ```js block is parsed as JSON exactly as written (no text changes); the PLACE tag line above it is kept as "place".
Usage: python3 tools/make-batch14-zone4.py [source.md]  (rewrites only the TALKS array in batch14-talks.js)"""
import json,re,sys,os,hashlib
SRC=sys.argv[1] if len(sys.argv)>1 else '/workspace/dialogue-team/voice-zone4-banter.md'
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..');OUT=os.path.join(ROOT,'batch14-talks.js')
md=open(SRC,encoding='utf-8').read()
secs=re.split(r'\n### ',md)[1:];talks=[]
for s in secs:
  pl=re.search(r'`(PLACE: [^`]+)`',s).group(1);blk=re.search(r'```js\n(.*?)\n```',s,re.S).group(1);t=json.loads(blk)
  talks.append({"id":t["id"],"context":t["context"],"speakers":t["speakers"],"gate":t["gate"],"place":pl,"lines":t["lines"]})
ids=[t['id'] for t in talks];assert ids==['Z4B%02d'%i for i in range(1,29)],ids
js=open(OUT,encoding='utf-8').read();a=js.index('const TALKS=');b=js.index('];',a)+2
body='const TALKS='+json.dumps(talks,ensure_ascii=False,indent=1)+';'
open(OUT,'w',encoding='utf-8').write(js[:a]+body+js[b:].lstrip(';'))
print(len(talks),'talks; source sha256',hashlib.sha256(md.encode()).hexdigest()[:8])
