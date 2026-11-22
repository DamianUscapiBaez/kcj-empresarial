import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;
try { ts=require('typescript'); }
catch {
 const globalPath=path.resolve(path.dirname(process.execPath),'..','lib','node_modules','typescript','lib','typescript.js');
 if(!fs.existsSync(globalPath))throw new Error('No se encontró TypeScript. Ejecuta npm install en el equipo de TI.');
 ts=require(globalPath);
}
const root=process.cwd();
const issues=[];const warnings=[];const stats={files:0,imports:0,parseErrors:0,apiRoutes:0,clientFiles:0};
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>{if(d.name==='node_modules'||d.name==='.next')return [];const full=path.join(dir,d.name);return d.isDirectory()?walk(full):[full];});}
function source(p){return fs.readFileSync(path.join(root,p),'utf8');}
function add(code,file,message){issues.push({code,file,message});}
const files=['app','components','lib','prisma','tests','scripts'].flatMap(p=>walk(path.join(root,p))).filter(f=>/\.[cm]?[jt]sx?$/.test(f));
for(const file of files){
 stats.files++;
 const text=fs.readFileSync(file,'utf8');const relative=path.relative(root,file);
 const kind=file.endsWith('tsx')?ts.ScriptKind.TSX:file.endsWith('jsx')?ts.ScriptKind.JSX:file.endsWith('.ts')?ts.ScriptKind.TS:ts.ScriptKind.JS;
 const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,kind);
 for(const d of ast.parseDiagnostics){stats.parseErrors++;add('SINTAXIS',relative,ts.flattenDiagnosticMessageText(d.messageText,' '));}
 const client=/^\s*["']use client["'];?/.test(text);if(client)stats.clientFiles++;
 if(relative.startsWith('app/api/')&&relative.endsWith('/route.ts')){stats.apiRoutes++;
  if(!/export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|PATCH|DELETE)/.test(text))add('API_SIN_METODO',relative,'No expone un manejador HTTP');
  if(!relative.includes('/health/')&&!/(currentUser|requireUser|requireRole)/.test(text))warnings.push({code:'API_REVISAR_AUTENTICACION',file:relative});
 }
 function visit(node){
  if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)){
   const id=node.moduleSpecifier.text;
   if(id.startsWith('@/')||id.startsWith('.')){
    stats.imports++;
    const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
    if(!['','.ts','.tsx','.js','.jsx','.mjs','.cjs','.json'].some(e=>fs.existsSync(base+e))&&!['index.ts','index.tsx','index.js'].some(e=>fs.existsSync(path.join(base,e))))add('IMPORT_FALTANTE',relative,id);
   }
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);
}
// Confirmar que los catálogos de rutas tienen una entrada por cada módulo.
const mods=[...source('lib/modulos.ts').matchAll(/\{slug:"([\w-]+)",title:/g)].map(x=>x[1]);
for(const file of ['app/dashboard/page.tsx','components/ui/ModuleIcon.tsx']){
 const text=source(file);const start=text.indexOf('Record<ModuleSlug,');
 if(start<0){add('MAPA_MODULOS_AUSENTE',file,'No hay catálogo tipado de módulos');continue;}
 const object=text.slice(text.indexOf('{',start)+1,text.indexOf('};',start));
 for(const slug of mods){
  const escaped=slug.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  if(!new RegExp(`(?:^|[,\\n])\\s*(?:["']?${escaped}["']?)\\s*:`, 'm').test(object))add('MODULO_SIN_METADATO',file,slug);
 }
}
if(mods.length!==20||new Set(mods).size!==20)add('CATALOGO_MODULOS','lib/modulos.ts','Se esperaban 20 módulos únicos');
// Las rutas operativas deben estar sujetas a permisos, aunque la UI oculte un botón.
for(const file of ['app/actions-auth.ts','app/actions-operativas.ts','app/actions-aula.ts','app/actions-simulacros.ts','app/actions-vehiculos.ts']){
 if(!source(file).startsWith('"use server"'))add('ACTION_SIN_SERVIDOR',file,'Falta directiva use server');
}
const code=source('app/api/evidencias/descargar/route.ts');
if(!code.includes('Cache-Control'))warnings.push({code:'EVIDENCIA_SIN_CONTROL_CACHE',file:'app/api/evidencias/descargar/route.ts'});
const result={status:issues.length?'FALLA':'PASA',checkedAt:new Date().toISOString(),counts:stats,modules:mods.length,issues,warnings};
console.log(JSON.stringify(result,null,2));process.exit(issues.length?1:0);
