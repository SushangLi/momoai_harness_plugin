import QRCode from 'qrcode';
import {randomBytes} from 'node:crypto';
import {defaultModelFilters,modelFrom,protocol,purchasePlan,tokenPurchasePlan,type Model,type Order,type Command,type CallType} from './domain.js';
import {HttpFailure} from './http.js';
import {apiKey,identity,jsonRequest,passwordAccount} from './identity.js';
export {HttpFailure} from './http.js';
export interface Vault {resolve(ref:string):Promise<{value:string}|undefined>;set(ref:string,value:string):Promise<void>;}
export class MomoCore {
  models:Model[]=[];
  state:any={modelFilters:{...defaultModelFilters},model:247,preferred:'auto',orders:[],purchases:[],usage:{}};
  account:any;
  balance:any=null;
  balanceAt:string|null=null;
  balanceError:string|null=null;
  catalogAt=0;
  catalogError:string|null=null;
  private catalogFlight:Promise<void>|null=null;
  private balanceFlight:Promise<void>|null=null;
  private balanceAccount:string|null=null;
  private balanceAttemptAt=0;
  private busy=false;
  private refreshFlight:Promise<any>|null=null;
  constructor(private vault:Vault,private load:()=>Promise<any>,private save:(v:any)=>Promise<void>,private fetcher:typeof fetch=fetch){}
  async init(){this.state={...this.state,...await this.load()}; this.models=this.state.catalogCache?.version===2?this.state.catalogCache.models:[];this.catalogAt=this.state.catalogCache?.version===2?this.state.catalogCache.at:0; this.account=JSON.parse((await this.vault.resolve('MOMOAI_DSH_ACCOUNT'))?.value||'null'); for(const o of [...this.state.orders,...this.state.purchases])if(o.status==='sending')o.status='uncertain';await this.persist();}
  async persist(){await this.save(this.state);}
  private identityFlight:Promise<void>|null=null;
  async request(path:string,body?:any,auth:'key'|'none'='key'){
    const token=auth==='key'?this.account?.key:undefined;
    if(auth!=='none'&&!token)throw Error('请先连接 MomoAI 账户');
    return (await jsonRequest(this.fetcher,path,body,token)).data;
  }
  async storeAccount(){await this.vault.set('MOMOAI_DSH_ACCOUNT',JSON.stringify(this.account));}
  private migrateRecords(legacyLabel:string,userId:string){
    for(const row of [...this.state.orders,...this.state.purchases,...Object.values(this.state.usage) as any[]]){
      if(!row.userId&&row.account===legacyLabel){row.userId=userId;row.legacyAccount=row.account;delete row.account;}
    }
    this.state.sessionUserIds??={};
    for(const [session,label] of Object.entries(this.state.sessionAccounts||{}))if(label===legacyLabel)this.state.sessionUserIds[session]=userId;
    // Rekey usage slots so replay replaces them instead of counting them twice.
    this.state.usage=Object.fromEntries(Object.entries(this.state.usage).map(([key,row]:any)=>[row.userId===userId&&key.startsWith(legacyLabel+':')?userId+key.slice(legacyLabel.length):key,row]));
    this.state.identityMigrations??=[];
    if(!this.state.identityMigrations.some((m:any)=>m.legacyLabel===legacyLabel&&m.userId===userId))this.state.identityMigrations.push({legacyLabel,userId,source:'verified-saved-credential',at:new Date().toISOString()});
  }
  private async saveConnected(account:any,provenLegacyLabel?:string){
    if(provenLegacyLabel)this.migrateRecords(provenLegacyLabel,account.userId);
    // Save migrated non-secret records first: if interrupted, the old credential can verify them again.
    await this.persist();
    this.account={...identity(account),key:apiKey(account.key),identityVersion:2};
    await this.storeAccount();
  }
  async ensureIdentity(){
    if(this.identityFlight)return this.identityFlight;
    if(!this.account?.key&&!this.account?.password)return;
    this.identityFlight=(async()=>{
      const previous=this.account;
      if(previous.key){
        const result=await this.request('/api/cli/auth/me');
        const user=identity(result.user);
        if(previous.identityVersion===2&&previous.userId!==user.userId)throw Error('账户身份校验失败，请重新连接');
        if(this.account!==previous)return;
        await this.saveConnected({...user,key:previous.key},previous.identityVersion===2?undefined:previous.username);
      }else if(previous.email&&previous.password){
        const account=await passwordAccount(this.fetcher,{type:'email',value:previous.email},previous.password);
        if(this.account!==previous)return;
        await this.saveConnected(account,previous.username);
      }
    })().finally(()=>{this.identityFlight=null;});return this.identityFlight;
  }
  async connect(identifier:{type:'auto'|'username'|'email';value:string},password:string){
    if(this.identityFlight)await this.identityFlight.catch(()=>{});
    const account=await passwordAccount(this.fetcher,identifier,password);
    await this.saveConnected(account);
    this.state.pendingRegistration=undefined;await this.persist();
  }
  async connectKey(key:string){
    if(this.identityFlight)await this.identityFlight.catch(()=>{});
    const {data}=await jsonRequest(this.fetcher,'/api/cli/auth/me',undefined,apiKey(key.trim()));
    await this.saveConnected({...identity(data.user),key:key.trim()});
  }
  async register(nickname:string,email:string,password:string,termsAccepted:boolean){
    nickname=typeof nickname==='string'?nickname.trim():'';email=typeof email==='string'?email.trim():'';
    if(!nickname||nickname.length>40||termsAccepted!==true)throw Error('请填写昵称并同意用户协议');
    if(!email||!password)throw Error('请填写真实邮箱和密码');
    const pending=this.state.pendingRegistration;
    if(pending&&pending.email.toLowerCase()===email.toLowerCase()&&pending.status!=='rejected')throw Error('该注册已提交，请验证邮箱后登录；如未收到邮件，可重新发送验证邮件');
    this.state.pendingRegistration={email,displayName:nickname,status:'submitted',at:new Date().toISOString()};await this.persist();
    try{
      const result=await this.request('/api/auth/register',{displayName:nickname,email,password},'none');
      this.state.pendingRegistration.status='verification';this.state.pendingRegistration.message=result.message;await this.persist();
    }catch(e){
      if(e instanceof HttpFailure&&[400,409,422].includes(e.status))this.state.pendingRegistration.status='rejected';
      else this.state.pendingRegistration.status='uncertain';
      await this.persist();throw e;
    }
  }
  async catalog(force=false){
    if(!force&&this.catalogAt>0&&Date.now()-this.catalogAt<300000)return;
    if(this.catalogFlight)return this.catalogFlight;
    this.catalogFlight=(async()=>{const path=(page:number)=>`/api/agents?type=chat&zone=normal&page=${page}&limit=100`;const first=await this.request(path(1),undefined,'none');
      const pages=Number(first.pagination?.totalPages||1);if(!Number.isSafeInteger(pages)||pages<1||pages>100||!Array.isArray(first.data))throw Error('模型目录格式不兼容');
      const data=[...first.data];for(let start=2;start<=pages;start+=4){const batch=await Promise.all(Array.from({length:Math.min(4,pages-start+1)},(_,i)=>this.request(path(start+i),undefined,'none')));for(const r of batch){if(!Array.isArray(r.data))throw Error('模型目录格式不兼容');data.push(...r.data);}}
      this.models=[...new Map(data.map(modelFrom).filter(Boolean).map((m:any)=>[m.id,m])).values()] as Model[];this.catalogAt=Date.now();this.catalogError=null;this.state.catalogCache={version:2,at:this.catalogAt,models:this.models};await this.persist();
    })().catch(e=>{this.catalogError=e.message;throw e;}).finally(()=>{this.catalogFlight=null;});return this.catalogFlight;
  }

  async refreshBalance(force=true){
    if(this.account?.identityVersion!==2)await this.ensureIdentity();
    const account=this.account?.userId||null;
    if(this.balanceAccount!==account){this.balance=null;this.balanceAt=null;this.balanceError=null;this.balanceAttemptAt=0;this.balanceAccount=account;}
    if(this.balanceFlight){await this.balanceFlight;if(!force)return;}
    if(!force&&Date.now()-this.balanceAttemptAt<30000)return;
    this.balanceAttemptAt=Date.now();
    this.balanceFlight=(async()=>{try{const r=await this.request('/api/cli/exchange/balance');if(r.data?.user_id!==account||!r.data?.credits||!Array.isArray(r.data.tokens))throw Error('余额数据格式不兼容');if(this.account?.userId!==account)return;this.balance=r.data;this.balanceAt=new Date().toISOString();this.balanceError=null;}catch(e){this.balanceError='余额暂时无法刷新';throw e;}})().finally(()=>{this.balanceFlight=null;});
    return this.balanceFlight;
  }
  selected(id=this.state.model){const m=this.models.find(x=>x.id===id);if(!m)throw Error('模型不可用，请刷新目录并重新选择');return m;}
  view(){return {connected:!!this.account?.key&&this.account?.identityVersion===2,identityPending:!!this.account&&this.account.identityVersion!==2,displayName:this.account?.displayName,username:this.account?.username,userId:this.account?.userId,pendingRegistration:this.state.pendingRegistration,models:this.models,modelFilters:this.state.modelFilters,catalogError:this.catalogError,model:this.state.model,preferred:this.state.preferred,compat:this.models.some(x=>x.id===this.state.model)?protocol(this.selected(),this.state.preferred):null,balance:this.balance,balanceAt:this.balanceAt,balanceError:this.balanceError,orders:this.state.orders.filter((o:Order)=>!!this.account?.userId&&o.userId===this.account.userId),purchases:this.state.purchases.filter((p:any)=>!!this.account?.userId&&p.userId===this.account.userId&&p.status!=='quoted'),usage:Object.fromEntries(Object.entries(this.state.usage).filter(([,u]:any)=>!!this.account?.userId&&u.userId===this.account.userId))};}
  async execute(c:Command){
    if(c.type==='state')return this.view();
    if(c.type==='refresh'){if(this.busy)return this.view();if(!this.refreshFlight)this.refreshFlight=(async()=>{await this.catalog(c.force===true);if(this.account){await this.ensureIdentity();if(this.account?.identityVersion===2)await this.refreshBalance(c.force===true);}return this.view();})().finally(()=>{this.refreshFlight=null;});return this.refreshFlight;}
    if(!c||typeof c!=='object')throw Error('无效操作');
    if(this.busy)throw Error('上一项操作尚未结束');this.busy=true;
    try{
      if(['quote','recharge','paymentCheck','purchaseQuote','purchase'].includes(c.type)&&this.account?.identityVersion!==2){await this.ensureIdentity();if(this.account?.identityVersion!==2)throw Error('请先连接 MomoAI 账户');}
      if(c.type==='register'){await this.register(c.nickname,c.email,c.password,c.termsAccepted);}
      else if(c.type==='connect'||c.type==='connectKey'){if(c.type==='connect')await this.connect(c.identifier,c.password);else await this.connectKey(c.key);await this.catalog();await this.refreshBalance();}
      else if(c.type==='resendVerification'){const r=await this.request('/api/auth/resend-verification',{email:c.email},'none');return {...this.view(),notice:r.message};}
      else if(c.type==='modelFilters'){if(!c.filters||['recommended','held','all'].some(k=>typeof c.filters[k]!=='boolean'))throw Error('无效模型范围');this.state.modelFilters={recommended:c.filters.recommended,held:c.filters.held,all:c.filters.all};await this.persist();}
      else if(c.type==='credentials'){await this.ensureIdentity();if(this.account?.identityVersion!==2)throw Error('请先连接账户');return {...identity(this.account),key:this.account.key};}
      else if(c.type==='select'){await this.catalog();this.selected(c.id);if(c.preferred)protocol(this.selected(c.id),c.preferred);this.state.model=c.id;if(c.preferred)this.state.preferred=c.preferred;await this.persist();}
      else if(c.type==='quote'){
        if(!Number.isFinite(c.amount)||c.amount<1||c.amount>100000||!['wechat','alipay'].includes(c.method))throw Error('请输入有效金额和支付方式');
        const q=await this.request('/api/user/group-policy',{metric:'recharge_multiplier',scene:`recharge.${c.method}`,baseAmount:c.amount*1000});
        const budget=Number(q.quote?.adjustedAmount);if(!Number.isFinite(budget)||budget<=0)throw Error('充值报价格式不兼容');
        const estimate=null;
        return {...this.view(),quote:{agentId:c.agentId,amount:c.amount,method:c.method,budget,estimate}};
      }else if(c.type==='recharge'){
        if(!['wechat','alipay'].includes(c.method)||!Number.isFinite(c.amount)||c.amount<1||c.amount>100000||Math.abs(Math.round(c.amount*100)-c.amount*100)>1e-7)throw Error('充值金额须为 1–100000 元，最多两位小数');
        const q=await this.request('/api/user/group-policy',{metric:'recharge_multiplier',scene:`recharge.${c.method}`,baseAmount:c.amount*1000});
        const budget=Number(q.quote.adjustedAmount);if(!Number.isFinite(budget)||budget<=0)throw Error('充值报价格式不兼容');
        await this.refreshBalance();const creditsBefore=Number(this.balance.credits.spendable_total);
        const r=await this.request(`/api/payment/${c.method}`,{amount:c.amount,description:'MomoAI DSH 积分充值'});
        if(r.orderSaved!==true||typeof r.orderNo!=='string'||!r.orderNo)throw Error('订单未保存，请勿支付');
        const url=c.method==='wechat'?r.qrCodeUrl:r.paymentUrl;
        const parsed=new URL(url);if(c.method==='wechat'?parsed.protocol!=='weixin:':parsed.protocol!=='https:'||!/(^|\.)alipay\.com$/.test(parsed.hostname))throw Error('支付地址无效');
        const qrDataUrl=c.method==='wechat'?await QRCode.toDataURL(url,{width:240,margin:2}):undefined;
        this.state.orders.push({creditsBefore,qrDataUrl,id:r.orderNo,userId:this.account.userId,agentId:c.agentId,amount:c.amount,budget,used:0,tokens:0,status:'awaiting-confirmation',method:c.method,url} as Order);await this.persist();
      }else if(c.type==='paymentCheck'){
        const order=this.state.orders.find((o:Order)=>o.id===c.id&&!!this.account?.userId&&o.userId===this.account.userId);if(!order)throw Error('订单不存在');
        const before=order.creditsBefore;await this.refreshBalance();
        return {...this.view(),paymentCheck:{id:order.id,available:Number(this.balance.credits.spendable_total),change:typeof before==='number'&&Number.isFinite(before)?Number(this.balance.credits.spendable_total)-before:null}};
      }else if(c.type==='purchaseQuote'){
        await this.catalog();this.selected(c.agentId);await this.refreshBalance();const listings=await this.request(`/api/cli/exchange/listings?agent_id=${c.agentId}`);
        const plan=tokenPurchasePlan(c.tokens,listings.data.listings,Number(this.balance.credits.spendable_total));
        const quote={id:randomBytes(12).toString('hex'),userId:this.account.userId,agentId:c.agentId,modelName:this.selected(c.agentId).name,...plan,createdAt:Date.now(),status:'quoted',actualTokens:0,used:0};
        this.state.purchases=this.state.purchases.filter((p:any)=>p.status!=='quoted'||p.createdAt>Date.now()-60000);this.state.purchases.push(quote);await this.persist();return {...this.view(),purchaseQuote:quote};
      }else if(c.type==='purchase'){
        const p=this.state.purchases.find((p:any)=>p.id===c.id&&!!this.account?.userId&&p.userId===this.account.userId);if(!p||p.status!=='quoted')throw Error('该购买已处理或结果待核实，请勿重复提交');
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
