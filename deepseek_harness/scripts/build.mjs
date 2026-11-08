import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {build}=require(process.env.ESBUILD_PATH||'esbuild');
await mkdir('lib',{recursive:true});
await build({entryPoints:['src/index.ts','src/typert.ts'],outdir:'lib',bundle:true,platform:'node',format:'esm',packages:'external',target:'node24'});
const result=await build({entryPoints:['src/client.tsx'],bundle:true,platform:'browser',format:'cjs',external:['react','zod'],write:false,target:'es2022'});
await writeFile('lib/client.js',`window.__ModuleLoader__.load({id:'dsh-plugin-momoai',factory:(require)=>{const module={exports:{}};const exports=module.exports;\n${result.outputFiles[0].text}\nreturn module.exports;}});`);
await build({entryPoints:['tests/domain.test.ts','tests/wire.test.ts','tests/wallet.test.ts'],outdir:'lib/tests',bundle:true,platform:'node',format:'esm',packages:'external',target:'node24'});
