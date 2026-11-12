#!/usr/bin/env python3
"""Browser regression for S0/REG-02: agent registration and local one-time credential lifecycle."""
from playwright.sync_api import sync_playwright
import shutil
from run_journeys import inline_document

def main():
    with sync_playwright() as p:
        path=shutil.which('chromium') or shutil.which('chromium-browser')
        browser=p.chromium.launch(headless=True,executable_path=path if path else None,args=['--no-sandbox'])
        try:
            for width in (390,1100):
                context=browser.new_context(viewport={'width':width,'height':900},permissions=['clipboard-read','clipboard-write'])
                page=context.new_page();errors=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.set_content(inline_document(),wait_until='load')
                print('Browser origin secure:',page.evaluate('window.isSecureContext'), 'width',width,flush=True)
                page.locator('[data-action="navigate"][data-route="catalog"]').click()
                page.locator('[data-action="add-agent"]').click()
                form=page.locator('#new-agent-form')
                assert form.count()==1
                form.locator('[name="name"]').fill('Research Assistant')
                form.locator('[name="owner"]').fill('Team Lead')
                form.locator('details summary').click()
                form.locator('[name="team"]').fill('Insights')
                form.locator('[name="description"]').fill('Research and reporting')
                form.locator('[name="preset"]').select_option('2')
                form.locator('[name="budget"]').fill('85')
                form.locator('[name="blockStyle"]').select_option('error_http')
                form.locator('[name="acceptedClients"]').fill('app-web, app-mobile')
                form.locator('button[type="submit"]').click()
                page.locator('#agent-credential-once').wait_for()
                receipt=page.locator('#agent-credential-once').input_value()
                assert receipt.startswith('gov_test_'),receipt
                assert page.locator('#agent-base-url').input_value()=='https://gateway.example.invalid/inference/v1'
                stored=page.evaluate('''()=>({agents:state.agents,credentials:state.credentials})''')
                agent=next(a for a in stored['agents'] if a['id']=='research-assistant')
                assert agent['preset']==2 and agent['budget']==85 and agent['team']=='Insights',agent
                assert agent['acceptedClients']==['app-web','app-mobile']
                assert agent['mode']=='observe' and agent['connections']==['A']
                assert agent['connectionCheck']['status']=='pending'
                assert receipt not in str(stored)
                page.locator('[data-action="copy-agent-config"]').click()
                page.locator('[data-action="navigate"][data-route="agent/research-assistant"]').click()
                page.wait_for_timeout(75)
                assert page.evaluate('location.hash')=='#/agent/research-assistant'
                assert page.locator('#agent-credential-once').count()==0
                assert receipt not in page.locator('#app').inner_text()
                assert '1 active' in page.locator('.agent-connection-summary').inner_text()
                assert 'Awaiting connection' in page.locator('.agent-connection-summary').inner_text()
                assert page.locator('.agent-connection-summary a[href*="test-console.html"]').count()==0
                assert 'non-routable local test setting' not in page.locator('#app').inner_text()
                page.locator('[data-action="op-rotate-token"]').click()
                page.locator('[data-action="op-confirm-agent-action"]').click()
                page.locator('#agent-credential-once').wait_for()
                rotated=page.locator('#agent-credential-once').input_value()
                assert rotated.startswith('gov_test_') and rotated!=receipt
                state=page.evaluate('''()=>state.credentials['research-assistant']''')
                assert len([k for k in state['active'] if not k['revokedAt']])==2
                assert receipt not in str(state) and rotated not in str(state)
                page.locator('[data-action="navigate"][data-route="agent/research-assistant"]').click()
                page.locator('[data-action="op-revoke-token"]').click()
                assert page.locator('#credential-to-revoke option').count()==2
                page.locator('[data-action="op-confirm-agent-action"]').click()
                state=page.evaluate('''()=>state.credentials['research-assistant']''')
                assert state['revoked']==1
                assert len([k for k in state['active'] if not k['revokedAt']])==1
                page.locator('[data-action="op-agent-settings"]').click()
                assert page.locator('#op-agent-settings-form').count()==1
                page.locator('#op-agent-settings-form [name="invalidUserToken"]').select_option('reject')
                page.locator('#op-agent-settings-form [name="acceptedClients"]').fill('web-portal, mobile')
                page.locator('#op-agent-settings-form button[type="submit"]').click()
                updated=page.evaluate("()=>state.agents.find(a=>a.id==='research-assistant')")
                assert updated['invalidUserToken']=='reject'
                assert updated['acceptedClients']==['web-portal','mobile']
                page.evaluate("state.role='auditor';render()")
                assert page.locator('[data-action="op-rotate-token"]').count()==0
                assert page.locator('[data-action="op-revoke-token"]').count()==0
                assert not errors,errors
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
                print('Onboarding browser passed',width,flush=True)
                context.close()
        finally:browser.close()

if __name__=='__main__':main()
