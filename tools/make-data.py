# Builds maze-data.js from the handoff maze.json (keys are "x,y", x = column, y = row, y=64 is bottom).
import json,sys
src=sys.argv[1] if len(sys.argv)>1 else '/workspace/secret-adventures/handoff-stage1/maze/maze.json'
d=json.load(open(src));N=d['grid_cells']
mask=[];zone=[]
for y in range(N):
  for x in range(N):
    m=0
    for nx,ny in d['open'].get(f"{x},{y}",[]):
      if (nx,ny)==(x,y-1):m|=1
      elif (nx,ny)==(x+1,y):m|=2
      elif (nx,ny)==(x,y+1):m|=4
      elif (nx,ny)==(x-1,y):m|=8
      else: raise SystemExit("bad neighbour")
    mask.append('0123456789abcdef'[m]);zone.append(str(d['section_of_cell'][f"{x},{y}"]))
# symmetry check
for y in range(N):
  for x in range(N):
    m=int(mask[y*N+x],16)
    if m&2: assert int(mask[y*N+x+1],16)&8
    if m&4: assert int(mask[(y+1)*N+x],16)&1
out={"n":N,"entrance":d['entrance'],"centre":d['centre'],"mask":''.join(mask),"zone":''.join(zone),
 "taverns":[t['cell'] for t in d['taverns']],"camps":[c['cell'] for c in d['camps']],
 "rooms":[]}
# Stage 3: puzzle type per room. 0 mirror beams, 1 switches/levers, 2 riddles/codes, 3 moving blocks, 4 tile matching (sliding tiles).
# Treasure rooms keep the type named in maze.json; monster and story rooms get a fixed rotation per zone, (k + zone) % 5.
PT={'light/mirror/laser beams':0,'switches/levers/weighted plates/Simon-says timing':1,'logic riddle/code/grid':2,'moving blocks/flooding/perspective':3,'tile matching/sliding blocks':4}
cnt={}
for i,r in enumerate(d['rooms']):
  z=d['section_of_cell'][f"{r['cell'][0]},{r['cell'][1]}"]
  if r['kind']=='treasure':p=PT[r['puzzle_type']]
  else:k=cnt.get(z,0);cnt[z]=k+1;p=(k+z)%5
  out['rooms'].append({"id":i,"k":r['kind'],"c":r['cell'],"z":z,"p":p})
open('maze-data.js','w').write("/* Maze v3 data, made by tools/make-data.py from the handoff maze.json. mask: per cell open sides 1=N 2=E 4=S 8=W. */\nwindow.MAZE="+json.dumps(out,separators=(',',':'))+";\n")
print("ok",N,len(out['rooms']),len(out['camps']))
