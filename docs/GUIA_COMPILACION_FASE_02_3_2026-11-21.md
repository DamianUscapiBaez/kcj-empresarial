# KCJ CONTROL — guía de compilación de Fase 02.3

**Fecha de revisión:** 21 de noviembre de 2026. **Estado actual:** compilación completa NO verificada en el entorno de ChatGPT por falta de dependencias locales y acceso al registro npm. Los 221 tests unitarios pasan. No se ha conectado a producción.

## Preparación de TI

1. Extraer el ZIP en una carpeta nueva, instalar Node.js 22 o superior y disponer de acceso a `https://registry.npmjs.org/`.
2. Definir `DATABASE_URL` con un PostgreSQL **de ensayo**, no la base de producción, y `KCJ_ENTORNO_ENSAYO=SI`.
3. En Windows, desde PowerShell y dentro del proyecto, ejecutar los comandos de la sección siguiente uno por uno. En Linux/macOS ejecutar `bash scripts/compilar-ensayo.sh`.
4. Si cada paso termina correctamente, guardar el registro de consola. A continuación validar migraciones y operaciones únicamente contra una copia de la base mediante el procedimiento controlado de TI.
5. Verificar firmantes autorizados, almacenamiento privado S3, actas de devolución, evidencia por componente, impresión PDF desde navegador, concurrencia y funcionamiento táctil de la firma ampliada.

## Controles incluidos en los scripts

- Verificar hash SHA-256 de las fuentes para detectar cambios inesperados.
- Instalar paquetes `npm install` (el ZIP original no incorpora `node_modules` ni `package-lock.json`).
- Ejecutar `prisma validate` y `prisma generate` (NO ejecuta `migrate deploy`, `db push`, ni seeds).
- Ejecutar 221 pruebas locales (`npm test`).
- Ejecutar `npm run typecheck` y `npm run build`.

## Reproducibilidad y seguridad

- Tras la primera instalación aprobada, TI deberá generar, revisar y conservar `package-lock.json`; a partir de ahí, usar `npm ci` en CI para instalaciones reproducibles.
- Estos scripts NO prueban por sí mismos PostgreSQL real, permisos finales, fotografía privada, ni pantalla táctil.
- NO publicar en Vercel hasta obtener una compilación real completada, pruebas de integración y aprobación de Operaciones, SSOMA, Mantenimiento y TI.
- Si el build falla por prerenderizado que requiere datos, montar datos FICTICIOS en un PostgreSQL de ensayo y registrar el error. No apuntar a producción como solución rápida.

## Comandos Windows (PowerShell)

Después de definir `KCJ_ENTORNO_ENSAYO=SI` y `DATABASE_URL` para **una base de ensayo**, ejecutar desde la raíz del proyecto:

```powershell
node scripts/verificar-paquete.mjs
npm install --no-audit --no-fund
npx --no-install prisma validate
npx --no-install prisma generate
npm test
npm run typecheck
npm run build
```

Ejecutar cada comando solo si el anterior finalizó correctamente. Estos pasos no corren migraciones ni semillas. No apuntar `DATABASE_URL` a la base real.
