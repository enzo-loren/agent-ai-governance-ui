import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanState} from '../src/domain.js';
import {renderPage} from '../src/views.js';

test('The four agent request actions use an independently responsive layout',()=>{
  const page=renderPage(cleanState(),{},'agent','atlas','overview');
  const actions=page.split('<div class="request-actions mt-4">')[1]?.split('</div>')[0];
  assert.ok(actions,'request buttons must have their own layout container');
  for(const label of ['Test model request','Test tool','Test local tool','Test approval']){
    assert.ok(actions.includes(label),'Missing request action: '+label);
  }
  const css=readFileSync(new URL('../src/styles/app.css',import.meta.url),'utf8');
  assert.ok(css.includes('.request-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))'));
  assert.ok(css.includes('.request-actions .btn{min-width:0;width:100%;white-space:normal'));
});
