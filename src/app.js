import { cleanState, safeReadState, canEdit, canApprove, agentById, safeId, appendScenario, changeMode, toggleConnection, decideApproval } from './domain.js';
import { TOUR } from './data.js';
import { renderPage, renderAppShell, integrationInstructions } from './views.js';

const STORE = 'agent-governance-visual-demo-v1';
const app = document.getElementById('app');
function loadStoredState(){try{return localStorage.getItem(STORE)}catch{return null}}
let state = safeReadState(loadStoredState());
let ui = { navOpen:false, drawer:null, modal:null, toast:'', catalogTab:'agents', catalogSearch:'', activitySearch:'', activityAgent:'all', activityStatus:'all', activityPaused:false, pausedIds:null, auditSearch:'', integrationAgent:'atlas', rulesAgent:'atlas' };
let toastTimer;
let beforeOverlayFocus = null;
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch{ /* Browser storage may be disabled */ }}
function route(){
  const value=location.hash.replace(/^#\/?/,'')||'home';
  const [name,rawId]=value.split('/');
  return {name:name||'home',id:rawId?decodeURIComponent(rawId):''};
}
function announce(message){const node=document.getElementById('announcer');if(node)node.textContent=message;}
function setAppearance(){document.documentElement.setAttribute('data-theme',state.theme);document.documentElement.setAttribute('data-appearance',state.appearance);}
function render(opts={}){
  const oldY=window.scrollY;
  setAppearance();
  const {name,id}=route();
  app.innerHTML=renderAppShell(state,ui,name,renderPage(state,ui,name,id));
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
function allowEdit(){if(!canEdit(state)){showToast('Switch to Operator to try this demo action');return false;}return true;}
function allowApproval(){if(!canApprove(state)){showToast('Switch to Approver to try this demo action');return false;}return true;}
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
   case 'catalog-tab':ui.catalogTab=element.dataset.value;ui.catalogSearch='';render({keepScroll:true});break;
   case 'add-agent':if(allowEdit())openOverlay('modal',{kind:'add-agent'});break;
   case 'choose-preset':{
    if(!allowEdit())break;
    const a=agentById(state,element.dataset.id);if(!a)break;
    const next=Number(element.dataset.value);
    if(a.mode==='enforce' && a.preset!==next){openOverlay('modal',{kind:'policy-change',id:a.id,preset:next});break;}
    a.preset=next;persist();showToast('Demo policy updated');break;
   }
   case 'confirm-preset':{
    if(!allowEdit())break;const a=agentById(state,element.dataset.id);if(!a)break;
    a.preset=Number(element.dataset.value);ui.modal=null;persist();showToast('Demo policy updated');break;
   }
   case 'preview-enforce':if(allowEdit())openOverlay('modal',{kind:'enforce',id:element.dataset.id});break;
   case 'confirm-mode':{
    if(!allowEdit())break;
    changeMode(state,element.dataset.id,element.dataset.value);persist();ui.modal=null;showToast(element.dataset.value==='enforce'?'Demo enforcement enabled':'Agent returned to Observe');break;
   }
   case 'toggle-pause':if(allowEdit())openOverlay('modal',{kind:'pause',id:element.dataset.id});break;
   case 'confirm-pause':{
    if(!allowEdit())break;
    const a=agentById(state,element.dataset.id);if(!a)break;
    changeMode(state,a.id,a.mode==='suspended'?'observe':'suspended');persist();ui.modal=null;showToast(a.mode==='suspended'?'Demo agent paused':'Demo agent resumed');break;
   }
   case 'simulate':{
    const id=element.dataset.id||'atlas';const a=agentById(state,id);if(!a)break;
    const action=a.id==='ops'?'Delete warehouse':a.id==='invoice'?'Change payment details':'Delete customer record';
    const e=appendScenario(state,{agentId:id,action,channel:element.dataset.channel||'inference'});
    if(!e)break;
    persist();ui.modal=null;ui.drawer={kind:'event',id:e.id};render({focusOverlay:true,keepScroll:true});announce('Simulated decision: '+e.status.replaceAll('_',' '));break;
   }
   case 'activity-pause':{
    ui.activityPaused=!ui.activityPaused;
    ui.pausedIds=ui.activityPaused?new Set(state.events.map(e=>e.id)):null;
    showToast(ui.activityPaused?'Activity feed paused':'Activity feed resumed');break;
   }
   case 'clear-activity':ui.activitySearch='';ui.activityAgent='all';ui.activityStatus='all';render({keepScroll:true});break;
   case 'clear-audit':ui.auditSearch='';render({keepScroll:true});break;
   case 'approval-confirm':if(allowApproval())openOverlay('modal',{kind:'approval',id:element.dataset.id,decision:element.dataset.value});break;
   case 'confirm-approval':{
    if(!allowApproval())break;
    const ok=decideApproval(state,element.dataset.id,element.dataset.value);
    if(ok){ui.modal=null;persist();showToast(element.dataset.value==='approved'?'Demo action approved':'Demo action rejected')}
    else showToast('This action could not be reviewed');break;
   }
   case 'edit-budget':if(allowEdit())openOverlay('modal',{kind:'budget',id:element.dataset.id});break;
   case 'toggle-connection':{
    if(!allowEdit())break;
    toggleConnection(state,element.dataset.agent,element.dataset.id);persist();showToast(`Demo connection ${element.dataset.id} updated`);break;
   }
   case 'copy-connection':copyText(integrationInstructions[element.dataset.id]?.snippet||'');break;
   case 'copy-trace':copyText(element.dataset.value||'');break;
   case 'copy-demo-key':copyText(`BASE_URL=https://demo.invalid/inference/v1\nAPI_KEY=demo-not-valid-${element.dataset.id||'new-agent'}`);break;
   case 'theme':state.theme=element.dataset.value;persist();render({keepScroll:true,focusOverlay:true});announce(`Palette: ${state.theme}`);break;
   case 'appearance':state.appearance=element.dataset.value;persist();render({keepScroll:true,focusOverlay:true});announce(`${state.appearance} appearance`);break;
   case 'reset-request':openOverlay('modal',{kind:'reset'});break;
   case 'confirm-reset':{
    const prefs={theme:state.theme,appearance:state.appearance,role:state.role};state={...cleanState(),...prefs};ui.drawer=null;ui.modal=null;ui.activityPaused=false;ui.pausedIds=null;persist();go('home');showToast('Sample data reset');break;
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
    state.role=value;persist();showToast(`Previewing ${value} role. No real sign-in changed.`);
  } else if(id==='activity-agent'){ui.activityAgent=value;render({keepScroll:true});}
  else if(id==='activity-status'){ui.activityStatus=value;render({keepScroll:true});}
  else if(id==='integration-agent'){ui.integrationAgent=value;state.selectedAgent=value;persist();render({keepScroll:true});}
  else if(id==='rules-agent'){ui.rulesAgent=value;state.selectedAgent=value;persist();render({keepScroll:true});}
 });
 document.addEventListener('input',event=>{
  const id=event.target.id;if(!['catalog-search','activity-search','audit-search'].includes(id))return;
  if(id==='catalog-search')ui.catalogSearch=event.target.value;
  else if(id==='activity-search')ui.activitySearch=event.target.value;
  else ui.auditSearch=event.target.value;
  render({keepScroll:true,focusId:id});
 });
 document.addEventListener('submit',event=>{
  if(event.target.id==='new-agent-form'){
    event.preventDefault();if(!allowEdit())return;
    const fd=new FormData(event.target);const name=String(fd.get('name')||'').trim();const owner=String(fd.get('owner')||'').trim();if(!name||!owner)return;
    let id=safeId(name)||'agent';if(state.agents.some(a=>a.id===id))id+=`-${state.agents.length+1}`;
    state.agents.push({id,name:name.slice(0,54),owner:owner.slice(0,54),initials:name.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase(),team:'New agent',mode:'observe',connections:['A'],preset:1,budget:25,spent:0,requests:0,tools:0,accent:'mint',active:true});
    state.selectedAgent=id;persist();ui.modal={kind:'new-agent-key',id};render({focusOverlay:true,keepScroll:true});announce('New demo agent created');
  } else if(event.target.id==='budget-form'){
    event.preventDefault();if(!allowEdit())return;
    const fd=new FormData(event.target);const agent=agentById(state,fd.get('id'));const num=Number(fd.get('budget'));
    if(!agent||!Number.isFinite(num)||num<1||num>100000){showToast('Enter a budget from 1 to 100,000');return;}
    agent.budget=num;persist();ui.modal=null;showToast('Sample daily budget updated');
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
