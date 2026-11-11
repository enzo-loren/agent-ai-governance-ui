import { cleanState, safeReadState, canEdit, canApprove, agentById, safeId, appendScenario, changeMode, toggleConnection, decideApproval } from './domain.js';
import { TOUR, CONNECTIONS } from './data.js';
import { renderPage, renderAppShell, integrationInstructions } from './views.js';

const STORE = 'agent-governance-preview-v2';
const app = document.getElementById('app');
function loadStoredState(){try{return localStorage.getItem(STORE)}catch{return null}}
let state = safeReadState(loadStoredState());
let ui = { navOpen:false, drawer:null, modal:null, toast:'', catalogTab:'agents', catalogToolFilter:'all', catalogAgentLimit:24, catalogToolLimit:30, catalogPeopleLimit:24, catalogSearch:'', connectionSearch:'', connectionLimit:24, rulesSearch:'', rulesLimit:24, activitySearch:'', activityAgentSearch:'', activityLimit:30, activityStatus:'all', activityPaused:false, pausedIds:null, auditSearch:'', auditLimit:30, approvalsSearch:'', approvalsView:'pending', approvalsLimit:20, spendingSearch:'', spendingLimit:24, personLimit:24, requestUser:'operator' };
let toastTimer;
let beforeOverlayFocus = null;
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch{ /* Browser storage may be disabled */ }}
function route(){
  const value=location.hash.replace(/^#\/?/,'')||'home';
  const [name,rawId,section]=value.split('/');
  return {name:name||'home',id:rawId?decodeURIComponent(rawId):'',section:section||'overview'};
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
function go(path){ui.drawer=null;ui.modal=null;ui.navOpen=false;const target='#/'+path;if(location.hash!==target)location.hash=target;else{render();window.scrollTo({top:0,behavior:'instant'});}}
function showToast(message){ui.toast=message;clearTimeout(toastTimer);render({keepScroll:true});announce(message);toastTimer=setTimeout(()=>{ui.toast='';render({keepScroll:true})},3600)}
function openOverlay(slot,details){beforeOverlayFocus=document.activeElement;ui[slot]=details;render({keepScroll:true,focusOverlay:true});}
function closeOverlay(){ui.drawer=null;ui.modal=null;render({keepScroll:true});if(beforeOverlayFocus?.isConnected)beforeOverlayFocus.focus();else document.getElementById('main')?.focus({preventScroll:true});}
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
 document.addEventListener('click',event=>{
  const element=event.target.closest('[data-action]');if(!element)return;
  const act=element.dataset.action;
  if(!act)return;
  event.preventDefault();
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
   case 'open-integration-agent':state.selectedAgent=element.dataset.id;persist();go(`agent/${encodeURIComponent(element.dataset.id)}/connections`);break;
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
    if(!allowEdit())break;
    const a=agentById(state,element.dataset.id);if(!a)break;
    const next=Number(element.dataset.value);
    if(a.mode==='enforce' && a.preset!==next){openOverlay('modal',{kind:'policy-change',id:a.id,preset:next});break;}
    a.preset=next;persist();showToast('Policy updated');break;
   }
   case 'confirm-preset':{
    if(!allowEdit())break;const a=agentById(state,element.dataset.id);if(!a)break;
    a.preset=Number(element.dataset.value);ui.modal=null;persist();showToast('Policy updated');break;
   }
   case 'preview-enforce':if(allowEdit())openOverlay('modal',{kind:'enforce',id:element.dataset.id});break;
   case 'confirm-mode':{
    if(!allowEdit())break;
    changeMode(state,element.dataset.id,element.dataset.value);persist();ui.modal=null;showToast(element.dataset.value==='enforce'?'Rules enabled':'Agent returned to Observe');break;
   }
   case 'toggle-pause':if(allowEdit())openOverlay('modal',{kind:'pause',id:element.dataset.id});break;
   case 'confirm-pause':{
    if(!allowEdit())break;
    const a=agentById(state,element.dataset.id);if(!a)break;
    changeMode(state,a.id,a.mode==='suspended'?(a.previousMode||'observe'):'suspended');persist();ui.modal=null;showToast(a.mode==='suspended'?'Agent paused':'Agent resumed');break;
   }
   case 'simulate':{
    const id=element.dataset.id||'atlas';const a=agentById(state,id);if(!a)break;
    const action=a.id==='ops'?'Delete warehouse':a.id==='invoice'?'Change payment details':'Delete customer record';
    const e=appendScenario(state,{agentId:id,action,channel:element.dataset.channel||'inference',toolId:element.dataset.tool||null,userRole:ui.requestUser});
    if(!e)break;
    persist();ui.modal=null;ui.drawer={kind:'event',id:e.id};render({focusOverlay:true,keepScroll:true});announce('Simulated decision: '+e.status.replaceAll('_',' '));break;
   }
   case 'activity-pause':{
    ui.activityPaused=!ui.activityPaused;
    ui.pausedIds=ui.activityPaused?new Set(state.events.map(e=>e.id)):null;
    showToast(ui.activityPaused?'Activity feed paused':'Activity feed resumed');break;
   }
   case 'clear-activity':ui.activitySearch='';ui.activityAgentSearch='';ui.activityStatus='all';ui.activityLimit=30;render({keepScroll:true});break;
   case 'clear-audit':ui.auditSearch='';ui.auditLimit=30;render({keepScroll:true});break;
   case 'approval-confirm':if(allowApproval())openOverlay('modal',{kind:'approval',id:element.dataset.id,decision:element.dataset.value});break;
   case 'confirm-approval':{
    if(!allowApproval())break;
    const ok=decideApproval(state,element.dataset.id,element.dataset.value);
    if(ok){ui.modal=null;persist();showToast(element.dataset.value==='approved'?'Action approved':'Action rejected')}
    else showToast('This action could not be reviewed');break;
   }
   case 'edit-budget':if(allowEdit())openOverlay('modal',{kind:'budget',id:element.dataset.id});break;
   case 'toggle-connection':{
    if(!allowEdit())break;
    if(!toggleConnection(state,element.dataset.agent,element.dataset.id))break;
    const agent=agentById(state,element.dataset.agent);
    const name=CONNECTIONS.find(c=>c.id===element.dataset.id)?.name||'Connection';
    persist();showToast(`${name} ${agent?.connections.includes(element.dataset.id)?'connected':'disconnected'}`);break;
   }
   case 'copy-connection':copyText(integrationInstructions[element.dataset.id]?.snippet||'');break;
   case 'copy-trace':copyText(element.dataset.value||'');break;
   case 'copy-demo-key':copyText(`BASE_URL=https://demo.invalid/inference/v1\nAPI_KEY=demo-not-valid-${element.dataset.id||'new-agent'}`);break;
   case 'theme':state.theme=element.dataset.value;persist();render({keepScroll:true,focusOverlay:true});announce(`Palette: ${state.theme}`);break;
   case 'appearance':state.appearance=element.dataset.value;persist();render({keepScroll:true,focusOverlay:true});announce(`${state.appearance} appearance`);break;
   case 'reset-request':openOverlay('modal',{kind:'reset'});break;
   case 'confirm-reset':{
    const prefs={theme:state.theme,appearance:state.appearance,role:state.role};state={...cleanState(),...prefs};ui.drawer=null;ui.modal=null;ui.activityPaused=false;ui.pausedIds=null;ui.catalogSearch='';ui.connectionSearch='';ui.rulesSearch='';ui.activitySearch='';ui.activityAgentSearch='';ui.activityStatus='all';ui.auditSearch='';ui.approvalsSearch='';ui.approvalsView='pending';ui.spendingSearch='';ui.catalogAgentLimit=24;ui.catalogToolLimit=30;ui.catalogPeopleLimit=24;ui.connectionLimit=24;ui.rulesLimit=24;ui.activityLimit=30;ui.auditLimit=30;ui.approvalsLimit=20;ui.spendingLimit=24;ui.personLimit=24;persist();go('home');showToast('Workspace reset');break;
   }
   case 'tour-start':state.tour=0;persist();go(TOUR[0].route);break;
   case 'tour-next':{
    state.tour+=1;
    if(state.tour>=TOUR.length){state.tour=-1;persist();showToast('You finished the product tour');}
    else{persist();go(TOUR[state.tour].route)}
    break;
   }
   case 'tour-end':state.tour=-1;persist();showToast('Tour closed');break;
   default: break;
  }
 });
 document.addEventListener('change',event=>{
  const id=event.target.id;const value=event.target.value;
  if(id==='role-select'){
    state.role=value;persist();showToast(`View role: ${value}`);
  } else if(id==='request-user'){ui.requestUser=value;render({keepScroll:true});}
  else if(id==='activity-status'){ui.activityStatus=value;ui.activityLimit=30;render({keepScroll:true});}
 });
 document.addEventListener('input',event=>{
  const id=event.target.id;if(!['catalog-search','connection-search','rules-search','activity-search','activity-agent-search','audit-search','approvals-search','spending-search'].includes(id))return;
  if(id==='catalog-search'){ui.catalogSearch=event.target.value;ui.catalogAgentLimit=24;ui.catalogToolLimit=30;ui.catalogPeopleLimit=24;}
  else if(id==='connection-search'){ui.connectionSearch=event.target.value;ui.connectionLimit=24;}
  else if(id==='rules-search'){ui.rulesSearch=event.target.value;ui.rulesLimit=24;}
  else if(id==='activity-search'){ui.activitySearch=event.target.value;ui.activityLimit=30;}
  else if(id==='activity-agent-search'){ui.activityAgentSearch=event.target.value;ui.activityLimit=30;}
  else if(id==='audit-search'){ui.auditSearch=event.target.value;ui.auditLimit=30;}
  else if(id==='approvals-search'){ui.approvalsSearch=event.target.value;ui.approvalsLimit=20;}
  else if(id==='spending-search'){ui.spendingSearch=event.target.value;ui.spendingLimit=24;ui.personLimit=24;}
  render({keepScroll:true,focusId:id});
 });
 document.addEventListener('submit',event=>{
  if(event.target.id==='new-agent-form'){
    event.preventDefault();if(!allowEdit())return;
    const fd=new FormData(event.target);const name=String(fd.get('name')||'').trim();const owner=String(fd.get('owner')||'').trim();if(!name||!owner)return;
    let id=safeId(name)||'agent';if(state.agents.some(a=>a.id===id))id+=`-${state.agents.length+1}`;
    state.agents.push({id,name:name.slice(0,54),owner:owner.slice(0,54),initials:name.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase(),team:'New agent',mode:'observe',connections:['A'],preset:1,budget:25,spent:0,requests:0,tools:0,accent:'mint',active:true});
    state.selectedAgent=id;persist();ui.modal={kind:'new-agent-key',id};render({focusOverlay:true,keepScroll:true});announce('Agent created');
  } else if(event.target.id==='budget-form'){
    event.preventDefault();if(!allowEdit())return;
    const fd=new FormData(event.target);const agent=agentById(state,fd.get('id'));const num=Number(fd.get('budget'));
    if(!agent||!Number.isFinite(num)||num<1||num>100000){showToast('Enter a budget from 1 to 100,000');return;}
    agent.budget=num;persist();ui.modal=null;showToast('Daily budget updated');
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
 window.addEventListener('hashchange',()=>{ui.drawer=null;ui.modal=null;ui.navOpen=false;render();window.scrollTo({top:0,behavior:'instant'});document.getElementById('main')?.focus({preventScroll:true});});
}
setupEvents();setAppearance();render();
