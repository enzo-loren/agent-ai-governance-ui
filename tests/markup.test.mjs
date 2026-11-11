import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanState} from '../src/domain.js';
import {renderAppShell,renderPage} from '../src/views.js';
const state=cleanState();
const ui={activityAgent:'all',activityStatus:'all',catalogTab:'agents',rulesAgent:'atlas',integrationAgent:'atlas'};
const html=route=>renderAppShell(state,ui,route,renderPage(state,ui,route));
test('Every primary destination renders an explicit page heading and main landmark',()=>{
 for(const page of ['home','catalog','activity','rules','approvals','spending','audit','integrations']){
  assert.match(html(page),/<main [^>]*id="main"/);
  assert.match(html(page),/<h1>/);
 }
});
test('The product is always visibly marked as a demo',()=>{
 for(const page of ['home','catalog','activity','rules','approvals','spending','audit','integrations']){
  assert.match(html(page),/Interactive demo/);
  assert.match(html(page),/Sample data only/);
 }
});
test('Auditor never receives write or approval actions in markup',()=>{
 const audit=structuredClone(state);audit.role='auditor';
 const catalog=renderPage(audit,ui,'catalog');
 assert.doesNotMatch(catalog,/data-action="add-agent"/);
 assert.doesNotMatch(renderPage(audit,ui,'rules'),/data-action="choose-preset"[^>]*aria-pressed[^>]*\bdisabled/); // separately ensure all rule buttons are disabled
 const buttons=renderPage(audit,ui,'rules').match(/data-action="choose-preset"[^>]*>/g)||[];
 assert.equal(buttons.length,3);
 buttons.forEach(b=>assert.match(b,/\bdisabled\b/));
 assert.match(renderPage(audit,ui,'approvals'),/data-action="approval-confirm"[^>]*disabled/);
});
test('A-only demo shows missing B/C and distinguishes tool execution from model request',()=>{
 const text=renderPage(state,ui,'integrations');
 assert.match(text,/Control tool execution/);assert.match(text,/Identify users/);
 assert.match(text,/Local tools outside B are not covered/);
});
test('No shadow-mode jargon leaks into first-level product copy',()=>{
 const screens=['home','catalog','activity','rules','approvals','spending','audit','integrations'];
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
