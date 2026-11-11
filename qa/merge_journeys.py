#!/usr/bin/env python3
"""Merge separately executed Chromium batches; reject dropped or duplicated cases."""
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
expected=json.loads((ROOT/'qa/journeys.json').read_text())['journeys']
results=[]
for p in sys.argv[1:]:results.extend(json.loads(Path(p).read_text()))
assert [x['id'] for x in results]==[x['id'] for x in expected], 'Missing, duplicate or out-of-order browser journey'
output={
 'method':'Actual browser DOM interactions from #/home, one step per click, field fill, or select change. No typing-character, scrolling, or menu opening double counts.',
 'source':'UI source files on current branch; browser inlined only to remove network dependence.',
 'summary':{
   'cases':len(results),
   'observedWorking':sum(x['result']=='as_expected' and x['status']=='ui-working' for x in results),
   'partialPreview':sum(x['result']=='as_expected' and x['status']=='partial' for x in results),
   'unreachable':sum(x['result']=='as_expected' and x['status']=='gap' for x in results),
   'unexpectedFailures':sum(x['result']=='failed' for x in results)
 },
 'results':results
}
(ROOT/'qa/journey-results.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print('AUDIT '+json.dumps(output['summary']))
for r in results:
 if r['result']=='failed':print('FAIL '+r['id']+': '+str(r.get('error')))
sys.exit(int(output['summary']['unexpectedFailures']!=0))
