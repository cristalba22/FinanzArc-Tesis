using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    [RoutePrefix("api/Ingreso")]
    public class IngresoController : ApiController
    {
        private FinanzasDBEntities db = new FinanzasDBEntities();

        // GET: api/Ingreso/ByUsuario/20
        [HttpGet]
        [Route("ByUsuario/{IdUsuario:int}")]
        public IHttpActionResult GetbyIdUsuario(int IdUsuario)
        {
            try
            {
                var lista = db.Ingreso.Where(g => g.IdUsuario == IdUsuario).ToList();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/Ingreso
        [HttpPost]
        [Route("")]
        public IHttpActionResult Post([FromBody] Ingreso value)
        {
            if (value == null) return BadRequest("Datos nulos");

            // VALIDACIÓN BACKEND
            if (value.MontoIngreso < 0 || value.MontoIngreso > 1000000000)
                return BadRequest("El monto debe estar entre 0 y 1.000.000.000");

            try
            {
                if (value.FechaIngreso == DateTime.MinValue)
                    value.FechaIngreso = DateTime.Now;

                db.Ingreso.Add(value);
                db.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Ingreso/5
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Put(int id, [FromBody] Ingreso value) // Cambiado a IHttpActionResult
        {
            // VALIDACIÓN BACKEND
            if (value.MontoIngreso < 0 || value.MontoIngreso > 1000000000)
                return BadRequest("El monto debe estar entre 0 y 1.000.000.000");

            var obj = db.Ingreso.Find(id);
            if (obj == null) return NotFound();

            try
            {
                obj.IdUsuario = value.IdUsuario;
                obj.IdTipoIngreso = value.IdTipoIngreso;
                obj.IdDivisa = value.IdDivisa;
                obj.MontoIngreso = value.MontoIngreso;
                obj.FechaIngreso = value.FechaIngreso;
                obj.Descripcion = value.Descripcion;

                db.Entry(obj).State = System.Data.Entity.EntityState.Modified;
                db.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/Ingreso/5
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Delete(int id)
        {
            var obj = db.Ingreso.Find(id);
            if (obj == null) return NotFound();

            db.Ingreso.Remove(obj);
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