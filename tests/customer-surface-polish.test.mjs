import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanState} from '../src/domain.js';
import {renderPage,renderDrawer,renderAppShell} from '../src/views.js';

const base=cleanState();

test('Approvals explains actual permissions without offering nonexistent role switching',()=>{
  const operator=renderPage(base,{},'approvals');
  assert.match(operator,/Approval decisions require the Approver role/);
  assert.doesNotMatch(operator,/Select that role above|role-select/);
  const auditorState=cleanState();auditorState.role='auditor';
  const auditor=renderPage(auditorState,{},'approvals');
  assert.match(auditor,/Auditor access is read-only/);
  assert.match(auditor,/cannot approve or reject/);
  assert.match(auditor,/data-action="approval-confirm"[^>]*disabled/);
  assert.doesNotMatch(auditor,/Select that role above|Approval decisions require the Approver role/);
  assert.match(renderAppShell(auditorState,{},'approvals',auditor),/class="role-indicator"[^>]*>Auditor</);
  const approverState=cleanState();approverState.role='approver';
  assert.doesNotMatch(renderPage(approverState,{},'approvals'),/Auditor access is read-only|Approval decisions require the Approver role/);
});

test('Connection capabilities have agent-scoped, contextual destinations instead of loose global navigation',()=>{
  for(const id of ['atlas','invoice']){
    const page=renderPage(base,{},'agent',id,'connections');
    const summary=page.split('<section class="card card-pad" aria-label="Connection capabilities">')[1]?.split('</section>')[0];
    assert.ok(summary,`Missing capabilities for ${id}`);
    assert.equal((summary.match(/class="text-link capability-action"/g)||[]).length,5);
    for(const url of [`#/activity/${id}`,`#/agent/${id}/rules`,`#/approvals/${id}`,`#/spending/${id}`]){
      assert.ok(summary.includes(`href="${url}"`),`Missing ${url}`);
    }
    assert.doesNotMatch(summary,/class="button-row mt-4"|href="#\/catalog"/);
    assert.match(summary,/Spending by person/);
    assert.match(summary,/View spending/);
    assert.match(summary,/For identified requests|Not connected/);
  }
  const css=readFileSync(new URL('../src/styles/app.css',import.meta.url),'utf8');
  assert.match(css,/\.capability-action\s*\{/);
});

test('Evidence help talks about observable retention status, not a future backend roadmap',()=>{
  const ui={drawer:{kind:'explainer',id:'audit'}};
  const drawer=renderDrawer(base,ui);
  assert.match(drawer,/retention status remains Not verified/);
  assert.doesNotMatch(drawer,/target backend will|future backend|simulated proof/);
  const preset=renderDrawer(base,{drawer:{kind:'explainer',id:'preset1'}});
  assert.match(preset,/In Observe mode/);
  assert.doesNotMatch(preset,/The real backend|Discovery mode/);
});
