# KCJ CONTROL — Revisión de especialista y correcciones previas a la marcha blanca

**Fecha de corte:** 21 de noviembre de 2026 · **Proyecto evaluado:** KCJ CONTROL Empresarial, con 18 módulos originales + 2 simulacros en desarrollo. **Modo:** copia local del código, sin modificar la web ni PostgreSQL.

## Dictamen profesional

**Versión mejorada del código preparada, NO certificada ni desplegada.** La herramienta empresarial requiere confirmación de PostgreSQL, compilación completa y ensayos de usuario antes de permitir registros operativos reales. La web publicada no fue accesible para auditoría remota desde esta sesión, por lo cual ningún botón o rol remoto se considera verificado.

### 1. Correcciones efectivamente incorporadas al código

1. **Alta unificada ADMIN → colaborador + cuenta:** nuevo control opcional en Registro de Colaborador; genera ficha laboral y usuario en una única transacción `Serializable`; exige contraseña de 16–256 caracteres, repetición, identificador y función principal explícita; rechaza propietarios como rol laboral. Si algún registro falla, la transacción completa se revierte. RR. HH. conserva alta de ficha sin facultad de crear cuentas desde esta función. Confirma en pantalla que se creó ficha o ficha+cuenta.
2. **Operaciones — servicio:** al asignar, comenzar y cambiar unidad, consulta requisitos de conductor, vehículo, guardias, licencia, aptitud, documentación, homologación, SSOMA y mantenimiento DENTRO de una transacción serializable. Se reduce la ventana de solapamientos y cambios concurrentes; el inicio no depende exclusivamente del control que se hizo al asignar. Finalización también se registra de manera transaccional. La prueba de concurrencia real con varias sesiones aún está pendiente.
3. **Conductor dual:** desde panel Conductor solo se permite iniciar/finalizar un servicio vinculado a la ficha laboral de esa cuenta, aunque disponga de otras funciones administrativas. En panel Administrativo solo Operaciones/Jefatura puede operar servicios ajenos.
4. **ROSTER:** creación y publicación comprobadas frente a intervalos superpuestos dentro de transacciones `Serializable`, con bloqueo de trabajador inactivo y publicación restringida a Jefatura.
5. **Inventario único:** rechaza direcciones desconocidas, salidas con stock insuficiente y cantidades fraccionarias; preserva la actualización condicional del stock y la auditoría de movimiento.
6. **SSOMA:** valida en servidor que la severidad sea BAJA, MEDIA, ALTA o CRITICA. Nuevos reportes solo pueden asociar evidencias verificadas subidas por el actor, del proceso CONNECT o SSOMA.
7. **Flota:** el año de fabricación y la lectura del odómetro exigen números enteros válidos antes de guardar.
8. **Diagnóstico:** `/api/health` considera las **44 tablas** del esquema, no solo algunas tablas base, y columnas críticas de trabajador, usuarios, sesión y simulacros. Se agrega `/api/diagnostico/prepiloto`, restringido a ADMIN, de SOLO LECTURA, con tablas, **13 migraciones**, migraciones fallidas, cuenta ADMIN activa y configuración de evidencias; no expone datos personales ni secretos.
9. **Experiencia por módulo:** los 20 accesos cuentan con guía contextual desplegable del flujo, responsable real y control de seguridad. Centro de Control agrega vínculo visible al diagnóstico exclusivo ADMIN.
10. **Simulacros:** se preservan los seis temas teóricos TECSUP y el simulacro MMG exclusivo de Conductores, banco editable, cuatro alternativas, borrador/publicación, historial de práctica; la preparación práctica sigue como material audiovisual por camioneta, microbús, minibús y ómnibus, sin cuestionario. Estas funciones aún requieren migración 013 y ensayo.

**No se modificaron migraciones existentes**, no se ejecutó `prisma migrate deploy` ni `db push`, y no se escribieron datos de producción.

### 2. Verificaciones efectivamente realizadas

- Pruebas automatizadas de Node.js (`npm test`): **271/271 aprobadas**. Hay pruebas de reglas puras y de estructura estática; **NO** son 271 pruebas en navegador ni 271 pruebas de base de datos.
- Análisis de sintaxis TS/TSX/JS/JSX y resolución de importaciones internas: ver reporte `VALIDACION_LOCAL.json` incluido en el paquete.
- `npm run typecheck`: **NO aprobado** en el entorno disponible, faltan dependencias instaladas (errores TS2307 entre otros; no concluye que el código sea correcto).
- `npm run build`: **NO ejecutado con éxito**: falla `prisma: not found` por dependencias faltantes; la instalación npm no se completó por bloqueo del registro externo. Debe ejecutarse en CI/proyecto real.
- PostgreSQL real / Vercel / móviles / almacenamiento S3: **NO probados**.
- No hay evidencia actual de que la migración `20261121000700_areas_principal_segunda` haya sido aplicada a la web. Diagnóstico anterior confirmó `P2021` y `P2022`.

### 3. P0 obligatorios para permitir altas en la marcha blanca

**P0-A.** TI debe aislar una base de ensayo, comprobar copia de seguridad y restauración, y evaluar todas las migraciones pendientes antes de aplicar la **007** y la **013** (junto con otras que el entorno necesite). Nunca ejecutar `migrate reset` ni `db push` sobre producción.

**P0-B.** En un entorno Node 22 con registro npm accesible: `npm install --no-audit --no-fund`, `npx prisma validate`, `npx prisma generate`, `npm run typecheck`, `npm run build` y `npm test`. El archivo `.github/workflows/validacion.yml` también ejecuta PostgreSQL 16 y pruebas de integración en CI.

**P0-C.** Verificar `/api/health` y, tras ingresar como ADMIN, `/api/diagnostico/prepiloto`. Deben no reportar esquemas, migraciones ni almacenamiento faltante antes de efectuar las pruebas funcionales; estos estados **no equivalen por sí solos** a la aprobación del sistema.

**P0-D.** En ENSAYO: ADMIN registra trabajador ficticio y usuario nuevo desde Personal → Ingreso con clave asignada, inicia sesión, prueba panel administrativo/conductor en una sola cuenta, revoca función y sesión, desactiva colaborador y verifica bloqueo de acceso; sin datos reales. Simular dos altas simultáneas para la misma ficha y una contraseña equivocada.

**P0-E.** Navegador, móvil y roles: verificar completos los formularios de los 20 accesos, scroll, botones, permisos, foto/firma, mensajes vacíos, alertas, enlaces, persistencia y actualización sin recargar incorrectamente. Debe incluir prueba con dos usuarios a la vez y distintos perfiles.

### 4. Conformidad por área (requisitos que deben demostrarse)

| Área/módulo | Evaluación exigida | Estado de esta entrega |
|---|---|---|
| Centro de Control | Ficha única + cuenta + roles y sesiones + auditoría | Alta integrada añadida; integración real pendiente |
| Colaboradores | Documento único, áreas principal/secundaria, baja y sin duplicar cuenta | UI y backend; migración 007 pendiente de verificar |
| Operaciones | Servicios, conflictos, mina, vehículo apto y cambios | Revalidación transaccional añadida; pruebas DB pendientes |
| ROSTER | Guardias, noches, cruces, descansos y publicación Jefatura | Transacción concurrente reforzada; DB pendiente |
| CONNECT | Inicio/fin, checklist, reporte, fotografía, sin conexión | Panel restringido; cola offline y ensayo móvil pendientes |
| Flota | Unidades únicas y documentos, bloqueos, inspección | Validación enteros añadida; integración pendiente |
| Mantenimiento | OT, repuestos, liberación técnica independiente | Procesos previos; ensayo pendiente |
| SSOMA | Reporte, acción, evidencia, cierre y reapertura trazable | Severidad/evidencia endurecidas; ensayo pendiente |
| Homologación (en Operaciones) | Registros externos de entidad/mina, vigencia y tarjeta | Código previo; ensayo pendiente |
| Tareo | HHT efectivas, cruces medianoche y validación RR. HH. | Código previo; conciliación integral pendiente |
| Aula Virtual | Asistencia, evaluación, refuerzo, HHC, versiones | Código previo; pruebas de roles y certificados pendientes |
| RR. HH. | Expediente contractual, bajas, relación con Tareo | Código previo; versiones/documentos pendientes |
| Salud Ocupacional | Aptitud operativa y privacidad clínica | Código previo; prueba de aislamiento pendiente |
| Propietarios | Solo unidades propias | Código previo; prueba con dos propietarios pendiente |
| Comunicaciones | Destinatario, versión, acuse por persona | Código previo; pruebas end-to-end pendientes |
| Reportes | Conciliar HHT/HHC, PDF/Excel, filtros y cortes | CSV previo; PDF/Excel completos pendientes |
| Custodia | Actas comparativas, fotos, firmas y liberaciones | Código previo; uso real en móvil y evidencia pendiente |
| Almacén | Inventario único, EPP, repuestos y asignación | Stock protegido; entrega de EPP y vinculación pendientes |
| Simulacros TECSUP | Seis bancos, preguntas editables, práctica audiovisual | En código local; migración 013 y prueba pendientes |
| Simulacro MMG | Solo conductores; sin habilitación oficial | En código local; prueba pendientes |

**Reglas organizativas preservadas:** Flota es el conjunto de unidades, no departamento; Homologación, ROSTER y Tareo dependen de Operaciones; Jefatura publica ROSTER; RR. HH. valida tareo; SSOMA cierra casos; Mantenimiento libera unidades; Almacén es un inventario compartido; HHC y HHT no se mezclan.

### 5. Recomendación de funcionalidad e interfaz — siguiente iteración

**Primero, fiabilidad por proceso (P0/P1):** permisos comprobados en servidor por cargo y panel, catálogo único trabajador/unidad, bitácora inmutable y reintentos idempotentes; validación de duplicidad y concurrencia; mensajes de error claros, confirmación antes de acciones irreversibles, guardado sin perder el formulario; pruebas automatizadas con PostgreSQL y navegador.

**Segundo, un panel de trabajo por área (P1):** cada perfil abre una **bandeja de pendientes** y acciones concretas, no una página infinita de formularios. Encabezado con indicadores útiles, lista de vencimientos, filtros/tabla paginada, búsqueda, estado de cada proceso, ficha de detalle con pestañas y acciones según permisos. UI responsive para tablet, con etiquetas, botones legibles, estados vacío/cargando/error y accesibilidad de teclado.

**Tercero, procesos que faltan (P1):** notificaciones por vencimientos de licencia, SOAT, inspección, homologaciones, salud y cursos; asignación/devolución de EPP con conformidad; trabajo preventivo por fecha/km vinculado a repuestos; exportación PDF/Excel institucional; aprobación doble y comparación de actas; corrección auditada del tareo, turnos nocturnos y conciliación de pago; resumen gerencial con trazabilidad por origen.

**Cuarto, móvil y continuidad (P1/P2):** en KCJ CONNECT, cola cifrada local de inspecciones y evidencias, indicador sin conexión, reenvío con identificador idempotente, resolución de conflicto, sello horario de recepción y trazabilidad; probar explícitamente en Android/iOS y condiciones de conectividad del corredor minero antes de activar en terreno.

**Quinto, analítica (P2):** tableros por seguridad, unidades, disponibilidad, mantenimiento, formación, HHT/HHC, riesgos y cumplimiento de SLA; indicadores calculados desde registros existentes y auditables, evitando duplicar fuentes de verdad.

## Recomendación de decisión

Para el **22 de noviembre de 2026**, si no se han completado **P0-A a P0-E**, realizar únicamente una demostración controlada sin altas reales. **No migrar, reiniciar, reemplazar ni borrar datos productivos por esta entrega.** La conformidad de cada área requiere firma o aceptación explícita tras usar sus flujos reales en un entorno de ensayo.
