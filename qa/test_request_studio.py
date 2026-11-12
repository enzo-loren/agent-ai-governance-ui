#!/usr/bin/env python3
"""Browser test of the local POST-like request UI and downstream customer screens.

Inline scripts are required because navigation to local domains is blocked in this
execution environment; CI also verifies that all modules are bundled to dist.
"""
from pathlib import Path
import os,re,shutil,json
from playwright.sync_api import sync_playwright
from run_journeys import inline_document

ROOT=Path(__file__).resolve().parents[1]

def inline_studio():
    modules=[]
    for name in ('mock/fixtures','data','domain','mock/backend','mock/credentials','mock/test-api','mock/test-fixtures','test-console'):
        source=(ROOT/'src'/f'{name}.js').read_text()
        source=re.sub(r'^import\s+\{[^\n]+\}\s+from\s+[^\n]+;\s*','',source,flags=re.M)
        source=re.sub(r'\bexport\s+(?=(?:const|function|class|async)\b)','',source)
        source=re.sub(r'^export\s*\{[^\n]+\}\s*from\s*[^\n]+;','',source,flags=re.M)
        source=re.sub(r'^export\s*\{[^\n]+\};','',source,flags=re.M)
        modules.append(source)
    html=(ROOT/'test-console.html').read_text()
    html=re.sub(r'<link rel="stylesheet"[^>]*>','',html)
    html=re.sub(r'<script type="module"[^>]*></script>','',html)
    css='\n'.join((ROOT/'src/styles'/name).read_text() for name in ('tokens.css','test-console.css'))
    return html.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<script>'+'\n'.join(modules)+'</script></body>')

def customer_from_snapshot(context,snapshot):
    page=context.new_page()
    page.set_content(inline_document(ROOT),wait_until='load')
    page.evaluate('(snapshot)=>{state=structuredClone(snapshot);render();}',snapshot)
    return page

def exercise(browser,width):
    context=browser.new_context(viewport={'width':width,'height':844},device_scale_factor=1)
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        # The hosted studio uses HTTPS. Serve an inlined response at a secure origin
        # so Web Crypto can validate the agent's one-time key in browser tests.
        origin='https://studio.example.test/'
        context.route(origin,lambda route: route.fulfill(status=200,content_type='text/html',body=inline_studio()))
        page.goto(origin,wait_until='load')
        assert page.evaluate('window.isSecureContext')
        page.locator('#send-request').wait_for()
        assert '/v1/model-requests' in page.locator('#endpoint').input_value()
        assert page.locator('#agent-token').count()==1
        before=int(page.locator('#event-count').inner_text())
        page.locator('#send-request').click()
        assert page.locator('#http-status').inner_text().startswith('201')
        reply=json.loads(page.locator('#response-body').inner_text())
        trace=reply['trace_id']
        assert int(page.locator('#event-count').inner_text())==before+1
        assert page.locator('#open-audit').get_attribute('href').startswith('./index.html#/audit/atlas?trace=')
        snapshot=page.evaluate('window.__studioSnapshot()')
        customer=customer_from_snapshot(context,snapshot)
        try:
            customer.evaluate('(id)=>{location.hash=`#/audit/atlas?trace=${id}`}',trace)
            customer.locator('#audit-search').wait_for()
            assert customer.locator('#audit-search').input_value()==trace
            assert trace in customer.locator('main').inner_text()
            text=customer.locator('body').inner_text()
            assert 'Product requirements:' not in text
            assert 'Test request' not in text
            assert 'Demo' not in text
            assert customer.locator('#role-select').count()==0
            customer.evaluate('location.hash="#/agent/atlas"')
            assert customer.locator('h1').inner_text()=='Atlas Support'
            assert customer.locator('[data-action="simulate"]').count()==0
            assert 'Try a request' not in customer.locator('main').inner_text()
        finally:customer.close()
        page.locator('#payload').fill('{"broken":')
        page.locator('#send-request').click()
        assert page.locator('#http-status').inner_text().startswith('400')
        assert int(page.locator('#event-count').inner_text())==before+1
        page.locator('#scenario').select_option(label='Change role')
        page.locator('#send-request').click()
        assert page.locator('#http-status').inner_text().startswith('200')
        snapshot=page.evaluate('window.__studioSnapshot()')
        customer=customer_from_snapshot(context,snapshot)
        try:
            customer.evaluate('location.hash="#/approvals"')
            assert customer.locator('.role-indicator').inner_text()=='Approver'
            assert customer.locator('#op-reviewer-person').count()==0
        finally:customer.close()
        page.locator('#scenario').select_option(label='Change tool schema')
        page.locator('#send-request').click()
        assert page.locator('#http-status').inner_text().startswith('200')
        snapshot=page.evaluate('window.__studioSnapshot()')
        assert snapshot['tools'][0]['schemaVersion']==2
        assert not snapshot['tools'][0]['approved']
        customer=customer_from_snapshot(context,snapshot)
        try:
            customer.evaluate('location.hash="#/catalog"')
            customer.locator('[data-action="catalog-tab"][data-value="tools"]').click()
            customer.locator('[data-action="op-open-tool"][data-id="t1"][data-mobile-tool="true"]' if width<=670 else 'button.row-link[data-action="op-open-tool"][data-id="t1"]').first.click()
            assert 'Needs review' in customer.locator('.drawer').inner_text()
            assert customer.locator('[data-action="op-schema-change"]').count()==0
        finally:customer.close()
        # A connection is confirmed only after the new agent sends a request with its key.
        token=page.evaluate('''async()=>{
          const issued=await mintLocalCredential(),backend=createMockBackend(),snapshot=backend.read(),state=snapshot.state;
          const agent={...state.agents[0],id:'new-connection-test',name:'New connection test',mode:'observe',
            connections:['A'],requests:0,spent:0,connectionCheck:{status:'pending',verifiedAt:null,traceId:null}};
          state.agents.push(agent);
          state.credentials[agent.id]={version:1,revoked:0,issuedTotal:0,active:[]};
          stageCredential(state.credentials,agent.id,issued.record);
          backend.save(state,snapshot.revision);
          return issued.token;
        }''')
        payload={'agentId':'new-connection-test','model':'GPT-6','userRole':'none','action':'First connection check'}
        page.locator('#scenario').select_option(label='Model request')
        page.locator('#payload').fill(json.dumps(payload))
        page.locator('#agent-token').fill('gov_test_'+'0'*48)
        page.locator('#send-request').click()
        assert page.locator('#http-status').inner_text().startswith('401')
        assert page.evaluate("window.__studioSnapshot().agents.find(a=>a.id==='new-connection-test').connectionCheck.status")=='pending'
        page.locator('#agent-token').fill(token)
        page.locator('#send-request').click()
        assert page.locator('#http-status').inner_text().startswith('201')
        fresh=page.evaluate('window.__studioSnapshot()')
        connected=next(a for a in fresh['agents'] if a['id']=='new-connection-test')
        assert connected['connectionCheck']['status']=='verified'
        assert connected['connectionCheck']['traceId']
        customer=customer_from_snapshot(context,fresh)
        try:
            customer.evaluate('location.hash="#/agent/new-connection-test"')
            assert 'First request received' in customer.locator('.agent-connection-summary').inner_text()
            assert customer.locator('.agent-connection-summary a[href*="trace="]').count()==1
            assert 'Awaiting connection' not in customer.locator('.agent-connection-summary').inner_text()
        finally:customer.close()
        geo=page.evaluate('()=>({scroll:document.documentElement.scrollWidth,width:innerWidth})')
        assert geo['scroll']<=geo['width'],f'Lab overflow {width}: {geo}'
        if os.getenv('QA_SCREENSHOTS'):
            output=Path(os.environ['QA_SCREENSHOTS']);output.mkdir(parents=True,exist_ok=True)
            page.screenshot(path=str(output/f'request-studio-{width}.png'),full_page=True)
        assert not errors,errors
        print(f'PASS test studio POST, trace, schema, role, JSON error at {width}px',flush=True)
    finally:context.close()

def main():
    opts={'headless':True,'args':['--no-sandbox']}
    chromium=shutil.which('chromium') or shutil.which('chromium-browser')
    if chromium:opts['executable_path']=chromium
    with sync_playwright() as p:
        browser=p.chromium.launch(**opts)
        try:
            for width in (1100,390):exercise(browser,width)
        finally:browser.close()
if __name__=='__main__':main()
