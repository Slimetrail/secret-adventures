"""Unpublished phone interaction checks. python3 tests/tavern_shop_camp_browser_tests.py [local URL]"""
import unittest
from playwright.sync_api import sync_playwright
import stage4_tests as s4

class FlowPhoneTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
    @classmethod
    def tearDownClass(cls):
        cls.p.stop()
    def setUp(self):
        s4.ERRS.clear()
        self.b, self.c = s4.ctx(self.p)
        self.pg = s4.page(self.c)
        s4.create(self.pg)
        self.pg.evaluate('SOTA.teleport(...MAZE.taverns[0],0)')
    def tearDown(self):
        self.b.close()
        self.assertFalse(s4.ERRS, s4.ERRS)
    def js(self, code):
        return self.pg.evaluate(code)
    def tap(self, selector):
        self.pg.locator(selector).tap()
    def drain(self):
        self.js('SOTA.rpg.s6.setSpeed(0)')
        for _ in range(60):
            if not self.js('SOTA.storyOpen()'):
                return
            self.pg.wait_for_function('() => !SOTA.storyOpen() || document.querySelector("#s6d .s6more.on")', timeout=5000)
            self.pg.locator('#s6d').dispatch_event('pointerdown')
        self.fail('dialogue queue did not finish')
    def test_hub_labels_and_phone_buttons(self):
        for t in range(4):
            self.js(f'SOTA.rpg.s5.tavernScreen({t})')
            self.assertEqual(self.pg.locator('[data-hub]').all_text_contents(), [f'Zone {t+1}', 'Shop', f'Zone {t+2}'])
            self.assertEqual(self.pg.locator('#s4 .s5tab').count(), 0)
            for b in self.pg.locator('[data-hub]').all():
                r = b.bounding_box()
                self.assertGreaterEqual(r['height'], 44)
                self.assertGreater(r['y'], 700)
    def test_save_exits_and_health_unchanged(self):
        self.js('SOTA.rpg.live().party[0].hp=1;SOTA.rpg.live().party[0].mp=0;SOTA.rpg.s5.tavernScreen(0)')
        self.tap('[data-hub="1"]')
        self.tap('[data-tab=done]')
        self.assertEqual(self.pg.locator('[data-save-slot]').count(), 4)
        self.tap('[data-save-slot="2"]')
        self.assertEqual(self.js('SOTA.rpg.ui()'), 'tavern')
        self.tap('[data-hub="0"]')
        self.tap('[data-save-slot="3"]')
        self.assertIsNone(self.js('SOTA.rpg.ui()'))
        self.assertEqual(self.js('SOTA.rpg.live().party[0].hp'), 1)
        self.assertEqual(self.js('SOTA.rpg.live().party[0].mp'), 0)
        self.assertEqual(self.js('[SOTA.state().x,SOTA.state().y]'), self.js('MAZE.taverns[0]'))
        self.assertEqual(self.js('SOTA.rpg.activeSlot()'), 3)
    def test_arrival_wait_and_shop_controls_with_real_dialogue(self):
        self.js('localStorage.removeItem("sota.dev.nostory");SOTA.rpg.s6.setSpeed(0);SOTA.rpg.s5.tavernScreen(1)')
        self.assertTrue(self.js('SOTA.storyOpen()'))
        self.assertEqual(self.pg.locator('[data-hub="1"]').evaluate('(b)=>getComputedStyle(b).visibility'), 'hidden')
        self.js('document.querySelector("[data-hub=\\"1\\"]").click()')
        self.assertEqual(self.js('SOTA.rpg.ui()'), 'tavern')
        self.drain()
        self.tap('[data-hub="2"]')
        self.pg.wait_for_function('() => document.querySelector("#s6d .s6more.on")')
        self.assertEqual(self.pg.locator('#s6d .s6t').inner_text(), 'Please wait for update to continue.')
        self.assertEqual(self.js('SOTA.rpg.ui()'), 'tavern')
        self.drain()
        self.tap('[data-hub="1"]')
        self.assertTrue(self.js('SOTA.storyOpen()'))
        for sel in ['.s4back', '[data-tab=done]']:
            self.assertTrue(self.pg.locator(sel).evaluate('(b)=>{const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}'))
        self.tap('[data-tab=done]')
        self.assertEqual(self.js('SOTA.rpg.ui()'), 'save-picker')
        self.tap('[data-save-slot="1"]')
        self.assertEqual(self.js('SOTA.rpg.ui()'), 'tavern')
    def test_camp_cook_rest_return(self):
        self.js('SOTA.rpg.s5.campScreen(0)')
        self.assertEqual(self.pg.locator('.s5tab').all_text_contents(), ['Cook','Rest','Return'])
        self.tap('[data-tab=cook]')
        self.js('SOTA.rpg.live().party[0].bag.push("i_bread","i_butter");SOTA.rpg.s5.cookScreen("c0")')
        self.tap('[data-ing=bread]')
        self.tap('[data-ing=butter]')
        self.tap('#s5cook')
        self.tap('.s4back')
        self.js('localStorage.removeItem("sota.dev.nostory");SOTA.rpg.live().party[0].hp=1;SOTA.rpg.live().party[0].mp=0')
        self.tap('[data-tab=rest]')
        self.assertTrue(self.js('SOTA.rpg.live().party.every(c=>c.hp===RPG.maxHp(c,RPG.DIFF[SOTA.rpg.live().diff].hp)&&c.mp===RPG.maxMp(c))'))
        self.assertTrue(self.js('SOTA.storyOpen()'))
        self.drain()
        self.tap('[data-tab=return]')
        self.assertIsNone(self.js('SOTA.rpg.ui()'))
    def test_journal_settings_load_and_menu(self):
        self.js('SOTA.rpg.live().gold=91;SOTA.rpg.s5.leaveShop(0)')
        self.tap('[data-save-slot="1"]')
        self.js('SOTA.rpg.live().gold=23;SOTA.intro.openJournal("settings")')
        self.tap('[data-setting=volume]')
        self.assertTrue(self.js('SOTA.music.isMuted()'))
        self.tap('[data-setting=load]')
        self.assertFalse(self.js('SOTA.intro.journalOpen()'))
        self.tap('[data-save-slot="1"]')
        self.assertEqual(self.js('SOTA.rpg.live().gold'), 91)
        self.assertIsNone(self.js('SOTA.rpg.ui()'))
        self.js('SOTA.intro.openJournal("settings")')
        self.tap('[data-setting=menu]')
        self.assertTrue(self.js('SOTA.intro.titleOpen()'))
        self.assertFalse(self.js('SOTA.intro.journalOpen()'))
        self.assertEqual(self.pg.locator('#ititle .iinst').inner_text(), 'Install app')

if __name__ == '__main__':
    unittest.main(argv=['tavern_shop_camp_browser_tests.py'], verbosity=2)
