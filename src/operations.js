/** Browser-only task flows for the product preview. No AWS, OIDC, MCP, Cedar or S3 calls. */
import {POLICY_PRESETS, CONNECTIONS} from './data.js';
import {escapeHTML as e, agentById, agentName, canEdit, canApprove, toolById, toolsForAgent, hasConnection, toolOperationalStatus, formatUSD, sampleModels, changeRecord, reviseTool, addRule, appendScenario, filterAuditEvents, DEMO_REVIEWER} from './domain.js';
import {icon as I} from './icons.js';
const button=(text,action,data='',kind='')=>`<button type="button" class="btn ${kind}" data-action="${action}" ${data}>${e(text)}</button>`;
const small=(text,action,data='')=>button(text,action,data,'tiny');
const field=(label,name,value='',type='text',extra='')=>`<label class="field-group"><span class="field-label">${e(label)}</span><input class="field-input" name="${name}" type="${type}" value="${e(value)}" ${extra}></label>`;
const opt=(value,label,current)=>`<option value="${e(value)}" ${String(value)===String(current)?'selected':''}>${e(label)}</option>`;
const select=(label,name,values,current,extra='')=>`<label class="field-group"><span class="field-label">${e(label)}</span><select class="field-select op-select" name="${name}" ${extra}>${values.map(x=>opt(x[0],x[1],current)).join('')}</select></label>`;
const linkAgent=a=>`#/agent/${encodeURIComponent(a.id)}`;
const info=(text)=>`<p class="op-note">${e(text)}</p>`;
const pretty=x=>typeof x==='string'?x:JSON.stringify(x,null,2);
const formActions=(name)=>`<div class="modal-actions">${button('Cancel','close-overlay')}${name?`<button class="btn primary" type="submit">${e(name)}</button>`:''}</div>`;
function drawer(title,content){return `<div class="scrim" data-action="close-overlay" aria-hidden="true"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><header class="drawer-header"><div><span class="drawer-label">Product preview</span><h2 id="drawer-title">${e(title)}</h2></div><button class="icon-btn soft" data-action="close-overlay" aria-label="Close details">${I('x',19)}</button></header><div class="drawer-body">${content}</div><footer class="drawer-footer">${button('Close','close-overlay')}</footer></aside>`;}
function modal(title,content,actions){return `<div class="scrim" data-action="close-overlay" aria-hidden="true"></div><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><section class="modal-card op-modal"><h2 id="modal-title">${e(title)}</h2>${content}<div class="modal-actions">${actions}</div></section></div>`;}
const formModal=(title,form)=>modal(title,form,'');

export function renderAgentOperations(state,a){
 if(!canEdit(state))return '';
 if(a.mode==='retired')return `<section class="card card-pad op-section"><h2 class="card-title">Retired agent</h2><p class="card-subtitle">Operations are disabled. Recorded changes can still be inspected.</p>${small('View history','op-history',`data-id="${e(a.id)}"`)}</section>`;
 const cred=state.credentials?.[a.id]||{version:1,revoked:0};
 return `<section class="card card-pad op-section"><div class="card-title-row"><div><h2 class="card-title">Agent setup</h2><p class="card-subtitle">Details and access settings</p></div></div><div class="op-action-grid">
 ${small('Edit details','op-edit-agent',`data-id="${e(a.id)}"`)}
 ${small('Allowed models','op-models',`data-id="${e(a.id)}"`)}
 ${small('Rotate credential','op-rotate-token',`data-id="${e(a.id)}"`)}
 ${small('Revoke credential','op-revoke-token',`data-id="${e(a.id)}"`)}
 ${small('Retire agent','op-retire-agent',`data-id="${e(a.id)}"`)}${small('Change history','op-history',`data-id="${e(a.id)}"`)}
 </div><p class="micro muted mt-4">Credential example v${cred.version} · ${cred.revoked} revoked in this browser. No real secrets are issued.</p></section>`;
}
export function renderRulesOperations(state,ui,a){
 const rules=state.rules.filter(r=>r.agent===a.id);
 return `<section class="card card-pad op-section mt-6"><div class="card-title-row"><div><h2 class="card-title">Custom rules</h2><p class="card-subtitle">Rules beyond the policy preset</p></div><div class="button-row">${canEdit(state)?`${small('Create rule','op-create-rule',`data-id="${e(a.id)}"`)}${small('Cedar editor','op-cedar-editor',`data-id="${e(a.id)}"`)}`:''}${small('Rule history','op-history',`data-id="${e(a.id)}"`)}${small('Try policy on history','op-simulate-historical-policy',`data-id="${e(a.id)}"`)}</div></div>
 ${rules.length?`<div class="op-compact-list">${rules.map(r=>`<div class="op-list-row"><div><strong>${e(r.id)} · ${e(r.effect)} ${e(r.type)}</strong><p>${r.toolId?e(toolById(state,r.toolId)?.name||'Tool'):'Any tool'} ${r.parameter?`· ${e(r.parameter)} ${e(r.comparator)} ${e(r.value)}`:''} · Version ${r.version}</p></div>${small('Try values','op-rule-test',`data-id="${e(r.id)}"`)}</div>`).join('')}</div>`:info('No custom rules yet. Preset policies are still in effect.')}
 <div class="section-head"><h2>Agent tools</h2></div>
 <div class="op-compact-list">${toolsForAgent(a.id,state).slice(0,8).map(t=>`<div class="op-list-row"><div><strong>${e(t.name)}</strong><p>${e(t.type)} · ${t.approved?'Approved':'Needs review'} · ${e(toolOperationalStatus(a,t).label)}</p></div>${small('View tool','op-open-tool',`data-id="${e(t.id)}"`)}</div>`).join('')}</div>
 ${toolsForAgent(a.id,state).length>8?small('All tools','op-show-agent-tools',`data-id="${e(a.id)}"`):''}
 </section>`;
}
export function renderConnectionOperations(state,a){
 const routed=toolsForAgent(a.id,state).filter(t=>t.control==='B');
 const trust=state.identityConfig?.[a.id];
 return `<section class="card card-pad op-section mt-6"><div class="card-title-row"><div><h2 class="card-title">Connection settings</h2><p class="card-subtitle">Configure destinations and identity trust for this agent</p></div></div>
 <div class="op-action-grid">${canEdit(state)?`${small('Manage tool destinations','op-mcp',`data-id="${e(a.id)}"`)}${small('Identity settings','op-identity',`data-id="${e(a.id)}"`)}`:''}</div>
 <div class="op-signal-grid mt-4"><div><strong>${routed.length}</strong><span>Tools marked for the execution gateway</span></div><div><strong>${e(trust?.issuer?'Configured':'Not configured')}</strong><span>OIDC issuer — not verified</span></div></div>
 ${info('These are example configuration records. A connected toggle is not evidence that a tool is actually routed or a token is valid.')}</section>`;
}
export function renderActivityOperations(state,ui){
 return `<div class="op-compact-tools"><label>Person <input class="field-input" id="activity-user" placeholder="Search person" value="${e(ui.activityUser||'')}"></label>
 <label>Channel <select class="field-select" id="activity-channel">${[['','All channels'],['inference','Model'],['tool','Tool']].map(x=>opt(x[0],x[1],ui.activityChannel||'')).join('')}</select></label>
 <label>Model <select class="field-select" id="activity-model">${[['','All models'],...Array.from(new Set(state.events.map(ev=>ev.model).filter(Boolean))).map(name=>[name,name])].map(x=>opt(x[0],x[1],ui.activityModel||'')).join('')}</select></label>
 ${button('Add sample request','op-add-sample-event','','tiny')}${ui.activityPaused?small('Replay buffered','op-replay-buffer'):''}
 <span class="micro muted">Sample feed · no live gateway connection</span></div>`;
}
export function renderApprovalsOperations(state,ui){
 if(!canApprove(state))return '';
 const reviewer=state.reviewPerson||DEMO_REVIEWER;
 return `<div class="op-reviewer"><label for="op-reviewer-person">Review as</label><select class="field-select" id="op-reviewer-person" aria-label="Simulated reviewer identity">${[['Elena Kim','Elena Kim · approver'],['Maya Chen','Maya Chen · requester'],['Jordan Lee','Jordan Lee · requester']].map(x=>opt(x[0],x[1],reviewer)).join('')}</select><span class="micro muted">Identity demonstration only — this is not login.</span></div>`;
}
export function renderSpendingOperations(state,ui,id=''){
 const agents=id?state.agents.filter(a=>a.id===id):state.agents;
 const byModel=Object.entries(state.events.filter(x=>x.kind==='inference'&&(!id||x.agent===id)).reduce((a,event)=>{const m=event.model||'Unknown';a[m]=(a[m]||0)+event.cost;return a;},{}));
 const alerts=agents.filter(a=>a.budget&&a.spent/a.budget>=.5).map(a=>({a,percent:Math.round(100*a.spent/a.budget),band:a.spent/a.budget>=1?100:a.spent/a.budget>=.8?80:50}));
 return `<section class="card card-pad op-section mt-6"><div class="card-title-row"><div><h2 class="card-title">Limits and alerts</h2><p class="card-subtitle">Example limits do not stop real requests</p></div><div class="button-row">${canEdit(state)?small('Model tariffs','op-tariffs'):''}${small('View spending alerts','op-spending-alerts')}</div></div>
 <div class="op-compact-list">${agents.slice(0,ui.spendingLimit||24).map(a=>{const l=state.limits[a.id]||{};return `<div class="op-list-row"><div><a href="#/spending/${encodeURIComponent(a.id)}" class="text-link">${e(a.name)}</a><p>${l.rpm||60} req/min · ${l.tokens||100000} tokens/day · ${e(l.action||'Alert')} after limit</p></div>${canEdit(state)?`${small('Edit limits','op-limits',`data-id="${e(a.id)}"`)}${hasConnection(a,'C')?small('Person limits','op-user-limits',`data-id="${e(a.id)}"`):''}`:''}</div>`}).join('')}</div>
 <div class="section-head"><h2>By model</h2></div><div class="op-signal-grid">${byModel.map(([model,total])=>`<div><strong>${e(formatUSD(total))}</strong><span>${e(model)} · recorded inference samples</span>${button('View requests','spending-model-requests',`data-id="${e(id)}" data-model="${e(model)}"`,'tiny')}</div>`).join('')}</div><p class="micro muted mt-4">These recorded samples are not a reconciliation of reported daily spending.</p>
 ${alerts.length?`<p class="micro muted mt-4">${alerts.length} agent${alerts.length!==1?'s':''} crossed a sample budget threshold (50%, 80% or 100%).</p>`:''}</section>`;
}
export function renderAuditOperations(state,ui){
 const f=ui.auditFilters||{}, count=Object.values(f).filter(Boolean).length;
 return `<div class="op-audit-quick">${button(`Filters${count?` · ${count}`:''}`,'op-audit-toggle-filters',`aria-expanded="${Boolean(ui.auditFiltersOpen)}"`,ui.auditFiltersOpen?'primary tiny':'tiny')}${button('Decisions','op-audit-mode','data-value="events"',ui.auditMode==='changes'?'tiny':'primary tiny')}${button('Admin history','op-audit-mode','data-value="changes"',ui.auditMode==='changes'?'primary tiny':'tiny')}</div>
 ${ui.auditFiltersOpen?`<div class="op-audit-controls"><div class="op-compact-tools"><label>Agent<input class="field-input" id="audit-agent" value="${e(f.agent||'')}" placeholder="Agent or team"></label><label>Model<select class="field-select" id="audit-model">${[['','Any model'],...sampleModels.map(m=>[m.name,m.name])].map(x=>opt(x[0],x[1],f.model||'')).join('')}</select></label>
 <label>Channel<select class="field-select" id="audit-channel">${[['','Any'],['inference','Model'],['tool','Tool']].map(x=>opt(x[0],x[1],f.channel||'')).join('')}</select></label>
 <label>Decision<select class="field-select" id="audit-status">${[['','Any'],['allowed','Allowed'],['blocked','Blocked'],['would_block','Would block'],['outside','Outside gateway'],['pending','Pending']].map(x=>opt(x[0],x[1],f.status||'')).join('')}</select></label><label>Connection<select class="field-select" id="audit-connection">${[['','Any'],['A','Model requests'],['B','Tool execution'],['C','User identity']].map(x=>opt(x[0],x[1],f.connection||'')).join('')}</select></label>
 <label>Person<input class="field-input" id="audit-user" value="${e(f.user||'')}" placeholder="Any person"></label>
 <label>Tool<input class="field-input" id="audit-tool" value="${e(f.tool||'')}" placeholder="Any tool"></label>
 <label>From<input class="field-input" id="audit-date-from" type="date" value="${e(f.from||'')}"></label>
 <label>To<input class="field-input" id="audit-date-to" type="date" value="${e(f.to||'')}"></label></div></div>`:''}`;
}
export function renderAuditChangeTable(state,ui,id=''){
 const changes=state.changes.filter(x=>!id||x.agent===id);
 return `<section class="card card-pad op-section"><h2 class="card-title">Administrative changes</h2><p class="card-subtitle">Changes made in this browser, not immutable audit evidence</p>${changes.length?`<div class="op-compact-list">${changes.map(c=>`<div class="op-list-row"><div><strong>${e(c.kind)} · ${e(c.resource)}</strong><p>${e(c.actor)} · ${e(agentName(state,c.agent))} · ${e(c.time)}</p><details><summary class="text-link">Before and after</summary><pre class="op-pre">Before: ${e(pretty(c.from))}\nAfter: ${e(pretty(c.to))}</pre></details></div></div>`).join('')}</div>`:info('No settings have been changed yet. An operator can review a tool or modify an agent to create a sample record.')}</section>`;
}
export function renderOpsDrawer(state,ui){
 const d=ui.drawer;if(!d?.kind?.startsWith('op-'))return null;
 const a=agentById(state,d.id);
 if(d.kind==='op-tool'){
  const t=toolById(state,d.id);if(!t)return null;
  const agent=agentById(state,t.agent),status=toolOperationalStatus(agent,t),current=ui.toolDraft?.id===t.id?ui.toolDraft:null;
  const options=[['Read','Read'],['Write','Write'],['Critical','Critical / destructive'],['Unclassified','Unclassified']];
  const review=`<form id="op-tool-form" data-id="${e(t.id)}"><input type="hidden" name="expectedVersion" value="${t.schemaVersion}">
   ${select('Classification','type',options,current?.type||t.type)}
   ${select('Decision','decision',[['approved','Approve for catalog'],['rejected','Reject'],['pending','Keep pending']],current?.decision||t.reviewStatus||(t.approved?'approved':'pending'))}
   ${select('Supervision','supervision',[['autonomous','Autonomous'],['notify','Notify'],['approval','Human approval before execution']],current?.supervision||t.supervision||'autonomous')}
   <p class="micro muted">Human approval only works for tool calls routed through the execution gateway.</p>
   <div class="modal-actions"><button type="submit" class="btn primary">Review changes</button></div></form>`;
  const content=`<div class="op-attribute"><span>Agent</span><a class="text-link" href="${linkAgent(agent)}">${e(agent.name)}</a></div>
  <div class="op-attribute"><span>Execution</span><strong>${e(status.label)}</strong></div>
  <div class="op-attribute"><span>Suggested class</span><strong>${e(t.type)} · ${e(t.classification||'suggested')}</strong></div>
  <div class="op-attribute"><span>Review status</span><strong>${e(t.reviewStatus|| (t.approved?'approved (suggested)':'pending'))}</strong></div>
  <div class="op-attribute"><span>Schema</span><strong>Version ${t.schemaVersion||1}</strong></div>
  <pre class="op-pre">${e(pretty(t.schema||{}))}</pre>
  ${t.control!=='B'||!hasConnection(agent,'B')?`<div class="tip">${I('unplug',16)} Tool execution is outside the gateway, regardless of approval.</div>`:''}
  ${canEdit(state)&&agent.mode!=='retired'?`<h3>Review tool</h3>${review}`:info('Auditors can inspect, but cannot change tools.')}
  <h3>Change history</h3>${state.changes.filter(c=>c.agent===t.agent&&c.resource===t.name).slice(0,5).map(c=>`<p class="micro">${e(c.kind)} · ${e(c.actor)} · ${e(c.time)}</p>`).join('')||info('No changes recorded yet.')}
  <h3>Recent use</h3>${state.events.filter(ev=>ev.agent===t.agent&&ev.action===t.name).slice(0,3).map(ev=>`<p class="micro">${e(ev.id)} · ${e(ev.status)}</p>`).join('')||info('No requests recorded yet.')}
  ${canEdit(state)&&agent.mode!=='retired'?small('Schema change example','op-schema-change',`data-id="${e(t.id)}"`):''}
  `;
  return drawer(t.name,content);
 }
 if(d.kind==='op-approval-details'){
  const item=state.approvals.find(x=>x.id===d.id);if(!item)return null;
  return drawer(`Execution request ${item.id}`,`<h3>${e(item.action)}</h3><p>${e(item.reason)}</p><dl class="drawer-dl"><dt>Agent</dt><dd>${e(agentName(state,item.agent))}</dd><dt>Requester</dt><dd>${e(item.requestedBy)}</dd><dt>Trace</dt><dd>${e(item.trace||'Not recorded')}</dd><dt>Status</dt><dd>${e(item.status)}</dd><dt>Deadline</dt><dd data-approval-expiry-time>${e(item.expires)} (sample)</dd></dl><h3>Arguments</h3><pre class="op-pre">${e(pretty(item.arguments||{amount:'***',target:'***'}))}</pre><p class="micro muted">Sample masked arguments; no encrypted backend payload is available.</p>${item.status==='pending'?small('Simulate deadline expiry','op-expire-approval',`data-id="${e(item.id)}"`):''}${item.trace?`<p class="mt-4"><a class="text-link" href="#/audit/${encodeURIComponent(item.agent)}">See audit for this agent</a></p>`:''}`);
 }
 if(d.kind==='op-history'){
  if(!a)return null;const log=state.changes.filter(x=>x.agent===a.id);
  return drawer(`${a.name} · changes`,log.length?log.map(c=>`<section class="op-history-entry"><strong>${e(c.kind)} · ${e(c.resource)}</strong><p class="micro muted">${e(c.actor)} · ${e(c.time)}</p><details><summary class="text-link">See changes</summary><pre class="op-pre">Before: ${e(pretty(c.from))}\nAfter: ${e(pretty(c.to))}</pre></details></section>`).join(''):info('No changes have been made in this browser yet.'));
 }
 if(d.kind==='op-rule-test'){
  const rule=state.rules.find(r=>r.id===d.id);if(!rule)return null;
  const numeric=rule.parameter?rule.comparator||'>':'(no parameter)';
  return drawer(`Try ${rule.id}`,`<p>Rule ${e(rule.effect)} on ${e(rule.type)} · ${e(rule.parameter||'all parameters')} ${e(numeric)} ${e(rule.value||'')}</p>${rule.parameter?`${[8,25].map(n=>{const limit=Number(rule.value);const matched=rule.comparator==='>'?n>limit:rule.comparator==='<'?n<limit:rule.comparator==='='?n===limit:false;return `<div class="op-attribute"><span>Sample ${e(rule.parameter)} = ${n}</span><strong>${matched?e(rule.effect.toUpperCase()):'No rule match'}</strong>${button('Test request','op-simulate-rule',`data-id="${e(rule.id)}" data-value="${n}"`,'tiny')}</div>`}).join('')}`:''}${info('Illustrative rule evaluation. It is not a Cedar authorization result.')}`);
 }
 if(d.kind==='op-transaction'){
  const ev=state.events.find(x=>x.id===d.id);if(!ev)return null;
  const related=state.events.filter(x=>x.agent===ev.agent&&x.action===ev.action);
  const approvals=state.approvals.filter(x=>x.trace===ev.id||x.action.startsWith(ev.action));
  return drawer(`Request timeline · ${ev.id}`,`<p class="drawer-lead">${e(ev.action)}</p><p class="micro muted">This view groups matching sample records. Without transaction correlation IDs, it cannot establish a complete causal chain.</p><div class="step-list">${related.map((x,i)=>`<div class="step"><span class="step-number">${i+1}</span><div class="step-main"><strong>${e(x.kind==='tool'?'Tool execution':'Model request')} · ${e(x.status)}</strong><p>${e(x.id)} · ${e(x.rule)} · ${e(x.version)}</p><p>${e(x.reason)}</p></div></div>`).join('')}${approvals.map(x=>`<div class="step"><span class="step-number">${I('clock',14)}</span><div class="step-main"><strong>Approval · ${e(x.status)}</strong><p>${e(x.id)} · ${e(x.requestedBy)}</p></div></div>`).join('')}</div><h3>Evidence</h3>${ev.evidence?info('A sample event record is present. S3 Object Lock, retention and deletion permissions are not verified.'):info('No evidence is available for this event.')}${small('Show retention test example','op-immutability',`data-id="${e(ev.id)}"`)}`);
 }
 if(d.kind==='op-policy-impact'){
  if(!a)return null;const changed=state.events.filter(ev=>ev.agent===a.id&&ev.status==='allowed');
  return drawer(`${a.name} · policy example`, `<p class="drawer-lead">Sample comparison only</p><p>${changed.length} recorded allow events would be candidates for a decision change under the default-deny Strict preset. Actual results require re-evaluating saved contexts with Cedar.</p>${changed.slice(0,5).map(ev=>`<p class="micro">${e(ev.id)} · ${e(ev.action)} · ${e(ev.status)}</p>`).join('')}`);
 }
 if(d.kind==='op-spending-alerts'){
  const crossed=state.agents.filter(a=>a.budget&&a.spent/a.budget>=.5);
  return drawer('Spending alerts',crossed.map(a=>{const p=a.spent/a.budget;return `<div class="op-history-entry"><strong>${e(a.name)} · ${p>=1?'100%':p>=.8?'80%':'50%'} threshold</strong><p>${e(formatUSD(a.spent))} of ${e(formatUSD(a.budget))} today. Sample calculation; no notification was sent.</p><div class="spending-inline-actions"><a class="text-link" href="#/spending/${encodeURIComponent(a.id)}">Investigate usage</a>${canEdit(state)?button('Review limits','op-limits',`data-id="${e(a.id)}"`,'tiny'):''}</div></div>`}).join('')||info('No sample agents have crossed a threshold.'));
 }
 return null;
}

export function renderOpsModal(state,ui){
 const m=ui.modal;if(!m?.kind?.startsWith('op-'))return null;
 const a=agentById(state,m.id);const tool=toolById(state,m.id);
 if(m.kind==='op-tool-confirm'){
  const d=ui.toolDraft;if(!d||!tool)return '';
  return modal('Apply tool review?',`<p>Tool: <strong>${e(tool.name)}</strong> · ${e(agentName(state,tool.agent))}</p><p>Class: ${e(d.type)} · Decision: ${e(d.decision)} · Supervision: ${e(d.supervision)}</p><p class="micro muted">The catalog changes in this browser. A local tool stays outside execution control; no production rule is deployed.</p>`,`${button('Back','op-back-tool')}${button('Confirm review','op-confirm-tool','', 'primary')}`);
 }
 if(m.kind==='op-agent-edit'&&a){return formModal('Edit agent details',`<form id="op-agent-form" data-id="${e(a.id)}">${field('Name','name',a.name,'text','required maxlength="54"')}${field('Owner','owner',a.owner,'text','required maxlength="54"')}${field('Team','team',a.team,'text','required maxlength="54"')}${field('Description','description',a.description||'')}${field('Version','version',a.version||'1.0.0')}${ui.opError?`<p class="op-error" role="alert">${e(ui.opError)}</p>`:''}${formActions('Save details')}</form>`);}
 if(m.kind==='op-models'&&a){return formModal(`${a.name} · allowed models`,`<form id="op-models-form" data-id="${e(a.id)}"><p>Only selected models would be permitted when rules are enforced.</p>${sampleModels.map(model=>`<label class="op-check"><input type="checkbox" name="model" value="${e(model.name)}" ${(a.allowedModels||sampleModels.map(x=>x.name)).includes(model.name)?'checked':''}><span>${e(model.name)}</span></label>`).join('')}${ui.opError?`<p class="op-error" role="alert">${e(ui.opError)}</p>`:''}${formActions('Save allowed models')}</form>`);}
 if(m.kind==='op-confirm-agent'&&a){
  const kind=m.action;const title=kind==='rotate'?'Rotate example credential?':kind==='revoke'?'Revoke example credential?':'Retire this example agent?';
  return modal(title,`<p><strong>${e(a.name)}</strong></p><p>${kind==='rotate'?'The previous example version remains active until you revoke it.':kind==='revoke'?'The current example version will be marked revoked.': 'The agent will be removed from active operations. Existing sample audit records remain.'}</p><p class="micro muted">No authentication token is issued or invalidated outside this browser.</p>`,`${button('Cancel','close-overlay')}${button('Confirm','op-confirm-agent-action','',kind==='retire'?'danger':'primary')}`);
 }
 if(m.kind==='op-create-rule'&&a){const tools=toolsForAgent(a.id,state);return formModal('Create a custom rule',`<form id="op-rule-form" data-id="${e(a.id)}">${select('Effect','effect',[['deny','Deny'],['allow','Allow']],'deny')}${select('Tool class','type',[['Any','Any'],['Read','Read'],['Write','Write'],['Critical','Critical'],['Unclassified','Unclassified']],'Any')}${select('Specific tool (for parameter checks)','toolId',[['','Any tool'],...tools.map(t=>[t.id,t.name])],'')}${field('Parameter (optional)','parameter','','text','placeholder="e.g. amount"')}${select('Comparison','comparator',[['>','Greater than'],['<','Less than'],['=','Equals']],'>')}${field('Value','value','10')}<p class="micro muted">Parameters are validated against the sample tool schema. This does not execute Cedar or deploy a policy.</p>${ui.opError?`<p class="op-error" role="alert">${e(ui.opError)}</p>`:''}${formActions('Save example rule')}</form>`);}
 if(m.kind==='op-cedar-editor'&&a){return formModal('Cedar policy editor · preview',`<form id="op-cedar-form" data-id="${e(a.id)}"><label class="field-group"><span class="field-label">Cedar policy text</span><textarea class="field-input op-textarea" name="cedar" id="op-cedar-text" rows="7" required>${e(ui.cedarDraft||'forbid (principal, action, resource) when { context.amount > 10 };')}</textarea></label><p class="micro muted">The example checks only basic structure. Real Cedar validation needs the generated schema and backend policy engine.</p>${ui.opError?`<p class="op-error" role="alert">${e(ui.opError)}</p>`:''}${formActions('Save example version')}</form>`);}
 if(m.kind==='op-mcp'&&a){const tools=toolsForAgent(a.id,state);return formModal(`${a.name} · tool destinations`,`<form id="op-mcp-form" data-id="${e(a.id)}">${select('Tool','toolId',tools.map(t=>[t.id,t.name]),tools[0]?.id||'')}${select('Execution path','control',[['B','Through tool gateway (example)'],['A','Outside tool gateway']], 'B')}${field('Destination label','destination','internal-mcp-server','','placeholder="Example target name"')}<p class="micro muted">Saving changes the preview catalog. It does not register or verify a real MCP server.</p>${ui.opError?`<p class="op-error" role="alert">${e(ui.opError)}</p>`:''}${formActions('Save example destination')}</form>`);}
 if(m.kind==='op-identity'&&a){const c=state.identityConfig[a.id]||{};return formModal(`${a.name} · identity settings`,`<form id="op-identity-form" data-id="${e(a.id)}">${field('OIDC issuer URL','issuer',c.issuer||'https://identity.example.test','url','required')}${field('Accepted client / audience','audience',c.audience||'sample-client','text','required')}${select('Missing user token','missing',[['agent','Continue as agent'],['reject','Reject request']],c.missing||'agent')}<p class="micro muted">This example configuration is not verified against an identity provider. No token is accepted by a real API.</p>${ui.opError?`<p class="op-error" role="alert">${e(ui.opError)}</p>`:''}${formActions('Save example settings')}</form>`);}
 if(m.kind==='op-user-limits'&&a){const l=state.userLimits?.[a.id]||{};return formModal(`${a.name} · person limits`,`<form id="op-user-limits-form" data-id="${e(a.id)}">${field('Identified person','person',l.person||'Maya Chen','text','required')}${field('Requests per minute','rpm',l.rpm||20,'number','min="1" required')}${select('Action','action',[['alert','Alert'],['throttle','Throttle'],['block','Block']],l.action||'alert')}<p class="micro muted">Illustrative per-person limit. Requests without identity still count at agent level.</p>${ui.opError?`<p class="op-error" role="alert">${e(ui.opError)}</p>`:''}${formActions('Save example person limit')}</form>`);}
 if(m.kind==='op-limits'&&a){const l=state.limits[a.id]||{};return formModal(`${a.name} · limits`,`<form id="op-limits-form" data-id="${e(a.id)}">${field('Daily budget (USD)','budget',a.budget,'number','min="1" max="100000" required')}${field('Requests per minute','rpm',l.rpm||60,'number','min="1" max="100000" required')}${field('Tokens per day','tokens',l.tokens||100000,'number','min="1" max="10000000" required')}${select('Action when limit is exceeded','action',[['alert','Alert only'],['throttle','Throttle (429)'],['block','Block (403)']],l.action||'alert')}<p class="micro muted">These options illustrate the interface; no server-side throttling or blocking occurs.</p>${ui.opError?`<p class="op-error" role="alert">${e(ui.opError)}</p>`:''}${formActions('Save example limits')}</form>`);}
 if(m.kind==='op-tariffs'){return formModal('Model tariffs',`<form id="op-tariffs-form">${sampleModels.map(model=>`<fieldset class="op-fieldset"><legend>${e(model.name)}</legend>${field('Input · USD/1K tokens',`input_${model.name}`,state.modelTariffs[model.name]?.input||0,'number','min="0" step="0.0001" required')}${field('Output · USD/1K tokens',`output_${model.name}`,state.modelTariffs[model.name]?.output||0,'number','min="0" step="0.0001" required')}</fieldset>`).join('')}<p class="micro muted">Sample rate configuration. Historical costs are not recalculated.</p>${ui.opError?`<p class="op-error" role="alert">${e(ui.opError)}</p>`:''}${formActions('Save sample tariffs')}</form>`);}
 if(m.kind==='op-immutability')return modal('Retention test · example',`<p>This is an illustrative S3 Object Lock response, not a request to S3.</p><pre class="op-pre">DELETE sample-evidence/${e(m.id)}\n403 AccessDenied (illustrative)\nMode: GOVERNANCE (target requirement)\nActual retention: not verified</pre><p>A real proof requires calling S3 with a role lacking bypass permission, recording the denied deletion and verifying the object remains.</p>`,button('Close','close-overlay','', 'primary'));
 return null;
}

const handled=(changed=false,message='')=>({handled:true,changed,message});
export function handleOpsClick(state,ui,element){
 const action=element.dataset.action;if(!action?.startsWith('op-'))return {handled:false};
 const id=element.dataset.id;
 const a=agentById(state,id),tool=toolById(state,id);
 const sensitive=new Set(['op-edit-agent','op-models','op-rotate-token','op-revoke-token','op-retire-agent','op-confirm-agent-action','op-create-rule','op-cedar-editor','op-mcp','op-identity','op-limits','op-user-limits','op-tariffs','op-schema-change','op-confirm-tool','op-add-sample-event','op-expire-approval']);
 if(sensitive.has(action)&&!canEdit(state) && !['op-expire-approval'].includes(action))return handled(false,'Operator permission required');
 const open=(slot,kind,details={})=>{ui[slot]={kind,...details};ui.opError='';return handled()};
 switch(action){
 case 'op-open-tool':if(!tool)return handled();ui.toolDraft=null;return open('drawer','op-tool',{id});
 case 'op-back-tool':ui.modal=null;return handled();
 case 'op-confirm-tool':{
   const d=ui.toolDraft;const target=toolById(state,d?.id);if(!d||!target||ui.modal?.kind!=='op-tool-confirm'||ui.modal.id!==d.id)return handled();
   if(!reviseTool(state,d.id,d)){ui.modal=null;return handled(false,'Tool changed or review cannot be applied. Reopen its latest version.');}
   ui.drawer=null;ui.modal=null;ui.toolDraft=null;return handled(true,'Tool review saved in preview');
 }
 case 'op-schema-change':{
   if(!tool)return handled();const before={version:tool.schemaVersion,schema:tool.schema};tool.schemaVersion=(tool.schemaVersion||1)+1;tool.schema={...tool.schema,confirmation_code:'string'};tool.classification='suggested';tool.reviewStatus='pending';tool.approved=false;
   changeRecord(state,'Schema update example',tool.agent,tool.name,before,{version:tool.schemaVersion,schema:tool.schema});ui.drawer={kind:'op-tool',id};return handled(true,'New example schema requires review');
 }
 case 'op-edit-agent':if(a)return open('modal','op-agent-edit',{id});return handled();
 case 'op-models':if(a)return open('modal','op-models',{id});return handled();
 case 'op-rotate-token':case 'op-revoke-token':case 'op-retire-agent':if(a)return open('modal','op-confirm-agent',{id,action:action.split('-')[1]});return handled();
 case 'op-confirm-agent-action':{
   if(ui.modal?.kind!=='op-confirm-agent')return handled();const target=agentById(state,ui.modal.id),kind=ui.modal.action;
   if(!target)return handled();const before=kind==='retire'?{mode:target.mode,active:target.active}:{...(state.credentials[target.id]||{version:1,revoked:0})};
   if(kind==='retire'){target.mode='retired';target.active=false;}
   else{const cred=state.credentials[target.id]||{version:1,revoked:0};if(kind==='rotate'){cred.version++;cred.oldActive=true;}else{cred.revoked++;cred.oldActive=false;}state.credentials[target.id]=cred;}
   changeRecord(state,`Agent ${kind}`,target.id,target.name,before,kind==='retire'?{mode:target.mode,active:target.active}:state.credentials[target.id]);ui.modal=null;return handled(true,`Example agent ${kind} saved`);
 }
 case 'op-create-rule':if(a)return open('modal','op-create-rule',{id});return handled();
 case 'op-cedar-editor':if(a)return open('modal','op-cedar-editor',{id});return handled();
 case 'op-simulate-historical-policy':if(a)return open('drawer','op-policy-impact',{id});return handled();
 case 'op-show-agent-tools':if(a){ui.catalogTab='tools';ui.catalogSearch=a.name;ui.catalogToolFilter='all';return handled(false,'Open Catalog → Tools for this agent');}return handled();
 case 'op-tool-discovery':{
  if(!canEdit(state))return handled(false,'Operator permission required');
  const id=`demo-tool-${state.tools.length+1}`;state.tools.push({id,name:`New tool ${state.tools.length+1}`,agent:'atlas',type:'Unclassified',approved:false,reviewStatus:'pending',classification:'suggested',control:'A',supervision:'autonomous',schemaVersion:1,schema:{input:'string'}});
  changeRecord(state,'Example tool discovery','atlas',id,null,{name:id,class:'Unclassified'});return handled(true,'Example tool discovered · review required');
 }
 case 'op-history':if(a)return open('drawer','op-history',{id});return handled();
 case 'op-rule-test':return open('drawer','op-rule-test',{id});
 case 'op-simulate-rule':{
   const r=state.rules.find(rule=>rule.id===id);if(!r)return handled();
   const tool=r.toolId?toolById(state,r.toolId):toolsForAgent(r.agent,state)[0];if(!tool)return handled(false,'No tool available');
   const event=appendScenario(state,{agentId:r.agent,action:tool.name,channel:'tool',toolId:tool.id,userRole:'operator',parameters:{[r.parameter]:Number(element.dataset.value)}});
   if(!event)return handled(false,'Could not create sample request');ui.drawer={kind:'event',id:event.id};return handled(true,`Sample decision: ${event.status}`);
 }
 case 'op-user-limits':if(a)return open('modal','op-user-limits',{id});return handled();
 case 'op-mcp':if(a)return open('modal','op-mcp',{id});return handled();
 case 'op-identity':if(a)return open('modal','op-identity',{id});return handled();
 case 'op-limits':if(a)return open('modal','op-limits',{id});return handled();
 case 'op-tariffs':return open('modal','op-tariffs');
 case 'op-spending-alerts':return open('drawer','op-spending-alerts');
 case 'op-audit-toggle-filters':ui.auditFiltersOpen=!ui.auditFiltersOpen;return handled();
 case 'op-audit-mode':ui.auditMode=element.dataset.value==='changes'?'changes':'events';return handled();
 case 'op-approval-details':return open('drawer','op-approval-details',{id});
 case 'op-view-tool-reviews':ui.catalogTab='tools';ui.catalogToolFilter='attention';ui.catalogSearch='';return handled();
 case 'op-expire-approval':{
   if(!canApprove(state))return handled(false,'Approver role required to simulate expiry');
   const item=state.approvals.find(x=>x.id===id);if(!item||item.status!=='pending')return handled(false,'Request is no longer pending');
   item.status='expired';item.expires='Expired (sample)';changeRecord(state,'Approval expiry example',item.agent,item.id,'pending','expired');ui.drawer=null;return handled(true,'Sample request expired; tool was not run');
 }
 case 'op-transaction':return open('drawer','op-transaction',{id});
 case 'op-immutability':return open('modal','op-immutability',{id});
 case 'op-add-sample-event':{
   const a=agentById(state,'atlas');if(!a)return handled();
   const tool=toolsForAgent(a.id,state).find(t=>t.type==='Read');appendScenario(state,{agentId:a.id,action:tool.name,channel:'inference',toolId:tool.id,userRole:'operator'});
   return handled(true,ui.activityPaused?'Request added to sample buffer':'Sample request added');
 }
 case 'op-replay-buffer':ui.activityPaused=false;ui.pausedIds=null;return handled(false,'Sample feed resumed');
 case 'op-presentation':state.presentation=!state.presentation;return handled(true,state.presentation?'Presentation view on':'Presentation view off');
 default:return {handled:false};
 }
}
export function handleOpsSubmit(state,ui,form){
 const id=form.getAttribute('id');if(!id?.startsWith('op-'))return {handled:false};
 if(!canEdit(state))return handled(false,'Operator permission required');
 const fd=new FormData(form),data=Object.fromEntries(fd.entries());const agentId=form.dataset.id,a=agentById(state,agentId);
 const close=msg=>{ui.modal=null;ui.opError='';return handled(true,msg)};
 const fail=msg=>{ui.opError=msg;return handled(false,'')};
 switch(id){
 case 'op-tool-form':{
   const tool=toolById(state,agentId);if(!tool)return fail('Tool not found');
   ui.toolDraft={id:tool.id,type:data.type,decision:data.decision,supervision:data.supervision,expectedVersion:Number(data.expectedVersion)};
   ui.modal={kind:'op-tool-confirm',id:tool.id};return handled();
 }
 case 'op-agent-form':{
   if(!a||!data.name?.trim()||!data.owner?.trim())return fail('Name and owner are required');
   const before={name:a.name,owner:a.owner,team:a.team,description:a.description||'',version:a.version||'1.0.0'};
   Object.assign(a,{name:data.name.trim().slice(0,54),owner:data.owner.trim().slice(0,54),team:data.team.trim().slice(0,54),description:data.description?.trim().slice(0,200),version:data.version?.trim().slice(0,30)});
   changeRecord(state,'Agent details',a.id,a.name,before,{name:a.name,owner:a.owner,team:a.team,description:a.description,version:a.version});return close('Agent details saved in preview');
 }
 case 'op-models-form':{
   if(!a)return fail('Agent not found');const chosen=fd.getAll('model').filter(m=>sampleModels.some(x=>x.name===m));if(!chosen.length)return fail('Select at least one model');
   const before=a.allowedModels||sampleModels.map(m=>m.name);a.allowedModels=chosen;changeRecord(state,'Allowed models',a.id,a.name,before,chosen);return close('Allowed models updated in preview');
 }
 case 'op-rule-form':{
   const r=addRule(state,agentId,{effect:data.effect,type:data.type,toolId:data.toolId,parameter:data.parameter?.trim(),comparator:data.comparator,value:data.value});
   if(r.error)return fail(r.error);return close('Example rule saved');
 }
 case 'op-cedar-form':{
   const raw=String(data.cedar||'').trim();ui.cedarDraft=raw;
   if(!/\b(permit|forbid)\s*\(/.test(raw)||!raw.includes('{')||!raw.includes('}')||!raw.endsWith(';'))return fail('Example syntax check failed: expected permit/forbid, a condition and a semicolon');
   const effect=raw.startsWith('permit')?'allow':'deny';const r=addRule(state,agentId,{effect,type:'Any',toolId:'',parameter:'',comparator:'',value:'',raw});
   if(r.error)return fail(r.error);return close('Example Cedar text saved as a draft version');
 }
 case 'op-mcp-form':{
   if(!a)return fail('Agent unavailable');const tool=toolById(state,data.toolId);if(!tool||tool.agent!==a.id||!['B','A'].includes(data.control))return fail('Choose a valid tool');
   const before={control:tool.control,destination:tool.destination};tool.control=data.control;tool.destination=String(data.destination||'').trim().slice(0,80);tool.classification='suggested';tool.reviewStatus='pending';tool.approved=false;
   changeRecord(state,'Tool destination example',a.id,tool.name,before,{control:tool.control,destination:tool.destination});return close('Example destination saved; review the tool again');
 }
 case 'op-identity-form':{
   if(!a)return fail('Agent unavailable');let url;try{url=new URL(data.issuer)}catch{return fail('Enter a valid issuer URL')}
   if(url.protocol!=='https:'||!data.audience?.trim())return fail('Use an HTTPS issuer and a client identifier');
   const before=state.identityConfig[a.id]||null;state.identityConfig[a.id]={issuer:url.href,audience:data.audience.trim(),missing:data.missing,verified:false};
   changeRecord(state,'Identity settings example',a.id,a.name,before,state.identityConfig[a.id]);return close('Example identity settings saved · not verified');
 }
 case 'op-user-limits-form':{
   if(!a||!data.person?.trim()||!Number.isInteger(Number(data.rpm))||Number(data.rpm)<1)return fail('Enter a person and a positive rate limit');
   const before=state.userLimits?.[a.id]||null;if(!state.userLimits)state.userLimits={};state.userLimits[a.id]={person:data.person.trim(),rpm:Number(data.rpm),action:data.action};changeRecord(state,'Person limits',a.id,a.name,before,state.userLimits[a.id]);return close('Example person limit saved');
 }
 case 'op-limits-form':{
   if(!a)return fail('Agent unavailable');const budget=Number(data.budget),rpm=Number(data.rpm),tokens=Number(data.tokens);
   if(!Number.isFinite(budget)||budget<1||budget>100000||!Number.isInteger(rpm)||rpm<1||!Number.isInteger(tokens)||tokens<1||!['alert','throttle','block'].includes(data.action))return fail('Enter valid positive limits and an action');
   const before={budget:a.budget,limits:state.limits[a.id]||null};a.budget=budget;state.limits[a.id]={rpm,tokens,action:data.action};changeRecord(state,'Agent limits',a.id,a.name,before,{budget,limits:state.limits[a.id]});return close('Example limits saved');
 }
 case 'op-tariffs-form':{
   const next={};for(const model of sampleModels){const input=Number(fd.get('input_'+model.name)),output=Number(fd.get('output_'+model.name));if(!Number.isFinite(input)||!Number.isFinite(output)||input<0||output<0)return fail('Tariffs must be nonnegative');next[model.name]={input,output};}
   changeRecord(state,'Model tariffs','workspace','Tariffs',state.modelTariffs,next);state.modelTariffs=next;return close('Sample tariffs saved');
 }
 default:return {handled:false};
 }
}
