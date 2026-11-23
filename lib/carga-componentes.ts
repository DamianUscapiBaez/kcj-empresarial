import type { ModuleSlug } from "@/lib/modulos";

/** Cargar exclusivamente los catálogos que utiliza cada pantalla.
 * No consultar otras tablas desde módulos que no dependen de ellas.
 */
const MODULOS_CON_TRABAJADORES: ReadonlySet<ModuleSlug> = new Set<ModuleSlug>([
  "acceso", "homologacion", "salud", "roster", "operaciones", "tareo", "rrhh", "ssoma", "aula",
]);
const MODULOS_CON_VEHICULOS: ReadonlySet<ModuleSlug> = new Set<ModuleSlug>([
  "flota", "mantenimiento", "operaciones", "ssoma", "custodia",
]);

export function requiereCatalogoPersonal(modulo: ModuleSlug): boolean {
  return MODULOS_CON_TRABAJADORES.has(modulo);
}
export function requiereCatalogoVehiculos(modulo: ModuleSlug): boolean {
  return MODULOS_CON_VEHICULOS.has(modulo);
}
