# KCJ CONTROL — Mapa organizativo, funcional y de permisos para TI

**Revisión de definición: 21/11/2026.**  
**Propósito:** no confundir departamentos reales, funciones, módulos de software, portales externos y cargos con permiso para aprobar. Documento de alcance funcional, no afirmación de sistema construido o desplegado.

## 1. Regla rectora

KCJ CONTROL es **un sistema único**. Sus 17 módulos históricos del Documento Maestro (más el Almacén incorporado después) **no son 17 departamentos**. El menú se organiza por la tarea y rol reales; el modelo de base de datos puede mantener componentes independientes y compartidos. Una sola ficha por persona y vehículo, sin volver a capturar los mismos datos en cada módulo. Permisos en servidor por recurso, acción, alcance y condiciones; auditoría de actos críticos.

**Jerarquía de decisiones:** las instrucciones específicas del usuario dadas después del Documento Maestro (08/11/2026), y la revisión corregida V16 (13/11/2026), precisan cómo deben agruparse las funciones; los nombres históricos de módulos se conservan para trazabilidad aunque cambie su posición en el menú.

## 2. Responsabilidad real — definición depurada

| Responsable / actor | Funciones y datos que prepara, registra o controla | Límites, aprobación o consulta |
|---|---|---|
| **Operaciones** | Servicios, clientes/rutas, programación, asignaciones, novedades, suspensiones, cambios de unidad, inicio reportado, kilometraje operativo, coordinación de alquileres y custodias; **ROSTER** y control de **tareo de conductores**; gestión documental de **Flota** y verificación de vigencias; **Homologación minera** (registrar requisitos, resultados y certificados externos; vigencias y Tarjeta Amarilla aplicable). | Jefatura de Operaciones aprueba/publica ROSTER; Operaciones no inventa conformidad clínica, cierre SSOMA ni liberación de Mantenimiento; no duplica datos de RR. HH. |
| **Jefatura de Operaciones** | Consulta toda la línea de programación, aprueba/publica versiones del ROSTER y autoriza actos operativos dentro de su competencia. | Cambios versionados, con motivo e historial, nunca cambios silenciosos sobre un turno aprobado. |
| **Mantenimiento** | Órdenes de trabajo, diagnósticos, preventivos/correctivos, repuestos instalados, pruebas y liberación técnica de cada unidad. | Operaciones coordina y visualiza disponibilidad; solo personal técnico competente puede liberar la condición mecánica. |
| **SSOMA** | Inspecciones, IPERC, reportes de incidente/accidente/condición insegura, hallazgos, acciones correctivas, EPP, equipo de emergencia y control trimestral. Formación en seguridad desde el Aula según autorización. | Solo SSOMA autorizado verifica, cierra y reabre reportes de su competencia; cierre exige acciones verificadas o justificación técnica documentada. Mantener historial. |
| **Recursos Humanos** | Ficha laboral única, contratos, permisos, bajas, cambios de cargo, documentos; recibe tareo de conductores de Operaciones y horas administrativas de sus respectivas áreas; revisa/consolida/valida. | Cambiar cargo no concede permisos automáticamente; permisos de acceso requieren decisión administrativa/autorización. No accede a diagnósticos clínicos sin autorización específica. |
| **Salud Ocupacional** | Registra aptitud laboral y vigencia; resguarda documentación clínica separada; puede gestionar formación propia en Aula según autorización. | Operaciones solo puede ver condición operativa de aptitud y vigencia, no historia clínica. La competencia médica no la suplanta Operaciones ni TI. |
| **Administración de plataforma / TI** | Identidades, credenciales, roles por acción, soporte de acceso, parámetros técnicos, auditoría, respaldos, despliegues y operación del sistema. | Un rol informático no concede certificaciones médicas ni técnicas y no tiene acceso universal a expedientes sensibles. |
| **Gerencia / Auditoría** | Indicadores, seguimiento, autorizaciones propias, reportes consolidados y evidencia auditada. | Acceso según competencia; sin privilegio indiscriminado sobre historias clínicas. |
| **Conductores (KCJ CONNECT)** | Consultan sus guardias publicadas/servicios, inspecciones, fotografías, incidentes, inicio de operación, avisos, cursos y confirmaciones propias. | No pueden reasignarse servicios ni liberar vehículos, modificar tareo oficial o cerrar incidentes; aislamiento estricto de datos ajenos. |
| **Propietarios externos** | Portal de lectura de sus unidades vinculadas, odómetro real validado y alertas permitidas. | No son un departamento operativo ni ven unidades ajenas, personal, clientes, rutas ni datos sensibles. |
| **Custodio de Almacén autorizado** | Inventario sencillo, varios almacenes, ingresos/salidas/traslados, asignación definitiva de herramientas, EPP y repuestos, devoluciones cuando aplican y auditoría. | **Almacén es una función/módulo, no un departamento impuesto.** No introducir precios/costos, códigos individuales obligatorios ni un flujo de préstamos de herramientas. SSOMA confirma EPP cuando corresponda; Mantenimiento registra instalación real de repuestos. |

## 3. Términos históricos que NO deben convertirse en departamentos

- **ROSTER:** planificación de guardias y descansos; lo elabora Operaciones, Jefatura publica. Diferente del tiempo trabajado.
- **Tareo general:** proceso compartido. Operaciones controla y registra las horas reales de conductores; cada área administra las de sus administrativos; RR. HH. valida/consolida. No duplicar horas por cambios de vehículo.
- **Flota:** conjunto de vehículos. Operaciones administra ficha, documentos, vigencias, homologaciones y asignaciones; Mantenimiento conserva el control técnico. No existe área independiente "Flota" según corrección del usuario.
- **Homologación minera:** verificación documental y de certificaciones **registrada y controlada por Operaciones**, no departamento propio. Las instituciones externas certifican; KCJ conserva resultado, evidencia, fuente y vigencias. Una constancia KCJ no equivale a certificación oficial minera.
- **Aula Virtual:** plataforma transversal de cursos de SSOMA, Salud Ocupacional y formación autorizada, con permisos de publicación por responsable. Materiales, asistencia, cuestionarios, 2 intentos, refuerzo, versiones, constancias y HHC sin confundir con HHT.
- **Comunicaciones y Reportes:** servicios transversales. Cada área emite los avisos de su competencia; los informes muestran datos según permisos.
- **Entrega/recepción y alquiler:** procesos operativos vinculados a Operaciones y a custodia de unidades, con validaciones técnicas/SSOMA cuando correspondan; las actas deben ser independientes e inmutables.
- **KCJ CONNECT y portal de propietarios:** interfaces de usuario según rol, no departamentos.

## 4. Menú de navegación por responsabilidades — propuesta de implementación

**Inicio:** tablero con servicios, vencimientos, pendientes y notificaciones del usuario.

- **OPERACIONES**: Panel; Servicios y asignaciones; ROSTER (borradores, guardias, publicación por jefatura); Tareo de conductores; Vehículos/Flota (fichas, documentos, km y estado derivado); Homologación minera (Tarjeta Amarilla, cursos/requisitos externos, Webcontrol como referencia); Alquileres/entrega/recepción; Seguimiento/alertas operativas.
- **MANTENIMIENTO**: Órdenes de trabajo; Preventivo; Correctivo; Repuestos; Pruebas y liberación técnica; Historial de unidades.
- **SSOMA**: Inspecciones y hallazgos; Incidentes/accidentes/condiciones inseguras; IPERC; Acciones correctivas y cierre; Extintores/botiquines y cinta trimestral; EPP; capacitaciones SSOMA mediante Aula.
- **RECURSOS HUMANOS**: Personal; Contratos y expedientes; Permisos/bajas; Tareo general consolidado; Correcciones validadas e historial.
- **SALUD OCUPACIONAL**: Aptitud y vigencia; alertas; archivos clínicos restringidos; cursos propios autorizados mediante Aula.
- **AULA VIRTUAL** (herramienta común): Cursos, materiales, convocatoria según ROSTER, asistencia, evaluaciones, refuerzo, HHC, certificados internos/QR. Se visualiza por funciones autorizadas, sin inventar un departamento.
- **ALMACÉN Y HERRAMIENTAS** (función asignada a custodios): Existencias, ingresos/salidas, traslados, EPP, herramientas asignadas, repuestos y movimientos.
- **COMUNICACIONES** (compartido): avisos, destinatarios, lectura, acuse por persona/versión e historial.
- **REPORTES** (compartido): KPIs y exportaciones según alcance de quien consulta.
- **ADMINISTRACIÓN/TI**: usuarios, sesiones, roles, permisos, parámetros, auditoría, diagnósticos y respaldos.
- **KCJ CONNECT**: experiencia móvil del conductor únicamente con datos/acciones propios.
- **PROPIETARIOS**: vista externa limitada a vehículos vinculados.

**Nota:** esto describe ubicación del menú y controles de acceso, no mueve la titularidad profesional de las aprobaciones. Un usuario con varios cargos puede tener varias funcionalidades, pero una sola cuenta.

## 5. Tres ejemplos de flujo entre áreas

**Servicio y guardia:** Operaciones crea la programación ROSTER → Jefatura la aprueba/publica → Operaciones verifica conductor (licencia, guardia, habilitación, aptitud comunicada por Salud) y unidad (documentos, mina, custodia, estado SSOMA y liberación de Mantenimiento) → asigna el servicio → Conductor registra inspección e inicio desde CONNECT → Operaciones registra horas realmente trabajadas → RR. HH. valida el tareo; Reportes muestra estado y fuentes.

**Incidente o defecto:** Conductor reporta → SSOMA verifica seguridad, asigna acciones y hace cierre trazable → si requiere reparación, Mantenimiento interviene y libera técnicamente → Operaciones solo reasigna después de superar restricciones aplicables. Ni la recepción de alquiler ni un botón de Operaciones libera por sí solos.

**Curso:** Área autorizada crea/publica curso en Aula → convocatoria vinculada al ROSTER → asistencia y materiales → cuestionario cuando aplique (2 intentos, refuerzo conservando historial) → HHC/constancia interna conforme a resultados; Homologación minera únicamente registra los certificados externos aplicables, sin confundirlos con notas internas KCJ.

## 6. Reglas que TI debe codificar, no solo dibujar

1. Permisos por `recurso + acción + ámbito + condición` aplicados en servidor y auditados.
2. Un único maestro de personal, una cuenta por persona, un único maestro de vehículos; claves foráneas y unicidad en PostgreSQL.
3. ROSTER y Tareo son datos separados; distinguir jornada programada, inicio de operación, HHT y HHC.
4. Un mismo evento de inspección/reportes sincronizado dos veces crea una sola fila (idempotencia), sin duplicar evidencia.
5. Ningún servicio incompatible con guardia, licencia/aptitud/credencial aplicable, documentación o restricción de unidad puede asignarse; proteger concurrencia.
6. Los procesos de SSOMA y Mantenimiento solo cambian a estados finales por la persona competente, con motivo, evidencias, versiones y auditoría.
7. Los reportes y avisos respetan acceso, propiedad, versión y estado (enviado ≠ leído).
8. La marcha blanca puede mejorar campos, ergonomía y reportes, pero no debe usarse para descubrir que el login, persistencia, permisos o respaldos no funcionan.

## 7. Estado de esta definición y referencias

Se verifica aquí **la organización funcional y distribución de responsabilidades** según las decisiones recuperadas. **NO se declara** que el nuevo código ya implemente o pruebe estas funciones; eso exige una matriz requisito → archivo TSX/acción → modelo Prisma → evidencia de prueba en PostgreSQL/Vercel.

**Fuentes revisadas:** `KCJ_CONTROL_3_1_Documento_Maestro_Completo.docx` (08/11/2026), `KCJ_CONTROL_3_1_Continuacion_10-11-2026.md`, `KCJ_CONTROL_3_1_Revision_Real_V16_13-11-2026.md`, `MATRIZ_RECUPERACION_FUNCIONAL_KCJ_CONTROL.md`, y decisiones expresas del usuario durante las conversaciones (especialmente Flota, Homologación, ROSTER y Tareo). Las correcciones específicas posteriores prevalecen sobre las etiquetas generales de módulos del Documento Maestro.
