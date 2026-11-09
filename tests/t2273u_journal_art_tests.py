import unittest,hashlib,re
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parents[1];SRC=R.parent/'game-export/t2187u';DEST=R/'art-intro/journal/monsters'
class JournalArt(unittest.TestCase):
 def test_inventory_and_exact_approved_file_set(self):
  inv=(SRC/'LOOK-LEAD-INVENTORY.txt').read_bytes()
  self.assertEqual(hashlib.sha256(inv).hexdigest(),'4246769b03fb84f4b1fa62dd94196fca95ecac4a7dba3de570c7c5ec9a38cebd')
  rows=re.findall(r'/journal-monsters/(z[12]-[^\s]+\.webp)\nSHA-256 ([0-9a-f]{64})',inv.decode())
  self.assertEqual(len(rows),14);self.assertEqual({p.name for p in DEST.iterdir() if not p.name.startswith('z3-')},{n for n,_ in rows})  # t2404u: z3 sketches are new
  for n,sha in rows:
   with self.subTest(file=n):
    source=SRC/'journal-monsters'/n;dest=DEST/n
    self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(),sha);self.assertEqual(hashlib.sha256(dest.read_bytes()).hexdigest(),sha)
    self.assertEqual(dest.read_bytes(),source.read_bytes());self.assertEqual(Image.open(dest).tobytes(),Image.open(source).tobytes())
if __name__=='__main__':unittest.main(verbosity=2)
