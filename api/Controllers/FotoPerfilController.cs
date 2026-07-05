using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Http;
using System.Web.Http.Cors;
using WebApi;

namespace WebApplication.Controllers
{
    [EnableCors(origins: "http://localhost:5173", headers: "*", methods: "*")]
    [RoutePrefix("api/FotoPerfil")]
    public class FotoPerfilController : ApiController
    {
        // Reutilizamos la lógica robusta de resolución de JWT
        private int? ResolverIdUsuarioDesdePeticion()
        {
            try
            {
                var authHeader = Request.Headers.Authorization;
                if (authHeader == null || authHeader.Scheme != "Bearer" || string.IsNullOrWhiteSpace(authHeader.Parameter))
                {
                    return null;
                }

                string token = authHeader.Parameter;
                var partes = token.Split('.');
                if (partes.Length != 3)
                {
                    return null;
                }

                string payloadBase64 = partes[1];
                payloadBase64 = payloadBase64.Replace('-', '+').Replace('_', '/');
                switch (payloadBase64.Length % 4)
                {
                    case 2: payloadBase64 += "=="; break;
                    case 3: payloadBase64 += "="; break;
                }

                var bytesPayload = Convert.FromBase64String(payloadBase64);
                string jsonPayload = System.Text.Encoding.UTF8.GetString(bytesPayload);

                int idExtraido = 0;

                var coincidenciaPascal = Regex.Match(jsonPayload, @"""IdUsuario""\s*:\s*""?([0-9]+)""?");
                if (coincidenciaPascal.Success && int.TryParse(coincidenciaPascal.Groups[1].Value, out idExtraido)) return idExtraido;

                var coincidenciaCamel = Regex.Match(jsonPayload, @"""idUsuario""\s*:\s*""?([0-9]+)""?");
                if (coincidenciaCamel.Success && int.TryParse(coincidenciaCamel.Groups[1].Value, out idExtraido)) return idExtraido;

                var coincidenciaNameId = Regex.Match(jsonPayload, @"""nameid""\s*:\s*""?([0-9]+)""?");
                if (coincidenciaNameId.Success && int.TryParse(coincidenciaNameId.Groups[1].Value, out idExtraido)) return idExtraido;

                var coincidenciaIdCorto = Regex.Match(jsonPayload, @"""id""\s*:\s*""?([0-9]+)""?");
                if (coincidenciaIdCorto.Success && int.TryParse(coincidenciaIdCorto.Groups[1].Value, out idExtraido)) return idExtraido;

                var coincidenciaSub = Regex.Match(jsonPayload, @"""sub""\s*:\s*""?([0-9]+)""?");
                if (coincidenciaSub.Success && int.TryParse(coincidenciaSub.Groups[1].Value, out idExtraido)) return idExtraido;
            }
            catch (Exception)
            {
                return null;
            }
            return null;
        }

        [HttpPost]
        [Route("Upload")]
        public IHttpActionResult Upload()
        {
            if (!Request.Content.IsMimeMultipartContent())
            {
                return Content(HttpStatusCode.UnsupportedMediaType, new { success = false, message = "Formato inválido. Se requiere multipart/form-data." });
            }

            int? idUsuarioAutenticado = ResolverIdUsuarioDesdePeticion();
            if (!idUsuarioAutenticado.HasValue)
            {
                return Content(HttpStatusCode.Unauthorized, new { success = false, message = "Sesión no válida." });
            }

            try
            {
                var httpRequest = HttpContext.Current.Request;
                if (httpRequest.Files.Count == 0)
                {
                    return BadRequest("No se ha recibido ninguna imagen.");
                }

                var archivoFisico = httpRequest.Files[0];

                // 1. Validar peso máximo (5 MB = 5 * 1024 * 1024 bytes)
                if (archivoFisico.ContentLength > 5 * 1024 * 1024)
                {
                    return Content(HttpStatusCode.BadRequest, new { success = false, message = "La imagen supera el límite de 5MB." });
                }

                // 2. Validar extensiones y Content-Type permitidos
                var extensionArchivo = Path.GetExtension(archivoFisico.FileName).ToLower();
                var extensionesPermitidas = new string[] { ".jpg", ".jpeg", ".png", ".webp" };
                var contentTypesPermitidos = new string[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };

                if (!extensionesPermitidas.Contains(extensionArchivo) || !contentTypesPermitidos.Contains(archivoFisico.ContentType.ToLower()))
                {
                    return Content(HttpStatusCode.BadRequest, new { success = false, message = "Formato no permitido. Solo se aceptan JPG, JPEG, PNG y WEBP." });
                }

                using (FinanzasDBEntities db = new FinanzasDBEntities())
                {
                    var usuario = db.Usuario.Find(idUsuarioAutenticado.Value);
                    if (usuario == null) return Content(HttpStatusCode.Unauthorized, new { success = false, message = "Usuario no encontrado." });

                    // 3. Determinar o crear carpeta del usuario (usamos misma lógica que DocumentoIngreso)
                    string nombreCarpetaUsuario = string.IsNullOrWhiteSpace(usuario.UrlCarpeta)
                        ? $"user_{usuario.IdUsuario}"
                        : usuario.UrlCarpeta;

                    var pathDirectorioRaiz = HttpContext.Current.Server.MapPath("~/Uploads/");
                    var pathCarpetaDestino = Path.Combine(pathDirectorioRaiz, nombreCarpetaUsuario);

                    if (!Directory.Exists(pathCarpetaDestino))
                    {
                        Directory.CreateDirectory(pathCarpetaDestino);
                    }

                    // 4. Generar nombre de archivo (Nombre_Apellido) limpiando caracteres raros
                    string nombreLimpio = Regex.Replace(usuario.Nombre ?? "Usuario", @"[^a-zA-Z0-9]", "");
                    string apellidoLimpio = Regex.Replace(usuario.Apellido ?? "Anonimo", @"[^a-zA-Z0-9]", "");
                    string baseNombreArchivo = $"{nombreLimpio}_{apellidoLimpio}";

                    // 5. Eliminar foto anterior si existe (buscamos cualquier extensión permitida con ese nombre)
                    foreach (var ext in extensionesPermitidas)
                    {
                        string rutaAnterior = Path.Combine(pathCarpetaDestino, baseNombreArchivo + ext);
                        if (File.Exists(rutaAnterior))
                        {
                            File.Delete(rutaAnterior);
                        }
                    }

                    // 6. Guardar nueva foto
                    var nombreFisicoFinal = baseNombreArchivo + extensionArchivo;
                    var rutaFisicaCompleta = Path.Combine(pathCarpetaDestino, nombreFisicoFinal);

                    archivoFisico.SaveAs(rutaFisicaCompleta);

                    string rutaRelativa = $"/Uploads/{nombreCarpetaUsuario}/{nombreFisicoFinal}";

                    return Ok(new
                    {
                        success = true,
                        ruta = rutaRelativa
                    });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("MiFoto")]
        public IHttpActionResult ObtenerMiFoto()
        {
            int? idUsuarioAutenticado = ResolverIdUsuarioDesdePeticion();
            if (!idUsuarioAutenticado.HasValue) return Content(HttpStatusCode.Unauthorized, "Sesión no válida.");

            try
            {
                using (FinanzasDBEntities db = new FinanzasDBEntities())
                {
                    var usuario = db.Usuario.Find(idUsuarioAutenticado.Value);
                    if (usuario == null) return NotFound();

                    string nombreCarpetaUsuario = string.IsNullOrWhiteSpace(usuario.UrlCarpeta)
                        ? $"user_{usuario.IdUsuario}"
                        : usuario.UrlCarpeta;

                    var pathDirectorioRaiz = HttpContext.Current.Server.MapPath("~/Uploads/");
                    var pathCarpetaDestino = Path.Combine(pathDirectorioRaiz, nombreCarpetaUsuario);

                    // Si la carpeta ni siquiera existe, no hay foto
                    if (!Directory.Exists(pathCarpetaDestino))
                    {
                        return Ok(new { ruta = (string)null });
                    }

                    string nombreLimpio = Regex.Replace(usuario.Nombre ?? "Usuario", @"[^a-zA-Z0-9]", "");
                    string apellidoLimpio = Regex.Replace(usuario.Apellido ?? "Anonimo", @"[^a-zA-Z0-9]", "");
                    string baseNombreArchivo = $"{nombreLimpio}_{apellidoLimpio}";

                    var extensionesPermitidas = new string[] { ".jpg", ".jpeg", ".png", ".webp" };

                    // Buscar el archivo físico
                    foreach (var ext in extensionesPermitidas)
                    {
                        string rutaFisica = Path.Combine(pathCarpetaDestino, baseNombreArchivo + ext);
                        if (File.Exists(rutaFisica))
                        {
                            string rutaRelativa = $"/Uploads/{nombreCarpetaUsuario}/{baseNombreArchivo}{ext}";
                            return Ok(new { ruta = rutaRelativa });
                        }
                    }

                    // Si llegamos acá, no se encontró ningún archivo con ese nombre
                    return Ok(new { ruta = (string)null });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}