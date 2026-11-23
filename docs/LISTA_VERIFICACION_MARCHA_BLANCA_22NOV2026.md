# KCJ CONTROL — Lista de comprobación para la marcha blanca

**22 de noviembre de 2026** · Una copia por área. Usar únicamente datos ficticios y un entorno de ensayo autorizado.

**Antes de comenzar — TI:**
- [ ] PostgreSQL de ensayo restaurable, no producción
- [ ] Diagnóstico `/api/health` en estado `schema: ready`
- [ ] Diagnóstico ADMIN `/api/diagnostico/colaboradores` sin `WorkArea` ni `secondaryArea` pendientes
- [ ] `prisma validate`, `prisma generate`, `prisma migrate status` y migraciones de ensayo revisadas
- [ ] `npm test`, `npm run typecheck` y `npm run build` exitosos
- [ ] Test integrado `npm run db:integration:cuentas` completado en ensayo

**Cuenta y acceso — ADMIN / TI:**
- [ ] Crear colaborador ficticio con DNI ficticio, nombre y área
- [ ] Crear cuenta vinculada con contraseña robusta (mín. 8 caracteres)
- [ ] Comprobar rechazo de cuenta duplicada para misma ficha
- [ ] Iniciar y cerrar sesión con cuenta nueva
- [ ] Conceder rol adicional CONDUCTOR a OPERACIONES y verificar selector «1. Administrativo», «2. Conductor»
- [ ] Comprobar restricciones de cada panel y revocación después de desactivar

**Cada área — navegación y carga:**
- [ ] Abrir módulos autorizados, recorrer la pantalla hasta el final y desplegar cada sección del menú
- [ ] Verificar formularios, opciones y mensajes cuando faltan datos previos
- [ ] Crear un registro ficticio; comprobar que persiste y es visible solo para autorizados
- [ ] Validar acciones y errores sin pantallas blancas ni respuestas sin explicación
- [ ] Registrar captura, URL, usuario de prueba, hora, pasos y resultado de cada incidencia

**Operaciones / Conductores:**
- [ ] Crear servicio y asignar unidad/conductor de ensayo sin violar restricciones
- [ ] Registrar ROSTER y Tareo, incluir cruce de medianoche en ensayo
- [ ] En KCJ CONNECT, consultar solo mis servicios, reportar incidencia y completar checklist ficticio

**Flota / SSOMA / Mantenimiento:**
- [ ] Registrar unidad ficticia y documento de ensayo; no usar placas reales
- [ ] Apertura de OT y acción SSOMA con bloqueo de disponibilidad
- [ ] Entrega/recepción, inventario, foto y firma ampliada en dispositivo de ensayo

**Resultado general:**
- [ ] APROBADO PARA CONTINUAR (evidencias suficientes)
- [ ] NO APROBADO (bloqueo de datos, sesión, permiso o seguridad)

**Responsables y observaciones:** ___________________________________________
