#!/usr/bin/env python3
"""Customer-task checks: spending -> cost driver -> recorded request -> decision and back.

This is browser behavior against sample state, not actual billing reconciliation.
"""
from pathlib import Path
import shutil
import os
from playwright.sync_api import sync_playwright
from run_journeys import inline_document

ROOT=Path(__file__).resolve().parents[1]

def run(page,name,fn):
    errors=[]
    page.on('pageerror',lambda ex: errors.append(str(ex)))
    page.set_content(inline_document(),wait_until='load')
    if page.locator('.menu-btn').is_visible():page.locator('[data-action="toggle-nav"]').click()
    page.locator('a.nav-link[href="#/spending"]').click()
    page.get_by_role('heading',name='Spending',exact=True).wait_for()
    try:
        fn(page)
        assert not errors, errors
        print('PASS',name,flush=True)
    except Exception:
        page.screenshot(path='/tmp/spending-navigation-failure.png',full_page=True)
        raise

def _selected(page,selector):
    return page.locator(selector).input_value()

def visit_agent(page):
    page.locator('a[href="#/spending/atlas"].agent-name').click()
    assert page.evaluate('location.hash')=='#/spending/atlas'
    page.locator('.spending-next h2',has_text='Investigate Atlas Support').wait_for()
    assert page.locator('.spending-record').count()>0
    assert 'not a reconciliation' in page.locator('[aria-label="Recorded cost events"]').inner_text()

def visit_activity(page):
    visit_agent(page)
    page.locator('.spending-next [data-action="spending-requests"]').click()
    assert page.evaluate('location.hash')=='#/activity/atlas'
    assert _selected(page,'#activity-channel')=='inference'
    assert page.locator('table tbody tr').count()>0
    assert all(x=='Model' for x in page.locator('tbody tr td:nth-child(4)').all_text_contents())
    page.locator('.scope-bar a[href="#/spending/atlas"]').click()
    assert page.evaluate('location.hash')=='#/spending/atlas'

def visit_person(page):
    page.locator('[data-action="spending-person-requests"][data-person="Maya Chen"]').first.click()
    assert page.evaluate('location.hash')=='#/activity/atlas'
    assert _selected(page,'#activity-channel')=='inference'
    assert _selected(page,'#activity-user')=='Maya Chen'
    assert page.locator('tbody tr').count()>0
    assert all('Maya Chen' in x for x in page.locator('tbody tr td:nth-child(2)').all_text_contents())
    page.locator('[data-action="clear-activity"]').click()
    assert _selected(page,'#activity-user')==''
    assert _selected(page,'#activity-channel')==''

def visit_model(page):
    visit_agent(page)
    page.locator('[data-action="spending-model-requests"][data-model="GPT-6"]').first.click()
    assert page.evaluate('location.hash')=='#/activity/atlas'
    assert _selected(page,'#activity-model')=='GPT-6'
    assert _selected(page,'#activity-channel')=='inference'

def visit_trace(page):
    visit_agent(page)
    page.locator('.spending-record [data-action="spending-trace"]').first.click()
    assert page.evaluate('location.hash')=='#/audit/atlas'
    assert page.locator('#audit-search').input_value()!=''
    trace=page.locator('#audit-search').input_value()
    assert page.locator('tbody tr').count()==1
    assert trace in page.locator('tbody tr').first.inner_text()
    page.locator('.scope-bar a[href="#/spending/atlas"]').click()
    assert page.evaluate('location.hash')=='#/spending/atlas'

def visit_alert(page):
    page.locator('[data-action="op-spending-alerts"]').click()
    page.locator('.drawer a[href="#/spending/invoice"]').click()
    assert page.evaluate('location.hash')=='#/spending/invoice'
    page.locator('.spending-next h2',has_text='Investigate Invoice Assistant').wait_for()

def direct_record(page):
    visit_agent(page)
    page.locator('.spending-record [data-action="open-event"]').first.click()
    assert page.locator('.drawer').count()==1
    assert 'What happened' in page.locator('.drawer').inner_text()
    page.locator('.drawer [data-action="close-overlay"]').first.click()
    assert page.evaluate('location.hash')=='#/spending/atlas'

def null_identity(page):
    assert page.locator('[data-action="spending-person-requests"]').count()>0
    assert page.locator('[data-action="spending-person-requests"][data-person="No user identity"]').count()==0

def main():
    chrome=shutil.which('chromium') or shutil.which('chromium-browser')
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox'])
        try:
            widths=((1100,900),(390,844))
            only=os.environ.get('SPENDING_QA_WIDTH')
            for width,height in widths:
                if only and width!=int(only):continue
                context=browser.new_context(viewport={'width':width,'height':height})
                try:
                    tests=(('agent overview',visit_agent),('activity and return',visit_activity),('person scope and clear',visit_person),('model scope',visit_model),('audit trace and return',visit_trace),('alert to agent',visit_alert),('event explanation',direct_record),('unidentified person not actionable',null_identity)) if width==1100 else (('agent overview',visit_agent),('activity and return',visit_activity),('audit trace and return',visit_trace),('person scope and clear',visit_person))
                    for name,fn in tests:
                        page=context.new_page()
                        try:run(page,f'{name} at {width}px',fn)
                        finally:page.close()
                    page=context.new_page()
                    try:
                        run(page,f'responsive spending at {width}px',visit_agent)
                        geometry=page.evaluate('''()=>({scroll:document.documentElement.scrollWidth,width:innerWidth})''')
                        assert geometry['scroll']<=geometry['width'],geometry
                        if os.environ.get('QA_SCREENSHOTS'):
                            page.screenshot(path=str(ROOT/f'docs/spending-drilldown-{width}.png'),full_page=True)
                    finally:page.close()
                finally:context.close()
        finally:browser.close()
if __name__=='__main__':main()
