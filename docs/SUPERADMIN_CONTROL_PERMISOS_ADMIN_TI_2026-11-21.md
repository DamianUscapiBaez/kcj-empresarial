# KCJ CONTROL — Prioridad ADMIN / Superadministrador General

**Empresa:** KCJ PERÚ S.A.C.  
**Estado:** corrección aplicada a código fuente; no desplegada en Vercel.  
**Base examinada:** ZIP acumulado `KCJ_CONTROL_ADMIN_CONTRASENAS_GESTIONADAS_2026-11-21.zip`.

## Regla institucional aprobada

ADMIN es el responsable del máximo control **administrativo** del sistema, las cuentas, la configuración y los permisos. Puede crear cuentas, asignar claves, editar datos de acceso, cambiar su rol principal, autorizar/revocar funciones adicionales, desactivar y reactivar cuentas, y supervisar todos los módulos.

**No implica** saltar firmas o validaciones exclusivas de profesionales responsables: RR. HH. valida tareo; Mantenimiento libera técnicamente; SSOMA verifica y cierra casos; Salud Ocupacional emite aptitud; Jefatura de Operaciones publica ROSTER. ADMIN puede administrar la cuenta del responsable y dejar rastro de sus acciones, no falsificar su aprobación.

## Cambios incorporados en esta entrega

1. `Acceso y usuarios`: formulario para editar **login** y nombre visible de otra cuenta. Requiere contraseña actual del ADMIN y motivo; registra valores anterior/nuevo. Cambiar login revoca las sesiones existentes.
2. `Acceso y usuarios`: formulario para modificar el **rol principal** de otra cuenta. Requiere motivo, contraseña del ADMIN, vínculo laboral/propietario cuando corresponde y auditoría. Revoca las sesiones del usuario afectado.
3. Formulario para **desactivar cuenta** con motivo. Desactivación lógica, no `DELETE`, conserva contratos, tareos, actos e historial, y revoca sesiones.
4. Formulario para **reactivar cuenta** con motivo. No rehabilita automáticamente fichas laborales inactivas.
5. Se impide la **autodesactivación** y, cuando aplique, el cambio/desactivación del último ADMIN activo, incluso desde la baja de la ficha laboral.
6. Se mantiene el restablecimiento administrativo de contraseña con clave de ADMIN y cambio voluntario de contraseña por cada usuario.
7. Todas las acciones de gestión administrativa sensibles requieren usuario `ADMIN`, comprobación de su contraseña y registro de auditoría; actualizaciones críticas usan transacción serializable.
8. No se crean tablas nuevas: la entrega reutiliza `User`, `Session`, `UserRoleGrant`, `AuditLog` y `Worker` ya presentes en las migraciones acumuladas.

## Lo que NO está terminado

- Administración visual de **todos los catálogos** (áreas, cargos, permisos finos por acción, etc.).
- Corrección/anulación administrativa versionada de registros en todos los módulos; en esta entrega se completa la **gestión de cuentas**, no un borrado global de datos empresariales.
- Compilación completa Next.js, generación Prisma, migraciones sobre PostgreSQL aislado, pruebas end-to-end por cargo, respaldo/restauración y despliegue Vercel.
- Diagnóstico y reparación demostrados del error productivo de `Acceso y usuarios` con referencia **466256477**. No asumir que las nuevas acciones resuelven ese error hasta revisar logs/migraciones.
- Instalable PWA para KCJ CONNECT, expresamente pospuesta: **prioridad web en Google Chrome**.

## Pruebas antes de entregar a los usuarios

1. Clonar la base de producción a un **entorno de ensayo aislado y con datos anonimizados**. Guardar un backup verificable.
2. Confirmar la versión desplegada y verificar que las migraciones que crean `UserRoleGrant` y otras tablas existen realmente. Diagnóstico SQL de solo lectura en PostgreSQL: `SELECT to_regclass('public."UserRoleGrant"');`. Revisar el log del error 466256477, sin compartir secretos.
3. Ejecutar `npm ci`, `npx prisma generate`, `npm run typecheck`, `npm test`, `npm run build` y `npx prisma migrate status`; **no** aplicar migraciones directamente a producción.
4. Con dos ADMIN de prueba, verificar editar usuario, cambiar función, desactivar, reactivar y último ADMIN; comprobar revocación de una segunda sesión abierta y trazabilidad de `AuditLog`.
5. Con un trabajador inactivo, probar que ADMIN no pueda reactivar su usuario hasta corregir el estado de Personal por el procedimiento autorizado.
6. Verificar que la cuenta ADMIN no puede, por el hecho de ser ADMIN, completar una liberación técnica, validación clínica o cierre SSOMA sin la autorización competente.
7. Probar que una cuenta de conductor/propietario solo pueda acceder a sus registros y no visualizar datos personales de terceros.
8. Tras aceptación de TI y responsables, desplegar con registro de commit/version y posibilidad de reversión.

## Precaución

Nunca entregar contraseñas, `.env`, conexiones PostgreSQL, JWT/cookies o logs de datos personales por mensajes abiertos. No borrar tablas ni reiniciar el entorno productivo para resolver errores de acceso.
