import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { scryptSync, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
const prisma = new PrismaClient();
const catalogos: {empresa:string; areas:string[]; categoriasSSOMA:string[]; tiposUnidad:string[]} = JSON.parse(readFileSync(path.join(process.cwd(),"datos_iniciales/catalogos.json"),"utf8"));
function hash(password:string):string {const salt=randomBytes(16).toString("hex");return `scrypt:${salt}:${scryptSync(password,salt,64).toString("hex")}`;}
async function run():Promise<void> {
  const login=process.env.KCJ_ADMIN_DOCUMENT?.trim();
  const name=process.env.KCJ_ADMIN_NAME?.trim();
  const password=process.env.KCJ_ADMIN_PASSWORD;
  if (!login || !name || !password || password.length < 16) throw new Error("Configure KCJ_ADMIN_DOCUMENT, KCJ_ADMIN_NAME y KCJ_ADMIN_PASSWORD (mínimo 16 caracteres).");
  const existing=await prisma.user.findUnique({where:{login}});
  if (existing) {
    if (existing.role !== Role.ADMIN) throw new Error("El usuario ya existe con otra función: intervención manual requerida.");
    console.log("Administrador ya existe; no se sobrescribe su contraseña ni la información.");
  } else {
    await prisma.user.create({data:{login,displayName:name,passwordHash:hash(password),role:Role.ADMIN,active:true,mustChangePassword:false}});
    console.log("Cuenta inicial creada. Puede ingresar con la contraseña configurada.");
  }
  console.log(`Catálogos de referencia leídos desde JSON (no importados como filas): ${catalogos.empresa}; ${catalogos.areas.length} áreas. Los catálogos no crean trabajadores ni unidades ficticias.`);
}
run().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1}).finally(()=>prisma.$disconnect());
