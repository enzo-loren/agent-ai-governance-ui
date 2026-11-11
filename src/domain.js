import { SEED_AGENTS, SEED_EVENTS, SEED_APPROVALS, SEED_TOOLS } from './data.js';

export const STATUS = {
  allowed: { label: 'Allowed', icon: 'check', tone: 'positive' },
  would_block: { label: 'Would block', icon: 'eye', tone: 'preview' },
  blocked: { label: 'Blocked', icon: 'slash', tone: 'negative' },
  filtered: { label: 'Filtered', icon: 'filter', tone: 'warning' },
  limited: { label: 'Limited', icon: 'gauge', tone: 'warning' },
  pending: { label: 'Needs approval', icon: 'clock', tone: 'info' },
  outside: { label: 'Not covered', icon: 'unplug', tone: 'neutral' },
  missing: { label: 'No evidence', icon: 'alert-triangle', tone: 'neutral' },
  approved: { label: 'Approved', icon: 'check', tone: 'positive' },
  rejected: { label: 'Rejected', icon: 'slash', tone: 'negative' }
};
export const CAN_EDIT = ['operator'];
export const CAN_APPROVE = ['approver'];
export const DEMO_REVIEWER = 'Elena Kim';
export function cleanState() {
  return {agents:structuredClone(SEED_AGENTS), events:structuredClone(SEED_EVENTS), approvals:structuredClone(SEED_APPROVALS), theme:'forest', appearance:'light', role:'operator', tour:-1, selectedAgent:'atlas', budgetUnit:'day'};
}
export function safeReadState(serialized) {
  const initial=cleanState();
  if (!serialized) return initial;
  try {
    const data=JSON.parse(serialized);
    if (!data || !Array.isArray(data.agents) || !Array.isArray(data.events) || !Array.isArray(data.approvals)) return initial;
    return { ...initial, ...data,
      theme:['forest','violet','ocean'].includes(data.theme)?data.theme:'forest',
      appearance:['light','dark'].includes(data.appearance)?data.appearance:'light',
      role:['operator','approver','auditor'].includes(data.role)?data.role:'operator',
      tour:Number.isInteger(data.tour)?data.tour:-1
    };
  } catch { return initial; }
}
export function agentById(state,id){return state.agents.find(a=>a.id===id) || null;}
export function agentName(state,id){return agentById(state,id)?.name||'Unknown agent';}
export function canEdit(state){return state.role==='operator';}
export function canApprove(state){return state.role==='approver';}
export function hasConnection(agent,id){return !!agent?.connections.includes(id);}
export function coverage(agent){return (['A','B','C'].filter(x=>hasConnection(agent,x)).length / 3)*100;}
export function totalSpend(state){return state.agents.reduce((s,a)=>s+a.spent,0);}
export function openApprovals(state){return state.approvals.filter(a=>a.status==='pending');}
export function findings(state){return state.events.filter(e=>['blocked','would_block','missing','outside','pending'].includes(e.status));}
export function statusCounts(state){return state.events.reduce((result,e)=>({...result,[e.status]:(result[e.status]||0)+1}),{});}
export function formatUSD(number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(number)||0);}
export function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function safeId(input){return String(input||'').toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').slice(0,40);}
export function nextTraceId(state){return `TRC-${String(1050+state.events.length).padStart(4,'0')}`;}
export function previewImpact(state,agentId){
  const agent=agentById(state,agentId);
  const attempts=state.events.filter(e=>e.agent===agentId && e.status==='would_block');
  return {name:agent?.name||'Agent', count:attempts.length, actions:attempts.map(e=>e.action)};
}
export function changeMode(state,agentId,next){
  const agent=agentById(state,agentId);if(!agent) return false;
  if(!['observe','enforce','suspended'].includes(next)) return false;
  agent.mode=next;return true;
}
export function appendScenario(state,{agentId='atlas',action='Delete customer record',channel='tool'}={}){
  const agent=agentById(state,agentId);if(!agent)return null;
  const toolControlled=agent.connections.includes('B');
  const blocked=agent.mode==='enforce';
  const status = channel==='tool'&&!toolControlled?'outside':agent.mode==='suspended'?'blocked':blocked?'blocked':'would_block';
  const id=nextTraceId(state);
  const record={id,at:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}),ago:'Just now',agent:agentId,actor:agent.connections.includes('C')?'Maya Chen':'No user identity',action,kind:channel,model:'GPT-6',status,connections:[...agent.connections],cost:channel==='tool'&&!toolControlled?0:0.013,rule:blocked?'Critical actions are not approved':'Critical actions need review',version:'v1.8',reason: status==='outside'?'This tool executes outside the gateway. Its actual execution cannot be verified or stopped by this demo.':agent.mode==='suspended'?'The agent is suspended and the request was rejected.':status==='blocked'?'This simulated request was stopped before the connected tool executed.':'In Observe mode this request is recorded, not blocked. It would be denied in Enforce mode.',evidence:status!=='outside'};
  state.events.unshift(record);return record;
}
export function decideApproval(state,id,decision){
  const item=state.approvals.find(x=>x.id===id);if(!item||item.status!=='pending'||!['approved','rejected'].includes(decision)||!canApprove(state))return false;
  if(item.requestedBy===DEMO_REVIEWER || !hasConnection(agentById(state,item.agent),'B')) return false;
  item.status=decision;
  state.events.unshift({id:nextTraceId(state),at:'Now',ago:'Just now',agent:item.agent,actor:'Review team',action:item.action,kind:'tool',model:'GPT-6',status:decision==='approved'?'allowed':'blocked',connections:[...(agentById(state,item.agent)?.connections||[])],cost:0,rule:'Human decision',version:'v1.8',reason:decision==='approved'?'Another person approved this simulated execution.':'A reviewer rejected the simulated execution.',evidence:true});
  return true;
}
export function toggleConnection(state,agentId,connection){
  if(!['B','C'].includes(connection))return false;
  const agent=agentById(state,agentId);if(!agent)return false;
  agent.connections=agent.connections.includes(connection)?agent.connections.filter(x=>x!==connection):[...agent.connections,connection].sort();
  return true;
}
export const sampleModels=[
  {name:'GPT-6',provider:'OpenAI',agentCount:2},
  {name:'Claude Sonnet',provider:'Anthropic',agentCount:1}
];
export function toolsForAgent(id){return SEED_TOOLS.filter(t=>t.agent===id);}
