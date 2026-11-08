import {test} from 'node:test';
import assert from 'node:assert/strict';
import {modelFrom,protocol,purchasePlan,tokenPurchasePlan} from '../src/domain.js';
import {MomoCore} from '../src/core.js';
const claude={id:1,name:'A',format:'anthropic' as const},openai={id:247,name:'D',format:'openai' as const};
test('manual preference survives automatic switch and restores',()=>{const preferred='anthropic-messages';assert.equal(protocol(claude,preferred).effective,preferred);assert.equal(protocol(openai,preferred).effective,'openai-completions');assert.equal(protocol(claude,preferred).effective,preferred);assert.equal(protocol(claude,'openai-completions').effective,'openai-completions');});
test('auto selects known protocol, unknown models excluded',()=>{assert.equal(protocol(claude,'auto').effective,'anthropic-messages');assert.equal(protocol({...openai,format:'google'},'auto').effective,'openai-completions');assert.equal(modelFrom({id:2,is_chat:1,service_status:'active',billing_unit:'token',baseurl_type:'other'}),null);});
test('maximum possible spend stays below budget across prices',()=>{for(const price of [0.003,0.01,0.3,9,999])for(const budget of [1,10,15.23,1000]){const p=purchasePlan(budget,[{resell_price:price,unlimited:true}]);assert.ok(p.tokens*p.max_price/1000<=budget+1e-9);}});
test('empty nickname and missing agreement cannot reach registration',async()=>{let calls=0;const core=new MomoCore({resolve:async()=>undefined,set:async()=>{}},async()=>({}),async()=>{},async()=>{calls++;throw Error('must not call');});await core.init();await assert.rejects(core.execute({type:'register',nickname:'',termsAccepted:true}));await assert.rejects(core.execute({type:'register',nickname:'Alice',termsAccepted:false}));assert.equal(calls,0);assert.equal(core.account,null);});
test('initial state never registers and interrupted purchase is uncertain',async()=>{let calls=0;const core=new MomoCore({resolve:async()=>undefined,set:async()=>{}},async()=>({orders:[{id:'x',status:'sending'}]}),async()=>{},async()=>{calls++;throw Error();});await core.init();assert.equal((await core.execute({type:'state'})).connected,false);assert.equal(core.state.orders[0].status,'uncertain');assert.equal(calls,0);});
import {MomoAdapter} from '../src/adapter.js';
test('desktop PiAiAdapter resolves both protocols',async()=>{
 const core=new MomoCore({resolve:async()=>undefined,set:async()=>{}},async()=>({}),async()=>{});await core.init();core.models=[claude,openai];core.catalogAt=Date.now();core.account={key:'test-key'};
 const adapter=new MomoAdapter(core);
 const a=await adapter.prepareCall('momoai','momo_247');assert.equal(a.model.id,'momo_247');core.state.preferred='anthropic-messages';const b=await adapter.prepareCall('momoai','momo_1');assert.equal(b.model.id,'momo_1');
});

test('quantity quotes use only requested tokens and cap worst-case spending',()=>{const p=tokenPurchasePlan(1500,[{resell_price:2,token_onsale:500},{resell_price:1,token_onsale:1000}],10);assert.equal(p.tokens,1500);assert.equal(p.estimate,2);assert.equal(p.ceiling,6);assert.equal(p.max_price,2);assert.throws(()=>tokenPurchasePlan(1500,[{resell_price:2,unlimited:true}],2));const partial=tokenPurchasePlan(2000,[{resell_price:1,token_onsale:500}],10);assert.equal(partial.tokens,500);assert.equal(partial.requested,2000);});

test('purchase ceiling covers per-seller rounding across fragmented fills',()=>{const listings=Array.from({length:1000},()=>({resell_price:0.5,token_onsale:10}));const p=tokenPurchasePlan(10000,listings,100);const actual=listings.reduce((n,r)=>n+Number((r.token_onsale*r.resell_price/1000).toFixed(2)),0);assert.ok(actual<=p.ceiling+1e-8);assert.equal(p.ceiling,10);});
