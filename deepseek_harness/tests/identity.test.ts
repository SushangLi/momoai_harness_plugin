import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MomoCore} from '../src/core.js';
import {passwordAccount} from '../src/identity.js';
const user={userId:'019a64cc-4ae1-7f50-9333-111111111111',username:'generated_name',displayName:'可重复昵称',email:'real@example.test',emailVerified:true};
const key='momo_'+'a'.repeat(64),session='sid_'+'s'.repeat(43);
const json=(data:any,status=200,headers:any={})=>new Response(JSON.stringify(data),{status,headers});
function fixture(fetcher:typeof fetch,credential:any=null,state:any={}){
  const saves:any[]=[];
  const core=new MomoCore({resolve:async()=>credential?{value:JSON.stringify(credential)}:undefined,set:async(_,value)=>{credential=JSON.parse(value);}},async()=>state,async value=>{saves.push(structuredClone(value));},fetcher);
  return {core,saves,get credential(){return credential;}};
}
test('login uses explicit identifier and cookie session; key is preserved and password/session are never saved',async()=>{
  const paths:string[]=[];
  const f=fixture(async(url,init)=>{
    const path=new URL(String(url)).pathname;paths.push(path);
    assert.equal(init?.redirect,'error');assert.equal(new Headers(init?.headers).get('origin'),'https://momoai.pro');
    if(path.endsWith('/login')){assert.deepEqual(JSON.parse(String(init?.body)),{identifier:{type:'username',value:'mail@shaped.name'},password:'private password'});return json({user},200,{'set-cookie':`momo_session=${session}; HttpOnly; Secure; Path=/`});}
    assert.equal(new Headers(init?.headers).get('authorization'),`Bearer ${session}`);
    return path.endsWith('momoai-key')?json({data:{key}}):json({success:true});
  });
  await f.core.init();await f.core.connect({type:'username',value:'mail@shaped.name'},'private password');
  assert.deepEqual(paths,['/api/auth/login','/api/user/momoai-key','/api/auth/logout']);
  assert.equal(f.credential.key,key);assert.equal(f.credential.userId,user.userId);
  assert.doesNotMatch(JSON.stringify([f.credential,f.saves]),/private password|sid_/);
});
test('temporary session is closed even when key lookup fails',async()=>{
  let logout=false;
  await assert.rejects(passwordAccount(async(url)=>{
    if(String(url).endsWith('/login'))return json({user},200,{'set-cookie':`momo_session=${session}; Path=/`});
    if(String(url).endsWith('/logout')){logout=true;return json({success:true});}
    return json({message:'Key 暂不可用'},503);
  },{type:'email',value:user.email},'private password'),/Key 暂不可用/);
  assert.equal(logout,true);
});
test('registration submits a duplicate-capable displayName and real email; uncertain submission is never replayed',async()=>{
  let calls=0;
  const f=fixture(async(_,init)=>{calls++;assert.deepEqual(JSON.parse(String(init?.body)),{displayName:'同名',email:user.email,password:'private password'});throw Error('lost response');});
  await f.core.init();await assert.rejects(f.core.register('同名',user.email,'private password',true));
  await assert.rejects(f.core.register('同名',user.email,'private password',true),/注册已提交/);
  assert.equal(calls,1);assert.equal(f.core.state.pendingRegistration.status,'uncertain');assert.equal(f.credential,null);
  assert.doesNotMatch(JSON.stringify(f.saves),/private password|gmail\.com/);
});
test('saved key proves legacy local ownership once; rename cannot change records and unknown outcomes remain pending',async()=>{
  let displayName='可重复昵称';
  const f=fixture(async()=>json({user:{...user,displayName}}),{username:'local-label',nickname:'old',key,password:'old-secret',authToken:'retired'},
    {orders:[{id:'old-order',account:'local-label',status:'awaiting-confirmation'},{id:'other',account:'someone-else'}],purchases:[{id:'unknown',account:'local-label',status:'sending'}],usage:{'local-label:s:0:0:0':{account:'local-label',input:1}},sessionAccounts:{s:'local-label'}});
  await f.core.init();assert.equal(f.core.view().orders.length,0);
  await f.core.ensureIdentity();assert.equal(f.core.view().orders.length,1);assert.equal(f.core.state.purchases[0].status,'uncertain');
  assert.equal(f.core.state.sessionUserIds.s,user.userId);assert.ok(f.core.state.usage[user.userId+':s:0:0:0']);
  assert.equal(f.core.state.orders[1].userId,undefined);assert.equal(f.credential.password,undefined);assert.equal(f.credential.authToken,undefined);
  displayName='改了昵称';await f.core.ensureIdentity();assert.equal(f.core.view().displayName,displayName);assert.equal(f.core.view().orders[0].userId,user.userId);assert.equal(f.core.state.identityMigrations.length,1);
});
test('an unrelated imported key cannot claim unverified legacy local records',async()=>{
  const f=fixture(async()=>json({user}),{username:'local-label',password:'unverified'},{orders:[{id:'old',account:'local-label'}]});
  await f.core.init();await f.core.connectKey(key);assert.equal(f.core.view().orders.length,0);assert.equal(f.core.state.orders[0].userId,undefined);
});
