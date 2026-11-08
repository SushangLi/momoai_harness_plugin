import {readFile,writeFile} from 'node:fs/promises';

// Git installs start at the repository root. Keep its DSH distribution manifest
// derived from the independent plugin package, without an install-time build.
const source=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const root={...source};
const prefix='deepseek_harness/';
root.main=prefix+source.main;
root.exports=Object.fromEntries(Object.entries(source.exports).map(([key,path])=>[key,'./'+prefix+path.replace(/^\.\//,'')]));
root.files=[...source.files.map(path=>prefix+path),'README.md'];
root.dsh={...source.dsh,bundle:{...source.dsh.bundle,patch:'./'+prefix+source.dsh.bundle.patch.replace(/^\.\//,'')}};
root.repository={...source.repository};
delete root.repository.directory;
delete root.scripts;
delete root.devDependencies;
await writeFile(new URL('../../package.json',import.meta.url),JSON.stringify(root,null,2)+'\n');
