# Matriz de aceptación para TI y cada área

Entorno: ______  Fecha: ______  Responsable técnico: ______  Responsable del área: ______

| N.º | Módulo | Prueba obligatoria (positiva y negativa) | Evidencia / acta |
|---|---|---|---|
| 01 | Acceso y usuarios | Seed crea cuenta; login; cambio de clave; conductor no entra en RR. HH.; revocar cuenta cierra sesiones | Pendiente TI |
| 02 | Personal | DNI único; modificar cargo audita; inactivar trabajador revoca acceso | Pendiente |
| 03 | Operaciones | Crear/asignar/iniciar/finalizar servicio; bloquear unidad o conductor no disponible; cambio de unidad no duplica tareo | Pendiente |
| 04 | ROSTER | Guardia publicada por Jefe; descanso; conflicto de guardias nocturnas | Pendiente |
| 05 | KCJ CONNECT | Solo servicios propios, inicio único, inspección con reenvío idempotente; verificar offline en campo | Pendiente |
| 06 | Flota | Ficha única por placa; documentos con evidencia y vencimiento; lectura de kilometraje no retrocede | Pendiente |
| 07 | Mantenimiento | OT crítica impide servicio y solo técnico libera con evidencia válida | Pendiente |
| 08 | SSOMA | Reporte incidente/accidente/condición; acción+fecha+responsable+evidencia; cierre restringido; reapertura auditada | Pendiente |
| 09 | Homologación | Tarjeta Amarilla por unidad y vigencia; impedir servicio mina si vence antes del fin | Pendiente |
| 10 | Tareo | Jornada nocturna; no duplicar horas; RR. HH. revisa/valida | Pendiente |
| 11 | Aula Virtual | Publicar curso y cuestionario; registrar asistencia; máximo dos intentos; aprobar, HHC y certificado verificable | Pendiente |
| 12 | RR. HH. | Contratos y versiones con evidencia privada y acceso restringido | Pendiente |
| 13 | Salud Ocupacional | Solo Salud emite aptitud; Operaciones no ve diagnóstico; bloqueo por no apto | Pendiente |
| 14 | Propietarios | Solo vehículos vinculados, sin permisos de edición técnica | Pendiente |
| 15 | Comunicaciones | Destinatarios por rol, una confirmación por persona y versión, preserva historial de versiones | Pendiente |
| 16 | Reportes y estadísticas | Conteos y exportación CSV, HHC vs HHT, exportaciones auditadas | Pendiente |
| 17 | Entrega y recepción | Custodia bloquea disponibilidad; recepción no libera falla mecánica sin Mantenimiento | Pendiente |
| Extra | Almacén y herramientas | Saldo no negativo; operaciones concurrentes y trazabilidad de ingresos/salidas | Pendiente |

## Condiciones de habilitación de datos reales

- CI verde: validación de Prisma, aplicación de migraciones en PostgreSQL de prueba, seed idempotente, prueba de integración, typecheck y build.
- Vercel publica, `/api/health` devuelve `status: ok`, login y permisos correctos, errores auditablemente registrados.
- CORS S3 configurado y comprobado con PDF y foto; no existe acceso público por listado de bucket.
- Los responsables de Operaciones, SSOMA, RR. HH., Salud Ocupacional y TI firman su parte de la aceptación.
- Política aprobada de copias/restauración y plan de contingencia ante indisponibilidad del sistema.

**No declarar “apto para depender exclusivamente del sistema” con filas pendientes.**
