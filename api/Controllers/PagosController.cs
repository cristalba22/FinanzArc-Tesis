using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Web.Http;
using WebApi;

[RoutePrefix("api/Pagos")]
public class PagosController : ApiController
{
    [HttpPost]
    [Route("CompletarCompra")]
    public IHttpActionResult CompletarCompra([FromBody] CompletarCompraRequest request)
    {
        if (request == null || request.IdPlan <= 0)
            return BadRequest("Debe seleccionar un plan valido.");

        var idUsuario = ObtenerIdUsuarioDesdeToken();
        if (idUsuario == null)
            return Content(HttpStatusCode.Unauthorized, new { message = "Sesion invalida. Volve a iniciar sesion." });

        using (FinanzasDBEntities db = new FinanzasDBEntities())
        {
            var usuario = db.Usuario.Find(idUsuario.Value);
            if (usuario == null) return NotFound();

            var plan = db.Plan.Find(request.IdPlan);
            if (plan == null) return BadRequest("El plan seleccionado no existe.");
            if (plan.IdRol == null) return BadRequest("El plan seleccionado no tiene un rol asignado.");

            usuario.IdRol = plan.IdRol.Value;
            db.Entry(usuario).State = System.Data.Entity.EntityState.Modified;
            db.SaveChanges();

            return Ok(new
            {
                message = "Plan actualizado correctamente",
                nuevoRol = usuario.IdRol,
                plan = plan.Nombre
            });
        }
    }

    private int? ObtenerIdUsuarioDesdeToken()
    {
        var authHeader = Request.Headers.Authorization;
        if (authHeader == null || string.IsNullOrEmpty(authHeader.Parameter))
            return null;

        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(authHeader.Parameter);
            var idClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "id")?.Value;

            if (int.TryParse(idClaim, out int idUsuario))
                return idUsuario;
        }
        catch
        {
            return null;
        }

        return null;
    }
}

public class CompletarCompraRequest
{
    public int IdPlan { get; set; }
    public int? IdTipoSuscripcion { get; set; }
}
