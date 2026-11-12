#!/usr/bin/env python3
"""Browser regression of demo status, Cedar draft isolation, deep links and cost mutation.

Runs the real source modules in Chromium. This does not test a remote API.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
from run_journeys import inline_document


def fresh(context):
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(inline_document(),wait_until='load')
    page.locator('h1').wait_for()
    return page,errors


def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--no-sandbox'],executable_path=shutil.which('chromium') or shutil.which('chromium-browser'))
        try:
            ctx=browser.new_context(viewport={'width':1100,'height':850})
            page,errors=fresh(ctx)
            assert page.locator('.demo-pill').count()==0
            assert page.locator('.role-indicator').inner_text()=='Operator'
            assert page.locator('#role-select').count()==0
            assert 'Product requirements:' not in page.locator('body').inner_text()
            page.evaluate('location.hash="#/activity/atlas?channel=inference&person=Maya+Chen&model=GPT-6"')
            page.locator('#activity-model').wait_for()
            assert page.locator('#activity-model').input_value()=='GPT-6'
            assert page.locator('#activity-user').input_value()=='Maya Chen'
            assert page.locator('#activity-channel').input_value()=='inference'
            page.locator('[data-action="clear-activity"]').click()
            assert '?' not in page.evaluate('location.hash')
            assert page.locator('#activity-user').input_value()==''
            assert not errors,errors
            print('PASS direct-link filters and clear URL',flush=True)
            page.close()

            page,errors=fresh(ctx)
            page.evaluate('location.hash="#/agent/atlas/rules"')
            page.locator('[data-action="op-cedar-editor"]').click()
            page.locator('#op-cedar-form button[type="submit"]').click()
            actual=page.evaluate('''()=>({drafts:state.cedarDrafts.length,rules:state.rules.length,status:state.cedarDrafts[0]?.status})''')
            assert actual=={'drafts':1,'rules':0,'status':'draft'},actual
            assert not errors,errors
            print('PASS Cedar draft does not become an executable rule',flush=True)
            page.close()

            page,errors=fresh(ctx)
            page.evaluate('location.hash="#/agent/atlas"')
            before=page.evaluate('''()=>({requests:state.agents[0].requests,spent:state.agents[0].spent})''')
            page.evaluate("()=>{appendScenario(state,{agentId:'atlas',channel:'inference',toolId:'t1',userRole:'operator'});render();}")
            after=page.evaluate('''()=>({requests:state.agents[0].requests,spent:state.agents[0].spent,cost:state.events[0].cost})''')
            assert after['requests']==before['requests']+1,(before,after)
            assert round(after['spent']-before['spent'],6)==after['cost'],(before,after)
            assert not errors,errors
            print('PASS request count and spending change together',flush=True)
            page.close()

            page,errors=fresh(ctx)
            page.evaluate('location.hash="#/audit/atlas?trace=TRC-1044"')
            page.locator('#audit-search').wait_for()
            assert page.locator('#audit-search').input_value()=='TRC-1044'
            page.locator('[data-action="open-event"][data-id="TRC-1044"]').first.click()
            page.locator('[data-action="op-immutability"]').click()
            content=page.locator('.modal').inner_text()
            assert 'Not verified' in content and 'Unavailable' in content
            assert '403 AccessDenied' not in content
            assert not errors,errors
            print('PASS evidence status never invents an Object Lock response',flush=True)
            page.close()
            ctx.close()
        finally:
            browser.close()

if __name__=='__main__':main()
