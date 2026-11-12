import {handleOpsClick,handleOpsSubmit} from './operations.js';
import {createMockBackend,BackendConflictError} from './mock/backend.js';
import {parseRoute,activityFromSpending,auditFromSpending} from './router.js';
import { cleanState, safeReadState, canEdit, canApprove, agentById, safeId, appendScenario, changeMode, toggleConnection, decideApproval, changeRecord } from './domain.js';
import { TOUR, CONNECTIONS, POLICY_PRESETS } from './data.js';
import { renderPage, renderAppShell, integrationInstructions } from './views.js';
import {mintLocalCredential,stageCredential,revokeLocalCredential,credentialRecord,agentConnectionSnippet,mcpBaseUrl} from './mock/credentials.js';

const backend=createMockBackend();
const app=document.getElementById('app');
let {state,revision}=backend.read();
let ui = { credentialReceipt:null, navOpen:false, drawer:null, modal:null, toast:'', catalogTab:'agents', catalogToolFilter:'all', catalogAgentLimit:24, catalogToolLimit:30, catalogPeopleLimit:24, catalogSearch:'', connectionSearch:'', connectionLimit:24, rulesSearch:'', rulesLimit:24, activitySearch:'', activityAgentSearch:'', activityLimit:30, activityStatus:'all', activityPaused:false, pausedIds:null, auditSearch:'', auditLimit:30, approvalsSearch:'', approvalsView:'pending', approvalsLimit:20, spendingSearch:'', spendingLimit:24, personLimit:24, requestUser:'operator', policyPreview:null, activityUser:'', activityChannel:'', activityModel:'', auditFilters:{}, auditFiltersOpen:false, auditMode:'events', toolDraft:null, opError:'' };
let toastTimer;
let beforeOverlayFocus = null;
function persist(){
  try{const saved=backend.save(state,revision);state=saved.state;revision=saved.revision;return true;}
  catch(error){if(error instanceof BackendConflictError){const latest=backend.read();state=latest.state;revision=latest.revision;showToast('Workspace changed in another tab; latest data loaded');return false;}else throw error;}
}
function route(){
  return parseRoute(location.hash);
}
function announce(message){const node=document.getElementById('announcer');if(node)node.textContent=message;}
function setAppearance(){document.documentElement.setAttribute('data-theme',state.theme);document.documentElement.setAttribute('data-appearance',state.appearance);}
function render(opts={}){
  const oldY=window.scrollY;
  setAppearance();
  const {name,id,section}=route();
  app.innerHTML=renderAppShell(state,ui,name,renderPage(state,ui,name,id,section),section);
  if(opts.keepScroll)window.scrollTo({top:oldY,behavior:'instant'});
  const target=opts.focusId?document.getElementById(opts.focusId):null;
  if(target){target.focus({preventScroll:true});const v=target.value;try{target.setSelectionRange(v.length,v.length)}catch{}}
  else if(opts.focusOverlay){(app.querySelector('.modal [autofocus]')||app.querySelector('.drawer .icon-btn')||app.querySelector('.modal .btn'))?.focus({preventScroll:true});}
}
function go(path){ui.credentialReceipt=null;ui.drawer=null;ui.modal=null;ui.navOpen=false;const target='#/'+path;if(location.hash!==target)location.hash=target;else{render();window.scrollTo({top:0,behavior:'instant'});}}
function showToast(message){ui.toast=message;clearTimeout(toastTimer);render({keepScroll:true});announce(message);toastTimer=setTimeout(()=>{ui.toast='';render({keepScroll:true})},3600)}
function openOverlay(slot,details){beforeOverlayFocus=document.activeElement;ui[slot]=details;render({keepScroll:true,focusOverlay:true});}
function closeOverlay(){ui.credentialReceipt=null;ui.drawer=null;ui.modal=null;render({keepScroll:true});if(beforeOverlayFocus?.isConnected)beforeOverlayFocus.focus();else document.getElementById('main')?.focus({preventScroll:true});}
function copyText(value){
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(value).then(()=>showToast('Copied')).catch(()=>legacyCopy(value));
  return legacyCopy(value);
}
function legacyCopy(value){
  const box=document.createElement('textarea');box.value=value;box.style.position='fixed';box.style.opacity='0';document.body.appendChild(box);box.select();const copied=document.execCommand('copy');box.remove();showToast(copied?'Copied':'Could not copy automatically');
}
function allowEdit(){if(!canEdit(state)){showToast('Operator permission required');return false;}return true;}
function allowApproval(){if(!canApprove(state)){showToast('Approver permission required');return false;}return true;}
function setupEvents(){
 document.addEventListener('click',async event=>{
  const element=event.target.closest('[data-action]');if(!element)return;
  const act=element.dataset.action;
  if(!act)return;
  event.preventDefault();
  if(act==='copy-agent-key'||act==='copy-agent-config'){
   const receipt=ui.credentialReceipt;
   if(receipt && (ui.modal?.kind==='new-agent-key'||ui.modal?.kind==='agent-credential-receipt') && ui.modal.id===receipt.agentId){
     copyText(act==='copy-agent-key'?receipt.token:agentConnectionSnippet(receipt.token));
   }
   return;
  }
  if(act==='op-confirm-agent-action' && ui.modal?.kind==='op-confirm-agent' && ['rotate','revoke'].includes(ui.modal.action)){
    if(!allowEdit())return;
    const target=agentById(state,ui.modal.id);if(!target)return;
    if(ui.modal.action==='rotate'){
      try{
        const issued=await mintLocalCredential();
        const prior=structuredClone(state.credentials?.[target.id]||null);
        stageCredential(state.credentials,target.id,issued.record);
        changeRecord(state,'Agent credential rotated',target.id,target.name,prior,{credentialId:issued.record.id,version:credentialRecord(state.credentials,target.id).version});
        if(!persist())return;
        ui.credentialReceipt={agentId:target.id,token:issued.token};ui.modal={kind:'agent-credential-receipt',id:target.id};render({keepScroll:true,focusOverlay:true});
      }catch{showToast('Secure credential generation is unavailable');}
    }else{
      const keyId=document.getElementById('credential-to-revoke')?.value;
      const before=structuredClone(state.credentials?.[target.id]||null);
      if(!keyId||!revokeLocalCredential(state.credentials,target.id,keyId)){showToast('Select an active credential');return;}
      changeRecord(state,'Agent credential revoked',target.id,target.name,before,{credentialId:keyId,status:'revoked'});
      if(!persist())return;ui.modal=null;showToast('Credential marked revoked');
    }
    return;
  }
  if(act.startsWith('op-')){
   const result=handleOpsClick(state,ui,element);
   if(!result.handled)return;
   if(result.changed&&!persist())return;
   if(act==='op-view-tool-reviews'||act==='op-show-agent-tools'){go('catalog');return;}
   if(result.message)showToast(result.message);
   else render({keepScroll:true,focusOverlay:Boolean(ui.modal||ui.drawer)});
   return;
  }
  switch(act){
   case 'navigate':go(element.dataset.route||'home');break;
   case 'toggle-nav':ui.navOpen=!ui.navOpen;render({keepScroll:true});break;
   case 'close-nav':ui.navOpen=false;render({keepScroll:true});break;
   case 'close-overlay':closeOverlay();break;
   case 'open-settings':openOverlay('drawer',{kind:'settings'});break;
   case 'open-help':openOverlay('drawer',{kind:'help'});break;
   case 'open-event':openOverlay('drawer',{kind:'event',id:element.dataset.id});break;
   case 'open-connection':openOverlay('drawer',{kind:'connection',id:element.dataset.id});break;
   case 'open-explainer':openOverlay('drawer',{kind:'explainer',id:element.dataset.topic});break;
   case 'catalog-tab':ui.catalogTab=element.dataset.value;ui.catalogSearch='';ui.catalogToolFilter='all';ui.catalogAgentLimit=24;ui.catalogToolLimit=30;ui.catalogPeopleLimit=24;render({keepScroll:true});break;
   case 'catalog-tool-filter':ui.catalogToolFilter=element.dataset.value||'all';ui.catalogToolLimit=30;render({keepScroll:true});break;
   case 'approvals-view':ui.approvalsView=element.dataset.value||'pending';ui.approvalsLimit=20;render({keepScroll:true});break;
   case 'open-integration-agent':state.selectedAgent=element.dataset.id;if(!persist())return;go(`agent/${encodeURIComponent(element.dataset.id)}/connections`);break;
   case 'show-more-catalog':ui.catalogAgentLimit+=24;render({keepScroll:true});break;
   case 'show-more-connections':ui.connectionLimit+=24;render({keepScroll:true});break;
   case 'show-more-rules':ui.rulesLimit+=24;render({keepScroll:true});break;
   case 'show-more-tools':ui.catalogToolLimit+=30;render({keepScroll:true});break;
   case 'show-more-people':ui.catalogPeopleLimit+=24;render({keepScroll:true});break;
   case 'show-more-activity':ui.activityLimit+=30;render({keepScroll:true});break;
   case 'show-more-audit':ui.auditLimit+=30;render({keepScroll:true});break;
   case 'show-more-approvals':ui.approvalsLimit+=20;render({keepScroll:true});break;
   case 'show-more-spending':ui.spendingLimit+=24;render({keepScroll:true});break;
   case 'show-more-persons':ui.personLimit+=24;render({keepScroll:true});break;
   case 'add-agent':if(allowEdit())openOverlay('modal',{kind:'add-agent'});break;
   case 'choose-preset':{
    const a=agentById(state,element.dataset.id);if(!a)break;
    const next=Number(element.dataset.value);
    if(!POLICY_PRESETS.some(p=>p.id===next))break;
    ui.policyPreview=next===a.preset?null:{agentId:a.id,preset:next};
    render({keepScroll:true,focusId:`policy-preset-${a.id}-${next}`});break;
   }
   case 'cancel-policy-preview':ui.policyPreview=null;render({keepScroll:true});break;
   case 'review-policy-change':{
    if(!allowEdit())break;
    const a=agentById(state,element.dataset.id);
    const next=Number(element.dataset.value);
    if(!a||next===a.preset||!POLICY_PRESETS.some(p=>p.id===next)||ui.policyPreview?.agentId!==a.id||ui.policyPreview.preset!==next)break;
    openOverlay('modal',{kind:'policy-change',id:a.id,preset:next});break;
   }
   case 'confirm-preset':{
    if(!allowEdit())break;
    const a=agentById(state,element.dataset.id);
    const next=Number(element.dataset.value);
    if(!a||ui.modal?.kind!=='policy-change'||ui.modal.id!==a.id||ui.modal.preset!==next||!POLICY_PRESETS.some(p=>p.id===next))break;
    const before=a.preset;a.preset=next;changeRecord(state,'Policy preset',a.id,a.name,before,next);ui.policyPreview=null;ui.modal=null;if(!persist())return;showToast('Policy updated');break;
   }
   case 'preview-enforce':if(allowEdit())openOverlay('modal',{kind:'enforce',id:element.dataset.id});break;
   case 'confirm-mode':{
    if(!allowEdit())break;
    const agent=agentById(state,element.dataset.id);if(!agent?.owner?.trim()){showToast('Assign an owner before enabling rules');break;}const previous=agent?.mode;changeMode(state,element.dataset.id,element.dataset.value);if(agent)changeRecord(state,'Agent mode',agent.id,agent.name,previous,agent.mode);if(!persist())return;ui.modal=null;showToast(element.dataset.value==='enforce'?'Rules enabled':'Agent returned to Observe');break;
   }
   case 'toggle-pause':if(allowEdit())openOverlay('modal',{kind:'pause',id:element.dataset.id});break;
   case 'confirm-pause':{
    if(!allowEdit())break;
    const a=agentById(state,element.dataset.id);if(!a)break;
    const previous=a.mode;changeMode(state,a.id,a.mode==='suspended'?(a.previousMode||'observe'):'suspended');changeRecord(state,'Agent mode',a.id,a.name,previous,a.mode);if(!persist())return;ui.modal=null;showToast(a.mode==='suspended'?'Agent paused':'Agent resumed');break;
   }
   case 'spending-requests':
   case 'spending-person-requests':
   case 'spending-model-requests':{
    const agentId=element.dataset.id||'';
    if(agentId&&!agentById(state,agentId))break;
    ui.activitySearch='';ui.activityAgentSearch='';ui.activityUser=act==='spending-person-requests'?(element.dataset.person||''):'';
    ui.activityChannel='inference';ui.activityModel=act==='spending-model-requests'?(element.dataset.model||''):'';
    ui.activityStatus='all';ui.activityLimit=30;ui.activityPaused=false;ui.pausedIds=null;
    go(activityFromSpending({agentId,person:ui.activityUser,model:ui.activityModel}));break;
   }
   case 'spending-trace':{
    const traceId=element.dataset.id||'',agentId=element.dataset.agent||'';
    if(!state.events.some(e=>e.id===traceId&&(!agentId||e.agent===agentId)))break;
    ui.auditSearch=traceId;ui.auditFilters={};ui.auditMode='events';ui.auditLimit=30;
    go(auditFromSpending({agentId,traceId}));break;
   }
   case 'clear-activity':ui.activitySearch='';ui.activityAgentSearch='';ui.activityUser='';ui.activityChannel='';ui.activityModel='';ui.activityStatus='all';ui.activityLimit=30;clearRouteQuery();render({keepScroll:true});break;
   case 'clear-audit':ui.auditSearch='';ui.auditFilters={};ui.auditLimit=30;clearRouteQuery();render({keepScroll:true});break;
   case 'approval-confirm':if(allowApproval())openOverlay('modal',{kind:'approval',id:element.dataset.id,decision:element.dataset.value});break;
   case 'confirm-approval':{
    if(!allowApproval())break;
    const ok=decideApproval(state,element.dataset.id,element.dataset.value,state.reviewPerson||'Elena Kim',document.getElementById('approval-comment')?.value||'');
    if(ok){ui.modal=null;if(!persist())return;showToast(element.dataset.value==='approved'?'Action approved':'Action rejected')}
    else showToast('This action could not be reviewed');break;
   }
   case 'edit-budget':if(allowEdit())openOverlay('modal',{kind:'budget',id:element.dataset.id});break;
   case 'toggle-connection':{
    if(!allowEdit())break;
    if(!['B','C'].includes(element.dataset.id)||!agentById(state,element.dataset.agent))break;
    openOverlay('modal',{kind:'connection-change',id:element.dataset.agent,connection:element.dataset.id});break;
   }
   case 'confirm-connection':{
    if(!allowEdit()||ui.modal?.kind!=='connection-change')break;
    const a=agentById(state,ui.modal.id);if(!a||ui.modal.connection!==element.dataset.id)break;
    const before=[...a.connections];if(!toggleConnection(state,a.id,ui.modal.connection))break;
    changeRecord(state,'Connection change',a.id,CONNECTIONS.find(c=>c.id===ui.modal.connection)?.name||'Connection',before,[...a.connections]);
    const name=CONNECTIONS.find(c=>c.id===ui.modal.connection)?.name||'Connection';
    ui.modal=null;if(!persist())return;showToast(`${name} configuration updated`);break;
   }
   case 'copy-connection':copyText(element.dataset.id==='A'?agentConnectionSnippet():element.dataset.id==='B'?`MCP_URL=${mcpBaseUrl()}\nAUTH=Bearer <agent-token>`:integrationInstructions[element.dataset.id]?.snippet||'');break;
   case 'copy-trace':copyText(element.dataset.value||'');break;
   case 'theme':state.theme=element.dataset.value;if(!persist())return;render({keepScroll:true,focusOverlay:true});announce(`Palette: ${state.theme}`);break;
   case 'appearance':state.appearance=element.dataset.value;if(!persist())return;render({keepScroll:true,focusOverlay:true});announce(`${state.appearance} appearance`);break;
   case 'reset-request':openOverlay('modal',{kind:'reset'});break;
   case 'confirm-reset':{
    const prefs={theme:state.theme,appearance:state.appearance,role:state.role};state={...cleanState(),...prefs};ui.drawer=null;ui.modal=null;ui.policyPreview=null;ui.activityUser='';ui.activityChannel='';ui.activityModel='';ui.auditFilters={};ui.auditFiltersOpen=false;ui.auditMode='events';ui.activityPaused=false;ui.pausedIds=null;ui.catalogSearch='';ui.connectionSearch='';ui.rulesSearch='';ui.activitySearch='';ui.activityAgentSearch='';ui.activityStatus='all';ui.auditSearch='';ui.approvalsSearch='';ui.approvalsView='pending';ui.spendingSearch='';ui.catalogAgentLimit=24;ui.catalogToolLimit=30;ui.catalogPeopleLimit=24;ui.connectionLimit=24;ui.rulesLimit=24;ui.activityLimit=30;ui.auditLimit=30;ui.approvalsLimit=20;ui.spendingLimit=24;ui.personLimit=24;if(!persist())return;go('home');showToast('Workspace reset');break;
   }
   case 'tour-start':state.tour=0;if(!persist())return;go(TOUR[0].route);break;
   case 'tour-next':{
    state.tour+=1;
    if(state.tour>=TOUR.length){state.tour=-1;if(!persist())return;showToast('You finished the product tour');}
    else{if(!persist())return;go(TOUR[state.tour].route)}
    break;
   }
   case 'tour-end':state.tour=-1;if(!persist())return;showToast('Tour closed');break;
   default: break;
  }
 });
 document.addEventListener('change',event=>{
  const id=event.target.id;const value=event.target.value;
  if(id==='activity-model'){ui.activityModel=value;ui.activityLimit=30;render({keepScroll:true});}
  else if(id==='activity-channel'){ui.activityChannel=value;render({keepScroll:true});}
  else if(['audit-model','audit-channel','audit-connection','audit-status'].includes(id)){ui.auditFilters[id.replace('audit-','')]=value;render({keepScroll:true});}
  else if(id==='activity-status'){ui.activityStatus=value;ui.activityLimit=30;render({keepScroll:true});}
 });
 document.addEventListener('input',event=>{
  const id=event.target.id;if(!['activity-user','audit-agent','audit-user','audit-tool','audit-date-from','audit-date-to','catalog-search','connection-search','rules-search','activity-search','activity-agent-search','audit-search','approvals-search','spending-search'].includes(id))return;
  if(id==='activity-user'){ui.activityUser=event.target.value;ui.activityLimit=30;}
  else if(['audit-agent','audit-user','audit-tool','audit-date-from','audit-date-to'].includes(id)){ui.auditFilters[id.replace('audit-','')]=event.target.value;ui.auditLimit=30;}
  else if(id==='catalog-search'){ui.catalogSearch=event.target.value;ui.catalogAgentLimit=24;ui.catalogToolLimit=30;ui.catalogPeopleLimit=24;}
  else if(id==='connection-search'){ui.connectionSearch=event.target.value;ui.connectionLimit=24;}
  else if(id==='rules-search'){ui.rulesSearch=event.target.value;ui.rulesLimit=24;}
  else if(id==='activity-search'){ui.activitySearch=event.target.value;ui.activityLimit=30;}
  else if(id==='activity-agent-search'){ui.activityAgentSearch=event.target.value;ui.activityLimit=30;}
  else if(id==='audit-search'){ui.auditSearch=event.target.value;ui.auditLimit=30;}
  else if(id==='approvals-search'){ui.approvalsSearch=event.target.value;ui.approvalsLimit=20;}
  else if(id==='spending-search'){ui.spendingSearch=event.target.value;ui.spendingLimit=24;ui.personLimit=24;}
  render({keepScroll:true,focusId:id});
 });
 document.addEventListener('submit',async event=>{
  if(event.target.getAttribute('id')?.startsWith('op-')){
    event.preventDefault();const r=handleOpsSubmit(state,ui,event.target);
    if(!r.handled)return;if(r.changed&&!persist())return;
    if(r.message)showToast(r.message);else render({keepScroll:true,focusOverlay:Boolean(ui.modal||ui.drawer)});
    return;
  }
  if(event.target.getAttribute('id')==='new-agent-form'){
    event.preventDefault();if(!allowEdit())return;
    const fd=new FormData(event.target);const name=String(fd.get('name')||'').trim();const owner=String(fd.get('owner')||'').trim();if(!name||!owner)return;
    let id=safeId(name)||'agent';if(state.agents.some(a=>a.id===id))id+=`-${state.agents.length+1}`;
    const allowedModels=fd.getAll('model').filter(model=>state.modelTariffs?.[model]);
    if(!allowedModels.length){showToast('Select at least one model');return;}
    const budget=Number(fd.get('budget')||25);
    if(!Number.isFinite(budget)||budget<1||budget>100000){showToast('Enter a budget from 1 to 100,000');return;}
    let issued;try{issued=await mintLocalCredential();}catch{showToast('Secure credential generation is unavailable');return;}
    const record={id,name:name.slice(0,54),owner:owner.slice(0,54),initials:name.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase(),team:String(fd.get('team')||'').trim().slice(0,54)||'Unassigned',description:String(fd.get('description')||'').trim().slice(0,200),version:String(fd.get('version')||'1.0.0').trim().slice(0,30),mode:'observe',connections:['A'],preset:Number(fd.get('preset')||1),budget,spent:0,requests:0,tools:0,accent:'mint',active:true,allowedModels,blockStyle:fd.get('blockStyle')||'message',guardrailDiscovery:fd.get('guardrailDiscovery')||'block',invalidUserToken:fd.get('invalidUserToken')||'auto',acceptedClients:String(fd.get('acceptedClients')||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,30),hasHumanUsers:fd.has('hasHumanUsers')};
    if(!POLICY_PRESETS.some(x=>x.id===record.preset)){showToast('Choose a policy');return;}
    state.agents.push(record);state.credentials[id]={version:1,revoked:0,issuedTotal:0,active:[]};stageCredential(state.credentials,id,issued.record);
    changeRecord(state,'Agent registered',id,name,null,{...record,credentialId:issued.record.id});
    state.selectedAgent=id;if(!persist())return;
    ui.credentialReceipt={agentId:id,token:issued.token};ui.modal={kind:'new-agent-key',id};render({focusOverlay:true,keepScroll:true});announce('Agent created');
  } else if(event.target.getAttribute('id')==='budget-form'){
    event.preventDefault();if(!allowEdit())return;
    const fd=new FormData(event.target);const agent=agentById(state,fd.get('id'));const num=Number(fd.get('budget'));
    if(!agent||!Number.isFinite(num)||num<1||num>100000){showToast('Enter a budget from 1 to 100,000');return;}
    changeRecord(state,'Daily budget',agent.id,agent.name,agent.budget,num);agent.budget=num;if(!persist())return;ui.modal=null;showToast('Daily budget updated');
  }
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&(ui.modal||ui.drawer)){event.preventDefault();closeOverlay();return;}
  if(event.key==='Escape'&&ui.navOpen){ui.navOpen=false;render({keepScroll:true});return;}
  // Keep focus inside open dialog. Dialog controls are all native elements.
  if(event.key==='Tab'&&(ui.modal||ui.drawer)){
    const container=document.querySelector(ui.modal?'.modal-card':'.drawer');if(!container)return;
    const nodes=[...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length);
    if(!nodes.length)return;
    if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes.at(-1).focus();}
    else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0].focus();}
  }
 });
 window.addEventListener('storage',event=>{if(event.key==='agent-governance-mock-v3'){const fresh=backend.read();state=fresh.state;revision=fresh.revision;ui.drawer=null;ui.modal=null;ui.credentialReceipt=null;render({keepScroll:true});announce('Workspace data updated');}});
 window.addEventListener('hashchange',()=>{ui.credentialReceipt=null;ui.drawer=null;ui.modal=null;ui.policyPreview=null;ui.navOpen=false;applyDeepLinkFilters();render();window.scrollTo({top:0,behavior:'instant'});document.getElementById('main')?.focus({preventScroll:true});});
}
function clearRouteQuery(){const current=location.hash;if(current.includes('?'))history.replaceState(null,'',current.split('?')[0]);}
function applyDeepLinkFilters(){const r=route(),q=r.params;if(!q.toString())return;
 if(r.name==='activity'){ui.activityChannel=q.get('channel')||'';ui.activityUser=q.get('person')||'';ui.activityModel=q.get('model')||'';ui.activitySearch=q.get('trace')||'';ui.activityLimit=30;}
 if(r.name==='audit'){ui.auditSearch=q.get('trace')||'';ui.auditFilters={};ui.auditMode='events';ui.auditLimit=30;}
}
applyDeepLinkFilters();setupEvents();setAppearance();render();
