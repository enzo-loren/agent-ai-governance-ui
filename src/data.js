/** Navigation and policy copy. Operational example records live under mock/fixtures.js. */
export {SEED_AGENTS,SEED_TOOLS,SEED_EVENTS,SEED_APPROVALS} from './mock/fixtures.js';
export const POLICY_PRESETS = [
  { id: 1, name: 'Safe start', subtitle: 'Allow approved read and write actions.', summary: 'Read and write requests are allowed if approved. Critical and unclassified actions are denied when enforcement is on.' },
  { id: 2, name: 'Role-based', subtitle: 'Require user roles and critical-action review.', summary: 'Writes require an identified user with the right role. Critical tool execution also requires tool execution control and human approval.' },
  { id: 3, name: 'Strict', subtitle: 'Deny unless a rule explicitly permits the action.', summary: 'Actions are denied unless explicit rules permit them. Critical operations still require appropriate safeguards.' }
];
export const CONNECTIONS = [
  { id: 'A', name: 'Model requests', short: 'Model', description: 'Model calls, responses, requested tools and usage.', adds: 'Observe and control the inference channel. Tool intent is visible, but direct execution is not.', icon: 'activity' },
  { id: 'B', name: 'Tool execution', short: 'Tools', description: 'Check tool calls routed through the gateway before they run.', adds: 'Check real parameters, prevent execution, manage credentials and request approval.', icon: 'plug' },
  { id: 'C', name: 'User identity', short: 'Identity', description: 'Identify the person behind a request when a verified token is present.', adds: 'Use verified user roles, personalized access and spend attribution.', icon: 'users' }
];
export const ROUTES = [
  { id:'home', text:'Overview', icon:'layout-dashboard', group:'main' },
  { id:'catalog', text:'Catalog', icon:'layers', group:'main' },
  { id:'activity', text:'Activity', icon:'activity', group:'main' },
  { id:'rules', text:'Rules', icon:'shield-check', group:'main' },
  { id:'approvals', text:'Approvals', icon:'check-circle', group:'main' },
  { id:'spending', text:'Spending', icon:'chart', group:'main' },
  { id:'audit', text:'Audit', icon:'file-search', group:'main' },
  { id:'connections', text:'Connections', icon:'plug', group:'secondary' }
];
export const TOUR = [
  { route:'home', title:'Overview', note:'See your agents and what needs attention.' },
  { route:'catalog', title:'Catalog', note:'See which tools run through the gateway and whose requests have identity.' },
  { route:'activity', title:'Follow a decision', note:'Select an event to see why it was allowed or blocked.' },
  { route:'rules', title:'Preview before enforcing', note:'See the impact before turning on a rule.' },
  { route:'approvals', title:'Approvals', note:'Review an action before it runs.' },
  { route:'audit', title:'Find the evidence', note:'Reconstruct a decision from its record.' },
  { route:'connections', title:'Connections', note:'Compare monitoring, tool control and user identity.' }
];
