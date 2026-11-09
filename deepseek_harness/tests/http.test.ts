import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HttpFailure,readJson} from '../src/http.js';

test('public server errors survive HTTP 400/409 and logical failures',async()=>{
  for (const [status,body,message] of [
    [400,{message:'该用户名已被使用'},'该用户名已被使用'],
    [409,{code:'ACCOUNT_IDENTIFIER_UNAVAILABLE',message:'用户名或邮箱已被使用，请登录或更换。'},'用户名或邮箱已被使用，请登录或更换。'],
    [403,{error:'此 Key 无权执行该操作'},'此 Key 无权执行该操作'],
    [401,{error:{message:'请重新登录'}},'请重新登录'],
    [200,{success:false,message:'订单未保存'},'订单未保存'],
  ] as const) {
    await assert.rejects(readJson(new Response(JSON.stringify(body),{status})),error=>{
      assert.ok(error instanceof HttpFailure);assert.equal(error.status,status);assert.equal(error.message,message);return true;
    });
  }
});
test('non-JSON and undocumented fields do not become UI error text',async()=>{
  for (const body of ['<html>upstream error</html>',JSON.stringify({debug:'secret',error:{stack:'secret'}})]) {
    await assert.rejects(readJson(new Response(body,{status:502})),/^HttpFailure: MomoAI 请求失败（HTTP 502）$/);
  }
});
