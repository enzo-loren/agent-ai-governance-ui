import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanState,agentById,appendScenario,changeMode,connectionProfile,identitySamples,policyGaps,
  approvalReady,approvalBlocker,openApprovals,toggleConnection,decideApproval} from '../src/domain.js';
import {pageRules,pageSpending,pageConnections,pageApprovals,pageCatalog,pageAgent} from '../src/views.js';
const ui=(agent='atlas')=>({rulesAgent:agent,requestUser:'operator',catalogTab:'tools',catalogSearch:'',connectionSearch:''});
const setConnections=(s,keys)=>{agentById(s,'atlas').connections=[...keys];};
const make=(keys,preset=2)=>{const s=cleanState();setConnections(s,keys);const a=agentById(s,'atlas');a.preset=preset;a.mode='enforce';return s;};
const configurations=[['A',['A']],['A+B',['A','B']],['A+C',['A','C']],['A+B+C',['A','B','C']]];
for(const [name,keys] of configurations){
 test(`configuration ${name}: C gates writing and B gates real tool execution`,()=>{
  const s=make(keys),b=keys.includes('B'),c=keys.includes('C');
  assert.equal(connectionProfile(agentById(s,'atlas')).combination,name);
  const write=appendScenario(s,{agentId:'atlas',channel:'inference',toolId:'t2',action:'Update customer profile'});
  assert.equal(write.status,c?'allowed':'blocked');
  const criticalModel=appendScenario(s,{agentId:'atlas',channel:'inference',toolId:'t4',action:'Issue refund'});
  assert.equal(criticalModel.status,b&&c?'allowed':'blocked');
  const criticalTool=appendScenario(s,{agentId:'atlas',channel:'tool',toolId:'t4',action:'Issue refund'});
  assert.equal(criticalTool.status,!b?'outside':!c?'blocked':'pending');
  assert.equal(criticalTool.evidence,b);
  assert.equal(criticalTool.connections.includes('C'),b&&c);
  const local=appendScenario(s,{agentId:'atlas',channel:'tool',toolId:'t5',action:'Get order status'});
  assert.equal(local.status,'outside','even A+B+C cannot stop a local tool');
  assert.equal(local.evidence,false);
  assert.match(pageAgent(s,ui(),'atlas','connections'),/Tool execution/);
  assert.match(pageRules(s,ui()),/With this policy/);
 });
}
test('B is partial and counted by registered tools rather than number of connection switches',()=>{
 const s=cleanState();const a=agentById(s,'atlas');
 assert.equal(connectionProfile(a).totalTools,5);
 assert.equal(connectionProfile(a).controlledTools,4);
 assert.match(connectionProfile(a).toolLabel,/4 routed · 1 outside/);
 assert.match(pageCatalog(s,ui()),/Outside gateway/);
 toggleConnection(s,'atlas','B');assert.equal(connectionProfile(a).controlledTools,0);
 assert.match(pageAgent(s,ui(),'atlas','connections'),/Not connected/);
});
test('C is per-request and permits anonymous solo workload with C configured',()=>{
 const s=make(['A','C']);
 const prior=identitySamples(s,'atlas');
 const reader=appendScenario(s,{agentId:'atlas',channel:'inference',toolId:'t2',action:'Update customer profile',userRole:'reader'});
 assert.equal(reader.actor,'Eli Ramos');assert.equal(reader.status,'blocked');assert.match(reader.reason,/role cannot write/);
 const anonymous=appendScenario(s,{agentId:'atlas',channel:'inference',toolId:'t2',action:'Update customer profile',userRole:'none'});
 assert.equal(anonymous.actor,'No user identity');assert.equal(anonymous.connections.includes('C'),false);
 assert.equal(anonymous.status,'blocked');
 const after=identitySamples(s,'atlas');
 assert.equal(after.observed,prior.observed+2);
 assert.equal(after.identified,prior.identified+1);
});
test('Observe does not enforce policy denial, but local tool execution remains outside B',()=>{
 const s=make(['A','B','C']);changeMode(s,'atlas','observe');
 const intent=appendScenario(s,{agentId:'atlas',channel:'inference',toolId:'t3',action:'Delete customer record'});
 assert.equal(intent.status,'would_block');
 assert.match(intent.reason,/observed, not enforced/);
 assert.equal(appendScenario(s,{agentId:'atlas',channel:'tool',toolId:'t5',action:'Get order status'}).status,'outside');
});
test('presets 1, 2, 3 respond differently to identical approved reads and critical operations',()=>{
 const p1=make(['A','B','C'],1);
 assert.equal(appendScenario(p1,{agentId:'atlas',channel:'tool',toolId:'t1'}).status,'allowed');
 assert.equal(appendScenario(p1,{agentId:'atlas',channel:'tool',toolId:'t4'}).status,'blocked');
 const p2=make(['A','B','C'],2);
 assert.equal(appendScenario(p2,{agentId:'atlas',channel:'tool',toolId:'t4'}).status,'pending');
 const p3=make(['A','B','C'],3);
 assert.equal(appendScenario(p3,{agentId:'atlas',channel:'tool',toolId:'t1'}).status,'blocked');
});
test('switching B or C updates approval availability, navigation count and pending rows',()=>{
 const s=make(['A','B','C']);s.role='approver';
 assert.equal(openApprovals(s).length,1);
 assert.equal(approvalReady(s,s.approvals[0]),true);
 toggleConnection(s,'atlas','B');
 assert.equal(openApprovals(s).length,0);
 assert.match(approvalBlocker(s,s.approvals[0]),/Connect tool execution/);
 assert.match(pageApprovals(s),/Unavailable/);
 assert.equal(decideApproval(s,'APR-201','approved'),false);
 toggleConnection(s,'atlas','B');toggleConnection(s,'atlas','C');
 assert.equal(openApprovals(s).length,0);
 assert.match(approvalBlocker(s,s.approvals[0]),/Identify users/);
});
test('spending only shows per-person detail with an active C connection, not just historical names',()=>{
 const s=make(['A']);
 assert.match(pageSpending(s),/No user attribution/);
 assert.doesNotMatch(pageSpending(s),/Maya Chen/);
 toggleConnection(s,'atlas','C');
 assert.match(pageSpending(s),/Maya Chen/);
 toggleConnection(s,'atlas','C');
 assert.doesNotMatch(pageSpending(s),/Maya Chen/);
});
test('policy 2 shows missing dependency warnings without turning B or C into prerequisites for A',()=>{
 const s=make(['A']);
 assert.deepEqual(policyGaps(agentById(s,'atlas')).length,2);
 assert.match(pageRules(s,ui()),/Writes require user identity/);
 assert.match(pageRules(s,ui()),/Critical execution requires routed tool calls/);
 toggleConnection(s,'atlas','C');
 assert.deepEqual(policyGaps(agentById(s,'atlas')).length,1);
 toggleConnection(s,'atlas','B');
 assert.deepEqual(policyGaps(agentById(s,'atlas')).length,0);
 assert.match(pageRules(s,ui()),/Can request a second-person approval/);
});
test('view for a single agent shows a path combination, not a false governance score',()=>{
 const s=make(['A','B']);
 const html=pageAgent(s,ui(),'atlas');
 assert.match(html,/Tools routed/);assert.match(html,/4 routed · 1 outside/);
 assert.doesNotMatch(html,/66\.7%|2 of 3.*coverage/i);
});
