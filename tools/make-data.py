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
 "rooms":[{"k":r['kind'],"c":r['cell']} for r in d['rooms']]}
open('maze-data.js','w').write("/* Maze v3 data, made by tools/make-data.py from the handoff maze.json. mask: per cell open sides 1=N 2=E 4=S 8=W. */\nwindow.MAZE="+json.dumps(out,separators=(',',':'))+";\n")
print("ok",N,len(out['rooms']),len(out['camps']))
