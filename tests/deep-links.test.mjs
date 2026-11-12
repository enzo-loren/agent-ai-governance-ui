import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRoute,activityFromSpending,auditFromSpending} from '../src/router.js';

test('user and model filter survives a copied Spending link',()=>{
 const route=activityFromSpending({agentId:'atlas',person:'Maya Chen',model:'GPT-6'});
 const parsed=parseRoute('#/'+route);
 assert.equal(parsed.name,'activity');assert.equal(parsed.id,'atlas');
 assert.equal(parsed.params.get('person'),'Maya Chen');
 assert.equal(parsed.params.get('model'),'GPT-6');
 assert.equal(parsed.params.get('channel'),'inference');
});
test('audit trace link is scoped and stable when page reloads',()=>{
 const route=auditFromSpending({agentId:'atlas',traceId:'TRC-1044'});
 const parsed=parseRoute('#/'+route);
 assert.equal(parsed.name,'audit');assert.equal(parsed.id,'atlas');
 assert.equal(parsed.params.get('trace'),'TRC-1044');
});
test('legacy routing remains valid without filters and malformed ids cannot crash',()=>{
 assert.equal(parseRoute('#/agent/atlas/rules').section,'rules');
 assert.equal(parseRoute('#/spending').id,'');
 assert.equal(parseRoute('#/agent/%ZZ').id,'%ZZ');
});
