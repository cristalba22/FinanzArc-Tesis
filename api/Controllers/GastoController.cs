using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    [RoutePrefix("api/Gasto")]
    public class GastoController : ApiController
    {
        private FinanzasDBEntities db = new FinanzasDBEntities();

        // GET: api/Gasto/ByUsuario/20
        [HttpGet]
        [Route("ByUsuario/{IdUsuario:int}")]
        public IHttpActionResult GetbyIdUsuario(int IdUsuario)
        {
            try
            {
                var lista = db.Gasto.Where(g => g.IdUsuario == IdUsuario).ToList();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/Gasto
        [HttpPost]
        [Route("")]
        public IHttpActionResult Post([FromBody] Gasto value)
        {
            if (value == null) return BadRequest("Datos nulos");

            // VALIDACIÓN BACKEND
            if (value.MontoGasto < 0 || value.MontoGasto > 1000000000)
                return BadRequest("El monto debe estar entre 0 y 1.000.000.000");

            try
            {
                if (value.FechaGasto == DateTime.MinValue)
                    value.FechaGasto = DateTime.Now;

                db.Gasto.Add(value);
                db.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Gasto/5
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Put(int id, [FromBody] Gasto value) // Cambiado de void a IHttpActionResult
        {
            // VALIDACIÓN BACKEND
            if (value.MontoGasto < 0 || value.MontoGasto > 1000000000)
                return BadRequest("El monto debe estar entre 0 y 1.000.000.000");

            // Usamos el 'db' de la clase, no uno nuevo
            var obj = db.Gasto.Find(id);
            if (obj == null) return NotFound();

            try
            {
                obj.IdUsuario = value.IdUsuario;
                obj.IdCategoria = value.IdCategoria;
                obj.IdModoPago = value.IdModoPago;
                obj.IdDivisa = value.IdDivisa;
                obj.MontoGasto = value.MontoGasto;
                obj.Descripcion = value.Descripcion;
                obj.FechaGasto = value.FechaGasto;

                db.Entry(obj).State = System.Data.Entity.EntityState.Modified;
                db.SaveChanges();
                return Ok(); // Retornamos OK para que el frontend sepa que funcionó
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        // DELETE: api/Gasto/5
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Delete(int id)
        {
            var obj = db.Gasto.Find(id);
            if (obj == null) return NotFound();

            db.Gasto.Remove(obj);
            db.SaveChanges();
            return Ok();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing) db.Dispose();
            base.Dispose(disposing);
        }
    }
}