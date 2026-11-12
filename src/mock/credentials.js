/** Local credential lifecycle model. Raw values are held only by the caller's current UI state.
 * This module DOES NOT authorize calls to the deployed inference or MCP gateways. */
export const LOCAL_GATEWAY_URL='https://gateway.example.invalid';
export const inferenceBaseUrl=()=>`${LOCAL_GATEWAY_URL}/inference/v1`;
export const mcpBaseUrl=()=>`${LOCAL_GATEWAY_URL}/mcp`;
export const agentConnectionSnippet=(token='<agent-token>')=>`BASE_URL=${inferenceBaseUrl()}\nAPI_KEY=${token}`;

export async function mintLocalCredential(){
 const crypto=globalThis.crypto;
 if(!crypto?.getRandomValues||!crypto?.subtle?.digest)throw new Error('Secure random generation is unavailable');
 const random=new Uint8Array(24);crypto.getRandomValues(random);
 const hex=Array.from(random,b=>b.toString(16).padStart(2,'0')).join('');
 const token=`gov_test_${hex}`;
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const sha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return {token,record:{id:`key_${hex.slice(0,8)}`,sha256,createdAt:new Date().toISOString(),revokedAt:null}};
}
/** Match a presented token against active hash records for Request Studio. */
export async function matchesActiveCredential(credentials,token){
 if(typeof token!=='string'||!/^gov_test_[a-f0-9]{48}$/.test(token)||!globalThis.crypto?.subtle)return false;
 const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return Array.isArray(credentials?.active)&&credentials.active.some(c=>c.sha256===hash&&!c.revokedAt);
}
export function credentialRecord(credentials,agentId){
 const c=credentials?.[agentId];
 if(!c)return {version:1,revoked:0,issuedTotal:1,active:[{id:`imported_${agentId}`,sha256:null,createdAt:'Unknown',revokedAt:null,imported:true}]};
 return {
  version:Math.max(1,Number(c?.version)||1),revoked:Number(c?.revoked)||0,
  active:Array.isArray(c?.active)?c.active:[],
  issuedTotal:Number(c?.issuedTotal)||0
 };
}
export function stageCredential(credentials,agentId,record){
 const old=credentialRecord(credentials,agentId);
 credentials[agentId]={...old,version:old.issuedTotal?old.version+1:1,issuedTotal:old.issuedTotal+1,active:[...old.active,record]};
 return credentials[agentId];
}
export function revokeLocalCredential(credentials,agentId,credentialId){
 const old=credentialRecord(credentials,agentId);
 const found=old.active.find(c=>c.id===credentialId&&!c.revokedAt);
 if(!found)return false;
 credentials[agentId]={...old,revoked:old.revoked+1,active:old.active.map(c=>c.id===credentialId?{...c,revokedAt:new Date().toISOString()}:c)};
 return true;
}
