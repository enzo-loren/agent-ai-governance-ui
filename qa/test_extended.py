from run_journeys import inline_document
from playwright.sync_api import sync_playwright

def run(page,name,fn):
 errors=[]
 page.set_default_timeout(5000)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_document(),wait_until='load')
 try:
  fn(page)
  assert not errors,errors
  print('PASS',name)
 except Exception as ex:
  print('FAIL',name,repr(ex),'errors',errors)

  raise

def sel(page,key):return page.locator(key)

def tool(p):
 sel(p,'a.nav-link[href="#/catalog"]').click()
 sel(p,'[data-action="catalog-tab"][data-value="tools"]').click()
 sel(p,'[data-action="catalog-tool-filter"][data-value="attention"]').click()
 sel(p,'button.row-link[data-action="op-open-tool"][data-id="t3"]').click()
 assert 'Delete customer record' in sel(p,'.drawer').inner_text()
 sel(p,'#op-tool-form [name=decision]').select_option('approved')
 sel(p,'#op-tool-form button[type=submit]').click()
 assert sel(p,'.modal [data-action=op-confirm-tool]').count()==1
 sel(p,'.modal [data-action=op-confirm-tool]').click()
 assert p.evaluate('window.__uiAudit().state.tools.find(t=>t.id==="t3").approved')
 assert p.evaluate('window.__uiAudit().state.changes.length')==1
 sel(p,'button.row-link[data-action="op-open-tool"][data-id="t3"]').click()
 assert 'approved' in sel(p,'.drawer').inner_text()
 

def rules(p):
 sel(p,'a.nav-link[href="#/rules"]').click()
 sel(p,'a[href="#/agent/atlas/rules"].btn').click()
 sel(p,'[data-action="op-create-rule"]').click()
 sel(p,'#op-rule-form [name=toolId]').select_option('t4')
 sel(p,'#op-rule-form [name=type]').select_option('Critical')
 sel(p,'#op-rule-form [name=parameter]').fill('amount')
 sel(p,'#op-rule-form button[type=submit]').click()
 assert p.evaluate('window.__uiAudit().state.rules.length')==1
 assert sel(p,'[data-action="op-rule-test"]').count()==0
 assert 'amount > ' in sel(p,'main').inner_text()

def agent(p):
 sel(p,'a.agent-name[href="#/agent/atlas"]').click()
 sel(p,'[data-action="op-edit-agent"]').click()
 sel(p,'#op-agent-form [name=owner]').fill('New Owner')
 sel(p,'#op-agent-form button[type=submit]').click()
 assert p.evaluate('window.__uiAudit().state.agents[0].owner')=='New Owner'
 sel(p,'[data-action="op-models"]').click()
 sel(p,'#op-models-form input[value="Claude Sonnet"]').uncheck()
 sel(p,'#op-models-form button[type=submit]').click()
 assert p.evaluate('window.__uiAudit().state.agents[0].allowedModels')==['GPT-6']
 sel(p,'[data-action="op-rotate-token"]').click()
 sel(p,'[data-action="op-confirm-agent-action"]').click()
 assert p.evaluate('window.__uiAudit().state.credentials.atlas.version')==2

def conn(p):
 sel(p,'a.nav-link[href="#/connections"]').click()
 sel(p,'a[href="#/agent/atlas/connections"].btn').click()
 sel(p,'[data-action="op-mcp"]').click()
 sel(p,'#op-mcp-form [name=toolId]').select_option('t1')
 sel(p,'#op-mcp-form [name=control]').select_option('A')
 sel(p,'#op-mcp-form button[type=submit]').click()
 assert p.evaluate('window.__uiAudit().state.tools.find(x=>x.id==="t1").control')=='A'
 sel(p,'[data-action="op-identity"]').click()
 sel(p,'#op-identity-form [name=audience]').fill('production-sample')
 sel(p,'#op-identity-form button[type=submit]').click()
 assert p.evaluate('window.__uiAudit().state.identityConfig.atlas.verified')==False

def approval(p):
 p.evaluate("state.role='approver';render();")
 sel(p,'a.nav-link[href="#/approvals"]').click()
 sel(p,'[data-action="op-approval-details"][data-id="APR-201"]').click()
 assert 'masked' in sel(p,'.drawer').inner_text()
 sel(p,'[data-action="close-overlay"]').last.click()
 assert sel(p,'#op-reviewer-person').count()==0
 assert sel(p,'[data-action="approval-confirm"][data-id="APR-201"][data-value="approved"]').is_enabled()
 sel(p,'[data-action="approval-confirm"][data-id="APR-201"][data-value="approved"]').click()
 sel(p,'#approval-comment').fill('Checked')
 sel(p,'[data-action="confirm-approval"][data-id="APR-201"]').click()
 assert p.evaluate('window.__uiAudit().state.approvals[0].comment')=='Checked'

def spending(p):
 sel(p,'a.nav-link[href="#/spending"]').click()
 sel(p,'[data-action="op-limits"][data-id="atlas"]').click()
 sel(p,'#op-limits-form [name=rpm]').fill('120')
 sel(p,'#op-limits-form [name=action]').select_option('throttle')
 sel(p,'#op-limits-form button[type=submit]').click()
 assert p.evaluate('window.__uiAudit().state.limits.atlas.rpm')==120
 sel(p,'[data-action="op-tariffs"]').click()
 sel(p,'#op-tariffs-form button[type=submit]').click()
 assert p.evaluate('window.__uiAudit().state.changes.length')==2

def audit(p):
 sel(p,'a.nav-link[href="#/audit"]').click()
 sel(p,'[data-action="op-audit-toggle-filters"]').click()
 sel(p,'#audit-model').select_option('GPT-6')
 sel(p,'#audit-channel').select_option('inference')
 sel(p,'#audit-user').fill('Maya')
 assert sel(p,'table tbody tr').count()>0
 sel(p,'[data-action="op-audit-mode"][data-value="changes"]').click()
 assert 'Administrative changes' in sel(p,'main').inner_text()
 sel(p,'[data-action="op-audit-mode"][data-value="events"]').click()
 sel(p,'button.row-link[data-action="open-event"]').first.click()
 sel(p,'[data-action="op-transaction"]').click()
 assert 'Request timeline' in sel(p,'.drawer').inner_text()
 sel(p,'[data-action="op-immutability"]').click()
 assert 'Not verified' in sel(p,'.modal').inner_text()

def activity(p):
 sel(p,'a.nav-link[href="#/activity"]').click()
 sel(p,'#activity-user').fill('Maya')
 sel(p,'#activity-channel').select_option('inference')
 assert sel(p,'[data-action="activity-pause"]').count()==0
 assert sel(p,'[data-action="op-add-sample-event"]').count()==0
 assert sel(p,'table tbody tr').count()>0

def presentation(p):
 sel(p,'[data-action="op-presentation"]').click()
 assert sel(p,'.presentation-view').count()==1
 sel(p,'[data-action="op-presentation"]').click()
 assert sel(p,'.presentation-view').count()==0

if __name__=='__main__':
 with sync_playwright() as pl:
  browser=pl.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':__import__('shutil').which('chromium')} if __import__('shutil').which('chromium') else {}))
  for name,fn in [('tool',tool),('rules',rules),('agent',agent),('conn',conn),('approval',approval),('spending',spending),('audit',audit),('activity',activity)]:
   ctx=browser.new_context(viewport={'width':1100,'height':900})
   try:run(ctx.new_page(),name,fn)
   finally:ctx.close()
  browser.close()
