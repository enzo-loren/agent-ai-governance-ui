import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanState} from '../src/domain.js';
import {renderAppShell,renderPage} from '../src/views.js';
const state=cleanState();
const ui={activityAgent:'all',activityStatus:'all',catalogTab:'agents',rulesAgent:'atlas',connectionSearch:''};
const html=route=>renderAppShell(state,ui,route,renderPage(state,ui,route));
test('Every primary destination renders an explicit page heading and main landmark',()=>{
 for(const page of ['home','catalog','activity','rules','approvals','spending','audit','connections']){
  assert.match(html(page),/<main [^>]*id="main"/);
  assert.match(html(page),/<h1>/);
 }
});
test('One quiet Demo label replaces repeated demo disclaimers and marketing copy',()=>{
 for(const page of ['home','catalog','activity','rules','approvals','spending','audit','connections']){
  const output=html(page);
  assert.match(output,/>Demo<\/span>/);
  assert.doesNotMatch(output,/Interactive demo|Sample data only|Every agent\.<br>One clear view|Nothing here connects to your systems/);
 }
});
test('Auditor can preview policies but does not receive commit or approval actions',()=>{
 const audit=structuredClone(state);audit.role='auditor';
 const catalog=renderPage(audit,ui,'catalog');
 assert.doesNotMatch(catalog,/data-action="add-agent"/);
 assert.doesNotMatch(renderPage(audit,ui,'rules'),/id="rules-agent"/);
 const buttons=renderPage(audit,ui,'agent','atlas','rules').match(/data-action="choose-preset"[^>]*>/g)||[];
 assert.equal(buttons.length,3);
 buttons.forEach(b=>assert.doesNotMatch(b,/\bdisabled\b/));
 assert.doesNotMatch(renderPage(audit,ui,'agent','atlas','rules'),/data-action="review-policy-change"/);
 assert.match(renderPage(audit,ui,'approvals'),/data-action="approval-confirm"[^>]*disabled/);
});
test('Connections directory uses agent cards, not a separate native select',()=>{
 const list=renderPage(state,ui,'connections');
 assert.match(list,/Manage connections/);
 assert.match(list,/connection-search/);
 assert.doesNotMatch(list,/id="integration-agent"/);
 const detail=renderPage(state,ui,'agent','atlas','connections');
 assert.match(detail,/Tool execution/);assert.match(detail,/User identity/);
 assert.match(detail,/Only routed tools are checked before execution/);
});
test('No shadow-mode jargon leaks into first-level product copy',()=>{
 const screens=['home','catalog','activity','rules','approvals','spending','audit','connections'];
 for(const page of screens){const source=renderPage(state,ui,page);assert.doesNotMatch(source,/en sombra|shadow mode/i);}
});
test('Semantic tokens control palette and dark appearance',()=>{
 const tokens=readFileSync(new URL('../src/styles/tokens.css',import.meta.url),'utf8');
 for(const term of ["data-theme='forest'","data-theme='violet'","data-theme='ocean'","data-appearance='light'","data-appearance='dark'","--accent","--surface","--text","--focus"]){assert.ok(tokens.includes(term),term);}
});
test('Static build does not require external network packages',()=>{
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(pkg.dependencies,undefined);assert.equal(pkg.devDependencies,undefined);
});
