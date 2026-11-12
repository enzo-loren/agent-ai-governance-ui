import { rm, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root=resolve(import.meta.dirname, '..');
const out=resolve(root,'dist');
await rm(out,{recursive:true,force:true});
for(const p of ['index.html','favicon.svg','.nojekyll','src/app.js','src/router.js','src/mock/fixtures.js','src/mock/backend.js','src/data.js','src/domain.js','src/icons.js','src/operations.js','src/views.js','src/styles/tokens.css','src/styles/app.css']){
  const dest=resolve(out,p);
  await mkdir(dirname(dest),{recursive:true});
  await copyFile(resolve(root,p),dest);
}
console.log('Prepared self-contained static site in dist/ (no external requests or build dependencies).');
