import {LlmAdapter,LlmError} from '@deepseek-ai/dsh-llm';
import {PiAiAdapter} from '@deepseek-ai/dsh-llm-pi-ai';
import {openAICompletionsApi} from '@earendil-works/pi-ai/api/openai-completions.lazy';
import {anthropicMessagesApi} from '@earendil-works/pi-ai/api/anthropic-messages.lazy';
import {protocol} from './domain.js';
import type {MomoCore} from './core.js';
export class MomoAdapter extends LlmAdapter {
 constructor(private core:MomoCore,private transport?:typeof fetch){super();}
 providerInfo(){return {id:'momoai',name:'MomoAI'};}
 providerRetryPolicy(){return {mode:'normal',maxRetries:0};}
 async listModels(){if(!this.core.account?.key)return [];return this.core.models.map(m=>({provider:'momoai',id:`momo_${m.id}`,name:m.name,inputModalities:['text']}));}
 private delegate(model:string,preferred=this.core.state.preferred){
   const id=Number(/^momo_(\d+)$/.exec(model)?.[1]);const m=this.core.selected(id);
   const key=this.core.account?.key;if(!key)throw new LlmError('请先注册 MomoAI','MISSING_CREDENTIAL');
   const api=protocol(m,preferred).effective;
   const baseUrl=api==='anthropic-messages'?'https://momoai.pro':'https://momoai.pro/v1';
   const desc={id:model,name:m.name,api,provider:'momoai',baseUrl,reasoning:false,input:['text'],contextWindow:32768,maxTokens:4096,cost:{input:0,output:0,cacheRead:0,cacheWrite:0}};
   const wire=api==='anthropic-messages'?anthropicMessagesApi():openAICompletionsApi();
   const piProvider={id:'momoai',name:'MomoAI',baseUrl,auth:{apiKey:{name:'MomoAI',resolve:async()=>({auth:{apiKey:key},source:'MomoAI'})}},getModels:()=>[desc],stream:(m:any,c:any,o:any)=>wire.stream(m,c,{...o,maxRetries:0,...this.transport?{fetch:this.transport}:{}}),streamSimple:(m:any,c:any,o:any)=>wire.streamSimple(m,c,{...o,maxRetries:0,...this.transport?{fetch:this.transport}:{}})};
   const profile={provider:'momoai',displayName:'MomoAI',api,baseURL:baseUrl,piProvider,configuredMaxTokens:new Map([[model,4096]]),modelErrors:new Map(),streamIdleTimeoutMs:120000,maxRequestImageBytes:1,maxRequestImages:1,imageOffloadCountQuantum:1,requestImagePixelBudget:1,requestImageMaxBytes:1,retryPolicy:this.providerRetryPolicy()};
   const profiles=new Map([['momoai',profile]]);
   return new PiAiAdapter({profiles:()=>profiles,resolveApiKey:async()=>key});
 }
 async resolveModel(provider:string,model:string,signal?:AbortSignal){return this.delegate(model).resolveModel(provider,model,signal);}
 async prepareCall(provider:string,model:string,signal?:AbortSignal){
   if(Date.now()-this.core.catalogAt>300000)await this.core.catalog();
   const preferred=this.core.state.preferred,preferences={...this.core.state.sessionPreferences};
   const prepared=await this.delegate(model,preferred).prepareCall(provider,model,signal);
   const alternates=new Map();for(const p of new Set(Object.values(preferences)))alternates.set(p,await this.delegate(model,p).prepareCall(provider,model,signal));
   return {...prepared,stream:(options:any)=>this.streamSnapshot(alternates.get(preferences[options.sessionId])||prepared,options)};
 }

 async *streamSnapshot(prepared:any,options:any){
   options.signal?.throwIfAborted();
   // Foreign protocol replay is intentionally not sent back to a different wire API.
   const messages=options.messages.map((m:any)=>{if(!m.source)return m;const {replayState,...source}=m.source;return {...m,source};});
   try {for await(const chunk of prepared.stream({...options,messages})){options.signal?.throwIfAborted();yield chunk;}options.signal?.throwIfAborted();}finally{void this.core.refreshBalance().catch(()=>{});}
 }
 async *stream(options:any){const prepared=await this.prepareCall(options.provider,options.model,options.signal);yield* prepared.stream(options);}
}
