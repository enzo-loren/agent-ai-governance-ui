/** Deep-link contract for cross-screen investigation. */
export function parseRoute(hash){
 const value=String(hash||'').replace(/^#\/?/,'')||'home';
 const index=value.indexOf('?');
 const path=index<0?value:value.slice(0,index);
 const params=new URLSearchParams(index<0?'':value.slice(index+1));
 const [name,rawId,section]=path.split('/');
 let id='';try{id=rawId?decodeURIComponent(rawId):'';}catch{id=rawId||'';}
 return {name:name||'home',id,section:section||'overview',params};
}
export function activityFromSpending({agentId='',person='',model=''}={}){
 const params=new URLSearchParams({channel:'inference'});
 if(person)params.set('person',person);
 if(model)params.set('model',model);
 return `activity${agentId?`/${encodeURIComponent(agentId)}`:''}?${params}`;
}
export function auditFromSpending({agentId='',traceId}={}){
 const params=new URLSearchParams();if(traceId)params.set('trace',traceId);
 return `audit${agentId?`/${encodeURIComponent(agentId)}`:''}${params.size?`?${params}`:''}`;
}
