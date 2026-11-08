"""Copy Graphics Lead's t2103u art into art-intro/ and list it in intro-art-data.js + sw.js SHELL.
Usage: python3 tools/install-t2103u-art.py   (no-op if the delivery folder is missing). Local only, no network."""
import os,shutil,json,re,sys
SRC='/workspace/secret-adventures/game-export/t2103u-art';ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if not os.path.isdir(SRC):print('no delivery yet:',SRC);sys.exit(0)
ok=re.compile(r'^(menu/title-wall|sickdad/backdrop|sickdad/dad-(human|elf|dwarf|cat)|sickdad/hero-[a-z]+-[a-z]+|cave/backdrop|cave/title|cave/back-[a-z]+-[a-z]+|endings/(low|mid|high)-backdrop|journal/book-zone[1-5]|journal/page|journal/tab-[a-z-]+)\.webp$')
got=[]
for d,_,fs in os.walk(SRC):
  for f in fs:
    rel=os.path.relpath(os.path.join(d,f),SRC).replace(os.sep,'/')
    if ok.match(rel):
      dst=os.path.join(ROOT,'art-intro',rel);os.makedirs(os.path.dirname(dst),exist_ok=True);shutil.copy2(os.path.join(d,f),dst);got.append(rel)
# t2103u moods (dad + companions only; created-hero moods wait for t2118u starter kit)
MO=os.path.join(SRC,'moods');mok=re.compile(r'^(intro/l([1-9]|1[0-2])-dad-(human|elf|dwarf|cat)|(D2|D2-alt|D2-alt2|D3|C1|C2|C3a|C3b|F1|F2|F3)/l[1-4]-(mira|sorrel|brunn))\.webp$')
if os.path.isdir(MO):
  for d,_,fs in os.walk(MO):
    for f in fs:
      rel=os.path.relpath(os.path.join(d,f),MO).replace(os.sep,'/')
      if mok.match(rel):
        dst=os.path.join(ROOT,'art-intro','moods',rel);os.makedirs(os.path.dirname(dst),exist_ok=True);shutil.copyfile(os.path.join(d,f),dst);got.append('moods/'+rel)
got.sort()
open(os.path.join(ROOT,'intro-art-data.js'),'w').write('/* t2103u installed Graphics art (written by tools/install-t2103u-art.py). */\nwindow.INTRO_ART='+json.dumps(got)+';\n')
sw=open(os.path.join(ROOT,'sw.js')).read();add=['"art-intro/%s"'%g for g in got if '"art-intro/%s"'%g not in sw]
if add:
  sw=sw.replace('"manifest.json",',','.join(add)+',"manifest.json",',1);open(os.path.join(ROOT,'sw.js'),'w').write(sw)
print(len(got),'files installed;',len(add),'new sw entries (bump VER and intro-art-data.js ?v when shipping)')
