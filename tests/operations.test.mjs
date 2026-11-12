import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {cleanState,agentById,toolById,toolsForAgent,reviseTool,addRule,appendScenario,decideApproval,changeMode,toggleConnection,changeRecord,toolOperationalStatus,filterAuditEvents,safeReadState} from '../src/domain.js';
import {renderPage,renderDrawer,renderModal} from '../src/views.js';
import {renderOpsDrawer,renderOpsModal,renderAgentOperations,handleOpsClick} from '../src/operations.js';

test('Tool review transitions state, preserves routing and records before/after',()=>{
 const state=cleanState();const tool=toolById(state,'t3');
 assert.equal(tool.approved,false);
 assert.ok(reviseTool(state,'t3',{type:'Critical',decision:'approved',supervision:'approval',expectedVersion:1}));
 assert.equal(tool.approved,true);
 assert.equal(tool.classification,'confirmed');
 assert.equal(tool.control,'B');
 assert.equal(state.changes.length,1);
 assert.equal(state.changes[0].from.approved,false);
 assert.equal(state.changes[0].to.decision,'approved');
 assert.equal(toolOperationalStatus(agentById(state,'atlas'),tool).key,'approval');
});

test('Stale tool schema version does not silently overwrite an operator decision',()=>{
 const state=cleanState();const tool=toolById(state,'t3');tool.schemaVersion=2;
 assert.equal(reviseTool(state,'t3',{type:'Write',decision:'approved',supervision:'notify',expectedVersion:1}),false);
 assert.equal(tool.type,'Critical');assert.equal(tool.approved,false);assert.equal(state.changes.length,0);
});

test('Local tool approval never changes the execution boundary',()=>{
 const state=cleanState();const tool=toolById(state,'t7');
 assert.equal(reviseTool(state,'t7',{type:'Critical',decision:'approved',supervision:'approval',expectedVersion:1}),false);
 assert.ok(reviseTool(state,'t7',{type:'Critical',decision:'approved',supervision:'autonomous',expectedVersion:1}));
 assert.equal(toolOperationalStatus(agentById(state,'invoice'),tool).key,'outside');
 assert.equal(appendScenario(state,{agentId:'invoice',toolId:'t7',channel:'tool'}).status,'outside');
});

test('Rule builder checks declared parameter and rejects invalid type or target',()=>{
 const state=cleanState();
 assert.ok(addRule(state,'atlas',{effect:'deny',type:'Critical',toolId:'t4',parameter:'missing',comparator:'>',value:'10'}).error);
 assert.ok(addRule(state,'atlas',{effect:'deny',type:'Critical',toolId:'t4',parameter:'amount',comparator:'>',value:'not-a-number'}).error);
 assert.equal(state.rules.length,0);
 const result=addRule(state,'atlas',{effect:'deny',type:'Critical',toolId:'t4',parameter:'amount',comparator:'>',value:'10'});
 assert.equal(result.rule.id,'RULE-001');assert.equal(state.changes.length,1);
});

test('Example custom deny rule distinguishes parameters on the same tool',()=>{
 const state=cleanState();
 addRule(state,'atlas',{effect:'deny',type:'Critical',toolId:'t4',parameter:'amount',comparator:'>',value:'10'});
 const below=appendScenario(state,{agentId:'atlas',toolId:'t4',channel:'tool',userRole:'operator',parameters:{amount:8}});
 const above=appendScenario(state,{agentId:'atlas',toolId:'t4',channel:'tool',userRole:'operator',parameters:{amount:25}});
 assert.equal(below.status,'pending');assert.equal(above.status,'blocked');assert.equal(above.rule,'RULE-001');
});

test('Approver identity and optional comment are retained without permitting self-approval',()=>{
 const state=cleanState();state.role='approver';
 assert.equal(decideApproval(state,'APR-201','approved','Maya Chen','Self'),false);
 assert.equal(state.approvals[0].status,'pending');
 assert.ok(decideApproval(state,'APR-201','approved','Elena Kim','Checked parameters'));
 assert.equal(state.approvals[0].comment,'Checked parameters');
 assert.equal(state.approvals[0].reviewedBy,'Elena Kim');
 assert.equal(state.changes[0].kind,'Execution decision');
});

test('Retired agent stays in catalog and cannot be reactivated or simulated through gateway',()=>{
 const state=cleanState(),a=agentById(state,'atlas');a.mode='retired';a.active=false;
 assert.equal(changeMode(state,'atlas','enforce'),false);
 assert.equal(toggleConnection(state,'atlas','C'),false);
 assert.equal(appendScenario(state,{agentId:'atlas',channel:'inference'}),null);
 assert.equal(toolOperationalStatus(a,toolById(state,'t3')).key,'retired');
 assert.match(renderPage(state,{},'catalog'),/Atlas Support/);
 assert.match(renderPage(state,{},'agent','atlas'),/Retired agent/);
});

test('Auditor sees tool schema but cannot render edit form or simulate a schema update',()=>{
 const state=cleanState();state.role='auditor';
 const html=renderOpsDrawer(state,{drawer:{kind:'op-tool',id:'t3'}});
 assert.match(html,/Schema/);
 assert.doesNotMatch(html,/id="op-tool-form"/);
 assert.doesNotMatch(html,/data-action="op-schema-change"/);
 assert.equal(reviseTool(state,'t3',{type:'Read',decision:'approved',supervision:'autonomous',expectedVersion:1}),false);
});

test('Tool-review modal explicitly names the tool and intended decision',()=>{
 const state=cleanState();
 const ui={modal:{kind:'op-tool-confirm',id:'t3'},toolDraft:{id:'t3',type:'Critical',decision:'approved',supervision:'approval',expectedVersion:1}};
 const html=renderOpsModal(state,ui);
 assert.match(html,/Delete customer record/);
 assert.match(html,/Confirm review/);
 assert.match(html,/Local tools remain outside the execution gateway/);
 assert.equal(toolById(state,'t3').approved,false);
});

test('Historical admin changes survive reload without modifying recorded event identities',()=>{
 const state=cleanState();const old=structuredClone(state.events[0]);
 changeRecord(state,'Policy preset','atlas','Atlas Support',2,3);
 const restored=safeReadState(JSON.stringify(state));
 assert.equal(restored.changes.length,1);
 assert.deepEqual(restored.events[0],old);
});

test('Search filters combine model, connection, channel and user at the same time',()=>{
 const state=cleanState();
 const records=filterAuditEvents(state,{model:'GPT-6',connection:'C',channel:'inference',user:'Maya'});
 assert.ok(records.length>0);
 assert.ok(records.every(e=>e.model==='GPT-6'&&e.kind==='inference'&&e.actor.includes('Maya')&&e.connections.includes('C')));
});

test('Static build retains all runtime modules, including new operations workflows',()=>{
 const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 assert.match(build,/src\/operations\.js/);
});
