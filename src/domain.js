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
// Connection presence is not the coverage index. B is tool-by-tool; C is per request.
export function connectionProfile(agent){
  const declared=toolsForAgent(agent?.id);
  const throughGateway=declared.filter(t=>t.control==='B' && hasConnection(agent,'B'));
  return {
    combination: `A${hasConnection(agent,'B')?'+B':''}${hasConnection(agent,'C')?'+C':''}`,
    totalTools:declared.length, controlledTools:throughGateway.length,
    hasToolControl:throughGateway.length>0,
    hasIdentity:hasConnection(agent,'C'),
    toolLabel:declared.length?`${throughGateway.length} routed · ${declared.length-throughGateway.length} outside`:'No tools declared',
  };
}
// The catalog reports concrete handling, not a synthetic governance score.
// Approval, policy mode and routing are separate facts: none proves global safety.
export function toolOperationalStatus(agent,tool){
  if(!agent || !tool || !hasConnection(agent,'B') || tool.control!=='B'){
    return {key:'outside',label:'Outside gateway',detail:'Tool execution is not checked here',tone:'outside'};
  }
  if(agent.mode==='suspended'){
    return {key:'paused',label:'Paused',detail:'Gateway calls are rejected',tone:'blocked'};
  }
  if(!tool.approved){
    return {key:'review',label:'Needs review',detail:agent.mode==='observe'?'Review is required before enforcement':'Not permitted while rules are enforced',tone:'pending'};
  }
  if(agent.preset===3){
    return {key:'rule',label:'Rule required',detail:'No explicit permission is configured',tone:'pending'};
  }
  if(agent.preset===2 && ['Write','Critical'].includes(tool.type) && !hasConnection(agent,'C')){
    return {key:'identity',label:'Identity required',detail:'Write and critical actions require an identified user',tone:'pending'};
  }
  if(agent.preset===2 && tool.type==='Write' && hasConnection(agent,'C') && agent.mode==='enforce'){
    return {key:'checked',label:'Role checked',detail:'The requesting user must have write permission',tone:'allowed'};
  }
  if(agent.preset===2 && tool.type==='Critical'){
    return {key:'approval',label:'Second review',detail:'A separate reviewer must approve execution',tone:'pending'};
  }
  if(agent.mode==='observe'){
    return {key:'observe',label:'Rules observed',detail:'Policy findings are recorded, not enforced',tone:'would_block'};
  }
  return {key:'checked',label:'Checked on execution',detail:'Policy applies at the gateway',tone:'allowed'};
}
export function catalogToolSummary(agent){
  const tally={checked:0,observe:0,review:0,rule:0,identity:0,approval:0,paused:0,outside:0};
  for(const tool of toolsForAgent(agent?.id)){tally[toolOperationalStatus(agent,tool).key]++;}
  const labels=[
    ['checked','checked'],['observe','observed'],['review','need review'],['rule','need rules'],
    ['identity','need identity'],['approval','need approval'],['paused','paused'],['outside','outside']
  ];
  return labels.filter(([key])=>tally[key]).map(([key,label])=>`${tally[key]} ${label}`).join(' · ') || 'No tools';
}
// Historical request identity is retained in Audit even when C is later switched off.
// Catalog lists only current connections and persons actually present in the records.
export function catalogIdentities(state,agentId){
  const agent=agentById(state,agentId);
  if(!hasConnection(agent,'C'))return {connected:false,people:[],unnamed:0};
  const people=new Map();let unnamed=0;
  for(const event of state.events.filter(e=>e.agent===agentId)){
    if(event.connections.includes('C')&&event.actor&&event.actor!=='No user identity'){
      people.set(event.actor,(people.get(event.actor)||0)+1);
    }else if(event.kind==='inference')unnamed++;
  }
  return {connected:true,people:[...people].map(([name,requests])=>({name,requests})),unnamed};
}
export function identitySamples(state,agentId){
  const samples=state.events.filter(e=>e.agent===agentId && e.kind==='inference');
  const identified=samples.filter(e=>e.connections.includes('C') && e.actor!=='No user identity');
  return {observed:samples.length,identified:identified.length};
}
export function approvalReady(state,item){
  const a=agentById(state,item.agent);
  return !!a && a.mode==='enforce' && hasConnection(a,'B') && (a.preset!==2 || hasConnection(a,'C'));
}
export function approvalBlocker(state,item){
  const a=agentById(state,item.agent);
  if(!a)return 'Agent unavailable';
  if(!hasConnection(a,'B'))return 'Connect tool execution to review this action';
  if(a.mode!=='enforce')return 'Turn on rules for this agent';
  if(a.preset===2 && !hasConnection(a,'C'))return 'Identify users to use this policy';
  return '';
}
export function policyGaps(agent){
  if(agent.preset!==2)return [];
  const gaps=[];
  if(!hasConnection(agent,'C'))gaps.push('Writes require user identity');
  if(!hasConnection(agent,'B'))gaps.push('Critical execution requires routed tool calls');
  return gaps;
}
export function totalSpend(state){return state.agents.reduce((s,a)=>s+a.spent,0);}
export function openApprovals(state){return state.approvals.filter(a=>a.status==='pending' && approvalReady(state,a));}
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
  if(next==='suspended'&&agent.mode!=='suspended')agent.previousMode=agent.mode;
  agent.mode=next;return true;
}
// Evaluate each channel and policy separately. Outside-B tool attempts have no execution verdict.
export function appendScenario(state,{agentId='atlas',action='Delete customer record',channel='tool',toolId=null,userRole='operator'}={}){
  const agent=agentById(state,agentId);if(!agent||!['tool','inference'].includes(channel))return null;
  const tool=SEED_TOOLS.find(t=>t.id===toolId && t.agent===agentId)
    || SEED_TOOLS.find(t=>t.agent===agentId && t.name===action);
  const name=tool?.name||action;
  const critical=tool ? tool.type==='Critical' : true;
  const write=tool?.type==='Write';
  const read=tool?.type==='Read';
  const approved=tool?.approved??false;
  const controlled=hasConnection(agent,'B') && tool?.control==='B';
  const withIdentity=hasConnection(agent,'C')&&userRole!=='none';
  const external=channel==='tool'&&!controlled;
  let status='allowed', reason='The policy permits this request.', rule='Approved action';
  if(external){status='outside';rule='Outside tool gateway';reason='This tool does not pass through the gateway. Its execution cannot be verified or blocked here.';}
  else if(agent.mode==='suspended'){
    status='blocked';rule='Agent paused';reason=channel==='tool'?'The tool request was rejected at the gateway.':'The model request was rejected at the gateway.';
  }else{
    let decision='allow';
    if(agent.preset===1){
      if(!approved || critical){decision='deny';rule='Safe start';reason='This critical or unapproved action is not permitted.';}
    }else if(agent.preset===2){
      rule='Role-based';
      if(!approved){decision='deny';reason='Approve this tool in Catalog before using it.';}
      else if(write&&!withIdentity){decision='deny';reason='Write actions require an identified user.';}
      else if(write&&userRole!=='operator'){decision='deny';reason='This user role cannot write.';}
      else if(critical&&!withIdentity){decision='deny';reason='This policy requires an identified user.';}
      else if(critical&&!hasConnection(agent,'B')){decision='deny';reason='Critical actions need tool execution control.';}
      else if(critical&&userRole!=='operator'){decision='deny';reason='This user role cannot request critical actions.';}
      else if(critical&&channel==='tool'){decision='pending';reason='This tool must be approved by another person before it runs.';}
      else if(critical&&channel==='inference'){decision='allow';reason='The model may request this tool. Execution requires separate approval through tool execution control.';}
    }else if(agent.preset===3){decision='deny';rule='Strict';reason='No explicit permission has been configured for this action.';}
    if(decision==='pending')status=agent.mode==='observe'?'would_block':'pending';
    else if(decision==='deny')status=agent.mode==='observe'?'would_block':'blocked';
    if(status==='would_block')reason=`Would be denied by ${rule}. ${reason} The policy decision was observed, not enforced.`;
  }
  const id=nextTraceId(state);
  const pathConnections=channel==='inference'?['A',...(withIdentity?['C']:[])]:[...(controlled?['B']:[]),...(controlled&&withIdentity?['C']:[])];
  const record={id,at:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}),ago:'Just now',
    agent:agentId,actor:withIdentity?(userRole==='reader'?'Eli Ramos':'Maya Chen'):'No user identity',action:name,kind:channel,model:'GPT-6',status,
    connections:pathConnections,cost:channel==='tool'?0:0.013,rule,version:'v1.8',reason,evidence:!external};
  state.events.unshift(record);
  if(status==='pending'&&channel==='tool'){
    state.approvals.unshift({id:`APR-${id.replace('TRC-','')}`,agent:agentId,action:name,
      requestedBy:record.actor,requestedAt:record.at,reason:'Requires a second reviewer.',expires:'15 min',status:'pending',trace:id});
  }
  return record;
}
export function decideApproval(state,id,decision){
  const item=state.approvals.find(x=>x.id===id);if(!item||item.status!=='pending'||!['approved','rejected'].includes(decision)||!canApprove(state))return false;
  if(item.requestedBy===DEMO_REVIEWER || !approvalReady(state,item)) return false;
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
