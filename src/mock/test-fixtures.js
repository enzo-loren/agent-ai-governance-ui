/** Scenario templates belong to the test environment, not to customer-facing views. */
export function testCases(state) {
  const agent=state.agents.find(a=>a.mode!=='retired')||state.agents[0];
  const tool=state.tools.find(t=>t.agent===agent.id&&t.control==='B')||state.tools.find(t=>t.agent===agent.id);
  const outside=state.tools.find(t=>t.control==='A');
  const pending=state.approvals.find(a=>a.status==='pending');
  return [
    {name:'Model request',path:'/v1/model-requests',payload:{agentId:agent.id,toolId:tool?.id,model:'GPT-6',userRole:'operator',parameters:{amount:8}}},
    {name:'Tool invocation',path:'/v1/tool-invocations',payload:{agentId:agent.id,toolId:tool?.id,userRole:'operator',parameters:{amount:25}}},
    {name:'Outside gateway',path:'/v1/tool-invocations',payload:{agentId:outside?.agent||agent.id,toolId:outside?.id||tool?.id,userRole:'none',parameters:{}}},
    {name:'Request without identity',path:'/v1/model-requests',payload:{agentId:agent.id,toolId:tool?.id,userRole:'none',model:'GPT-6'}},
    {name:'Discover tool',path:'/v1/tools/discoveries',payload:{agentId:agent.id,name:'Check account flags',id:'check-account-flags',schema:{account_id:'string'}}},
    {name:'Change tool schema',path:'/v1/tools/schema-revisions',payload:{toolId:tool?.id,schema:{amount:'number',target_id:'string',confirmation_code:'string'}}},
    {name:'Expire approval',path:'/v1/approvals/expire',payload:{approvalId:pending?.id||'APR-201'}},
    {name:'Change role',path:'/_test/session/role',payload:{role:'approver'}},
    {name:'Choose reviewer',path:'/_test/session/reviewer',payload:{name:'Elena Kim'}},
    {name:'Presentation layout',path:'/_test/workspace/presentation',payload:{enabled:true}},
    {name:'Reset local workspace',path:'/_test/workspace/reset',payload:{confirm:true}}
  ];
}
