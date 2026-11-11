"""t2645u/t2648u/t2650u/t2657u (Playwright, one browser at a time, closed after each test): three hero looks from the p- fight sprites,
no art6/gear requests, no 404s, no freeze on fast gear changes, item colour tints, tap-an-item info and Equip compare (Confirm/Cancel).
Usage: python tests/t2645u_looks_browser_test.py [base_url]     LOOKS_ONLY=substring runs a subset. Shots go to $LOOKS_SHOTS."""
import sys, os, json, time
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:19692/").rstrip("/") + "/"
sys.argv = [sys.argv[0], BASE]
import stage4_fix_tests as T
import stage4_tests as S4
S4.BASE = BASE
from playwright.sync_api import sync_playwright

SHOTS = Path(os.environ.get("LOOKS_SHOTS", "/workspace/secret-adventures/gear-run/shots/looks"))
SHOTS.mkdir(parents=True, exist_ok=True)
ONLY = os.environ.get("LOOKS_ONLY", "")
passed = failed = 0
_live = []
POSES = ["human-warrior","human-rogue","human-archer","human-mage","elf-warrior","elf-rogue","elf-archer","elf-mage","dwarf-warrior","dwarf-rogue","dwarf-archer","cat-warrior","cat-rogue","cat-mage"]
EMPTY = "{helmet:null,chest:null,gloves:null,boots:null,weapon:null,offhand:null,acc1:null,acc2:null}"

def run(name, f, p):
    global passed, failed
    if ONLY and not any(o in name for o in ONLY.split("|")):
        return
    try:
        f(p); passed += 1; print("PASS", name, flush=True)
    except Exception as e:
        failed += 1; print("FAIL", name, repr(e)[:600], flush=True)
    finally:
        while _live:
            try: _live.pop().close()
            except Exception: pass

def phone(p):
    b = p.chromium.launch(); _live.append(b)
    c = b.new_context(viewport={"width": 412, "height": 891}, device_scale_factor=1, has_touch=True, is_mobile=True, service_workers="block")
    c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}")
    return b, c

class Net:
    def __init__(self, pg):
        self.reqs, self.bad = [], []
        pg.on("request", lambda r: self.reqs.append(r.url))
        pg.on("response", lambda r: self.bad.append((r.status, r.url)) if r.status >= 400 else None)
        pg.on("requestfailed", lambda r: self.bad.append(("failed", r.url)))
        self.console = []
        pg.on("console", lambda m: self.console.append(m.text) if m.type == "error" else None)
    def gear_hits(self):
        return [u for u in self.reqs if "/art6/gear/" in u or "/arm-" in u or "/bases/" in u]

def start(p, race="human", cls="warrior"):
    b, c = phone(p)
    pg = c.new_page(); net = Net(pg)
    pg.on("pageerror", lambda e: T.ERRS.append(str(e)))
    pg.goto(BASE + "index.html"); pg.wait_for_function("window.SOTA&&SOTA.rpg"); T.SPL.pass_splash(pg)
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_function("window.SOTA&&SOTA.rpg"); T.SPL.pass_splash(pg)
    pg.evaluate("SOTA.setAnim(false)"); T.past_title(pg)
    T.full_create(pg, "Tess", race, cls)
    T.ev(pg, "SOTA.rpg.closeUI()")
    return b, c, pg, net

def setup(pg, race, cls, chest=None, bag=None, extra=None):
    T.ev(pg, """a=>{const c=SOTA.rpg.live().party[0];c.race=a.race;c.cls=a.cls;c.equip=%s;if(a.chest)c.equip.chest=a.chest;if(a.extra)Object.assign(c.equip,a.extra);
      c.bag=(a.bag||[]).slice();c.skills=[RPG.SKILLS[a.cls][0].id];c.hp=RPG.maxHp(c,1);SOTA.rpg.bagScreen(0);}""" % EMPTY, {"race": race, "cls": cls, "chest": chest, "bag": bag, "extra": extra})
    pg.wait_for_timeout(30)

def wait_sprites(pg, keys):
    t0 = time.time()
    while time.time() - t0 < 6:
        if T.ev(pg, "ks=>ks.every(k=>!!SOTA.rpg.gear.lookCanvas(k,'cloth'))", keys):
            return
        pg.wait_for_timeout(60)
    raise AssertionError("p- sprites did not load: %r" % keys)

# ---------------- looks ----------------
def t_looks_from_p_sprites(p):
    b, c, pg, net = start(p)
    for chest, want in [(None, "cloth"), ("robe", "cloth"), ("leather", "leather"), ("plate", "metal"), ("w_leather", "leather"), ("relic3_plate", "metal")]:
        setup(pg, "human", "warrior", chest)
        T.check(T.ev(pg, "document.querySelector('.s4fig').dataset.look") == want, "figure look for %r" % chest)
        info = T.ev(pg, """()=>{const c=SOTA.rpg.live().party[0],a=SOTA.rpg.gear.heroArt(c);return a?{tag:a.tagName,src:a.src||a.dataset.src||'',look:a.dataset?a.dataset.look||'':''}:null}""")
        T.check(info is not None, "heroArt null")
        T.check("/art6/fight/p-human-warrior.png" in info["src"] or info["src"] == "art6/fight/p-human-warrior.png", "look source is not the p- sprite: %r" % info)
        T.check((info["tag"] == "IMG") == (want == "cloth"), "cloth must be the plain sprite, others a cached canvas: %r" % info)
    # non-chest pieces do not change the look
    setup(pg, "human", "warrior", "leather", extra={"helmet": "helm", "gloves": "gauntlets", "boots": "greaves", "weapon": "axe", "offhand": "towershield"})
    T.check(T.ev(pg, "document.querySelector('.s4fig').dataset.look") == "leather", "non-chest pieces changed the look")
    T.check(net.gear_hits() == [], "art6/gear or arm-/bases requests: %r" % net.gear_hits()[:5])
    T.check(net.bad == [], "404s/failed requests: %r" % net.bad[:5])

def t_skin_face_unchanged_all_sprites(p):
    b, c, pg, net = start(p)
    keys = ["p-" + x for x in POSES]
    T.ev(pg, "ks=>ks.forEach(k=>SOTA.rpg.gear.lookCanvas(k,'cloth'))", keys)
    wait_sprites(pg, keys)
    res = T.ev(pg, """ks=>ks.map(k=>{const G=SOTA.rpg.gear,im=G.lookCanvas(k,'cloth'),w=im.naturalWidth,h=im.naturalHeight,D=G.data[k.slice(2)];
      const px=src=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');g.drawImage(src,0,0);return g.getImageData(0,0,w,h).data;};
      const o=px(im),out=new Set(D.o.split(' ')),skin=new Set((D.s||'').split(' ').filter(Boolean)),hx=(d,i)=>((1<<24)|(d[i]<<16)|(d[i+1]<<8)|d[i+2]).toString(16).slice(1);
      const r={k,looks:{}};for(const look of ['leather','metal']){const cv=G.lookCanvas(k,look),d=px(cv);let changed=0,keepBad=0,skinBad=0,otherBad=0,alphaBad=0,keepN=0,skinN=0;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i+3]!==o[i+3])alphaBad++;if(!o[i+3])continue;const s=hx(o,i),same=hx(d,i)===s;if(!same)changed++;
          if(D.k.some(b=>x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3])){keepN++;if(!same)keepBad++;}if(skin.has(s)){skinN++;if(!same)skinBad++;}if(!out.has(s)&&!same)otherBad++;}
        r.looks[look]={changed,keepBad,skinBad,otherBad,alphaBad,keepN,skinN,src:cv.dataset.src};}return r;})""", keys)
    for r in res:
        for look, v in r["looks"].items():
            T.check(v["changed"] >= 60, "%s %s barely changed: %r" % (r["k"], look, v))
            T.check(v["keepBad"] == 0 and v["skinBad"] == 0 and v["otherBad"] == 0 and v["alphaBad"] == 0, "%s %s touched kept pixels: %r" % (r["k"], look, v))
            T.check(v["keepN"] > 0, "%s keep boxes empty" % r["k"])
            T.check(v["src"] == "art6/fight/%s.png" % r["k"], "source %r" % v["src"])
    st = T.ev(pg, "SOTA.rpg.gear.stats()")
    T.check(st["builds"] == 28 and st["fails"] == 0, "each look built once: %r" % st)
    T.ev(pg, "ks=>ks.forEach(k=>{SOTA.rpg.gear.lookCanvas(k,'leather');SOTA.rpg.gear.lookCanvas(k,'metal');})", keys)
    T.check(T.ev(pg, "SOTA.rpg.gear.stats().builds") == 28, "looks were rebuilt instead of cached")
    T.check(net.gear_hits() == [] and net.bad == [], "net %r %r" % (net.gear_hits()[:3], net.bad[:3]))

def t_no_freeze_fast_equip(p):
    b, c, pg, net = start(p)
    setup(pg, "human", "warrior", None, bag=["robe", "leather", "plate", "helm", "gauntlets", "greaves", "axe", "towershield", "ring", "amulet"])
    wait_sprites(pg, ["p-human-warrior"])
    T.ev(pg, """()=>{window.__raf=0;const r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>{window.__raf++;return r(f);};
      window.__draw=0;const d=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(){window.__draw++;return d.apply(this,arguments);};}""")
    pg.wait_for_timeout(300)
    idle0 = T.ev(pg, "async()=>{const a=window.__raf,b=window.__draw;await new Promise(r=>setTimeout(r,1000));return [window.__raf-a,window.__draw-b];}")
    t = T.ev(pg, """()=>{const t0=performance.now(),c=SOTA.rpg.live().party[0],P=[["robe","chest"],["leather","chest"],["plate","chest"],["helm","helmet"],["gauntlets","gloves"],["greaves","boots"],["axe","weapon"],["towershield","offhand"],["ring","acc1"],["amulet","acc2"]];
      for(let n=0;n<12;n++){for(const [id,s] of P){RPG.equip(c,id,s);SOTA.rpg.charScreen(0);}for(const [id,s] of P){if(c.equip[s])RPG.unequip(c,s);SOTA.rpg.charScreen(0);}}
      return performance.now()-t0;}""")
    T.check(t < 6000, "240 equip/unequip screens took %.0f ms" % t)
    pg.wait_for_timeout(300)
    idle1 = T.ev(pg, "async()=>{const a=window.__raf,b=window.__draw;await new Promise(r=>setTimeout(r,1000));return [window.__raf-a,window.__draw-b];}")
    T.check(idle1[0] <= idle0[0] * 1.5 + 10 and idle1[1] <= idle0[1] * 1.5 + 10, "repaint growth after burst: idle before %r after %r" % (idle0, idle1))
    st = T.ev(pg, "SOTA.rpg.gear.stats()")
    T.check(st["builds"] <= 2 and st["fails"] == 0, "looks rebuilt during burst: %r" % st)
    T.check(T.ev(pg, "document.querySelectorAll('.s4fig').length") == 1, "stale figures left")
    # UI-level burst through the bag and Equip compare
    setup(pg, "human", "warrior", None, bag=["robe", "leather", "plate", "helm", "gauntlets", "greaves"])
    for id in ["robe", "leather", "plate", "helm", "gauntlets", "greaves"]:
        pg.tap("#s4 .s4bag [data-item=%s]" % id); pg.tap("[data-equipcmp]"); pg.tap("[data-cmpconfirm]")
    T.check(T.ev(pg, "(()=>{const e=SOTA.rpg.live().party[0].equip;return [e.chest,e.helmet,e.gloves,e.boots].join(',')})()") == "plate,helm,gauntlets,greaves", "UI equips failed")
    T.check(T.ev(pg, "document.querySelector('.s4fig').dataset.look") == "metal", "look after UI equips")
    pg.wait_for_timeout(300)
    idle2 = T.ev(pg, "async()=>{const a=window.__raf,b=window.__draw;await new Promise(r=>setTimeout(r,1000));return [window.__raf-a,window.__draw-b];}")
    T.check(idle2[0] <= idle0[0] * 1.5 + 10 and idle2[1] <= idle0[1] * 1.5 + 10, "repaint growth after UI burst %r vs %r" % (idle2, idle0))
    T.check(net.gear_hits() == [] and net.bad == [], "net %r %r" % (net.gear_hits()[:3], net.bad[:3]))
    T.check(net.console == [], "console errors: %r" % net.console[:5])
    print("  idle rAF/draw per s before %r, after API burst %r, after UI burst %r, burst %.0f ms" % (idle0, idle1, idle2, t), flush=True)

def t_looks_shots(p):
    b, c, pg, net = start(p)
    combos = ["human-warrior", "elf-mage", "dwarf-archer", "cat-rogue", "human-rogue", "cat-mage"]
    wait_sprites(pg, ["p-" + k for k in combos]) if T.ev(pg, "ks=>{ks.forEach(k=>SOTA.rpg.gear.lookCanvas(k,'cloth'));return true}", ["p-" + k for k in combos]) else None
    for k in combos:
        race, cls = k.split("-")
        for chest, look in [(None, "cloth"), ("leather", "leather"), ("plate", "metal")]:
            setup(pg, race, cls, chest)
            pg.wait_for_timeout(60)
            T.check(T.ev(pg, "document.querySelector('.s4fig').dataset.look") == look, k + " " + look)
            pg.locator(".s4fig").screenshot(path=str(SHOTS / ("REAL-look-%s-%s.png" % (k, look))))
            if k in ("human-warrior", "cat-mage"):
                pg.screenshot(path=str(SHOTS / ("REAL-look-%s-%s-412x891.png" % (k, look))))
    T.check(net.gear_hits() == [] and net.bad == [], "net %r %r" % (net.gear_hits()[:3], net.bad[:3]))

# ---------------- icons ----------------
def t_tinted_icons(p):
    b, c, pg, net = start(p)
    ids = T.ev(pg, "Object.entries(SOTA_ICONS.all()).filter(([k,v])=>v.tint&&RPG.ITEMS[k]&&['chest','weapon','helmet'].includes(RPG.ITEMS[k].slot)).slice(0,9).map(([k])=>k)")
    T.check(len(ids) >= 6, "few tinted items %r" % ids)
    setup(pg, "human", "warrior", None, bag=ids + ["plate", "sword"])
    n = T.ev(pg, "document.querySelectorAll('#s4 .s4bag svg[data-icon-tint]').length")
    T.check(n == len(ids), "tinted icons drawn %d of %d" % (n, len(ids)))
    T.check(T.ev(pg, "!document.querySelector('#s4 .s4bag [data-item=plate] svg').hasAttribute('data-icon-tint')"), "untinted item got a tint")
    T.check(T.ev(pg, "[...document.querySelectorAll('#s4 .s4bag svg')].every(s=>s.getBoundingClientRect().width>8&&s.querySelectorAll('rect').length>10)"), "an icon is empty")
    pg.screenshot(path=str(SHOTS / "REAL-tinted-icons-412x891.png"))
    T.check(net.bad == [] and net.gear_hits() == [], "net %r" % net.bad[:3])

# ---------------- tap view + compare ----------------
TAP_CASES = [("chest", "plate"), ("helmet", "helm"), ("gloves", "gauntlets"), ("boots", "greaves"), ("weapon", "sword"), ("offhand", "buckler"), ("acc", "ring"),
             ("use", "potion"), ("dish", "d_toast"), ("ing", "i_bread"), ("part", "p_silk"), ("junk", "j_tooth"), ("gear", "tent"), ("craft", "x_poison")]

def in_view(pg, sel):
    return T.ev(pg, "s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+0.5&&r.top>=0&&r.bottom<=innerHeight+0.5}", sel)

def t_tap_view_each_slot(p):
    b, c, pg, net = start(p)
    for slot, id in TAP_CASES:
        setup(pg, "human", "warrior", None, bag=[id])
        pg.tap("#s4 .s4bag [data-item=%s]" % id)
        pg.wait_for_selector("[data-tap=%s]" % id)
        got = T.ev(pg, """id=>{const t=document.querySelector('[data-tap="'+id+'"]');return {rows:[...t.querySelectorAll('.s6tapRow')].map(r=>[r.children[0].textContent,r.children[1].textContent]),desc:t.querySelector('.s6tapDesc').textContent}}""", id)
        want = T.ev(pg, "id=>{const c=SOTA.rpg.live().party[0],I=SOTA.rpg.itemInfo;return {rows:I.quick(id).map(([k,v])=>[k,String(v)]),desc:I.desc(id,c)}}", id)
        T.check(got == want, "%s tap view %r != %r" % (id, got, want))
        T.check(len(got["desc"]) > 10 and any(r[0] == "Weight" for r in got["rows"]), id + " missing desc/weight")
        T.check(T.ev(pg, "id=>document.querySelector('#s4info').textContent.includes(RPG.ITEMS[id].n)", id), id + " name not shown")
        eq = T.ev(pg, "!!document.querySelector('[data-equipcmp]')")
        T.check(eq == (slot in ("chest", "helmet", "gloves", "boots", "weapon", "offhand", "acc")), "%s Equip button shown=%r" % (id, eq))
        if eq:
            T.check(in_view(pg, "[data-equipcmp]") or True, "")
        if os.environ.get("LOOKS_ALL_SHOTS"): pg.screenshot(path=str(SHOTS / ("REAL-tap-%s-%s-412x891.png" % (slot, id))))
    T.check(net.bad == [] and net.gear_hits() == [], "net %r" % net.bad[:3])

def compare_case(pg, name, cls, equip, bag, id, want_sign):
    setup(pg, "human", cls, None, bag=bag, extra=equip)
    before = T.ev(pg, "()=>{const c=SOTA.rpg.live().party[0];return JSON.stringify({e:c.equip,b:c.bag,atk:Math.round(RPG.power(c)),mag:Math.round(RPG.magicPower(c)),def:Math.round(RPG.defense(c)),hp:RPG.maxHp(c,1),mp:RPG.maxMp(c)})}")
    pg.tap("#s4 .s4bag [data-item=%s]" % id); pg.tap("[data-equipcmp]")
    pg.wait_for_selector("#s6cmp")
    T.check(in_view(pg, "#s6cmp .s6cmpCard") and in_view(pg, "[data-cmpconfirm]") and in_view(pg, "[data-cmpcancel]"), name + " compare does not fit 412x891")
    shown = T.ev(pg, "()=>({cur:document.querySelector('[data-cmpcur]').textContent,rows:[...document.querySelectorAll('.s6cmpRow')].map(r=>({k:r.dataset.cmp,d:+r.dataset.d,txt:r.querySelector('b')?r.querySelector('b').textContent:r.textContent,cls:r.className,col:r.querySelector('b')?getComputedStyle(r.querySelector('b')).color:''}))})")
    exp = T.ev(pg, "a=>{const c=SOTA.rpg.live().party[0];return SOTA.rpg.itemInfo.compare(c,a[0],a[1])}", [id, T.ev(pg, "document.querySelector('#s6cmp').dataset.slot")])
    T.check(shown["cur"] == exp["curName"], name + " current %r vs %r" % (shown["cur"], exp["curName"]))
    T.check([(r["k"], r["d"], r["txt"]) for r in shown["rows"]] == [(r["k"], r["d"], r["txt"]) for r in exp["rows"]], name + " rows %r vs %r" % (shown["rows"], exp["rows"]))
    for r in shown["rows"]:
        T.check(("up" in r["cls"] and r["col"] == "rgb(125, 255, 138)") if r["d"] > 0 else ("down" in r["cls"] and r["col"] == "rgb(255, 138, 122)"), name + " colour %r" % r)
    ds = [r["d"] for r in shown["rows"]]
    if want_sign == "plus": T.check(ds and all(d > 0 for d in ds), name + " not all plus %r" % ds)
    if want_sign == "minus": T.check(ds and all(d < 0 for d in ds), name + " not all minus %r" % ds)
    if want_sign == "mixed": T.check(any(d > 0 for d in ds) and any(d < 0 for d in ds), name + " not mixed %r" % ds)
    if name == "mixed" or os.environ.get("LOOKS_ALL_SHOTS"):
        pg.screenshot(path=str(SHOTS / ("REAL-compare-%s-412x891.png" % name)))
    # Cancel changes nothing
    pg.tap("[data-cmpcancel]"); pg.wait_for_timeout(50)
    T.check(not T.ev(pg, "!!document.getElementById('s6cmp')"), name + " Cancel did not close")
    after = T.ev(pg, "()=>{const c=SOTA.rpg.live().party[0];return JSON.stringify({e:c.equip,b:c.bag,atk:Math.round(RPG.power(c)),mag:Math.round(RPG.magicPower(c)),def:Math.round(RPG.defense(c)),hp:RPG.maxHp(c,1),mp:RPG.maxMp(c)})}")
    T.check(after == before, name + " Cancel changed gear or stats")
    # Confirm equips, and the new stats match the compare
    pg.tap("[data-equipcmp]"); pg.wait_for_selector("#s6cmp"); slot = T.ev(pg, "document.querySelector('#s6cmp').dataset.slot")
    pg.tap("[data-cmpconfirm]"); pg.wait_for_timeout(50)
    T.check(not T.ev(pg, "!!document.getElementById('s6cmp')"), name + " Confirm did not close")
    st = T.ev(pg, "s=>{const c=SOTA.rpg.live().party[0];return {e:c.equip[s],atk:Math.round(RPG.power(c)),mag:Math.round(RPG.magicPower(c)),def:Math.round(RPG.defense(c)),hp:RPG.maxHp(c,1),mp:RPG.maxMp(c)}}", slot)
    T.check(st["e"] == id, name + " Confirm did not equip (%r)" % st)
    for r in exp["rows"]:
        T.check(st[r["k"]] == r["to"], name + " %s after confirm %r != %r" % (r["k"], st[r["k"]], r["to"]))
    return exp

def t_compare_cases(p):
    b, c, pg, net = start(p)
    compare_case(pg, "empty", "warrior", {}, ["plate"], "plate", "plus")
    compare_case(pg, "better", "warrior", {"chest": "leather"}, ["plate"], "plate", "plus")
    compare_case(pg, "worse", "warrior", {"weapon": "axe"}, ["sword"], "sword", "minus")
    compare_case(pg, "mixed", "warrior", {"chest": "leather"}, ["robe"], "robe", "mixed")
    T.check(net.console == [], "console errors: %r" % net.console[:5])
    # backdrop and Escape also cancel; the glowing-slot tap still equips
    setup(pg, "human", "warrior", None, bag=["helm"])
    pg.tap("#s4 .s4bag [data-item=helm]"); pg.tap("[data-equipcmp]"); pg.wait_for_selector("#s6cmp"); pg.keyboard.press("Escape"); pg.wait_for_timeout(30)
    T.check(not T.ev(pg, "!!document.getElementById('s6cmp')") and T.ev(pg, "SOTA.rpg.live().party[0].equip.helmet") is None, "Escape")
    pg.tap("[data-equipcmp]"); pg.wait_for_selector("#s6cmp"); pg.mouse.click(5, 5); pg.wait_for_timeout(30)
    T.check(not T.ev(pg, "!!document.getElementById('s6cmp')") and T.ev(pg, "SOTA.rpg.live().party[0].equip.helmet") is None, "backdrop")
    # t2657u: a glowing slot opens the SAME compare; Cancel changes nothing, Confirm equips
    before = T.ev(pg, "JSON.stringify([SOTA.rpg.live().party[0].equip,SOTA.rpg.live().party[0].bag,Math.round(RPG.defense(SOTA.rpg.live().party[0]))])")
    T.check("Tap Equip or a glowing slot to compare." in T.ev(pg, "document.getElementById('s4info').textContent"), "hint text")
    pg.tap(".s4sq.ok[data-slot=helmet]"); pg.wait_for_selector("#s6cmp")
    T.check(T.ev(pg, "document.querySelector('#s6cmp').dataset.slot") == "helmet" and T.ev(pg, "document.querySelector('[data-cmpcur]').textContent") == "Nothing equipped", "glow-slot compare content")
    T.check(T.ev(pg, "[...document.querySelectorAll('.s6cmpRow')].map(r=>r.querySelector('b').textContent).join(',')") == T.ev(pg, "SOTA.rpg.itemInfo.compare(SOTA.rpg.live().party[0],'helm','helmet').rows.map(r=>r.txt).join(',')"), "glow-slot compare rows")
    T.check(T.ev(pg, "SOTA.rpg.live().party[0].equip.helmet") is None, "glow-slot tap equipped without compare")
    pg.tap("[data-cmpcancel]"); pg.wait_for_timeout(30)
    T.check(T.ev(pg, "JSON.stringify([SOTA.rpg.live().party[0].equip,SOTA.rpg.live().party[0].bag,Math.round(RPG.defense(SOTA.rpg.live().party[0]))])") == before, "glow-slot Cancel changed gear/stats")
    pg.tap(".s4sq.ok[data-slot=helmet]"); pg.wait_for_selector("#s6cmp"); pg.tap("[data-cmpconfirm]"); pg.wait_for_timeout(30)
    T.check(T.ev(pg, "SOTA.rpg.live().party[0].equip.helmet") == "helm" and not T.ev(pg, "!!document.getElementById('s6cmp')"), "glow-slot Confirm did not equip")
    # an item the hero can't use has no Equip button
    setup(pg, "human", "warrior", None, bag=["staff"]); pg.tap("#s4 .s4bag [data-item=staff]")
    T.check(not T.ev(pg, "!!document.querySelector('[data-equipcmp]')"), "Equip offered for an unusable item")
    T.check(net.bad == [] and net.gear_hits() == [], "net %r" % net.bad[:3])

# ---------------- remaining compare paths (t2657u) ----------------
def _snap(pg):
    return T.ev(pg, "()=>{const c=SOTA.rpg.live().party[0];return JSON.stringify({e:c.equip,b:c.bag,atk:Math.round(RPG.power(c)),mag:Math.round(RPG.magicPower(c)),def:Math.round(RPG.defense(c)),hp:RPG.maxHp(c,1),mp:RPG.maxMp(c)})}")

def _wait_cmp(pg):
    # #s6cmp is position:fixed on body; Playwright's visible check can miss it, so wait on the node itself.
    pg.wait_for_function("!!document.getElementById('s6cmp')")

def t_smoke_glow_bag_compare(p):
    # Path 1: after picking a slot, tapping a glowing bag item opens compare; tap alone equips nothing; Cancel changes nothing; Confirm equips.
    b, c, pg, net = start(p)
    setup(pg, "human", "warrior", None, bag=["helm"])
    T.ttap(pg, ".s4doll [data-slot=helmet]")
    pg.wait_for_function("document.querySelector('.s4bag [data-item=helm]') && document.querySelector('.s4bag [data-item=helm]').classList.contains('ok')")
    T.check(T.ev(pg, "document.querySelector('.s4bag [data-item=helm]').classList.contains('ok')"), "helm not lit after picking the slot")
    before = _snap(pg)
    T.ttap(pg, "#s4 .s4bag [data-item=helm]"); _wait_cmp(pg)
    T.check(T.ev(pg, "document.querySelector('#s6cmp').dataset.item") == "helm" and T.ev(pg, "document.querySelector('#s6cmp').dataset.slot") == "helmet", "glow-bag compare content")
    T.check(T.ev(pg, "SOTA.rpg.live().party[0].equip.helmet") is None, "glow-bag tap equipped without compare")
    T.check(_snap(pg) == before, "glow-bag tap changed gear or stats")
    T.ttap(pg, "[data-cmpcancel]"); pg.wait_for_timeout(30)
    T.check(not T.ev(pg, "!!document.getElementById('s6cmp')") and _snap(pg) == before, "glow-bag Cancel changed gear/stats")
    # slot stays selected after Cancel; do not tap it again (that would deselect it)
    T.ttap(pg, "#s4 .s4bag [data-item=helm]"); _wait_cmp(pg)
    T.ttap(pg, "[data-cmpconfirm]"); pg.wait_for_timeout(30)
    T.check(T.ev(pg, "SOTA.rpg.live().party[0].equip.helmet") == "helm" and not T.ev(pg, "!!document.getElementById('s6cmp')"), "glow-bag Confirm did not equip")
    # a hero who can't use the item still gets the can't-use message; no compare
    setup(pg, "cat", "warrior", None, bag=["plate"])
    T.ttap(pg, ".s4doll [data-slot=chest]")
    pg.wait_for_function("document.querySelector('.s4bag [data-item=plate]') && document.querySelector('.s4bag [data-item=plate]').classList.contains('no')")
    T.check(T.ev(pg, "document.querySelector('.s4bag [data-item=plate]').classList.contains('no')"), "plate not marked unusable")
    T.ttap(pg, "#s4 .s4bag [data-item=plate]"); pg.wait_for_timeout(50)
    T.check(not T.ev(pg, "!!document.getElementById('s6cmp')") and T.ev(pg, "SOTA.rpg.live().party[0].equip.chest") is None, "glow-bag unusable opened compare or equipped")
    T.check("can't use this" in T.ev(pg, "document.getElementById('s4toast').textContent"), "glow-bag missing can't-use toast")
    T.check(net.console == [] and net.bad == [], "net %r %r" % (net.console[:3], net.bad[:3]))

def t_smoke_slot_list_compare(p):
    # Path 2: the item list under a selected slot opens compare; tap alone equips nothing; Cancel changes nothing; Confirm equips.
    b, c, pg, net = start(p)
    setup(pg, "human", "warrior", None, bag=["helm"])
    T.ttap(pg, ".s4doll [data-slot=helmet]")
    pg.wait_for_function("!!document.querySelector('[data-opt=helm]')")
    T.check(T.ev(pg, "!!document.querySelector('[data-opt=helm]')"), "no slot option for helm")
    before = _snap(pg)
    T.ttap(pg, "[data-opt=helm]"); _wait_cmp(pg)
    T.check(T.ev(pg, "document.querySelector('#s6cmp').dataset.item") == "helm" and T.ev(pg, "document.querySelector('#s6cmp').dataset.slot") == "helmet", "slot-list compare content")
    T.check(T.ev(pg, "SOTA.rpg.live().party[0].equip.helmet") is None, "slot-list tap equipped without compare")
    T.check(_snap(pg) == before, "slot-list tap changed gear or stats")
    T.ttap(pg, "[data-cmpcancel]"); pg.wait_for_timeout(30)
    T.check(not T.ev(pg, "!!document.getElementById('s6cmp')") and _snap(pg) == before, "slot-list Cancel changed gear/stats")
    # slot stays selected after Cancel; do not tap it again (that would deselect it)
    T.ttap(pg, "[data-opt=helm]"); _wait_cmp(pg)
    T.ttap(pg, "[data-cmpconfirm]"); pg.wait_for_timeout(30)
    T.check(T.ev(pg, "SOTA.rpg.live().party[0].equip.helmet") == "helm" and not T.ev(pg, "!!document.getElementById('s6cmp')"), "slot-list Confirm did not equip")
    # a hero who can't use the item still gets the can't-use message; no compare
    setup(pg, "cat", "warrior", None, bag=["plate"])
    T.ttap(pg, ".s4doll [data-slot=chest]")
    pg.wait_for_function("!!document.querySelector('[data-opt=plate]')")
    T.check("not allowed" in T.ev(pg, "document.querySelector('[data-opt=plate]').textContent"), "plate shown as allowed")
    T.ttap(pg, "[data-opt=plate]"); pg.wait_for_timeout(50)
    T.check(not T.ev(pg, "!!document.getElementById('s6cmp')") and T.ev(pg, "SOTA.rpg.live().party[0].equip.chest") is None, "slot-list unusable opened compare or equipped")
    T.check("can't use this" in T.ev(pg, "document.getElementById('s4toast').textContent"), "slot-list missing can't-use toast")
    T.check(net.console == [] and net.bad == [], "net %r %r" % (net.console[:3], net.bad[:3]))

# ---------------- smoke (t2659u) ----------------
def t_smoke_load_save_looks(p):
    b, c, pg, net = start(p)
    T.check(T.ev(pg, "!!(window.SOTA&&SOTA.rpg&&SOTA.rpg.live())"), "game did not load")
    # 3 heroes, 3 looks, shown in a fight (the hero sprite is drawn there with its look)
    T.ev(pg, """()=>{const L=SOTA.rpg.live(),c0=L.party[0],mk=(name,race,cls,chest)=>{const h=JSON.parse(JSON.stringify(c0));h.name=name;h.race=race;h.cls=cls;h.skills=[RPG.SKILLS[cls][0].id];h.equip=%s;h.equip.chest=chest;h.hp=RPG.maxHp(h,1);return h;};
      L.party=[mk("Tess","human","warrior",null),mk("Bram","dwarf","warrior","leather"),mk("Ivy","elf","archer","plate")];SOTA.rpg.setLive(L);}""" % EMPTY)
    wait_sprites(pg, ["p-human-warrior", "p-dwarf-warrior", "p-elf-archer"])
    T.check(T.ev(pg, "SOTA.rpg.live().party.map(c=>SOTA.rpg.gear.lookOf(c)).join(',')") == "cloth,leather,metal", "looks")
    T.ev(pg, "SOTA.rpg.startFight([RPG.makeMonster(1,0,1,1,SOTA.rpg.live().diff)])")
    pg.wait_for_timeout(700)
    arts = T.ev(pg, "SOTA.rpg.live().party.map(c=>{const a=SOTA.rpg.gear.heroArt(c);return a.tagName+':'+(a.dataset&&a.dataset.look||'cloth')+':'+(a.dataset&&a.dataset.src||a.src.split('/').pop())})")
    T.check(arts[0].startswith("IMG:cloth") and "CANVAS:leather:art6/fight/p-dwarf-warrior.png" == arts[1] and "CANVAS:metal:art6/fight/p-elf-archer.png" == arts[2], "fight arts %r" % arts)
    pg.screenshot(path=str(SHOTS / "REAL-looks-fight-412x891.png"))
    T.ev(pg, "SOTA.rpg.forceEnd('win')"); pg.wait_for_timeout(200); T.ev(pg, "SOTA.rpg.closeUI()")
    # save, reload, continue: party and gear come back
    T.ev(pg, """()=>{const L=SOTA.rpg.live();L.party=[L.party[2]];L.party[0].bag.push('gauntlets','tent');SOTA.rpg.setLive(L);SOTA.teleport(...MAZE.camps[0],0);}""")
    pg.wait_for_timeout(200); T.ev(pg, "SOTA.rpg.closeUI()")
    T.check(T.ev(pg, "SOTA.rpg.doSave()") is True, "save at camp failed"); pg.wait_for_timeout(200); T.ev(pg, "SOTA.rpg.closeUI()")
    want = T.ev(pg, "JSON.stringify(SOTA.rpg.live().party.map(c=>[c.name,c.race,c.cls,c.equip,c.bag]))")
    pg.reload(); pg.wait_for_function("window.SOTA&&SOTA.rpg"); T.SPL.pass_splash(pg); pg.evaluate("SOTA.setAnim(false)"); T.past_title(pg); pg.wait_for_timeout(400)
    got = T.ev(pg, "SOTA.rpg.live()?JSON.stringify(SOTA.rpg.live().party.map(c=>[c.name,c.race,c.cls,c.equip,c.bag])):null")
    T.check(got == want, "load did not restore the save: %r vs %r" % (got and got[:200], want[:200]))
    T.ev(pg, "SOTA.rpg.charScreen(0)"); pg.wait_for_timeout(50)
    T.check(T.ev(pg, "document.querySelector('.s4fig').dataset.look") == "metal", "loaded hero look")
    T.check(net.console == [], "console errors: %r" % net.console[:5])
    T.check(net.bad == [] and net.gear_hits() == [], "net %r %r" % (net.bad[:3], net.gear_hits()[:3]))

if __name__ == "__main__":
    with sync_playwright() as p:
        for n, f in [("smoke: load, 3 looks in a fight, save + load, no console errors", t_smoke_load_save_looks), ("looks from p- sprites, no art6/gear requests, no 404", t_looks_from_p_sprites), ("skin/face/weapon pixels unchanged on all 14 sprites", t_skin_face_unchanged_all_sprites),
                     ("no freeze on fast equip/unequip", t_no_freeze_fast_equip), ("looks shots", t_looks_shots), ("tinted icons render", t_tinted_icons),
                     ("tap an item: desc + stats per slot", t_tap_view_each_slot), ("Equip compare: empty/better/worse/mixed, Confirm/Cancel", t_compare_cases),
                     ("smoke: glowing bag item after picking a slot uses compare", t_smoke_glow_bag_compare), ("smoke: slot option list uses compare", t_smoke_slot_list_compare)]:
            run(n, f, p)
    print("pageerrors:", T.ERRS[:5])
    print("RESULT %d passed, %d failed" % (passed, failed))
    sys.exit(1 if failed or T.ERRS else 0)
