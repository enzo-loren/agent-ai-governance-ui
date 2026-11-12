/**
 * API-shaped in-browser data adapter for the hosted static demonstration.
 * The mock owns fixture loading, storage, revisions and snapshots.
 * It is deliberately NOT a network server or an authorization boundary.
 */
import {cleanState,safeReadState} from '../domain.js';
import {SEED_EVENTS} from './fixtures.js';

export const MOCK_STORAGE_KEY='agent-governance-mock-v3';
export const LEGACY_STORAGE_KEY='agent-governance-preview-v2';
export const MOCK_SCHEMA_VERSION=3;

export class BackendConflictError extends Error {
 constructor(){super('Workspace data changed in another tab');this.name='BackendConflictError';}
}
export class MemoryStorage {
 constructor(){this.values=new Map();}
 getItem(key){return this.values.has(key)?this.values.get(key):null;}
 setItem(key,value){this.values.set(key,String(value));}
 removeItem(key){this.values.delete(key);}
}
function defaultStorage(){
 try{const s=globalThis.localStorage;const probe='__gov_storage_probe__';s.setItem(probe,'1');s.removeItem(probe);return s;}
 catch{return new MemoryStorage();}
}
const copy=value=>structuredClone(value);
function assertWorkspace(state){
 if(!state||!Array.isArray(state.agents)||!Array.isArray(state.tools)||!Array.isArray(state.events)||!Array.isArray(state.approvals))throw new TypeError('Invalid workspace snapshot');
 if(!['operator','approver','auditor'].includes(state.role))throw new TypeError('Invalid role');
 const ids=new Set();for(const a of state.agents){if(!a.id||ids.has(a.id))throw new TypeError('Duplicate agent ID');ids.add(a.id);}
 for(const t of state.tools){if(!ids.has(t.agent))throw new TypeError(`Unknown agent for tool ${t.id}`);}
}
export function createMockBackend(storage=defaultStorage()) {
 const readRaw=()=>{
   try{const raw=storage.getItem(MOCK_STORAGE_KEY);if(raw){const record=JSON.parse(raw);if(record.schemaVersion===MOCK_SCHEMA_VERSION&&Number.isSafeInteger(record.revision)&&record.revision>=0)return record;}}
   catch{ /* Invalid or older mock data is ignored. */ }
   return null;
 };
 const read=()=>{
   const found=readRaw();
   if(found)return {state:copy(safeReadState(JSON.stringify(found.workspace))),revision:found.revision};
   let legacy=null;try{legacy=storage.getItem(LEGACY_STORAGE_KEY);}catch{}
   const state=copy(safeReadState(legacy));
   if(legacy){
     // Repair only known fixture references from v2; leave user-authored rows intact.
     const eventIds=new Set(state.events.map(ev=>ev.id));
     for(const item of state.approvals){
       if(item.id==='APR-202'&&!eventIds.has(item.trace)){
         const fixture=SEED_EVENTS.find(ev=>ev.id===item.trace);
         if(fixture){state.events.push(copy(fixture));eventIds.add(fixture.id);}
       }
     }
     const old=state.events.find(ev=>ev.id==='TRC-1044');
     if(old?.reason?.startsWith('Atlas is in Observe mode.')){
       const updated=SEED_EVENTS.find(ev=>ev.id==='TRC-1044');
       old.reason=updated.reason;old.modeAtEvent='observe';
     }
   }
   return {state,revision:0};
 };
 return Object.freeze({
  read,
  save(workspace,expectedRevision){
   const current=read();
   if(expectedRevision!==current.revision)throw new BackendConflictError();
   assertWorkspace(workspace);
   const state=copy(workspace),revision=current.revision+1;
   storage.setItem(MOCK_STORAGE_KEY,JSON.stringify({schemaVersion:MOCK_SCHEMA_VERSION,revision,workspace:state}));
   return {state:copy(state),revision};
  },
  reset(expectedRevision){return this.save(cleanState(),expectedRevision);},
  mode:'mock'
 });
}
