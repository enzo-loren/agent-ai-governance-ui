import {renderAgentOperations,renderRulesOperations,renderConnectionOperations,renderActivityOperations,renderApprovalsOperations,renderSpendingOperations,renderAuditOperations,renderAuditChangeTable,renderOpsDrawer,renderOpsModal} from './operations.js';
import { ROUTES, CONNECTIONS, POLICY_PRESETS, TOUR } from './data.js';
import { STATUS, escapeHTML as esc, agentById, agentName, canEdit, canApprove, DEMO_REVIEWER, formatUSD, findings, hasConnection, openApprovals, previewImpact, sampleModels, toolsForAgent, totalSpend, connectionProfile, identitySamples, policyGaps, approvalReady, approvalBlocker, toolOperationalStatus, catalogToolSummary, catalogIdentities } from './domain.js';
import {icon as I} from './icons.js';
import {REPORTING_DATE} from './mock/fixtures.js';

const safe = esc;
export function statusPill(status,mini=false){const s=STATUS[status]||STATUS.missing;return `<span class="pill${mini?' mini':''}" data-status="${status}">${I(s.icon,mini?11:13)}${s.label}</span>`;}
export function connectionDots(agent,state){
  const profile=connectionProfile(agent,state);
  const isOn=id=>hasConnection(agent,id)&&(id!=='B'||profile.controlledTools>0);
  const tags=[
    ['A','Model','Model requests are configured through the gateway'],
    ['B',`Tools · ${profile.controlledTools}`,profile.toolLabel],
    ['C','Identity','User identity applies only to requests carrying a valid token']
  ];
  return `<span class="path-tags" aria-label="Configured paths: ${tags.map(([id,label])=>`${label.replace(/ · .*/, '')} ${isOn(id)?'on':'off'}`).join(', ')}">${tags.map(([id,label,desc])=>`<span class="path-tag ${isOn(id)?'on':'off'}" title="${safe(desc)}">${I(isOn(id)?'check':'unplug',11)}${safe(label)}</span>`).join('')}</span>`;
}
function pageHeading(eyebrow,title,subtitle='',actions=''){return `<header class="page-heading"><div><div class="page-eyebrow"><span class="mini-line"></span>${safe(eyebrow)}</div><h1>${safe(title)}</h1>${subtitle?`<p>${safe(subtitle)}</p>`:''}</div>${actions?`<div class="page-actions">${actions}</div>`:''}</header>`;}
function btn(label,action,{variant='',icon='',data='',disabled=false,small=false}={}){return `<button type="button" class="btn ${variant} ${small?'tiny':''}" data-action="${action}" ${data} ${disabled?'disabled':''}>${icon?I(icon,15):''}${safe(label)}</button>`;}
function fullAgentLink(agent){return agent?`#/agent/${encodeURIComponent(agent.id)}`:'#/catalog';}
function personBadge(agent){return `<div class="avatar ${safe(agent.accent||'mint')}" aria-hidden="true">${safe(agent.initials)}</div>`;}
function agentRow(agent,state){return `<div class="agent-row">${personBadge(agent)}<div class="agent-info"><a href="${fullAgentLink(agent)}" class="agent-name">${safe(agent.name)}</a><div class="agent-small">${safe(agent.team)} · ${safe(agent.owner)}</div></div><div class="agent-right">${connectionDots(agent,state)}<span class="pill pill-outlined mini">${agent.mode==='observe'?'Observe':agent.mode==='enforce'?'Enforce':agent.mode==='retired'?'Retired':'Paused'}</span><a class="icon-btn" aria-label="Open ${safe(agent.name)}" href="${fullAgentLink(agent)}">${I('chevron',16)}</a></div></div>`;}
function agentDirectoryCard(state,a,showConnections=false){
  const users=catalogIdentities(state,a.id);
  const userStatus=!users.connected?'Not connected':users.people.length?`${users.people.length} seen in requests`:'No named requests';
  const section=showConnections===true?'connections':showConnections==='rules'?'rules':'';
  const destination=section?`#/agent/${encodeURIComponent(a.id)}/${section}`:fullAgentLink(a);
  return `<article class="card agent-card"><div class="agent-card-head">${personBadge(a)}<span class="pill pill-outlined mini">${a.mode==='observe'?'Observe':a.mode==='enforce'?'Enforce':a.mode==='retired'?'Retired':'Paused'}</span></div><h3>${safe(a.name)}</h3><p>${safe(a.team)} · ${safe(a.owner)}</p>
  <dl class="catalog-signals">${showConnections==='rules'?`<div><dt>${I('shield-check',14)} Policy</dt><dd>${safe(POLICY_PRESETS.find(p=>p.id===a.preset)?.name||'Not configured')}</dd></div><div><dt>${I('plug',14)} Tools</dt><dd>${safe(catalogToolSummary(a,state))}</dd></div>`:`<div><dt>${I('plug',14)} Tools</dt><dd>${safe(catalogToolSummary(a,state))}</dd></div><div><dt>${I('users',14)} People</dt><dd>${safe(userStatus)}</dd></div>`}</dl>
  <div class="agent-card-footer">${connectionDots(a,state)}<a href="${destination}" class="btn tiny">${showConnections==='rules'?'Manage rules':showConnections?'Manage connections':'Open'} ${I('arrow',13)}</a></div></article>`;
}
function agentBatch(items,limit,showConnections=false,state){
  const slice=items.slice(0,limit);
  return slice.length?`<div class="agent-grid">${slice.map(a=>agentDirectoryCard(state,a,showConnections)).join('')}</div>`:'';
}
function resultsFooter(shown,total,action,label='results'){
  return `<div class="directory-footer"><span>${Math.min(shown,total)} of ${total} ${label}</span>${total>shown?btn('Show more',''+action,{icon:'down'}):''}</div>`;
}
function agentScope(state,id,base){
  const agent=id?agentById(state,id):null;
  return agent?`<div class="scope-bar"><span>${I('layers',15)} ${safe(agent.name)}</span><a href="#/${base}" class="text-link">All agents ${I('x',12)}</a><a class="text-link" href="${fullAgentLink(agent)}">Agent details</a>${base!=='spending'?`<a class="text-link" href="#/spending/${encodeURIComponent(agent.id)}">Spending</a>`:''}</div>`:'';
}
function eventSmall(event,state){return `<div class="activity-item"><span class="activity-glyph">${I(STATUS[event.status]?.icon||'info',16)}</span><div class="activity-body"><div class="space-between"><span class="activity-line">${safe(event.action)}</span>${statusPill(event.status,true)}</div><div class="activity-note">${safe(agentName(state,event.agent))} · ${safe(event.kind==='tool'?'Tool execution':'Model request')} · <button class="text-link" data-action="open-event" data-id="${safe(event.id)}">See why</button></div></div></div>`;}
export function renderAppShell(state,ui,route,content,section="overview"){
  const nav=ROUTES.filter(x=>x.group==='main');const secondary=ROUTES.filter(x=>x.group==='secondary');const current=route==='agent'?(section==='connections'?'connections':section==='rules'?'rules':'catalog'):route==='integrations'?'connections':route;
  const renderNav=x=>`<a href="#/${x.id}" class="nav-link" ${current===x.id?`aria-current="page"`:''}><span class="nav-icon">${I(x.icon,18)}</span>${x.text}${x.id==='approvals'&&openApprovals(state).length?`<span class="nav-count">${openApprovals(state).length}</span>`:''}</a>`;
  const routeTitle=route==='agent'?(section==='connections'?'Connections':section==='rules'?'Rules':'Agent details'):ROUTES.find(r=>r.id===route)?.text||'Overview';
  const tour=state.tour>=0&&state.tour<TOUR.length?TOUR[state.tour]:null;
  const tourBar=tour?`<div class="tour-bar" role="region" aria-label="Guided tour step ${state.tour+1} of ${TOUR.length}"><div class="tour-progress" aria-hidden="true">${TOUR.map((_,i)=>`<span class="${i<=state.tour?'done':''}"></span>`).join('')}</div><div class="tour-body"><strong>${safe(tour.title)}</strong><span>${safe(tour.note)}</span></div>${btn(state.tour===TOUR.length-1?'Finish tour':'Next', 'tour-next',{variant:'primary',small:true,icon:'arrow'})}<button class="icon-btn" data-action="tour-end" aria-label="Exit tour">${I('x',17)}</button></div>`:'';
  return `<div class="app-shell ${state.presentation?'presentation-view':''} ${ui.navOpen?'nav-open':''}"><aside class="sidebar" id="sidebar" aria-label="Primary navigation"><a class="sidebar-brand" href="#/home"><span class="brand-symbol"><span></span></span><span><span class="brand-name">Agent Governance</span><span class="brand-sub">Workspace</span></span></a><nav class="nav-section" aria-label="Workspace"><div class="nav-label">Workspace</div>${nav.map(renderNav).join('')}</nav><nav class="nav-section" aria-label="Connections"><div class="nav-label">Set up</div>${secondary.map(renderNav).join('')}</nav><div class="sidebar-end"><div class="sidebar-divider"></div><button class="nav-link" style="width:100%" data-action="open-settings"><span class="nav-icon">${I('sliders',18)}</span>Appearance</button></div></aside><button class="nav-backdrop" data-action="close-nav" aria-label="Close navigation"></button><div class="main-area"><header class="topbar"><button class="icon-btn menu-btn" data-action="toggle-nav" aria-controls="sidebar" aria-expanded="${ui.navOpen?'true':'false'}" aria-label="Open menu">${I('menu',20)}</button><span class="crumb">Workspace / <strong>${safe(routeTitle)}</strong></span><div class="topbar-right"><span class="role-indicator" title="Current role">${safe(state.role[0].toUpperCase()+state.role.slice(1))}</span><button class="icon-btn" data-action="open-help" aria-label="Help" title="Help">${I('help',19)}</button></div></header>${tourBar}<main class="page-content" id="main" tabindex="-1">${content}</main></div></div>${renderDrawer(state,ui)}${renderModal(state,ui)}${ui.toast?`<div class="toast" role="status">${I('check',15)}${safe(ui.toast)}</div>`:''}`;
}
export function pageHome(state){
  const open=openApprovals(state).length;const recent=state.events.slice(0,4);const toolReview=state.tools.filter(t=>!t.approved).length;
  return `<div class="hero"><div class="hero-main"><div class="hero-kicker">Overview</div><h1>Agent activity,<br>at a glance.</h1><p>Monitor model requests, tool access and spending.</p><div class="flex gap-2">${btn('Open catalog','navigate',{variant:'primary',icon:'arrow',data:'data-route="catalog"'})}</div></div><div class="hero-art" aria-hidden="true"><div class="orbit"><div class="orbit-core">${I('shield-check',51)}</div><span class="orbit-node one">${I('activity',19)}</span><span class="orbit-node two">${I('users',19)}</span><span class="orbit-node three">${I('check',19)}</span></div></div></div>
  ${open?`<div class="banner">${I('clock',19)}<div class="banner-content"><strong>${open} action${open===1?'':'s'} need review.</strong> These connected tool requests are waiting for a reviewer.</div><a href="#/approvals" class="btn tiny">View requests ${I('arrow',14)}</a></div>`:''}
  ${toolReview?`<div class="banner">${I('shield-check',18)}<div class="banner-content"><strong>${toolReview} tool${toolReview===1?'':'s'} need catalog review.</strong> Check classification, approval and supervision before use.</div>${btn('Review tools','op-view-tool-reviews',{small:true,icon:'arrow'})}</div>`:''}
  <div class="stat-grid"><div class="card stat-card"><div class="stat-top">Agents <span class="stat-icon">${I('layers',17)}</span></div><div class="stat-value">${state.agents.length}</div><div class="stat-foot">In your catalog</div></div><div class="card stat-card"><div class="stat-top">Requests observed <span class="stat-icon">${I('activity',17)}</span></div><div class="stat-value">${state.agents.reduce((n,a)=>n+a.requests,0).toLocaleString('en-US')}</div><div class="stat-foot">Reporting period</div></div><div class="card stat-card"><div class="stat-top">AI spending <span class="stat-icon">${I('wallet',17)}</span></div><div class="stat-value">${formatUSD(totalSpend(state))}</div><div class="stat-foot">Reporting period · USD</div></div></div>
  <div class="grid-2 mt-6"><section class="card card-pad"><div class="card-title-row"><div><h2 class="card-title">Your agents</h2><p class="card-subtitle">Showing ${Math.min(4,state.agents.length)} of ${state.agents.length} agents</p></div><a href="#/catalog" class="btn tiny">View catalog ${I('arrow',13)}</a></div>${state.agents.slice(0,4).map(a=>agentRow(a,state)).join('')}</section><section class="card card-pad"><div class="card-title-row"><div><h2 class="card-title">Recent decisions</h2><p class="card-subtitle">Recent actions and decisions</p></div><a href="#/activity" class="btn tiny">All activity ${I('arrow',13)}</a></div>${recent.map(e=>eventSmall(e,state)).join('')}</section></div>
`;
}
export function pageCatalog(state,ui){
  const tab=ui.catalogTab||'agents';
  const q=(ui.catalogSearch||'').toLowerCase().trim();
  const agentList=state.agents.filter(a=>`${a.name} ${a.owner} ${a.team}`.toLowerCase().includes(q));
  const toolList=state.tools.filter(t=>`${t.name} ${t.type} ${agentName(state,t.agent)}`.toLowerCase().includes(q));
  const actions=canEdit(state)?btn('Add agent','add-agent',{variant:'primary',icon:'plus'}):'';
  let body='';
  if(tab==='agents'){
    const limit=ui.catalogAgentLimit||24;
    body=agentList.length?`${agentBatch(agentList,limit,false,state)}<div class="directory-footer"><span>${Math.min(limit,agentList.length)} of ${agentList.length} agents</span>${agentList.length>limit?btn('Show more agents','show-more-catalog',{icon:'down'}):''}</div>`:empty('No matching agents','Try a different name or owner.');
  }
  if(tab==='tools'){
    const all=toolList.map(tool=>({tool,agent:agentById(state,tool.agent),status:toolOperationalStatus(agentById(state,tool.agent),tool)}));
    const counts={routed:all.filter(x=>x.status.key!=='outside').length,attention:all.filter(x=>!x.tool.approved||!['checked','observe','outside'].includes(x.status.key)).length,outside:all.filter(x=>x.status.key==='outside').length};
    const filter=ui.catalogToolFilter||'all';
    const shown=all.filter(x=>filter==='all'||(filter==='checked'&&x.status.key!=='outside')||(filter==='attention'&&(!x.tool.approved||!['checked','observe','outside'].includes(x.status.key)))||(filter==='outside'&&x.status.key==='outside'));
    const mobileRows=shown.slice(0,ui.catalogToolLimit||30).map(({tool,agent,status})=>`<article class="card tool-mobile-card"><div class="space-between"><strong>${safe(tool.name)}</strong><span class="pill mini" data-status="${tool.approved?'allowed':'pending'}">${tool.approved?'Approved':tool.reviewStatus==='rejected'?'Not approved':'Needs review'}</span></div><p>${safe(agent.name)} · ${safe(tool.type)}</p><div class="space-between"><span class="small muted">${safe(status.label)}</span>${btn(tool.approved?'View':'Review','op-open-tool',{small:true,data:`data-id="${safe(tool.id)}" data-mobile-tool="true"`})}</div></article>`).join('');
    const controls=`<div class="catalog-filters" role="group" aria-label="Filter tools by operational status">${[
      ['all','All',all.length],['checked','Routed',counts.routed],['attention','Needs action',counts.attention],['outside','Outside gateway',counts.outside]
    ].map(([id,label,num])=>`<button class="filter-chip ${filter===id?'selected':''}" data-action="catalog-tool-filter" data-value="${id}" aria-pressed="${filter===id}">${safe(label)} <span>${num}</span></button>`).join('')}</div>`;
    body=`${controls}${shown.length?`<div class="card table-scroll tool-desktop"><table class="table"><thead><tr><th>Tool</th><th>Agent</th><th>Class</th><th>Approval</th><th>Execution</th><th></th></tr></thead><tbody>${shown.slice(0,ui.catalogToolLimit||30).map(({tool,agent,status})=>`<tr><td><button class="row-link" data-action="op-open-tool" data-id="${safe(tool.id)}">${safe(tool.name)}</button><span class="subtext">${safe(status.detail)}</span></td><td><a href="${fullAgentLink(agent)}" class="text-link">${safe(agent.name)}</a></td><td>${safe(tool.type)}</td><td>${tool.approved?`<span class="pill mini" data-status="allowed">${I('check',11)}Approved</span>`:`<span class="pill mini" data-status="pending">${I('clock',11)}${tool.reviewStatus==='rejected'?'Not approved':'Needs review'}</span>`}</td><td><span class="pill mini" data-status="${status.tone}">${I(status.key==='outside'?'unplug':status.key==='checked'?'check':status.key==='observe'?'eye':'clock',11)}${safe(status.label)}</span></td><td>${btn(tool.approved?'View':'Review','op-open-tool',{small:true,data:`data-id="${safe(tool.id)}"`})}</td></tr>`).join('')}</tbody></table></div><div class="tool-mobile-list">${mobileRows}</div>`:empty('No tools in this view','Try a different filter or search.',btn('Show all','catalog-tool-filter',{data:'data-value="all"'}))}${shown.length?resultsFooter(ui.catalogToolLimit||30,shown.length,'show-more-tools','tools'):''}`;
  }
  if(tab==='identities'){
    const matching=state.agents.filter(a=>`${a.name} ${a.owner} ${a.team}`.toLowerCase().includes(q));
    const visible=matching.slice(0,ui.catalogPeopleLimit||24);
    body=`<p class="catalog-context">People observed in requests, grouped by agent. Unidentified requests stay attributed to the agent.</p>
    ${visible.length?`<div class="card table-scroll"><table class="table"><thead><tr><th>Agent</th><th>Identity</th><th>Recent requests</th><th>Current connection</th></tr></thead><tbody>${visible.map(a=>{
      const info=catalogIdentities(state,a.id);
      if(!info.connected)return `<tr><td><a class="text-link" href="${fullAgentLink(a)}">${safe(a.name)}</a></td><td>—</td><td>Requests use the agent identity</td><td><button class="text-link" data-action="open-integration-agent" data-id="${safe(a.id)}">Connect identity</button></td></tr>`;
      const rows=info.people.map(person=>`<tr><td><a class="text-link" href="${fullAgentLink(a)}">${safe(a.name)}</a></td><td><strong>${safe(person.name)}</strong></td><td>${person.requests} identified event${person.requests===1?'':'s'}</td><td><span class="pill mini" data-status="allowed">${I('check',11)}Configured</span></td></tr>`).join('');
      const anonymous=info.unnamed?`<tr><td><a class="text-link" href="${fullAgentLink(a)}">${safe(a.name)}</a></td><td>No user identity</td><td>${info.unnamed} model request${info.unnamed===1?'':'s'}</td><td><span class="pill mini" data-status="outside">${I('info',11)}As agent</span></td></tr>`:'';
      return rows+anonymous||`<tr><td><a class="text-link" href="${fullAgentLink(a)}">${safe(a.name)}</a></td><td>No named requests yet</td><td>—</td><td><span class="pill mini" data-status="allowed">${I('check',11)}Configured</span></td></tr>`;
    }).join('')}</tbody></table></div>${resultsFooter(ui.catalogPeopleLimit||24,matching.length,'show-more-people','agents')}`:empty('No matching agents','Try a different agent name.')}`;
  }
  if(tab==='models')body=`<div class="grid-3">${sampleModels.map(m=>`<div class="card card-pad"><span class="stat-icon">${I('sparkles',18)}</span><h3 style="font-size:16px;margin:20px 0 2px">${safe(m.name)}</h3><p class="muted small" style="margin:0 0 17px">${safe(m.provider)}</p><div class="space-between"><span class="small muted">Observed with ${new Set(state.events.filter(e=>e.model===m.name).map(e=>e.agent)).size} agents</span>${I('check',15)}</div></div>`).join('')}</div>`;
  return `${pageHeading('Your workspace','Catalog','Agents, tools, people and models.',actions)}<div class="toolbar"><div class="tabs" role="tablist" aria-label="Catalog sections">${[['agents','Agents'],['tools','Tools'],['identities','People'],['models','Models']].map(([id,label])=>`<button role="tab" class="tab" data-action="catalog-tab" data-value="${id}" aria-selected="${id===tab}">${label}</button>`).join('')}</div><div class="grow"></div>${tab!=='models'?`<label class="input-wrap" style="width:min(300px,100%)">${I('search',17)}<input id="catalog-search" placeholder="Search ${tab==='identities'?'agents':tab}..." aria-label="Search ${tab==='identities'?'agents':tab}" value="${safe(ui.catalogSearch||'')}" /></label>`:''}</div>${body}`;
}
export function pageAgent(state,ui,id,section="overview"){
  const a=agentById(state,id);if(!a)return `${pageHeading('Catalog','Agent not found')}<a href="#/catalog" class="btn">Back to catalog</a>`;
  const events=state.events.filter(e=>e.agent===id).slice(0,4);const profile=connectionProfile(a,state);const ids=identitySamples(state,id);const preset=POLICY_PRESETS.find(p=>p.id===a.preset);
  const modeBtn=canEdit(state)&&a.mode!=='retired'?`${btn(a.mode==='enforce'?'Switch to Observe':'Review rules','preview-enforce',{variant:a.mode==='enforce'?'':'primary',data:`data-id="${safe(a.id)}"`,icon:a.mode==='enforce'?'eye':'shield'})}${btn(a.mode==='suspended'?'Resume agent':'Pause agent','toggle-pause',{variant:a.mode==='suspended'?'':'danger',data:`data-id="${safe(a.id)}"`})}`:'';
  const tabs=`<nav class="agent-tabs" aria-label="${safe(a.name)} sections"><a class="agent-tab" href="${fullAgentLink(a)}" ${section==='overview'?'aria-current="page"':''}>Overview</a><a class="agent-tab" href="${fullAgentLink(a)}/connections" ${section==='connections'?'aria-current="page"':''}>Connections</a><a class="agent-tab" href="${fullAgentLink(a)}/rules" ${section==='rules'?'aria-current="page"':''}>Rules</a></nav>`;
  const top=`<div class="page-eyebrow"><a href="${section==='connections'?'#/connections':section==='rules'?'#/rules':'#/catalog'}" class="text-link">${section==='connections'?'Connections':section==='rules'?'Rules':'Catalog'}</a> ${I('chevron',12)} Agent</div><div class="detail-head">${personBadge(a)}<div><h1>${safe(a.name)}</h1><p>${safe(a.team)} · Owned by ${safe(a.owner)}</p></div><div class="detail-actions">${section==='overview'?modeBtn:''}</div></div>${tabs}`;
  if(section==='connections')return `${top}${pageAgentConnections(state,a)}`;
  if(section==='rules')return `${top}${pageRules(state,ui,a.id,true)}`;
  return `${top}<div class="detail-summary"><div class="detail-metric"><strong>${a.requests.toLocaleString('en-US')}</strong><span>Model requests</span></div><div class="detail-metric"><strong>${formatUSD(a.spent)}</strong><span>Daily spending</span></div><div class="detail-metric"><strong>${profile.controlledTools} of ${profile.totalTools}</strong><span>Tools routed</span></div></div>${renderAgentOperations(state,a)}<div class="detail-grid"><div class="detail-stack"><section class="card card-pad"><div class="card-title-row"><div><h2 class="card-title">Tools and identity</h2><p class="card-subtitle">What is handled for this agent</p></div><a class="btn tiny" href="${fullAgentLink(a)}/connections">Manage ${I('arrow',13)}</a></div><div class="connection-grid">${CONNECTIONS.map(c=>`<div class="connection-card ${hasConnection(a,c.id)?'connected':''}"><div class="connection-letter">${I(c.icon,17)}</div><div><h3>${safe(c.name)}</h3><p>${safe(c.id==='A'?'Model requests':c.id==='B'?profile.toolLabel:(hasConnection(a,'C')?`Recent requests: ${ids.identified} named · ${ids.observed-ids.identified} unnamed`:'No user attribution'))}</p></div><span class="pill mini ${hasConnection(a,c.id)?'':'pill-outlined'}">${hasConnection(a,c.id)?'On':'Off'}</span></div>`).join('')}</div></section><section class="card card-pad"><div class="card-title-row"><div><h2 class="card-title">Recent activity</h2><p class="card-subtitle">From this agent</p></div><a href="#/activity/${encodeURIComponent(a.id)}" class="btn tiny">All activity ${I('arrow',12)}</a></div>${events.length?events.map(e=>eventSmall(e,state)).join(''):empty('No activity','Requests from this agent will appear here.')}</section></div><div class="detail-stack"><section class="card card-pad"><h2 class="card-title">Rules and mode</h2><p class="card-subtitle">Policy and request handling</p><div class="separator"></div><div class="space-between mb-4"><strong class="small">Mode</strong><span class="pill pill-outlined">${a.mode==='observe'?`${I('eye',13)}Observe`:a.mode==='enforce'?`${I('shield',13)}Enforce`:a.mode==='retired'?'Retired':`${I('pause',13)}Paused`}</span></div><p class="micro muted">${a.mode==='observe'?'Shows what rules would block, without applying those particular rules. Basic safeguards still apply.':a.mode==='enforce'?'Applies configured rules to requests that pass through the gateway.':a.mode==='retired'?'This agent is retired. Its recorded history remains available.':'Requests through the gateway are stopped.'}</p><div class="separator"></div><div class="space-between mb-4"><strong class="small">Policy</strong><a href="${fullAgentLink(a)}/rules" class="text-link small">${safe(preset.name)}</a></div><div class="space-between mb-4"><strong class="small">Tools</strong><span class="small muted">${toolsForAgent(id,state).length} discovered</span></div><div class="flex gap-2"><a href="#/spending/${encodeURIComponent(a.id)}" class="text-link micro">Spending</a><a href="#/approvals/${encodeURIComponent(a.id)}" class="text-link micro">Approvals</a><a href="#/audit/${encodeURIComponent(a.id)}" class="text-link micro">Audit</a></div></section></div></div>`;
}
function empty(title,text,action=''){return `<div class="empty-state"><div class="empty-icon">${I('search',24)}</div><h3>${safe(title)}</h3><p>${safe(text)}</p>${action}</div>`;}
function filteredEvents(state,ui,forAudit=false,scope=''){
  return state.events.filter(e=>{
    const q=String((forAudit?ui.auditSearch:ui.activitySearch)||'').toLowerCase().trim();
    const searchable=`${e.id} ${e.action} ${agentName(state,e.agent)} ${e.actor} ${e.rule} ${e.status}`.toLowerCase();
    const agent=agentById(state,e.agent);
    const agentQuery=scope?'':String(ui.activityAgentSearch||'').toLowerCase().trim();
    return (!scope||e.agent===scope)&&(!q||searchable.includes(q))&&
      (forAudit||!agentQuery||`${agent?.name||''} ${agent?.owner||''} ${agent?.team||''}`.toLowerCase().includes(agentQuery))&&
      (forAudit||!ui.activityStatus||ui.activityStatus==='all'||e.status===ui.activityStatus)&&
      (forAudit||!ui.activityUser||String(e.actor).toLowerCase().includes(ui.activityUser.toLowerCase()))&&
      (forAudit||!ui.activityChannel||e.kind===ui.activityChannel)&&
      (forAudit||!ui.activityModel||e.model===ui.activityModel)&&
      (!forAudit||!ui.auditFilters||(!ui.auditFilters.model||e.model===ui.auditFilters.model)&&(!ui.auditFilters.channel||e.kind===ui.auditFilters.channel)&&(!ui.auditFilters.connection||e.connections.includes(ui.auditFilters.connection))&&(!ui.auditFilters.user||String(e.actor).toLowerCase().includes(ui.auditFilters.user.toLowerCase()))&&(!ui.auditFilters.tool||String(e.action).toLowerCase().includes(ui.auditFilters.tool.toLowerCase()))&&(!ui.auditFilters.from||(e.date||REPORTING_DATE)>=ui.auditFilters.from)&&(!ui.auditFilters.to||(e.date||REPORTING_DATE)<=ui.auditFilters.to)&&(!ui.auditFilters.status||e.status===ui.auditFilters.status)&&(!ui.auditFilters.agent||agentName(state,e.agent).toLowerCase().includes(ui.auditFilters.agent.toLowerCase())));
  });
}
export function pageActivity(state,ui,id=''){
  const scoped=agentById(state,id);
  const events=filteredEvents(state,ui,false,scoped?.id||'');
  const limit=ui.activityLimit||30;
  const shown=events.slice(0,limit);
  const actions='';
  return `${pageHeading('What is happening','Activity','Review model and tool decisions.',actions)}${agentScope(state,scoped?.id,'activity')}
    <div class="toolbar"><label class="input-wrap grow"><span class="sr-only">Search events</span>${I('search',17)}<input id="activity-search" value="${safe(ui.activitySearch||'')}" placeholder="Trace, action, person or rule" aria-label="Search activity" /></label>
    ${scoped?'':`<label class="input-wrap grow"><span class="sr-only">Filter by agent</span>${I('layers',17)}<input id="activity-agent-search" value="${safe(ui.activityAgentSearch||'')}" placeholder="Agent, team or owner" aria-label="Filter events by agent, team or owner" /></label>`}
    <select class="field-select" id="activity-status" aria-label="Filter by decision"><option value="all">All decisions</option>${Object.entries(STATUS).filter(([k])=>!['approved','rejected'].includes(k)).map(([k,v])=>`<option value="${k}" ${ui.activityStatus===k?'selected':''}>${v.label}</option>`).join('')}</select></div>${renderActivityOperations(state,ui)}<div class="activity-filter-reset">${btn('Clear filters','clear-activity',{small:true,icon:'x'})}</div>
    ${ui.activityPaused?`<div class="banner">${I('pause',17)}<div class="banner-content"><strong>Feed paused.</strong> New events are hidden until you resume.</div></div>`:''}
    <div class="card table-scroll"><table class="table"><thead><tr><th>Decision</th><th>What happened</th><th>Agent</th><th>Channel</th><th>Time</th><th></th></tr></thead><tbody>${shown.map(e=>`<tr><td>${statusPill(e.status)}</td><td><button class="row-link" data-action="open-event" data-id="${safe(e.id)}">${safe(e.action)}</button><span class="subtext">${safe(e.actor)} · ${safe(e.id)}</span></td><td><a class="text-link" href="${fullAgentLink(agentById(state,e.agent))}">${safe(agentName(state,e.agent))}</a></td><td>${safe(e.kind==='tool'?'Tool':'Model')}</td><td class="nowrap">${safe(e.at)}</td><td><button class="icon-btn" data-action="open-event" data-id="${safe(e.id)}" aria-label="Explain ${safe(e.id)}">${I('chevron',16)}</button></td></tr>`).join('')}</tbody></table>${events.length?'':empty('No matching events','Clear your filters to see more activity.',btn('Clear filters','clear-activity'))}</div>
    ${events.length?resultsFooter(limit,events.length,'show-more-activity','events'):''}`;
}
export function pageRules(state,ui,id="",embedded=false){
  if(!id){
    const q=(ui.rulesSearch||"").toLowerCase().trim();
    const matching=state.agents.filter(a=>`${a.name} ${a.owner} ${a.team} ${POLICY_PRESETS.find(p=>p.id===a.preset)?.name||""}`.toLowerCase().includes(q));
    const limit=ui.rulesLimit||24;
    return `${pageHeading("Agents","Rules","Choose an agent to manage its rules.",btn("How rules work","open-explainer",{icon:"help",data:'data-topic="rules"'}))}
      <div class="toolbar"><label class="input-wrap grow directory-search">${I("search",17)}<input id="rules-search" aria-label="Search agents for rules" placeholder="Search by agent, team, owner or policy" value="${safe(ui.rulesSearch||"")}"></label></div>
      ${matching.length?`${agentBatch(matching,limit,"rules",state)}${resultsFooter(limit,matching.length,"show-more-rules","agents")}`:empty("No matching agents","Try a different name, owner or policy.")}`;
  }
  const requested=agentById(state,id);
  if(!requested)return empty("Agent not found","Return to Rules to choose another agent.");
  const a=requested;
  const preset=POLICY_PRESETS.find(p=>p.id===a.preset);
  const candidate=ui.policyPreview?.agentId===a.id?POLICY_PRESETS.find(p=>p.id===ui.policyPreview.preset):null;
  const selected=candidate||preset;
  const changed=selected.id!==a.preset;
  const gaps=policyGaps({...a,preset:selected.id});
  const profile=connectionProfile(a,state),impact=previewImpact(state,a.id);
  const hasB=hasConnection(a,'B'),hasC=hasConnection(a,'C');
  const writeText=selected.id===1?'Allowed if approved':selected.id===2?(hasC?'Allowed for permitted user roles':'Blocked · Connect user identity'):'Blocked until a specific rule permits it';
  const criticalText=selected.id===1?'Blocked':selected.id===2?(!hasC?'Blocked · Requires user identity':!hasB?'Blocked · Requires tool control':'Can request a second-person approval'):'Blocked until a specific rule permits it';
  const toolText=hasB?`${profile.toolLabel}; only those executions are checked`:'Connect tool execution to check tool calls';
  return `${embedded?'':pageHeading('Policy','Rules',`Rules for ${a.name}`)}
  <div class="toolbar"><span class="pill pill-outlined">${a.mode==='observe'?'Observe':a.mode==='enforce'?'Enforce':a.mode==='retired'?'Retired':'Paused'}</span><span class="pill pill-outlined">${profile.toolLabel}</span>${!embedded?`<a class="btn tiny" href="${fullAgentLink(a)}">Agent details ${I('arrow',12)}</a>`:''}</div>
  ${gaps.length?`<div class="banner">${I('info',18)}<div class="banner-content"><strong>${changed?'This policy needs another connection.':'Some actions need another connection.'}</strong><div class="small">${gaps.map(safe).join(' · ')}</div></div><a href="${fullAgentLink(a)}/connections" class="btn tiny">Connections ${I('arrow',13)}</a></div>`:''}
  <div class="section-head"><h2>Policy preset</h2></div>
  <div class="policy-grid">${POLICY_PRESETS.map(p=>`<button type="button" id="policy-preset-${safe(a.id)}-${p.id}" class="policy-card ${selected.id===p.id?'selected':''} ${a.preset===p.id?'active':''}" data-action="choose-preset" data-id="${safe(a.id)}" data-value="${p.id}" aria-pressed="${selected.id===p.id}"><span class="policy-num">PRESET ${p.id}</span>${a.preset===p.id?`<span class="policy-active-label">Active</span>`:''}${selected.id===p.id?`<span class="chosen">${I('check-circle',19)}</span>`:''}<h3>${safe(p.name)}</h3><p>${safe(p.subtitle)}</p></button>`).join('')}</div>
  ${changed?`<section class="policy-preview" aria-live="polite"><div class="policy-preview-info"><strong>Previewing ${safe(selected.name)}</strong><p>${safe(selected.summary)} Current policy: ${safe(preset.name)}. No changes have been applied.</p></div><div class="policy-preview-actions">${btn('Cancel preview','cancel-policy-preview',{data:`data-id="${safe(a.id)}"`})}${btn('Apply policy','review-policy-change',{variant:'primary',data:`data-id="${safe(a.id)}" data-value="${selected.id}"`,disabled:!canEdit(state)||a.mode==='retired'})}</div></section>`:''}
  <div class="grid-2 mt-6"><section class="card card-pad"><div class="card-title-row"><div><h2 class="card-title">${changed?'If this policy is applied':'With this policy'}</h2><p class="card-subtitle">${safe(selected.name)} · ${profile.toolLabel}</p></div></div>
  <div class="capability-list">
    <div class="capability-line"><span>${I('check',16)} Read</span><strong>${selected.id===3?'Needs explicit rule':'Approved tools allowed'}</strong></div>
    <div class="capability-line"><span>${I('shield-check',16)} Write</span><strong>${writeText}</strong></div>
    <div class="capability-line"><span>${I('lock',16)} Critical</span><strong>${criticalText}</strong></div>
    <div class="capability-line"><span>${I('plug',16)} Tool execution</span><strong>${toolText}</strong></div>
  </div></section>
  <section class="card card-pad"><div class="card-title-row"><div><h2 class="card-title">Before enforcement</h2><p class="card-subtitle">Recorded would-block requests for ${safe(a.name)}</p></div>${statusPill('would_block',true)}</div><div class="stat-value" style="margin:0">${impact.count}</div><p class="small muted">Historical events. Changing a connection affects new requests.</p>
    ${impact.actions.length?`<div class="step-list">${impact.actions.slice(0,2).map(x=>`<div class="step"><span class="step-number">${I('eye',14)}</span><div class="step-main"><strong>${safe(x)}</strong></div></div>`).join('')}</div>`:''}
    <div class="flex gap-2 mt-4">${btn(a.mode==='enforce'?'Return to Observe':'Review enforcement','preview-enforce',{variant:'primary',data:`data-id="${safe(a.id)}"`,disabled:!canEdit(state)||a.mode==='retired'})}</div></section></div>${renderRulesOperations(state,ui,a)}`;
}
export function pageApprovals(state,ui={},id=''){
  const scoped=agentById(state,id);
  const q=String(ui.approvalsSearch||'').toLowerCase().trim();
  const all=state.approvals.filter(item=>(!scoped||item.agent===scoped.id)&&(!q||`${item.id} ${item.action} ${item.requestedBy} ${agentName(state,item.agent)}`.toLowerCase().includes(q)));
  const mode=ui.approvalsView||'pending';
  const pending=all.filter(x=>x.status==='pending').sort((a,b)=>Number(approvalReady(state,b))-Number(approvalReady(state,a)));
  const reviewed=all.filter(x=>x.status!=='pending');
  const items=mode==='pending'?pending:mode==='reviewed'?reviewed:all;
  const limit=ui.approvalsLimit||20;
  return `${pageHeading('Tool review','Approvals','Requests requiring a review.',btn('How approvals work','open-explainer',{icon:'help',data:'data-topic="approvals"'}))}${agentScope(state,scoped?.id,'approvals')}${renderApprovalsOperations(state,ui)}
  <div class="toolbar"><label class="input-wrap grow directory-search">${I('search',17)}<input id="approvals-search" aria-label="Search approvals" placeholder="Agent, request, requester or ID" value="${safe(ui.approvalsSearch||'')}"></label></div>
  <div class="catalog-filters" role="group" aria-label="Filter approvals">${[['pending','Pending',pending.length],['reviewed','Reviewed',reviewed.length],['all','All',all.length]].map(([value,label,count])=>`<button class="filter-chip ${mode===value?'selected':''}" data-action="approvals-view" data-value="${value}" aria-pressed="${mode===value}">${label} <span>${count}</span></button>`).join('')}</div>
  ${items.length?items.slice(0,limit).map(item=>{
     const ready=approvalReady(state,item),reason=approvalBlocker(state,item),resolved=item.status!=='pending';
     return `<article class="card approval-card"><span class="approval-icon">${I(resolved?(item.status==='approved'?'check':item.status==='expired'?'clock':'slash'):ready?'clock':'unplug',22)}</span><div style="flex:1;min-width:180px"><div class="flex-center gap-2 mb-2">${resolved?statusPill(item.status,true):ready?statusPill('pending',true):`<span class="pill mini" data-status="outside">${I('unplug',11)}Unavailable</span>`}<span class="micro muted">${safe(item.id)}</span></div>
     <h3>${safe(item.action)}</h3><p>${resolved?(item.status==='expired'?'Expired without execution':'Reviewed'):ready?safe(item.reason):safe(reason)}</p><div class="approval-metadata"><a href="${fullAgentLink(agentById(state,item.agent))}" class="text-link">${safe(agentName(state,item.agent))}</a><span>Requested by ${safe(item.requestedBy)}</span>${resolved?'':`<span data-approval-expiry-time>${safe(item.expires)} window</span>`}</div></div>
     ${btn('Details','op-approval-details',{small:true,data:`data-id="${safe(item.id)}"`})}${resolved?'':`<div class="approval-actions">${btn('Reject','approval-confirm',{small:true,data:`data-id="${safe(item.id)}" data-value="rejected"`,disabled:!canApprove(state)||!ready||item.requestedBy===(state.reviewPerson||DEMO_REVIEWER)})}${btn('Approve','approval-confirm',{variant:'primary',small:true,data:`data-id="${safe(item.id)}" data-value="approved"`,disabled:!canApprove(state)||!ready||item.requestedBy===(state.reviewPerson||DEMO_REVIEWER)})}</div>`}</article>`;
   }).join(''):empty('No matching approvals','Change the filter or search.')}
   ${items.length?resultsFooter(limit,items.length,'show-more-approvals','requests'):''}
   ${mode!=='reviewed'&&!canApprove(state)?`<div class="tip mt-4">${I('users',17)}<span>Only an <strong>Approver</strong> can decide. Select that role above to inspect the actions.</span></div>`:''}`;
}
export function pageSpending(state,ui={},id=''){
  const scoped=agentById(state,id);
  const q=scoped?'':String(ui.spendingSearch||'').toLowerCase().trim();
  const agents=state.agents.filter(a=>(!scoped||a.id===scoped.id)&&(!q||`${a.name} ${a.owner} ${a.team}`.toLowerCase().includes(q)));
  const selectedIds=new Set(agents.map(a=>a.id));
  const spend=agents.reduce((n,a)=>n+a.spent,0);
  const budget=agents.reduce((n,a)=>n+a.budget,0);
  const requests=agents.reduce((n,a)=>n+a.requests,0);
  const observed=state.events.filter(e=>selectedIds.has(e.agent)&&e.kind==='inference');
  const observedUsers=observed.filter(e=>e.connections.includes('C')&&e.actor!=='No user identity');
  const grouped=Object.values(observedUsers.reduce((acc,e)=>{
    const key=`${e.agent}:${e.actor}`;
    if(!acc[key])acc[key]={name:e.actor,agentId:e.agent,agent:agentName(state,e.agent),cost:0,events:0};
    acc[key].cost+=e.cost;acc[key].events+=1;return acc;
  },{})).sort((a,b)=>b.cost-a.cost);
  const agentLimit=ui.spendingLimit||24;
  const personLimit=ui.personLimit||24;
  const nav=scoped?`<div class="spending-next card card-pad" aria-label="Next steps for ${safe(scoped.name)}"><div><h2 class="card-title">Investigate ${safe(scoped.name)}</h2><p class="card-subtitle">Find recorded requests, inspect decisions or change the agent's policy.</p></div><div class="spending-next-links"><button class="btn tiny primary" data-action="spending-requests" data-id="${safe(scoped.id)}">Model requests ${I('arrow',13)}</button><a class="btn tiny" href="#/audit/${encodeURIComponent(scoped.id)}">Audit records ${I('arrow',13)}</a><a class="btn tiny" href="${fullAgentLink(scoped)}/rules">Rules ${I('arrow',13)}</a><a class="btn tiny" href="${fullAgentLink(scoped)}/connections">Connections ${I('arrow',13)}</a></div></div>`:`<div class="spending-next card card-pad"><div><h2 class="card-title">Investigate spending</h2><p class="card-subtitle">Choose an agent below to see recorded cost events and follow them to their decisions.</p></div><div class="spending-next-links"><button class="btn tiny" data-action="spending-requests">Model requests ${I('arrow',13)}</button><a class="btn tiny" href="#/audit">Audit records ${I('arrow',13)}</a></div></div>`;
  return `${pageHeading('Usage and limits','Spending',scoped?`Costs, requests and limits for ${safe(scoped.name)}.`:'Spending by agent and model request.',btn('About spending','open-explainer',{icon:'help',data:'data-topic="spending"'}))}${agentScope(state,scoped?.id,'spending')}
  ${scoped?'':`<div class="toolbar"><label class="input-wrap grow directory-search">${I('search',17)}<input id="spending-search" value="${safe(ui.spendingSearch||'')}" placeholder="Agent, team or owner" aria-label="Search spending by agent"></label></div>`}
  <div class="stat-grid"><div class="card stat-card"><div class="stat-top">${q?'Filtered spend':'Reported spending'} <span class="stat-icon">${I('wallet',18)}</span></div><div class="stat-value">${formatUSD(spend)}</div><div class="stat-foot">USD · shown agents</div></div><div class="card stat-card"><div class="stat-top">Daily budgets <span class="stat-icon">${I('gauge',18)}</span></div><div class="stat-value">${formatUSD(budget)}</div><div class="stat-foot">USD · shown agents</div></div><div class="card stat-card"><div class="stat-top">Requests <span class="stat-icon">${I('activity',18)}</span></div><div class="stat-value">${requests.toLocaleString()}</div><div class="stat-foot">Reporting period</div></div></div>
  ${nav}
  <div class="grid-2 mt-6"><section class="card card-pad"><h2 class="card-title">By agent</h2><p class="card-subtitle">Reporting period · USD</p><div class="separator"></div>${agents.length?agents.slice(0,agentLimit).map(a=>{const pct=a.budget?Math.min(100,Math.round(a.spent/a.budget*100)):0;return `<div class="budget-item"><div class="budget-top"><a href="#/spending/${encodeURIComponent(a.id)}" class="agent-name">${safe(a.name)}</a><span><strong>${formatUSD(a.spent)}</strong> / ${formatUSD(a.budget)}</span></div><div class="progress ${pct>=90?'danger':pct>=75?'warn':''}" role="progressbar" aria-label="${safe(a.name)} daily budget" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div><div class="budget-bottom"><span class="budget-note">${pct}% of daily limit</span><div class="spending-inline-actions">${!scoped?`<a href="#/spending/${encodeURIComponent(a.id)}" class="text-link">Investigate usage ${I('arrow',12)}</a>`:''}${canEdit(state)?`<button data-action="edit-budget" data-id="${safe(a.id)}" class="text-link">Edit limit</button>`:''}</div></div></div>`;}).join(''):empty('No matching agents','Try another name or team.')}${resultsFooter(agentLimit,agents.length,'show-more-spending','agents')}</section>
  <section class="card card-pad"><h2 class="card-title">By person</h2><p class="card-subtitle">Identified requests · recorded history</p><div class="separator"></div>
    ${grouped.length?`<div class="capability-list">${grouped.slice(0,personLimit).map(u=>`<div class="capability-line spending-person"><span><strong>${safe(u.name)}</strong><small class="subtext">${safe(u.agent)} · ${u.events} model request${u.events===1?'':'s'}</small><button class="text-link" data-action="spending-person-requests" data-id="${safe(u.agentId)}" data-person="${safe(u.name)}">View requests ${I('arrow',12)}</button></span><strong>${formatUSD(u.cost)}</strong></div>`).join('')}</div>${resultsFooter(personLimit,grouped.length,'show-more-persons','people')}<p class="micro muted mt-4">Historical attribution is preserved when identity is later disconnected. Unidentified requests remain with the agent.</p>`:empty('No identified requests', 'Costs remain at the agent level until requests carry user identity.')}
  </section></div>
  ${scoped?`<section class="card card-pad mt-6" aria-label="Recorded cost events"><div class="card-title-row"><div><h2 class="card-title">Recorded model requests</h2><p class="card-subtitle">Recorded requests for ${safe(scoped.name)} · partial history</p></div><button class="btn tiny" data-action="spending-requests" data-id="${safe(scoped.id)}">All requests ${I('arrow',13)}</button></div>${observed.length?`<div class="spending-records">${observed.slice(0,8).map(ev=>`<div class="spending-record"><div><button class="text-link" data-action="open-event" data-id="${safe(ev.id)}">${safe(ev.action)}</button><div class="micro muted">${safe(ev.id)} · ${safe(ev.model)} · ${safe(ev.actor)}</div></div><div class="spending-record-actions"><strong>${formatUSD(ev.cost)}</strong><button class="text-link" data-action="spending-trace" data-id="${safe(ev.id)}" data-agent="${safe(scoped.id)}">Audit trace ${I('arrow',12)}</button></div></div>`).join('')}</div>`:empty('No model requests recorded','No request-level cost records for this agent.')}</section>`:''}
  ${renderSpendingOperations(state,ui,scoped?.id||'')}`;
}
export function pageAudit(state,ui,id=''){
  const scoped=agentById(state,id);
  const events=filteredEvents(state,ui,true,scoped?.id||'');
  const limit=ui.auditLimit||30;
  return `${pageHeading('Decision records','Audit','Search decisions and inspect their rules.',btn('How evidence works','open-explainer',{icon:'help',data:'data-topic="audit"'}))}${agentScope(state,scoped?.id,'audit')}
  <div class="toolbar"><label class="input-wrap grow" style="max-width:560px">${I('search',17)}<input id="audit-search" aria-label="Search audit records" placeholder="Trace, agent, person, action or rule" value="${safe(ui.auditSearch||'')}"></label>${btn('Clear','clear-audit',{icon:'x'})}</div>
  ${renderAuditOperations(state,ui)}
  ${ui.auditMode==='changes'?renderAuditChangeTable(state,ui,scoped?.id||''):`<div class="card table-scroll"><table class="table"><thead><tr><th>Record</th><th>Action</th><th>Decision</th><th>Evidence</th><th></th></tr></thead><tbody>${events.slice(0,limit).map(e=>`<tr><td class="mono">${safe(e.id)}</td><td><button class="row-link" data-action="open-event" data-id="${safe(e.id)}">${safe(e.action)}</button><span class="subtext"><a href="${fullAgentLink(agentById(state,e.agent))}" class="text-link">${safe(agentName(state,e.agent))}</a> · ${safe(e.at)}</span></td><td>${statusPill(e.status,true)}</td><td>${e.evidence?`<span class="pill mini" data-status="outside">${I('file-search',11)}Event record</span>`:statusPill('missing',true)}</td><td><button class="icon-btn" aria-label="Open audit record ${safe(e.id)}" data-action="open-event" data-id="${safe(e.id)}">${I('chevron',16)}</button></td></tr>`).join('')}</tbody></table>${!events.length?empty('No records match','Try a trace ID or a different action.'):''}</div>
  ${events.length?resultsFooter(limit,events.length,'show-more-audit','records'):''}`}`;
}
export function pageConnections(state,ui){
  const search=(ui.connectionSearch||'').trim().toLowerCase();
  const agents=state.agents.filter(a=>`${a.name} ${a.owner} ${a.team}`.toLowerCase().includes(search));
  const limit=ui.connectionLimit||24;
  return `${pageHeading('Agents','Connections','Select an agent to review its connections.')}
  <div class="toolbar"><label class="input-wrap grow directory-search">${I('search',17)}<input id="connection-search" value="${safe(ui.connectionSearch||'')}" placeholder="Search by agent, team or owner" aria-label="Search agents for connections"></label><a href="#/catalog" class="btn tiny">Catalog ${I('arrow',13)}</a></div>
  ${agents.length?`${agentBatch(agents,limit,true,state)}<div class="directory-footer"><span>${Math.min(limit,agents.length)} of ${agents.length} agents</span>${agents.length>limit?btn('Show more agents','show-more-connections',{icon:'down'}):''}</div>`:empty('No matching agents','Try another name, team or owner.')}`;
}
export function pageAgentConnections(state,a){
  const profile=connectionProfile(a,state), ids=identitySamples(state,a.id);
  const hasB=hasConnection(a,'B'),hasC=hasConnection(a,'C');
  const capabilities=[
    ['Model requests','On','Model calls, spending and tool requests are visible'],
    ['Tool execution',hasB?profile.toolLabel:'Not connected',hasB?'Only routed tools are checked before execution':'Tool execution is outside the gateway'],
    ['Rules by person',hasC?'For identified requests':'Not connected',hasC?'Requests without a user continue as the agent':'User-specific rules need identity'],
    ['Human approval',hasB?(a.preset===2&&!hasC?'Needs user identity':'Available for eligible tools'):'Not connected',hasB?'Requires a routed tool and an eligible policy':'Approval requires routed tool execution'],
    ['Spending by person',hasC?'For identified requests':'Not connected',hasC?`${ids.identified} named and ${ids.observed-ids.identified} unnamed model requests in recent records`:'Costs remain attributed to the agent'],
  ];
  return `<div class="section-head"><div><h2>Connections</h2><p>Changes affect new requests. Existing activity keeps its original context.</p></div></div>
  <div class="integration-grid">${CONNECTIONS.map(c=>{
    const enabled=hasConnection(a,c.id);
    const detail=c.id==='A'?'Required for model calls':c.id==='B'?profile.toolLabel:enabled?`${ids.identified} named · ${ids.observed-ids.identified} unnamed model requests`:'User-specific decisions are unavailable';
    return `<article class="card integration-card"><div class="integration-id"><span class="letter" aria-hidden="true">${I(c.icon,23)}</span><span class="pill mini ${enabled?'':'pill-outlined'}" ${enabled?'data-status="allowed"':''}>${c.id==='A'?'Required':enabled?'Configured':'Not configured'}</span></div><h3>${safe(c.name)}</h3><p>${safe(detail)}</p><div class="button-row">${btn('Setup guide','open-connection',{data:`data-id="${c.id}"`,icon:'arrow'})}${c.id!=='A'&&canEdit(state)&&a.mode!=='retired'?btn(enabled?'Disconnect':'Connect','toggle-connection',{variant:enabled?'':'primary',data:`data-id="${c.id}" data-agent="${safe(a.id)}"`}):''}</div></article>`;
  }).join('')}</div>
  <div class="section-head"><div><h2>What this changes</h2><p>Each tool and request is evaluated on its own path.</p></div></div>
  <section class="card card-pad"><div class="capability-list">${capabilities.map(([name,status,explanation])=>`<div class="capability-line"><span><strong>${safe(name)}</strong><small class="subtext">${safe(explanation)}</small></span><span class="pill mini ${status==='Not connected'?'pill-outlined':''}" ${status==='On'?'data-status="allowed"':status.startsWith('Needs')?'data-status="pending"':''}>${safe(status)}</span></div>`).join('')}</div><div class="button-row mt-4"><a class="btn tiny" href="#/catalog">Catalog ${I('arrow',13)}</a><a class="btn tiny" href="${fullAgentLink(a)}/rules">Rules ${I('arrow',13)}</a><a class="btn tiny" href="#/spending/${encodeURIComponent(a.id)}">Spending ${I('arrow',13)}</a><a class="btn tiny" href="#/approvals/${encodeURIComponent(a.id)}">Approvals ${I('arrow',13)}</a></div></section>${renderConnectionOperations(state,a)}`;
}
export function pageNotFound(){return `${pageHeading('Not found','This page isn’t available','Check the link or return to your workspace.')}<a class="btn primary" href="#/home">Go to overview ${I('arrow',15)}</a>`;}
export function renderPage(state,ui,route,id,section){switch(route){case 'home':return pageHome(state);case 'catalog':return pageCatalog(state,ui);case 'agent':return pageAgent(state,ui,id,section);case 'activity':return pageActivity(state,ui,id);case 'rules':return pageRules(state,ui,id);case 'approvals':return pageApprovals(state,ui,id);case 'spending':return pageSpending(state,ui,id);case 'audit':return pageAudit(state,ui,id);case 'connections':case 'integrations':return pageConnections(state,ui);default:return pageNotFound();}}
const integrationInstructions={
 A:{title:'Model requests',lead:'Start here. Your agent routes model calls through the gateway.',steps:[['Create an agent','Give the agent a name and an owner in Catalog.'],['Copy its credentials','Keep the issued credential secure and never commit it to source control.'],['Change the model endpoint','Use the gateway URL and this agent’s token in your model client.']],snippet:'BASE_URL=<your-model-gateway-url>\nAPI_KEY=<your-agent-credential>',limit:'Model request routing reveals model calls and declared tool intentions. It does not automatically intercept tools running locally.'},
 B:{title:'Tool execution',lead:'Choose this when the actual tool call must be checked before it runs.',steps:[['Register tool destinations','Add an MCP server or tool target operated by your organization.'],['Route tools through the gateway','Update your agent to call the registered MCP gateway.'],['Verify each tool','Check which tools use the gateway. Local tools remain outside its control.']],snippet:'MCP_URL=<your-tool-gateway-url>\nAUTH=Bearer <agent-credential>',limit:'Model requests can reveal that a tool was requested, but do not control its execution. Routing tools through the gateway requires client changes.'},
 C:{title:'User identity',lead:'Connect identity only when you need user-specific authorization or spending.',steps:[['Verify user login','Your application authenticates the person with an OIDC provider.'],['Forward identity','The agent passes that valid user JWT to the gateway.'],['Configure roles','Map verified users to approved permissions.']],snippet:'X-Gov-User-Token: <validated-user-jwt>',limit:'User identity does not log people into the application. Your application must authenticate them and propagate identity to requests. Invalid/missing user identity cannot safely be treated as verified.'}
};
const explainerContent={
  rules:{title:'How rules work',lead:'A policy decides what an agent may request or execute.',body:'Observe shows decisions without enforcing the policy itself. Enforce applies configured rules to traffic that passes through the gateway. Some safeguards, such as authentication or limits, can already apply in Observe. Tool execution checks require routed tools; user-specific rules require verified identity.'},
  approvals:{title:'How approvals work',lead:'Some actions need a person to decide before they run.',body:'An approved critical tool waits at the MCP gateway. Another authorized person approves or rejects it. The requesting person cannot approve their own request under the target requirement. '},
  spending:{title:'What are these numbers?',lead:'Costs are grouped by agent; user attribution requires verified identity.',body:'The platform tracks costs and usage for model requests. Per-person attribution requires verified user identity. A daily budget is not a guarantee against costs incurred outside the inference gateway.'},
  audit:{title:'How audit evidence works',lead:'Each record should answer who, what, when, and why.',body:'The target backend will persist durable records and use S3 Object Lock GOVERNANCE under configured retention.  A record label alone does not verify retention or immutability.'},
  preset1:{title:'Safe start',lead:'A starting template for broad visibility without breaking existing flows.',body:'In enforcement: approved read/write tools can proceed, critical or unclassified tools are blocked. Discovery mode evaluates certain policy denials without applying them. The real backend also enforces independently configured authentication, limits and filters.'},
  preset2:{title:'Team approval',lead:'Adds differentiated user roles and review of critical tool use.',body:'Write actions require verified user roles. Critical execution also needs the tool gateway and human approval. If required connections are absent, affected operations are not silently accepted.'},
  preset3:{title:'Custom access',lead:'Default deny with explicitly configured permissions.',body:'Only named rules allow actions. For critical tools, additional approval conditions still apply. Both the model-intent channel and actual tool-execution channel must be considered separately.'}
};
const evidenceLabel=e=>e.evidence?`<span class="pill mini" data-status="outside">${I('file-search',11)}Event record</span>`:statusPill('missing',true);
function drawerShell(label,title,content,footer=''){return `<div class="scrim" data-action="close-overlay" aria-hidden="true"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><header class="drawer-header"><div><span class="drawer-label">${safe(label)}</span><h2 id="drawer-title">${safe(title)}</h2></div><button class="icon-btn soft" data-action="close-overlay" aria-label="Close details">${I('x',19)}</button></header><div class="drawer-body">${content}</div>${footer?`<footer class="drawer-footer">${footer}</footer>`:''}</aside>`;}
export function renderDrawer(state,ui){
  if(!ui.drawer)return '';
  const ops=renderOpsDrawer(state,ui);if(ops!==null)return ops;
  const {kind,id}=ui.drawer;
  if(kind==='event'){
    const e=state.events.find(x=>x.id===id);if(!e)return '';
    const actual=e.kind==='tool'&&e.connections.includes('B');const status=STATUS[e.status]||STATUS.missing;
    const technical=`<details class="mt-4"><summary class="text-link" style="cursor:pointer;font-size:12px">Technical details</summary><div class="mt-4"><dl class="drawer-dl"><dt>Decision</dt><dd>${safe(e.status.toUpperCase())}</dd><dt>Rule</dt><dd>${safe(e.rule)}</dd><dt>Rule version</dt><dd>${safe(e.version)}</dd><dt>Channel</dt><dd>${safe(e.kind==='tool'?'MCP tool':'Inference')}</dd><dt>Model</dt><dd>${safe(e.model)}</dd><dt>Connections</dt><dd>${safe(CONNECTIONS.filter(c=>e.connections.includes(c.id)).map(c=>c.name).join(' · ')||'None')}</dd><dt>Cost</dt><dd>${formatUSD(e.cost)} </dd></dl></div></details>`;
    const steps=[
      ['Request received',`${e.actor} · ${agentName(state,e.agent)}`],
      ['Policy evaluated',`${e.rule} (${e.version})`],
      [status.label,e.reason],
      ['Evidence',e.evidence?'The request has an event record.':'No event record is available.']
    ];
    const content=`<div class="space-between mb-4">${statusPill(e.status)}<span class="mono muted">${safe(e.id)}</span></div><p class="drawer-lead">${safe(e.reason)}</p><h3>What happened</h3><div>${steps.map((s,i)=>`<div class="audit-step"><span class="audit-step-num">${i+1}</span><div><h4>${safe(s[0])}</h4><p>${safe(s[1])}</p></div></div>`).join('')}</div><div class="separator"></div><h3>Record</h3><dl class="drawer-dl"><dt>Agent</dt><dd>${safe(agentName(state,e.agent))}</dd><dt>Time</dt><dd>${safe(e.at)} </dd><dt>Evidence</dt><dd>${evidenceLabel(e)}</dd></dl>${e.kind==='inference'?`<div class="tip mt-4">${I('info',16)}The model requested a tool. Its execution is a separate event.</div>`:e.kind==='tool'&&!actual?`<div class="tip mt-4">${I('unplug',16)}This tool does not pass through the gateway. Its execution is not governed here.</div>`:''}${technical}<div class="op-compact-tools mt-4">${btn('Request timeline','op-transaction',{small:true,data:`data-id="${safe(e.id)}"`})}${btn('Retention status','op-immutability',{small:true,data:`data-id="${safe(e.id)}"`})}</div>`;
    return drawerShell('Decision explained',e.action,content,`${btn('Copy trace ID','copy-trace',{icon:'copy',data:`data-value="${safe(e.id)}"`})}${btn('Done','close-overlay',{variant:'primary'})}`);
  }
  if(kind==='connection'){
    const c=integrationInstructions[id];if(!c)return '';
    return drawerShell('Connection setup',c.title,`<p class="drawer-lead">${safe(c.lead)}</p><div class="step-list mt-6">${c.steps.map(([t,d],i)=>`<div class="step"><span class="step-number">${i+1}</span><div class="step-main"><strong>${safe(t)}</strong><p>${safe(d)}</p></div></div>`).join('')}</div><h3>Connection details</h3><div class="code-box"><pre>${safe(c.snippet)}</pre><button class="copy-code" data-action="copy-connection" data-id="${safe(id)}">${I('copy',12)} Copy</button></div><div class="tip">${I('info',16)}<span>${safe(c.limit)}</span></div>`,btn('Close','close-overlay',{variant:'primary'}));
  }
  if(kind==='explainer'){
    const x=explainerContent[id];if(!x)return '';
    return drawerShell('Good to know',x.title,`<p class="drawer-lead">${safe(x.lead)}</p><p>${safe(x.body)}</p>`,btn('Got it','close-overlay',{variant:'primary'}));
  }
  if(kind==='settings'){
    return drawerShell('Customize the workspace','Appearance',`<p class="drawer-lead"></p><h3>Color palette</h3><div class="theme-grid">${[['forest','Forest'],['violet','Violet'],['ocean','Ocean']].map(([id,label])=>`<button data-action="theme" data-value="${id}" class="theme-option ${state.theme===id?'active':''}" aria-pressed="${state.theme===id}"><div class="theme-swatch ${id}"></div>${label}</button>`).join('')}</div><h3>Appearance</h3><div class="flex gap-2">${btn('Light','appearance',{variant:state.appearance==='light'?'primary':'',icon:'sun',data:'data-value="light"'})}${btn('Dark','appearance',{variant:state.appearance==='dark'?'primary':'',icon:'moon',data:'data-value="dark"'})}</div><p class="source-note mt-6">Colors and appearance are saved in this browser.</p>`,btn('Done','close-overlay',{variant:'primary'}));
  }
  if(kind==='help'){
    return drawerShell('Help','Using the workspace',`<p class="drawer-lead">Find an agent, review a decision and configure its access.</p><div class="step-list mt-4"><div class="step"><span class="step-number">1</span><div class="step-main"><strong>Catalog</strong><p>Open an agent or review discovered tools.</p></div></div><div class="step"><span class="step-number">2</span><div class="step-main"><strong>Rules and connections</strong><p>Inspect the controls configured for that agent.</p></div></div><div class="step"><span class="step-number">3</span><div class="step-main"><strong>Activity and Audit</strong><p>Follow a request to its recorded decision.</p></div></div></div>`,btn('Close','close-overlay',{variant:'primary'}));
  }
  return '';
}
function modalShell(title,iconName,content,buttons){return `<div class="scrim" data-action="close-overlay" aria-hidden="true"></div><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-card"><div class="modal-icon">${I(iconName,22)}</div><h2 id="modal-title">${safe(title)}</h2>${content}${buttons}</div></div>`;}
export function renderModal(state,ui){
  if(!ui.modal)return '';
  const ops=renderOpsModal(state,ui);if(ops!==null)return ops;
  const m=ui.modal;
  if(m.kind==='add-agent'){
    return modalShell('Add an agent','plus',`<p>Add an agent to your catalog.</p><form id="new-agent-form"><div class="field-group"><label for="new-agent-name" class="field-label">Agent name</label><input class="field-input" id="new-agent-name" name="name" placeholder="e.g. Research Assistant" maxlength="54" required autofocus></div><div class="field-group"><label for="new-agent-owner" class="field-label">Owner</label><input class="field-input" id="new-agent-owner" name="owner" placeholder="e.g. Taylor Smith" maxlength="54" required></div><div class="modal-actions">${btn('Cancel','close-overlay')}<button class="btn primary" type="submit">Create agent ${I('arrow',15)}</button></div></form>`, '');
  }
  if(m.kind==='new-agent-key')return modalShell('Agent created','check',`<p>The agent is now in your catalog. Continue with its connections, models and policies.</p>`, `<div class="modal-actions">${btn('Open agent','navigate',{variant:'primary',data:`data-route="agent/${safe(m.id)}"`})}</div>`);
  if(m.kind==='connection-change'){
    const a=agentById(state,m.id),c=CONNECTIONS.find(x=>x.id===m.connection);if(!a||!c)return '';
    const disconnect=hasConnection(a,c.id);
    return modalShell(`${disconnect?'Disconnect':'Connect'} ${c.name}?`,'plug',`<p>Agent: <strong>${safe(a.name)}</strong></p><p>${disconnect?'New requests will no longer use this configuration. Historical records keep their original context.':'This path will be marked configured. Verification remains pending.'}</p><div class="tip">${I('info',16)}<span>Tool execution applies only to tools routed through the gateway; user identity only to requests carrying a valid token.</span></div>`,`<div class="modal-actions">${btn('Cancel','close-overlay')}${btn(disconnect?'Confirm disconnect':'Confirm connection','confirm-connection',{variant:'primary',data:`data-id="${safe(c.id)}"`})}</div>`);
  }
  if(m.kind==='policy-change'){
    const a=agentById(state,m.id);const policy=POLICY_PRESETS.find(p=>p.id===m.preset);if(!a||!policy)return '';
    return modalShell('Apply policy to this agent?','shield-check',`<p>Agent: <strong>${safe(a.name)}</strong></p><p>Current policy: <strong>${safe(POLICY_PRESETS.find(p=>p.id===a.preset)?.name||'None')}</strong><br>New policy: <strong>${safe(policy.name)}</strong></p><div class="tip">${I('info',16)}<span>${safe(policy.summary)} ${a.mode==='enforce'?'The new rules will apply to subsequent requests through the gateway.':'The new policy will be saved, but policy denials remain in Observe until enforcement is enabled.'}</span></div>`,`<div class="modal-actions">${btn('Cancel','close-overlay')}${btn('Confirm policy change','confirm-preset',{variant:'primary',data:`data-id="${safe(a.id)}" data-value="${policy.id}"`})}</div>`);
  }
  if(m.kind==='enforce'){
    const a=agentById(state,m.id);if(!a)return '';
    const enforce=a.mode!=='enforce';const impact=previewImpact(state,m.id);
    return modalShell(enforce?'Turn on enforcement?':'Return to Observe?',enforce?'shield':'eye',`<p>${enforce?`Rules will start denying matching requests that pass through the gateway for ${safe(a.name)}.`:`Policy decisions will be shown, not enforced, for ${safe(a.name)}. Some basic controls still run.`}</p>${enforce?`<div class="tip">${I('eye',16)}<span><strong>${impact.count} recorded requests</strong> would have been blocked. Tool executions outside the gateway remain outside control.</span></div>${impact.actions.length?`<div class="modal-list">${impact.actions.slice(0,2).map(t=>`<span>${safe(t)}</span>`).join('')}</div>`:''}`:''}`, `<div class="modal-actions">${btn('Cancel','close-overlay')}${btn(enforce?'Turn on rules':'Switch to Observe','confirm-mode',{variant:'primary',data:`data-id="${safe(a.id)}" data-value="${enforce?'enforce':'observe'}"`})}</div>`);
  }
  if(m.kind==='pause'){
    const a=agentById(state,m.id);if(!a)return '';
    const pause=a.mode!=='suspended';return modalShell(pause?'Pause this agent?':'Resume this agent?',pause?'pause':'play',`<p>${pause?'Gateway requests from this agent will be rejected until resumed. Actions outside the gateway cannot be stopped here.':'The agent will return to Observe mode. Confirm its rules before turning on enforcement again.'}</p><div class="source-note">${safe(a.name)}</div>`,`<div class="modal-actions">${btn('Cancel','close-overlay')}${btn(pause?'Pause agent':'Resume agent','confirm-pause',{variant:pause?'danger':'primary',data:`data-id="${safe(a.id)}"`})}</div>`);
  }
  if(m.kind==='approval'){
    const a=state.approvals.find(a=>a.id===m.id);if(!a)return '';
    return modalShell(m.decision==='approved'?'Approve this action?':'Reject this action?',m.decision==='approved'?'check-circle':'slash',`<p><strong>${safe(a.action)}</strong><br>${safe(a.reason)}</p><div class="source-note">Requested by ${safe(a.requestedBy)}. Reviewer: ${safe(state.reviewPerson||DEMO_REVIEWER)}. The requester cannot approve their own action.</div><label class="field-group"><span class="field-label">Comment (optional)</span><textarea id="approval-comment" class="field-input op-textarea" rows="3" maxlength="400"></textarea></label>`,`<div class="modal-actions">${btn('Cancel','close-overlay')}${btn(m.decision==='approved'?'Approve action':'Reject action','confirm-approval',{variant:m.decision==='approved'?'primary':'danger',data:`data-id="${safe(a.id)}" data-value="${safe(m.decision)}"`})}</div>`);
  }
  if(m.kind==='budget'){
    const a=agentById(state,m.id);if(!a)return '';
    return modalShell('Change daily budget','wallet',`<p>Set the daily budget for ${safe(a.name)}.</p><form id="budget-form"><input type="hidden" name="id" value="${safe(a.id)}"><div class="field-group"><label for="budget-amount" class="field-label">Daily limit (USD)</label><input class="field-input" type="number" id="budget-amount" name="budget" value="${a.budget}" min="1" max="100000" step="1" required autofocus></div><div class="modal-actions">${btn('Cancel','close-overlay')}<button class="btn primary" type="submit">Save limit</button></div></form>`, '');
  }
  if(m.kind==='reset')return modalShell('Reset workspace?','refresh',`<p>Restore the initial agents, requests and approvals. Your palette preference stays the same.</p>`,`<div class="modal-actions">${btn('Cancel','close-overlay')}${btn('Reset','confirm-reset',{variant:'danger'})}</div>`);
  return '';
}
export {integrationInstructions};
