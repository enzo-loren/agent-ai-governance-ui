import test from 'node:test';
import assert from 'node:assert/strict';
import {createTestApi,TEST_ENDPOINTS} from '../src/mock/test-api.js';
import {createMockBackend,MemoryStorage} from '../src/mock/backend.js';
import {mintLocalCredential,stageCredential,revokeLocalCredential} from '../src/mock/credentials.js';
import {agentConnectionStatus} from '../src/domain.js';

const fresh=()=>{
 const repository=createMockBackend(new MemoryStorage());
 return {api:createTestApi(repository),repository};
};
test('Test transport shares the same workspace repository as the customer pages',()=>{
 const {api,repository}=fresh();
 const before=repository.read().state.agents[0];
 const response=api.post('/v1/model-requests',{agentId:'atlas',model:'GPT-6',userRole:'operator',toolId:'t1',parameters:{amount:8}});
 assert.equal(response.status,201);assert.match(response.body.trace_id,/^TRC-/);
 const after=repository.read().state;
 assert.equal(after.events[0].id,response.body.trace_id);
 assert.equal(after.agents[0].requests,before.requests+1);
 assert.ok(after.agents[0].spent>before.spent);
 assert.equal(after.events[0].source,'test-console');
});
test('Requests outside routed gateway do not claim execution control or bill a model',()=>{
 const {api,repository}=fresh();
 const result=api.post('/v1/tool-invocations',{agentId:'atlas',toolId:'t5',userRole:'none'});
 assert.equal(result.status,201);assert.equal(result.body.decision,'outside');
 assert.equal(result.body.cost_usd,0);
 const ev=repository.read().state.events[0];assert.equal(ev.kind,'tool');assert.deepEqual(ev.connections,[]);
});
test('Tool discovery and schema revision require another catalog review',()=>{
 const {api,repository}=fresh();
 const d=api.post('/v1/tools/discoveries',{agentId:'atlas',id:'new-checker',name:'Check limits',schema:{amount:'number'}});
 assert.equal(d.status,201);assert.equal(repository.read().state.tools.at(-1).approved,false);
 const revision=api.post('/v1/tools/schema-revisions',{toolId:'t1',schema:{target:'string'}});
 assert.equal(revision.status,200);
 const tool=repository.read().state.tools.find(t=>t.id==='t1');
 assert.equal(tool.approved,false);assert.equal(tool.reviewStatus,'pending');assert.equal(tool.schemaVersion,2);
});
test('Bad payloads fail with no state mutation; test roles and resets are explicit',()=>{
 const {api,repository}=fresh();const before=repository.read();
 assert.equal(api.post('/v1/tool-invocations',{agentId:'atlas',toolId:'t6'}).status,422);
 assert.equal(api.post('/v1/tools/discoveries',{agentId:'missing',name:'Any',schema:{a:'string'}}).status,422);
 assert.equal(api.post('/v1/model-requests',{agentId:'atlas',parameters:[]}).status,422);
 assert.equal(repository.read().revision,before.revision);
 assert.equal(api.post('/_test/session/role',{role:'approver'}).status,200);
 assert.equal(repository.read().state.role,'approver');
 assert.equal(api.post('/_test/workspace/reset',{}).status,400);
 assert.equal(api.post('/_test/workspace/reset',{confirm:true}).status,200);
 assert.equal(repository.read().state.role,'operator');
 assert.ok(TEST_ENDPOINTS.includes('/v1/approvals/expire'));
});
test('Expire an approval through the test transport, not a reviewer interface control',()=>{
 const {api,repository}=fresh();
 assert.equal(api.post('/v1/approvals/expire',{approvalId:'APR-201'}).status,200);
 assert.equal(repository.read().state.approvals[0].status,'expired');
 assert.equal(api.post('/v1/approvals/expire',{approvalId:'APR-201'}).status,409);
});

test('First authenticated inference request verifies A; invalid and revoked keys never do',async()=>{
 const {api,repository}=fresh(),issued=await mintLocalCredential();
 const snapshot=repository.read(),state=snapshot.state;
 const agent={...state.agents[0],id:'new-agent',name:'New agent',mode:'observe',connections:['A'],requests:0,spent:0,connectionCheck:{status:'pending',verifiedAt:null,traceId:null}};
 state.agents.push(agent);
 state.credentials[agent.id]={version:1,revoked:0,issuedTotal:0,active:[]};
 stageCredential(state.credentials,agent.id,issued.record);
 repository.save(state,snapshot.revision);
 assert.equal(agentConnectionStatus(agent,state),'pending');
 const request={agentId:agent.id,model:'GPT-6',userRole:'none',action:'Connection check'};
 const before=repository.read();
 assert.equal(api.post('/v1/model-requests',request).status,401);
 assert.equal((await api.postAuthenticated('/v1/model-requests',request,'gov_test_'+'0'.repeat(48))).status,401);
 assert.equal(repository.read().revision,before.revision);
 assert.equal(agentConnectionStatus(repository.read().state.agents.at(-1),repository.read().state),'pending');
 const accepted=await api.postAuthenticated('/v1/model-requests',request,issued.token);
 assert.equal(accepted.status,201);
 assert.equal(accepted.body.connection_status,'verified');
 const connected=repository.read().state,found=connected.agents.find(a=>a.id===agent.id);
 assert.equal(agentConnectionStatus(found,connected),'verified');
 assert.equal(found.connectionCheck.traceId,accepted.body.trace_id);
 assert.ok(found.connectionCheck.verifiedAt);
 assert.equal(connected.events[0].source,'test-console');
 assert.ok(!JSON.stringify(connected).includes(issued.token));
 const rotated=await mintLocalCredential(),latest=repository.read();
 stageCredential(latest.state.credentials,agent.id,rotated.record);
 assert.ok(revokeLocalCredential(latest.state.credentials,agent.id,issued.record.id));
 repository.save(latest.state,latest.revision);
 assert.equal((await api.postAuthenticated('/v1/model-requests',request,issued.token)).status,401);
 assert.equal((await api.postAuthenticated('/v1/model-requests',request,rotated.token)).status,201);
});
