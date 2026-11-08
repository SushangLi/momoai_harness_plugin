import {lastAssistantStreamChunk} from '@deepseek-ai/dsh-llm';
/** Fold durable attempts, replacing the same turn/step until a retry boundary. */
export function foldUsage(session:any, account:string) {
 const rows:Record<string,any>={};let route:any;const attempts=new Map<string,number>();
 for(const e of session.log){
  if(e.type==='request/context'){route=e.data;continue;}
  if(e.seq<(session.inheritedEventCount||0))continue;
  const slot=`${session.id}:${e.data?.turn}:${e.data?.step}`;
  if(e.type==='llm/retry-started'){attempts.set(slot,(attempts.get(slot)||0)+1);continue;}
  if(!['assistant/message','assistant/attempt'].includes(e.type))continue;
  const source=e.data.message?.source||route;if(source?.provider!=='momoai')continue;
  const usage=e.data.usage||lastAssistantStreamChunk(e.data.stream||[],'usage')?.usage;
  rows[`${account}:${slot}:${attempts.get(slot)||0}`]={account,sessionId:session.id,model:source.model,input:usage?.inputTokens??null,output:usage?.outputTokens??null,cacheRead:usage?.cacheReadTokens??null,cacheWrite:usage?.cacheWriteTokens??null};
 }
 return rows;
}
