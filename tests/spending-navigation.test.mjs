import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanState} from '../src/domain.js';
import {pageSpending,pageActivity,pageAudit} from '../src/views.js';
import {renderSpendingOperations} from '../src/operations.js';

const ui={spendingLimit:24,personLimit:24,activityChannel:'inference',activityModel:'GPT-6',activityUser:'Maya Chen',auditMode:'events',auditLimit:30};

test('spending offers explicit agent-specific investigations, not just numbers',()=>{
  const state=cleanState();
  const global=pageSpending(state,ui);
  assert.match(global,/href="#\/spending\/atlas" class="agent-name"/);
  assert.match(global,/Investigate usage/);
  assert.match(global,/data-action="spending-person-requests" data-id="atlas" data-person="Maya Chen"/);
  assert.doesNotMatch(global,/data-action="spending-person-requests" data-id="atlas" data-person="No user identity"/);
  const detail=pageSpending(state,ui,'atlas');
  assert.match(detail,/Investigate Atlas Support/);
  assert.match(detail,/href="#\/audit\/atlas"/);
  assert.match(detail,/href="#\/agent\/atlas\/rules"/);
  assert.match(detail,/data-action="spending-trace" data-id="TRC-1044" data-agent="atlas"/);
  assert.match(detail,/partial history/);
});

test('model breakdown leads to model-filtered Activity instead of a read-only sum',()=>{
  const state=cleanState();
  const ops=renderSpendingOperations(state,ui,'atlas');
  assert.match(ops,/data-action="spending-model-requests" data-id="atlas" data-model="GPT-6"/);
  const activity=pageActivity(state,ui,'atlas');
  assert.match(activity,/id="activity-model"/);
  assert.match(activity,/option value="GPT-6" selected/);
  assert.match(activity,/href="#\/spending\/atlas"/);
});

test('audit permits a cost trace investigation and a return to agent spending',()=>{
  const state=cleanState();
  const audit=pageAudit(state,{...ui,auditSearch:'TRC-1044'},'atlas');
  assert.match(audit,/id="audit-search"/);
  assert.match(audit,/value="TRC-1044"/);
  assert.match(audit,/data-action="open-event" data-id="TRC-1044"/);
  assert.match(audit,/href="#\/spending\/atlas"/);
});

test('spending alerts offer investigate action, but auditor cannot edit limits',()=>{
  const state=cleanState();
  const ops=renderSpendingOperations(state,ui);
  assert.match(ops,/data-action="op-spending-alerts"/);
  state.role='auditor';
  const readOnly=renderSpendingOperations(state,ui);
  assert.doesNotMatch(readOnly,/data-action="op-limits"/);
});
