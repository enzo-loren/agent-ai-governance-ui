import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanState} from '../src/domain.js';
import {renderPage} from '../src/views.js';

test('The four agent request actions use an independently responsive layout',()=>{
  const page=renderPage(cleanState(),{},'agent','atlas','overview');
  const actions=page.match(/<div class="request-actions mt-4">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(actions,'request buttons must have their own layout container');
  for(const label of ['Test model request','Test tool','Test local tool','Test approval']){
    assert.ok(actions.includes(label),`missing request action: ${label}`);
  }
  const css=readFileSync(new URL('../src/styles/app.css',import.meta.url),'utf8');
  assert.match(css,/.request-actionss*{[^}]*grid-template-columns:repeat(2,minmax(0,1fr))/);
  assert.match(css,/.request-actions .btns*{[^}]*min-width:0[^}]*white-space:normal/);
});
