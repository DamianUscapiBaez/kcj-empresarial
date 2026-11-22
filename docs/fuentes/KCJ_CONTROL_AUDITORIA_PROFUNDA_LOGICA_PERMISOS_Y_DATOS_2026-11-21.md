# KCJ CONTROL — Auditoría profunda de lógica, conexiones entre módulos y datos

**Empresa:** KCJ PERÚ S.A.C.  
**Fecha de revisión:** 21 de noviembre de 2026  
**Fuente exacta:** `KCJ_CONTROL_LINEA_DE_MANDO_PAUSAS_ACTIVAS_Y_REVISION_NAVEGACION_2026-11-21.zip`  
**Versión declarada en package.json:** `1.0.1-piloto-auditoria`  
**Modalidad:** análisis estático y pruebas de Node sobre una copia local, **sin acceso a producción ni modificación de datos reales**.

## 1. Dictamen

**NO APROBAR TODAVÍA LA MARCHA BLANCA COMO SISTEMA ÚNICO DE REGISTRO.** Los menús están declarados, pero existen controles de servidor incompletos, procesos no atómicos y diferencias entre los datos que un módulo registra y los que otro necesita. Se identificaron **17 observaciones reproducibles por inspección estática** (no equivale a 17 fallas explotadas en ejecución); varias representan riesgos cuya manifestación exige pruebas concurrentes o de integración.

**Resultados de verificaciones:** `npm test`: **91/91 aprobadas**; `node scripts/auditar-navegacion.mjs`: **18/18 módulos con enlace, rama de contenido e icono**; `node scripts/verificar-paquete.mjs`: **99 archivos del manifiesto correctos**. Una verificación estática independiente confirmó los 17 patrones documentados en `KCJ_DIAGNOSTICO_ESTATICO_HALLAZGOS_2026-11-21.json`.

**No acreditado:** compilación Next.js y typecheck completo, migraciones sobre PostgreSQL, acceso S3, pruebas con roles reales, teléfonos sin conexión, navegación publicada en Vercel ni identidad exacta del commit desplegado. El intento de instalar dependencias no terminó; el `tsc` global no puede resolver Next/Prisma/tipos sin `node_modules`, por lo que esos errores **no prueban defectos propios del código**.

### Terminología

- **Confirmado en código:** la condición mencionada aparece o falta efectivamente en los archivos revisados.
- **Riesgo reproducible de diseño:** el flujo permite una secuencia conflictiva según la lógica visible, pero requiere ensayo transaccional/end-to-end para confirmar su materialización.
- **Pendiente de ejecución:** requiere Vercel, PostgreSQL, S3, una cuenta de prueba o teléfono.

## 2. Hallazgos con prioridad

| ID | Prioridad | Proceso | Hallazgo, evidencia y consecuencia | Corrección concreta |
|---|---|---|---|---|
| KCJ-01 | **ALTA** | Evidencias / documentos / SSOMA | `lib/evidencias.ts:5`, `requireEvidence()` confirma existencia, verificación y finalidad, **pero no verifica autor ni asociación al expediente actual**. Con una clave conocida de igual categoría es posible intentar reutilizar evidencia de otro registro. | Verificar `uploadedBy`, vínculo con entidad y alcance/autorización; usar asignación exclusiva o trazada y auditoría por cada asociación. |
| KCJ-02 | MEDIA | Homologación y Flota | `app/actions-operativas.ts:20` admite HOMOLOGACION al registrar documentos de Flota; `app/api/evidencias/presign/route.ts:12` **no** le permite cargar evidencia FLOTA. Además, el permiso general de Flota no incluye ese rol. Interfaz, subida y acción de servidor no están alineadas. | Aclarar que Operaciones administra documentos/homologaciones y unificar matriz de permisos entre menú, formulario, subida y acción. Retirar función técnica heredada solo tras migración de cuentas. |
| KCJ-03 | **ALTA** | ROSTER | `crearRoster` lee solapes y después crea fuera de transacción: `app/actions-operativas.ts:26`. `publicarRoster` también verifica antes de la transacción: línea 27. **Dos solicitudes simultáneas podrían aprobar intervalos incompatibles.** | Exclusión de intervalos por trabajador/estado en PostgreSQL o bloqueo por trabajador y transacción serializable con reintentos; ensayo de publicaciones simultáneas. |
| KCJ-04 | **ALTA** | Tareo/HHT | `crearTareo` consulta solapes y luego inserta aparte: `app/actions-operativas.ts:31`. El control no es atómico y `Timesheet` no tiene restricción de superposición. Riesgo de duplicar horas reales. | Restringir solapes en DB o transacción serializable con bloqueo y deduplicación por evento/servicio; conciliación RR. HH. |
| KCJ-05 | **ALTA** | Asignación de conductor y unidad | `asignarServicio` ejecuta `comprobarAsignacion()` antes de su transacción (`app/actions-operativas.ts:29`), y el esquema no impide que **dos servicios distintos** reciban la misma unidad en la misma franja. | Protección de concurrencia por conductor/unidad e intervalo; recalcular restricciones dentro de una transacción controlada; prueba con dos operadores. |
| KCJ-06 | **ALTA** | Inicio de servicio | `iniciarServicio` (`app/actions-operativas.ts:30`) pasa de ASIGNADO a EN_CURSO **sin volver a revisar licencia, aptitud, homologación, mantenimiento, ROSTER, documentos ni horario actual**. La situación puede cambiar entre asignación e inicio. | Revalidar al iniciar, respetar ventana temporal y bloquear si hay restricción; auditar motivo y resultado de rechazo. |
| KCJ-07 | **ALTA** | Inspección / CONNECT | `registrarInspeccion` (`app/actions-aula.ts:19`) busca servicio con estado ASIGNADO/EN_CURSO, sin comprobar fechas ni guardia actual. Una asignación futura puede respaldar una inspección registrada hoy. Tampoco guarda checklist detallado por ítem: solo `observaciones`. | Validar el servicio vigente en la fecha y la unidad, guardia/usuario, checklist de elementos críticos y evidencia por hallazgo; bloquear caso crítico según procedimiento. |
| KCJ-08 | **ALTA** | Pausas Activas | `app/actions-pausas.ts:27,41,62`: tiempo **fijo** de cinco minutos; no existe programación por intervalo de guardia ni frecuencia configurable aprobada. No es posible inferir qué pausas debían haberse realizado. | Tabla de programación/procedimiento vigente (5–10 min y frecuencia aprobada), instancia de pausa esperada por servicio/guardia y controles de omisión sin falsos incumplimientos. |
| KCJ-09 | **ALTA** | Pausas / auditoría | `ActivePause` (`prisma/schema.prisma`, final) solo tiene EN_CURSO/FINALIZADA/NO_REALIZADA (campo `String`); **no existe verificador, fecha de verificación o motivo de observación**. La confirmación del conductor a los 5 min no acredita una verificación independiente. | Incorporar resultado de revisión SSOMA/supervisor, quién/cuándo y observaciones; separar `finalizada` de `verificada` y conservar historial. |
| KCJ-10 | **ALTA** | Control Maestro y ROSTER | `lib/consulta-pausas.ts:39,47` interpreta GUARDIA publicada como `TRABAJANDO`, aunque no haya inicio confirmado de servicio; el resumen mezcla programación con actividad real. La jornada mixta guardia/descanso y cambios de unidad se agrupan por persona/día, sin segmentos completos de actividad. | Distinguir `PROGRAMADO`, `SERVICIO_INICIADO`, `DESCANSO`, `NO_PROGRAMADO`; asociar pausa a tramo real de servicio y guardar instantánea para auditoría histórica. |
| KCJ-11 | **ALTA** | Salud de infraestructura | `app/api/health/route.ts` comprueba seis tablas básicas pero **no `ActivePause`, UserRoleGrant ni otras tablas nuevas**. Puede decir `schema: ready` aunque falle el módulo de Pausas. | Agregar prueba de migraciones y tablas críticas o consultar tabla `_prisma_migrations`; comprobar esquema y consultas mínimas protegidas. |
| KCJ-12 | **ALTA** | Acceso/API | `lib/auth.ts:15` obliga a cambiar contraseña en pantallas con `requireUser()`, pero las API (`api/evidencias`, `api/reportes`, `api/pausas`) utilizan `currentUser()` sin aplicar `mustChangePassword`. **Una sesión con clave temporal aún válida puede llamar a API autorizadas por su rol.** | Centralizar `requireApiUser()` con bloqueo de sesión pendiente de cambio de clave y respuestas 403; pruebas de acceso a cada API. |
| KCJ-13 | MEDIA/ALTA | Salud Ocupacional | `registrarAptitud` (`app/actions-operativas.ts:25`) hace `upsert` sobre `MedicalFitness`: cambia estado y vigencia de la fila existente. Hay bitácora de la nueva situación, pero **no registro de versiones clínicas operativas con antes/después**. | Guardar historia de aptitudes, autor y vigencia; compartir con Operaciones solamente el estado operativo permitido. |
| KCJ-14 | MEDIA/ALTA | Almacén | `moverInventario` (`app/actions-operativas.ts:41`) interpreta toda dirección distinta de `SALIDA` como **INGRESO**, incluso texto no válido enviado al servidor. | Rechazar todo valor que no sea INGRESO/SALIDA; exigir documento, custodio y destinatario según el movimiento; conservar prueba de saldo concurrente. |
| KCJ-15 | **ALTA** | SSOMA / bloqueo vehicular | `crearCaso` (`app/actions-operativas.ts:35`) guarda `severity` como texto sin validar enum. La disponibilidad vehicular depende del valor exacto `CRITICA` (`lib/operaciones.ts:15`). Un valor incorrecto podría evitar el bloqueo previsto. | Validar severidad en servidor y DB mediante enum, normalizar entradas heredadas y ensayar casos críticos. |
| KCJ-16 | MEDIA | Instalación y despliegue | No hay `package-lock.json` ni otro lockfile. Los flujos CI usan `npm install`; no se asegura reproducir exactamente las dependencias del despliegue auditado. | Incorporar lockfile generado y controlado por TI, fijar Node y usar `npm ci`. |
| KCJ-17 | MEDIA | Formulario de carga | `components/ui/EvidenceUploader.tsx:12` marca `required` en un `input type="hidden"`; esa restricción HTML no asegura que se completó la subida. El servidor sí bloquea casos como inicio de pausa sin evidencia, pero la experiencia presenta error tardío. | Deshabilitar Enviar mientras la subida esté pendiente, mostrar confirmación/errores y validar obligatoriamente en servidor para cada proceso. |

### Riesgos adicionales detectados fuera de la matriz de patrones

1. **Validación de estado laboral:** en `actualizarTrabajador` (`app/actions-operativas.ts:44`) toda cadena distinta de `ACTIVO` se interpreta como inactivación. Rechazar valores desconocidos para impedir bajas accidentales por datos mal enviados.
2. **Baja de administradores simultánea:** `desactivarCuenta` protege la cuenta propia, pero no serializa la comprobación de «último administrador activo». Dos administradores podrían intentar darse de baja mutuamente a la vez. Probar y bloquear ese escenario antes de producción.
3. **ROSTER histórico:** `Roster.version` existe en esquema pero no se observa flujo completo de cambios de programación con versiones/causas. El sistema genera y publica, pero no ofrece una revisión histórica completa dentro del formulario.
4. **Tareo correctivo:** no se observa un flujo de rectificación de horas validadas con motivo, doble revisión y conservación del valor anterior.
5. **Pausa omitida sin obligación individual:** `informarPausaNoRealizada` exige motivo durante guardia, pero no vincula el motivo a una pausa programada específica, ni evita múltiples declaraciones de omisión para el mismo intervalo.
6. **Evidencia visual de auditoría:** el PDF incorpora un ID de fotografía pero no la imagen como anexo ni un mecanismo de verificación permanente. Para auditoría documental debe añadirse referencia verificable y política de conservación.
7. **Instalación de datos:** `prisma/seed.ts` describe catálogos JSON de referencia; no los convierte en catálogos editables de cargos, áreas o posiciones. La interfaz de Personal aún recibe texto libre.
8. **Reporte general:** `app/api/reportes/exportar/route.ts` ofrece CSV sin todos los filtros, PDF/Excel y corte histórico previstos para los demás módulos. Pausas sí tiene PDF propio.
9. **Fotografías sin señal:** no aparece cola offline persistente con reintentos, recuperación tras cierre del navegador y confirmación idempotente S3.
10. **Límites de consulta:** varias pantallas usan `take: 100/200/250/300/500`. No hay paginación completa para empresas con más registros; un operador podría creer que no existe un conductor que sí está en la base.
11. **Validación de integridad fotográfica:** confirmación S3 coteja `ContentType` y tamaño, pero no comprueba firma real del archivo; reforzar validación si será evidencia formal.

## 3. Flujos entre módulos: qué envían y qué falta

| Origen → destino | Datos observados en el código | Conexión o control aún insuficiente |
|---|---|---|
| Personal → Usuario | `workerId` opcional y único; rol principal más autorizaciones adicionales | Administrar identidad y funciones sin duplicar cuenta, impedir asociaciones contradictorias; verificar revocación en sesiones simultáneas |
| ROSTER → Operaciones | Intervalo publicado GUARDIA/DESCANSO | Concurrencia y cruce de fechas; guardia debe cubrir correctamente el servicio completo |
| Homologación + Salud + Flota → Asignación | Licencia, aptitud, alcance de mina, tarjeta, documentos, órdenes y casos | Revalidación al inicio y al cambiar unidad; no depender solo de validación anterior |
| Servicio → KCJ CONNECT | Conductor, vehículo, fechas, estado ASIGNADO/EN_CURSO | La inspección debe corresponder al servicio/turno efectivamente vigente |
| KCJ CONNECT → Pausas | `workerId`, `serviceId`, `vehicleId`, `evidenceKey`, fecha y hora del servidor | Programación esperada, evidencia vinculada a actividad, finalización y verificación independiente |
| ROSTER + Pausas → Control Maestro/PDF | Personas, intervalos, pausas, estado, unidad, placa y servicio | Diferenciar trabajo programado del realmente ejecutado, precisar guardia/nocturno y capturar instantánea histórica |
| Inspección → SSOMA/Mantenimiento | Resultado global y caso crítico automático | Checklist detallado, evidencia por ítem, notificación y bloqueo/seguimiento completos |
| Mantenimiento + SSOMA → Flota | OT sin liberar, casos críticos, liberación y revisión tras devolución | Estados de restricciones y transiciones concurrentes probadas; ambos responsables no deben confundirse |
| Tareo → RR. HH. → Reportes | Horas reales, estado PENDIENTE/VALIDADO, HHT sumada | Corrección, no duplicación, enlaces con servicio y conciliación por jornada real |
| Aula → Reportes/constancia | Convocatoria, asistencia, material, intentos, aprobación, HHC | Ejecutar ciclo completo con personas ficticias, versiones, QR, permisos y conservación de antecedentes |
| Comunicaciones → Usuario | Destinatarios por rol, versiones y acuse único | Probar doble función, acuses por versión y destinatarios revocados |
| Almacén → Áreas | Artículos y movimientos con saldo | Custodio/trabajador/unidad, EPP, trazabilidad de devolución y validaciones de sentido |

## 4. Revisión de los 18 módulos

| N.º | Proceso | Estado tras esta auditoría |
|---|---|---|
| 01 | Acceso y usuarios | Login y sesiones implementados; revisar cambio de clave exigido para API, concurrencia de bajas y pruebas de revocación. |
| 02 | Personal | Alta/actualización; falta validar catálogo y valores de estado; auditar trazabilidad de cambios. |
| 03 | Operaciones | Servicios/asignación/cambio; riesgos de solape e inicio con documentación vencida; cambio sin dos tramos fotográficos de km. |
| 04 | ROSTER | Existe publicación; concurrencia, ajustes versionados, noche y cruce de periodos sin prueba real. |
| 05 | KCJ CONNECT | Servicios, inspección y pausas; falta offline, checklist y vinculación temporal fuerte. |
| 06 | Flota | Documentos/odómetro y restricciones; unificar autorizaciones y evidencia por operación. |
| 07 | Mantenimiento | OT y liberación; validar bloqueo y traspaso de estado con SSOMA/Flota. |
| 08 | SSOMA | Casos y acciones; severidad debe ser enum y las pruebas de cierre/reapertura requieren concurrencia. |
| 09 | Homologación | Alcance minero comprobado en asignación; inconsistencia de roles y verificación de evidencia. |
| 10 | Tareo | Horas reales; solapamiento concurrente, rectificación motivada, jornadas nocturnas. |
| 11 | Aula Virtual | Material, asistencia, dos intentos y refuerzo en código; falta E2E, materiales adjuntos y versiones verificadas. |
| 12 | Recursos Humanos | Contratos y consulta; cuidar evidencias, versiones y enlace con tareo. |
| 13 | Salud Ocupacional | Estado operativo registrado; falta historia de aptitud y pruebas de confidencialidad. |
| 14 | Propietarios | Restricción por propietario en Flota; probar personas con más de una función y ausencia de datos de terceros. |
| 15 | Comunicaciones | Versionado y acuse por usuario/versión; probar roles múltiples, entrega y sesión revocada. |
| 16 | Reportes | CSV básicos y PDF de pausas; faltan reportes filtrados PDF/Excel y corte histórico institucional. |
| 17 | Entrega y recepción | Evento y doble liberación posterior; faltan inventarios comparables, cantidades, faltantes y tramos. |
| 18 | Almacén y herramientas | Stock centralizado; falta validación estricta de movimiento y asignación/custodia individual. |

> «Hay pantalla» no significa «el proceso fue ejecutado satisfactoriamente». Ninguna de estas filas es una certificación de producción.

## 5. Pruebas de aceptación prioritarias en base de ensayo

| Caso | Prueba con datos ficticios | Resultado obligatorio |
|---|---|---|
| T01 | Dos usuarios publican guardias que se cruzan para el mismo conductor al mismo tiempo | Solo una se publica; no hay intervalo contradictorio |
| T02 | Dos operadores asignan la misma unidad a dos servicios simultáneos | Una asignación se rechaza sin dejar cambios parciales |
| T03 | Se asigna un servicio válido y se vence SOAT/licencia antes del inicio | El inicio queda bloqueado y registra causa |
| T04 | Conductor intenta inspección de unidad asignada para mañana | Rechazo por no corresponder a turno/servicio vigente |
| T05 | Se envía un caso crítico con severidad alterada en petición HTTP | Rechazo; nunca se transforma en restricción no crítica |
| T06 | Cuenta con contraseña temporal llama a API de exportación de datos | Rechazo hasta cambio obligatorio de clave |
| T07 | Evidencia subida por usuario A se usa desde expediente de B | Denegación o autorización explícita trazada según política |
| T08 | Guardia nocturna cruza de 23:00 a 07:00 con pausa después de medianoche | Registro asociado al turno correcto y PDF consistente |
| T09 | Conductor está en descanso; otro trabaja pero omite pausa | Descanso = NO APLICA; omisión = motivo y supervisión, sin falso cumplimiento |
| T10 | Se realiza pausa de 5 minutos y conductor confirma su término | FINALIZADA, todavía NO VERIFICADA por supervisor |
| T11 | Se actualiza una aptitud de APTO a NO APTO | Operaciones no asigna y permanece historial auditable de ambos valores |
| T12 | Movimiento con dirección «OTRA», cantidad positiva | Rechazado sin incrementar inventario |
| T13 | Falta tabla `ActivePause` en BD aislada | Health indica esquema pendiente, no `ready` |
| T14 | Se cargan fotografías sin señal y se reconecta dos veces | Una evidencia y una pausa, sin pérdida de borrador |
| T15 | Descarga PDF con 50+ conductores y varios eventos por trabajador | A4 vertical, logo original, todas las filas, fechas, horas, páginas y fotos referenciadas |
| T16 | Usuarios por rol (Operaciones, Jefatura, SSOMA, Salud, conductor, propietario, RR. HH.) | Pueden leer/hacer únicamente lo autorizado; 403 al intentar API ajena |

## 6. Orden de corrección recomendado

**Fase A — Seguridad e integridad (no desplegar sin resolver):** vinculación y propiedad de evidencias; validar severidad, estados y dirección del inventario; no permitir API con cambio de contraseña pendiente; proteger contra dobles asignaciones, ROSTER y tareo; revalidar conductor/unidad al inicio.

**Fase B — Exactitud operativa:** plan de pausas vinculado a guardia real y revisión por SSOMA; inspecciones por ítem; mantenimiento y custodia; conciliación de HHT/HHC; historiales de aptitud y cambios; versiones y permisos cruzados.

**Fase C — Navegación y adopción:** catálogos administrables, paginación, estados de carga, formularios que no ofrezcan opciones vacías, avisos de error claros, accesibilidad, teléfonos físicos, S3, conexión intermitente y generación completa de documentos corporativos.

**Fase D — Implementación controlada:** commit exacto y etiquetas de versión, lockfile, `prisma validate`, `prisma migrate deploy` en **copia** de BD, `npm run typecheck`, `npm run build`, E2E por rol, respaldo/restauración, acta de aceptación por responsables y despliegue gradual. No usar datos reales en pruebas.

## 7. Conclusión final

La última copia conserva una base de navegación coherente, contiene los procesos pactados y dispone de pruebas de reglas que pasan. **No obstante, quedan riesgos de integridad y trazabilidad que pueden producir datos aparentemente válidos, pero incorrectos para una auditoría interna.**

El siguiente trabajo no debe consistir en crear otra versión estética: debe abordar las correcciones por impacto, probarlas con escenarios reales simulados y consolidarlas en el código exacto que después despliegue TI. **El repositorio privado y la versión publicada en Vercel no fueron inspeccionados en esta revisión**, por lo que no se afirma que estas observaciones estén presentes o ausentes en producción.

**Datos empresariales reales y producción: sin modificación.**
