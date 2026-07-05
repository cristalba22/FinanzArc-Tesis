using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    [RoutePrefix("api/MetaAhorro")]
    public class MetaAhorroController : ApiController
    {
        private FinanzasDBEntities db = new FinanzasDBEntities();

        // GET: api/MetaAhorro
        [HttpGet]
        [Route("")]
        public IHttpActionResult Get()
        {
            try
            {
                return Ok(db.MetaAhorro.ToList());
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/MetaAhorro/5
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult Get(int id)
        {
            var meta = db.MetaAhorro.Find(id);
            if (meta == null) return NotFound();
            return Ok(meta);
        }
        [HttpGet]
        [Route("ByUsuario/{IdUsuario:int}")]
        public IHttpActionResult GetbyIdUsuario(int IdUsuario)
        {
            try
            {
                var lista = db.MetaAhorro.Where(g => g.IdUsuario == IdUsuario).ToList();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        [HttpPost]
        [Route("")]
        public IHttpActionResult Post([FromBody] MetaAhorro value)
        {
            if (value == null) return BadRequest("Datos nulos");
            if (value.MontoObjetivo < 0 || value.MontoObjetivo > 10000000000)
                return BadRequest("El monto objetivo debe estar entre 0 y 10.000.000.000");

            if (value.MontoGuardado < 0 || value.MontoGuardado > 10000000000)
                return BadRequest("El monto guardado debe estar entre 0 y 10.000.000.000");

            try
            {
                db.MetaAhorro.Add(value);
                db.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/MetaAhorro/5
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Put(int id, [FromBody] MetaAhorro value)
        {
            // VALIDACIÓN BACKEND
            if (value.MontoObjetivo < 0 || value.MontoObjetivo > 10000000000)
                return BadRequest("El monto objetivo debe estar entre 0 y 10.000.000.000");

            var obj = db.MetaAhorro.Find(id);
            if (obj == null) return NotFound();

            try
            {
                obj.Nombre = value.Nombre;
                obj.MontoObjetivo = value.MontoObjetivo;
                obj.MontoGuardado = value.MontoGuardado;
                obj.FechaMeta = value.FechaMeta;
                obj.FechaInicio = value.FechaInicio;
                obj.IdDivisa = value.IdDivisa;

                obj.IdEstadoMetaAhorro = (obj.MontoGuardado >= obj.MontoObjetivo) ? 2 : 0;

                db.SaveChanges();
                return Ok(obj);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/MetaAhorro/5
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Delete(int id)
        {
            var obj = db.MetaAhorro.Find(id);
            if (obj == null) return NotFound();

            try
            {
                db.MetaAhorro.Remove(obj);
                db.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing) db.Dispose();
            base.Dispose(disposing);
        }
    }
}