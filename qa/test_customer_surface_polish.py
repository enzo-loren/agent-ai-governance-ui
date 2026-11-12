#!/usr/bin/env python3
"""Browser checks for role-specific messaging and context-sensitive navigation."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
from run_journeys import inline_document

ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'docs'

def run():
    with sync_playwright() as p:
        chrome=shutil.which('chromium') or shutil.which('chromium-browser')
        browser=p.chromium.launch(headless=True,executable_path=chrome if chrome else None,args=['--no-sandbox'])
        try:
            for width,height in [(320,720),(390,844),(900,900),(1100,900),(1440,900)]:
                ctx=browser.new_context(viewport={'width':width,'height':height})
                page=ctx.new_page()
                errors=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.set_content(inline_document(),wait_until='load')
                page.evaluate("state.role='auditor';render()")
                page.evaluate('location.hash="#/approvals"')
                page.wait_for_timeout(100)
                assert page.locator('.role-indicator').inner_text()=='Auditor'
                assert 'Auditor access is read-only' in page.locator('[role="note"]').inner_text()
                assert not page.locator('[role="note"]').inner_text().find('Select that role above')>=0
                for button in page.locator('[data-action="approval-confirm"]').all():
                    assert button.is_disabled()
                page.evaluate('location.hash="#/agent/atlas/connections"')
                page.wait_for_timeout(100)
                card=page.locator('[aria-label="Connection capabilities"]')
                card.wait_for()
                assert card.locator('a.capability-action').count()==5
                assert card.locator('.capability-line').count()==5
                assert not card.locator('a[href="#/catalog"]').count()
                expected=['#/activity/atlas','#/agent/atlas/rules','#/approvals/atlas','#/spending/atlas']
                actual=card.locator('a.capability-action').evaluate_all('(links)=>links.map(l=>l.getAttribute("href"))')
                for href in expected:assert href in actual,(width,href,actual)
                for line in card.locator('.capability-line').all():
                    dims=line.evaluate('(el)=>{const r=el.getBoundingClientRect();const children=[...el.children].map(n=>n.getBoundingClientRect());return {x:r.x,right:r.right,c:children.map(v=>({x:v.x,right:v.right}))}}')
                    assert all(c['x']>=dims['x']-1 and c['right']<=dims['right']+1 for c in dims['c']),(width,dims)
                metrics=page.evaluate('()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})')
                assert metrics['scroll']<=metrics['width'],(width,metrics)
                if width in (390,1100):
                    SHOTS.mkdir(exist_ok=True)
                    page.screenshot(path=str(SHOTS/f'connection-actions-{width}.png'),full_page=True)
                card.locator('a.capability-action',has_text='View spending').click()
                page.wait_for_timeout(100)
                assert page.evaluate('location.hash')=='#/spending/atlas'
                page.evaluate('location.hash="#/audit"')
                page.wait_for_timeout(100)
                page.locator('[data-action="open-explainer"][data-topic="audit"]').click()
                assert 'retention status remains Not verified' in page.locator('.drawer').inner_text()
                assert not errors,(width,errors)
                print('Customer polish browser passed',width,flush=True)
                ctx.close()
        finally:browser.close()
if __name__=='__main__':run()
