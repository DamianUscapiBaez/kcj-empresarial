# KCJ CONTROL — Tareo general: área automática y origen verificable

Fecha: 21 de noviembre de 2026
Alcance: copia local del código fuente; NO ejecutado contra producción.

## Corrección funcional

Se reemplazó el campo libre «Área / fuente» por dos conceptos separados:

1. **Área laboral**: se muestra automáticamente al escoger un trabajador. El servidor consulta nuevamente la ficha del trabajador, sin confiar en el navegador. Una copia del área se conserva en cada **nuevo** registro (`Timesheet.areaAtEntry`).
2. **Origen del registro**: selector controlado, con las opciones:
   - **Servicio registrado**: se selecciona un servicio iniciado o finalizado, perteneciente al trabajador. El servidor coteja la asignación y el intervalo; guarda `serviceId` y `source = SERVICIO`.
   - **Registro operativo interno**: para labores realmente realizadas sin servicio enlazado. Exige explicación y respaldo descriptivo de entre 12 y 500 caracteres; guarda `source = REGISTRO_INTERNO` y `reason`. Requiere revisión de RR. HH.; no acredita automáticamente horas.

Los campos «Inicio real» y «Fin real» siguen siendo horas efectivamente trabajadas. No se copian del ROSTER. La duración se calcula en el servidor. Se impide declarar un fin futuro y registrar periodos incompatibles o solapados (transacción Serializable).

**Autorización**: Operaciones / Jefatura de Operaciones registra; ADMIN puede registrar por administración excepcional. RR. HH. valida registros pendientes. La acción del servidor también controla permisos.

## Presentación del tareo

La tabla muestra trabajador, área histórica cuando esté disponible, inicio, fin, horas, origen (servicio por código o registro interno), justificación y estado. Los tareos previos permanecen intactos, incluidos los valores heredados de `source`.

## Compatibilidad y migración

Migración ADITIVA: `prisma/migrations/20261121000500_tareo_area_origen_controlado/migration.sql`.

```sql
ALTER TABLE "Timesheet" ADD COLUMN "areaAtEntry" TEXT;
```

No altera ni borra filas. Las filas históricas tienen `areaAtEntry = NULL`; en pantalla se muestra como referencia el área actual de la ficha, que **no constituye evidencia del área histórica**. Para una auditoría retrospectiva hace falta contrastar los cambios de cargo/área en la bitácora.

**Pasos de validación antes de publicar**:

1. Respaldar y restaurar PostgreSQL en un entorno aislado.
2. Ejecutar `npm ci` (o instalación reproducible según el gestor autorizado); `npx prisma generate`; `npx prisma migrate deploy` sobre la base de prueba. Este ZIP no incorpora un archivo lock; TI debe generar y versionar uno para instalaciones reproducibles antes del despliegue.
3. Ejecutar `npm test`, `npm run typecheck` y `npm run build` en un entorno con Next.js/Prisma instalados.
4. Crear trabajador ficticio y un servicio ficticio; iniciar y finalizar servicio y registrar tareo vinculado, comprobando trabajador, intervalo y área.
5. Intentar usar un servicio de otra persona, uno planificado, un periodo futuro y un solapamiento; deben rechazarse.
6. Registrar una actividad interna real de prueba con motivo; RR. HH. la revisa y valida. Confirmar que ROSTER no crea horas.
7. Cambiar el área de la ficha de prueba: el tareo nuevo debe conservar `areaAtEntry` original.
8. Comprobar dos solicitudes simultáneas; una debe ser rechazada, sin duplicar horas. Revisar sesión, mensajes de error y bitácora.

## Limitaciones no resueltas

- Las pruebas automatizadas locales no acreditan una compilación completa ni funcionamiento con PostgreSQL real.
- Las pruebas en dispositivos y la marcha blanca multirol siguen pendientes.
- El registro interno requiere respaldo documental/procedimental para que RR. HH. lo verifique; el texto del motivo no equivale por sí solo a evidencia validada.
- El sistema todavía no tiene reconciliación automática integral con todos los eventos de CONNECT, novedades y pausas; aquí se vincula al servicio existente.
