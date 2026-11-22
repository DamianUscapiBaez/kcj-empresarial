import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
const forms=read("components/ui/fields.tsx");
const content=read("components/dominio/ContenidoModulo.tsx");
const uploader=read("components/ui/EvidenceUploader.tsx");

test("ADMIN: selector requerido sin datos bloquea únicamente su formulario",()=>{
 assert.match(forms,/f\.type==="select"&&f\.required&&!f\.options\?\.length/);
 assert.match(forms,/disabled=\{blocked\}/);
 assert.match(forms,/f\.options\?\.length/);
 assert.match(forms,/este aviso solo afecta a este formulario/);
});
test("ADMIN: selector opcional vacío no bloquea y explica el vínculo",()=>{
 assert.match(forms,/&&f\.required/);
 assert.match(forms,/!f\.required&&<span/);
 assert.match(forms,/Opcional: puedes continuar sin este vínculo/);
});
test("ADMIN: tablas vacías no instruyen usar formularios no autorizados",()=>{
 assert.doesNotMatch(forms,/Utiliza el formulario correspondiente para registrar información/);
 for(const title of ["Servicios","Programaciones (ROSTER ≠ Tareo)","Contratos y vigencias","Historial de custodia","Aptitud de trabajadores"]){
  assert.ok(content.includes(`title="${title}" emptyMessage=`),title);
 }
});
test("ADMIN: no se expone desactivación de la cuenta propia",()=>{
 assert.match(content,/x\.id===user\.id\?<span/);
 assert.match(content,/Tu cuenta · protegida/);
});
test("ADMIN: comunicación diferencia publicación y destinatarios",()=>{
 assert.match(content,/submit="Publicar comunicado"/);
 assert.match(content,/Todos los usuarios autorizados \(comunicado general\)/);
 assert.match(content,/Cada nueva versión requiere una confirmación independiente/);
});
test("ADMIN: Flota, Almacén, Personal y Aula explican sus acciones",()=>{
 for(const title of ["Registrar unidad","Registrar artículo","Crear curso","Registrar documento"]){
  assert.ok(content.includes(`submit="${title}"`),title);
 }
 assert.match(read("components/dominio/FormulariosColaborador.tsx"),/Registrar colaborador/);
});
test("ADMIN: campos de fecha contextualizan formato y horario sin prometer formato del navegador",()=>{
 assert.match(forms,/lang="es-PE"/);
 assert.match(forms,/configuración del navegador/);
 assert.match(forms,/UTC−05:00/);
});
test("ADMIN: evidencia ofrece botones legibles y estado de carga, no mensaje técnico S3",()=>{
 assert.match(uploader,/Seleccionar PDF o imagen/);
 assert.match(uploader,/Tomar foto/);
 assert.match(uploader,/Subir foto desde galería/);
 assert.match(uploader,/role="status"/);
 assert.doesNotMatch(uploader,/Se requiere un almacenamiento privado S3 configurado/);
});
test("ADMIN: formulario de personal ocupa toda la anchura en su padrón",()=>{
 assert.match(content,/lg:grid-cols-2/);
 assert.match(content,/DataTable title="Padrón de colaboradores"/);
});
test("ADMIN: el logo original y los permisos de procesos se conservan",()=>{
 assert.match(read("app/login/page.tsx"),/<KcjLogo/);
 assert.match(read("components/ui/KcjLogo.tsx"),/kcj-logo-original\.jpg/);
 assert.match(content,/tieneRol\(user,"SALUD"\)&&<RecordForm/);
 assert.match(content,/tieneRol\(user,"OPERACIONES","JEFE_OPERACIONES"\)&&<RecordForm title="Programar guardia/);
});
test("Diagnóstico de esquema considera todas las migraciones, sin consultar ni modificar la base real",()=>{
 const diag=read("scripts/diagnostico-estructura.mjs");
 assert.match(diag,/readdirSync\(migrationsRoot/);
 assert.match(diag,/tablesAcrossMigrations/);
 assert.match(diag,/NO VERIFICA POSTGRESQL/);
 assert.doesNotMatch(diag,/const sql=read\('prisma\/migrations\/20261121000100_initial/);
});

test("Verificador del ZIP acepta cabecera del manifiesto sin omitir hashes",()=>{
 const src=read("scripts/verificar-paquete.mjs");
 assert.match(src,/line\.startsWith\(\"#\"\)/);
 assert.match(src,/got!==m\[1\]/);
});
