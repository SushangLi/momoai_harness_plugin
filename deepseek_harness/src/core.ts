import QRCode from 'qrcode';
import {randomBytes} from 'node:crypto';
import {modelFrom,protocol,purchasePlan,tokenPurchasePlan,type Model,type Order,type Command,type CallType} from './domain.js';
export class HttpFailure extends Error {constructor(readonly status:number){super(`MomoAI 请求失败（HTTP ${status}）`);}}
export interface Vault {resolve(ref:string):Promise<{value:string}|undefined>;set(ref:string,value:string):Promise<void>;}
export class MomoCore {
  models:Model[]=[];
  state:any={model:247,preferred:'auto',orders:[],purchases:[],usage:{}};
  account:any;
  balance:any=null;
  balanceAt:string|null=null;
  balanceError:string|null=null;
  catalogAt=0;
  catalogError:string|null=null;
  private catalogFlight:Promise<void>|null=null;
  private busy=false;
  private refreshFlight:Promise<any>|null=null;
  constructor(private vault:Vault,private load:()=>Promise<any>,private save:(v:any)=>Promise<void>,private fetcher:typeof fetch=fetch){}
  async init(){this.state={...this.state,...await this.load()}; this.models=this.state.catalogCache?.models||[];this.catalogAt=this.state.catalogCache?.at||0; this.account=JSON.parse((await this.vault.resolve('MOMOAI_DSH_ACCOUNT'))?.value||'null'); for(const o of [...this.state.orders,...this.state.purchases])if(o.status==='sending')o.status='uncertain';await this.persist();}
  async persist(){await this.save(this.state);}
  async request(path:string,body?:any,auth:'key'|'login'|'none'='key'){
    const token=auth==='key'?this.account?.key:auth==='login'?this.account?.authToken:undefined;
    if(auth!=='none'&&!token)throw Error('请先连接 MomoAI 账户');
    let response:Response;
    try{response=await this.fetcher('https://momoai.pro'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});}catch{throw Error('网络请求未完成，请检查连接；购买请求不会自动重试');}
    const data=await response.json().catch(()=>null);
    if(!response.ok||data?.success===false||!data)throw new HttpFailure(response.status);
    return data;
  }
  async storeAccount(){await this.vault.set('MOMOAI_DSH_ACCOUNT',JSON.stringify(this.account));}
  async login(){const a=this.account;const r=await this.request('/api/auth/login',{email:a.email,password:a.password},'none');a.authToken=r.authToken;a.displayName=r.user?.username||a.nickname;a.userId=r.user?.user_id||a.userId;a.key=r.user?.user_momoai_key||a.key;if(!a.key){const k=await this.request('/api/user/momoai-key',{action:'create'},'login');a.key=k.data?.user_momoai_key;}if(!a.key||!a.authToken)throw Error('账户尚未就绪，请重试连接');await this.storeAccount();}
  async register(nickname:string,termsAccepted:boolean){
    nickname=typeof nickname==='string'?nickname.trim():'';
    if(!nickname||nickname.length>40||termsAccepted!==true)throw Error('请填写昵称并同意用户协议');
    if(this.account?.key){await this.login();return;}
    if(!this.account){const username=`momocli-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${randomBytes(5).toString('hex')}`;this.account={nickname,termsAcceptedAt:new Date().toISOString(),username,email:`${username}@gmail.com`,password:randomBytes(18).toString('base64url'),registration:'prepared'};await this.storeAccount();}
    const a=this.account;
    // Try the same identity first after any interruption; never mint another account.
    if(a.registration!=='prepared'){await this.login();return;}
    a.nickname=nickname;a.registration='submitted';await this.storeAccount();
    try{await this.request('/api/auth/register',{username:a.nickname,email:a.email,password:a.password},'none');}catch(e){if(e instanceof HttpFailure&&[400,422].includes(e.status)){a.registration='prepared';await this.storeAccount();}throw e;}await this.login();
  }
  async catalog(force=false){
    if(!force&&this.models.length&&Date.now()-this.catalogAt<300000)return;
    if(this.catalogFlight)return this.catalogFlight;
    this.catalogFlight=(async()=>{const path=(page:number)=>`/api/agents?type=chat&zone=normal&page=${page}&limit=100`;const first=await this.request(path(1),undefined,'none');
      const pages=Number(first.pagination?.totalPages||1);if(!Number.isSafeInteger(pages)||pages<1||pages>100||!Array.isArray(first.data))throw Error('模型目录格式不兼容');
      const data=[...first.data];for(let start=2;start<=pages;start+=4){const batch=await Promise.all(Array.from({length:Math.min(4,pages-start+1)},(_,i)=>this.request(path(start+i),undefined,'none')));for(const r of batch){if(!Array.isArray(r.data))throw Error('模型目录格式不兼容');data.push(...r.data);}}
      this.models=[...new Map(data.map(modelFrom).filter(Boolean).map((m:any)=>[m.id,m])).values()] as Model[];this.catalogAt=Date.now();this.catalogError=null;this.state.catalogCache={at:this.catalogAt,models:this.models};await this.persist();
    })().catch(e=>{this.catalogError=e.message;throw e;}).finally(()=>{this.catalogFlight=null;});return this.catalogFlight;
  }

  async refreshBalance(){try{const r=await this.request('/api/cli/exchange/balance');if(!r.data?.credits||!Array.isArray(r.data.tokens))throw Error('余额数据格式不兼容');this.balance=r.data;this.balanceAt=new Date().toISOString();this.balanceError=null;}catch(e){this.balanceError='余额暂时无法刷新';throw e;}}
  selected(id=this.state.model){const m=this.models.find(x=>x.id===id);if(!m)throw Error('模型不可用，请刷新目录并重新选择');return m;}
  view(){return {connected:!!this.account?.key,username:this.account?.displayName||this.account?.nickname,models:this.models,catalogError:this.catalogError,model:this.state.model,preferred:this.state.preferred,compat:this.models.some(x=>x.id===this.state.model)?protocol(this.selected(),this.state.preferred):null,balance:this.balance,balanceAt:this.balanceAt,balanceError:this.balanceError,orders:this.state.orders.filter((o:Order)=>o.account===this.account?.username),purchases:this.state.purchases.filter((p:any)=>p.account===this.account?.username&&p.status!=='quoted'),usage:Object.fromEntries(Object.entries(this.state.usage).filter(([,u]:any)=>u.account===this.account?.username))};}
  async execute(c:Command){
    if(c.type==='state')return this.view();
    if(c.type==='refresh'){if(this.busy)return this.view();if(!this.refreshFlight)this.refreshFlight=(async()=>{await this.catalog();if(this.account?.key)await this.refreshBalance();return this.view();})().finally(()=>{this.refreshFlight=null;});return this.refreshFlight;}
    if(!c||typeof c!=='object')throw Error('无效操作');
    if(this.busy)throw Error('上一项操作尚未结束');this.busy=true;
    try{
      if(c.type==='register'){await this.register(c.nickname,c.termsAccepted);await this.catalog();await this.refreshBalance();}
      else if(c.type==='refresh'){await this.catalog();if(this.account?.key)await this.refreshBalance();}
      else if(c.type==='credentials')return {...this.account,authToken:undefined};
      else if(c.type==='select'){await this.catalog();this.selected(c.id);if(c.preferred)protocol(this.selected(c.id),c.preferred);this.state.model=c.id;if(c.preferred)this.state.preferred=c.preferred;await this.persist();}
      else if(c.type==='quote'){
        if(!Number.isFinite(c.amount)||c.amount<1||c.amount>100000||!['wechat','alipay'].includes(c.method))throw Error('请输入有效金额和支付方式');
        await this.login();const q=await this.request('/api/user/group-policy',{metric:'recharge_multiplier',scene:`recharge.${c.method}`,baseAmount:c.amount*1000},'login');
        const budget=Number(q.quote?.adjustedAmount);if(!Number.isFinite(budget)||budget<=0)throw Error('充值报价格式不兼容');
        const estimate=null;
        return {...this.view(),quote:{agentId:c.agentId,amount:c.amount,method:c.method,budget,estimate}};
      }else if(c.type==='recharge'){
        if(!['wechat','alipay'].includes(c.method)||!Number.isFinite(c.amount)||c.amount<1||c.amount>100000||Math.abs(Math.round(c.amount*100)-c.amount*100)>1e-7)throw Error('充值金额须为 1–100000 元，最多两位小数');
        await this.login();
        const q=await this.request('/api/user/group-policy',{metric:'recharge_multiplier',scene:`recharge.${c.method}`,baseAmount:c.amount*1000},'login');
        const budget=Number(q.quote.adjustedAmount);if(!Number.isFinite(budget)||budget<=0)throw Error('充值报价格式不兼容');
        await this.refreshBalance();const creditsBefore=Number(this.balance.credits.spendable_total);
        const r=await this.request(`/api/payment/${c.method}`,{amount:c.amount,description:'MomoAI DSH 积分充值'},'login');
        if(r.orderSaved!==true||typeof r.orderNo!=='string'||!r.orderNo)throw Error('订单未保存，请勿支付');
        const url=c.method==='wechat'?r.qrCodeUrl:r.paymentUrl;
        const parsed=new URL(url);if(c.method==='wechat'?parsed.protocol!=='weixin:':parsed.protocol!=='https:'||!/(^|\.)alipay\.com$/.test(parsed.hostname))throw Error('支付地址无效');
        const qrDataUrl=c.method==='wechat'?await QRCode.toDataURL(url,{width:240,margin:2}):undefined;
        this.state.orders.push({creditsBefore,qrDataUrl,id:r.orderNo,account:this.account.username,agentId:c.agentId,amount:c.amount,budget,used:0,tokens:0,status:'awaiting-confirmation',method:c.method,url} as Order);await this.persist();
      }else if(c.type==='paymentCheck'){
        const order=this.state.orders.find((o:Order)=>o.id===c.id&&o.account===this.account?.username);if(!order)throw Error('订单不存在');
        const before=order.creditsBefore;await this.refreshBalance();
        return {...this.view(),paymentCheck:{id:order.id,available:Number(this.balance.credits.spendable_total),change:typeof before==='number'&&Number.isFinite(before)?Number(this.balance.credits.spendable_total)-before:null}};
      }else if(c.type==='purchaseQuote'){
        await this.catalog();this.selected(c.agentId);await this.refreshBalance();const listings=await this.request(`/api/cli/exchange/listings?agent_id=${c.agentId}`);
        const plan=tokenPurchasePlan(c.tokens,listings.data.listings,Number(this.balance.credits.spendable_total));
        const quote={id:randomBytes(12).toString('hex'),account:this.account.username,agentId:c.agentId,modelName:this.selected(c.agentId).name,...plan,createdAt:Date.now(),status:'quoted',actualTokens:0,used:0};
        this.state.purchases=this.state.purchases.filter((p:any)=>p.status!=='quoted'||p.createdAt>Date.now()-60000);this.state.purchases.push(quote);await this.persist();return {...this.view(),purchaseQuote:quote};
      }else if(c.type==='purchase'){
        const p=this.state.purchases.find((p:any)=>p.id===c.id&&p.account===this.account?.username);if(!p||p.status!=='quoted')throw Error('该购买已处理或结果待核实，请勿重复提交');
        if(Date.now()-p.createdAt>60000)throw Error('报价已过期，请重新获取报价');
        await this.refreshBalance();if(Number(this.balance.credits.spendable_total)<p.ceiling)throw Error('积分余额已变化，请重新获取报价');
        p.status='sending';await this.persist();
        try{const r=await this.request('/api/cli/exchange/buy',{agent_id:p.agentId,tokens:p.tokens,max_price:p.max_price});const cost=Number(r.data.credits_used.total),tokens=Number(r.data.tokens_bought);
          if(!Number.isFinite(cost)||cost<0||cost>p.ceiling+0.001||!Number.isSafeInteger(tokens)||tokens<0||tokens>p.tokens)throw Error('购买结果异常');
          p.used=cost;p.actualTokens=tokens;p.status=tokens===p.requested?'complete':'partial';await this.persist();
        }catch(e){p.status='uncertain';await this.persist();throw e;}
        await this.refreshBalance().catch(()=>{});return {...this.view(),purchaseResult:p};
      }else if(c.type==='exchange'){
        throw Error('整笔充值兑换入口已停用，请在“按量购买 Token”中填写数量并确认购买');
      } else throw Error('未知操作');
      return this.view();
    }finally{this.busy=false;}
  }
}
