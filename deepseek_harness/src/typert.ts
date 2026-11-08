import {z} from 'zod';
import {createTypertRemoteInfo} from '@deepseek-ai/dsh-typert-protocol/remote-info';
const codec={mode:'strict',typeSymbol:'dsh-plugin-momoai#Json',create:()=>z.string().max(1000000),jsonSchema:{type:'string'}};
export const TYPERT_REMOTE=createTypertRemoteInfo({package:'dsh-plugin-momoai',methods:{'momoai/execute':{service:'momoai',description:'Owner-only account operations',invocation:{kind:'direct'},parameters:[{name:'command',source:'json',codec,strictCodec:codec}],result:codec}}},z);
export const TYPERT={package:'dsh-plugin-momoai',face:'host',schemas:[],get invocations(){return TYPERT_REMOTE.descriptors;},model:{services:[],events:[],objects:[]}};
export default TYPERT_REMOTE;
