# KCJ CONTROL — Modelo de interfaz profesional y funcionalidades recomendadas

## 1. Principio rector
Un sistema único con **una ficha por persona, una cuenta por persona, una ficha por unidad y un inventario central**, con interfaz adecuada al rol y auditoría de las decisiones. Las áreas no se representan como módulos nuevos ficticios: Flota, Homologación, ROSTER y Tareo son procesos con responsable real.

## 2. Experiencia para cada perfil
- **ADMIN / Centro de Control:** barra de salud de integración; asistente de alta ficha + cuenta; roles principales y adicionales; sesiones y auditoría; acceso a diagnósticos solo lectura; bitácora de errores con código rastreable.
- **Jefatura de Operaciones:** inicio con guardias por aprobar, servicios por asignar, unidad sin habilitación y cambios urgentes; vista día/semana; publicación de ROSTER solo por autoridad correcta.
- **Operaciones:** planificador de ruta y servicio; validación en tiempo real de conductor/unidad/mina; vista vehicular con documentos, certificados, checklist e inventario, sin crear departamento Flota.
- **Conductores/KCJ CONNECT:** tres grandes accesos móviles «Mi guardia», «Mi unidad / inspección» y «Reportar a SSOMA», con estado sin conexión, confirmaciones visibles y no más campos de los necesarios.
- **SSOMA:** bandeja por gravedad, vencimiento de acciones y evidencias; cierre controlado, reapertura e historial; notificación de reportes nuevos de CONNECT.
- **Mantenimiento:** tablero de inmovilizados, órdenes correctivas/preventivas y repuestos, con firma y evidencia antes de liberar técnicamente.
- **RR. HH.:** expediente de trabajador y validación del tareo en pestañas separadas; EPP y contratos consultados desde el dato central.
- **Salud:** solo aptitud y vencimientos, sin mostrar datos clínicos en otras áreas.
- **Gerencia:** indicadores con fuente identificable, pendientes críticos y reportes descargables sin exponer información personal innecesaria.
- **Instructor:** bancos TECSUP y MMG separados; edición en borrador, cuatro alternativas, respuesta correcta, material opcional, publicación e intentos. La práctica de circuito TECSUP es audiovisual, por camioneta, microbús, minibús u ómnibus.

## 3. Diseño de cada pantalla
1. **Cabecera útil:** título del proceso, responsable real, estado y botón principal.
2. **Resumen KPI:** máximo cuatro cifras significativas y fuente del indicador.
3. **Bandeja central filtrable:** tabla con búsqueda, rango de fechas, paginación y etiquetas de estado.
4. **Detalle del registro:** navegación por pestañas «Resumen · Historial · Archivos · Acciones»; conservar el contexto de usuario al guardar.
5. **Formulario progresivo:** mostrar solo campos del paso actual; validación de datos y vínculos antes de guardar; botón deshabilitado si falta catálogo obligatorio; mensajes de error entendibles.
6. **Retroalimentación:** éxito, pendientes, bloqueado y sin datos, siempre con siguiente acción concreta; confirmación para publicar, desactivar, cerrar o liberar.
7. **Auditoría:** quién, cuándo y qué cambió, sin edición retroactiva ni borrado de evidencia.

## 4. Propuesta técnica de prioridades
| Nivel | Función | Beneficio | Criterio de aceptación |
|---|---|---|---|
| P0 | Compilación, esquema y prueba real de cuentas | Permite iniciar marcha blanca | `build`, migraciones y login pasan en staging |
| P0 | Validar roles y paneles en backend | Evita acceso indebido | Intentos cruzados de dos cuentas denegados |
| P0 | Operaciones y bloqueos transaccionales | Evita asignación insegura | Dos usuarios simultáneos no crean solapes |
| P1 | Bandejas de pendientes por área | Menos clics y menús confusos | Cada área completa su operación principal |
| P1 | Buscador, filtros, paginación | Mejor uso diario y rendimiento | 1.000+ registros sin pérdida ni duplicación |
| P1 | Alertas de caducidad | Evita habilitaciones vencidas | Avisos 30, 15, 7 y 1 día según responsable |
| P1 | Firma y EPP unificados | Evita inventarios paralelos | Una entrega/devolución queda asociada al trabajador |
| P1 | CONNECT offline seguro | Trabajo en ruta con cobertura irregular | Reenvío sin duplicar eventos, con sello de recepción |
| P1 | Reportes institucionales PDF/Excel | Uso formal por Gerencia | Totales reconciliados con origen trazable |
| P2 | Indicadores ejecutivos y tendencias | Seguimiento continuo | KPI auditables y comparables por período |

## 5. Evitar estas decisiones de diseño
No fusionar HHT con HHC, ni los simulacros con la homologación externa; no permitir publicar un ROSTER desde RR. HH.; no permitir que ADMIN suplante cierres SSOMA ni liberaciones de Mantenimiento; no duplicar usuarios, unidades, propietarios, inventarios o fichas; no ocultar las fallas reales detrás de estados «sin registros».
