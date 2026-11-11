import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanState,agentById,changeMode,toggleConnection,appendScenario,
 toolOperationalStatus,catalogToolSummary,catalogIdentities } from '../src/domain.js';
import {pageCatalog,pageAgent} from '../src/views.js';
import {SEED_TOOLS} from '../src/data.js';
const ui = (tab='agents', filter='all')=>({catalogTab:tab,catalogToolFilter:filter,catalogSearch:''});
const tool=id=>SEED_TOOLS.find(t=>t.id===id);
test('Catalog expresses tools in concrete states rather than coverage percentages',()=>{
 const state=cleanState();
 const html=pageCatalog(state,ui());
 assert.match(html,/Tools/);
 assert.match(html,/People/);
 assert.match(html,/outside/);
 assert.doesNotMatch(html,/coverage index|governance score|governance percentage/i);
 assert.doesNotMatch(html,/\d+% of controls/i);
});
test('A only: all tool executions outside the gateway, regardless of agent mode',()=>{
 const state=cleanState();const agent=agentById(state,'invoice');
 changeMode(state,'invoice','enforce');
 for(const t of SEED_TOOLS.filter(t=>t.agent==='invoice')){
   assert.equal(toolOperationalStatus(agent,t).key,'outside');
 }
 assert.match(pageCatalog(state,ui('tools','outside')),/Change payment details/);
});
test('A+B partial: each tool shows its own path and independent approval',()=>{
 const state=cleanState();const agent=agentById(state,'atlas');changeMode(state,'atlas','observe');
 const local=toolOperationalStatus(agent,tool('t5'));
 const unapproved=toolOperationalStatus(agent,tool('t3'));
 const observed=toolOperationalStatus(agent,tool('t1'));
 assert.equal(local.key,'outside');
 assert.equal(unapproved.key,'review');
 assert.equal(observed.key,'observe');
 assert.match(catalogToolSummary(agent),/outside/);
 const html=pageCatalog(state,ui('tools'));
 assert.match(html,/Rules observed/);
 assert.match(html,/Needs review/);
 assert.match(html,/Outside gateway/);
 assert.match(pageCatalog(state,ui('tools','attention')),/Delete customer record/);
 assert.doesNotMatch(pageCatalog(state,ui('tools','outside')),/Search knowledge base/);
});
test('Turning B off immediately updates operational tool rows but not historical evidence',()=>{
 const state=cleanState();
 const previous=state.events.find(e=>e.id==='TRC-1042');
 assert.equal(previous.connections.includes('B'),true);
 toggleConnection(state,'atlas','B');
 assert.equal(toolOperationalStatus(agentById(state,'atlas'),tool('t1')).key,'outside');
 assert.equal(previous.connections.includes('B'),true);
 const html=pageCatalog(state,ui('tools'));
 assert.doesNotMatch(html,/Rules observed/);
 assert.match(html,/Outside gateway/);
});
test('Preset 2 without C explains required identity even when B is connected',()=>{
 const state=cleanState();const agent=agentById(state,'ops');
 assert.equal(toolOperationalStatus(agent,tool('t11')).key,'identity');
 toggleConnection(state,'ops','C');
 assert.equal(toolOperationalStatus(agent,tool('t11')).key,'checked');
});
test('Catalog identities depend on C, actual named records and missing identity',()=>{
 const state=cleanState();
 const atlas=catalogIdentities(state,'atlas');
 assert.equal(atlas.connected,true);
 assert.ok(atlas.people.some(p=>p.name==='Maya Chen'));
 assert.ok(atlas.unnamed>=0);
 const before=pageCatalog(state,ui('identities'));
 assert.match(before,/Maya Chen/);
 assert.match(before,/Connect identity/);
 const identityEvent=appendScenario(state,{agentId:'atlas',channel:'inference',toolId:'t2',userRole:'reader'});
 assert.equal(identityEvent.actor,'Eli Ramos');
 assert.ok(catalogIdentities(state,'atlas').people.some(p=>p.name==='Eli Ramos'));
 toggleConnection(state,'atlas','C');
 assert.equal(catalogIdentities(state,'atlas').connected,false);
 const after=pageCatalog(state,ui('identities'));
 assert.doesNotMatch(after,/Eli Ramos/);
 assert.ok(state.events.find(e=>e.id===identityEvent.id).connections.includes('C'));
 assert.match(after,/Connect identity/);
});
test('Catalog exposes tools and people, independent of percentage-based score',()=>{
 const s=cleanState();
 for(const combo of [['A'],['A','B'],['A','C'],['A','B','C']]){
   agentById(s,'atlas').connections=combo;
   const html=pageCatalog(s,ui('agents'));
   assert.match(html,/catalog-signals/);
   assert.match(html,/Tools/);
   assert.match(html,/People/);
   assert.doesNotMatch(html,/Coverage score|\d+% of controls/i);
 }
 assert.match(pageAgent(s,{},'atlas'),/Tools and identity/);
});
