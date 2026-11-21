# KCJ CONTROL — Correcciones de auditoría y entrega a TI

**Fecha:** 21 de noviembre de 2026  
**Base técnica:** `KCJ_CONTROL_PALETA_CORPORATIVA_CONTRASTE_MEJORADO_TI_2026-11-21.zip` (copia del ZIP; original conservado)  
**Informe base:** `Auditoria_KCJ_CONTROL_2026-11-21(1).pdf`, 9 páginas.  
**Condición del paquete:** código fuente CORREGIDO PARCIALMENTE, **NO certificado para producción ni para depender exclusivamente del sistema**.

## A. Correcciones desarrolladas en este paquete

| ID | Hallazgo | Cambio implementado en el código | Verificación posible |
|---|---|---|---|
| C01 | Una persona con múltiples funciones | `UserRoleGrant` adicional a `User.role`, alta/revocación solo ADMIN, auditoría y revocación de sesiones; mantiene ficha y cuenta únicas | Pruebas de estructura; **pendiente prueba de autenticación real y permisos** |
| C02 | Roles no coherentes entre módulos | Navegación, Server Actions principales, exportaciones y adjuntos consideran funciones adicionales autorizadas; `PROPIETARIO` se muestra «Propietario vehicular» sin renombrar enum ni cuentas | Revisión de código; **pendiente pruebas por rol real** |
| C03 | Habilitación minera no verifica destino | Se agregó `Service.mineScope` y comparación exacta normalizada con `Clearance.scope` del conductor y de la unidad; requiere mina en un servicio minero nuevo | Pruebas de ámbito distinto, vacío e igual; **pendiente PostgreSQL/servicios** |
| C04 | Devolución habilita anticipadamente vehículo | Una recepción queda pendiente hasta conformidad técnica y SSOMA, con marcas e historial separadas; se bloquea la disponibilidad mientras falten | Pruebas de reglas; **pendiente validar secuencia de custodia en PostgreSQL** |
| C05 | Aula Virtual incompleta | Materiales por curso, confirmación por participante, dos intentos **por ciclo**, refuerzo autorizado sin borrar intentos, versión nueva preservando anterior y cursos sin examen con asistencia/material | Pruebas de estructura; **pendiente prueba funcional de roles, notas, certificados y HHC** |
| C06 | Botón Desactivar sobre ADMIN actual | Ya no aparece sobre la fila de la propia cuenta, sin quitar la validación en servidor | Inspección de interfaz fuente |
| C07 | Avisos técnicos innecesarios | Se retiró texto sobre Prisma/JSON del panel de acceso; encabezados de módulos usan lenguaje de empresa | Inspección de TSX |
| C08 | Reportes con enlaces no autorizados | Los enlaces de CSV se muestran únicamente a funciones habilitadas; la ruta sigue verificando el tipo de exportación en servidor | Revisión estática; **pendiente descargar y validar CSV reales** |
| C09 | Formulario CONNECT de incidentes | Título corregido para tres categorías y campo opcional de evidencia privada; backend verifica existencia/tipo del adjunto | Revisión estática; **notificación y offline aún pendientes** |

**Compatibilidad:** la migración `20261121000200_auditoria_segura` es **aditiva**; no contiene DROP/TRUNCATE/DELETE y no borra registros históricos. Sin embargo, sigue siendo obligatoria su prueba sobre una copia de PostgreSQL real antes de producción. En servicios mineros anteriores sin `mineScope`, el nuevo control bloqueará asignaciones hasta revisar el alcance: es una medida preventiva intencional.

## B. Funciones NO completadas — no afirmar que se corrigieron

1. **KCJ CONNECT offline real:** IndexedDB/PWA, recuperación después de cerrar la aplicación, cola de fotos, reintentos idempotentes y reconciliación en teléfono real. El backend mantiene identificadores idempotentes para parte de sus eventos, pero la experiencia offline completa aún no está implementada.
2. **Inspección itemizada y verificada por tipos de vehículo:** alarmas visual y sonora por separado, neumáticos por posición, botiquín, extintor, DVR/GPS, procedimientos/formularios oficiales; todavía se necesitan datos de checklist y pruebas de SSOMA.
3. **Entrega y recepción detalladas:** inventarios con cantidades, diferencias y firmas independientes; esta corrección agrega solo bloqueo y dos conformidades posteriores.
4. **Catálogo editable de cargo y área:** los formularios de Personal aún contienen campos libres; deben conectarse a catálogos corporativos aprobados, sin convertir Flota, Homologación, ROSTER y Almacén en departamentos.
5. **Reportes PDF/Excel**, filtros por período, versiones institucionales y validación completa de HHT/HHC; hoy existen CSV y agregados parciales.
6. **Concurrencia real** de asignación de servicios, turnos y custodia y condiciones de carrera bajo PostgreSQL; las pruebas de estructura no sustituyen una prueba concurrente.
7. **Integración y firma de evidencia real** con S3, reportes, acuses, certificados/QR y privacidad con usuarios de diferentes áreas.
8. **Verificación de Vercel y versión desplegada**: falta comparar el commit del sitio publicado con el proyecto entregado y repetir la auditoría sobre esa misma versión.

## C. Pruebas ejecutadas en el entorno de preparación

- `npm test`: **86/86 aprobadas** (unitarias + pruebas de presencia/estructura). Son pruebas locales, no integración real.
- Análisis sintáctico TypeScript de `app/`, `components/`, `lib/`, `prisma/`, `scripts/`, `tests/`: **51 archivos analizados y 0 errores de sintaxis**. No equivale a `tsc --noEmit` ni a compilación.
- Acceso a registro npm (`npm ping`): **falló con EAI_AGAIN**, impidiendo instalar dependencias.
- **NO ejecutados aquí:** `prisma validate`, `prisma generate`, `prisma migrate deploy`, `db:seed`, `db:integration`, `typecheck`, `next build` y E2E sobre navegador con PostgreSQL.

## D. Instrucciones de validación para TI (obligatorias antes de Vercel)

1. Hacer copia verificada de PostgreSQL productivo y archivos privados, registrar versión y fecha. Nunca `migrate reset` ni `db push --force-reset` en producción.
2. Crear un PostgreSQL **de ensayo aislado** y establecer `DATABASE_URL` allí. Usar `.env.example` solo como referencia, **no publicar secretos en GitHub**.
3. Instalar Node.js >=22 y dependencias: `npm install`. Confirmar que la instalación acaba correctamente. Crear `package-lock.json` y versionarlo tras revisión; después las automatizaciones pueden usar `npm ci`.
4. Ejecutar:

   ```bash
   npx prisma validate
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run db:verify
   npm run db:check-login
   npm test
   npm run typecheck
   npm run build
   npm run dev
   ```

   Configurar las variables secretas de administrador indicadas en `.env.example`. El seed no inventa personal ni vehículos. `db:migrate` debe aplicarse **antes de ejecutar el código nuevo** porque la sesión consulta la tabla `UserRoleGrant`.
5. Ejecutar pruebas **con datos ficticios**, **rol por rol**, y conservar capturas y resultados: cuenta+función adicional/revocación, servicio de una mina versus credencial de otra, recepción pendiente y sus dos verificaciones, curso con material y asistencia, dos desaprobaciones, refuerzo, certificado e HHC, exportaciones autorizadas/denegadas.
6. Comprobar operación de adjuntos S3 y restauración desde backup. Mantener separados ensayo y producción.
7. Solo después promover a Vercel mediante control de cambios, observación de logs y un plan de reversión.

## E. Alcance del código entregado

Este archivo contiene **código fuente editable**, con Next.js App Router, React TSX, Tailwind, Prisma/PostgreSQL, pruebas y migración incremental. **No incluye datos reales de KCJ.** No se ha alterado el servidor de Vercel, PostgreSQL, el repositorio de GitHub ni las cuentas de la empresa. El ZIP de origen permanece intacto.
