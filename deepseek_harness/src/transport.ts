import {Agent,fetch as undiciFetch} from 'undici';
/** MomoAI is a fixed-origin service; keep its transport independent of other providers. */
export function momoTransport(){
 const dispatcher=new Agent({connect:{timeout:15000},headersTimeout:120000,bodyTimeout:120000});
 const request:typeof fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
  if(url.origin!=='https://momoai.pro')throw Error('MomoAI 请求地址无效');
  // Explicit opt-in is useful on networks where this origin requires the host proxy.
  if(process.env.MOMOAI_DSH_USE_SYSTEM_PROXY==='1')return fetch(input,init);
  return await undiciFetch(url,{...init as any,redirect:'error',dispatcher}) as unknown as Response;
 };
 return {fetch:request,close:()=>dispatcher.close()};
}
