import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanState,agentById} from '../src/domain.js';
import {pageRules,pageActivity,pageApprovals,pageSpending,pageAudit,pageCatalog,pageAgent,pageConnections,renderPage} from '../src/views.js';

function highVolumeState(){
 const state=cleanState();
 for(let i=0;i<117;i++)state.agents.push({...structuredClone(state.agents[i%3]),id:`agent-${i}`,name:`Team agent ${i}`,team:i%2?'Finance':'Support',owner:i===96?'Unique Owner':'Team Owner',budget:50,spent:15,requests:50});
 const models=['GPT-6','Claude Sonnet'];
 for(let i=0;i<3200;i++)state.events.push({id:`TRC-SCALE-${i}`,at:'10:10',agent:state.agents[i%state.agents.length].id,actor:'No user identity',action:`Read row ${i}`,kind:'inference',model:models[i%2],status:i%4?'allowed':'blocked',connections:['A'],cost:0.01,rule:'Read',version:'v1',reason:'Read request',evidence:true});
 for(let i=0;i<420;i++)state.approvals.push({id:`APR-SCALE-${i}`,agent:state.agents[i%state.agents.length].id,action:`Review ${i}`,requestedBy:'Team Member',requestedAt:'10:00',reason:'Approval required',expires:'15 min',status:i%3?'pending':'approved',trace:`TRC-SCALE-${i}`});
 return state;
}
const ui={catalogTab:'agents',requestUser:'operator',catalogAgentLimit:24,connectionLimit:24,rulesLimit:24,activityLimit:30,auditLimit:30,approvalsLimit:20,spendingLimit:24,personLimit:24};
const count=(html,text)=>(html.match(new RegExp(text,'g'))||[]).length;

test('Rules and Connections reuse the same agent directory for 120 agents',()=>{
 const s=highVolumeState();
 const rules=pageRules(s,ui);
 const connections=pageConnections(s,ui);
 assert.equal(count(rules,'class="card agent-card"'),24);
 assert.equal(count(connections,'class="card agent-card"'),24);
 assert.match(rules,/id="rules-search"/);
 assert.match(rules,/24 of 120 agents/);
 assert.match(rules,/show-more-rules/);
 assert.doesNotMatch(rules,/id="rules-agent"|<select[^>]*>.*Team agent 96/s);
 const filtered=pageRules(s,{...ui,rulesSearch:'Unique Owner'});
 assert.equal(count(filtered,'class="card agent-card"'),1);
 assert.match(filtered,/Team agent 96/);
 const agent=pageAgent(s,ui,'agent-96','rules');
 assert.match(agent,/href="#\/agent\/agent-96\/connections"/);
 assert.match(agent,/href="#\/agent\/agent-96\/rules" aria-current="page"/);
 assert.match(agent,/data-id="agent-96"/);
});

test('Activity uses agent-name filter not huge dropdown, and bounds 3,200 events',()=>{
 const s=highVolumeState();
 const activity=pageActivity(s,ui);
 assert.match(activity,/id="activity-agent-search"/);
 assert.doesNotMatch(activity,/id="activity-agent"/);
 assert.equal(count(activity,'<tr>'),31);
 assert.match(activity,new RegExp(`30 of ${s.events.length} events`));
 assert.match(pageActivity(s,{...ui,activityLimit:60}),new RegExp(`60 of ${s.events.length} events`));
 const scoped=pageActivity(s,ui,'agent-96');
 assert.match(scoped,/Team agent 96/);
 assert.match(scoped,/href="#\/activity"/);
 assert.doesNotMatch(scoped,/data-id="atlas" data-channel="inference"/);
 assert.match(scoped,/data-id="agent-96" data-channel="inference"/);
 const searched=pageActivity(s,{...ui,activityAgentSearch:'Unique Owner'});
 assert.doesNotMatch(searched,/Team agent 95<\/a>/);
 assert.match(searched,/Team agent 96/);
});

test('Audit lists 30 records, filters by trace and respects scoped agent',()=>{
 const s=highVolumeState();
 assert.equal(count(pageAudit(s,ui),'<tr>'),31);
 assert.match(pageAudit(s,ui),new RegExp(`30 of ${s.events.length} records`));
 assert.match(pageAudit(s,{...ui,auditSearch:'TRC-SCALE-3199'}),/TRC-SCALE-3199/);
 assert.match(pageAudit(s,ui,'agent-20'),/Team agent 20/);
 assert.match(pageAudit(s,ui,'agent-20'),/href="#\/audit"/);
});

test('Approvals handles 420 decisions with status tabs, search and bounded rows',()=>{
 const s=highVolumeState();
 const list=pageApprovals(s,ui);
 assert.match(list,/id="approvals-search"/);
 assert.equal(count(list,'class="card approval-card"'),20);
 assert.match(list,/show-more-approvals/);
 const narrow=pageApprovals(s,{...ui,approvalsSearch:'Review 419'});
 assert.match(narrow,/Review 419/);
 assert.equal(count(narrow,'class="card approval-card"'),1);
 const reviewed=pageApprovals(s,{...ui,approvalsView:'reviewed'});
 assert.match(reviewed,/Reviewed/);
 assert.doesNotMatch(reviewed,/data-action="approval-confirm"/);
 const scoped=pageApprovals(s,ui,'agent-96');
 assert.match(scoped,/Team agent 96/);
});

test('Spending limits 120 agents, supports search, preserves scoped totals and historic identity',()=>{
 const s=highVolumeState();
 const all=pageSpending(s,ui);
 assert.match(all,/id="spending-search"/);
 assert.equal(count(all,'class="budget-item"'),24);
 assert.match(all,/24 of 120 agents/);
 assert.match(pageSpending(s,{...ui,spendingLimit:48}),/48 of 120 agents/);
 const scoped=pageSpending(s,ui,'agent-96');
 assert.match(scoped,/Team agent 96/);
 assert.match(scoped,/\$15\.00/);
 assert.match(scoped,/\$50\.00/);
 assert.doesNotMatch(scoped,/\$[0-9],[0-9]{3}/);
 const matched=pageSpending(s,{...ui,spendingSearch:'Unique Owner'});
 assert.match(matched,/1 of 1 agents/);
 assert.match(matched,/Team agent 96/);
});

test('Catalog tools and people are bounded, and agent detail preserves deep links',()=>{
 const s=highVolumeState();
 const people=pageCatalog(s,{...ui,catalogTab:'identities'});
 assert.match(people,/24 of 120 agents/);
 assert.match(people,/show-more-people/);
 const toolList=pageCatalog(s,{...ui,catalogTab:'tools'});
 assert.match(toolList,/Search tools/);
 const a=pageAgent(s,ui,'agent-96');
 assert.match(a,/href="#\/agent\/agent-96\/rules"/);
 assert.match(a,/href="#\/spending\/agent-96"/);
 assert.match(a,/href="#\/audit\/agent-96"/);
});

test('Scoped pages ignore stale global filters hidden by the scope',()=>{
 const s=highVolumeState();
 const activity=pageActivity(s,{...ui,activityAgentSearch:'Atlas'},'agent-96');
 assert.match(activity,/Team agent 96/);
 assert.doesNotMatch(activity,/No matching events/);
 const spending=pageSpending(s,{...ui,spendingSearch:'Finance'},'agent-96');
 assert.match(spending,/1 of 1 agents/);
 assert.match(spending,/Team agent 96/);
});
