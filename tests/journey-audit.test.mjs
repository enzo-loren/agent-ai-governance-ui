import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const spec=read('../qa/journeys.json');
const report=read('../qa/journey-results.json');
const validStatuses=new Set(['ui-working','partial','gap']);
const requirements=new Set([
  'REG-02','REG-01','REG-03','INF-02','INF-03','CON-01','CON-02','CON-03','CON-04','CON-05','CON-06','CON-07','CON-08',
  'IDN-01','MCP-01','OPS-01','POL-01','POL-04','POL-05','HITL-01','HITL-02','HITL-03','FIN-01','FIN-02','FIN-03',
  'EVD-01','EVD-02','EVD-03','EVD-04','EVD-05','EVD-06','NFR-03',
]);

test('Journey inventory has unique IDs and cites recognized source requirements',()=>{
  assert.ok(spec.journeys.length>=80,'Do not silently shrink the audited flow inventory');
  assert.equal(new Set(spec.journeys.map(x=>x.id)).size,spec.journeys.length);
  for(const j of spec.journeys){
    assert.ok(validStatuses.has(j.status),`${j.id} has unknown status`);
    assert.ok(j.goal&&j.area&&j.requirements.length,`${j.id} lacks rationale`);
    assert.ok(j.requirements.every(x=>requirements.has(x)),`${j.id} cites an unknown requirement`);
    assert.ok(j.actions.length>=1&&j.checks.length>=1,`${j.id} has no actual navigation or oracle`);
    for(const a of j.actions){
      assert.ok(['click','fill','select','press'].includes(a.do),`${j.id} uses unsupported step`);
      assert.ok(a.selector,`${j.id} action has no browser target`);
    }
  }
});

test('Every executed journey preserves its measured number of actions from Home',()=>{
  assert.equal(report.results.length,spec.journeys.length);
  const found=new Map(report.results.map(x=>[x.id,x]));
  for(const j of spec.journeys){
    const r=found.get(j.id);
    assert.ok(r,`No browser execution for ${j.id}`);
    assert.equal(r.result,'as_expected',`${j.id} failed or was not executed`);
    assert.equal(r.actionsFromHome,j.actions.length,`${j.id} step metric not reproducible`);
    assert.equal(r.status,j.status,`${j.id} status has drifted`);
    assert.equal(r.stepsToCompletion,j.status==='ui-working'?j.actions.length:null,`${j.id} incorrectly claims completion`);
    assert.equal(r.stepsToBlocker,j.status!=='ui-working'?j.actions.length:null,`${j.id} incorrectly claims an unreachable path succeeded`);
  }
});

test('External dependencies remain explicitly partial and verified browser paths are distinct',()=>{
  const rows=spec.journeys.filter(j=>j.status!=='ui-working');
  assert.ok(rows.length>=15,'External requirements must not be relabeled as tested backend behavior');
  for(const j of rows){
    assert.ok(j.limitation||j.checks.some(c=>c.type==='absent'),`${j.id} must explain what is still not verified`);
    assert.ok(j.status==='gap'||j.status==='partial');
  }
  const total=report.summary;
  assert.equal(total.cases,spec.journeys.length);
  assert.equal(total.unexpectedFailures,0);
  assert.equal(total.observedWorking,spec.journeys.filter(j=>j.status==='ui-working').length);
  assert.equal(total.partialPreview,rows.filter(j=>j.status==='partial').length);
  assert.equal(total.unreachable,rows.filter(j=>j.status==='gap').length);
});

test('Budget form ID is read from the attribute, not shadowed by the name=id input',()=>{
  const markup=readFileSync(new URL('../src/views.js',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(markup,/<form id="budget-form"><input type="hidden" name="id"/);
  assert.match(app,/event\.target\.getAttribute\('id'\)==='budget-form'/);
  assert.match(app,/event\.preventDefault\(\)/);
});
