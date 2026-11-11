#!/usr/bin/env python3
"""Exercise the exact generated dist/ files in Chromium without a network server.

Source modules are concatenated from dist/ only (not src/), so missing deploy
files cannot be masked by the normal source-level browser test. Browser module
loading and the real Pages host are not claimed as tested in this environment.
"""
from pathlib import Path
import os,shutil
from run_journeys import inline_document
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
assert (DIST/'src/operations.js').is_file(), 'Missing operations module from distribution'
OUTPUT=os.environ.get('QA_SCREENSHOTS')
if OUTPUT:Path(OUTPUT).mkdir(parents=True,exist_ok=True)

def browse(browser,width,height):
 ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
 page=ctx.new_page();page.set_default_timeout(6500)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_document(DIST),wait_until='load')
 page.locator('h1').wait_for();assert 'Agent activity' in page.locator('h1').inner_text()
 routes=['#/catalog','#/agent/atlas','#/agent/atlas/rules','#/agent/atlas/connections','#/rules','#/approvals','#/spending','#/audit']
 for route in routes:
  page.evaluate('hash=>location.hash=hash',route)
  page.wait_for_timeout(80)
  assert page.locator('main').count()==1,f'No main for {route}'
  measure=page.evaluate('''()=>({scroll:document.documentElement.scrollWidth,width:innerWidth})''')
  assert measure['scroll']<=measure['width'],f'Horizontal overflow {route} at {width}: {measure}'
  if OUTPUT and width in (390,1100) and route in ('#/agent/atlas/rules','#/approvals','#/spending','#/audit'):
   name=route.split('/')[-1]
   page.screenshot(path=str(Path(OUTPUT)/f'{name}-{width}.png'),full_page=True)
 page.evaluate('location.hash="#/catalog"');page.wait_for_timeout(60)
 page.locator('[data-action="catalog-tab"][data-value="tools"]').click()
 page.locator('[data-action="op-open-tool"][data-id="t3"][data-mobile-tool="true"]' if width<=670 else 'button.row-link[data-action="op-open-tool"][data-id="t3"]').click()
 page.locator('#op-tool-form').wait_for()
 assert 'Delete customer record' in page.locator('.drawer').inner_text()
 measure=page.evaluate('''()=>({scroll:document.documentElement.scrollWidth,width:innerWidth})''')
 assert measure['scroll']<=measure['width'],f'Tool drawer overflow at {width}: {measure}'
 if OUTPUT and width in (390,1100):page.screenshot(path=str(Path(OUTPUT)/f'tool-review-{width}.png'),full_page=True)
 page.locator('#op-tool-form [name="decision"]').select_option('approved')
 page.locator('#op-tool-form button[type="submit"]').click()
 page.locator('[data-action="op-confirm-tool"]').click()
 page.locator('[data-action="op-open-tool"][data-id="t3"][data-mobile-tool="true"]' if width<=670 else 'button.row-link[data-action="op-open-tool"][data-id="t3"]').click()
 assert 'approved' in page.locator('.drawer').inner_text()
 assert not errors,f'JS module errors: {errors}'
 print('Distribution smoke passed',width,'×',height,'routes',len(routes),'tool review committed',flush=True)
 ctx.close()

def main():
 with sync_playwright() as p:
  chrome=shutil.which('chromium') or shutil.which('chromium-browser')
  opts={'headless':True,'args':['--no-sandbox']}
  if chrome:opts['executable_path']=chrome
  browser=p.chromium.launch(**opts)
  try:
   for width,height in [(320,720),(390,844),(670,900),(900,900),(1100,900),(1440,900),(1920,1080)]:browse(browser,width,height)
  finally:browser.close()
if __name__=='__main__':main()
