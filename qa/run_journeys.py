#!/usr/bin/env python3
"""Browser-level UX contract audit for the static preview.

Runs against the exact source modules joined into a single inline script because
network and file navigation may be blocked in restricted test environments.
A 'gap' case passes when an explicitly absent requirement remains absent; it
never counts as a successfully implemented product flow.
"""
from __future__ import annotations
import json
from pathlib import Path
import re
import sys
import os
import shutil
from typing import Any
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SPEC=ROOT/'qa'/'journeys.json'


def inline_document(root=ROOT):
    modules=[]
    for name in ('mock/fixtures','data','domain','mock/backend','router','icons','operations','views','app'):
        text=(root/'src'/f'{name}.js').read_text()
        text=re.sub(r'^import\s+\{[^\n]+\}\s+from\s+[^\n]+;\s*','',text,flags=re.M)
        text=re.sub(r'\bexport\s+(?=(?:const|function|class)\b)','',text)
        text=re.sub(r'^export\s*\{[^\n]+\}\s*from\s*[^\n]+;','',text,flags=re.M)
        text=re.sub(r'^export\s*\{[^\n]+\};','',text,flags=re.M)
        if name=='operations':text='const e=escapeHTML;\n'+text
        if name=='views':text='const esc=escapeHTML; const I=icon;\n'+text
        modules.append(text)
    code='\n'.join(modules)+'\nwindow.__uiAudit=()=>({state,ui,hash:location.hash});'
    styles='\n'.join((root/'src/styles'/p).read_text() for p in ('tokens.css','app.css'))
    return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>{styles}</style></head><body><a class="skip-link" href="#main">Skip to content</a><div id="app"></div><div id="announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div><script>{code}</script></body></html>'


def run_one(context,case,document):
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    measured=0
    log=[]
    try:
        if case.get('viewport'):page.set_viewport_size(case['viewport'])
        page.set_content(document,wait_until='load')
        if case.get('setup'):page.evaluate(case['setup'])
        assert page.locator('h1').count()>0, 'The home view did not render'
        assert page.evaluate('location.hash') in ('','#/home'), 'Not at home'
        initial=page.evaluate('window.__uiAudit().state')
        for i,step in enumerate(case.get('actions',[]),1):
            kind=step['do'];selector=step.get('selector','')
            if kind=='click':page.locator(selector).click(timeout=3500)
            elif kind=='fill':page.locator(selector).fill(step['value'],timeout=3500)
            elif kind=='select':page.locator(selector).select_option(step['value'],timeout=3500)
            elif kind=='press':page.locator(selector).press(step['key'],timeout=3500)
            else:raise AssertionError('Unknown action '+kind)
            # Hash navigation dispatches asynchronously; wait for the next render tick.
            page.wait_for_timeout(35)
            measured+=1;log.append(f'{i}. {kind} {selector or ""}'.strip())
        for check in case.get('checks',[]):
            typ=check['type'];sel=check.get('selector')
            if typ=='visible':assert page.locator(sel).count()>0 and page.locator(sel).first.is_visible(),f'Not visible: {sel}'
            elif typ=='absent':assert page.locator(sel).count()==0,f'Unexpectedly present: {sel}'
            elif typ=='disabled':assert page.locator(sel).is_disabled(),f'Not disabled: {sel}'
            elif typ=='enabled':assert page.locator(sel).is_enabled(),f'Not enabled: {sel}'
            elif typ=='text':assert check['contains'] in page.locator(sel).inner_text(),f'Text missing in {sel}: {check["contains"]}'
            elif typ=='url':assert page.evaluate('location.hash')==check['value'],f'Wrong URL: {page.evaluate("location.hash")}'
            elif typ=='state':
                val=page.evaluate('''([path])=>path.split('.').reduce((a,k)=>a?.[k],window.__uiAudit())''',[check['path']])
                assert val==check['equals'],f'State {check["path"]}: got {val!r}, wanted {check["equals"]!r}'
            elif typ=='state-unchanged':
                current=page.evaluate('window.__uiAudit().state')
                assert current[check['key']]==initial[check['key']],f'State mutated: {check["key"]}'
            elif typ=='count':assert page.locator(sel).count()==check['equals'],f'Count {sel}: {page.locator(sel).count()} not {check["equals"]}'
            elif typ=='no-overflow':
                metrics=page.evaluate('''()=>({scroll:document.documentElement.scrollWidth,view:innerWidth})''')
                assert metrics['scroll']<=metrics['view'],f'overflow {metrics}'
            else:raise AssertionError('Unknown check '+typ)
        assert not errors,f'Browser errors: {errors}'
        return {'id':case['id'],'status':case['status'],'result':'as_expected','actionsFromHome':measured,'stepsToCompletion':measured if case['status']=='ui-working' else None,'stepsToBlocker':measured if case['status']!='ui-working' else None,'steps':log}
    except Exception as e:
        return {'id':case['id'],'status':case['status'],'result':'failed','actionsFromHome':measured,'error':str(e),'steps':log,'browserErrors':errors}
    finally:page.close()


def run_batch(start,end):
    cases=json.loads(SPEC.read_text())['journeys'][start:end]
    document=inline_document()
    with sync_playwright() as p:
        browser_executable=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
        opts={'headless':True,'args':['--no-sandbox']}
        if browser_executable:opts['executable_path']=browser_executable
        browser=p.chromium.launch(**opts)
        try:
            context=browser.new_context(viewport={'width':1280,'height':900})
            try:return [run_one(context,case,document) for case in cases]
            finally:context.close()
        finally:browser.close()


def main():
    if len(sys.argv)>=4 and sys.argv[1]=='--worker':
        print(json.dumps(run_batch(int(sys.argv[2]),int(sys.argv[3])),ensure_ascii=False))
        return 0
    # The wrapper launches each batch as a separate OS process to avoid accumulating
    # Chromium contexts on long audits, then merges an exact ordered result set.
    os.execvp('bash',['bash',str(ROOT/'qa/run_all.sh')])

if __name__=='__main__':sys.exit(main())
