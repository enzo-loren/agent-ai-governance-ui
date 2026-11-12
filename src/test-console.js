import {createTestApi,TEST_ENDPOINTS} from './mock/test-api.js';
import {testCases} from './mock/test-fixtures.js';
import {escapeHTML} from './domain.js';

const api=createTestApi();
window.__studioSnapshot=()=>api.get().state;
const root=document.getElementById('test-studio');
let templates=[],selectedTemplate=0,lastResponse=null;
const pretty=value=>JSON.stringify(value,null,2);
const escape=escapeHTML;
const setupAgentId=new URLSearchParams(window.location.search).get('agent');
const workspaceUrl=()=>setupAgentId?`./index.html#/agent/${encodeURIComponent(setupAgentId)}`:`./index.html#/home`;
function recordLinks(response) {
  const id=response?.body?.trace_id;
  const agent=response?.body?.agent_id;
  if(!id||!agent)return '';
  const href=`./index.html#/audit/${encodeURIComponent(agent)}?trace=${encodeURIComponent(id)}`;
  return `<a class="studio-button" href="./index.html#/agent/${encodeURIComponent(agent)}">Open agent</a><a class="studio-button primary" id="open-audit" href="${escape(href)}">Inspect in Audit <span aria-hidden="true">↗</span></a>
    <a class="studio-button" href="./index.html#/activity/${encodeURIComponent(agent)}?trace=${encodeURIComponent(id)}">Open Activity</a>`;
}
function caseOptions(){return templates.map((t,i)=>`<option value="${i}" ${i===selectedTemplate?'selected':''}>${escape(t.name)}</option>`).join('');}
function render() {
  const snapshot=api.get();templates=testCases(snapshot);
  const setupAgent=snapshot.agents.find(a=>a.id===setupAgentId);
  if(setupAgent)templates.unshift({name:`First model request · ${setupAgent.name}`,path:'/v1/model-requests',payload:{agentId:setupAgent.id,action:'Connection check',model:setupAgent.allowedModels?.[0]||'GPT-6',userRole:'none'}});

  const current=templates[selectedTemplate]||templates[0];
  root.innerHTML=`<div class="studio-shell">
    <header class="studio-topbar"><div class="studio-brand"><img class="studio-wordmark" src="./assets/branding/morris-wordmark.png" alt="Morris & Opazo" width="531" height="77" /><span class="studio-context">Agent Governance · Request Studio</span></div><a class="studio-back" href="${workspaceUrl()}">Open workspace <span aria-hidden="true">↗</span></a></header>
    <main class="studio-main"><div class="studio-heading"><span class="studio-overline">TEST ENVIRONMENT</span><h1>Send a request</h1><p>Compose a request against the local data handler. Its response is reflected in the workspace, including Activity, Spending and Audit.</p></div>
    <div class="studio-grid"><section class="studio-card" aria-labelledby="composer-title"><div class="studio-card-header"><div><h2 id="composer-title">Request composer</h2><p>Choose a scenario or edit the JSON directly.</p></div><span class="studio-label">Local transport</span></div>
      <label class="studio-field" for="scenario"><span>Scenario</span><select id="scenario">${caseOptions()}</select></label>
      <label class="studio-field" for="endpoint"><span>Endpoint</span><select id="endpoint">${TEST_ENDPOINTS.map(e=>`<option value="${escape(e)}" ${current.path===e?'selected':''}>POST ${escape(e)}</option>`).join('')}</select></label>
      <label class="studio-field" for="agent-token"><span>Agent API key</span><input id="agent-token" type="password" autocomplete="off" spellcheck="false" placeholder="Paste the one-time agent key"><small>Required for registered agents. Never include credentials in the JSON body.</small></label>
      <label class="studio-field" for="payload"><span>JSON body</span><textarea id="payload" spellcheck="false" rows="12">${escape(pretty(current.payload))}</textarea></label>
      <div class="studio-actions"><button class="studio-button primary" id="send-request" type="button">Send request</button><button class="studio-button" id="reset-template" type="button">Restore template</button></div>
    </section>
    <section class="studio-card studio-response" aria-labelledby="response-title"><div class="studio-card-header"><div><h2 id="response-title">Response</h2><p>Results from the local handler.</p></div><span class="studio-status" id="http-status">Not sent</span></div><pre id="response-body" aria-live="polite">${escape(pretty({message:'Submit a request to see its decision and trace ID.'}))}</pre><div class="studio-actions" id="response-links"></div>
      <div class="studio-divider"></div><h3>Workspace state</h3><div class="studio-stats"><div><strong id="agent-count">${snapshot.agents.length}</strong><span>Agents</span></div><div><strong id="event-count">${snapshot.events.length}</strong><span>Recorded events</span></div><div><strong id="pending-count">${snapshot.approvals.filter(a=>a.status==='pending').length}</strong><span>Pending approvals</span></div></div><button id="refresh-state" class="studio-text-btn" type="button">Refresh counts</button>
    </section></div>
    <section class="studio-note"><strong>About this environment</strong><p>These endpoints use an in-browser handler and synthetic data; they do not make HTTP requests to a gateway. The workspace remains a separate, customer-facing interface. Both pages share data on this origin.</p></section>
    </main></div>`;
  document.getElementById('scenario').addEventListener('change',e=>{selectedTemplate=Number(e.target.value);setTemplate();});
  document.getElementById('reset-template').addEventListener('click',setTemplate);
  document.getElementById('send-request').addEventListener('click',submitRequest);
  document.getElementById('refresh-state').addEventListener('click',refreshCounts);
}
function setTemplate(){
 const current=templates[selectedTemplate];
 document.getElementById('endpoint').value=current.path;
 document.getElementById('payload').value=pretty(current.payload);
}
function refreshCounts(){
 const snapshot=api.get();
 document.getElementById('agent-count').textContent=snapshot.agents.length;
 document.getElementById('event-count').textContent=snapshot.events.length;
 document.getElementById('pending-count').textContent=snapshot.approvals.filter(a=>a.status==='pending').length;
}
async function submitRequest(){
 const endpoint=document.getElementById('endpoint').value;
 const text=document.getElementById('payload').value;
 let payload,reply;
 try {payload=JSON.parse(text);}catch {reply={status:400,body:{error:'Invalid JSON body'}};}
 if(!reply){
  if(endpoint==='/_test/workspace/reset'&&!window.confirm('Restore the original local data? Your workspace changes will be lost.'))return;
  reply=await api.postAuthenticated(endpoint,payload,document.getElementById('agent-token').value);
 }
 lastResponse=reply;
 const status=document.getElementById('http-status');
 status.textContent=`${reply.status} ${reply.status<300?'OK':'Error'}`;
 status.className=`studio-status ${reply.status<300?'ok':'error'}`;
 document.getElementById('response-body').textContent=pretty(reply.body);
 document.getElementById('response-links').innerHTML=recordLinks(reply);
 refreshCounts();
}
render();
