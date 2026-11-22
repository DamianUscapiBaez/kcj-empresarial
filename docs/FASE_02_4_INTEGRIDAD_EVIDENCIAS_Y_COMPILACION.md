# Fase 02.4 — integridad de evidencias y preparación de compilación (21/11/2026)

## Cambios realizados en código de ensayo

- Nueva versión de huella de acta **v3**. Incluye las fotos originales, la referencia del archivo principal y el ID de entrega relacionada, preservando los cálculos v1 y v2 de actas anteriores.
- Registro de `expectedBytes` para nuevas cargas S3, verificado contra `HeadObject.ContentLength` al confirmar. Activos antiguos mantienen `NULL` sin bloquear lectura.
- URL de carga condicional con `If-None-Match: *` y cabecera enviada desde los tres componentes de carga del frontend: busca impedir sobreescritura por reuso de una URL PUT previamente autorizada.
- Migración aditiva 20261121001200: no elimina registros ni sustituye evidencias.

## Requisitos obligatorios fuera del código

1. **Compatibilidad S3**: validar que el proveedor compatible implemente PUT condicional `If-None-Match: *` y que el CORS del bucket permita las cabeceras `Content-Type` y `If-None-Match`. Rechazar sobreescritura con `412 Precondition Failed` o `409 ConditionalRequestConflict` según escenario; repetir con otra clave para una carga nueva.
2. **Protección del bucket**: política que impida a usuarios y aplicaciones reescribir o eliminar objetos confirmados, versionado y, si corresponde, retención/Object Lock. El encabezado condicional no protege contra administradores con credenciales S3 ni configuraciones de almacenamiento que lo ignoren.
3. **Compilación real**: instalar dependencias del `package.json` con acceso al registro npm; ejecutar Prisma validate/generate, `npm test`, `npm run typecheck`, `npm run build` y registrar resultados. El entorno de esta entrega NO permite descargar dependencias, por lo que no se declara build exitoso.
4. **PostgreSQL de ensayo**: ejecutar y revertir las migraciones en una copia, verificar concurrencia, recuperación y permisos; no ejecutar contra producción antes de aprobación.
5. **Firma manuscrita**: verificar operador testigo, identidad del firmante, móvil/tablet, cambios de tamaño, exportación y reproducción; no afirmar firma digital certificada.
6. **Uso integral**: comprobar 18 módulos, roles, checklist, SOAT, revisión técnica, mantenimiento, SSOMA, Tarjeta Amarilla si aplica y bloqueos reales antes de liberar la unidad.

Los cambios en esta fase son mejoras **del código y pruebas locales**, no certificación de producción ni despliegue en Vercel.

## Resultados verificables de este paquete

- Pruebas Node.js: **226/226 aprobadas**.
- Análisis de sintaxis TS/TSX: **108 archivos; 0 errores de parsing**.
- Comprobación sintáctica ≠ tipado `tsc`; test unitario ≠ prueba de integración.
- Instalación npm intentada y bloqueada por DNS del registro: `EAI_AGAIN`, por lo que **no hay build de Next.js concluido**.
- ZIP y manifiesto de hashes verificados tras su creación.
