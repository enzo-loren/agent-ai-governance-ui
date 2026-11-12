import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url));
const html=file('index.html').toString();
const socialImage='https://enzo-loren.github.io/agent-ai-governance-ui/assets/social/overview-og.png';
const homepage='https://enzo-loren.github.io/agent-ai-governance-ui/';
const meta=(key,attribute='property')=>{
  const tags=html.match(/<meta[^>]*>/g)||[];
  return tags.find(t=>t.includes(`${attribute}="${key}"`))||'';
};

test('Home page exposes complete, crawlable Overview Open Graph metadata',()=>{
  assert.ok(html.includes(`<link rel="canonical" href="${homepage}"`));
  assert.ok(meta('og:site_name').includes('Morris &amp; Opazo'));
  assert.ok(meta('og:type').includes('website'));
  assert.ok(meta('og:url').includes(`content="${homepage}"`));
  assert.ok(meta('og:title').includes('Agent Governance'));
  assert.ok(meta('og:description').includes('Agent activity, at a glance'));
  assert.ok(meta('og:image').includes(`content="${socialImage}"`));
  assert.ok(meta('og:image:secure_url').includes(`content="${socialImage}"`));
  assert.ok(meta('og:image:type').includes('image/png'));
  assert.ok(meta('og:image:width').includes('content="1200"'));
  assert.ok(meta('og:image:height').includes('content="630"'));
  assert.ok(meta('og:image:alt').includes('Overview'));
  assert.ok(meta('twitter:card','name').includes('summary_large_image'));
  assert.ok(meta('twitter:image','name').includes(`content="${socialImage}"`));
  assert.ok(meta('twitter:title','name').includes('Agent Governance'));
  assert.ok(meta('twitter:description','name').includes('Agent activity'));
  assert.ok(meta('twitter:image:alt','name').includes('Overview'));
  assert.ok(html.includes('name="description"'));
});

test('Social preview is a 1200 by 630 static PNG packaged for GitHub Pages',()=>{
  const image=file('assets/social/overview-og.png');
  assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(image.readUInt32BE(16),1200);
  assert.equal(image.readUInt32BE(20),630);
  assert.ok(image.length>30_000,'Preview image is unexpectedly empty');
  assert.ok(image.length<600_000,'Keep social artwork reasonably lightweight');
  const build=file('scripts/build.mjs').toString();
  assert.ok(build.includes("'assets/social/overview-og.png'"));
  const renderer=file('scripts/render_social_preview.py').toString();
  assert.ok(renderer.includes('inline_document(ROOT)'),'Image must reflect the rendered application');
  assert.ok(renderer.includes("app.locator('#main .hero h1')"));
  assert.ok(renderer.includes("share.screenshot(path=str(OUT)"));
});
