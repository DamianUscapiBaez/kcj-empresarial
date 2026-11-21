import "dotenv/config";
import {randomUUID} from "node:crypto";
import {PrismaClient,Prisma} from "@prisma/client";
const prisma=new PrismaClient();
class RollbackTest extends Error{}
async function main(){
 if(process.env.KCJ_INTEGRATION_TEST_DB!=="1")throw new Error("Seguridad: sólo ejecutar con KCJ_INTEGRATION_TEST_DB=1 sobre PostgreSQL de pruebas.");
 let validated=false;
 try{await prisma.$transaction(async tx=>{
  const tag=randomUUID().slice(0,8).replaceAll("-","").toUpperCase();
  const w=await tx.worker.create({data:{document:`E2E${tag}`,name:"Personal de prueba de integración",job:"Conductor",area:"Operaciones",license:"TEST",licenseExpires:new Date("2028-11-01")}});
  const v=await tx.vehicle.create({data:{code:`T${tag}`,plate:`K${tag}`,type:"Camioneta"}});
  const docs=await tx.vehicleDocument.createMany({data:[{vehicleId:v.id,kind:"SOAT",expiresAt:new Date("2028-01-01"),verifiedAt:new Date()},{vehicleId:v.id,kind:"REVISION_TECNICA",expiresAt:new Date("2028-01-01"),verifiedAt:new Date()}]});if(docs.count!==2)throw new Error("Documentos no insertados");
  await tx.medicalFitness.create({data:{workerId:w.id,status:"APTO",validUntil:new Date("2028-01-01"),reviewedBy:"integracion"}});
  await tx.clearance.create({data:{workerId:w.id,kind:"CONDUCTOR_MINA",validUntil:new Date("2028-01-01"),verified:true}});
  const roster=await tx.roster.create({data:{workerId:w.id,kind:"GUARDIA",startsAt:new Date("2027-01-01"),endsAt:new Date("2027-01-15"),status:"PUBLICADO",createdBy:"integracion"}});
  const service=await tx.service.create({data:{code:`S${tag}`,customer:"TEST",route:"Cusco - ruta de ensayo",startsAt:new Date("2027-01-02"),endsAt:new Date("2027-01-03"),workerId:w.id,vehicleId:v.id,status:"ASIGNADO"}});
  const work=await tx.workOrder.create({data:{vehicleId:v.id,issue:"Inspección ficticia",critical:true}});
  const safety=await tx.safetyCase.create({data:{reference:`T-${tag}`,category:"Inspección",severity:"CRITICA",title:"Caso de ensayo",details:"Comprobación técnica de integración",vehicleId:v.id}});
  const corrective=await tx.safetyAction.create({data:{caseId:safety.id,description:"Corregir y verificar",responsible:"SSOMA TEST",dueAt:new Date("2027-01-03")}});
  const course=await tx.course.create({data:{title:"Cuestionario de integración",description:"No se utiliza en operación",hours:2,published:true}});
  const question=await tx.question.create({data:{courseId:course.id,statement:"Prueba de seguridad",position:1}});
  await tx.choice.createMany({data:[{questionId:question.id,text:"Correcta",correct:true},{questionId:question.id,text:"Incorrecta",correct:false}]});
  const enrollment=await tx.enrollment.create({data:{courseId:course.id,workerId:w.id,attendedAt:new Date()}});
  await tx.quizAttempt.create({data:{enrollmentId:enrollment.id,sequence:1,score:100,passed:true,responses:{[question.id]:"correcta"}}});
  await tx.enrollment.update({where:{id:enrollment.id},data:{approvedAt:new Date(),score:100,certificateCode:`KCJ-${randomUUID().replaceAll("-","").slice(0,24).toUpperCase()}`}});
  const inv=await tx.inventoryItem.create({data:{sku:`SKU-${tag}`,name:"Inventario de ensayo",unit:"unidad",quantity:2}});
  await tx.stockMovement.create({data:{itemId:inv.id,delta:-1,reason:"Prueba de movimiento",actorId:"integracion"}});
  const a=await tx.announcement.create({data:{title:"Mensaje de integración",body:"Sólo para comprobar transacciones"}});
  const found=await tx.worker.findUniqueOrThrow({where:{id:w.id},include:{services:true,rosters:true,enrollments:true}});
  if(found.services[0]?.id!==service.id||found.rosters[0]?.id!==roster.id||found.enrollments[0]?.id!==enrollment.id||!question||!work||!corrective||!a)throw new Error("Relaciones no persistieron");
  validated=true;
  // Rollback de todo el escenario: el test nunca debe dejar datos de prueba.
  throw new RollbackTest();
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:20000});
 }catch(e){if(!(e instanceof RollbackTest))throw e;}
 if(!validated)throw new Error("Escenario de integración no completado");
 console.log("PRUEBA INTEGRADA OK: PostgreSQL insertó y relacionó trabajadores, flota, ROSTER, servicios, SSOMA, Aula y almacén; transacción revertida sin datos ficticios persistentes.");
}
main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1}).finally(()=>prisma.$disconnect());
