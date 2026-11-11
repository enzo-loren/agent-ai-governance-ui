import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanState,agentById,toggleConnection} from '../src/domain.js';
import {pageCatalog,pageConnections,pageAgent,renderAppShell} from '../src/views.js';
const baseUi={catalogTab:'agents',catalogSearch:'',connectionSearch:'',catalogAgentLimit:24,connectionLimit:24};
const matchCount=(html,re)=>(html.match(re)||[]).length;
test('Catalog and Connections use the same search-and-card selection pattern',()=>{
 const state=cleanState();
 const catalog=pageCatalog(state,{...baseUi});
 const connections=pageConnections(state,{...baseUi});
 assert.match(catalog,/agent-grid/);assert.match(connections,/agent-grid/);
 assert.match(connections,/id="connection-search"/);
 assert.match(connections,/href="#\/agent\/atlas\/connections"/);
 assert.doesNotMatch(connections,/<select[^>]*id="integration-agent"/);
 assert.match(pageAgent(state,baseUi,'atlas','connections'),/aria-current="page">Connections/);
});
test('100+ agents: initially show 24 and filter by owner, team or name',()=>{
 const state=cleanState();
 for(let i=0;i<105;i++){state.agents.push({...structuredClone(state.agents[1]),id:`team-${i}`,name:`Agent ${i}`,owner:i===87?'Unique Owner':'Shared Owner',team:i===74?'Special Division':'Sales'});}
 const initial=pageConnections(state,{...baseUi});
 assert.equal(matchCount(initial,/class="card agent-card"/g),24);
 assert.match(initial,/24 of 108 agents/);
 assert.match(initial,/show-more-connections/);
 const batch=pageConnections(state,{...baseUi,connectionLimit:48});
 assert.equal(matchCount(batch,/class="card agent-card"/g),48);
 const owner=pageConnections(state,{...baseUi,connectionSearch:'Unique Owner'});
 assert.equal(matchCount(owner,/class="card agent-card"/g),1);
 assert.match(owner,/Agent 87/);
 assert.match(pageConnections(state,{...baseUi,connectionSearch:'Special Division'}),/Agent 74/);
 assert.match(pageConnections(state,{...baseUi,connectionSearch:'no-match'}),/No matching agents/);
 assert.equal(matchCount(pageCatalog(state,{...baseUi}),/class="card agent-card"/g),24);
});
test('Connection labels stay descriptive and appear without internal A/B/C shorthand',()=>{
 const state=cleanState();
 for(const combination of [['A'],['A','B'],['A','C'],['A','B','C']]){
  agentById(state,'atlas').connections=combination;
  for(const html of [pageCatalog(state,baseUi),pageConnections(state,baseUi),pageAgent(state,baseUi,'atlas','connections'),pageAgent(state,baseUi,'atlas')]){
    assert.doesNotMatch(html,/>[ABC]<\/span>/);
    assert.doesNotMatch(html,/\b(?:connection [ABC]\b|[ABC]\+[ABC]\b)/i);
  }
  const details=pageAgent(state,baseUi,'atlas','connections');
  assert.match(details,/Model requests/);assert.match(details,/Tool execution/);assert.match(details,/User identity/);
 }
});
test('The selected agent stays bound to connection controls and history does not change',()=>{
 const state=cleanState();const evidence=state.events.find(e=>e.id==='TRC-1042');
 const before=pageAgent(state,baseUi,'invoice','connections');
 assert.match(before,/data-agent="invoice"/);
 assert.doesNotMatch(before,/data-agent="atlas"/);
 toggleConnection(state,'invoice','B');
 assert.match(pageAgent(state,baseUi,'invoice','connections'),/4 outside/);
 assert.ok(evidence.connections.includes('B'));
});
test('Sidebar uses Connections and keeps legacy integrations route readable',()=>{
 const state=cleanState();
 const html=renderAppShell(state,baseUi,'connections',pageConnections(state,baseUi));
 assert.match(html,/href="#\/connections"/);
 assert.doesNotMatch(html,/href="#\/integrations"/);
});
