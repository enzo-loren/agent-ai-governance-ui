/**
 * Entirely synthetic fixture data. No proprietary logs or production credentials.
 * Requirement terminology is preserved in docs/TRACEABILITY.md, not presented as frontend jargon.
 */
export const SEED_AGENTS = [
  { id: 'atlas', name: 'Atlas Support', initials: 'AS', team: 'Customer experience', owner: 'Maya Chen', mode: 'observe', connections: ['A','B','C'], preset: 1, budget: 40, spent: 18.4, requests: 2140, tools: 5, accent: 'sage', active: true },
  { id: 'invoice', name: 'Invoice Assistant', initials: 'IA', team: 'Finance', owner: 'Alex Rivera', mode: 'observe', connections: ['A'], preset: 1, budget: 30, spent: 24.7, requests: 880, tools: 4, accent: 'lavender', active: true },
  { id: 'ops', name: 'Operations Copilot', initials: 'OC', team: 'Operations', owner: 'Jordan Lee', mode: 'enforce', connections: ['A','B'], preset: 2, budget: 50, spent: 11.2, requests: 1240, tools: 6, accent: 'peach', active: true }
];
export const SEED_TOOLS = [
  { id: 't1', name: 'Search knowledge base', agent: 'atlas', type: 'Read', approved: true, control: 'B' },
  { id: 't2', name: 'Update customer profile', agent: 'atlas', type: 'Write', approved: true, control: 'B' },
  { id: 't3', name: 'Delete customer record', agent: 'atlas', type: 'Critical', approved: false, control: 'B' },
  { id: 't4', name: 'Issue refund', agent: 'atlas', type: 'Critical', approved: false, control: 'B' },
  { id: 't5', name: 'Get order status', agent: 'atlas', type: 'Read', approved: true, control: 'B' },
  { id: 't6', name: 'Get invoice', agent: 'invoice', type: 'Read', approved: true, control: 'A' },
  { id: 't7', name: 'Change payment details', agent: 'invoice', type: 'Critical', approved: false, control: 'A' },
  { id: 't8', name: 'Send invoice email', agent: 'invoice', type: 'Write', approved: true, control: 'A' },
  { id: 't9', name: 'Sync invoices', agent: 'invoice', type: 'Write', approved: true, control: 'A' },
  { id: 't10', name: 'Read inventory', agent: 'ops', type: 'Read', approved: true, control: 'B' },
  { id: 't11', name: 'Update inventory', agent: 'ops', type: 'Write', approved: true, control: 'B' },
  { id: 't12', name: 'Delete warehouse', agent: 'ops', type: 'Critical', approved: false, control: 'B' },
  { id: 't13', name: 'Create shipment', agent: 'ops', type: 'Write', approved: true, control: 'B' },
  { id: 't14', name: 'Archive report', agent: 'ops', type: 'Write', approved: true, control: 'B' },
  { id: 't15', name: 'Search suppliers', agent: 'ops', type: 'Read', approved: true, control: 'B' }
];
export const SEED_EVENTS = [
  { id: 'TRC-1044', at: '09:44', ago: 'Just now', agent: 'atlas', actor: 'Maya Chen', action: 'Delete customer record', kind: 'inference', model: 'GPT-6', status: 'would_block', connections: ['A','C'], cost: 0.012, rule: 'Critical actions are not allowed', version: 'v1.8', reason: 'Atlas is in Observe mode. This critical tool request is recorded, not blocked by this rule. A later execution would require connection B to be governed.', evidence: true },
  { id: 'TRC-1042', at: '09:42', ago: 'Just now', agent: 'atlas', actor: 'Maya Chen', action: 'Search knowledge base', kind: 'tool', model: 'GPT-6', status: 'allowed', connections: ['A','B','C'], cost: 0.014, rule: 'Approved read access', version: 'v1.8', reason: 'Maya can search support articles. The tool ran through the protected connection.', evidence: true },
  { id: 'TRC-1041', at: '09:40', ago: '2 min ago', agent: 'invoice', actor: 'No user identity', action: 'Change payment details', kind: 'inference', model: 'GPT-6', status: 'would_block', connections: ['A'], cost: 0.021, rule: 'Critical actions need approval', version: 'v1.8', reason: 'This request would be blocked if rules were enforced. The tool was only requested by the model, not executed through this platform.', evidence: true },
  { id: 'TRC-1040', at: '09:38', ago: '4 min ago', agent: 'ops', actor: 'No user identity', action: 'Delete warehouse', kind: 'tool', model: 'Claude Sonnet', status: 'blocked', connections: ['A','B'], cost: 0.009, rule: 'Critical actions are not approved', version: 'v1.8', reason: 'The actual tool execution was blocked before it reached the connected tool.', evidence: true },
  { id: 'TRC-1039', at: '09:35', ago: '7 min ago', agent: 'atlas', actor: 'Maya Chen', action: 'Retrieve order status', kind: 'inference', model: 'GPT-6', status: 'filtered', connections: ['A','C'], cost: 0.011, rule: 'Remove personal data', version: 'v1.7', reason: 'Personal information was hidden before the response was returned.', evidence: true },
  { id: 'TRC-1038', at: '09:32', ago: '10 min ago', agent: 'invoice', actor: 'No user identity', action: 'Send invoice email', kind: 'inference', model: 'GPT-6', status: 'outside', connections: ['A'], cost: 0.017, rule: 'No tool execution connection', version: '—', reason: 'The tool was declared to the model, but its execution happens outside the connected gateway. Actual execution was not verified or controlled.', evidence: true },
  { id: 'TRC-1037', at: '09:29', ago: '13 min ago', agent: 'atlas', actor: 'Maya Chen', action: 'Issue refund', kind: 'tool', model: 'GPT-6', status: 'pending', connections: ['A','B','C'], cost: 0.022, rule: 'Critical actions need review', version: 'v1.8', reason: 'The tool is waiting for another person to approve it. It has not executed.', evidence: true },
  { id: 'TRC-1036', at: '09:25', ago: '17 min ago', agent: 'invoice', actor: 'No user identity', action: 'Generate monthly summary', kind: 'inference', model: 'GPT-6', status: 'limited', connections: ['A'], cost: 0.018, rule: 'Daily spending alert', version: 'v1.8', reason: 'A configured rate or budget limit was reached in the demo scenario.', evidence: true },
  { id: 'TRC-1035', at: '09:21', ago: '21 min ago', agent: 'ops', actor: 'No user identity', action: 'Update inventory', kind: 'tool', model: 'Claude Sonnet', status: 'missing', connections: ['A','B'], cost: 0.010, rule: 'Evidence unavailable', version: '—', reason: 'This demonstration record has no verifiable evidence. Do not interpret it as protected.', evidence: false },
  { id: 'TRC-1034', at: '09:17', ago: '25 min ago', agent: 'atlas', actor: 'Maya Chen', action: 'Get order status', kind: 'tool', model: 'GPT-6', status: 'allowed', connections: ['A','B','C'], cost: 0.008, rule: 'Approved read access', version: 'v1.8', reason: 'The approved read-only tool executed through the controlled connection.', evidence: true }
];
export const SEED_APPROVALS = [
  { id: 'APR-201', agent: 'atlas', action: 'Issue refund · $240', requestedBy: 'Maya Chen', requestedAt: '09:29', reason: 'Refunds above $100 require a second person.', expires: '14 min', status: 'pending', trace: 'TRC-1037' },
  { id: 'APR-202', agent: 'ops', action: 'Remove archived records', requestedBy: 'Jordan Lee', requestedAt: '09:26', reason: 'Deleting records needs human approval.', expires: '9 min', status: 'pending', trace: 'TRC-1033' }
];
export const POLICY_PRESETS = [
  { id: 1, name: 'Safe start', subtitle: 'Allow everyday work. Flag risky actions.', summary: 'Read and write requests are allowed if approved. Critical and unclassified actions are denied when enforcement is on.' },
  { id: 2, name: 'Team approval', subtitle: 'Use roles and review critical actions.', summary: 'Writes require an identified user with the right role. Critical tool execution also requires connection B and human approval.' },
  { id: 3, name: 'Custom access', subtitle: 'Only allow explicitly approved actions.', summary: 'Actions are denied unless explicit rules permit them. Critical operations still require appropriate safeguards.' }
];
export const CONNECTIONS = [
  { id: 'A', name: 'Monitor AI requests', short: 'AI requests', description: 'See model calls, usage, costs and the tool requests the model makes.', adds: 'Observe and control the inference channel. Tool intent is visible, but direct execution is not.', icon: 'activity' },
  { id: 'B', name: 'Control tool execution', short: 'Tool execution', description: 'Route tools through one controlled connection before they run.', adds: 'Check real parameters, prevent execution, manage credentials and request approval.', icon: 'plug' },
  { id: 'C', name: 'Identify users', short: 'User identity', description: 'Know which person asked the agent to act.', adds: 'Use verified user roles, personalized access and spend attribution.', icon: 'users' }
];
export const ROUTES = [
  { id:'home', text:'Overview', icon:'layout-dashboard', group:'main' },
  { id:'catalog', text:'Catalog', icon:'layers', group:'main' },
  { id:'activity', text:'Activity', icon:'activity', group:'main' },
  { id:'rules', text:'Rules', icon:'shield-check', group:'main' },
  { id:'approvals', text:'Approvals', icon:'check-circle', group:'main' },
  { id:'spending', text:'Spending', icon:'chart', group:'main' },
  { id:'audit', text:'Audit', icon:'file-search', group:'main' },
  { id:'integrations', text:'Integrations', icon:'plug', group:'secondary' }
];
export const TOUR = [
  { route:'home', title:'Your starting point', note:'See your agents and what needs attention.' },
  { route:'catalog', title:'Explore your catalog', note:'Open an agent to see its coverage and controls.' },
  { route:'activity', title:'Follow a decision', note:'Select an event to see why it was allowed or blocked.' },
  { route:'rules', title:'Preview before enforcing', note:'See the impact before turning on a rule.' },
  { route:'approvals', title:'Keep people in control', note:'Review an action before it runs.' },
  { route:'audit', title:'Find the evidence', note:'Reconstruct a decision from its record.' },
  { route:'integrations', title:'Add protection as you need it', note:'Compare monitoring, tool control and user identity.' }
];
