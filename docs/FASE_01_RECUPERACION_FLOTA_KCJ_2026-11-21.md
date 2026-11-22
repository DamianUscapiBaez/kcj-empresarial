# KCJ CONTROL — Inicio de reconstrucción funcional · Etapa 01

**Fecha:** 21 de noviembre de 2026  
**Empresa:** KCJ PERÚ S.A.C.  
**Referencia:** Documento Maestro KCJ CONTROL 3.1, auditorías funcional y visual del 21/11, decisiones posteriores sobre flota, guardias, propietarios y Línea de Mando.  
**Base del código:** KCJ_CONTROL_COLABORADORES_DOS_AREAS_Y_CATALOGO_TI_2026-11-21.zip.  
**Destino:** desarrollo/ensayo; **NO publicar sin revisión de TI**.

## 1. Alcance real desarrollado (código, NO producción)

| Requisito | Implementado en esta fase | Qué quedó pendiente |
|---|---|---|
| Ficha única por unidad | Ruta `/dashboard/ficha-vehicular/[id]`, vinculada al ID real; color, VIN/serie, número de motor, código Las Bambas, propietario, marca, modelo, código y placa | Versionado de todos los atributos, validación documental completa y campos contratista/Webcontrol configurables |
| Cuatro clases de unidades | CAMIONETA, MICROBUS, MINIBUS, OMNIBUS; se conservan códigos anteriores y sus vínculos | Ajustar cada lista de chequeo a número real de ejes/configuración, ruta, cliente y contrato |
| Inventario de equipamiento | Nuevo modelo `VehicleEquipment`, código único por vehículo+ítem, cantidad esperada y real, condición, prueba funcional, serie, evidencia privada, observación; actualización auditada | Plantilla de cantidades y equipos específicos de cada vehículo; movimientos de custodia comparables |
| Inspección estructurada Flota | `VehicleChecklist` con versión de plantilla, contexto, resultado por ítem, observaciones, evidencia general, auditoría e historial inmutable de inspecciones | Fotos por cada ítem, mantenimiento de plantillas por KCJ y validación en celular real |
| Inspección diaria KCJ CONNECT | Usa el mismo catálogo, requiere conductor/servicio/unidad, ventana temporal, estado calculado en el servidor, idempotencia y caso crítico SSOMA | Trabajo offline, sincronización, accesibilidad móvil y pruebas reales de desempeño |
| Tarjeta Amarilla | Se presenta en la misma ficha de la unidad recuperando las `Clearance` existentes; referencia y emisión nuevas; vigencia, ámbito, verificación y evidencia | Exigibilidad por operación minera y validación de toda la ventana en ensayos de integración; validación con fuentes externas |
| Custodia | Historial de actas existentes visible desde ficha única | **NO completado:** actas diferenciadas, snapshots de inventario al entregar/recibir, km/fotos de ambos extremos, combustible, comparación de faltantes/daños y firmas verificadas |
| Hallazgos críticos | Registra caso SSOMA abierto al detectar `NO_CONFORME` en componente crítico; la asignación existente considera casos críticos abiertos | Pruebas de bloqueo transaccional y notificación en infraestructura real |
| Evidencias | En las acciones nuevas se comprueba finalidad, verificación y autor de la carga | Auditar y corregir control de propiedad de evidencias en todas las acciones heredadas |

### Criterio fundamental
`Flota` es el registro maestro de cada unidad. `Homologación` es una función documental gestionada por Operaciones, no un departamento nuevo. `Entrega y recepción` debe utilizar la ficha y el inventario de la misma unidad, no crear duplicados. Se conserva la **navegación Propuesta B** y la denominación visible **Centro de Control** donde ya se aplicó.

## 2. Qué cambió exactamente

- **Prisma:** `Vehicle` agrega `color`, `vin`, `engineNumber`, `mineCode`, relaciones a equipamiento y checklists; `Clearance` agrega `issuedAt`, `reference`; `Inspection` agrega `serviceId` y `templateVersion`. Nuevos modelos `VehicleEquipment`, `VehicleChecklist`.
- **Migración aditiva:** `prisma/migrations/20261121000800_ficha_vehicular_equipamiento_checklist/migration.sql`, sin `DROP TABLE`, `TRUNCATE` ni borrado de datos existentes.
- **Server actions:** `app/actions-vehiculos.ts` (ficha, inventario, revisión), actualización de `app/actions-operativas.ts` (campos de vehículo y Tarjeta Amarilla), `app/actions-aula.ts` (checklist de conductor ligado al servicio), `lib/evidencias.ts` (validación de evidencia con dueño).
- **Pantallas:** `app/dashboard/ficha-vehicular/[id]/page.tsx` y `components/dominio/ChecklistUnidadForm.tsx`. En Flota aparece `Ver ficha y checklist`. En CONNECT el formulario de inspección general se sustituyó por uno detallado por componente y servicio.
- **Catálogo de referencia:** `lib/vehiculos-integrados.ts`, basado en familias de la tabla 9.2 del Documento Maestro. Es un punto de partida; **NO debe considerarse aprobado por SSOMA ni por la mina** sin revisión de cada clase y contrato.

## 3. Pruebas ejecutadas y límites

- `npm test`: **202 pruebas locales aprobadas / 0 fallidas** (incluye pruebas preexistentes y reglas nuevas, algunas pruebas estáticas de estructura).
- Análisis sintáctico TypeScript/TSX: **90 archivos, 0 errores de sintaxis** (esto no equivale a una compilación completa).
- `npm run typecheck`: **NO acreditado**. Este entorno no dispone de `node_modules` con Next, Prisma, tipos Node y React. La ejecución de `tsc` informó módulos ausentes, por lo que sus diagnósticos no representan una validación de tipos completa.
- **No ejecutado:** `prisma validate`, `prisma generate`, `next build`, migración en PostgreSQL, pruebas end-to-end, móviles, pruebas S3, seguridad, integración, regresión del despliegue.
- No se usaron credenciales de producción ni se tocó Vercel ni la base real.

## 4. Procedimiento obligatorio para el área de TI

1. Identificar el commit exacto desplegado en Vercel y respaldar su código, variables y base de datos de producción.
2. Extraer este proyecto **en ambiente staging**, con una base PostgreSQL **aislada** y un almacenamiento privado de pruebas.
3. Revisar el diff y resolver conflictos con commits que TI pudiera haber publicado después del ZIP base.
4. Instalar dependencias declaradas en `package.json` (`npm install` si no hay lockfile reproducible); generar/guardar lockfile en Git.
5. Configurar secretos mediante variables de entorno, sin compartirlos por chat ni incluirlos en el ZIP.
6. Ejecutar `npx prisma validate`, `npx prisma generate`, `npx prisma migrate deploy`, `npm run typecheck`, `npm test` y `npm run build`. Corregir cualquier error antes de publicar.
7. Probar creación de una unidad ficticia de cada uno de los cuatro tipos; registrar inventario, checklist conforme y crítico; verificar bloqueo SSOMA, trazabilidad y persistencia después de cerrar sesión.
8. Probar como CONDUCTOR con servicio ficticio asignado; rechazar servicio ajeno y duplicado de evento; probar cruce de medianoche, evidencia privada y ausencia de red en futuras etapas.
9. Confirmar Tarjeta Amarilla en la ficha asociada y evitar autorizaciones mineras incorrectas. Revisar permisos de Operaciones/SSOMA/Mantenimiento y propietario.
10. Aprobar formalmente con Operaciones y SSOMA; desplegar versión conocida, monitorear, documentar plan de reversión. **Nunca ejecutar `prisma migrate reset` en producción.**

## 5. Próximas fases prioritarias (sin declararlas hechas)

- **02 · Custodia y entrega/recepción:** fotografías, km inicial/final, combustible, inventario de salida y recepción, comparación de diferencias, actas con firma y revisión posterior; integración con Flota y Mantenimiento.
- **03 · Operaciones / ROSTER / disponibilidad:** transacciones concurrentes, requisitos completos de minas, cambios de unidad por tramos, alertas y homologación personal.
- **04 · Colaboradores y Centro de Control:** alta única colaborador+cuenta, DNI usuario, clave segura automática de 8 caracteres y control administrativo de permisos; no duplicar cuentas.
- **05 · Módulos restantes:** SSOMA, Salud, RR.HH., Aula Virtual, Tareo, Almacén, Comunicaciones, propietarios, informes y documentos PDF corporativos con logo original. Matriz de aceptación de 18 módulos.
- **Después:** PWA instalable, modo offline y sincronización (la prioridad actual es la web en Google Chrome).

**Dictamen:** primer incremento de desarrollo listo para revisión de código y pruebas en staging. **NO está listo para publicar ni para reemplazar los controles oficiales de KCJ** sin las pruebas anteriores.
