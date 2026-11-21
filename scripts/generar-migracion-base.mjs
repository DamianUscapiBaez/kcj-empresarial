// Solo herramienta de desarrollo. Migración final incluida y versionada.
import {readFileSync,writeFileSync} from "node:fs";
import {join} from "node:path";
const source=readFileSync(join(process.cwd(),"prisma/schema.prisma"),"utf8");
const enums=[...source.matchAll(/enum\s+(\w+)\s*\{([\s\S]*?)\n\}/g)].map(m=>({name:m[1],values:m[2].split(/\n/).map(x=>x.trim()).filter(Boolean)}));
const models=[...source.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)].map(m=>({name:m[1],lines:m[2].split(/\n/).map(s=>s.trim()).filter(Boolean)}));
const scalar=new Set(["String","Int","Float","Boolean","DateTime","Json"]);const en=new Set(enums.map(x=>x.name));
const q=s=>'"'+s.replaceAll('"','""')+'"';
const stmt=[];
stmt.push("-- Base inicial KCJ Control · PostgreSQL · creación no destructiva");
for(const e of enums)stmt.push(`CREATE TYPE ${q(e.name)} AS ENUM (${e.values.map(x=>`'${x}'`).join(', ')});`);
const keys=[];const indexes=[];
for(const model of models){
 const fields=[];
 for(const line of model.lines){
  if(line.startsWith('@@')){
   const m=line.match(/^@@(unique|index)\(\[([^\]]+)\]/);if(m){const cols=m[2].split(',').map(x=>x.trim());const suffix=m[1]==='unique'?'key':'idx';const name=`${model.name}_${cols.join('_')}_${suffix}`;indexes.push(`CREATE ${m[1]==='unique'?'UNIQUE ':''}INDEX ${q(name)} ON ${q(model.name)} (${cols.map(q).join(', ')});`);}continue;
  }
  const m=line.match(/^(\w+)\s+([\w\[\]?]+)(.*)$/);if(!m)continue;const name=m[1];let dtype=m[2];const attr=m[3];
  const relation=attr.match(/@relation\(fields:\[([^\]]+)\],references:\[([^\]]+)\](?:,onDelete:(\w+))?\)/);
  if(relation){keys.push({model:model.name,related:dtype.replace('?',''),fields:relation[1].split(',').map(x=>x.trim()),references:relation[2].split(',').map(x=>x.trim()),onDelete:relation[3]});continue;}
  if(dtype.endsWith('[]'))continue;
  const optional=dtype.endsWith('?');if(optional)dtype=dtype.slice(0,-1);
  if(!scalar.has(dtype)&&!en.has(dtype))continue;
  const mapped=dtype==='String'?'TEXT':dtype==='Int'?'INTEGER':dtype==='Float'?'DOUBLE PRECISION':dtype==='Boolean'?'BOOLEAN':dtype==='DateTime'?'TIMESTAMP(3)':dtype==='Json'?'JSONB':q(dtype);
  let def='';if(attr.includes('@default(now())'))def=' DEFAULT CURRENT_TIMESTAMP';else if(attr.includes('@default(true)'))def=' DEFAULT true';else if(attr.includes('@default(false)'))def=' DEFAULT false';else{const num=attr.match(/@default\((-?\d+)\)/);if(num)def=` DEFAULT ${num[1]}`;}
  fields.push(`    ${q(name)} ${mapped}${optional?'':' NOT NULL'}${def}`);
  if(attr.includes('@id'))fields.push(`    CONSTRAINT ${q(model.name+'_pkey')} PRIMARY KEY (${q(name)})`);
  if(attr.includes('@unique'))indexes.push(`CREATE UNIQUE INDEX ${q(model.name+'_'+name+'_key')} ON ${q(model.name)} (${q(name)});`);
 }
 stmt.push(`CREATE TABLE ${q(model.name)} (\n${fields.join(',\n')}\n);`);
}
for(const k of keys){stmt.push(`ALTER TABLE ${q(k.model)} ADD CONSTRAINT ${q(k.model+'_'+k.fields.join('_')+'_fkey')} FOREIGN KEY (${k.fields.map(q).join(',')}) REFERENCES ${q(k.related)} (${k.references.map(q).join(',')}) ON DELETE ${k.onDelete==='Cascade'?'CASCADE':k.onDelete==='SetNull'?'SET NULL':'RESTRICT'} ON UPDATE CASCADE;`);}
stmt.push(...indexes);
const output=join(process.cwd(),'prisma/migrations/20261121000100_initial/migration.sql');writeFileSync(output,stmt.join('\n\n')+'\n');
console.log(`Generated ${models.length} models, ${enums.length} enums, ${keys.length} foreign keys, ${indexes.length} indexes`);
