-- Asignar rol administrador a un usuario existente
UPDATE dbo.Usuario
SET IdRol = 4
WHERE NombreUsuario = 'NOMBRE_USUARIO_ADMIN';

-- Verificar usuarios y roles
SELECT IdUsuario, NombreUsuario, Email, IdRol, Activo
FROM dbo.Usuario
ORDER BY IdUsuario DESC;

