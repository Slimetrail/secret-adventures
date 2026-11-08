"""t2262u/t2266u: lossless originals, cropped chrome, per-seat preservation and removal."""
import hashlib
import json
import unittest
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'game-export/t2262u-camp'
FIX=ROOT/'tests/fixtures/t2262u'
EXPECTED={
 'arguing-weapons':('b1f5afd65106288f186425239668906aa5ad07555f993020cb94181940a567db',(870,1152)),
 'celebrating':('00bbbea71b2f2afa477d3d42cdee00119316a5297d3d8398d4836dcfbd961672',(916,1457)),
 'injured':('5757254d3c814f78669bf522ceb0153febfb88af413b5b1a10da2f8f5191e676',(841,1218)),
 'eating':('89352578e7ee49348635d3c969acc5c6d28d0444d9f308a5d268af7c0de901fc',(1005,1256))}
class CampArt(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.manifest=json.loads((FIX/'manifest.json').read_text())
 def test_all_four_full_party_files_are_pixel_exact(self):
  for mood,(sha,size) in EXPECTED.items():
   with self.subTest(mood=mood):
    p=SOURCE/f'camp-{mood}.jpg';self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),sha)
    source=Image.open(p).convert('RGB');self.assertEqual(source.size,size)
    if mood=='celebrating':source=source.crop((0,198,840,1457))
    installed=Image.open(ROOT/f'art6/camp/camp-{mood}.webp').convert('RGB')
    self.assertEqual(installed.size,source.size);self.assertEqual(installed.tobytes(),source.tobytes())
 def test_celebrating_crop_discards_all_share_button_coordinates(self):
  source=Image.open(SOURCE/'camp-celebrating.jpg').convert('RGB');installed=Image.open(ROOT/'art6/camp/camp-celebrating.webp').convert('RGB')
  self.assertEqual(installed.size,(840,1259));self.assertEqual(self.manifest['crop'],[0,198,840,1457])
  chrome=np.array(source)[74:124,840:884];self.assertTrue(np.any(np.all(chrome>245,axis=2)))
  # Every installed coordinate is x<840 AND source y>=198, disjoint from that white chrome blob.
  self.assertEqual(installed.tobytes(),source.crop((0,198,840,1457)).tobytes())
  self.assertFalse(np.any(np.all(np.array(installed)[:124,-44:]>245,axis=2)))
 def test_all_78_variants_keep_each_retained_seat_pixel_exact_and_remove_absent_seats(self):
  self.assertEqual(len(self.manifest['variants']),78)
  for v in self.manifest['variants']:
   with self.subTest(path=v['path']):
    sc=self.manifest['scenes'][v['scene']];src=np.array(Image.open(ROOT/sc['source']).convert('RGB'));p=ROOT/v['path'];dec=np.array(Image.open(p).convert('RGB'))
    self.assertEqual(src.shape,dec.shape);self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),v['sha256'])
    union=np.zeros(src.shape[:2],np.uint8)
    for race,mp in sc['masks'].items():
     m=np.array(Image.open(ROOT/mp))>0;self.assertGreater(m.sum(),100);self.assertFalse(np.any(union[m]));union[m]=1
     if race in v['seats']:self.assertTrue(np.array_equal(src[m],dec[m]),race)
     else:self.assertGreater(float(np.abs(src[m].astype(float)-dec[m]).mean()),10,race)
 def test_no_arguing_files_for_human_elf_dwarf_solo_but_cat_unlock_variant_exists(self):
  for race in ('human','elf','dwarf'):self.assertFalse((ROOT/f'art6/camp/camp-arguing-weapons-{race}.webp').exists())
  self.assertTrue((ROOT/'art6/camp/camp-arguing-weapons-cat.webp').exists())
 def test_five_tavern_sets_and_owner_art_remain_unchanged(self):
  for n in range(1,6):
   with Image.open(ROOT/f'art6/tavern-{n}.webp') as src:self.assertEqual(src.size,(720,409 if n==5 else 387))
   self.assertEqual(sum(v['scene']==f'tavern-{n}' for v in self.manifest['variants']),9)
  for name,sha in json.loads((FIX/'protected-hashes.json').read_text()).items():
   self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),sha,name)
if __name__=='__main__':unittest.main(verbosity=2)
