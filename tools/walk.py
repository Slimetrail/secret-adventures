# Helpers to walk the maze by real commands (SOTA.act) for tests and screenshots.
import json
from collections import deque
MZ=json.load(open('/workspace/secret-adventures/handoff-stage1/maze/maze.json'))
OPEN={tuple(map(int,k.split(','))):set(map(tuple,v)) for k,v in MZ['open'].items()}
D=[(0,-1),(1,0),(0,1),(-1,0)]
def path(a,b):
  a,b=tuple(a),tuple(b);prev={a:None};q=deque([a])
  while q:
    c=q.popleft()
    if c==b:break
    for n in OPEN[c]:
      if n not in prev:prev[n]=c;q.append(n)
  out=[b]
  while prev[out[-1]] is not None:out.append(prev[out[-1]])
  return out[::-1]
def cmds(cells,f):
  """commands to walk a cell list starting facing f; returns (cmds, final f)"""
  out=[]
  for (x0,y0),(x1,y1) in zip(cells,cells[1:]):
    d=D.index((x1-x0,y1-y0))
    while f!=d:
      if (d-f)%4==1:out.append('right');f=(f+1)%4
      else:out.append('left');f=(f+3)%4
    out.append('fwd')
  return out,f
def zone1_tour():
  """start -> camp (0,45)?  use main route to tavern 1 with detours to nearest zone-1 camp and a monster room"""
  r=[tuple(c) for c in MZ['main_route'][:98]]
  camp=[tuple(c['cell']) for c in MZ['camps'] if c['section']==1]
  mon=[tuple(x['cell']) for x in MZ['rooms'] if x['section']==1 and x['kind']=='monster']
  return r,camp,mon
