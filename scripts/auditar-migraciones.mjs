import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();const schema=fs.readFileSync('prisma/schema.prisma','utf8');
const dirs=fs.readdirSync('prisma/migrations',{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name).sort();
const pieces=dirs.map(dir=>({dir,sql:fs.readFileSync(path.join('prisma/migrations',dir,'migration.sql'),'utf8')}));
const sql=pieces.map(p=>p.sql).join('\n');
const models=[...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map(x=>x[1]);
const creates=[...sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"([^"]+)"/gi)].map(x=>x[1]);
const missing=models.filter(x=>!creates.includes(x)),unexpected=creates.filter(x=>!models.includes(x));
const destructive=[];
for(const {dir,sql} of pieces){
 if(/\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE\s+TABLE|DELETE\s+FROM)\b/i.test(sql))destructive.push(dir);
}
const columns=[{table:'Worker',name:'secondaryArea',sql:'ALTER TABLE "Worker" ADD COLUMN "secondaryArea"'},{table:'PracticeQuestion',name:'correctOption',sql:'"correctOption" TEXT NOT NULL'},{table:'PracticeAttempt',name:'clientEventId',sql:'"clientEventId" TEXT NOT NULL'}];
const missingColumns=columns.filter(x=>!sql.includes(x.sql)).map(x=>x.table+'.'+x.name);
const errors=[...missing.map(x=>'modelo sin CREATE TABLE: '+x),...unexpected.map(x=>'tabla no declarada: '+x),...missingColumns.map(x=>'columna sin SQL: '+x),...destructive.map(x=>'SQL destructivo: '+x)];
const result={status:errors.length?'FALLA':'PASA',migrations:dirs.length,prismaModels:models.length,createdTables:creates.length,missing,unexpected,missingColumns,destructiveMigrations:destructive,errors,note:'Sólo estructura SQL estática; no ejecuta migraciones ni prueba datos reales.'};
console.log(JSON.stringify(result,null,2));process.exit(errors.length?1:0);
