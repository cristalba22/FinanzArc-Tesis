using System;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Text;
using System.Web.Http;
using Microsoft.IdentityModel.Tokens;
using WebApi;

namespace WebApplication.Controllers
{
    [RoutePrefix("api/AdminDashboard")]
    public class AdminDashboardController : ApiController
    {
        [HttpGet]
        [Route("Resumen")]
        public IHttpActionResult Resumen(int? anio = null, int? mes = null, int? idUsuario = null, int? idRol = null, bool? activo = null, string tipoMovimiento = null, string busqueda = null)
        {
            var admin = ObtenerAdminDesdeToken();
            if (admin == null || admin.Rol != 4)
            {
                return Content(HttpStatusCode.Forbidden, new { message = "Acceso exclusivo para administradores." });
            }

            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var usuarios = db.Usuario.ToList();
                var planes = db.Plan.ToList();
                var ingresos = db.Ingreso.ToList();
                var gastos = db.Gasto.ToList();
                var busquedaNormalizada = (busqueda ?? "").Trim().ToLower();

                if (idUsuario.HasValue)
                {
                    usuarios = usuarios.Where(u => u.IdUsuario == idUsuario.Value).ToList();
                    ingresos = ingresos.Where(i => i.IdUsuario == idUsuario.Value).ToList();
                    gastos = gastos.Where(g => g.IdUsuario == idUsuario.Value).ToList();
                }

                if (idRol.HasValue)
                {
                    usuarios = usuarios.Where(u => (u.IdRol ?? 1) == idRol.Value).ToList();
                    var idsUsuariosPlan = usuarios.Select(u => u.IdUsuario).ToList();
                    ingresos = ingresos.Where(i => idsUsuariosPlan.Contains(i.IdUsuario)).ToList();
                    gastos = gastos.Where(g => idsUsuariosPlan.Contains(g.IdUsuario)).ToList();
                }

                if (activo.HasValue)
                {
                    usuarios = usuarios.Where(u => u.Activo == activo.Value).ToList();
                    var idsUsuariosEstado = usuarios.Select(u => u.IdUsuario).ToList();
                    ingresos = ingresos.Where(i => idsUsuariosEstado.Contains(i.IdUsuario)).ToList();
                    gastos = gastos.Where(g => idsUsuariosEstado.Contains(g.IdUsuario)).ToList();
                }

                if (!string.IsNullOrEmpty(busquedaNormalizada))
                {
                    usuarios = usuarios
                        .Where(u =>
                            ((u.Nombre ?? "") + " " + (u.Apellido ?? "")).ToLower().Contains(busquedaNormalizada) ||
                            (u.NombreUsuario ?? "").ToLower().Contains(busquedaNormalizada) ||
                            (u.Email ?? "").ToLower().Contains(busquedaNormalizada))
                        .ToList();

                    var idsUsuariosBusqueda = usuarios.Select(u => u.IdUsuario).ToList();
                    ingresos = ingresos.Where(i => idsUsuariosBusqueda.Contains(i.IdUsuario) || (i.Descripcion ?? "").ToLower().Contains(busquedaNormalizada)).ToList();
                    gastos = gastos.Where(g => idsUsuariosBusqueda.Contains(g.IdUsuario) || (g.Descripcion ?? "").ToLower().Contains(busquedaNormalizada)).ToList();
                }

                if (anio.HasValue)
                {
                    ingresos = ingresos.Where(i => i.FechaIngreso.Year == anio.Value).ToList();
                    gastos = gastos.Where(g => g.FechaGasto.Year == anio.Value).ToList();
                }

                if (mes.HasValue)
                {
                    ingresos = ingresos.Where(i => i.FechaIngreso.Month == mes.Value).ToList();
                    gastos = gastos.Where(g => g.FechaGasto.Month == mes.Value).ToList();
                }

                var tipo = (tipoMovimiento ?? "todos").Trim().ToLower();
                if (tipo == "ingreso")
                {
                    gastos = new System.Collections.Generic.List<Gasto>();
                }
                else if (tipo == "gasto")
                {
                    ingresos = new System.Collections.Generic.List<Ingreso>();
                }

                var planesMensualesPorRol = planes
                    .Where(p => p.IdRol.HasValue && p.IdTipoSuscripcion == 1)
                    .GroupBy(p => p.IdRol.Value)
                    .ToDictionary(g => g.Key, g => g.OrderBy(p => p.Precio ?? 0).First());

                var usuariosPorPlan = usuarios
                    .GroupBy(u => u.IdRol ?? 1)
                    .Select(g =>
                    {
                        Plan plan = null;
                        planesMensualesPorRol.TryGetValue(g.Key, out plan);

                        return new
                        {
                            IdRol = g.Key,
                            Plan = plan != null ? plan.Nombre : (g.Key == 4 ? "Administrador" : "Sin plan"),
                            Usuarios = g.Count(),
                            PrecioMensual = plan != null ? (plan.Precio ?? 0) : 0,
                            IngresoEstimado = g.Count() * (plan != null ? (plan.Precio ?? 0) : 0)
                        };
                    })
                    .OrderBy(x => x.IdRol)
                    .ToList();

                var totalUsuarios = usuarios.Count;
                var usuariosActivos = usuarios.Count(u => u.Activo);
                var usuariosPago = usuarios.Count(u => (u.IdRol ?? 1) > 1 && (u.IdRol ?? 1) < 4);
                var usuariosGratis = usuarios.Count(u => (u.IdRol ?? 1) == 1);
                var mrrEstimado = usuariosPorPlan.Sum(p => p.IngresoEstimado);
                var ticketPromedio = usuariosPago > 0 ? mrrEstimado / usuariosPago : 0;
                var conversionPago = totalUsuarios > 0 ? Math.Round((decimal)usuariosPago * 100 / totalUsuarios, 2) : 0;
                var activosPorcentaje = totalUsuarios > 0 ? Math.Round((decimal)usuariosActivos * 100 / totalUsuarios, 2) : 0;
                var ingresosUsuarios = ingresos.Sum(i => i.MontoIngreso);
                var gastosUsuarios = gastos.Sum(g => g.MontoGasto);

                var fechaDesde = DateTime.Today.AddMonths(-5);
                var altasPorMes = usuarios
                    .Where(u => u.FechaAlta >= fechaDesde)
                    .GroupBy(u => new { u.FechaAlta.Year, u.FechaAlta.Month })
                    .Select(g => new
                    {
                        Mes = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yy"),
                        Usuarios = g.Count()
                    })
                    .OrderBy(x => x.Mes)
                    .ToList();

                var actividadPorUsuario = usuarios
                    .Select(u => new
                    {
                        u.IdUsuario,
                        Nombre = ((u.Nombre ?? "") + " " + (u.Apellido ?? "")).Trim(),
                        u.NombreUsuario,
                        u.Email,
                        Plan = ObtenerNombrePlan(u.IdRol ?? 1, planesMensualesPorRol),
                        Ingresos = ingresos.Count(i => i.IdUsuario == u.IdUsuario),
                        Gastos = gastos.Count(g => g.IdUsuario == u.IdUsuario),
                        TotalIngresos = ingresos.Where(i => i.IdUsuario == u.IdUsuario).Sum(i => (decimal?)i.MontoIngreso) ?? 0,
                        TotalGastos = gastos.Where(g => g.IdUsuario == u.IdUsuario).Sum(g => (decimal?)g.MontoGasto) ?? 0,
                        u.FechaAlta,
                        u.Activo
                    })
                    .OrderByDescending(u => u.FechaAlta)
                    .Take(20)
                    .ToList();

                var movimientos = ingresos
                    .Select(i => new
                    {
                        Id = i.IdIngreso,
                        Tipo = "Ingreso",
                        i.IdUsuario,
                        Usuario = ObtenerNombreUsuario(i.IdUsuario, usuarios),
                        Descripcion = i.Descripcion,
                        Monto = i.MontoIngreso,
                        Fecha = i.FechaIngreso,
                        i.IdDivisa
                    })
                    .Concat(gastos.Select(g => new
                    {
                        Id = g.IdGasto,
                        Tipo = "Gasto",
                        g.IdUsuario,
                        Usuario = ObtenerNombreUsuario(g.IdUsuario, usuarios),
                        Descripcion = g.Descripcion,
                        Monto = g.MontoGasto,
                        Fecha = g.FechaGasto,
                        g.IdDivisa
                    }))
                    .OrderByDescending(m => m.Fecha)
                    .Take(80)
                    .ToList();

                var resumen = new
                {
                    TotalUsuarios = totalUsuarios,
                    UsuariosActivos = usuariosActivos,
                    UsuariosGratis = usuariosGratis,
                    UsuariosPago = usuariosPago,
                    ConversionPago = conversionPago,
                    ActivosPorcentaje = activosPorcentaje,
                    MrrEstimado = mrrEstimado,
                    TicketPromedio = ticketPromedio,
                    IngresosRegistradosUsuarios = ingresosUsuarios,
                    GastosRegistradosUsuarios = gastosUsuarios,
                    MovimientosTotales = ingresos.Count + gastos.Count,
                    UsuariosPorPlan = usuariosPorPlan,
                    AltasPorMes = altasPorMes,
                    ActividadPorUsuario = actividadPorUsuario,
                    Movimientos = movimientos,
                    PlanesDisponibles = planes
                        .Where(p => p.IdRol.HasValue && p.IdTipoSuscripcion == 1)
                        .GroupBy(p => p.IdRol.Value)
                        .Select(g => g.OrderBy(p => p.Precio ?? 0).First())
                        .OrderBy(p => p.IdRol)
                        .Select(p => new { p.IdRol, p.Nombre, p.Precio })
                        .ToList(),
                    Filtros = new { anio, mes, idUsuario, idRol, activo, tipoMovimiento = tipo, busqueda }
                };

                return Ok(resumen);
            }
        }

        [HttpPut]
        [Route("Usuarios/{id:int}/Estado")]
        public IHttpActionResult CambiarEstadoUsuario(int id, [FromBody] CambiarEstadoUsuarioRequest request)
        {
            var admin = ObtenerAdminDesdeToken();
            if (admin == null || admin.Rol != 4)
                return Content(HttpStatusCode.Forbidden, new { message = "Acceso exclusivo para administradores." });

            if (request == null)
                return BadRequest("Debe indicar el estado del usuario.");

            if (admin.IdUsuario == id && request.Activo == false)
                return BadRequest("No podes dar de baja tu propio usuario administrador.");

            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var usuario = db.Usuario.Find(id);
                if (usuario == null) return NotFound();

                usuario.Activo = request.Activo;
                db.SaveChanges();

                return Ok(new { message = request.Activo ? "Usuario reactivado correctamente." : "Usuario dado de baja correctamente." });
            }
        }

        [HttpPut]
        [Route("Usuarios/{id:int}/Rol")]
        public IHttpActionResult CambiarRolUsuario(int id, [FromBody] CambiarRolUsuarioRequest request)
        {
            var admin = ObtenerAdminDesdeToken();
            if (admin == null || admin.Rol != 4)
                return Content(HttpStatusCode.Forbidden, new { message = "Acceso exclusivo para administradores." });

            if (request == null || request.IdRol <= 0)
                return BadRequest("Debe indicar un rol valido.");

            if (admin.IdUsuario == id && request.IdRol != 4)
                return BadRequest("No podes quitarte el rol administrador desde este panel.");

            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var usuario = db.Usuario.Find(id);
                if (usuario == null) return NotFound();

                usuario.IdRol = request.IdRol;
                db.SaveChanges();

                return Ok(new { message = "Plan/Rol actualizado correctamente." });
            }
        }

        [HttpPut]
        [Route("Movimientos/Ingreso/{id:int}")]
        public IHttpActionResult EditarIngreso(int id, [FromBody] MovimientoAdminRequest request)
        {
            var admin = ObtenerAdminDesdeToken();
            if (admin == null || admin.Rol != 4)
                return Content(HttpStatusCode.Forbidden, new { message = "Acceso exclusivo para administradores." });

            if (request == null || request.Monto <= 0)
                return BadRequest("Datos del ingreso invalidos.");

            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var ingreso = db.Ingreso.Find(id);
                if (ingreso == null) return NotFound();

                ingreso.Descripcion = request.Descripcion;
                ingreso.MontoIngreso = request.Monto;
                ingreso.FechaIngreso = request.Fecha;
                ingreso.IdDivisa = request.IdDivisa <= 0 ? ingreso.IdDivisa : request.IdDivisa;

                db.SaveChanges();
                return Ok(new { message = "Ingreso actualizado correctamente." });
            }
        }

        [HttpPut]
        [Route("Movimientos/Gasto/{id:int}")]
        public IHttpActionResult EditarGasto(int id, [FromBody] MovimientoAdminRequest request)
        {
            var admin = ObtenerAdminDesdeToken();
            if (admin == null || admin.Rol != 4)
                return Content(HttpStatusCode.Forbidden, new { message = "Acceso exclusivo para administradores." });

            if (request == null || request.Monto <= 0)
                return BadRequest("Datos del gasto invalidos.");

            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var gasto = db.Gasto.Find(id);
                if (gasto == null) return NotFound();

                gasto.Descripcion = request.Descripcion;
                gasto.MontoGasto = request.Monto;
                gasto.FechaGasto = request.Fecha;
                gasto.IdDivisa = request.IdDivisa <= 0 ? gasto.IdDivisa : request.IdDivisa;

                db.SaveChanges();
                return Ok(new { message = "Gasto actualizado correctamente." });
            }
        }

        [HttpDelete]
        [Route("Movimientos/{tipo}/{id:int}")]
        public IHttpActionResult EliminarMovimiento(string tipo, int id)
        {
            var admin = ObtenerAdminDesdeToken();
            if (admin == null || admin.Rol != 4)
                return Content(HttpStatusCode.Forbidden, new { message = "Acceso exclusivo para administradores." });

            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var tipoNormalizado = (tipo ?? "").Trim().ToLower();
                if (tipoNormalizado == "ingreso")
                {
                    var ingreso = db.Ingreso.Find(id);
                    if (ingreso == null) return NotFound();

                    db.Ingreso.Remove(ingreso);
                    db.SaveChanges();
                    return Ok(new { message = "Ingreso eliminado correctamente." });
                }

                if (tipoNormalizado == "gasto")
                {
                    var gasto = db.Gasto.Find(id);
                    if (gasto == null) return NotFound();

                    db.Gasto.Remove(gasto);
                    db.SaveChanges();
                    return Ok(new { message = "Gasto eliminado correctamente." });
                }

                return BadRequest("Tipo de movimiento invalido.");
            }
        }

        private string ObtenerNombrePlan(int idRol, System.Collections.Generic.Dictionary<int, Plan> planesPorRol)
        {
            Plan plan = null;
            if (planesPorRol.TryGetValue(idRol, out plan))
            {
                return plan.Nombre;
            }

            return idRol == 4 ? "Administrador" : "Sin plan";
        }

        private string ObtenerNombreUsuario(int idUsuario, System.Collections.Generic.List<Usuario> usuarios)
        {
            var usuario = usuarios.FirstOrDefault(u => u.IdUsuario == idUsuario);
            if (usuario == null) return "Usuario no incluido";

            var nombre = ((usuario.Nombre ?? "") + " " + (usuario.Apellido ?? "")).Trim();
            return string.IsNullOrEmpty(nombre) ? usuario.NombreUsuario : nombre;
        }

        private AdminTokenInfo ObtenerAdminDesdeToken()
        {
            var authHeader = Request.Headers.Authorization;
            if (authHeader == null || string.IsNullOrEmpty(authHeader.Parameter))
            {
                return null;
            }

            try
            {
                var handler = new JwtSecurityTokenHandler();
                var secretKey = ConfigurationManager.AppSettings["JwtSecret"];
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
                SecurityToken validatedToken;

                var principal = handler.ValidateToken(authHeader.Parameter, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateIssuer = true,
                    ValidIssuer = "tu_api_finanzas",
                    ValidateAudience = true,
                    ValidAudience = "tu_front_end",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(5)
                }, out validatedToken);

                var rolClaim = principal.Claims.FirstOrDefault(c => c.Type == "rol")?.Value;
                var idClaim = principal.Claims.FirstOrDefault(c => c.Type == "id")?.Value;

                int rol;
                int idUsuario;
                if (int.TryParse(rolClaim, out rol) && int.TryParse(idClaim, out idUsuario))
                {
                    return new AdminTokenInfo { Rol = rol, IdUsuario = idUsuario };
                }
            }
            catch
            {
                return null;
            }

            return null;
        }
    }

    public class AdminTokenInfo
    {
        public int Rol { get; set; }
        public int IdUsuario { get; set; }
    }

    public class CambiarEstadoUsuarioRequest
    {
        public bool Activo { get; set; }
    }

    public class CambiarRolUsuarioRequest
    {
        public int IdRol { get; set; }
    }

    public class MovimientoAdminRequest
    {
        public string Descripcion { get; set; }
        public decimal Monto { get; set; }
        public DateTime Fecha { get; set; }
        public int IdDivisa { get; set; }
    }
}
