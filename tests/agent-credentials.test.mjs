import test from 'node:test';
import assert from 'node:assert/strict';
import {mintLocalCredential,stageCredential,revokeLocalCredential,credentialRecord,agentConnectionSnippet,inferenceBaseUrl} from '../src/mock/credentials.js';

test('Local agent credentials are randomized and only hashes are kept in persistent records', async()=>{
 const a=await mintLocalCredential(),b=await mintLocalCredential();
 assert.match(a.token,/^gov_test_[a-f\d]{48}$/);
 assert.notEqual(a.token,b.token);
 assert.match(a.record.sha256,/^[a-f\d]{64}$/);
 assert.ok(!JSON.stringify(a.record).includes(a.token));
 const state={"new-agent":{version:1,revoked:0,issuedTotal:0,active:[]}};stageCredential(state,'new-agent',a.record);stageCredential(state,'new-agent',b.record);
 assert.equal(credentialRecord(state,'new-agent').active.filter(x=>!x.revokedAt).length,2);
 assert.equal(credentialRecord(state,'new-agent').version,2);
 assert.ok(!JSON.stringify(state).includes(a.token));
 assert.ok(!JSON.stringify(state).includes(b.token));
 assert.ok(revokeLocalCredential(state,'new-agent',a.record.id));
 assert.equal(credentialRecord(state,'new-agent').active.filter(x=>!x.revokedAt).length,1);
 assert.ok(!revokeLocalCredential(state,'new-agent',a.record.id));
});
test('Connection snippet uses inference path; never exposes provider API keys',()=>{
 assert.equal(inferenceBaseUrl(),'https://gateway.example.invalid/inference/v1');
 assert.equal(agentConnectionSnippet('secret').split('\n')[1],'API_KEY=secret');
});
