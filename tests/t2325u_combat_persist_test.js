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
for(const levelUp of [false,true])test(`gainXp preserves HP/MP ${levelUp?'with':'without'} level-up`,()=>{const h=harness(),c=h.r.live().party[0];c.hp=7;c.mp=2;const mh=h.R.maxHp(c,1),mm=h.R.maxMp(c),n=levelUp?h.R.xpNeed(c.lvl):1;const levels=h.R.gainXp(c,n,1);a.deepEqual([c.hp,c.mp],[7,2]);a.equal(levels.length,levelUp?1:0);if(levelUp){a.ok(h.R.maxHp(c,1)>mh);a.ok(h.R.maxMp(c)>mm);}});
test('gainXp at cap retains pools and XP remains zero on reaching cap',()=>{const h=harness(),c=h.r.live().party[0];c.hp=1;c.mp=0;h.R.gainXp(c,1e9,1);a.equal(c.lvl,h.R.CAP);a.equal(c.xp,0);h.R.gainXp(c,10,1);a.deepEqual([c.hp,c.mp,c.xp],[1,0,0]);});
for(const how of ['win','ran'])test(`${how} keeps leftover pools and KO through Continue and next fight`,()=>{const h=harness(),p=party(h);start(h);p[0].hp=7;p[0].mp=2;p[1].hp=0;p[1].mp=1;const xp=p[0].xp;h.r.forceEnd(how);a.deepEqual(pools(h),[[7,2],[0,1]]);if(how==='win'){a.ok(p[0].xp>xp||p[0].lvl>1);a.equal(p[1].xp,0);}h.click(h.ov.querySelector('#fdone'));a.deepEqual(pools(h),[[7,2],[0,1]]);start(h);a.deepEqual(pools(h),[[7,2],[0,1]]);});
test('loss keeps zero HP and leftover MP until explicit last-save reload',()=>{const h=harness(),p=party(h);h.r.doSave();const saved=pools(h);start(h);p.forEach(c=>{c.hp=0;c.mp=1;});h.r.forceEnd('lose');a.deepEqual(pools(h),[[0,1],[0,1]]);h.click(h.ov.querySelector('#fdone'));a.deepEqual(pools(h),saved);});
test('tavern arrival fills all pools like camp Rest, including KO',()=>{const h=harness(),p=party(h);p.forEach(c=>{c.hp=0;c.mp=0;});h.r.s5.tavernScreen(0);full(h);const tavern=pools(h);p.forEach(c=>{c.hp=0;c.mp=0;});h.r.s5.campRest(0);full(h);a.deepEqual(pools(h),tavern);});
test('reopen, shop save return, save-picker cancel and zone exit never heal or teleport',()=>{const h=harness(),p=party(h);h.r.s5.tavernScreen(0);p[0].hp=1;p[0].mp=0;p[1].hp=0;p[1].mp=1;const expected=pools(h);h.r.s5.tavernScreen(0,false);a.deepEqual(pools(h),expected);h.click(h.ov.querySelector('[data-hub=1]'));h.click(h.ov.querySelector('[data-tab=done]'));h.click(h.ov.querySelector('[data-save-slot=0]'));a.deepEqual(pools(h),expected);h.click(h.ov.querySelector('[data-hub=0]'));a.equal(h.ov.querySelectorAll('[data-save-slot]').length,4);h.click(h.ov.querySelector('.s4back'));a.deepEqual(pools(h),expected);h.click(h.ov.querySelector('[data-hub=0]'));h.click(h.ov.querySelector('[data-save-slot=3]'));a.equal(h.r.ui(),null);a.deepEqual(pools(h),expected);a.equal(h.teleports(),0);});
