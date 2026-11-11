import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanState, safeReadState, agentById, hasConnection, previewImpact, appendScenario, changeMode, decideApproval, toggleConnection, formatUSD, escapeHTML, safeId, nextTraceId } from '../src/domain.js';

test('seed state resets on every new creation', () => {
  const a=cleanState(), b=cleanState();
  a.agents[0].name='Changed';
  assert.equal(b.agents[0].name,'Atlas Support');
});
test('A is on by default and B/C can be individually absent', () => {
  const s=cleanState();
  assert.deepEqual(agentById(s,'invoice').connections,['A']);
  assert.equal(hasConnection(agentById(s,'atlas'),'B'),true);
  assert.equal(hasConnection(agentById(s,'ops'),'C'),false);
});
test('Observe mode records a simulated policy denial without enforcing it', () => {
  const s=cleanState();
  const e=appendScenario(s,{agentId:'atlas',channel:'inference'});
  assert.equal(e.status,'would_block');assert.match(e.reason,/recorded, not blocked/);
  assert.equal(e.kind,'inference');
});
test('Enforce mode blocks a critical tool on the connected MCP channel',()=>{
  const s=cleanState();changeMode(s,'atlas','enforce');
  const e=appendScenario(s,{agentId:'atlas',channel:'tool'});
  assert.equal(e.status,'blocked');assert.equal(e.evidence,true);
});
test('Without B, actual tool execution remains outside gateway even with Enforce enabled',()=>{
  const s=cleanState();changeMode(s,'invoice','enforce');
  const e=appendScenario(s,{agentId:'invoice',channel:'tool'});
  assert.equal(e.status,'outside');assert.equal(e.evidence,false);
});
test('Suspending A-only agent must not imply local tools were blocked',()=>{
  const s=cleanState();changeMode(s,'invoice','suspended');
  assert.equal(appendScenario(s,{agentId:'invoice',channel:'tool'}).status,'outside');
  assert.equal(appendScenario(s,{agentId:'invoice',channel:'inference'}).status,'blocked');
});
test('A+C is possible, and B toggle does not remove A',()=>{
  const s=cleanState();toggleConnection(s,'invoice','C');
  assert.deepEqual(agentById(s,'invoice').connections,['A','C']);
  toggleConnection(s,'invoice','B');
  assert.deepEqual(agentById(s,'invoice').connections,['A','B','C']);
  assert.equal(toggleConnection(s,'invoice','A'),false);
});
test('Preview count comes only from simulated would-block events for the chosen agent',()=>{
  const s=cleanState();
  const impact=previewImpact(s,'atlas');assert.equal(impact.count,1);assert.ok(impact.actions.includes('Delete customer record'));
});
test('Approvals require the approver role',()=>{
  const s=cleanState();
  assert.equal(decideApproval(s,'APR-201','approved'),false);
  assert.equal(s.approvals[0].status,'pending');
  s.role='approver';
  assert.equal(decideApproval(s,'APR-201','approved'),true);
  assert.equal(s.approvals[0].status,'approved');
  assert.equal(decideApproval(s,'APR-201','approved'),false);
});
test('Approvals cannot proceed if B is disconnected',()=>{
  const s=cleanState();s.role='approver';toggleConnection(s,'atlas','B');
  assert.equal(decideApproval(s,'APR-201','approved'),false);
  assert.equal(s.approvals[0].status,'pending');
});
test('Auditor has no write or approval authority',()=>{
  const s=cleanState();s.role='auditor';
  assert.equal(decideApproval(s,'APR-201','rejected'),false);
  // Visual control restrictions are tested separately in the page renderer.
});
test('Each simulated trace receives a distinct ID',()=>{
  const s=cleanState();const prev=nextTraceId(s);
  appendScenario(s,{agentId:'atlas'});
  const next=nextTraceId(s);
  assert.notEqual(prev,next);
});
test('State corrupted in storage falls back to safe fixture data',()=>{
  assert.equal(safeReadState('not json').agents.length,3);
  assert.equal(safeReadState('{}').agents.length,3);
  assert.equal(safeReadState(JSON.stringify({...cleanState(),role:'root',theme:'untrusted'})).role,'operator');
  assert.equal(safeReadState(JSON.stringify({...cleanState(),role:'root',theme:'untrusted'})).theme,'forest');
});
test('Text content and dynamic IDs are sanitized',()=>{
  assert.equal(escapeHTML(`<img src=x onerror="evil()">`),'&lt;img src=x onerror=&quot;evil()&quot;&gt;');
  assert.equal(safeId(' New Agent @ 1 '),'new-agent-1');
});
test('Budget formatting always shows currency with the period defined by its UI',()=>{
  assert.equal(formatUSD(42.2),'$42.20');
});
