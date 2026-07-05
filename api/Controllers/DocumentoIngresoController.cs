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
    [RoutePrefix("api/DocumentoIngreso")]
    public class DocumentoIngresoController : ApiController
    {
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

                // Patrón 1: Estructura exacta PascalCase -> "IdUsuario":9 o "IdUsuario":"9"
                var coincidenciaPascal = Regex.Match(jsonPayload, @"""IdUsuario""\s*:\s*""?([0-9]+)""?");
                if (coincidenciaPascal.Success && int.TryParse(coincidenciaPascal.Groups[1].Value, out idExtraido))
                {
                    return idExtraido;
                }

                // Patrón 2: Estructura camelCase -> "idUsuario":9 o "idUsuario":"9"
                var coincidenciaCamel = Regex.Match(jsonPayload, @"""idUsuario""\s*:\s*""?([0-9]+)""?");
                if (coincidenciaCamel.Success && int.TryParse(coincidenciaCamel.Groups[1].Value, out idExtraido))
                {
                    return idExtraido;
                }

                // Patrón 3: Estructura estándar JWT Claim -> "nameid":"9" o "nameid":9
                var coincidenciaNameId = Regex.Match(jsonPayload, @"""nameid""\s*:\s*""?([0-9]+)""?");
                if (coincidenciaNameId.Success && int.TryParse(coincidenciaNameId.Groups[1].Value, out idExtraido))
                {
                    return idExtraido;
                }

                // Patrón 4: Identificador abreviado universal -> "id":"9" o "id":9
                var coincidenciaIdCorto = Regex.Match(jsonPayload, @"""id""\s*:\s*""?([0-9]+)""?");
                if (coincidenciaIdCorto.Success && int.TryParse(coincidenciaIdCorto.Groups[1].Value, out idExtraido))
                {
                    return idExtraido;
                }

                // Patrón 5: Identificador de sujeto -> "sub":"9" o "sub":9
                var coincidenciaSub = Regex.Match(jsonPayload, @"""sub""\s*:\s*""?([0-9]+)""?");
                if (coincidenciaSub.Success && int.TryParse(coincidenciaSub.Groups[1].Value, out idExtraido))
                {
                    return idExtraido;
                }
            }
            catch (Exception)
            {
                return null;
            }
            return null;
        }

        [HttpGet]
        [Route("Listar")]
        public IHttpActionResult Listar()
        {
            int? idUsuarioAutenticado = ResolverIdUsuarioDesdePeticion();
            if (!idUsuarioAutenticado.HasValue)
            {
                return Content(HttpStatusCode.Unauthorized, "La sesión ha expirado o el token provisto es inválido.");
            }

            try
            {
                using (FinanzasDBEntities db = new FinanzasDBEntities())
                {
                    var usuarioExiste = db.Usuario.Any(u => u.IdUsuario == idUsuarioAutenticado.Value);
                    if (!usuarioExiste)
                    {
                        return Content(HttpStatusCode.Unauthorized, "El usuario asociado al token no se encuentra registrado.");
                    }

                    var documentos = db.DocumentoIngreso
                        .Where(d => d.IdUsuario == idUsuarioAutenticado.Value)
                        .Select(d => new
                        {
                            d.IdDocumentoIngreso,
                            d.IdIngreso,
                            d.NombreArchivoOriginal,
                            d.NombreArchivoFisico,
                            d.RutaArchivo,
                            d.ExtensionArchivo,
                            d.ContentType,
                            d.TamanioBytes,
                            d.FechaCarga,
                            d.IdUsuario
                        })
                        .OrderByDescending(d => d.FechaCarga)
                        .ToList();

                    return Ok(documentos);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("Upload")]
        public IHttpActionResult UploadDocumento()
        {
            if (!Request.Content.IsMimeMultipartContent())
            {
                return Content(HttpStatusCode.UnsupportedMediaType, "Tipo de solicitud inválida. Se requiere multipart/form-data.");
            }

            int? idUsuarioAutenticado = ResolverIdUsuarioDesdePeticion();
            if (!idUsuarioAutenticado.HasValue)
            {
                return Content(HttpStatusCode.Unauthorized, "Operación denegada. Sesión de usuario no válida.");
            }

            try
            {
                var httpRequest = HttpContext.Current.Request;
                if (httpRequest.Files.Count == 0)
                {
                    return BadRequest("No se ha recibido ningún archivo adjunto en la petición.");
                }

                var archivoFisico = httpRequest.Files[0];
                var idIngresoForm = httpRequest.Form["idIngreso"];
                int? idIngresoAsociado = string.IsNullOrEmpty(idIngresoForm) ? (int?)null : Convert.ToInt32(idIngresoForm);

                using (FinanzasDBEntities db = new FinanzasDBEntities())
                {
                    var usuario = db.Usuario.Find(idUsuarioAutenticado.Value);
                    if (usuario == null)
                    {
                        return Content(HttpStatusCode.Unauthorized, "El usuario solicitado no existe en el sistema.");
                    }

                    string nombreCarpetaUsuario = string.IsNullOrWhiteSpace(usuario.UrlCarpeta)
                        ? $"user_{usuario.IdUsuario}"
                        : usuario.UrlCarpeta;

                    var pathDirectorioRaiz = HttpContext.Current.Server.MapPath("~/Uploads/");
                    var pathCarpetaDestino = Path.Combine(pathDirectorioRaiz, nombreCarpetaUsuario);

                    if (!Directory.Exists(pathCarpetaDestino))
                    {
                        Directory.CreateDirectory(pathCarpetaDestino);
                    }

                    var extensionArchivo = Path.GetExtension(archivoFisico.FileName).ToLower();
                    var nombreFisicoUnico = Guid.NewGuid().ToString() + extensionArchivo;
                    var rutaFisicaCompleta = Path.Combine(pathCarpetaDestino, nombreFisicoUnico);

                    archivoFisico.SaveAs(rutaFisicaCompleta);

                    var nuevoDocumento = new DocumentoIngreso
                    {
                        IdUsuario = usuario.IdUsuario,
                        IdIngreso = (int)idIngresoAsociado,
                        NombreArchivoOriginal = archivoFisico.FileName,
                        NombreArchivoFisico = nombreFisicoUnico,
                        RutaArchivo = $"/Uploads/{nombreCarpetaUsuario}/{nombreFisicoUnico}",
                        ExtensionArchivo = extensionArchivo,
                        ContentType = archivoFisico.ContentType,
                        TamanioBytes = archivoFisico.ContentLength,
                        FechaCarga = DateTime.Now
                    };

                    db.DocumentoIngreso.Add(nuevoDocumento);
                    db.SaveChanges();

                    return Ok(nuevoDocumento);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpDelete]
        [Route("Eliminar/{idDocumentoIngreso:int}")]
        public IHttpActionResult EliminarDocumento(int idDocumentoIngreso)
        {
            int? idUsuarioAutenticado = ResolverIdUsuarioDesdePeticion();
            if (!idUsuarioAutenticado.HasValue)
            {
                return Content(HttpStatusCode.Unauthorized, "La sesión ha expirado o el token provisto es inválido.");
            }

            try
            {
                using (FinanzasDBEntities db = new FinanzasDBEntities())
                {
                    // Buscar el documento asegurando que pertenezca al usuario
                    var documento = db.DocumentoIngreso.FirstOrDefault(d =>
                        d.IdDocumentoIngreso == idDocumentoIngreso &&
                        d.IdUsuario == idUsuarioAutenticado.Value);

                    if (documento == null)
                    {
                        return Content(HttpStatusCode.NotFound, "El documento no existe o no tienes permisos para eliminarlo.");
                    }

                    // Eliminar el archivo físico
                    string rutaVirtual = "~" + documento.RutaArchivo;
                    string rutaFisicaCompleta = HttpContext.Current.Server.MapPath(rutaVirtual);

                    if (File.Exists(rutaFisicaCompleta))
                    {
                        File.Delete(rutaFisicaCompleta);
                    }

                    // Eliminar el registro de la BD
                    db.DocumentoIngreso.Remove(documento);
                    db.SaveChanges();

                    return Ok(new { mensaje = "Documento de ingreso eliminado correctamente." });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}