using System;
using System.Linq;
using System.Web.Http;
using System.Web.Http.Cors;
using System.IdentityModel.Tokens.Jwt; // <-- IMPORTANTE: Agregamos esto para leer el JWT
using WebApi;

namespace WebApplication.Controllers
{
    [EnableCors(origins: "http://localhost:5173", headers: "*", methods: "*")]
    public class ComparativaController : ApiController
    {
        [HttpGet]
        [Route("api/comparativa/{periodo}")]
        public IHttpActionResult GetResumen(string periodo)
        {
            DateTime ahoraReal = DateTime.Now;
            DateTime fechaInicioBusqueda;

            // Ajuste de rango para capturar registros con hora 00:00
            if (periodo.ToLower() == "dia")
            {
                fechaInicioBusqueda = ahoraReal.Date;
            }
            else if (periodo.ToLower() == "semana")
            {
                fechaInicioBusqueda = ahoraReal.Date.AddDays(-7);
            }
            else // Mes
            {
                fechaInicioBusqueda = new DateTime(ahoraReal.Year, ahoraReal.Month, 1);
            }

            // --- NUEVA LÓGICA: Extraer idUsuario del JWT ---
            var authHeader = Request.Headers.Authorization;
            if (authHeader == null || string.IsNullOrEmpty(authHeader.Parameter))
                return Unauthorized();

            string tokenRecibido = authHeader.Parameter;
            int idUsuario;

            try
            {
                // Leemos el JWT sin tocar la base de datos
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(tokenRecibido);

                // Buscamos el "claim" llamado "id" que guardamos al hacer login/registro
                var idClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "id")?.Value;

                if (string.IsNullOrEmpty(idClaim) || !int.TryParse(idClaim, out idUsuario))
                {
                    return Unauthorized(); // Token inválido o no tiene el ID
                }
            }
            catch (Exception)
            {
                return Unauthorized(); // Si ocurre un error al leer el token (ej. token malformado)
            }
            // ------------------------------------------------

            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                // Usamos la variable idUsuario que sacamos del token
                var totalIngresos = db.HistorialIngreso
                    .Where(i => i.IdUsuario == idUsuario
                             && i.Fecha >= fechaInicioBusqueda
                             && i.Fecha <= ahoraReal)
                    .Select(i => (decimal?)i.Monto)
                    .DefaultIfEmpty(0)
                    .Sum();

                var totalGastos = db.HistorialGasto
                    .Where(g => g.IdUsuario == idUsuario
                             && g.Fecha >= fechaInicioBusqueda
                             && g.Fecha <= ahoraReal)
                    .Select(g => (decimal?)g.Monto)
                    .DefaultIfEmpty(0)
                    .Sum();

                return Ok(new
                {
                    totalIngresos = totalIngresos,
                    totalGastos = totalGastos,
                    balance = totalIngresos - totalGastos
                });
            }
        }
    }
}