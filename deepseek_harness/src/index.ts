import {TypertRemoteService,Remote} from '@deepseek-ai/dsh-typert-protocol';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {MomoCore} from './core.js';
import {protocol} from './domain.js';
import {momoTransport} from './transport.js';
import {foldUsage} from './usage.js';
import {MomoAdapter} from './adapter.js';
export const name='momoai';
export const inject=['credentials','llm','agentDefaultModel','agents','sessions','sessionProjections'];
class MomoService extends TypertRemoteService {
 constructor(ctx:any,readonly core:MomoCore){super(ctx,'momoai',{namespace:'momoai'});}
 @Remote('execute')
 async execute(command:string){
   const principal=this.ctx.invocation?.peer?.principal;
   if(principal&&principal.kind!=='owner')throw Error('仅账户所有者可操作');
   const c=JSON.parse(command);if(!c||typeof c!=='object')throw Error('无效操作');
   const result=await this.core.execute(c);
   if(c.type==='select'&&c.sessionId){this.core.state.sessionPreferences??={};this.core.state.sessionPreferences[c.sessionId]=c.preferred||this.core.state.sessionPreferences[c.sessionId]||this.core.state.preferred;await this.core.persist();}
   if(c.type==='register'||c.type==='select'){
     const selection={provider:'momoai',model:`momo_${this.core.state.model}`};
     const previous=this.ctx.agentDefaultModel.currentSelection();if(previous.provider!=='momoai'){this.core.state.previousDefault=previous;await this.core.persist();}
     await this.ctx.agentDefaultModel.saveSelection(selection);
     if(c.sessionId){const agent=this.ctx.agents.get(c.sessionId);if(agent){await this.ctx.llm.resolveCallConfig(selection);agent.model.select(selection);}}
   }
   if(c.type!=='credentials'&&c.sessionId){result.sessionId=c.sessionId;const session=this.ctx.sessions.get(c.sessionId);if(session)result.sessionProjection=this.ctx.sessionProjections.snapshot(session,['tokenUsage']).values.tokenUsage;const current=this.ctx.agents.get(c.sessionId)?.model.current();if(current?.provider==='momoai'){const id=Number(/^momo_(\d+)$/.exec(current.model)?.[1]);const model=this.core.models.find(m=>m.id===id);if(model){result.model=id;result.preferred=this.core.state.sessionPreferences?.[c.sessionId]||this.core.state.preferred;result.compat=protocol(model,result.preferred);}}}
   return JSON.stringify(result);
 }
}
export async function apply(ctx:any){
 const root=join(process.env.DSH_HOME||join(homedir(),'.dsh'),'momoai-plugin');await mkdir(root,{recursive:true,mode:0o700});const file=join(root,'state.json');
 const load=async()=>{try{return JSON.parse(await readFile(file,'utf8'));}catch(e:any){if(e.code==='ENOENT')return {};throw Error('MomoAI 状态文件无法读取');}};
 let queue=Promise.resolve();
 const save=(state:any)=>{const payload=JSON.stringify(state);const task=queue.then(async()=>{await writeFile(file+'.tmp',payload,{mode:0o600});await rename(file+'.tmp',file);});queue=task.catch(()=>{});return task;};
 const transport=momoTransport();ctx.effect(()=>()=>transport.close());
 const core=new MomoCore(ctx.credentials,load,save,transport.fetch);await core.init();new MomoService(ctx,core);
 ctx.llm.registerAdapter(['momoai'],new MomoAdapter(core,transport.fetch));
 void core.catalog().catch(()=>{});if(core.account?.key)void core.refreshBalance().catch(()=>{});
 // Config editing reconciles the loader: never await it inside plugin initialization.
 ctx.effect(()=>{const timer=setTimeout(()=>{void (async()=>{if(core.account?.key&&!core.state.defaultInstalled){const previous=ctx.agentDefaultModel.currentSelection();if(previous.provider!=='momoai')core.state.previousDefault=previous;core.state.defaultInstalled=true;await core.persist();await ctx.agentDefaultModel.saveSelection({provider:'momoai',model:`momo_${core.state.model}`});}})().catch(()=>ctx.logger.warn('MomoAI default model setup failed'));},0);return()=>clearTimeout(timer);});

 const sync=(session:any)=>{
   if(!core.account?.key)return;
   core.state.sessionPreferences??={};core.state.sessionPreferences[session.id]??=core.state.preferred;
   core.state.sessionAccounts??={};
   const account=core.state.sessionAccounts[session.id]||core.account.username;
   const rows=foldUsage(session,account);
   core.state.sessionAccounts[session.id]=account;Object.assign(core.state.usage,rows);
   void core.persist().catch(()=>ctx.logger.warn('MomoAI usage persistence failed'));
 };
 for(const session of ctx.sessions.list())sync(session);
 ctx.on('session/created',sync);
 ctx.on('session/event',(session:any,event:any)=>{if(['assistant/message','assistant/attempt'].includes(event.type))sync(session);});
 // Do not reconcile another plugin while this fiber is disposing.
 ctx.effect(()=>()=>{if(core.state.previousDefault&&ctx.agentDefaultModel.currentSelection().provider==='momoai'){const defaults=ctx.agentDefaultModel;const previous=core.state.previousDefault;setTimeout(()=>{void defaults.saveSelection(previous).catch(()=>{});},0);core.state.defaultInstalled=false;void core.persist();}});
}
