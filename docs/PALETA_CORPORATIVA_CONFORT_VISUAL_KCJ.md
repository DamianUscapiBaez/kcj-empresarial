# KCJ CONTROL — Paleta corporativa de confort visual

**Fecha:** 21 de noviembre de 2026. **Origen:** corrección solicitada tras revisar la captura de `/dashboard/operaciones` en Vercel. El logotipo es el archivo corporativo original, sin ediciones.

## Tokens Tailwind

| Uso | Token/clase | Hex |
|---|---|---|
| Fondo principal | `bg-kcj-paper` | `#F3F5F7` |
| Menú lateral | `bg-kcj-sidebar` | `#EAF0F3` |
| Encabezado y tarjetas | `bg-white` | `#FFFFFF` |
| Texto principal | `text-kcj-charcoal` | `#2A323A` |
| Texto secundario | `text-kcj-muted` | `#5B6672` |
| Borde suave | `border-kcj-border` | `#DAE1E7` |
| Acción principal | `bg-kcj-red` | `#A6263A` |
| Hover acción | `bg-kcj-redDark` | `#831E2F` |
| Selección / fondo de iconos | `bg-kcj-redSoft` | `#F7E9EC` |

## Correcciones

1. Menú claro con texto grafito y grupos legibles; se eliminó la combinación gris pálido con texto blanco.
2. Módulo seleccionado: borde rosa discreto, fondo rojo muy suave y texto rojo oscuro. Sin contorno negro grueso.
3. Elementos de formulario, botones, tablas, títulos y banners usan el mismo conjunto de tokens, con menor saturación.
4. Mantiene colores con significado: alertas y errores siguen diferenciándose, sin convertir todo en rojo.
5. Conserva `public/assets/kcj-logo-original.jpg` sin cambios.

## Qué NO cambió

No se modifican `prisma/`, `lib/`, Server Actions, APIs, rutas, nombres de campos, credenciales ni reglas. El despliegue existente en Vercel no cambia hasta que TI publique este repositorio. No sustituye pruebas de integración con PostgreSQL ni aprobación funcional de módulos.

## Verificación para TI

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

En `/login`, `/dashboard` y `/dashboard/operaciones` comprobar menú legible, foco de teclado, formulario de registros, tablas, y responsividad en PC/tablet/móvil; confirmar ausencia de errores de consola. **No ejecutar migraciones de base de datos por un cambio de paleta**. Vercel: desplegar el mismo proyecto y revisar el HTML/CSS del commit publicado; con caché antigua realizar actualización forzada del navegador.

## Relación de contraste (valores aproximados)

- Texto `#33404A` sobre menú `#EAF0F3`: **9.25:1**.
- Texto secundario `#596774` sobre menú `#EAF0F3`: **4.9:1**.
- Texto blanco sobre botón rojo `#A6263A`: **7.1:1**.
- Rojo `#822334` sobre fondo activo `#F7E9EC`: **7.9:1**.
