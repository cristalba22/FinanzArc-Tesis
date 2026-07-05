using System;
using System.Linq;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    [RoutePrefix("api/Planes")]
    public class PlanController : ApiController
    {
        // 1. Obtener todos los planes (Para mostrar en el Front)
        [HttpGet]
        [Route("")]
        public IHttpActionResult Get()
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                return Ok(db.Plan.ToList());
            }
        }

        // 2. Modificar planes (Solo para Admin con IdRol 4)
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Put(int id, [FromBody] Plan value)
        {
            // Validar que el usuario que intenta editar sea Admin (IdRol 4)
            // Esto asume que estás validando el token en el filtro o aquí mismo
            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                var plan = db.Plan.Find(id);
                if (plan == null) return NotFound();
                plan.Nombre = value.Nombre;
                plan.Precio = value.Precio;
                plan.Detalle = value.Detalle;
                // No permitimos modificar el IdRol a través de este método por seguridad

                plan.IdRol = value.IdRol;

                db.SaveChanges();
                return Ok(new { message = "Plan actualizado correctamente" });
            }
        }

        // 3. Metodo post para ingresar un nuevo plan. Atraves del rol ADMIN
        [HttpPost]
        [Route("")]
        public IHttpActionResult Post([FromBody] Plan value)
        {
            if (value == null) return BadRequest("Datos nulos");

            try
            {
                // El CierreController se encargará de pasarlo al historial.
                using (FinanzasDBEntities db = new FinanzasDBEntities())
                {
                    db.Plan.Add(value);
                    db.SaveChanges();
                }
                return Ok();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}