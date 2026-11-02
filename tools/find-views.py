# Finds good camera spots per zone in the maze data: a long straight corridor, a corner, a normal corridor.
import json
d=json.load(open('/workspace/secret-adventures/handoff-stage1/maze/maze.json'));N=65
O={tuple(map(int,k.split(','))):set(map(tuple,v)) for k,v in d['open'].items()};Z={tuple(map(int,k.split(','))):v for k,v in d['section_of_cell'].items()}
D=[(0,-1),(1,0),(0,1),(-1,0)]
def run(c,f):
  n=0
  while True:
    nx=(c[0]+D[f][0],c[1]+D[f][1])
    if nx not in O[c] or Z.get(nx)!=Z[c]:return n
    c=nx;n+=1
out={}
for z in range(1,6):
  cells=[c for c in O if Z[c]==z and abs(c[0]-32)+abs(c[1]-32)>3]
  best=max(((run(c,f),c,f) for c in cells for f in range(4)),key=lambda t:t[0])
  # corner: corridor of 2 then turn (cell 2 ahead has 2 exits, one sideways)
  corner=None;corr=None
  for c in sorted(cells):
    for f in range(4):
      r=run(c,f)
      if r==2:
        e=(c[0]+2*D[f][0],c[1]+2*D[f][1]);ex=[n for n in O[e] if n!=(e[0]-D[f][0],e[1]-D[f][1])]
        if len(ex)==1 and ex[0]!=(e[0]+D[f][0],e[1]+D[f][1]) and corner is None:corner=(c,f)
      if r==4 and corr is None and len(O[c])==2:corr=(c,f)
  out[z]={"long":[best[1],best[2],best[0]],"corner":list(corner),"corridor":list(corr)}
print(json.dumps(out))
