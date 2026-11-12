/** Deterministic in-browser service fixtures. These are not real customer data. */
export const REPORTING_DATE='2026-11-11';
export const SEED_AGENTS = [
  { id: 'atlas', name: 'Atlas Support', initials: 'AS', team: 'Customer experience', owner: 'Maya Chen', mode: 'enforce', connections: ['A','B','C'], preset: 2, budget: 40, spent: 18.4, requests: 2140, tools: 5, accent: 'sage', active: true },
  { id: 'invoice', name: 'Invoice Assistant', initials: 'IA', team: 'Finance', owner: 'Alex Rivera', mode: 'observe', connections: ['A'], preset: 1, budget: 30, spent: 24.7, requests: 880, tools: 4, accent: 'lavender', active: true },
  { id: 'ops', name: 'Operations Copilot', initials: 'OC', team: 'Operations', owner: 'Jordan Lee', mode: 'enforce', connections: ['A','B'], preset: 2, budget: 50, spent: 11.2, requests: 1240, tools: 6, accent: 'peach', active: true }
];
export const SEED_TOOLS = [
  { id: 't1', name: 'Search knowledge base', agent: 'atlas', type: 'Read', approved: true, control: 'B' },
  { id: 't2', name: 'Update customer profile', agent: 'atlas', type: 'Write', approved: true, control: 'B' },
  { id: 't3', name: 'Delete customer record', agent: 'atlas', type: 'Critical', approved: false, control: 'B' },
  { id: 't4', name: 'Issue refund', agent: 'atlas', type: 'Critical', approved: true, control: 'B' },
  { id: 't5', name: 'Get order status', agent: 'atlas', type: 'Read', approved: true, control: 'A' },
  { id: 't6', name: 'Get invoice', agent: 'invoice', type: 'Read', approved: true, control: 'A' },
  { id: 't7', name: 'Change payment details', agent: 'invoice', type: 'Critical', approved: false, control: 'A' },
  { id: 't8', name: 'Send invoice email', agent: 'invoice', type: 'Write', approved: true, control: 'A' },
  { id: 't9', name: 'Sync invoices', agent: 'invoice', type: 'Write', approved: true, control: 'A' },
  { id: 't10', name: 'Read inventory', agent: 'ops', type: 'Read', approved: true, control: 'B' },
  { id: 't11', name: 'Update inventory', agent: 'ops', type: 'Write', approved: true, control: 'B' },
  { id: 't12', name: 'Delete warehouse', agent: 'ops', type: 'Critical', approved: false, control: 'B' },
  { id: 't13', name: 'Create shipment', agent: 'ops', type: 'Write', approved: true, control: 'B' },
  { id: 't14', name: 'Archive report', agent: 'ops', type: 'Write', approved: true, control: 'A' },
  { id: 't15', name: 'Search suppliers', agent: 'ops', type: 'Read', approved: true, control: 'B' }
];
export const SEED_EVENTS = [
  { id: 'TRC-1044', at: '09:44', ago: 'Just now', agent: 'atlas', actor: 'Maya Chen', action: 'Delete customer record', kind: 'inference', model: 'GPT-6', status: 'would_block', connections: ['A','C'], cost: 0.012, rule: 'Critical actions are not allowed', version: 'v1.8', reason: 'This request was recorded while the agent used Observe mode. It was not blocked by this policy. The agent now enforces rules; later execution requires the tool gateway.', modeAtEvent: 'observe', evidence: true },
  { id: 'TRC-1042', at: '09:42', ago: 'Just now', agent: 'atlas', actor: 'Maya Chen', action: 'Search knowledge base', kind: 'tool', model: 'GPT-6', status: 'allowed', connections: ['A','B','C'], cost: 0, rule: 'Approved read access', version: 'v1.8', reason: 'Maya can search support articles. The tool ran through the protected connection.', evidence: true },
  { id: 'TRC-1041', at: '09:40', ago: '2 min ago', agent: 'invoice', actor: 'No user identity', action: 'Change payment details', kind: 'inference', model: 'GPT-6', status: 'would_block', connections: ['A'], cost: 0.021, rule: 'Critical actions need approval', version: 'v1.8', reason: 'This request would be blocked if rules were enforced. The tool was only requested by the model, not executed through this platform.', evidence: true },
  { id: 'TRC-1040', at: '09:38', ago: '4 min ago', agent: 'ops', actor: 'No user identity', action: 'Delete warehouse', kind: 'tool', model: 'Claude Sonnet', status: 'blocked', connections: ['A','B'], cost: 0, rule: 'Critical actions are not approved', version: 'v1.8', reason: 'The actual tool execution was blocked before it reached the connected tool.', evidence: true },
  { id: 'TRC-1039', at: '09:35', ago: '7 min ago', agent: 'atlas', actor: 'Maya Chen', action: 'Retrieve order status', kind: 'inference', model: 'GPT-6', status: 'filtered', connections: ['A','C'], cost: 0.011, rule: 'Remove personal data', version: 'v1.7', reason: 'Personal information was hidden before the response was returned.', evidence: true },
  { id: 'TRC-1038', at: '09:32', ago: '10 min ago', agent: 'invoice', actor: 'No user identity', action: 'Send invoice email', kind: 'inference', model: 'GPT-6', status: 'outside', connections: ['A'], cost: 0.017, rule: 'No tool execution connection', version: '—', reason: 'The tool was declared to the model, but its execution happens outside the connected gateway. Actual execution was not verified or controlled.', evidence: true },
  { id: 'TRC-1037', at: '09:29', ago: '13 min ago', agent: 'atlas', actor: 'Maya Chen', action: 'Issue refund', kind: 'tool', model: 'GPT-6', status: 'pending', connections: ['A','B','C'], cost: 0, rule: 'Critical actions need review', version: 'v1.8', reason: 'The tool is waiting for another person to approve it. It has not executed.', evidence: true },
  { id: 'TRC-1036', at: '09:25', ago: '17 min ago', agent: 'invoice', actor: 'No user identity', action: 'Generate monthly summary', kind: 'inference', model: 'GPT-6', status: 'limited', connections: ['A'], cost: 0.018, rule: 'Daily spending alert', version: 'v1.8', reason: 'A configured rate or budget limit was reached in the demo scenario.', evidence: true },
  { id: 'TRC-1035', at: '09:21', ago: '21 min ago', agent: 'ops', actor: 'No user identity', action: 'Update inventory', kind: 'tool', model: 'Claude Sonnet', status: 'missing', connections: ['A','B'], cost: 0, rule: 'Evidence unavailable', version: '—', reason: 'This demonstration record has no verifiable evidence. Do not interpret it as protected.', evidence: false },
  { id: 'TRC-1034', at: '09:17', ago: '25 min ago', agent: 'atlas', actor: 'No user identity', action: 'Get order status', kind: 'inference', model: 'GPT-6', status: 'outside', connections: ['A'], cost: 0.008, rule: 'Execution not connected', version: 'v1.8', reason: 'The model declared this tool, but its execution does not pass through the connected MCP gateway.', evidence: true },
  { id: 'TRC-1033', at: '09:14', ago: '30 min ago', agent: 'ops', actor: 'Jordan Lee', action: 'Remove archived records', kind: 'inference', model: 'Claude Sonnet', status: 'allowed', connections: ['A','C'], cost: 0.019, rule: 'Request accepted', version: 'v1.7', reason: 'The model requested a critical operation. The execution awaits a separate review through the tool gateway.', evidence: true },
];
export const SEED_APPROVALS = [
  { id: 'APR-201', agent: 'atlas', action: 'Issue refund · $240', requestedBy: 'Maya Chen', requestedAt: '09:29', reason: 'Refunds above $100 require a second person.', expires: '14 min', status: 'pending', trace: 'TRC-1037' },
  { id: 'APR-202', agent: 'ops', action: 'Remove archived records', requestedBy: 'Jordan Lee', requestedAt: '09:26', reason: 'Deleting records needs human approval.', expires: '9 min', status: 'pending', trace: 'TRC-1033' }
];

export const MODEL_CATALOG = [
  {name:'GPT-6',provider:'OpenAI'},
  {name:'Claude Sonnet',provider:'Anthropic'}
];
export const PERSONA_CATALOG = {
  operator: {name:'Maya Chen',label:'Maya · operator'},
  reader: {name:'Eli Ramos',label:'Eli · read only'},
  none: {name:'No user identity',label:'No user identity'}
};
export const REVIEWERS = [
  {id:'Elena Kim',label:'Elena Kim · approver'},
  {id:'Maya Chen',label:'Maya Chen · requester'},
  {id:'Jordan Lee',label:'Jordan Lee · requester'}
];
export const INITIAL_REVIEWER = 'Elena Kim';
export const SCENARIO_MODELS={atlas:'GPT-6',invoice:'GPT-6',ops:'Claude Sonnet'};
export const SCENARIO_TOKEN_USAGE={input:2500,output:1000};
export const SCENARIO_ACTIONS = {
  atlas:'Delete customer record', invoice:'Change payment details', ops:'Delete warehouse'
};
// Non-routable fixture-only credential values. The browser never issues API keys.
export function exampleCredential(agentId){
  return {baseUrl:'https://demo.invalid/inference/v1',token:`demo-not-valid-${String(agentId||'agent').replace(/[^a-z0-9-]/gi,'')}`};
}
