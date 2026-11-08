export type CallType = 'auto' | 'openai-completions' | 'anthropic-messages';
export interface Model { id: number; name: string; format: 'openai'|'anthropic'|'google'; serviceStatus?:'active'; billingUnit?:'token'; recommended?:boolean; }
export function modelFrom(row: any): Model | null {
  if (!Number.isSafeInteger(Number(row.id)) || Number(row.id)<1 || row.agent_source_type!=='api' || !row.is_chat || row.is_delisted || row.service_status !== 'active' || row.billing_unit !== 'token' || !['openai','anthropic','google'].includes(row.baseurl_type)) return null;
  return {id:Number(row.id),name:String(row.agent_name),format:row.baseurl_type,serviceStatus:'active',billingUnit:'token',recommended:row.recommended===true};
}
export function protocol(model: Model, preferred: CallType) {
  if (!['openai','anthropic','google'].includes(model.format)) throw Error('模型兼容信息缺失，无法调用');
  if (!['auto','openai-completions','anthropic-messages'].includes(preferred)) throw Error('不支持的调用类型');
  const native = model.format === 'anthropic' ? 'anthropic-messages' : 'openai-completions';
  const effective = preferred === 'auto' ? native : preferred === 'anthropic-messages' && model.format !== 'anthropic' ? native : preferred;
  return {preferred,effective,reason:preferred==='auto'?'自动适配':effective!==preferred?'当前模型不支持期望协议，已自动适配；切回兼容模型时恢复偏好。':''};
}
export function purchasePlan(budget: number, listings: any[]) {
  if (!Number.isFinite(budget) || budget<=0) throw Error('可用兑换额度不足');
  const sorted=listings.filter(x=>x.is_available!==false && Number(x.resell_price)>0 && (x.unlimited || Number(x.token_onsale)>0)).sort((a,b)=>Number(a.resell_price)-Number(b.resell_price));
  if (!sorted.length) throw Error('暂无可购买库存');
  const price=Number(sorted[0].resell_price);
  const tokens=Math.floor((Math.floor(budget*100)/100)*1000/price);
  if (!Number.isSafeInteger(tokens)||tokens<1) throw Error('兑换额度不足以购买一个 Token');
  return {tokens,max_price:price};
}
export interface Order {qrDataUrl?:string;id:string;account:string;agentId:number;amount:number;budget:number;used:number;tokens:number;status:'awaiting-confirmation'|'sending'|'uncertain'|'partial'|'complete';url:string;method:'wechat'|'alipay';}
export type Command = ({type:'state'|'credentials'} | {type:'refresh';force?:boolean} | {type:'modelFilters';filters:ModelFilters} | {type:'register';nickname:string;termsAccepted:boolean} | {type:'select';id:number;preferred?:CallType} | {type:'quote'|'recharge';amount:number;method:'wechat'|'alipay';agentId:number} | {type:'exchange';id:string} | {type:'paymentCheck';id:string} | {type:'purchaseQuote';agentId:number;tokens:number} | {type:'purchase';id:string}) & {sessionId?:string};

export function tokenPurchasePlan(tokens:number,listings:any[],available:number){
 if(!Number.isSafeInteger(tokens)||tokens<1)throw Error('请输入大于零的整数 Token 数量');
 const sorted=listings.filter(x=>x.is_available!==false&&Number.isFinite(Number(x.resell_price))&&Number(x.resell_price)>0&&(x.unlimited||Number(x.token_onsale)>0)).sort((a,b)=>Number(a.resell_price)-Number(b.resell_price));
 let remaining=tokens,estimate=0,maxPrice=0;
 for(const row of sorted){const take=Math.min(remaining,row.unlimited?remaining:Math.floor(Number(row.token_onsale)));if(take<=0)continue;maxPrice=Number(row.resell_price);estimate+=take*maxPrice/1000;remaining-=take;if(!remaining)break;}
 if(!maxPrice)throw Error('暂无可购买库存');
 const offered=tokens-remaining;
 // The server rounds each seller's charge separately to cents. For every
 // non-negative split, round(x,2) <= 2*x; use a conservative aggregate
 // bound even if more small listings appear between quote and execution.
 const ceiling=Math.ceil((offered*maxPrice/1000*2-1e-9)*100)/100;
 if(!Number.isFinite(available)||ceiling>available)throw Error(`积分不足，本次数量最多需要 ${ceiling} 积分`);
 return {tokens:offered,requested:tokens,max_price:maxPrice,estimate:Math.ceil((estimate-1e-9)*100)/100,ceiling};
}

export interface ModelFilters { recommended:boolean; held:boolean; all:boolean; }
export const defaultModelFilters:ModelFilters={recommended:true,held:true,all:false};
export function filterModels(models:Model[],filters:ModelFilters,tokens:any[]=[],search=''){
 const held=new Set(tokens.filter(t=>Number(t.token_balance)>0||Number(t.token_onsale)>0).map(t=>Number(t.agent_id)));
 const query=search.trim().toLowerCase();
 return models.filter(m=>(filters.all||(filters.recommended&&m.recommended===true)||(filters.held&&held.has(m.id)))&&`${m.name} momo_${m.id} ${m.format}`.toLowerCase().includes(query));
}
