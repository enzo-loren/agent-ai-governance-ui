import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanState} from '../src/domain.js';
import {renderPage} from '../src/views.js';

test('Agent overview retains operational navigation instead of an embedded request simulator',()=>{
  const page=renderPage(cleanState(),{},'agent','atlas','overview');
  assert.doesNotMatch(page,/Try a request|Test model request|Test tool|Test local tool|Test approval|data-action="simulate"/);
  for(const url of ['#/spending/atlas','#/approvals/atlas','#/audit/atlas','#/agent/atlas/connections','#/agent/atlas/rules']){
    assert.ok(page.includes(url),`Missing operational destination: ${url}`);
  }
  assert.match(page,/class="detail-grid"/);
});
test('Dedicated Request Studio owns synthetic request controls and responsive layout',()=>{
  const lab=readFileSync(new URL('../test-console.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/styles/test-console.css',import.meta.url),'utf8');
  assert.match(lab,/id="test-studio"/);
  assert.ok(lab.includes('src/test-console.js'));
  assert.ok(css.includes('.studio-grid{display:grid'));
  assert.ok(css.includes('@media(max-width:820px)'));
});
