import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockBackend,MemoryStorage,BackendConflictError,MOCK_STORAGE_KEY,LEGACY_STORAGE_KEY} from '../src/mock/backend.js';
import {cleanState,appendScenario,saveCedarDraft,toolById,reviseTool} from '../src/domain.js';
import {SEED_EVENTS,SEED_APPROVALS} from '../src/mock/fixtures.js';

const storage=()=>new MemoryStorage();
test('mock backend loads deterministic fixtures, and gives every reader an isolated snapshot',()=>{
  const db=createMockBackend(storage());
  const first=db.read();
  assert.equal(first.revision,0);
  assert.equal(first.state.agents[0].id,'atlas');
  first.state.agents[0].name='altered without save';
  assert.equal(db.read().state.agents[0].name,'Atlas Support');
});
test('mock backend commits changes without leaking references and survives a new adapter',()=>{
  const s=storage(),db=createMockBackend(s),initial=db.read();
  initial.state.agents[0].owner='Updated owner';
  const saved=db.save(initial.state,initial.revision);
  assert.equal(saved.revision,1);
  initial.state.agents[0].owner='unsaved mutation';
  assert.equal(createMockBackend(s).read().state.agents[0].owner,'Updated owner');
  const raw=JSON.parse(s.getItem(MOCK_STORAGE_KEY));
  assert.equal(raw.schemaVersion,3);
  assert.equal(raw.revision,1);
});
test('two browser tabs cannot silently overwrite one another',()=>{
  const s=storage(),one=createMockBackend(s),two=createMockBackend(s);
  const a=one.read(),b=two.read();
  a.state.agents[0].budget=91;
  one.save(a.state,a.revision);
  b.state.agents[0].budget=12;
  assert.throws(()=>two.save(b.state,b.revision),BackendConflictError);
  assert.equal(two.read().state.agents[0].budget,91);
});
test('mock backend rejects corrupted relationships rather than persisting them',()=>{
  const db=createMockBackend(storage());
  const {state,revision}=db.read();
  state.tools[0].agent='unregistered';
  assert.throws(()=>db.save(state,revision),/Unknown agent/);
  assert.equal(db.read().revision,0);
});
test('legacy v2 saved workspace migrates without dropping agent edits',()=>{
  const s=storage(),legacy=cleanState();legacy.agents[0].owner='Original customer change';
  delete legacy.cedarDrafts;
  s.setItem(LEGACY_STORAGE_KEY,JSON.stringify(legacy));
  const db=createMockBackend(s);const migrated=db.read();
  assert.equal(migrated.state.agents[0].owner,'Original customer change');
  assert.deepEqual(migrated.state.cedarDrafts,[]);
  assert.ok(migrated.state.events.some(ev=>ev.id==='TRC-1033'));
  const saved=db.save(migrated.state,migrated.revision);
  assert.equal(saved.revision,1);
  assert.equal(JSON.parse(s.getItem(MOCK_STORAGE_KEY)).schemaVersion,3);
});
test('fixture references are internally coherent and tool requests do not carry model cost',()=>{
  const events=new Map(SEED_EVENTS.map(ev=>[ev.id,ev]));
  assert.equal(events.size,SEED_EVENTS.length);
  for(const p of SEED_APPROVALS){
    assert.ok(events.has(p.trace),`orphan approval: ${p.id}`);
    assert.equal(events.get(p.trace).agent,p.agent);
    assert.ok(events.get(p.trace).action.startsWith(p.action.split(' · ')[0]));
  }
  assert.ok(SEED_EVENTS.filter(ev=>ev.kind==='tool').every(ev=>ev.cost===0));
  assert.equal(events.get('TRC-1044').modeAtEvent,'observe');
});
test('Cedar text is a non-executable draft; parameter rules remain a separate operation',()=>{
 const state=cleanState();
 const before=state.rules.length;
 const created=saveCedarDraft(state,'atlas','forbid (principal, action, resource) when { context.amount > 10 };');
 assert.equal(created.draft.status,'draft');
 assert.equal(state.cedarDrafts.length,1);
 assert.equal(state.rules.length,before);
 assert.ok(!state.rules.some(r=>r.raw));
 assert.equal(saveCedarDraft(state,'atlas','invalid text').error.includes('Draft'),true);
 assert.equal(state.cedarDrafts.length,1);
});
test('new inference updates request count and aggregate spend, tool execution does not',()=>{
 const state=cleanState(),agent=state.agents[0];
 const before={requests:agent.requests,spent:agent.spent};
 const inference=appendScenario(state,{agentId:'atlas',channel:'inference',toolId:'t1'});
 assert.equal(agent.requests,before.requests+1);
 assert.equal(agent.spent,Number((before.spent+inference.cost).toFixed(6)));
 const tool=appendScenario(state,{agentId:'atlas',channel:'tool',toolId:'t1'});
 assert.equal(tool.cost,0);
 assert.equal(agent.requests,before.requests+1);
});
