/** Local POST-shaped test transport. It does not accept network traffic or authenticate users. */
import {createMockBackend,BackendConflictError} from './backend.js';
import {matchesActiveCredential} from './credentials.js';
import {agentById,appendScenario,changeRecord,toolById,safeId} from '../domain.js';

export const TEST_ENDPOINTS=Object.freeze([
  '/v1/model-requests',
  '/v1/tool-invocations',
  '/v1/tools/discoveries',
  '/v1/tools/schema-revisions',
  '/v1/approvals/expire',
  '/_test/session/role',
  '/_test/session/reviewer',
  '/_test/workspace/reset',
  '/_test/workspace/presentation'
]);
const bad=(message,status=400)=>({status,body:{error:message}});
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const validSchema=s=>object(s)&&Object.keys(s).length>0&&Object.keys(s).length<=30&&Object.values(s).every(v=>['string','number','boolean'].includes(v));

export function createTestApi(backend=createMockBackend()) {
 const dispatch=(path,body={},credentialVerified=false)=>{

      if(!TEST_ENDPOINTS.includes(path))return bad('Unknown endpoint',404);
      if(!object(body))return bad('JSON body must be an object');
      try {
        const snapshot=backend.read(),state=snapshot.state;
        if(path==='/_test/workspace/reset') {
          if(body.confirm!==true)return bad('Explicit confirm:true is required');
          const saved=backend.reset(snapshot.revision);
          return {status:200,body:{reset:true,revision:saved.revision}};
        }
        if(path==='/_test/session/role') {
          if(!['operator','approver','auditor'].includes(body.role))return bad('role must be operator, approver or auditor');
          state.role=body.role;
          const saved=backend.save(state,snapshot.revision);
          return {status:200,body:{role:state.role,revision:saved.revision}};
        }
        if(path==='/_test/session/reviewer') {
          const name=String(body.name||'').trim();
          if(name.length<3||name.length>80)return bad('Reviewer name must contain 3–80 characters');
          state.reviewPerson=name;
          const saved=backend.save(state,snapshot.revision);
          return {status:200,body:{reviewer:name,revision:saved.revision}};
        }
        if(path==='/_test/workspace/presentation') {
          if(typeof body.enabled!=='boolean')return bad('enabled must be a boolean');
          state.presentation=body.enabled;
          const saved=backend.save(state,snapshot.revision);
          return {status:200,body:{enabled:body.enabled,revision:saved.revision}};
        }
        if(path==='/v1/model-requests'||path==='/v1/tool-invocations') {
          if(typeof body.agentId!=='string'||!agentById(state,body.agentId))return bad('Unknown agentId',422);
          const agent=agentById(state,body.agentId);
          if(state.credentials?.[body.agentId]&&!credentialVerified)return bad('Agent API key is missing, invalid or revoked',401);
          if(agent.mode==='retired')return bad('Agent retired',409);
          if(body.toolId!==undefined && !state.tools.some(t=>t.agent===body.agentId&&t.id===body.toolId))return bad('Tool does not belong to agent',422);
          if(body.userRole!==undefined && !['operator','reader','none'].includes(body.userRole))return bad('Invalid userRole',422);
          if(body.parameters!==undefined && !object(body.parameters))return bad('parameters must be an object',422);
          if(body.model!==undefined && (typeof body.model!=='string'||!body.model.trim()))return bad('Invalid model',422);
          const channel=path==='/v1/model-requests'?'inference':'tool';
          if(channel==='tool'&&!body.toolId)return bad('toolId is required for tool invocation',422);
          const tool=body.toolId?toolById(state,body.toolId):null;
          const action=tool?.name||String(body.action||'Model request').trim();
          const result=appendScenario(state,{agentId:body.agentId,channel,toolId:tool?.id||null,action,
            userRole:body.userRole||'operator',model:body.model||null,parameters:body.parameters||{}});
          if(!result)return bad('Could not process this request',422);
          result.source='test-console';
          if(channel==='inference'&&credentialVerified&&agent.connectionCheck?.status==='pending'){
            agent.connectionCheck={status:'verified',verifiedAt:new Date().toISOString(),traceId:result.id};
          }
          const saved=backend.save(state,snapshot.revision);
          return {status:201,body:{trace_id:result.id,agent_id:result.agent,decision:result.status,channel:result.kind,
            cost_usd:result.cost,connection_status:agent.connectionCheck?.status||null,revision:saved.revision}};
        }
        if(path==='/v1/tools/discoveries') {
          const agent=agentById(state,body.agentId);
          if(!agent)return bad('Unknown agentId',422);
          const name=String(body.name||'').trim();if(name.length<3||name.length>80)return bad('name must contain 3–80 characters',422);
          if(!validSchema(body.schema))return bad('schema must contain supported typed fields',422);
          let id=safeId(body.id||name);if(!id||state.tools.some(t=>t.id===id))return bad('Tool ID already exists or is invalid',409);
          const tool={id,name,agent:agent.id,type:'Unclassified',approved:false,control:'A',classification:'suggested',reviewStatus:'pending',supervision:'autonomous',schemaVersion:1,schema:structuredClone(body.schema)};
          state.tools.push(tool);
          changeRecord(state,'Tool discovery',agent.id,id,null,{name,version:1});
          const saved=backend.save(state,snapshot.revision);
          return {status:201,body:{tool_id:id,review_status:'pending',revision:saved.revision}};
        }
        if(path==='/v1/tools/schema-revisions') {
          const tool=toolById(state,body.toolId);
          if(!tool)return bad('Unknown toolId',422);
          if(!validSchema(body.schema))return bad('schema must contain supported typed fields',422);
          const previous={version:tool.schemaVersion,schema:structuredClone(tool.schema)};
          tool.schemaVersion=(tool.schemaVersion||1)+1;
          tool.schema=structuredClone(body.schema);
          tool.classification='suggested';tool.reviewStatus='pending';tool.approved=false;
          changeRecord(state,'Tool schema changed',tool.agent,tool.id,previous,{version:tool.schemaVersion,schema:tool.schema});
          const saved=backend.save(state,snapshot.revision);
          return {status:200,body:{tool_id:tool.id,schema_version:tool.schemaVersion,review_status:'pending',revision:saved.revision}};
        }
        if(path==='/v1/approvals/expire') {
          const approval=state.approvals.find(a=>a.id===body.approvalId);
          if(!approval)return bad('Unknown approvalId',422);
          if(approval.status!=='pending')return bad('Approval is not pending',409);
          approval.status='expired';approval.expires='Expired';
          changeRecord(state,'Approval expired',approval.agent,approval.id,'pending','expired');
          const saved=backend.save(state,snapshot.revision);
          return {status:200,body:{approval_id:approval.id,status:'expired',revision:saved.revision}};
        }
        return bad('Unknown endpoint',404);
      } catch(err) {
        if(err instanceof BackendConflictError)return bad('Workspace was modified concurrently',409);
        return bad('Request rejected by local handler',500);
      }
    }
 };
 return Object.freeze({
  get(){const {state,revision}=backend.read();return {revision,agents:state.agents,tools:state.tools,approvals:state.approvals,events:state.events,state};},
  post(path,body={}){return dispatch(path,body,false);},
  async postAuthenticated(path,body={},token=''){
   if(!['/v1/model-requests','/v1/tool-invocations'].includes(path)||!object(body))return dispatch(path,body,false);
   const snapshot=backend.read(),record=snapshot.state.credentials?.[body.agentId];
   if(!record)return dispatch(path,body,false);
   if(!await matchesActiveCredential(record,token))return bad('Agent API key is missing, invalid or revoked',401);
   return dispatch(path,body,true);
  }
 });
}
