/**
 * Campos estrictamente necesarios de la ficha laboral al verificar una sesión.
 * No seleccionar Worker completo: una migración funcional pendiente (p. ej.,
 * Worker.secondaryArea) no debe bloquear la autenticación, la navegación ni
 * el diagnóstico de Colaboradores. No se usan datos privados del padrón aquí.
 * Esta selección no modifica permisos ni valida que la BD esté actualizada.
 */
export const trabajadorMinimoSesion = {
 id:true,
 name:true,
 active:true,
} as const;
