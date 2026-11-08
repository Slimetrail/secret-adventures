"""Exact decoded-pixel checks: lossless conversion and human UI exclusion."""
import unittest
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'game-export/t2255u-sickdad'
class SickDadArt(unittest.TestCase):
    def test_three_clean_paintings_are_pixel_exact(self):
        for race in ('cat','dwarf','elf'):
            with self.subTest(race=race):
                source=ROOT.parent/'game-export/t2260u-sickdad' if race=='cat' else SOURCE
                original=Image.open(source/f'sickdad-{race}.jpg').convert('RGB')
                if race=='cat':self.assertEqual(original.size,(809,1178))
                installed=Image.open(ROOT/f'art-intro/sickdad/sickdad-{race}.webp').convert('RGB')
                self.assertEqual(installed.size,original.size)
                self.assertEqual(installed.tobytes(),original.tobytes())
    def test_human_contains_only_rows_before_dialog_chrome(self):
        original=Image.open(SOURCE/'sickdad-human-dialog-ref.jpg').convert('RGB')
        installed=Image.open(ROOT/'art-intro/sickdad/sickdad-human.webp').convert('RGB')
        self.assertEqual(installed.size,(662,991))
        self.assertEqual(installed.tobytes(),original.crop((0,0,662,991)).tobytes())
if __name__=='__main__':unittest.main(verbosity=2)
