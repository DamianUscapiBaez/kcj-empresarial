# KCJ CONTROL 3.1 + KCJ CONNECT
## Contrato de reconstrucción funcional fiel para Ingeniería y TI

**Fecha:** 21/11/2026  
**Objetivo:** reconstruir el sistema acordado para KCJ PERÚ S.A.C. con código íntegro, abierto a mantenimiento por TI, utilizando Next.js App Router, React TSX, TypeScript estricto, Tailwind CSS, Prisma y PostgreSQL, desplegable en Vercel. **No constituye un software terminado ni una autorización para cargar datos reales.**

## 1. Fuentes de verdad y orden de comprobación

1. **Documento Maestro KCJ CONTROL 3.1, 08/11/2026:** alcance empresarial, 17 módulos, actores, pantallas, campos, reglas, excepciones y pruebas propuestas.
2. **Paquete original V17 y sus informes V10–V17:** flujos, interfaces, formularios, decisiones aprobadas y comportamientos probados en piloto local. Referencia funcional; NO copiar su arquitectura HTML/Python/SQLite.
3. **V23:** decisiones posteriores para acceso, nube y datos iniciales; no considerar su estructura de tablas como prueba de cobertura funcional ni sus JSON de demostración como información real.
4. **Matriz de recuperación del 21/11/2026:** diferencias confirmadas que no pueden perderse (materiales de Aula, refuerzo, versiones, offline de CONNECT, permisos, controles de flota, etc.).
5. **Indicaciones del técnico proporcionadas por el usuario:** solo Next.js App Router, React `.tsx`, TypeScript estricto sin `any`, Server Components por defecto, Tailwind, instancia central `lib/prisma.ts`, reglas puras `lib/dominio-kcj.ts`, Prisma relacional y `prisma/seed.ts`; sin Python, sin HTML plano ni scripts de Windows como requisito para desplegar en Vercel.

**Regla para contradicciones:** no eliminar silenciosamente nada. Documentar diferencia entre requisito, comportamiento históricamente implementado, corrección de seguridad obligatoria y pendiente de decisión. Una prueba local pasada no equivale a validación en producción.

## 2. Principios irrenunciables

- Una persona = una ficha laboral y una cuenta relacionada, aunque tenga varios cargos/funciones. Revocación efectiva de sesiones tras cambios relevantes.
- Un vehículo = una ficha maestra, con documentos y propietarios versionados, odómetro real acreditado y custodias históricas.
- Acciones y datos compartidos por identificadores relacionales; no duplicar personal, vehículo, servicio, tareo, actas o evidencias entre módulos.
- **Separación de competencias:** Operaciones planifica/asigna, Jefatura publica ROSTER, Mantenimiento libera técnicamente, Salud comunica SOLO aptitud operativa, SSOMA verifica/cierra seguridad, RR. HH. valida tareo. El administrador técnico no sustituye aprobaciones especializadas.
- Distinguir programado, efectivo, pendiente, revisado, validado y aprobado; no deducir HHT ni HHC de horarios, ROSTER, inicio de operación o duración de servicio.
- Guardar eventos, justificativos, usuario, fecha/hora, antes/después y evidencias en historial no sobrescrito. Tratar las correcciones como eventos nuevos.
- Validar fecha y hora Perú, trasnoche, vigencia documental durante **toda** la ventana del servicio; restricciones dependientes de contexto (p. ej., Tarjeta Amarilla solo en servicios que exigen ingreso a mina).
- La habilitación administrativa para registrar un vehículo no es su **disponibilidad operativa**.
- Modelo y permisos en backend, pruebas de concurrencia, almacenamiento privado, respaldo/restauración y acceso por mínima necesidad.

## 3. Contrato de pantallas, comandos y controles por módulo

Los nombres de los controles son **acciones funcionales exigidas**, no una promesa de que estos rótulos exactos ya estén presentes. Al migrar cada pantalla, comparar también textos, campos y estados del sistema V17 y los artefactos gráficos originales.

| N.º | Módulo | Pantallas y comandos esenciales | Reglas y prueba de aceptación mínima |
|---|---|---|---|
| 01 | Acceso y usuarios | Iniciar/cerrar sesión, recuperar acceso, consultar sesiones, crear/desactivar usuario, asignar/revocar permisos, ver auditoría | Rol+acción+alcance en backend; conductor no ve datos médicos/unidades ajenas; desactivar revoca sesión; primera cuenta segura sin DNI como clave |
| 02 | Personal | Padrón, ficha laboral, ficha conductor, licencias, vínculos, cargos, historial | No duplicar al cargar licencia/tareo; baja conserva historial; cambios de función requieren permisos y auditoría |
| 03 | Operaciones | Crear/programar/asignar servicio, validar unidad/conductor, iniciar/finalizar, suspender, cambiar unidad, registrar horas efectivas, bitácora | No solapar; validar licencia/aptitud/guardia/homologación/mantenimiento/custodia; cambio crea tramos sin duplicar servicio ni tareo |
| 04 | ROSTER | Borrador, rotaciones, guardias, descanso, aprobación, publicación, cruces | Jornadas día/noche (incluido 19:00–07:00 siguiente día); ciclos según asignación (14×7, 14×10, 14×14); solo jefatura publica; no modificar tareo |
| 05 | KCJ CONNECT | Inicio móvil, mi servicio, inicio de operación, inspección, evidencia, cambio de unidad, mis guardias, capacitaciones, comunicados, pendientes offline | Solo datos propios; tiempo local y del servidor; reintentos idempotentes; estados pendiente/enviando/confirmado/rechazado; incidente/accidente/condición insegura y notificación a SSOMA/Operaciones |
| 06 | Flota | Ficha, documentación, propietario, GPS/DVR, odómetro, inventario, custodias, estado | Registrar ficha con documentos pendientes; impedir servicio sin documentos obligatorios verificados y vigentes al final; diferenciar km real y km facturado; no asignar custodia de tercero |
| 07 | Mantenimiento | Crear OT, diagnóstico, repuestos, preventivo/correctivo, prueba, liberación | Restricción crítica persiste hasta liberación técnica autorizada; cierre administrativo de acta no libera unidad |
| 08 | SSOMA | Inspecciones, IPERC, incidentes, equipo de emergencia, cinta trimestral, acciones, verificación, cierre/reapertura | Responsable/plazo/evidencia; solo SSOMA verifica/cierra; imposible cerrar con acciones pendientes; excepción sin acciones requiere justificación; historial íntegro de reapertura |
| 09 | Homologación | Requisitos por operación, Tarjeta Amarilla, evidencia externa, cursos, vencimientos, alertas | Tarjeta individual, renovaciones versionadas; ausencia/vencimiento bloquea SOLO contexto minero aplicable; no confundir constancia KCJ con credencial Las Bambas |
| 10 | Tareo general | Tareo por área, captura, observaciones, conciliación, revisión RR. HH., consolidación | Horas reales verificadas; turnos trasnoche, suspensión y cambios de unidad sin duplicaciones; planificación no es hora efectiva |
| 11 | Aula Virtual | Catálogo, crear curso, convocar, publicar, asignar instructor, materiales, asistencia, examen, notas, refuerzo, constancia/QR, HHC, versiones | Material y asistencia habilitan examen; máximo 2 intentos por ciclo; refuerzo autorizado sin borrar historial; archivar versión anterior; lectura restringida de constancia y QR público mínimo |
| 12 | Recursos Humanos | Expediente, contrato/versiones, permisos, revisión/corrección de tareo, cambios de cargo | Correcciones con motivo y aprobación; RR. HH. no concede privilegios por cambiar título laboral; no ve diagnóstico clínico salvo autorización específica |
| 13 | Salud Ocupacional | Aptitud, vigencia, alertas, expediente clínico | Operaciones solo conoce apto/no apto/restringido/pendiente; bloqueo contextual de asignación; consultas médicas auditadas |
| 14 | Propietarios | Vínculo, activar/desactivar acceso, portal de consulta, alertas | Solo lectura de sus unidades; jamás datos de terceros, clientes, rutas, trabajadores o expedientes ajenos; km mostrado real validado |
| 15 | Comunicaciones | Crear/publicar aviso, seleccionar destinatarios, revisar estado, confirmar recepción, historial de versiones | Control de destinatarios en servidor; 1 acuse por persona y versión aunque tenga dos cargos; enviado ≠ leído; avisos por radio/manual sin falsa sincronización |
| 16 | Reportes | Tableros por área, filtros, PDF/Excel, auditoría exportación, consolidado | Periodo, fecha de corte, fuente, estado preliminar/aprobado, permisos; HHC separado de HHT; restringir campos médicos |
| 17 | Entrega y recepción | Contratos, inventario base por tipo, acta de salida, custodia, acta de entrada, comparación, discrepancias, firmas y fotos | Dos actas inmutables; cuatro cantidades cuando proceda; N/A justificado, no para obligatorio; retorno deja unidad en revisión sin liberarla |
| Extra | Almacén y herramientas | Existencias, entradas, salidas, asignaciones, devoluciones, responsable y auditoría | No permitir cantidades negativas; comprobar coincidencia de custodio, movimiento, existencias y evidencia |

### Detalles operativos que no pueden convertirse en formularios genéricos

- **Inspección preoperacional e inventario:** comprobar retroceso visual y alarma sonora por separado; extintor por presión/vencimiento/acceso; botiquín por contenido/integridad/vigencia; llantas por posición/cocada/presión; fotos según hallazgo; DVR/GPS con presencia y funcionamiento por separado.
- **Cinta trimestral SSOMA:** enero–marzo rojo, abril–junio verde, julio–septiembre azul, octubre–diciembre amarillo, con alerta configurable previa y posterior.
- **Aula Virtual V13:** asistencia y validación del material obligatorias; dos desaprobaciones → requiere refuerzo por instructor; curso interno sin examen exige asistencia/material; curso versionado archiva anterior; certificado con QR de verificación limitada.
- **HHC:** horas-hombre de capacitación efectivamente cumplidas y acreditadas según reglas de curso. **HHT:** horas-hombre trabajadas. Ningún indicador reemplaza el otro.
- **ROSTER:** horarios concretos, guardias, descansos y solapamientos; jefatura aprueba y publica. No son automáticamente horas validadas de tareo.
- **Flota:** SOAT, revisión técnica y otros requisitos por unidad/servicio, documentación históricamente versionada y vigencia hasta fin de servicio. Tarjeta Amarilla solo cuando el tipo de servicio la exige.
- **Cambio de unidad:** preservar ID de servicio, conductor, guardia, cliente y tareo; registrar tramos, motivo, autorizador y lecturas con fotografías.
- **SSOMA:** cierre con acciones verificadas o justificación sin acciones, reapertura con motivo e historial; no basta con un botón «Cerrar» que cambie un estado.

## 4. Seis correcciones V17 que se deben reproducir y probar

**B1 CONNECT:** reporte incidente/accidente/condición insegura; adjuntos, idempotencia, offline y notificaciones.  
**B2 SSOMA:** acciones verificadas, cierre autorizado o justificación técnica, reapertura conservando historial.  
**B3 Comunicaciones:** destinatarios validados en backend y confirmación única por persona/versión.  
**B4 ROSTER:** fecha/hora real, nocturnidad, cruces/ciclos, historial y separación de Tareo.  
**B5 Flota:** ficha administrativa distinta de disponibilidad; SOAT y técnica verificados y vigentes, más mantenimiento y seguridad.  
**B6 Personal/acceso:** cuenta y ficha únicas, roles múltiples, permisos backend y revocación efectiva de sesiones.

## 5. Flujos de aceptación entre áreas

**F01 Servicio minero completo:** crear servicio → validar ROSTER publicado, conductor/licencia/aptitud/cursos, vehículo/documentación/mantenimiento/SSOMA/homologación para intervalo completo → asignar → inspección CONNECT → inicio de operación → novedades y km → horas efectivas Operaciones → validación RR. HH. → reporte autorizado.

**F02 Cambio de unidad:** conservar servicio y personal, registrar dos tramos de km con evidencia y autorizador, impedir doble asignación y doble tareo.

**F03 Inspección crítica:** CONNECT/SSOMA comunica hallazgo → genera restricción contextual → Mantenimiento/SSOMA intervienen con permisos separados → evidencia y verificación → liberación válida sin borrar historial.

**F04 Aula:** publicar versión → convocar según guardia → registrar asistencia → validar material → examen con dos intentos → refuerzo si corresponde → nota/constancia/QR/HHC, sin credencial minera ficticia.

**F05 Alquiler:** inventario de salida y acta firmada → custodia tercero y bloqueo → recepción con nueva acta → diferencias/daños → revisión técnica y SSOMA → liberación solo si corresponde.

**F06 Comunicación:** destinatarios reales → publicar nueva versión → confirmación individual y única → mantener historial y mostrar enviado/recibido/leído por separado.

**F07 Acceso:** alta ficha+cuenta → permisos por cargo y acción → cambios de puesto con aprobación → cierre de sesiones → lectura y operaciones solo dentro de alcance propio.

## 6. Arquitectura exigida por TI

```
mi-proyecto-kcj/
  app/
    (auth)/
    (admin)/dashboard/[modulo]/
    (conductor)/connect/
    api/                 # Route Handlers donde sean necesarios
    layout.tsx
    page.tsx
  components/
    ui/
    [dominio]/
  lib/
    prisma.ts
    dominio-kcj.ts
    auth.ts
    permisos.ts
    auditoria.ts
  prisma/
    schema.prisma
    seed.ts
    migrations/
  tests/
  public/assets/
  docs/
  package.json
```

- Servidores/componentes por defecto en SSR; `use client` solo para formularios interactivos y estados de navegador; acciones protegidas mediante Server Actions/Route Handlers.
- Entidades relacionales de verdad en PostgreSQL: FK, restricciones de unicidad, índices, transacciones, bloqueos/concurrencia, migraciones reversibles/evaluadas. No reemplazar 17 procesos por una columna JSON genérica.
- `prisma/seed.ts` **idempotente**: organización, áreas, catálogos parametrizables y administrador inicial con secreto fuera del código. Los datos ficticios se limitan a entorno demo y no se mezclan con información real.
- Vercel + PostgreSQL cloud y almacenamiento persistente privado para adjuntos; colas offline de CONNECT con claves idempotentes y reconciliación segura; políticas de backup y restauración real.
- TS estricto sin `any`, no HTML plano, no `document.getElementById`, no Python ni archivos `.bat`/`.ps1` para ejecución en Vercel.
- Código fuente entregado sin ofuscación, `README`, scripts npm, esquema/migraciones, seed, documentación API, ejemplos de variables sin secretos, CI y pruebas.

## 7. Puertas de aceptación antes de cargar información real

**P0 Infraestructura y seguridad:** compilar en Node/Next, validar y aplicar migraciones sobre PostgreSQL descartable, seed seguro, login real, roles backend, sesiones revocables; secretos, HTTPS y backups.  
**P1 Maestros y relaciones:** altas y edición auditada de personal y flota; importación idempotente y validación de duplicados; no destruir base anterior.  
**P2 Procesos por módulo:** cubrir cada comando, campo, excepción, estado y permiso del Documento Maestro y V17; pruebas de navegador por roles.  
**P3 Integración:** ejecutar F01–F07 de principio a fin con persistencia y concurrencia en PostgreSQL; probar offline y adjuntos en teléfonos reales.  
**P4 Continuidad y aprobación:** restaurar backup junto con evidencia, medir carga, revisar seguridad, obtener conformidad de representantes de cada área, plan de reversión y acta de inicio de marcha blanca.

**Un número de pruebas locales no reemplaza P0–P4.** La cifra histórica V17 de 508/508 refiere a comprobaciones del piloto local, no a producción ni a 508 funcionalidades únicas.

## 8. Estado de partida verificado al elaborar este contrato

- Existe Documento Maestro con 17 módulos y requisitos detallados.
- El ZIP V17 inspeccionado incluye informes de 508 verificaciones del piloto; no valida la nueva arquitectura ni producción.
- El ZIP V23 inspeccionado contiene `datos_iniciales/piloto.json` con catálogos de áreas, administrador por variables de entorno y **`registros_iniciales: {}`**: NO contiene padrón real de vehículos, trabajadores ni cursos cargado automáticamente.
- La nueva entrega anterior fue identificada como no equivalente: entre otras pérdidas, materiales/refuerzo/versiones del Aula y cola offline de CONNECT.
- **Estado de implementación de este documento:** especificación consolidada y trazable para ingeniería. No se declara la nueva aplicación compilada, desplegada ni aprobada para información real.

## 9. Regla para controlar cambios futuros

Cada funcionalidad tendrá: ID, módulo, fuente (documento/pantalla/prueba), responsable que aprueba, permisos, campos, validaciones, pantalla TSX, Server Action/API, modelos Prisma, prueba unitaria, prueba E2E y estado de aceptación. Ninguna decisión se considerará conservada solo porque aparezca en un menú o en un texto de documentación. Una mejora adicional se propondrá como cambio versionado, sin alterar lo previamente aprobado en silencio.
