-- Rol restringido para áreas sin permisos administrativos predefinidos.
-- Nunca asignar ADMIN por elegir el área Tecnología de la Información.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'COLABORADOR';
