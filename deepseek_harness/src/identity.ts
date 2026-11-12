import {readJson} from './http.js';

export const platformOrigin = 'https://momoai.pro';
export type Identity = {userId:string;username:string;displayName:string;email:string|null;emailVerified:boolean};
export function identity(value:any):Identity {
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.userId)
    || typeof value.username !== 'string' || typeof value.displayName !== 'string') throw Error('账户数据格式不兼容，请更新插件');
  return {userId:value.userId,username:value.username,displayName:value.displayName,email:value.email||null,emailVerified:value.emailVerified===true};
}
export function apiKey(value:unknown):string {
  if(typeof value!=='string'||!/^momo_[A-Za-z0-9]{64}$/.test(value))throw Error('请填写有效的 MomoAI API Key');
  return value;
}
export async function jsonRequest(fetcher:typeof fetch,path:string,body?:any,token?:string){
  let response:Response;
  try {
    response=await fetcher(platformOrigin+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:platformOrigin,...token?{Authorization:`Bearer ${token}`}:{}} ,body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(30000)});
  } catch { throw Error('网络请求未完成，请检查连接；购买请求不会自动重试'); }
  return {response,data:await readJson(response)};
}

/** A password is used once. The revocable session is closed after obtaining the existing default key. */
export async function passwordAccount(fetcher:typeof fetch,identifier:{type:'auto'|'username'|'email';value:string},password:string){
  if(!identifier||!['auto','username','email'].includes(identifier.type)||!identifier.value||!password)throw Error('请填写邮箱或用户名和密码');
  const {response,data}=await jsonRequest(fetcher,'/api/auth/login',{identifier,password});
  const cookies=response.headers.getSetCookie();
  const session=cookies.map(v=>/^momo_session=(sid_[A-Za-z0-9_-]{43})(?:;|$)/.exec(v)?.[1]).find(Boolean);
  if(!session)throw Error('登录响应缺少会话，请更新插件后重试');
  try {
    const user=identity(data.user);
    const {data:result}=await jsonRequest(fetcher,'/api/user/momoai-key',{action:'create'},session);
    return {...user,key:apiKey(result.data?.key),identityVersion:2};
  } finally {
    await jsonRequest(fetcher,'/api/auth/logout',{},session).catch(()=>{});
  }
}
