import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
const root=process.cwd();const text=readFileSync(path.join(root,"MANIFIESTO_SHA256.txt"),"utf8");let count=0;
for(const line of text.trim().split(/\r?\n/)){const m=line.match(/^([a-f0-9]{64})  (.+)$/);if(!m)throw new Error("Línea de manifiesto inválida");const p=path.resolve(root,m[2]);if(!p.startsWith(root+path.sep)||!existsSync(p))throw new Error(`Archivo ausente o fuera del proyecto: ${m[2]}`);const got=createHash("sha256").update(readFileSync(p)).digest("hex");if(got!==m[1])throw new Error(`Archivo modificado: ${m[2]}`);count++;}
console.log(`OK - ${count} archivos de código y documentación verificables.`);
