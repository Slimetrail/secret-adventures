"use strict";
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plain=o=>JSON.parse(JSON.stringify(o));
// Reuse the flow harness and the real party engine, adding only inert canvas/image DOM stubs.
const flow=read('tests/tavern_shop_camp_flow_test.js');
const baseHarness=eval('('+flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'))+')');
function harness(){const h=baseHarness(),create=h.document.createElement;
 h.document.createElement=t=>{const e=create(t);if(t==='canvas')e.getContext=()=>({});return e;};
 h.c.Image=class{constructor(){this.complete=false;}};
 return h;}
const pools=h=>plain(h.r.live().party.map(c=>[c.hp,c.mp]));
function party(h){const p=h.r.live().party;p.push(plain(p[0]));p[1].name='Companion';return p;}
function full(h){for(const c of h.r.live().party){a.equal(c.hp,h.R.maxHp(c,h.R.DIFF[h.r.live().diff].hp));a.equal(c.mp,h.R.maxMp(c));}}
function start(h){h.r.startFight([h.R.makeMonster(1,0,1,0,'normal')]);}
// t2343u exception: a level-up refills HP/MP to the new maximum; XP without a level-up still keeps leftovers.
for(const levelUp of [false,true])test(`gainXp ${levelUp?'refills HP/MP on':'preserves HP/MP without'} level-up`,()=>{const h=harness(),c=h.r.live().party[0];c.hp=7;c.mp=2;const mh=h.R.maxHp(c,1),mm=h.R.maxMp(c),n=levelUp?h.R.xpNeed(c.lvl):1;const levels=h.R.gainXp(c,n,1);a.equal(levels.length,levelUp?1:0);if(levelUp){a.ok(h.R.maxHp(c,1)>mh);a.ok(h.R.maxMp(c)>mm);a.deepEqual([c.hp,c.mp],[h.R.maxHp(c,1),h.R.maxMp(c)]);}else a.deepEqual([c.hp,c.mp],[7,2]);});
test('gainXp at cap retains pools and XP remains zero on reaching cap',()=>{const h=harness(),c=h.r.live().party[0];c.hp=1;c.mp=0;h.R.gainXp(c,1e9,1);a.equal(c.lvl,h.R.CAP);a.equal(c.xp,0);a.deepEqual([c.hp,c.mp],[h.R.maxHp(c,1),h.R.maxMp(c)]);c.hp=1;c.mp=0;h.R.gainXp(c,10,1);a.deepEqual([c.hp,c.mp,c.xp],[1,0,0]);});
// t2397u: a knocked-out member now wakes at exactly 1 HP after a win or a run (leftover MP and the standing members' pools are still kept)
for(const how of ['win','ran'])test(`${how} keeps leftover pools; KO wakes at 1 HP and keeps it through Continue and next fight`,()=>{const h=harness(),p=party(h);start(h);p[0].hp=7;p[0].mp=2;p[1].hp=0;p[1].mp=1;const xp=p[0].xp;h.r.forceEnd(how);a.deepEqual(pools(h),[[7,2],[1,1]]);if(how==='win'){a.ok(p[0].xp>xp||p[0].lvl>1);a.equal(p[1].xp,0);}h.click(h.ov.querySelector('#fdone'));a.deepEqual(pools(h),[[7,2],[1,1]]);start(h);a.deepEqual(pools(h),[[7,2],[1,1]]);});
// t2343u/t2344u: every party member who levels up in a won fight gets full HP/MP (companions too); a knocked-out member gains no XP and no refill.
test('won fight: a companion who levels up is refilled; KO companion gets no XP or refill; popup shows the refill',()=>{const h=harness(),p=party(h);p.push(plain(p[1]));p[2].name='Sleepy';
 p[1].companion=true;p[2].companion=true;const need=h.R.xpNeed(p[1].lvl);p[1].xp=need-1;p[1].hp=3;p[1].mp=1;p[2].xp=need-1;p[2].hp=0;p[2].mp=1;p[0].xp=0;p[0].hp=7;p[0].mp=2;
 start(h);h.r.forceEnd('win');const mul=h.R.DIFF[h.r.live().diff].hp;
 a.equal(p[1].lvl,2,'companion did not level');a.deepEqual([p[1].hp,p[1].mp],[h.R.maxHp(p[1],mul),h.R.maxMp(p[1])],'companion not refilled');
 a.deepEqual([p[2].lvl,p[2].xp,p[2].hp,p[2].mp],[1,need-1,1,1],'KO companion: no XP, no refill, wakes at 1 HP (t2397u)');
 if(p[0].lvl===1){a.ok(p[0].xp>0);a.deepEqual([p[0].hp,p[0].mp],[7,2],'hero XP without level-up must keep pools');}
 const pop=h.ov.querySelector('#s5lvl');a.ok(pop,'no Level up popup');const lines=pop.querySelectorAll('.s4note').map(e=>e.textContent);
 a.ok(lines.some(t=>/^Companion reached level 2! HP and MP fully restored\./.test(t)),'popup lines: '+JSON.stringify(lines));a.ok(!lines.some(t=>/Sleepy/.test(t)),'KO companion listed');
 a.match(h.ov.querySelector('.glowt').textContent,/Companion reached level 2! HP and MP fully restored/);
 h.click(h.ov.querySelector('#fdone'));a.deepEqual([p[1].hp,p[1].mp],[h.R.maxHp(p[1],mul),h.R.maxMp(p[1])]);a.deepEqual([p[2].hp,p[2].mp],[1,1]);});
test('won fight: hero level-up refills hero only; a companion without a level-up keeps leftovers',()=>{const h=harness(),p=party(h);p[0].xp=h.R.xpNeed(1)-1;p[0].hp=2;p[0].mp=0;p[1].xp=0;p[1].hp=5;p[1].mp=1;
 start(h);h.r.forceEnd('win');const mul=h.R.DIFF[h.r.live().diff].hp;a.equal(p[0].lvl,2);a.deepEqual([p[0].hp,p[0].mp],[h.R.maxHp(p[0],mul),h.R.maxMp(p[0])]);
 a.equal(p[1].lvl,1);a.ok(p[1].xp>0);a.deepEqual([p[1].hp,p[1].mp],[5,1]);a.match(h.ov.querySelector('#s5lvl').querySelector('.s4note').textContent,/Test Hero reached level 2! HP and MP fully restored/);});
test('loss keeps zero HP and leftover MP until explicit last-save reload',()=>{const h=harness(),p=party(h);h.r.doSave();const saved=pools(h);start(h);p.forEach(c=>{c.hp=0;c.mp=1;});h.r.forceEnd('lose');a.deepEqual(pools(h),[[0,1],[0,1]]);h.click(h.ov.querySelector('#fdone'));a.deepEqual(pools(h),saved);});
test('tavern arrival fills all pools like camp Rest, including KO',()=>{const h=harness(),p=party(h);p.forEach(c=>{c.hp=0;c.mp=0;});h.r.s5.tavernScreen(0);full(h);const tavern=pools(h);p.forEach(c=>{c.hp=0;c.mp=0;});h.r.s5.campRest(0);full(h);a.deepEqual(pools(h),tavern);});
test('reopen, shop save return, save-picker cancel and zone exit never heal or teleport',()=>{const h=harness(),p=party(h);h.r.s5.tavernScreen(0);p[0].hp=1;p[0].mp=0;p[1].hp=0;p[1].mp=1;const expected=pools(h);h.r.s5.tavernScreen(0,false);a.deepEqual(pools(h),expected);h.click(h.ov.querySelector('[data-hub=1]'));h.click(h.ov.querySelector('[data-tab=done]'));h.click(h.ov.querySelector('[data-save-slot=0]'));a.deepEqual(pools(h),expected);h.click(h.ov.querySelector('[data-hub=0]'));a.equal(h.ov.querySelectorAll('[data-save-slot]').length,4);h.click(h.ov.querySelector('.s4back'));a.deepEqual(pools(h),expected);h.click(h.ov.querySelector('[data-hub=0]'));h.click(h.ov.querySelector('[data-save-slot=3]'));a.equal(h.r.ui(),null);a.deepEqual(pools(h),expected);a.equal(h.teleports(),0);});
