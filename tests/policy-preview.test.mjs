import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanState,agentById} from '../src/domain.js';
import {pageAgent,pageRules,renderModal} from '../src/views.js';

const ui={requestUser:'operator'};
const card=(html,id)=>html.match(new RegExp(`<button[^>]*data-action="choose-preset"[^>]*data-value="${id}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0];

test('Choosing another policy renders a preview and leaves the active policy intact',()=>{
  const state=cleanState();
  const original=agentById(state,'atlas').preset;
  const initial=pageRules(state,ui,'atlas',true);
  assert.equal(original,2);
  assert.match(card(initial,2),/Active/);
  assert.doesNotMatch(initial,/data-action="review-policy-change"/);
  const preview=pageRules(state,{...ui,policyPreview:{agentId:'atlas',preset:3}},'atlas',true);
  assert.match(preview,/Previewing Strict/);
  assert.match(preview,/Current policy: Role-based/);
  assert.match(preview,/No changes have been applied/);
  assert.match(preview,/If this policy is applied/);
  assert.match(card(preview,2),/Active/);
  assert.match(card(preview,3),/aria-pressed="true"/);
  assert.match(preview,/data-action="review-policy-change"[^>]*data-id="atlas" data-value="3"/);
  assert.doesNotMatch(preview,/data-action="confirm-preset"/);
  assert.equal(agentById(state,'atlas').preset,original);
});

test('Policy preview is bound to the selected agent and missing connections reflect the previewed policy',()=>{
  const state=cleanState();
  const invoice=agentById(state,'invoice');
  assert.equal(invoice.preset,1);
  const preview=pageRules(state,{...ui,policyPreview:{agentId:'invoice',preset:2}},'invoice',true);
  assert.match(preview,/Previewing Role-based/);
  assert.match(preview,/This policy needs another connection/);
  assert.match(preview,/Writes require user identity/);
  assert.match(preview,/Critical execution requires routed tool calls/);
  assert.equal(invoice.preset,1);
  const differentAgent=pageRules(state,{...ui,policyPreview:{agentId:'invoice',preset:2}},'atlas',true);
  assert.doesNotMatch(differentAgent,/Previewing Role-based/);
  assert.doesNotMatch(differentAgent,/data-action="review-policy-change"/);
});

test('An auditor can explore candidate policies but cannot apply them',()=>{
  const state=cleanState();state.role='auditor';
  const preview=pageRules(state,{...ui,policyPreview:{agentId:'atlas',preset:3}},'atlas',true);
  assert.match(preview,/Previewing Strict/);
  for(const id of [1,2,3])assert.doesNotMatch(card(preview,id),/\bdisabled\b/);
  assert.match(preview,/data-action="review-policy-change"[^>]*disabled/);
  assert.equal(agentById(state,'atlas').preset,2);
});

test('Policy change confirmation names the agent and both policies, including Observe semantics',()=>{
  const state=cleanState();
  const enforce=renderModal(state,{modal:{kind:'policy-change',id:'atlas',preset:3}});
  assert.match(enforce,/Apply policy to this agent/);
  assert.match(enforce,/Current policy:.*Role-based/);
  assert.match(enforce,/New policy:.*Strict/);
  assert.match(enforce,/subsequent requests through the gateway/);
  assert.match(enforce,/data-action="confirm-preset"/);
  const observe=renderModal(state,{modal:{kind:'policy-change',id:'invoice',preset:2}});
  assert.match(observe,/policy denials remain in Observe/);
  assert.equal(agentById(state,'invoice').preset,1);
});

test('Request as is a full-width labeled select in agent and Rules screens',()=>{
  const state=cleanState();
  for(const html of [pageAgent(state,ui,'atlas'),pageRules(state,ui,'atlas',true)]){
    assert.match(html,/<label class="request-user" for="request-user">/);
    assert.match(html,/<span class="request-user-field"><select id="request-user"/);
    assert.match(html,/<option value="none"[^>]*>No user identity/);
  }
  const css=readFileSync(new URL('../src/styles/app.css',import.meta.url),'utf8');
  assert.match(css,/\.request-user-field select\{[^}]*width:100%/);
  assert.match(css,/\.request-user-field select\{[^}]*appearance:none/);
  assert.match(css,/\.request-user-field:focus-within/);
});
