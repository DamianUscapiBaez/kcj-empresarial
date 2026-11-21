# Arquitectura técnica y mantenimiento del código fuente

## Stack

- Next.js 15+ App Router (Server Components por defecto, Server Actions para mutaciones).
- React y TypeScript con `strict:true`.
- Tailwind CSS para todas las pantallas.
- Prisma ORM 6, PostgreSQL centralizado.
- Autenticación nativa con sesión persistida (hash de token en BD), roles servidor, auditoría.
- S3 compatible para evidencias privadas con URL de carga firmada y confirmación por HEAD.
- Github Actions para validación contra PostgreSQL y despliegue manual de migraciones.

## Decisiones de negocio

Una persona = una ficha `Worker`; una unidad = una ficha `Vehicle`. Planificación ROSTER y horas reales Tareo son objetos diferentes. La aptitud de Salud es un resultado operativo separado de historias clínicas. La Tarjeta Amarilla es vehículo/alcance/vigencia; no toda unidad la necesita. Cerrado SSOMA exige acciones verificadas, responsable y evidencia, excepto motivo técnico documentado sin acciones. El propietario solo consulta unidades vinculadas. Aula mide HHC acreditadas (curso aprobado) separadas de HHT.

## Contribuir y modificar

1. Trabajar en Git privado con ramas, revisiones de código y pull requests.
2. Cualquier nuevo campo relacional cambia `prisma/schema.prisma` y crea nueva migración `prisma migrate dev --name motivo` en base de desarrollo, nunca usar `migrate reset` en empresa.
3. Toda mutación debe verificar autenticación/autorización dentro de Server Action o route.ts y escribir auditoría.
4. No incluir `any`, scripts que manipulen DOM ni lógica negocio dependiente de servidor local Windows.
5. Añadir pruebas puras y tests PostgreSQL con transacciones revertidas. Si se cambia regla SSOMA/Aula/ROSTER, añadir test del caso negativo.
6. Antes de desplegar: revisar respaldo, `prisma migrate deploy` y permisos, seguir matriz aceptación.

## Propiedad y licencia

El proyecto se entrega **sin ofuscación**, en archivos originales editables para el equipo técnico de KCJ PERÚ S.A.C. No se adjunta licencia OSS permisiva automáticamente: la empresa debe decidir por escrito si permite redistribución pública del código. Un repositorio privado es el valor seguro por defecto.
