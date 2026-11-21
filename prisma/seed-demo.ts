import "dotenv/config";
import {readFileSync} from "node:fs";
import path from "node:path";
import {PrismaClient} from "@prisma/client";
interface Example {source:string;course:{title:string;description:string;area:string;hours:number;passingScore:number;questions:{text:string;options:string[];correct:number}[]}}
const prisma=new PrismaClient();
async function run(){const connection=process.env.DATABASE_URL??"";const pathname=(()=>{try{return new URL(connection).pathname}catch{return ""}})();if(process.env.KCJ_ALLOW_DEMO_SEED!=="1"||!/(test|demo|sandbox)/i.test(pathname))throw new Error("Prohibido cargar demostraciones en la base de operación. Necesita KCJ_ALLOW_DEMO_SEED=1 y nombre de base test/demo/sandbox.");
 const item:Example=JSON.parse(readFileSync(path.join(process.cwd(),"datos_iniciales/curso_demostracion.json"),"utf8"));const prior=await prisma.course.findFirst({where:{title:item.course.title}});if(prior){console.log("Curso de ensayo ya existe; no se duplica.");return;}const c=await prisma.course.create({data:{title:item.course.title,description:item.course.description,area:item.course.area,hours:item.course.hours,passingScore:item.course.passingScore,maxAttempts:2,published:true,questions:{create:item.course.questions.map((q,i)=>({statement:q.text,position:i+1,choices:{create:q.options.map((t,j)=>({text:t,correct:j===q.correct}))}}))}}});console.log(`Curso de ENSAYO creado ${c.id} con ${item.course.questions.length} preguntas. No equivale a capacitación oficial.`);}
run().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1}).finally(()=>prisma.$disconnect());
