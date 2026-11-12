import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url));

test('Morris & Opazo logos are exact original files, not modified substitutes',()=>{
  for(const [path,sha,width,height] of [
    ['assets/branding/morris-mark.png','ca79f15ffa300a8884e876b86e4e767bde0b874b',269,269],
    ['assets/branding/morris-wordmark.png','e3d96b14b0a1a4ad1fe1bae881da15861dac65c3',531,77]
  ]){
    const bytes=file(path);
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',path);
    assert.equal(bytes.readUInt32BE(16),width,path);
    assert.equal(bytes.readUInt32BE(20),height,path);
    const gitSHA=createHash('sha1').update(Buffer.from('blob '+bytes.length+String.fromCharCode(0))).update(bytes).digest('hex');
    assert.equal(gitSHA,sha,path);
  }
});

test('Morris branding is accessible in the workspace, test studio and favicon',()=>{
  const views=file('src/views.js').toString();
  const studio=file('src/test-console.js').toString();
  const css=file('src/styles/app.css').toString();
  const tokens=file('src/styles/tokens.css').toString();
  assert.ok(views.includes('class="brand-wordmark" src="./assets/branding/morris-wordmark.png" alt="Morris & Opazo"'));
  assert.ok(views.includes('brand-product-name">Agent Governance'));
  assert.ok(studio.includes('class="studio-wordmark" src="./assets/branding/morris-wordmark.png" alt="Morris & Opazo"'));
  assert.ok(views.includes('class="mobile-brand"'));
  assert.ok(!views.includes('class="brand-logo-plate"'));
  assert.ok(!studio.includes('class="studio-mark"'));
  assert.ok(css.includes('.brand-wordmark{'));
  assert.ok(css.includes('filter:var(--brand-wordmark-filter)'));
  assert.ok(!css.includes('.brand-logo-plate{'));
  assert.ok(tokens.includes('--brand-wordmark-filter: brightness(0)'));
  assert.ok(tokens.includes('--brand-wordmark-filter: none'));
  assert.ok(!tokens.includes('--brand-logo-surface'));

  for(const html of ['index.html','test-console.html']){
    assert.ok(file(html).toString().includes('<link rel="icon" href="./assets/branding/morris-mark.png" type="image/png" />'));
  }
});
