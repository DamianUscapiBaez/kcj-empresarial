# KCJ CONTROL Empresarial — Auditoría técnica previa a la marcha blanca

**Fecha de revisión:** 21 de noviembre de 2026  
**Base analizada:** ZIP Fase 02.9 (`KCJ_CONTROL_FASE_02_9_REPARACION_CONTROLADA_COLABORADORES_2026-11-21.zip`)  
**Salida:** copia corregida para pruebas, **NO desplegada en Vercel**. No se accedió a información privada ni a PostgreSQL de producción.

## 1. Dictamen y alcance

**NO CERTIFICADO PARA PRUEBA OPERATIVA CON DATOS REALES.** Se puede organizar una **marcha blanca controlada en una base de ensayo**, únicamente después de corregir la estructura de PostgreSQL, instalar dependencias, compilar, probar credenciales y obtener aprobación de TI. La última evidencia proporcionada por el propietario mostró `P2021` (tabla `WorkArea` ausente), `P2022` (columna `Worker.secondaryArea` ausente) y estado de migración `pending_or_failed` en el diagnóstico de Colaboradores; no se conoce si esa situación cambió posteriormente.

### Ejecuciones en esta sesión

| Prueba | Resultado | Alcance |
|---|---|---|
| `npm test` | **256/256 OK** | Reglas locales; muchas pruebas inspeccionan código, NO navegación real |
| Parseo TypeScript/TSX/JS/JSX | **124 archivos, 0 errores de sintaxis** | Compilador TS usado como parser, no tipado completo |
| Importaciones internas `@/` y relativas | **Sin referencias faltantes** | Resolución estática de archivos del repositorio |
| Mapa de menú y contenido | **18 módulos con rama `case` y entrada de navegación** | Código fuente, no rendimiento ni carga real |
| `npm run verify:package` | **201 archivos SHA-256 OK** | Integridad del nuevo paquete |
| Workflow YAML (3 archivos) | **Sintaxis parseable** | No ejecutados en GitHub |
| `npm run build` | **NO se completó**: `prisma: not found` | No hay dependencias instaladas y no hay acceso a `registry.npmjs.org` (`EAI_AGAIN`) |
| `npm run typecheck` | **No concluyente**: falta `next`, `react` y `@prisma/client` | Errores de módulos ausentes; no considerar tipado validado |
| Migraciones PostgreSQL | **NO ejecutadas** | Sin acceso autorizado a base de ensayo o producción |
| Alta de trabajador y cuenta + inicio de sesión | **NO validada de extremo a extremo** | Incorporado guion de integración para ensayo, aún sin ejecutar |
| Navegación con Chromium de 18 módulos y rol real | **NO ejecutada** | No hay servidor Next levantado con base y credenciales de ensayo |

## 2. Correcciones aplicadas a esta copia

1. **Centro de Control — alta de cuentas:** nuevo formulario con selección de función, vínculo laboral obligatorio para Conductor, propietario obligatorio para PROPIETARIO, confirmación de contraseña y mensajes claros de prerrequisitos. Se evita presentar simultáneamente dos vínculos que no corresponden al perfil.
2. **Servidor — altas de cuentas:** verificación de usuario existente, ficha laboral activa, vinculación previa de esa ficha con otra cuenta y propietario existente; se crea usuario y auditoría en **una misma transacción**, evitando cuentas creadas sin registro de auditoría por fallos parciales.
3. **Autenticación:** rechazo de inicio de sesión y de sesiones existentes si la cuenta está vinculada a una ficha laboral inactiva. Es un control adicional al bloqueo administrativo.
4. **Aula Virtual:** mensaje de estado vacío para instructores y participantes cuando no hay cursos disponibles. Antes una lista vacía podía dejar solo el encabezado sin explicación.
5. **Pruebas:** cuatro comprobaciones estáticas adicionales para la cobertura de los 18 módulos, estados vacíos, creación de usuarios y personal inactivo.
6. **PostgreSQL de ensayo:** nuevo `scripts/prueba-cuentas-ensayo.ts`, activado en `.github/workflows/validacion.yml`; prueba relación trabajador → cuenta → función adicional CONDUCTOR → sesión, comprueba contraseña y revocación; todo dentro de una transacción revertida. Solo puede ejecutarse con bandera de ensayo y nombre de BD compatible (`test`, `ensayo`, `staging` o `qa`). **No ha sido ejecutado contra una base real en esta sesión**.

No se cambiaron migraciones históricas, no se borraron registros, no se actualizó la base productiva y no se desplegó nada.

## 3. Revisión estática módulo por módulo

**Importante:** “Interfaz encontrada” no equivale a “probado en navegador”. Los perfiles de consulta pueden no tener botones de alta por diseño de permisos.

| Módulo | Interfaz/función ubicada en el código | Verificación restante |
|---|---|---|
| 01. Centro de Control / Usuarios | Alta, edición, recuperación, activación, desactivación, permisos adicionales, listado. **Formulario de alta mejorado** | Alta auténtica, duplicados, restablecimiento, dos paneles, revocación de sesiones |
| 02. Colaboradores | Ficha única, área principal/secundaria, estado laboral, catálogo de áreas, listado; modo consulta por migración faltante | **BLOQUEADOR**: `WorkArea` y `secondaryArea`; crear/editar con PostgreSQL real |
| 03. Operaciones / Servicios | Crear y asignar servicios, consultar, acciones de operación | Validar conflictos de unidad, horario, conductor, disponibilidad y permisos |
| 04. ROSTER | Formulario de programación y tabla de guardias/descansos | Turnos nocturnos, cruces, publicación y permisos |
| 05. KCJ CONNECT | Mis servicios, mis guardias, inspecciones, pausas y reportes | Prueba conductor con móvil, cámara, acceso propio y sincronización offline |
| 06. Flota | Registro de unidad, documentos, odómetro, ficha ampliada/checklist | Ver documentos y checklist con varios tipos de unidad; permisos y evidencia S3 |
| 07. Mantenimiento | Apertura de OT, listado y liberación técnica condicionada | Registrar y cerrar OT con evidencia sin liberar unidad de modo indebido |
| 08. SSOMA | Registro de casos, acciones, verificación, cierre y reapertura | Prueba de cierre técnico, trazabilidad y permisos |
| 09. Homologaciones externas | Habilitaciones / Tarjeta Amarilla y consulta | Requisitos externos reales y fechas; no confundir con simulacros |
| 10. Tareo general | Registro, consulta y validación RR.HH. | Horas reales, origen, guardias y no duplicación |
| 11. Aula Virtual | Crear curso/preguntas/material, publicar, convocar, asistencia y responder; **estado vacío agregado** | Material opcional y simulacros TECSUP/MMG aún no constituyen una sección específica implementada |
| 12. Recursos Humanos | Contratos y seguimiento documental | Privacidad de expedientes y ciclo laboral completo |
| 13. Salud Ocupacional | Aptitud operacional y consulta restringida | Permisos de datos sensibles y vigencia |
| 14. Propietarios | Registro y consulta de unidades vinculadas | Propietario solo ve unidades propias |
| 15. Comunicaciones | Publicar, versionar y confirmar lectura | Destinatarios efectivos, versión individual y permisos |
| 16. Reportes | Indicadores, auditoría y exportaciones CSV | Calidad de datos, filtros, PDF/Excel esperados y acceso |
| 17. Entrega y recepción | Listado/actas por unidad, fotos, firmas, impresión PDF desde navegador | Foto/firmas táctiles en equipos reales, almacenamiento, acta histórica |
| 18. Almacén y herramientas | Alta de artículos, movimientos y existencias | Stock, asignación EPP y permisos compartidos |

**Navegación y submenús:** el menú reagrupa los 18 slugs en siete secciones, y cada slug tiene una rama de contenido. No se encontraron submenús del catálogo enlazados a una ruta de módulo inexistente; sí hay contenido condicionado por roles y datos y no se pudo comprobar carga visual real. No se debe concluir “sin pantallas en blanco” para producción a partir de la estructura estática.

## 4. Prioridades obligatorias antes de la marcha blanca

### P0 — bloquear si no se resuelve

- **PostgreSQL Colaboradores:** último diagnóstico confirma `WorkArea` y `Worker.secondaryArea` faltantes. TI debe identificar BD, respaldar y probar restauración, revisar estado de todas las migraciones pendientes/fallidas, y aplicar únicamente tras ensayo y autorización. `migrate deploy` aplica **todas** las pendientes, no solo la 007. **No ejecutar `migrate reset`, `db push` o scripts sobre producción sin control.**
- **Compilación y tipado:** instalar dependencias desde un registro confiable, generar cliente Prisma, ejecutar `npm run typecheck` y `npm run build` en CI; no dar aprobación si falla cualquiera. Recomendable generar/guardar `package-lock.json` para instalación reproducible.
- **Usuarios de ensayo:** crear trabajador ficticio, crear cuenta vinculada, ingresar con ella, probar roles Conductor/Administrativo, volver a iniciar sesión y comprobar permisos y revocación. Hacer pruebas en BD de ensayo; no crear trabajadores ficticios en producción.

### P1 — críticos por área

- Conductor: Mis Servicios, permisos, fotos, pausas e inspección real en móvil.
- Operaciones: asignar unidad habilitada, registrar horario y controlar restricciones.
- SSOMA / Mantenimiento: sólo el perfil autorizado cierra y libera.
- Recursos Humanos: acceso mínimo al expediente y validación de Tareo.
- TI: `GET /api/health` debe indicar `schema: ready`, `/api/diagnostico/colaboradores` en sesión ADMIN debe informar `status: ok`.

## 5. Orden recomendado de verificación en entorno de ensayo

Desde la carpeta raíz del proyecto, después de preparar una base aislada con respaldo:

```bash
npm install --no-audit --no-fund
npx prisma validate
npx prisma generate
npx prisma migrate status
# SOLO tras revisar migraciones y respaldo y aprobar su aplicación en ensayo:
npx prisma migrate deploy
npm run db:verify
npm run db:integration
npm run db:integration:cuentas
npm test
npm run typecheck
npm run build
```

Para los scripts de integración, establecer `KCJ_INTEGRATION_TEST_DB=1` **solo** en la base aislada de ensayo. La prueba de cuentas verifica que el nombre de base identifique ensayo. El proyecto no debe conectarse nunca a la BD de producción al correr pruebas que escriben y revierten datos.

## 6. Decisión sobre la marcha blanca de mañana

**Recomendación técnica: NO iniciar pruebas de registro de trabajadores/usuarios con datos reales sin confirmar migración y compilación.** Si no se pueden completar antes de la reunión, realizar solo una demostración de pantallas y permisos con datos ficticios en un entorno separado; levantar incidencias en una matriz y no interpretar las 256 pruebas locales como una homologación de producción.

### Criterios mínimos de aprobación de usuarios

- ADMIN puede ingresar al Centro de Control.
- `Colaboradores` no presenta banner de modo consulta y permite registrar ficha de ensayo con área principal y secundaria.
- Al crear cuenta CONDUCTOR, `workerId` es obligatorio; intento con trabajador ya vinculado es rechazado sin duplicación.
- Cuenta activa de ensayo inicia sesión, tiene sólo sus permisos y no ve datos de terceros.
- Cuenta con funciones OPERACIONES + CONDUCTOR ve **1. Administrativo** y **2. Conductor**, cambia sin cerrar sesión.
- Tras desactivar ficha o cuenta, ningún acceso ni sesión anterior continúa funcionando.

**Estado de cierre de esta auditoría:** código corregido y pruebas locales aprobadas; compilación Next, tipado completo, migraciones PostgreSQL, login real, navegación visual de todos los perfiles y producción **no certificados**.
