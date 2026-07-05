using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web.Http;
using WebApi; // Asegúrate de que este namespace coincida con tu proyecto

namespace WebApplication.Controllers
{
    [RoutePrefix("api/HistorialGasto")]
    public class HistorialGastoController : ApiController
    {
        private FinanzasDBEntities db = new FinanzasDBEntities();

        // GET: api/HistorialGasto/ByUsuario/20
        [HttpGet]
        [Route("ByUsuario/{idUsuario}")]
        public IHttpActionResult GetByUsuario(int idUsuario)
        {
            try
            {
                var historial = db.HistorialGasto
                                  .Where(x => x.IdUsuario == idUsuario)
                                  .ToList();
                return Ok(historial);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/HistorialGasto (Opcional: Ver todo el historial de la BD)
        [HttpGet]
        public IHttpActionResult Get()
        {
            return Ok(db.HistorialGasto.ToList());
        }
        [HttpGet]
        [Route("ByUsuario/BetweenDates")]
        public IHttpActionResult GetByUsuarioBetweenDates(int idUsuario, DateTime start, DateTime end)
        {
            try
            {
                if (start > end)
                    return BadRequest("La fecha inicial debe ser anterior o igual a la fecha final.");

                var historial = db.HistorialGasto
                                  .Where(x => x.IdUsuario == idUsuario
                                              && DbFunctions.TruncateTime(x.Fecha) >= DbFunctions.TruncateTime(start)
                                              && DbFunctions.TruncateTime(x.FechaDeGuardado) <= DbFunctions.TruncateTime(end))
                                  .ToList();

                return Ok(historial);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        // DELETE: api/HistorialGasto/5
        [HttpDelete]
        public IHttpActionResult Delete(int id)
        {
            var obj = db.HistorialGasto.Find(id);
            if (obj == null) return NotFound();

            db.HistorialGasto.Remove(obj);
            db.SaveChanges();
            return Ok("Registro eliminado");
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}