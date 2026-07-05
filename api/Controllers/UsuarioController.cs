using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Web.Http;
using WebApi;
using System.Configuration;
using BCrypt.Net;
using System.Data.SqlClient;

namespace WebApplication.Controllers
{
    [RoutePrefix("api/Usuarios")]
    public class UsuariosController : ApiController
    {
        [HttpGet]
        [Route("")]
        public IHttpActionResult Get()
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var usuarios = db.Usuario
                    .Select(u => new
                    {
                        u.IdUsuario,
                        u.Nombre,
                        u.Apellido,
                        u.Email,
                        u.Telefono,
                        u.NombreUsuario,
                        u.UrlCarpeta,
                        u.FechaAlta,
                        u.Activo,
                        u.IdRol
                    })
                    .ToList();

                return Ok(usuarios);
            }
        }

        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult Get(int id)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var usuario = db.Usuario
                    .Where(u => u.IdUsuario == id)
                    .Select(u => new
                    {
                        u.IdUsuario,
                        u.Nombre,
                        u.Apellido,
                        u.Email,
                        u.Telefono,
                        u.NombreUsuario,
                        u.UrlCarpeta,
                        u.FechaAlta,
                        u.Activo,
                        u.IdRol
                    })
                    .FirstOrDefault();

                if (usuario == null) return NotFound();

                return Ok(usuario);
            }
        }

        // CORREGIDO: Ahora lee el ID del usuario directamente desde las credenciales del Token (Stateless)
        // ya que el token no se guarda más en la base de datos.
        [HttpGet]
        [Route("ByToken")]
        public IHttpActionResult GetbyToken()
        {
            var authHeader = Request.Headers.Authorization;
            if (authHeader == null || string.IsNullOrEmpty(authHeader.Parameter))
            {
                return BadRequest("No se proporcionó un token de autorización.");
            }

            string token = authHeader.Parameter;

            try
            {
                // Leemos el token JWT sin ir a la base de datos
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);

                // Extraemos el ID que guardamos en los "claims" al generar el token
                var idClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "id")?.Value;

                if (string.IsNullOrEmpty(idClaim) || !int.TryParse(idClaim, out int idUsuario))
                {
                    return BadRequest("Token inválido.");
                }

                using (FinanzasDBEntities db = new FinanzasDBEntities())
                {
                    var usuario = db.Usuario.Find(idUsuario);
                    if (usuario == null) return NotFound();

                    return Ok(new
                    {
                        usuario.IdUsuario,
                        usuario.Nombre,
                        usuario.Apellido,
                        usuario.Email,
                        usuario.Telefono,
                        usuario.NombreUsuario,
                        usuario.UrlCarpeta,
                        usuario.FechaAlta,
                        usuario.Activo,
                        usuario.IdRol
                    });
                }
            }
            catch (Exception)
            {
                return BadRequest("Error al procesar el token.");
            }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Post([FromBody] Usuario value)
        {
            if (value == null) return BadRequest("Datos del usuario no proporcionados.");

            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                try
                {
                    value.NombreUsuario = value.NombreUsuario?.Trim();
                    value.Email = value.Email?.Trim();

                    if (db.Usuario.Any(u => u.NombreUsuario == value.NombreUsuario))
                    {
                        return Content(HttpStatusCode.Conflict, new { message = "Ese nombre de usuario ya esta registrado." });
                    }

                    if (db.Usuario.Any(u => u.Email == value.Email))
                    {
                        return Content(HttpStatusCode.Conflict, new { message = "Ese correo electronico ya esta registrado." });
                    }

                    // 1. Encriptamos la contraseña ANTES de guardar
                    value.PasswordHash = BCrypt.Net.BCrypt.HashPassword(value.PasswordHash);
                    value.Activo = true;

                    // 2. Guardamos el usuario (la BD ya no tiene la columna Token)
                    db.Usuario.Add(value);
                    db.SaveChanges();

                    // 3. Generamos el Token JWT para que React lo use
                    string tokenGenerado = GenerarTokenJWT(value);

                    return Ok(new
                    {
                        Message = "Usuario creado exitosamente",
                        Token = tokenGenerado,
                        NombreUsuario = value.NombreUsuario
                    });
                }
                catch (Exception ex)
                {
                    if (EsClaveDuplicada(ex))
                    {
                        var detalle = ObtenerMensajesExcepcion(ex);
                        var mensaje = detalle.IndexOf("Email", StringComparison.OrdinalIgnoreCase) >= 0
                            ? "Ese correo electronico ya esta registrado."
                            : "Ese nombre de usuario ya esta registrado.";

                        return Content(HttpStatusCode.Conflict, new { message = mensaje });
                    }

                    return InternalServerError(new Exception("No se pudo registrar el usuario. Intentalo nuevamente."));
                }
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public void Put(int id, [FromBody] Usuario value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var obj = db.Usuario.Find(id);
                if (obj != null)
                {
                    obj.Nombre = value.Nombre;
                    obj.Apellido = value.Apellido;
                    obj.Email = value.Email;
                    obj.Telefono = value.Telefono;
                    obj.NombreUsuario = value.NombreUsuario;

                    // Nota: Si el usuario actualiza la contraseña aquí, también deberías hashearla.
                    // Si value.PasswordHash viene diferente, deberías aplicar BCrypt.HashPassword.
                    if (!string.IsNullOrEmpty(value.PasswordHash) && value.PasswordHash != obj.PasswordHash)
                    {
                        obj.PasswordHash = BCrypt.Net.BCrypt.HashPassword(value.PasswordHash);
                    }

                    obj.UrlCarpeta = value.UrlCarpeta;
                    obj.FechaAlta = value.FechaAlta;
                    obj.Activo = value.Activo;

                    // ELIMINADO: obj.Token = value.Token; (Ya no existe)

                    db.Entry(obj).State = System.Data.Entity.EntityState.Modified;
                    db.SaveChanges();
                }
            }
        }

        [HttpDelete]
        [Route("{id:int}")]
        public void Delete(int id)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var obj = db.Usuario.Find(id);
                if (obj != null)
                {
                    db.Usuario.Remove(obj);
                    db.SaveChanges();
                }
            }
        }

        // CORREGIDO: Lógica de Login segura usando BCrypt y sin guardar el token.
        [HttpPost]
        [Route("Login")]
        public IHttpActionResult Login([FromBody] Usuario login)
        {
            if (login == null || string.IsNullOrEmpty(login.NombreUsuario) || string.IsNullOrEmpty(login.PasswordHash))
                return BadRequest("Datos no proporcionados");

            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var user = db.Usuario.FirstOrDefault(u =>
                    u.NombreUsuario == login.NombreUsuario && u.Activo == true);

                // 1. Comparamos la contraseña plana que llega de React con el Hash de la BD usando Verify
                if (user == null || !BCrypt.Net.BCrypt.Verify(login.PasswordHash, user.PasswordHash))
                {
                    return Content(HttpStatusCode.Unauthorized, new { message = "Usuario o contraseña incorrectos" });
                }

                // 2. Generamos el token de forma dinámica
                var tokenGenerado = GenerarTokenJWT(user);

                // 3. Devolvemos el token directamente (SIN guardarlo en la base de datos)
                return Ok(new
                {
                    Token = tokenGenerado,
                    Usuario = user.NombreUsuario,
                    Nombre = user.Nombre,
                    Apellido = user.Apellido,
                    IdRol = user.IdRol
                });
            }
        }

        // Asegúrate de agregar arriba: using System.Configuration;

        private string GenerarTokenJWT(Usuario usuario)
        {
            // Leemos la clave secreta desde el Web.config
            var secretKey = ConfigurationManager.AppSettings["JwtSecret"];
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
        new Claim(JwtRegisteredClaimNames.Sub, usuario.NombreUsuario ?? ""),
        new Claim("id", usuario.IdUsuario.ToString()),
        new Claim("rol", usuario.IdRol.ToString()),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

            var token = new JwtSecurityToken(
                issuer: "tu_api_finanzas",
                audience: "tu_front_end",
                claims: claims,
                expires: DateTime.Now.AddHours(8),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private bool EsClaveDuplicada(Exception ex)
        {
            while (ex != null)
            {
                var sqlException = ex as SqlException;
                if (sqlException != null)
                {
                    foreach (SqlError error in sqlException.Errors)
                    {
                        if (error.Number == 2601 || error.Number == 2627)
                            return true;
                    }
                }

                ex = ex.InnerException;
            }

            return false;
        }

        private string ObtenerMensajesExcepcion(Exception ex)
        {
            var mensajes = new StringBuilder();

            while (ex != null)
            {
                mensajes.AppendLine(ex.Message);
                ex = ex.InnerException;
            }

            return mensajes.ToString();
        }
    }
}
